'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import OtpInput from '@/components/ui/OtpInput';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { maskPhone, stepStore, useResendCountdown, useStepValue } from '../../_lib/stepStore';

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const email = useStepValue('reset_email');
  const phone = useStepValue('phone');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const { remaining, canResend, restart } = useResendCountdown();

  // The reset endpoint checks the code and sets the new password in one call,
  // so there is nothing to verify against here — the code is carried forward
  // and /reset-password sends the vendor back with this flag if it was wrong.
  useEffect(() => {
    // sessionStorage is only readable after mount, so this flag cannot be part
    // of the initial state without breaking hydration.
    if (stepStore.get('reset_otp_invalid')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Invalid OTP, retry again');
      stepStore.clear('reset_otp_invalid');
    }
  }, []);

  useEffect(() => {
    if (email === null && phone === null) router.replace('/forgot-password');
  }, [email, phone, router]);

  const submit = (event) => {
    event.preventDefault();
    if (otp.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    stepStore.set('reset_otp', otp);
    router.push('/reset-password');
  };

  const resend = async () => {
    if (!canResend) return;
    setError(null);
    restart();
    const result = email
      ? await authAPI.sendPasswordResetOTP(email)
      : await authAPI.sendPhoneOTP(phone);
    if (!result?.success) setError(result?.error || 'Could not resend the code.');
  };

  const destination = email ? `your email address ${email}` : `phone number ${maskPhone(phone ?? '')}`;

  return (
    <AuthShell
      title="Forgot Password"
      subtitle={`An OTP code has been sent to ${destination}`}
      backHref="/forgot-password"
    >
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
            <span className="text-[var(--color-disabled)] font-bold">
              Resend in 0:{String(remaining).padStart(2, '0')}
            </span>
          )}
        </div>

        <Button type="submit" fullWidth>
          Verify OTP
        </Button>
      </form>
    </AuthShell>
  );
}
