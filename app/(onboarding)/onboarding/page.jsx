'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight } from 'lucide-react';
import BrandLockup from '@/components/shell/BrandLockup';
import { useDraft, stepCompletion } from '@/components/onboarding/DraftProvider';
import { submitOnboarding } from '@/lib/onboardingSubmit';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';

const STEPS = [
  {
    key: 'workshop',
    title: 'Workshop Information',
    sub: 'Shop details, Shop logo & images, Owner details',
    href: '/onboarding/workshop',
  },
  {
    key: 'documents',
    title: 'Workshop Documents',
    sub: 'GSTIN, Trade Licence, Bank Details',
    href: '/onboarding/documents',
  },
  {
    key: 'timings',
    title: 'Workshop Timings',
    sub: 'Open & Close hrs, Breaks & Holidays',
    href: '/onboarding/timings',
  },
  {
    key: 'services',
    title: 'Services & Pricing',
    sub: 'Select services and set your prices',
    href: '/onboarding/services',
  },
];

export default function OnboardingHubPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const { draft, files, shopPhotos, ready, clear } = useDraft();
  const [busy, setBusy] = useState(false);

  const completion = useMemo(
    () => stepCompletion(draft, files, shopPhotos),
    [draft, files, shopPhotos]
  );

  const allComplete = STEPS.every((step) => completion[step.key]);
  // The first unfinished step is the one that shows a Proceed row. Every other
  // step stays reachable — the checklist is a hub, not a wizard.
  const activeKey = STEPS.find((step) => !completion[step.key])?.key;

  const register = async () => {
    setBusy(true);
    const result = await submitOnboarding({ draft, files, shopPhotos });
    setBusy(false);

    if (!result.success) {
      toast.error(result.error || 'We could not submit your registration.');
      return;
    }

    if (result.partialFailure) {
      const missed = [...result.failedServices, ...result.failedDocuments, ...result.failedPhotos];
      toast.info(`Registered, but these could not be saved: ${missed.join(', ')}`);
    }

    // The profile response carries the completed flag the landing rule reads,
    // so the session has to learn about it or the vendor is sent straight back
    // to this hub on the next sign-in check.
    if (user) setUser({ ...user, onboarding_completed: true });
    clear();
    router.replace('/onboarding/success');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-canvas)' }}>
      <div style={{ background: 'var(--color-primary)', borderRadius: '0 0 30px 30px' }} className="pb-10">
        <div className="max-w-[1120px] mx-auto px-7 pt-[26px] flex items-center justify-between gap-4 flex-wrap">
          <BrandLockup label="Partner portal" onDark />
          <Link
            href="/sign-in"
            className="whitespace-nowrap text-white text-[12.5px] font-bold rounded-[var(--radius-pill)] px-[18px] py-[9px]"
            style={{ border: '1px solid rgba(255,255,255,.35)' }}
          >
            Save &amp; exit
          </Link>
        </div>

        <div className="max-w-[1120px] mx-auto px-7 pt-[34px]">
          <h1 className="text-[34px] font-bold text-white tracking-[-0.9px] leading-[1.15] max-w-[560px] mb-2.5">
            Get started, it takes only 5 minutes
          </h1>
          <p className="text-[15px]" style={{ color: 'rgba(255,255,255,.8)' }}>
            Complete all steps to register your workshop
          </p>
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto px-7 pt-[34px] pb-[70px]">
        <div
          className="bg-white rounded-[var(--radius-auth)] p-8 max-[880px]:p-6"
          style={{ border: '1px solid var(--color-line)' }}
        >
          {STEPS.map((step, index) => {
            const done = ready && completion[step.key];
            const active = ready && step.key === activeKey;
            const isLast = index === STEPS.length - 1;

            const dotBg = done
              ? 'var(--color-success)'
              : active
                ? 'var(--color-primary)'
                : 'var(--color-line-strong)';

            return (
              <div key={step.key} className="flex gap-[18px]">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-[26px] h-[26px] rounded-full text-white flex items-center justify-center text-[13px] font-bold"
                    style={{ background: dotBg }}
                  >
                    {done && <Check size={14} strokeWidth={3} />}
                  </div>
                  {!isLast && (
                    <div
                      className="w-px flex-1 my-1.5"
                      style={{ background: done ? 'var(--color-success)' : 'var(--color-line-strong)' }}
                    />
                  )}
                </div>

                <div className={isLast ? 'flex-1 pb-2' : 'flex-1 pb-[34px]'}>
                  <div className="text-[13px] font-bold text-[var(--color-ink-secondary)] mb-[3px]">
                    Step {index + 1}
                  </div>
                  <Link href={step.href} className="block">
                    <div className="text-[20px] font-bold tracking-[-0.3px] mb-1 text-[var(--color-ink)]">
                      {step.title}
                    </div>
                    <div className="text-[13px] text-[var(--color-muted)]">{step.sub}</div>
                  </Link>

                  {done ? (
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-[13.5px] font-bold text-[var(--color-success-dark)]">
                        Completed
                      </span>
                      <Link
                        href={step.href}
                        className="text-[12.5px] font-bold text-[var(--color-primary)]"
                      >
                        Review
                      </Link>
                    </div>
                  ) : active ? (
                    <Link
                      href={step.href}
                      className="flex items-center justify-between rounded-[var(--radius-small)] px-[18px] py-3.5 mt-3.5 max-w-[420px]"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      <span className="text-white text-[15px] font-bold">Proceed</span>
                      <ChevronRight size={18} color="#fff" />
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}

          <div
            className="mt-5 pt-[22px]"
            style={{ borderTop: '1px solid var(--color-divider)' }}
          >
            <button
              type="button"
              onClick={register}
              disabled={!allComplete || busy}
              className="text-[14px] font-bold rounded-[var(--radius-pill)] px-[38px] py-3.5"
              style={
                allComplete && !busy
                  ? { background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }
                  : { background: 'var(--color-line)', color: 'var(--color-disabled)', cursor: 'not-allowed' }
              }
            >
              {busy ? 'Submitting…' : 'Register Workshop'}
            </button>
            <div className="text-[12px] text-[var(--color-disabled)] mt-2.5">
              Unlocks when all four steps are complete.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
