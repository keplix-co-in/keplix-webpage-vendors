'use client';

import Link from 'next/link';
import BrandLockup from '@/components/shell/BrandLockup';
import Button from '@/components/ui/Button';

/**
 * Pre-portal chrome for every onboarding step: no sidebar, brand lockup left, a
 * single ghost pill right. The purple "side-note" cards in the design are
 * reviewer documentation, not product UI, so they are not carried over.
 */
export default function OnboardingShell({
  title,
  subtitle,
  pill = { label: 'Back to checklist', href: '/onboarding' },
  children,
  footer,
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-canvas)' }}>
      <div className="max-w-[1120px] mx-auto px-7 py-6 flex items-center justify-between gap-4 flex-wrap">
        <BrandLockup label="Partner portal" />
        {pill && (
          <Link
            href={pill.href}
            className="whitespace-nowrap bg-white text-[var(--color-ink-body)] text-[12.5px] font-bold rounded-[var(--radius-pill)] px-[18px] py-[9px]"
            style={{ border: '1px solid var(--color-line)' }}
          >
            {pill.label}
          </Link>
        )}
      </div>

      <div className="max-w-[1120px] mx-auto px-7 pt-1 pb-[70px]">
        <div
          className="bg-white rounded-[var(--radius-auth)] p-8 max-[880px]:p-6"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <h1 className="text-[27px] font-bold tracking-[-0.6px]">{title}</h1>
          {subtitle && (
            <p className="text-[13.5px] text-[var(--color-muted)] mt-1.5 mb-[26px] leading-[1.55]">
              {subtitle}
            </p>
          )}

          {children}

          {footer && <div className="flex gap-3 flex-wrap mt-[26px]">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/** Back / forward pair used at the bottom of every step. */
export function StepActions({ backHref, onBack, nextLabel = 'Next', onNext, nextDisabled, busy }) {
  return (
    <>
      {backHref ? (
        <Link href={backHref}>
          <Button variant="outline">Back</Button>
        </Link>
      ) : (
        <Button variant="outline" onClick={onBack} type="button">
          Back
        </Button>
      )}
      <Button onClick={onNext} disabled={nextDisabled} loading={busy} type="button">
        {nextLabel}
      </Button>
    </>
  );
}

export function FieldLabel({ children, required = false, className = '' }) {
  return (
    <div className={`text-[12.5px] font-bold text-[var(--color-ink-body)] mb-[7px] ${className}`}>
      {children}
      {required && <span className="text-[var(--color-muted)]">*</span>}
    </div>
  );
}
