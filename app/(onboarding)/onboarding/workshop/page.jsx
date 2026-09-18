'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Pencil, Plus } from 'lucide-react';
import OnboardingShell, { FieldLabel, StepActions } from '@/components/onboarding/OnboardingShell';
import { PhotoWell, PhotoGrid } from '@/components/onboarding/PhotoPickers';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Field';
import { initialsOf } from '@/lib/format';

export default function WorkshopInfoPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, files, shopPhotos, patch, setFile, addShopPhoto, removeShopPhoto } = useDraft();

  const { workshopInfo, address, ownerDetails } = draft;

  const addressLine = [address.building, address.area, address.city, address.pincode]
    .filter(Boolean)
    .join(', ');

  const next = () => {
    if (!workshopInfo.workshopName) {
      toast.error('Your workshop name is required.');
      return;
    }
    if (shopPhotos.length === 0) {
      toast.error('Add at least one photo of your workshop.');
      return;
    }
    router.push('/onboarding');
  };

  return (
    <OnboardingShell
      title="Workshop Information"
      subtitle="Fill up your shop details."
      footer={<StepActions backHref="/onboarding" onNext={next} />}
    >
      <FieldLabel>Workshop logo</FieldLabel>
      <div className="mb-[22px]">
        <PhotoWell
          file={files.workshopLogo}
          onChange={(file) => setFile('workshopLogo', file)}
          onError={toast.error}
          label="Upload workshop logo"
          placeholder="logo"
        />
      </div>

      <Input
        label="Enter workshop name"
        required
        name="workshopName"
        value={workshopInfo.workshopName}
        onChange={(e) => patch({ workshopInfo: { workshopName: e.target.value } })}
        placeholder="Eg: Dwarka Mor Service"
        className="mb-[18px]"
      />

      <Textarea
        label="Workshop Description"
        name="description"
        rows={4}
        value={workshopInfo.description}
        onChange={(e) => patch({ workshopInfo: { description: e.target.value } })}
        placeholder="What your workshop specialises in, pick-up and drop, anything a customer should know."
        className="mb-[18px]"
      />

      <FieldLabel required>Enter workshop address</FieldLabel>
      {addressLine && (
        <Link
          href="/onboarding/address"
          className="flex justify-between gap-3 rounded-[var(--radius-field)] px-[18px] py-3.5 text-[13.5px] mb-3"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <span className="text-[var(--color-ink)]">{addressLine}</span>
          <Pencil size={14} className="text-[var(--color-disabled)] shrink-0" />
        </Link>
      )}
      <Link
        href="/onboarding/address"
        className="inline-flex items-center gap-2 text-white rounded-[var(--radius-pill)] px-5 py-[11px] text-[12.5px] font-bold mb-6"
        style={{ background: 'var(--color-primary)' }}
      >
        <Plus size={14} />
        {addressLine ? 'Edit workshop address' : 'Add workshop address'}
      </Link>

      <FieldLabel required>Upload workshop images</FieldLabel>
      <div className="mb-[26px]">
        <PhotoGrid
          photos={shopPhotos}
          onAdd={addShopPhoto}
          onRemove={removeShopPhoto}
          onError={toast.error}
        />
      </div>

      <Link
        href="/onboarding/owner"
        className="flex items-center gap-3.5 rounded-[var(--radius-field)] p-[18px] mb-[26px]"
        style={{ border: '1px solid var(--color-line)' }}
      >
        <div
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-bold"
          style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
        >
          {initialsOf(ownerDetails.fullName || 'O')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold text-[var(--color-ink)]">Owner details</div>
          <div className="text-[12px] text-[var(--color-muted)] mt-0.5">
            Selfie, name, phone number and Aadhar card
          </div>
        </div>
        <ChevronRight size={16} className="text-[var(--color-disabled)] shrink-0" />
      </Link>
    </OnboardingShell>
  );
}
