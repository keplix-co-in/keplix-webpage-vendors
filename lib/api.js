/**
 * Web port of keplix-frontend/services/api.js.
 *
 * Deliberately keeps the mobile app's response convention: interceptors resolve
 * to `{ success, data, status }` or `{ success, error, status, details }` and
 * only reject on 429. Every ported screen reads results that way, and having
 * the web client reject instead would mean rewriting the error handling in each
 * one — a much larger surface to get wrong than this one oddity.
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

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await axios.post(`${API_BASE_URL}/accounts/auth/token/refresh/`, {
      refresh: refreshToken,
    });

    const { access, refresh } = response.data;
    if (!access) throw new Error('No access token in refresh response');

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

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'];
      error.message = retryAfter
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please try again in a few minutes.';
      error.isRateLimited = true;
      return Promise.reject(error);
    }

    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint = CREDENTIAL_PATHS.some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const access = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        tokenStore.clearAll();
        notifySessionExpired();
        return {
          success: false,
          error: 'Session expired. Please login again.',
          status: 401,
          requiresLogin: true,
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
export const uploadWithFetch = async (method, endpoint, formData) => {
  const token = tokenStore.getAccessToken();
  if (!token) throw new Error('No authentication token available');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
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

export default api;
