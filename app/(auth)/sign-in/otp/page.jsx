'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OtpStep from '../../_components/OtpStep';
import { maskPhone, useStepValue } from '../../_lib/stepStore';
import { useSignInFlow } from '@/components/auth/useSignInFlow';
import { authAPI } from '@/api/auth';

export default function SignInOtpPage() {
  const router = useRouter();
  const phone = useStepValue('phone');
  const { land } = useSignInFlow();

  useEffect(() => {
    if (phone === null) router.replace('/sign-in/phone');
  }, [phone, router]);

  const verify = async (otp) => {
    const result = await authAPI.verifyPhoneOTP(phone, otp);
    if (!result?.success) return result?.error || 'Invalid OTP, retry again';

    // The backend's verify-phone-otp confirms the number and provisions the
    // vendor profile, but it does not issue tokens, and /login looks accounts up
    // by email only — so a phone-only sign-in cannot produce a session today.
    // Tokens are used when present so this starts working the moment the
    // endpoint returns them; until then the vendor is told what to do next
    // rather than being dropped on a portal that 401s on every request.
    if (result.data?.access) {
      land(result.data);
      return undefined;
    }

    return 'Phone verified. Please sign in with your email address to continue.';
  };

  const resend = async () => {
    const result = await authAPI.sendPhoneOTP(phone);
    return result?.success ? undefined : result?.error || 'Could not resend the code.';
  };

  return (
    <OtpStep
      title="Sign In"
      subtitle={`An OTP code has been sent to phone number ${maskPhone(phone ?? '')}`}
      backHref="/sign-in/phone"
      onVerify={verify}
      onResend={resend}
    >
      <div
        className="rounded-[14px] px-4 py-3.5 mt-5 text-[12px] leading-[1.6]"
        style={{
          background: 'var(--color-warning-tint)',
          border: '1px solid var(--color-warning-tint-strong)',
          color: 'var(--color-warning-text)',
        }}
      >
        A verified vendor lands on the dashboard. An unfinished registration is sent back to the
        onboarding checklist, and a customer-type account is refused and signed out.
      </div>
    </OtpStep>
  );
}
