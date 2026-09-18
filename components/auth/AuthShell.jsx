'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BrandLockup from '@/components/shell/BrandLockup';

/**
 * Pre-portal chrome for the auth screens: centred single column, max-width
 * 468px, brand lockup top-left. The prototype's "Workflow map" pill is a
 * navigation aid for reviewers, so it is not carried over.
 */
export default function AuthShell({ title, subtitle, backHref, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: 'var(--color-canvas)' }}>
      <div className="w-full max-w-[1180px] px-7 py-6 flex items-center justify-between gap-4 flex-wrap">
        <BrandLockup width={118} height={42} label={null} />
      </div>

      <div className="w-full max-w-[468px] px-6 pt-[34px] pb-[60px]">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Go back"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white mb-[22px] text-[var(--color-ink-secondary)]"
            style={{ border: '1px solid var(--color-line)' }}
          >
            <ArrowLeft size={16} />
          </Link>
        )}

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
