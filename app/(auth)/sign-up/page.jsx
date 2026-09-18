'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell, { OrDivider } from '@/components/auth/AuthShell';
import GoogleButton from '@/components/auth/GoogleButton';
import { useSignInFlow } from '@/components/auth/useSignInFlow';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { stepStore } from '../_lib/stepStore';

export default function SignUpPage() {
  const router = useRouter();
  const { busy: googleBusy, error: googleError, signInWithGoogle } = useSignInFlow();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      setError('Enter an email address and a password to continue.');
      return;
    }

    setBusy(true);
    setError(null);

    const result = await authAPI.signup({
      email: form.email,
      password: form.password,
      password_confirm: form.password,
      role: 'vendor',
    });

    if (!result?.success) {
      setBusy(false);
      setError(result?.error || 'Registration failed. Please try again.');
      return;
    }

    // Held only until the OTP step auto-signs-in with it, then deleted there.
    stepStore.set('email', form.email);
    stepStore.set('signup_password', form.password);

    const otpResult = await authAPI.sendEmailOTP(form.email);
    setBusy(false);

    if (!otpResult?.success) {
      setError(otpResult?.error || 'We could not send the verification code.');
      return;
    }

    router.push('/sign-up/otp');
  };

  return (
    <AuthShell
      title="Sign Up"
      subtitle="Enter your email address to get started"
      backHref="/welcome"
    >
      <form onSubmit={submit} noValidate>
        <Input
          label="Enter your email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Eg: xyz@gmail.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mb-[18px]"
        />

        <Input
          label="Enter password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={error || googleError}
          className="mb-[18px]"
        />

        <Button type="submit" fullWidth loading={busy}>
          Verify
        </Button>
      </form>

      <OrDivider />

      <GoogleButton
        label="Sign up with Google"
        onCredential={signInWithGoogle}
        disabled={googleBusy}
      />

      <div className="mt-3">
        <Link href="/sign-up/phone">
          <Button variant="outline" fullWidth size="md">
            Sign up using phone number
          </Button>
        </Link>
      </div>

      <p className="text-center text-[12.5px] text-[var(--color-muted)] mt-[18px]">
        Already registered?{' '}
        <Link href="/sign-in" className="font-bold text-[var(--color-primary)]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
