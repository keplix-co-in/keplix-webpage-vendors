'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell, { OrDivider } from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { stepStore } from '../../_lib/stepStore';

export default function SignUpPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }

    setBusy(true);
    setError(null);

    const fullNumber = `+91${digits.slice(-10)}`;
    const result = await authAPI.sendPhoneOTP(fullNumber);
    setBusy(false);

    if (!result?.success) {
      setError(result?.error || 'We could not send the verification code.');
      return;
    }

    stepStore.set('phone', fullNumber);
    router.push('/sign-up/phone-otp');
  };

  return (
    <AuthShell
      title="Sign Up"
      subtitle="You will receive an OTP for verification once you enter your phone number"
      backHref="/sign-up"
    >
      <form onSubmit={submit} noValidate>
        <Input
          label="Enter your phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98110 44718"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={error}
          className="mb-[18px]"
        />

        <Button type="submit" fullWidth loading={busy}>
          Send OTP
        </Button>
      </form>

      <OrDivider />

      <Link href="/sign-up">
        <Button variant="outline" fullWidth size="md">
          Sign up using e-mail
        </Button>
      </Link>
    </AuthShell>
  );
}
