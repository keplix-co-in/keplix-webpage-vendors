'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Plus } from 'lucide-react';
import OnboardingShell, { StepActions } from '@/components/onboarding/OnboardingShell';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/format';

export default function ServiceSetupPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, patch } = useDraft();
  const services = draft.serviceDetails;

  const remove = (index) =>
    patch({ serviceDetails: services.filter((_, i) => i !== index) });

  const done = () => {
    if (services.length === 0) {
      toast.error('Add at least one service before finishing this step.');
      return;
    }
    router.push('/onboarding');
  };

  return (
    <OnboardingShell
      title="List the services you offer"
      subtitle="Add any number of services."
      footer={
        <StepActions backHref="/onboarding/services" nextLabel="Done" onNext={done} />
      }
    >
      {services.map((service, index) => (
        <div
          key={`${service.name}-${index}`}
          className="rounded-[var(--radius-field)] p-[18px] mb-3 flex items-center gap-3.5 flex-wrap"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <div
            className="w-[38px] h-[38px] rounded-[var(--radius-well)] flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
          >
            <Menu size={15} />
          </div>

          <Link
            href={`/onboarding/services?edit=${index}`}
            className="flex-1 min-w-[180px]"
          >
            <div className="text-[14.5px] font-bold text-[var(--color-ink)]">{service.name}</div>
            <div className="text-[12px] text-[var(--color-disabled)] mt-0.5">
              {service.category} · {formatMoney(service.price)} · {service.duration}
            </div>
          </Link>

          <button
            type="button"
            onClick={() => remove(index)}
            className="text-[12.5px] font-bold text-[var(--color-danger)] cursor-pointer"
          >
            remove
          </button>
        </div>
      ))}

      <Link
        href="/onboarding/services"
        className="flex items-center justify-center gap-2 rounded-[var(--radius-field)] p-[18px] text-[13.5px] font-bold text-[var(--color-primary)] mt-1.5 mb-[26px]"
        style={{ border: '1px dashed var(--color-line-strong)', background: 'var(--color-canvas)' }}
      >
        <Plus size={15} />
        Add service
      </Link>
    </OnboardingShell>
  );
}
