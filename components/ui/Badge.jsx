'use client';

// Status chips: 10.5–12.5px/700 on a tinted background, per the handoff.
const TONES = {
  neutral: { bg: 'var(--color-divider)', fg: 'var(--color-muted)' },
  primary: { bg: 'var(--color-primary-tint)', fg: 'var(--color-primary-dark)' },
  success: { bg: 'var(--color-success-tint)', fg: 'var(--color-success-dark)' },
  warning: { bg: 'var(--color-warning-tint)', fg: 'var(--color-warning-dark)' },
  danger: { bg: 'var(--color-danger-tint)', fg: 'var(--color-danger)' },
  teal: { bg: 'var(--color-teal)', fg: '#ffffff' },
};

export default function Badge({ tone = 'neutral', children, className = '' }) {
  const { bg, fg } = TONES[tone] ?? TONES.neutral;
  return (
    <span
      className={`inline-flex items-center text-[10.5px] font-bold rounded-lg px-2.5 py-1 ${className}`}
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}

/** Maps a booking/walk-in status to the palette the design uses for it. */
export const statusTone = (status = '') => {
  const value = String(status).toLowerCase();
  if (['completed', 'paid', 'done', 'verified', 'approved'].includes(value)) return 'success';
  if (['pending', 'under_review', 'in_review', 'open'].includes(value)) return 'warning';
  if (['cancelled', 'canceled', 'rejected', 'declined', 'failed'].includes(value)) return 'danger';
  if (['ongoing', 'in_progress', 'confirmed', 'accepted', 'started'].includes(value)) return 'primary';
  return 'neutral';
};
