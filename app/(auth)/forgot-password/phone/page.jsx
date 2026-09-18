'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { stepStore } from '../../_lib/stepStore';

export default function ForgotPasswordPhonePage() {
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
      setError(result?.error || 'We could not send the reset code.');
      return;
    }

    stepStore.set('phone', fullNumber);
    router.push('/forgot-password/otp');
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your phone number and we will text a reset code"
      backHref="/forgot-password"
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

      <div className="mt-3">
        <Link href="/forgot-password">
          <Button variant="outline" fullWidth size="md">
            Reset the password via e-mail
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
