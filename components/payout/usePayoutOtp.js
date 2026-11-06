'use client';

// Web port of keplix-frontend/components/Vendor/Profile/usePayoutOtp.js —
// shared step-up flow for payout detail changes (A-023).
//
//   const payoutOtp = usePayoutOtp();
//   await payoutOtp.start({
//     submit: (otp) => vendorAPI.updateProfile({ ...payload, payout_otp: otp }),
//     onSuccess: (res) => {...},
//     onFailure: (res) => {...},   // any error other than the two OTP codes
//   });
//   <PayoutOtpModal {...payoutOtp.modalProps} />
import { useState, useRef, useCallback, useEffect } from 'react';
import { vendorAPI } from '@/api/vendor';
import { PAYOUT_OTP_INVALID, PAYOUT_OTP_REQUIRED, payoutErrorCode } from '@/lib/payoutChange';

export const RESEND_COOLDOWN_SECONDS = 60;

export function usePayoutOtp() {
  const [visible, setVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const handlers = useRef(null);
  // State updates land a render late, so a fast double click could send the
  // PUT (and burn the single-use code) twice; refs guard re-entry synchronously.
  const inFlight = useRef({ send: false, submit: false });

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = useCallback(async () => {
    if (inFlight.current.send) return false;
    inFlight.current.send = true;
    setSending(true);
    setError('');
    // The web API client resolves (never rejects), so no try/catch is needed.
    const res = await vendorAPI.requestPayoutOtp();
    inFlight.current.send = false;
    setSending(false);
    if (!res?.success) {
      setError(res?.error || 'Could not send the code. Please try again.');
      return false;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    return true;
  }, []);

  /** Sends the OTP and opens the modal. Resolves false if the code could not be sent. */
  const start = useCallback(
    async (h) => {
      handlers.current = h;
      const ok = await sendCode();
      // Open even on failure so the vendor sees the error and can "Resend"
      // instead of the save silently doing nothing.
      setVisible(true);
      return ok;
    },
    [sendCode]
  );

  const close = useCallback(() => {
    setVisible(false);
    setError('');
    handlers.current = null;
  }, []);

  const submit = useCallback(async (code) => {
    const h = handlers.current;
    if (!h || inFlight.current.submit) return;
    inFlight.current.submit = true;
    setSubmitting(true);
    setError('');
    const res = await h.submit(code);
    inFlight.current.submit = false;
    setSubmitting(false);
    const errCode = payoutErrorCode(res);
    if (res?.success) {
      setVisible(false);
      handlers.current = null;
      h.onSuccess?.(res);
    } else if (errCode === PAYOUT_OTP_INVALID) {
      setError('That code is incorrect or has expired. Check the code or request a new one.');
    } else if (errCode === PAYOUT_OTP_REQUIRED) {
      setError('Enter the 6-digit code we emailed you.');
    } else {
      setVisible(false);
      handlers.current = null;
      h.onFailure?.(res);
    }
  }, []);

  return {
    start,
    modalProps: {
      visible,
      sending,
      submitting,
      error,
      cooldown,
      onResend: sendCode,
      onSubmit: submit,
      onClose: close,
    },
  };
}
