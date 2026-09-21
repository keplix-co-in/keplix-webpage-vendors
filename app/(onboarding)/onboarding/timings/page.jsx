'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import OnboardingShell, {
  FieldError,
  FieldLabel,
  StepActions,
} from '@/components/onboarding/OnboardingShell';
import TimeSelect, { toMinutes } from '@/components/onboarding/TimeSelect';
import { useDraft } from '@/components/onboarding/DraftProvider';

function RemovableChip({ label, onRemove }) {
  return (
    <span
      className="bg-white rounded-[var(--radius-pill)] px-4 py-2.5 text-[13px] font-bold inline-flex items-center gap-2.5"
      style={{ border: '1px solid var(--color-line)' }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center cursor-pointer"
        style={{ background: 'var(--color-ink)' }}
      >
        <X size={10} color="#fff" />
      </button>
    </span>
  );
}

/**
 * Times come from a closed dropdown, so the format is guaranteed — what is
 * worth checking is whether the window makes sense, and whether a break the
 * vendor added earlier still fits inside it.
 */
export const validateTimings = ({ openTime, closeTime }, breaks = []) => {
  const errors = {};
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);

  if (open === null || close === null) {
    errors.hours = 'Set both an opening and a closing time.';
    return errors;
  }
  if (close <= open) {
    errors.hours = 'Closing time must be after opening time.';
    return errors;
  }

  const outside = breaks.filter((item) => {
    const start = toMinutes(item.start);
    const end = toMinutes(item.end);
    return start === null || end === null || end <= start || start < open || end > close;
  });

  if (outside.length > 0) {
    errors.breaks = 'A break falls outside your opening hours — remove it or change your hours.';
  }

  return errors;
};

export default function OnboardTimingsPage() {
  const router = useRouter();
  const { draft, patch } = useDraft();
  const { timings, breaks, holidays } = draft;
  const [errors, setErrors] = useState({});

  const setTime = (key) => (value) => {
    patch({ timings: { [key]: value } });
    setErrors({});
  };

  const done = () => {
    const found = validateTimings(timings, breaks);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    router.push('/onboarding');
  };

  return (
    <OnboardingShell
      title="Workshop Timings"
      subtitle="Fill up the following details."
      footer={<StepActions backHref="/onboarding" nextLabel="Done" onNext={done} />}
    >
      <FieldLabel required>Set business hours</FieldLabel>
      <div className="flex items-center gap-[18px] flex-wrap">
        <TimeSelect
          ariaLabel="Opening time"
          value={timings.openTime}
          onChange={setTime('openTime')}
        />
        <span className="text-[13.5px] text-[var(--color-muted)]">To</span>
        <TimeSelect
          ariaLabel="Closing time"
          value={timings.closeTime}
          onChange={setTime('closeTime')}
        />
      </div>
      {errors.hours && <FieldError>{errors.hours}</FieldError>}
      <div className="mb-7" />

      <FieldLabel>Breaks</FieldLabel>
      {errors.breaks && <FieldError className="mt-0 mb-2">{errors.breaks}</FieldError>}
      <div className="flex gap-2.5 mb-6 flex-wrap">
        {breaks.length === 0 ? (
          <span className="text-[13px] text-[var(--color-disabled)]">No breaks added</span>
        ) : (
          breaks.map((item, index) => (
            <RemovableChip
              key={`${item.start}-${item.end}`}
              label={`${item.start} - ${item.end}`}
              onRemove={() => {
                patch({ breaks: breaks.filter((_, i) => i !== index) });
                setErrors({});
              }}
            />
          ))
        )}
      </div>

      <FieldLabel>Holidays</FieldLabel>
      <div className="flex gap-2.5 mb-[26px] flex-wrap">
        {holidays.length === 0 ? (
          <span className="text-[13px] text-[var(--color-disabled)]">No weekly holiday</span>
        ) : (
          holidays.map((day) => (
            <RemovableChip
              key={day}
              label={day}
              onRemove={() => patch({ holidays: holidays.filter((d) => d !== day) })}
            />
          ))
        )}
      </div>

      <div className="text-[13.5px] text-[var(--color-muted)] mb-2.5">
        Want to add Breaks / Holidays?
      </div>
      <Link
        href="/onboarding/breaks"
        className="flex items-center justify-center gap-2 rounded-[var(--radius-field)] p-[18px] text-[13.5px] font-bold text-[var(--color-muted)] max-w-[420px] mb-[26px]"
        style={{ border: '1px dashed var(--color-line-strong)', background: 'var(--color-canvas)' }}
      >
        <Plus size={15} />
        Add
      </Link>
    </OnboardingShell>
  );
}
