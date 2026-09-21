'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthShell, { OrDivider } from '@/components/auth/AuthShell';
import EntryLoader from '@/components/auth/EntryLoader';
import GoogleButton, { isGoogleConfigured } from '@/components/auth/GoogleButton';
import { useSessionRedirect } from '@/components/auth/useSessionRedirect';
import { useSignInFlow } from '@/components/auth/useSignInFlow';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { rules, validate } from '@/shared/utils/validation';

const SCHEMA = {
  email: [rules.required('Email address'), rules.email],
  // No format rule on sign-in: an existing account may predate whatever the
  // current password policy is, and rejecting it here would lock the vendor out
  // of the reset flow that could fix it.
  password: [rules.required('Password')],
};

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
  // Already signed in when the page loaded: forward them, don't show the form.
  const { pending } = useSessionRedirect();
  const { busy, error, setError, signInWithPassword, signInWithGoogle } = useSignInFlow();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const expired = searchParams.get('expired') === '1';

  // Editing a field clears its complaint, and the server's rejection too — that
  // message described the credentials as they were, not as they are now.
  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => (current[key] ? { ...current, [key]: null } : current));
    if (error) setError(null);
  };

  const submit = async (event) => {
    event.preventDefault();

    const { errors: found, isValid } = validate(form, SCHEMA);
    setErrors(found);
    if (!isValid) return;

    await signInWithPassword(form);
  };

  if (pending) return <EntryLoader />;

  return (
    <AuthShell title="Sign In" subtitle="Log in using your credentials">
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
          autoFocus
          type="email"
          autoComplete="email"
          placeholder="Eg: xyz@gmail.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          className="mb-[18px]"
        />

        <Input
          label="Enter password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={update('password')}
          error={errors.password || error}
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

      {isGoogleConfigured && <OrDivider />}

      <GoogleButton onCredential={signInWithGoogle} disabled={busy} />

      <p className="text-center text-[12.5px] text-[var(--color-muted)] mt-[18px]">
        No account yet?{' '}
        <Link href="/sign-up" className="font-bold text-[var(--color-primary)]">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
