'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import OnboardingShell, { FieldLabel, StepActions } from '@/components/onboarding/OnboardingShell';
import TimeSelect from '@/components/onboarding/TimeSelect';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';

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

export default function OnboardTimingsPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, patch } = useDraft();
  const { timings, breaks, holidays } = draft;

  const done = () => {
    if (!timings.openTime || !timings.closeTime) {
      toast.error('Set both an opening and a closing time.');
      return;
    }
    router.push('/onboarding');
  };

  return (
    <OnboardingShell
      title="Workshop Timings"
      subtitle="Fill up the following details."
      footer={<StepActions backHref="/onboarding" nextLabel="Done" onNext={done} />}
    >
      <FieldLabel required>Set business hours</FieldLabel>
      <div className="flex items-center gap-[18px] mb-7 flex-wrap">
        <TimeSelect
          ariaLabel="Opening time"
          value={timings.openTime}
          onChange={(value) => patch({ timings: { openTime: value } })}
        />
        <span className="text-[13.5px] text-[var(--color-muted)]">To</span>
        <TimeSelect
          ariaLabel="Closing time"
          value={timings.closeTime}
          onChange={(value) => patch({ timings: { closeTime: value } })}
        />
      </div>

      <FieldLabel>Breaks</FieldLabel>
      <div className="flex gap-2.5 mb-6 flex-wrap">
        {breaks.length === 0 ? (
          <span className="text-[13px] text-[var(--color-disabled)]">No breaks added</span>
        ) : (
          breaks.map((item, index) => (
            <RemovableChip
              key={`${item.start}-${item.end}`}
              label={`${item.start} - ${item.end}`}
              onRemove={() => patch({ breaks: breaks.filter((_, i) => i !== index) })}
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
