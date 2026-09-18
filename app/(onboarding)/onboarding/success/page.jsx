'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

export default function RegistrationSuccessPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-7 py-10"
      style={{ background: 'var(--color-primary)' }}
    >
      <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-[34px]">
        <Check size={46} strokeWidth={2.6} color="var(--color-primary)" />
      </div>

      <h1 className="text-[26px] font-bold text-white leading-[1.35] max-w-[420px] tracking-[-0.4px]">
        Your registration has been completed successfully!
      </h1>

      <p
        className="text-[14px] mt-4 max-w-[440px] leading-[1.6]"
        style={{ color: 'rgba(255,255,255,.78)' }}
      >
        The Keplix team reviews most applications within one working day. Bookings switch on the
        moment verification clears.
      </p>

      <Link
        href="/dashboard"
        className="inline-block bg-white text-[15px] font-bold rounded-[var(--radius-pill)] px-11 py-[15px] mt-[38px]"
        style={{ color: 'var(--color-primary)' }}
      >
        Proceed
      </Link>
    </div>
  );
}
