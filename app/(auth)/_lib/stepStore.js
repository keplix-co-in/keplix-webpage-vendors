'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Carries the email/phone (and the signup password, briefly) between the steps
 * of a multi-screen auth flow.
 *
 * sessionStorage rather than query strings: these values would otherwise sit in
 * the URL, where they reach browser history, the referrer header and any
 * analytics that records paths. It is also per-tab and cleared when the tab
 * closes, so an abandoned signup does not linger.
 */
const PREFIX = 'keplix_vendor_auth_';

export const stepStore = {
  get(key) {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(PREFIX + key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    if (typeof window === 'undefined') return;
    try {
      if (value === null || value === undefined) window.sessionStorage.removeItem(PREFIX + key);
      else window.sessionStorage.setItem(PREFIX + key, value);
    } catch {
      // Storage blocked — the flow will fall back to sending the vendor back a step.
    }
  },
  clear(...keys) {
    keys.forEach((key) => stepStore.set(key, null));
  },
};

/**
 * Reads a value written by the previous step. Returns undefined while the first
 * client render is still pending, so a screen can tell "not loaded yet" apart
 * from "the vendor arrived here directly and there is nothing to read".
 */
export function useStepValue(key) {
  const [value, setValue] = useState(undefined);

  useEffect(() => {
    // Read after mount on purpose: sessionStorage does not exist during the
    // server render, and seeding this synchronously would make the server and
    // client markup disagree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(stepStore.get(key));
  }, [key]);

  return value;
}

/** Resend countdown shared by every OTP screen. */
export function useResendCountdown(seconds = 30) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = setTimeout(() => setRemaining((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const restart = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, canResend: remaining <= 0, restart };
}

/** Masks a phone for display: +91 98110 ••••• */
export const maskPhone = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 6) return phone;
  const tail = digits.slice(-10);
  return `+91 ${tail.slice(0, 5)} •••••`;
};
