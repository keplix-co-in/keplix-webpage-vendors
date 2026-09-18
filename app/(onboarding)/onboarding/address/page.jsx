'use client';

import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import OnboardingShell, { StepActions } from '@/components/onboarding/OnboardingShell';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';

export default function AddressEntryPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, patch } = useDraft();
  const { address } = draft;

  const field = (key) => ({
    name: key,
    value: address[key],
    onChange: (e) => patch({ address: { [key]: e.target.value } }),
  });

  const save = () => {
    const missing = ['street', 'area', 'city', 'pincode'].filter((key) => !address[key]);
    if (missing.length > 0) {
      toast.error('Road, area, city and pincode are all needed for the shop address.');
      return;
    }
    router.push('/onboarding/workshop');
  };

  return (
    <OnboardingShell
      title="Shop Address"
      subtitle="As per your shop's location."
      footer={
        <StepActions
          backHref="/onboarding/workshop"
          nextLabel="Save workshop address"
          onNext={save}
        />
      }
    >
      {/* The design ships a CSS mock of the map. Picking a pin needs the Maps
          SDK and an API key, so this is an explicit placeholder rather than a
          fake map: the typed address below is what actually gets saved. */}
      <div
        className="rounded-[18px] h-[180px] mb-[22px] flex flex-col items-center justify-center text-center px-6"
        style={{
          border: '1px dashed var(--color-line-strong)',
          background:
            'repeating-linear-gradient(0deg,#EEF1F5 0 1px,transparent 1px 44px),repeating-linear-gradient(90deg,#EEF1F5 0 1px,transparent 1px 44px),linear-gradient(135deg,#F7F8FA,#EDEFF3)',
        }}
      >
        <MapPin size={26} color="var(--color-primary)" />
        <div className="text-[13px] font-bold mt-2.5">Map pin coming soon</div>
        <div className="text-[12px] text-[var(--color-muted)] mt-1 max-w-[380px] leading-[1.5]">
          Enter the address below — it is what prints on invoices. You can drop the exact gate pin
          from the app in the meantime.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-1">
        <Input label="Shop no / building no (optional)" {...field('building')} />
        <Input label="Floor / Tower (optional)" {...field('floor')} />
        <Input label="Road / Lane" required {...field('street')} />
        <Input label="Area / Sector / Locality" required {...field('area')} />
        <Input label="City" required {...field('city')} />
        <Input label="State" {...field('state')} />
        <Input label="Pincode" required inputMode="numeric" {...field('pincode')} />
      </div>

      <Input
        label="Add any nearby landmark (optional)"
        className="mt-[18px]"
        {...field('landmark')}
      />
    </OnboardingShell>
  );
}
