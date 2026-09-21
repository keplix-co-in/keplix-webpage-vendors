'use client';

import Link from 'next/link';
import Image from 'next/image';
import EntryLoader from '@/components/auth/EntryLoader';
import GoogleButton from '@/components/auth/GoogleButton';
import { useSessionRedirect } from '@/components/auth/useSessionRedirect';
import { useSignInFlow } from '@/components/auth/useSignInFlow';
import Button from '@/components/ui/Button';

/**
 * Front door for a visitor with no session.
 *
 * Sign In is the primary action: most people opening the portal already have an
 * account, so Register is a link beneath it rather than the big button it is on
 * the app's first-launch screen. The design also shows Apple and phone sign-in;
 * neither is offered — the backend has no Apple path, and phone sign-in cannot
 * produce a session (verify-phone-otp returns no tokens and /login matches on
 * email only), so both would be dead buttons.
 */
export default function WelcomePage() {
  const { busy, error, signInWithGoogle } = useSignInFlow();
  // A vendor with a live session is forwarded to where they belong, and sees a
  // loader meanwhile rather than this page flashing first.
  const { pending } = useSessionRedirect();

  if (pending) return <EntryLoader />;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--color-canvas)' }}
    >
      <div className="w-full max-w-[468px] px-6 py-[60px] text-center">
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

        <Link href="/sign-in">
          <Button fullWidth>Sign In</Button>
        </Link>

        <p className="text-[13px] text-[var(--color-muted)] mt-4">
          New here?{' '}
          <Link href="/sign-up" className="font-bold text-[var(--color-primary)]">
            Register your workshop
          </Link>
        </p>

        <div className="mt-6">
          <GoogleButton onCredential={signInWithGoogle} disabled={busy} />
        </div>
      </div>
    </div>
  );
}
