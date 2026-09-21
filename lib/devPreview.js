'use client';

/**
 * Dev-only portal preview.
 *
 * Half the portal sits behind the auth guard, so a screen index that only
 * linked to those routes would bounce straight back to sign-in and be useless
 * for looking at them. This lets the guard accept a stand-in vendor so the
 * shell and every page render without a session.
 *
 * Every entry point is gated on NODE_ENV === 'development', which Next inlines
 * at build time — in a production build `isDevBuild` is a literal `false`, so
 * the branch is dead code and the flag can never be honoured, no matter what a
 * browser has in localStorage.
 */

export const isDevBuild = process.env.NODE_ENV === 'development';

const FLAG = 'keplix_dev_preview';

/** The stand-in vendor. id 0 will match no real record, so nothing can be
 *  mistaken for a signed-in account if this ever runs against a live API. */
export const PREVIEW_USER = {
  id: 0,
  email: 'preview@localhost',
  role: 'vendor',
  business_name: 'Preview Workshop',
  phone: '9999999999',
  onboarding_completed: true,
  __devPreview: true,
};

// sessionStorage, not localStorage: the flag must not outlive the tab. Kept in
// localStorage it survived a browser restart, so simply opening the site landed
// on the dashboard as the stand-in vendor instead of the Welcome screen.
export const isPreviewOn = () => {
  if (!isDevBuild || typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
};

export const setPreview = (on) => {
  if (!isDevBuild || typeof window === 'undefined') return;
  try {
    if (on) window.sessionStorage.setItem(FLAG, '1');
    else window.sessionStorage.removeItem(FLAG);
    // Clear the old localStorage key so a browser that still carries one from
    // before this change stops being silently stuck in preview.
    window.localStorage.removeItem(FLAG);
  } catch {
    // Nothing to do — preview simply stays off.
  }
};

/** Drops a stale flag written by the earlier localStorage version. */
export const clearLegacyPreviewFlag = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(FLAG);
  } catch {
    // Storage unavailable — nothing to clear.
  }
};
