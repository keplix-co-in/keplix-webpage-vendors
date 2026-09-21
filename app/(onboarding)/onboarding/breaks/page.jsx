'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingShell, {
  FieldError,
  FieldLabel,
  StepActions,
} from '@/components/onboarding/OnboardingShell';
import TimeSelect, { toMinutes } from '@/components/onboarding/TimeSelect';
import { useDraft } from '@/components/onboarding/DraftProvider';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SetBreaksPage() {
  const router = useRouter();
  const { draft, patch } = useDraft();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState(null);

  const toggleHoliday = (day) => {
    const next = draft.holidays.includes(day)
      ? draft.holidays.filter((d) => d !== day)
      : [...draft.holidays, day];
    patch({ holidays: next });
  };

  // Both a break and any holiday changes only take effect on Add, which is what
  // the screen promises.
  const add = () => {
    if (start || end) {
      const from = toMinutes(start);
      const to = toMinutes(end);

      if (from === null || to === null) {
        setError('Pick both a start and an end time for the break.');
        return;
      }
      if (to <= from) {
        setError('A break must end after it starts.');
        return;
      }

      // A break outside opening hours would silently never apply, so it is
      // rejected here rather than saved and ignored.
      const open = toMinutes(draft.timings.openTime);
      const close = toMinutes(draft.timings.closeTime);
      if (open !== null && close !== null && (from < open || to > close)) {
        setError(
          `Breaks have to sit inside your opening hours (${draft.timings.openTime} – ${draft.timings.closeTime}).`
        );
        return;
      }

      const duplicate = draft.breaks.some((b) => b.start === start && b.end === end);
      if (!duplicate) patch({ breaks: [...draft.breaks, { start, end }] });
    }

    router.push('/onboarding/timings');
  };

  return (
    <OnboardingShell
      title="Set Breaks / Holidays"
      subtitle="Fill up the following details."
      footer={
        <StepActions backHref="/onboarding/timings" nextLabel="Add" onNext={add} />
      }
    >
      <FieldLabel>Breaks</FieldLabel>
      <div className="flex items-center gap-[18px] flex-wrap">
        <TimeSelect
          ariaLabel="Break starts"
          value={start}
          onChange={(value) => {
            setStart(value);
            setError(null);
          }}
          highlighted
        />
        <span className="text-[13.5px] text-[var(--color-muted)]">To</span>
        <TimeSelect
          ariaLabel="Break ends"
          value={end}
          onChange={(value) => {
            setEnd(value);
            setError(null);
          }}
          highlighted
        />
      </div>
      {error && <FieldError>{error}</FieldError>}
      <div className="mb-7" />

      <FieldLabel>Holidays</FieldLabel>
      <div className="flex gap-2.5 mb-7 flex-wrap">
        {DAYS.map((day) => {
          const active = draft.holidays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleHoliday(day)}
              aria-pressed={active}
              className="rounded-[var(--radius-pill)] px-[18px] py-2.5 text-[13px] font-semibold cursor-pointer"
              style={
                active
                  ? { background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)' }
                  : { background: '#fff', color: 'var(--color-ink)', border: '1px solid var(--color-line)' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
