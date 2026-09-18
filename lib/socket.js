'use client';

import { io } from 'socket.io-client';
import { API_BASE_URL } from './apiConfig';
import { tokenStore } from './tokenStore';

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

export const acquireSocket = () => {
  const token = tokenStore.getAccessToken();
  if (!token) return null;

  if (!socket) {
    socket = io(API_BASE_URL, { auth: { token }, transports: ['websocket', 'polling'] });
  }
  refCount += 1;
  return socket;
};

export const releaseSocket = () => {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
};
