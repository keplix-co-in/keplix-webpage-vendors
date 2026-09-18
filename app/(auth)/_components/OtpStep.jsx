'use client';

import { useState } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import OtpInput from '@/components/ui/OtpInput';
import Button from '@/components/ui/Button';
import { useResendCountdown } from '../_lib/stepStore';

/**
 * The five OTP screens differ only in their copy and what they do with a valid
 * code, so the shell, the countdown and the error styling live here once.
 */
export default function OtpStep({
  title,
  subtitle,
  backHref,
  verifyLabel = 'Verify OTP',
  onVerify,
  onResend,
  children,
}) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { remaining, canResend, restart } = useResendCountdown();

  const submit = async (event) => {
    event.preventDefault();
    if (otp.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }

    setBusy(true);
    setError(null);
    const message = await onVerify(otp);
    setBusy(false);

    // A resolved string is the failure message; undefined means the handler
    // navigated away.
    if (message) setError(message);
  };

  const resend = async () => {
    if (!canResend) return;
    setError(null);
    restart();
    const message = await onResend?.();
    if (message) setError(message);
  };

  return (
    <AuthShell title={title} subtitle={subtitle} backHref={backHref}>
      <form onSubmit={submit} noValidate>
        <div className="mb-3.5">
          <OtpInput value={otp} onChange={setOtp} error={Boolean(error)} />
        </div>

        <div className="text-[12.5px] text-[var(--color-muted)] mb-6">
          {error && <span className="text-[var(--color-danger)] font-bold">{error} · </span>}
          {!error && "Didn't receive OTP? "}
          {canResend ? (
            <button
              type="button"
              onClick={resend}
              className="text-[var(--color-primary)] font-bold cursor-pointer"
            >
              Resend
            </button>
          ) : (
            <span className="text-[var(--color-disabled)] font-bold">Resend in 0:{String(remaining).padStart(2, '0')}</span>
          )}
        </div>

        <Button type="submit" fullWidth loading={busy}>
          {verifyLabel}
        </Button>
      </form>

      {children}
    </AuthShell>
  );
}
