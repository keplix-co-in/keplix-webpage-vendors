'use client';

import { Check } from 'lucide-react';

/**
 * Job timeline. Steps are derived from the booking's own columns rather than a
 * server-side event log, because the backend keeps no per-booking history —
 * status, vendor_status and the health sheet are the only record of progress.
 */
export const buildTimeline = (booking) => {
  const { status, vendorStatus, hasHealthSheet } = booking;
  const accepted = vendorStatus === 'accepted';
  const started = ['in_progress', 'service_completed', 'completed', 'user_confirmed'].includes(status);
  const completed = ['completed', 'user_confirmed', 'service_completed'].includes(status);

  return [
    { label: 'Request received', done: true },
    { label: 'Accepted by you', done: accepted },
    { label: 'Customer paid', done: accepted && status !== 'pending' },
    { label: 'Job started', done: started },
    { label: 'Health sheet sent', done: hasHealthSheet },
    { label: 'Marked complete', done: completed },
    { label: 'Payout released', done: status === 'user_confirmed' },
  ];
};

export default function JobTimeline({ booking }) {
  const steps = buildTimeline(booking);

  return (
    <ol className="list-none p-0 m-0">
      {steps.map((step, index) => (
        <li key={step.label} className="flex gap-3.5">
          <div className="flex flex-col items-center shrink-0">
            <span
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{
                background: step.done ? 'var(--color-primary)' : '#FFFFFF',
                color: step.done ? '#FFFFFF' : 'var(--color-disabled)',
                border: `1px solid ${step.done ? 'var(--color-primary)' : 'var(--color-line)'}`,
              }}
            >
              {step.done ? <Check size={12} /> : '·'}
            </span>
            {index < steps.length - 1 && (
              <span
                className="w-px flex-1 my-1"
                style={{ background: step.done ? 'var(--color-primary)' : 'var(--color-line)' }}
              />
            )}
          </div>

          <div className="pb-4 min-w-0">
            <div
              className="text-[13px] font-semibold"
              style={{ color: step.done ? 'var(--color-ink)' : 'var(--color-disabled)' }}
            >
              {step.label}
            </div>
            {!step.done && <div className="text-[11.5px] text-[var(--color-disabled)]">Pending</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
