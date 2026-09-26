'use client';

import { io } from 'socket.io-client';
import { API_BASE_URL } from './apiConfig';
import { tokenStore } from './tokenStore';
import { stopAlertBeep } from './alertSound';

/**
 * One socket per tab, shared by the shell (vendor events) and the chat screen
 * (conversation rooms). Opening a second connection would double the vendor's
 * presence on a backend that deliberately runs as a single instance.
 *
 * The handshake sends the access token; the backend requires a token of type
 * `access` belonging to an active user.
 */
let socket = null;
let refCount = 0;
// One retry per auth failure, so a handshake that raced a token refresh gets a
// second chance without turning a genuinely dead session into a reconnect loop.
let authRetryTimer = null;
let authRetryUsed = false;

const clearAuthRetry = () => {
  if (authRetryTimer) {
    clearTimeout(authRetryTimer);
    authRetryTimer = null;
  }
};

export const acquireSocket = () => {
  const token = tokenStore.getAccessToken();
  if (!token) return null;

  if (!socket) {
    socket = io(API_BASE_URL, {
      // WHY a callback, not `auth: { token }`: the object form is snapshotted
      // once at construction, so after the API layer refreshes the access token
      // every later reconnect kept replaying the stale (now rejected) one. The
      // callback is invoked per handshake, so each (re)connect reads the
      // current token out of tokenStore.
      auth: (cb) => cb({ token: tokenStore.getAccessToken() }),
      transports: ['websocket', 'polling'],
    });

    // WHY: socket.io treats a middleware rejection as fatal and stops its own
    // reconnection, so a handshake that lost the race with a token refresh
    // would leave realtime permanently dead. Retry exactly once, after a short
    // delay that lets the refresh land; the callback above then picks up the
    // new token. A session that is really gone fails the retry and stays down.
    socket.on('connect_error', (err) => {
      if (!err?.message?.includes('Authentication required')) return;
      if (authRetryUsed || !socket) return;
      if (!tokenStore.getAccessToken()) return;

      authRetryUsed = true;
      clearAuthRetry();
      authRetryTimer = setTimeout(() => {
        authRetryTimer = null;
        if (socket && !socket.connected) socket.connect();
      }, 1500);
    });

    // WHY: reset the one-shot budget only once a handshake has actually
    // succeeded, so a later refresh gets its own retry.
    socket.on('connect', () => {
      authRetryUsed = false;
      clearAuthRetry();
    });
  }
  refCount += 1;
  return socket;
};

export const releaseSocket = () => {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    clearAuthRetry();
    authRetryUsed = false;
    socket.disconnect();
    socket = null;
  }
};

/**
 * Tear the connection down regardless of refCount, for logout and session
 * expiry.
 *
 * WHY: releaseSocket() only closes at refCount 0, and on logout the shell's
 * useVendorSocket effect is still mounted while the redirect happens — so the
 * socket stayed connected and authenticated as the signed-out vendor, still
 * receiving that vendor's room events. Clearing `socket` also means the next
 * sign-in builds a fresh connection rather than reusing this one.
 */
export const closeSocket = () => {
  // A ringing beep must not outlive the session that triggered it.
  stopAlertBeep();
  clearAuthRetry();
  authRetryUsed = false;
  refCount = 0;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
