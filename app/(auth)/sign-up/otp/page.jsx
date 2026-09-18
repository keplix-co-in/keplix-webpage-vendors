'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OtpStep from '../../_components/OtpStep';
import { stepStore, useStepValue } from '../../_lib/stepStore';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/api/auth';

export default function SignUpOtpPage() {
  const router = useRouter();
  const email = useStepValue('email');
  // completeSignIn rather than useSignInFlow.land: land() routes straight to the
  // landing page, and this flow owes the vendor the confirmation screen first.
  const { completeSignIn } = useAuth();

  // Arriving here directly means there is no address to verify against.
  useEffect(() => {
    if (email === null) router.replace('/sign-up');
  }, [email, router]);

  const verify = async (otp) => {
    const result = await authAPI.verifyEmailOTP(email, otp);
    if (!result?.success) return result?.error || 'Invalid OTP, retry again';

    // Sign in with the password captured a step ago so the vendor reaches
    // onboarding already authenticated, then drop it immediately.
    const password = stepStore.get('signup_password');
    stepStore.clear('signup_password');

    if (password) {
      const login = await authAPI.login({ email, password });
      if (login?.success) {
        const landing = completeSignIn(login.data);
        if (!landing.ok) return landing.errorMessage;

        router.replace('/verified/email');
        return undefined;
      }
    }

    // Verified, but we could not establish a session — sign in explicitly.
    router.replace('/sign-in');
    return undefined;
  };

  const resend = async () => {
    const result = await authAPI.sendEmailOTP(email);
    return result?.success ? undefined : result?.error || 'Could not resend the code.';
  };

  return (
    <OtpStep
      title="Sign Up"
      subtitle={`An OTP code has been sent to your email address ${email ?? ''}`}
      backHref="/sign-up"
      onVerify={verify}
      onResend={resend}
    />
  );
}
