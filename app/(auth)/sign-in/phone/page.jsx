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
import { stepStore } from '../../_lib/stepStore';

export default function SignInPhonePage() {
  const router = useRouter();
  const { busy: googleBusy, signInWithGoogle } = useSignInFlow();
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
    router.push('/sign-in/otp');
  };

  return (
    <AuthShell
      title="Sign In"
      subtitle="You will receive an OTP for verification once you enter your phone number"
      backHref="/sign-in"
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
          Continue
        </Button>
      </form>

      <OrDivider />

      <GoogleButton onCredential={signInWithGoogle} disabled={googleBusy} />

      <div className="mt-3">
        <Link href="/sign-in">
          <Button variant="outline" fullWidth size="md">
            Sign in using e-mail
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
