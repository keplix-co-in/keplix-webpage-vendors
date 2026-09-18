'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthShell, { OrDivider } from '@/components/auth/AuthShell';
import GoogleButton from '@/components/auth/GoogleButton';
import { useSignInFlow } from '@/components/auth/useSignInFlow';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// useSearchParams needs a Suspense boundary above it or the route cannot be
// prerendered.
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const { busy, error, setError, signInWithPassword, signInWithGoogle } = useSignInFlow();
  const [form, setForm] = useState({ email: '', password: '' });

  const expired = searchParams.get('expired') === '1';

  const submit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError('Enter your email and password to continue.');
      return;
    }
    await signInWithPassword(form);
  };

  return (
    <AuthShell title="Sign In" subtitle="Log in using your credentials" backHref="/welcome">
      {expired && !error && (
        <div
          className="rounded-[var(--radius-field)] px-4 py-3 mb-4 text-[12.5px] font-bold"
          style={{ background: 'var(--color-warning-tint)', color: 'var(--color-warning-dark)' }}
        >
          Your session expired. Please sign in again.
        </div>
      )}

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
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={error}
        />

        <div className="text-right mt-3 mb-[26px]">
          <Link
            href="/forgot-password"
            className="text-[12.5px] font-bold text-[var(--color-primary)] underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={busy}>
          Verify
        </Button>
      </form>

      <OrDivider />

      <GoogleButton onCredential={signInWithGoogle} disabled={busy} />

      <div className="mt-3">
        <Link href="/sign-in/phone">
          <Button variant="outline" fullWidth size="md">
            Sign in using phone number
          </Button>
        </Link>
      </div>

      <p className="text-center text-[12.5px] text-[var(--color-muted)] mt-[18px]">
        No account yet?{' '}
        <Link href="/sign-up" className="font-bold text-[var(--color-primary)]">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
