'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell, { OrDivider } from '@/components/auth/AuthShell';
import EntryLoader from '@/components/auth/EntryLoader';
import GoogleButton, { isGoogleConfigured } from '@/components/auth/GoogleButton';
import { useSessionRedirect } from '@/components/auth/useSessionRedirect';
import { useSignInFlow } from '@/components/auth/useSignInFlow';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { rules, rulePassword, validate } from '@/shared/utils/validation';
import { stepStore } from '../_lib/stepStore';

// The password policy is enforced at sign-up, where the account is created —
// unlike sign-in, which must still accept whatever an older account already has.
const SCHEMA = {
  email: [rules.required('Email address'), rules.email],
  password: [rules.required('Password'), rulePassword],
};

export default function SignUpPage() {
  const router = useRouter();
  const { pending } = useSessionRedirect();
  const { busy: googleBusy, error: googleError, signInWithGoogle } = useSignInFlow();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

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

  if (pending) return <EntryLoader />;

  return (
    <AuthShell
      title="Sign Up"
      subtitle="Enter your email address to get started"
    >
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
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.password}
          onChange={update('password')}
          error={errors.password || error || googleError}
          hint="8+ characters, with an uppercase letter, a number and a special character."
          className="mb-[18px]"
        />

        <Button type="submit" fullWidth loading={busy}>
          Verify
        </Button>
      </form>

      {isGoogleConfigured && <OrDivider />}

      <GoogleButton
        label="Sign up with Google"
        onCredential={signInWithGoogle}
        disabled={googleBusy}
      />

      <p className="text-center text-[12.5px] text-[var(--color-muted)] mt-[18px]">
        Already registered?{' '}
        <Link href="/sign-in" className="font-bold text-[var(--color-primary)]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
