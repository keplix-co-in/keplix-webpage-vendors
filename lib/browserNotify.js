'use client';

/**
 * Desktop notifications for a portal tab that is open but not in front.
 *
 * Only used while the tab is hidden: a visible tab already shows the toast, and
 * doubling up would be noise. Permission is asked for from a click on the
 * alerts control, never on page load — browsers penalise (and users dislike)
 * unprompted permission requests.
 */

const PREF_KEY = 'keplix_vendor_browser_alerts';

export const isBrowserNotifySupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export const notifyPermission = () =>
  isBrowserNotifySupported() ? Notification.permission : 'unsupported';

export const isBrowserNotifyEnabled = () => {
  if (notifyPermission() !== 'granted') return false;
  try {
    return window.localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
};

const savePref = (on) => {
  try {
    if (on) window.localStorage.setItem(PREF_KEY, '1');
    else window.localStorage.removeItem(PREF_KEY);
  } catch {
    // Storage unavailable — the choice just will not survive a reload.
  }
};

/** Turns the setting on (asking permission if needed) or off. Returns the new state. */
export async function setBrowserNotifyEnabled(on) {
  if (!on) {
    savePref(false);
    return false;
  }
  if (!isBrowserNotifySupported()) return false;

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = 'denied';
    }
  }
  const granted = permission === 'granted';
  savePref(granted);
  return granted;
}

/**
 * Shows a notification if the vendor enabled them and the tab is hidden.
 * `tag` makes a repeat replace the earlier one (with `renotify`, so it still
 * alerts) rather than stacking. Clicking focuses the portal and opens `url`.
 */
export function showBrowserNotification({ title, body, tag, url = '/bookings', urgent = false }) {
  if (!isBrowserNotifyEnabled()) return null;
  if (typeof document !== 'undefined' && !document.hidden) return null;

  try {
    const n = new Notification(title, {
      body,
      tag,
      renotify: Boolean(tag),
      requireInteraction: urgent,
      icon: '/icon.png',
    });
    n.onclick = () => {
      window.focus();
      if (window.location.pathname + window.location.search !== url) window.location.assign(url);
      n.close();
    };
    return n;
  } catch {
    return null;
  }
}
