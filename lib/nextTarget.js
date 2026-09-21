'use client';

/**
 * Remembers where a vendor was headed when they were sent to sign in, so they
 * can be returned there afterwards instead of always landing on the dashboard.
 *
 * Kept in sessionStorage rather than a `?next=` query string: it survives the
 * hop through Welcome and the Google sign-in path without threading a parameter
 * through every screen, and it never appears in a URL that could be shared.
 *
 * The destination is validated against an allowlist on the way in AND on the
 * way out. It came from a browser-controlled place, and redirecting to an
 * arbitrary value would make the sign-in page an open redirect.
 */

const KEY = 'keplix_vendor_next';

// Portal areas a vendor can be sent back to. Anything else — sign-in screens,
// onboarding, the dev index, other origins — is refused.
const ALLOWED_PREFIXES = [
  '/dashboard',
  '/bookings',
  '/walk-in',
  '/services',
  '/earnings',
  '/reviews',
  '/messages',
  '/notifications',
  '/profile',
  '/documents',
  '/timings',
  '/support',
];

export const isSafeNext = (path) => {
  if (typeof path !== 'string' || path.length === 0 || path.length > 500) return false;
  // Must be a same-origin path: "//host" and "/\host" are protocol-relative and
  // treated as another site by browsers; anything with a scheme is absolute.
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return false;
  if (/[\r\n\\]/.test(path)) return false;

  const pathname = path.split(/[?#]/)[0];
  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

export const rememberNext = (path) => {
  if (typeof window === 'undefined' || !isSafeNext(path)) return;
  try {
    window.sessionStorage.setItem(KEY, path);
  } catch {
    // Storage unavailable — the vendor just lands on the dashboard instead.
  }
};

/** Reads and clears the remembered destination; returns null if none or unsafe. */
export const consumeNext = () => {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return isSafeNext(value) ? value : null;
  } catch {
    return null;
  }
};
