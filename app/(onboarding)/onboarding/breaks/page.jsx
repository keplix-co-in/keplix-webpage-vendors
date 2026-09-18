'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingShell, { FieldLabel, StepActions } from '@/components/onboarding/OnboardingShell';
import TimeSelect from '@/components/onboarding/TimeSelect';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SetBreaksPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, patch } = useDraft();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const toggleHoliday = (day) => {
    const next = draft.holidays.includes(day)
      ? draft.holidays.filter((d) => d !== day)
      : [...draft.holidays, day];
    patch({ holidays: next });
  };

  // Both a break and any holiday changes only take effect on Add, which is what
  // the screen promises.
  const add = () => {
    if (start && !end) {
      toast.error('Pick when the break ends.');
      return;
    }

    if (start && end) {
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
      <div className="flex items-center gap-[18px] mb-7 flex-wrap">
        <TimeSelect ariaLabel="Break starts" value={start} onChange={setStart} highlighted />
        <span className="text-[13.5px] text-[var(--color-muted)]">To</span>
        <TimeSelect ariaLabel="Break ends" value={end} onChange={setEnd} highlighted />
      </div>

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
