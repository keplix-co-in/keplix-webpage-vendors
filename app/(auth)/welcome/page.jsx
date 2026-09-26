'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarCheck, ClipboardCheck, IndianRupee, Smartphone, Wrench } from 'lucide-react';
import EntryLoader from '@/components/auth/EntryLoader';
import GoogleButton, { isGoogleConfigured } from '@/components/auth/GoogleButton';
import { useSessionRedirect } from '@/components/auth/useSessionRedirect';
import { useSignInFlow } from '@/components/auth/useSignInFlow';
import Button from '@/components/ui/Button';

/**
 * Front door for a visitor with no session.
 *
 * Sign In is the primary action: most people opening the portal already have an
 * account, so Register is the secondary button. The design also shows Apple and
 * phone sign-in; neither is offered — the backend has no Apple path, and phone
 * sign-in cannot produce a session (verify-phone-otp returns no tokens and
 * /login matches on email only), so both would be dead buttons.
 *
 * Layout: sign-in on the left, and on wide screens the four steps of a Keplix
 * job on the right, so a garage owner sees how the platform works before
 * logging in. It is real content (not decorative), so it stays readable.
 */

const POINTS = [
  { Icon: CalendarCheck, text: 'Accept or decline booking requests and lock your slots' },
  { Icon: ClipboardCheck, text: 'Log walk-ins and close jobs with photos and inspection notes' },
  { Icon: IndianRupee, text: 'See every payment and what you have earned' },
];

// The real order of a Keplix job, in the words a workshop owner uses. Kept to
// what the platform does today: no payout timing or fee is promised here, since
// both are still owner decisions (see PROJECT_LOG backlog).
const STEPS = [
  {
    Icon: Smartphone,
    title: 'A customer books you',
    text: 'They pick your workshop and a time slot in the Keplix app.',
  },
  {
    Icon: CalendarCheck,
    title: 'You accept the request',
    text: 'Accept or decline. Accepting locks that slot in your day.',
  },
  {
    Icon: Wrench,
    title: 'You do the job',
    text: 'Inspect the car, take photos and close the job with a summary.',
  },
  {
    Icon: IndianRupee,
    title: 'You get paid',
    text: 'The customer confirms the work and the payment is settled to you.',
  },
];

function HowItWorks() {
  return (
    <div className="w-full max-w-[440px] text-white">
      <h2 className="text-[22px] font-bold tracking-[-0.4px] leading-[1.2]">
        How Keplix works for your workshop
      </h2>

      <ol className="mt-8">
        {STEPS.map(({ Icon, title, text }, i) => (
          <li key={title} className="relative flex gap-4 pb-8 last:pb-0">
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute left-[19px] top-11 bottom-1 w-px bg-white/25"
              />
            )}
            <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-white text-[var(--color-primary)]">
              <Icon size={19} aria-hidden="true" />
            </span>
            <div className="pt-0.5">
              <p className="text-[15.5px] font-bold">{title}</p>
              <p className="text-[13.5px] leading-[1.55] text-white/80 mt-1">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function WelcomePage() {
  const { busy, error, signInWithGoogle } = useSignInFlow();
  // A vendor with a live session is forwarded to where they belong, and sees a
  // loader meanwhile rather than this page flashing first.
  const { pending } = useSessionRedirect();

  return (
    <>
      {/*
        WHY an overlay instead of `if (pending) return <EntryLoader />`: session
        restore only happens in the browser, so `pending` is always true during
        the server render. Returning the loader made the crawlable HTML of the
        only indexable page a spinner with no <h1> or body text. The page now
        always renders, and the loader covers it until the session is known — a
        signed-in vendor still never sees this page flash.
      */}
      {pending && (
        <div className="fixed inset-0 z-50">
          <EntryLoader />
        </div>
      )}

      <div
        className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
        style={{ background: 'var(--color-surface)' }}
        aria-hidden={pending || undefined}
      >
        <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-[440px] mx-auto lg:mx-0">
            <div className="flex items-center gap-3 mb-10">
              <Image
                src="/assets/keplix-icon.png"
                alt="Keplix Partner"
                width={48}
                height={48}
                className="rounded-[12px]"
                priority
              />
              <span className="text-[15px] font-bold text-[var(--color-ink-secondary)]">
                Keplix Partner
              </span>
            </div>

            <h1 className="text-[36px] sm:text-[42px] font-bold tracking-[-1.2px] leading-[1.08] text-[var(--color-ink)]">
              Run your workshop from anywhere
            </h1>
            <p className="text-[15.5px] text-[var(--color-ink-body)] leading-[1.6] mt-4">
              The same account as the Keplix Partner app, now on your computer.
            </p>

            <ul className="mt-7 flex flex-col gap-3.5">
              {POINTS.map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-[1px] grid place-items-center w-8 h-8 shrink-0 rounded-[10px] bg-[var(--color-primary-tint)] text-[var(--color-primary)]">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="text-[14px] text-[var(--color-ink-secondary)] leading-[1.5] pt-[5px]">
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {error && (
              <p role="alert" className="text-[12.5px] font-bold text-[var(--color-danger)] mt-6">
                {error}
              </p>
            )}

            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link href="/sign-in" className="sm:flex-1">
                <Button fullWidth>Sign in</Button>
              </Link>
              <Link href="/sign-up" className="sm:flex-1">
                <Button fullWidth variant="outline">
                  Register
                </Button>
              </Link>
            </div>

            {isGoogleConfigured && (
              <div className="mt-5">
                <GoogleButton onCredential={signInWithGoogle} disabled={busy} />
              </div>
            )}

            <p className="text-[12.5px] text-[var(--color-muted)] mt-8 leading-[1.6]">
              Looking for how Keplix works for garages?{' '}
              <a
                href="https://keplix.co.in/business"
                className="font-bold text-[var(--color-primary)] underline underline-offset-2"
              >
                Read about Keplix for workshops
              </a>
            </p>
          </div>
        </main>

        <aside
          className="hidden lg:flex items-center justify-center px-12 py-12"
          style={{
            background:
              'radial-gradient(120% 90% at 20% 10%, #6a62d0 0%, #4e46b4 45%, #2a2470 100%)',
          }}
        >
          <HowItWorks />
        </aside>
      </div>
    </>
  );
}
