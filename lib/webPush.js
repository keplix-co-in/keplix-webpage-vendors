'use client';

import { authAPI } from '@/api/auth';

/**
 * Background alerts: real Web Push, delivered by the browser vendor's push
 * service to /sw.js even when no portal tab (or the whole browser) is open.
 *
 * Needs the backend's /accounts/auth/web-push routes and a VAPID key pair; until
 * those are deployed, enableWebPush() reports the failure and the rest of the
 * alert options keep working.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const SW_URL = '/sw.js';

export const isWebPushSupported = () =>
  typeof window !== 'undefined' &&
  Boolean(VAPID_PUBLIC_KEY) &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

// applicationServerKey must be a Uint8Array, not the base64url string.
const urlBase64ToUint8Array = (base64) => {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const getRegistration = async () => {
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  return existing ?? navigator.serviceWorker.register(SW_URL);
};

/** Whether this browser currently holds a push subscription for the portal. */
export async function isWebPushOn() {
  if (!isWebPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    return Boolean(reg && (await reg.pushManager.getSubscription()));
  } catch {
    return false;
  }
}

/** @returns {Promise<{ok: boolean, error?: string}>} */
export async function enableWebPush() {
  if (!isWebPushSupported()) {
    return { ok: false, error: 'This browser does not support background alerts.' };
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, error: 'Notifications are blocked. Allow them in your browser settings.' };
    }

    const reg = await getRegistration();
    await navigator.serviceWorker.ready;

    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    // Sent even when the browser already had a subscription: the backend upserts
    // by endpoint, which re-attaches it to whoever is signed in now.
    const result = await authAPI.registerWebPush(subscription.toJSON());
    if (!result?.success) {
      return { ok: false, error: result?.error || 'Could not turn on background alerts.' };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || 'Could not turn on background alerts.' };
  }
}

/**
 * Removes the subscription from this browser and, best effort, from the backend.
 * Called on logout while the token is still valid, so the next person to use
 * this browser does not receive the previous vendor's booking alerts.
 */
export async function disableWebPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    const subscription = reg ? await reg.pushManager.getSubscription() : null;
    if (!subscription) return;
    await authAPI.unregisterWebPush(subscription.endpoint).catch(() => {});
    await subscription.unsubscribe();
  } catch {
    // Nothing more to do — the backend prunes dead endpoints when a push 404s.
  }
}
