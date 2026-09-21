/**
 * Web port of keplix-frontend/services/api.js.
 *
 * Deliberately keeps the mobile app's response convention: interceptors resolve
 * to `{ success, data, status }` or `{ success, error, status, details }`. Every
 * ported screen reads results that way, and having the web client reject
 * instead would mean rewriting the error handling in each one — a much larger
 * surface to get wrong.
 *
 * This client never rejects: 429 used to be the one exception and no caller
 * caught it, so rate limits became unhandled rejections. Check `status` /
 * `isRateLimited` on the result instead of writing a try/catch.
 */

import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import { tokenStore } from './tokenStore';
import { notifySessionExpired } from './sessionExpiry';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // matches mobile; uploads go through uploadWithFetch below
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Let the browser set multipart/form-data with its own boundary.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Shared in-flight refresh so concurrent 401s trigger one refresh call instead
// of racing each other. The backend rotates refresh tokens and blacklists the
// presented one, so parallel refreshes invalidate each other's tokens.
let refreshPromise = null;

// `sessionDead` distinguishes "the refresh token is rejected" from "the refresh
// call itself could not complete". Only the former should end the session.
const makeRefreshError = (message, sessionDead, cause) => {
  const err = new Error(message || 'Token refresh failed');
  err.sessionDead = sessionDead;
  err.cause = cause;
  return err;
};

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) throw makeRefreshError('No refresh token', true);

    let response;
    try {
      response = await axios.post(`${API_BASE_URL}/accounts/auth/token/refresh/`, {
        refresh: refreshToken,
      });
    } catch (err) {
      // Only a 400/401 from the refresh endpoint means the refresh token is
      // actually dead (expired, rotated, or blacklisted). A network blip or a
      // 5xx says nothing about the session — logging the vendor out there
      // discards a still-valid token and loses in-progress form data, so the
      // caller must be able to tell the two cases apart.
      const status = err.response?.status;
      throw makeRefreshError(err.message, status === 400 || status === 401, err);
    }

    const { access, refresh } = response.data;
    // A 200 with no access token is a broken contract, not an expired session.
    if (!access) throw makeRefreshError('No access token in refresh response', false);

    tokenStore.setAccessToken(access);
    // The backend issues a new refresh token on every refresh and treats reuse
    // of the old one as theft, so this must be saved or the next refresh fails.
    if (refresh) tokenStore.setRefreshToken(refresh);
    return access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

// A 401 on these has nothing to refresh — retrying would loop against the
// backend with no session. Kept in sync with the mobile list.
const CREDENTIAL_PATHS = [
  '/accounts/auth/login',
  '/accounts/auth/signup',
  '/accounts/auth/register-vendor',
  '/accounts/auth/google',
  '/accounts/auth/token/refresh',
  '/accounts/auth/forgot-password',
  '/accounts/auth/reset-password',
  '/accounts/auth/reset-password-otp',
  '/accounts/auth/send-phone-otp',
  '/accounts/auth/verify-phone-otp',
  '/accounts/auth/send-email-otp',
  '/accounts/auth/verify-email-otp',
  '/accounts/auth/send-password-reset-otp',
];

api.interceptors.response.use(
  (response) => ({ success: true, data: response.data, status: response.status }),
  async (error) => {
    const originalRequest = error.config;

    // 429 used to be the single rejecting status, which meant every caller had
    // to wrap an otherwise resolve-only client in try/catch just for rate
    // limits — and none of them did, so a 429 surfaced as an unhandled
    // rejection instead of a message. Resolved as the standard envelope now;
    // `isRateLimited` is kept on the result for callers that want to back off.
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'];
      return {
        success: false,
        error: retryAfter
          ? `Too many requests. Please try again in ${retryAfter} seconds.`
          : 'Too many requests. Please try again in a few minutes.',
        status: 429,
        isRateLimited: true,
        details: error.response?.data,
      };
    }

    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint = CREDENTIAL_PATHS.some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const access = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (refreshError?.sessionDead) {
          tokenStore.clearAll();
          notifySessionExpired();
          return {
            success: false,
            error: 'Session expired. Please login again.',
            status: 401,
            requiresLogin: true,
          };
        }

        // Refresh could not be completed (offline, DNS, 5xx). Keep the tokens
        // so the next attempt can succeed and report it as a transient error.
        const refreshStatus = refreshError?.cause?.response?.status;
        if (refreshStatus >= 500) {
          return {
            success: false,
            error: 'Something went wrong on our side. Please try again in a moment.',
            status: refreshStatus,
            details: refreshError?.cause?.response?.data,
          };
        }
        return {
          success: false,
          error: 'Network error. Please check your connection.',
          status: 0,
        };
      }
    }

    if (!error.response) {
      return { success: false, error: 'Network error. Please check your connection.', status: 0 };
    }

    const status = error.response?.status;

    // A 5xx is a fault on our side, and its message is written for a developer:
    // a signup once surfaced a raw "prisma.user.findUnique() ... column does not
    // exist" straight into the password field. Vendors get a generic line; the
    // detail stays in `details` for debugging.
    if (status >= 500) {
      return {
        success: false,
        error: 'Something went wrong on our side. Please try again in a moment.',
        status,
        details: error.response?.data,
      };
    }

    let errorMessage = error.message;
    const data = error.response?.data;
    if (data) {
      if (typeof data === 'string') errorMessage = data;
      else if (data.detail) errorMessage = data.detail;
      else if (data.error) errorMessage = data.error;
      else if (data.message) errorMessage = data.message;
      else {
        const fieldErrors = Object.keys(data)
          .filter((key) => Array.isArray(data[key]) || typeof data[key] === 'string')
          .map((key) => `${key}: ${Array.isArray(data[key]) ? data[key][0] : data[key]}`)
          .join(', ');
        if (fieldErrors) errorMessage = fieldErrors;
      }
    }

    return {
      success: false,
      error: errorMessage || 'An error occurred',
      status,
      details: error.response?.data,
    };
  }
);

/**
 * Multipart uploads go through fetch, as they do on mobile, and carry the
 * backend's machine-readable `code` on failure — HEALTH_SHEET_REQUIRED is a
 * rejection the vendor can actually act on, so it must stay distinguishable
 * from a generic error.
 */
const sendUpload = async (method, endpoint, formData, token) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: formData,
      signal: controller.signal,
    });

    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }

    if (!response.ok) {
      return {
        success: false,
        error: payload?.message || payload?.error || `HTTP ${response.status}`,
        code: payload?.code,
        status: response.status,
        details: payload,
      };
    }

    return { success: true, data: payload, status: response.status };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Upload timed out — try again with smaller files.', status: 0 };
    }
    return { success: false, error: `Network error: ${err.message}`, status: 0 };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const uploadWithFetch = async (method, endpoint, formData) => {
  // This path used to throw on a missing token and return an envelope for every
  // other outcome, so a vendor whose access token had merely expired mid-upload
  // hit an uncaught exception instead of the usual error handling. It now
  // mirrors the axios interceptor: one refresh attempt through the *shared*
  // in-flight promise (so a concurrent 401 elsewhere doesn't rotate the refresh
  // token out from under us), one retry, then the standard envelope.
  let token = tokenStore.getAccessToken();
  let result = token
    ? await sendUpload(method, endpoint, formData, token)
    : { success: false, error: 'Unauthorized', status: 401 };

  if (result.status !== 401) return result;

  try {
    token = await refreshAccessToken();
  } catch (refreshError) {
    if (refreshError?.sessionDead) {
      tokenStore.clearAll();
      notifySessionExpired();
      return {
        success: false,
        error: 'Session expired. Please login again.',
        status: 401,
        requiresLogin: true,
        details: result.details,
      };
    }
    // Transient refresh failure: keep the session, report the original 401.
    return {
      success: false,
      error: 'Network error. Please check your connection.',
      status: 0,
      details: result.details,
    };
  }

  // FormData is re-sent as-is: the browser streams it fresh on each fetch, so
  // a single retry does not need the caller to rebuild the body.
  return sendUpload(method, endpoint, formData, token);
};

export default api;
