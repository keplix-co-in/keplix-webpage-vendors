'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

/** Full-bleed purple confirmation screen — VerifiedEmail, VerifiedPhone, AuthDone. */
export default function Confirmation({ message, ctaLabel, ctaHref }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-7 py-10"
      style={{ background: 'var(--color-primary)' }}
    >
      <div className="w-[92px] h-[92px] rounded-full bg-white flex items-center justify-center mb-8">
        <Check size={44} strokeWidth={2.6} color="var(--color-primary)" />
      </div>

      <p className="text-[24px] font-bold text-white leading-[1.4] tracking-[-0.3px] max-w-[380px]">
        {message}
      </p>

      <Link
        href={ctaHref}
        className="inline-block bg-white text-[var(--color-primary)] text-[15px] font-bold rounded-[var(--radius-pill)] px-11 py-[15px] mt-9"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
