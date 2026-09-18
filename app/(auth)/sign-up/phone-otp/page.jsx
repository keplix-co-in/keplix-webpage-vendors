'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OtpStep from '../../_components/OtpStep';
import { maskPhone, useStepValue } from '../../_lib/stepStore';
import { authAPI } from '@/api/auth';

export default function SignUpPhoneOtpPage() {
  const router = useRouter();
  const phone = useStepValue('phone');

  useEffect(() => {
    if (phone === null) router.replace('/sign-up/phone');
  }, [phone, router]);

  const verify = async (otp) => {
    const result = await authAPI.verifyPhoneOTP(phone, otp);
    if (!result?.success) return result?.error || 'Invalid OTP, retry again';

    router.replace('/verified/phone');
    return undefined;
  };

  const resend = async () => {
    const result = await authAPI.sendPhoneOTP(phone);
    return result?.success ? undefined : result?.error || 'Could not resend the code.';
  };

  return (
    <OtpStep
      title="Sign Up"
      subtitle={`An OTP code has been sent to phone number ${maskPhone(phone ?? '')}`}
      backHref="/sign-up/phone"
      onVerify={verify}
      onResend={resend}
    />
  );
}
