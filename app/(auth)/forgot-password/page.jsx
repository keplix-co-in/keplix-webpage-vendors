'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { stepStore } from '../_lib/stepStore';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!email) {
      setError('Enter the email address on your account.');
      return;
    }

    setBusy(true);
    setError(null);

    const result = await authAPI.sendPasswordResetOTP(email);
    setBusy(false);

    if (!result?.success) {
      setError(result?.error || 'We could not send the reset code.');
      return;
    }

    stepStore.set('reset_email', email);
    router.push('/forgot-password/otp');
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email address and we will send a reset code"
      backHref="/sign-in"
    >
      <form onSubmit={submit} noValidate>
        <Input
          label="Enter your email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Eg: xyz@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          className="mb-[18px]"
        />

        <Button type="submit" fullWidth loading={busy}>
          Send OTP
        </Button>
      </form>

      <div className="mt-3">
        <Link href="/forgot-password/phone">
          <Button variant="outline" fullWidth size="md">
            Reset the password via phone number
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
