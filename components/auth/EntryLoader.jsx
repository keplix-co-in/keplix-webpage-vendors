'use client';

import BrandLockup from '@/components/shell/BrandLockup';

/** Shown while the session is restored, in place of a page that would flash. */
export default function EntryLoader() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--color-canvas)' }}
      role="status"
      aria-live="polite"
    >
      <BrandLockup width={84} height={30} label="Partner" />
      <p className="text-[12.5px] text-[var(--color-muted)]">Loading your workshop…</p>
    </div>
  );
}
