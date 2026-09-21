'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { rules, validate } from '@/shared/utils/validation';
import { stepStore } from '../_lib/stepStore';

const SCHEMA = {
  email: [rules.required('Email address'), rules.email],
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (event) => {
    setEmail(event.target.value);
    if (error) setError(null);
  };

  const submit = async (event) => {
    event.preventDefault();

    const { errors, isValid } = validate({ email }, SCHEMA);
    if (!isValid) {
      setError(errors.email);
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
    >
      <form onSubmit={submit} noValidate>
        <Input
          label="Enter your email address"
          name="email"
          autoFocus
          type="email"
          autoComplete="email"
          placeholder="Eg: xyz@gmail.com"
          value={email}
          onChange={update}
          error={error}
          className="mb-[18px]"
        />

        <Button type="submit" fullWidth loading={busy}>
          Send OTP
        </Button>
      </form>

      <p className="text-center text-[12.5px] text-[var(--color-muted)] mt-[18px]">
        Remembered it?{' '}
        <Link href="/sign-in" className="font-bold text-[var(--color-primary)]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
