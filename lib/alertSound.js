'use client';

/**
 * The new-booking alert beep for the portal, mirroring the mobile app's
 * services/alertSound.js.
 *
 * One module-scoped element, so there is at most ONE beep playing and
 * stopAlertBeep() can always reach it — a second request restarts the sound
 * instead of layering a second copy over the first, and accepting or declining
 * can silence it. It never throws: an alert sound must not be able to break the
 * screen that triggered it.
 *
 * Browsers refuse to autoplay audio until the visitor has interacted with the
 * page, so the vendor turns sound on with a click (see AlertSettings). That
 * click is what allows every later play() in the same tab.
 */

const SRC = '/assets/alert_beep.mp3';
const PREF_KEY = 'keplix_vendor_sound';
// The mobile beep is ~15 s; cap it here too so a stuck element can never ring on.
const MAX_MS = 15000;

let audio = null;
let capTimer = null;

export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
};

export const setSoundEnabled = (on) => {
  if (typeof window === 'undefined') return;
  try {
    if (on) window.localStorage.setItem(PREF_KEY, '1');
    else window.localStorage.removeItem(PREF_KEY);
  } catch {
    // Storage unavailable — the choice just will not survive a reload.
  }
  if (!on) stopAlertBeep();
};

/** Stops the beep immediately. Safe to call at any time. */
export function stopAlertBeep() {
  if (capTimer) {
    clearTimeout(capTimer);
    capTimer = null;
  }
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // Element already released; nothing to recover.
  }
}

/**
 * Starts the beep, replacing any beep already playing.
 * `force` plays even when the vendor's sound switch is off — used only for the
 * test beep right after they turn it on.
 *
 * @returns {Promise<boolean>} whether playback actually started.
 */
export async function playAlertBeep({ force = false } = {}) {
  if (typeof window === 'undefined') return false;
  if (!force && !isSoundEnabled()) return false;

  try {
    stopAlertBeep();
    if (!audio) {
      audio = new Audio(SRC);
      audio.preload = 'auto';
    }
    audio.volume = 1;
    await audio.play();
    capTimer = setTimeout(stopAlertBeep, MAX_MS);
    return true;
  } catch (error) {
    // NotAllowedError = the tab has had no click yet; anything else is a
    // missing/undecodable file. Either way the toast still appears.
    console.warn('[alert] could not play beep:', error?.name || error);
    return false;
  }
}
