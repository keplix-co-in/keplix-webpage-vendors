'use client';

import Link from 'next/link';
import { useSubscription } from '@/lib/queries';
import { bannerFor } from '@/lib/subscription';

const TONES = {
  warning: { bg: 'var(--color-warning-tint)', fg: 'var(--color-warning-text)', border: 'var(--color-warning-tint-strong)' },
  danger: { bg: 'var(--color-danger-tint)', fg: 'var(--color-danger)', border: 'var(--color-danger)' },
};

/** Shown across the portal for grace / expired / trial ending within 7 days. */
export default function SubscriptionBanner() {
  const { data } = useSubscription();
  const banner = bannerFor(data);
  if (!banner) return null;
  const tone = TONES[banner.tone] ?? TONES.warning;
  const href = '/subscription/plans';

  return (
    <div
      role="status"
      aria-live="polite"
      className="px-4 sm:px-7 py-3 flex items-center justify-between gap-x-4 gap-y-2 flex-wrap"
      style={{ background: tone.bg, color: tone.fg, borderBottom: `1px solid ${tone.border}` }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-bold">{banner.title}</div>
        <div className="text-[12px] leading-[1.5]">{banner.body}</div>
      </div>
      <Link
        href={href}
        className="text-[12.5px] font-bold text-white rounded-[var(--radius-pill)] px-4 py-2 whitespace-nowrap"
        style={{ background: 'var(--color-primary)' }}
      >
        {banner.cta}
      </Link>
    </div>
  );
}
