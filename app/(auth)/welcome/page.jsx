'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';
import BrandLockup from '@/components/shell/BrandLockup';
import GoogleButton from '@/components/auth/GoogleButton';
import { useSignInFlow } from '@/components/auth/useSignInFlow';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

/**
 * Entry screen. Apple sign-in appears in the design but the backend has no
 * Apple path (only email, phone OTP and Google), so it is left out rather than
 * shipped as a dead button.
 */
export default function WelcomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { busy, error, signInWithGoogle } = useSignInFlow();

  // A vendor who still has a session should not be asked to sign in again.
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ background: 'var(--color-canvas)' }}
    >
      <div className="w-full max-w-[1180px] px-7 py-6">
        <BrandLockup width={118} height={42} label={null} />
      </div>

      <div className="w-full max-w-[468px] px-6 pt-8 pb-[60px] text-center">
        <div className="flex justify-center mb-7">
          <Image
            src="/assets/keplix-icon.png"
            alt="Keplix Partner"
            width={96}
            height={96}
            className="rounded-[22px]"
            priority
          />
        </div>

        <h1 className="text-[32px] font-bold tracking-[-0.8px] leading-[1.15]">
          Run your workshop from anywhere
        </h1>
        <p className="text-[14.5px] text-[var(--color-muted)] leading-[1.6] mt-3 mb-8">
          Accept bookings, log walk-ins, close jobs and track your earnings — the same account as
          the Keplix Partner app.
        </p>

        {error && (
          <p className="text-[12.5px] font-bold text-[var(--color-danger)] mb-4">{error}</p>
        )}

        <Link href="/sign-up">
          <Button fullWidth>Sign Up</Button>
        </Link>

        <div className="mt-3">
          <Link href="/sign-in">
            <Button variant="outline" fullWidth>
              Sign In
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <GoogleButton onCredential={signInWithGoogle} disabled={busy} />
          <Link href="/sign-in/phone">
            <Button variant="outline" fullWidth size="md">
              <Phone size={16} />
              Continue with phone number
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
