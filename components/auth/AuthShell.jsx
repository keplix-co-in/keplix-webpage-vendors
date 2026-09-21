'use client';

import BrandLockup from '@/components/shell/BrandLockup';

/**
 * Pre-portal chrome for the auth screens: a single centred column, max-width
 * 468px.
 *
 * No corner header and no back button — the column is centred vertically rather
 * than pinned under a header. Screens that relied on the back arrow carry a text
 * link instead, so every step still has a way out.
 *
 * A small "Keplix Partner" wordmark sits above the title. Without any name on
 * the page, the first screen a vendor sees looks like an anonymous form, which
 * is also what a phishing page looks like.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--color-canvas)' }}
    >
      <div className="w-full max-w-[468px] px-6 py-[60px]">
        <div className="mb-8">
          <BrandLockup width={84} height={30} label="Partner" />
        </div>

        <h1 className="text-[28px] font-bold tracking-[-0.6px]">{title}</h1>
        {subtitle && (
          <p className="text-[13.5px] text-[var(--color-muted)] mt-[7px] mb-7 leading-[1.55]">
            {subtitle}
          </p>
        )}

        {children}

        {footer}

        <p className="text-[11px] text-[var(--color-disabled)] text-center leading-[1.7] mt-[26px]">
          By continuing, I accept the{' '}
          <a
            href="https://keplix.co.in/terms"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-muted)] font-bold underline"
          >
            Terms and Conditions
          </a>{' '}
          and have read the{' '}
          <a
            href="https://keplix.co.in/privacy-policy"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-muted)] font-bold underline"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3.5 my-[18px]">
      <div className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
      <span className="text-[12px] font-bold text-[var(--color-disabled)]">OR</span>
      <div className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
    </div>
  );
}
