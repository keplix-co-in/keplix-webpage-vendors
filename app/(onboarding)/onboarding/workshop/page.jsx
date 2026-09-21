'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Pencil, Plus } from 'lucide-react';
import OnboardingShell, {
  FieldError,
  FieldLabel,
  StepActions,
} from '@/components/onboarding/OnboardingShell';
import { PhotoWell, PhotoGrid } from '@/components/onboarding/PhotoPickers';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Field';
import { initialsOf } from '@/lib/format';
import { rules, validate } from '@/shared/utils/validation';

const SCHEMA = {
  workshopName: [rules.required('Workshop name'), rules.maxLength(120, 'Workshop name')],
  description: [rules.maxLength(2000, 'Description')],
};

// Matches the address step's own required fields, so this step cannot report
// itself done on an address that step would reject.
const ADDRESS_REQUIRED = ['street', 'area', 'city', 'pincode'];

export default function WorkshopInfoPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, files, shopPhotos, patch, setFile, addShopPhoto, removeShopPhoto } = useDraft();
  const [errors, setErrors] = useState({});

  const { workshopInfo, address, ownerDetails } = draft;

  const addressLine = [address.building, address.area, address.city, address.pincode]
    .filter(Boolean)
    .join(', ');

  const setField = (key) => (event) => {
    patch({ workshopInfo: { [key]: event.target.value } });
    setErrors((current) => (current[key] ? { ...current, [key]: null } : current));
  };

  const next = () => {
    const { errors: found, isValid } = validate(workshopInfo, SCHEMA);

    if (shopPhotos.length === 0) {
      found.photos = 'Add at least one photo of your workshop.';
    }
    if (ADDRESS_REQUIRED.some((key) => !address[key])) {
      found.address = 'Add your shop address — road, area, city and pincode are all needed.';
    }
    if (!ownerDetails.fullName || !ownerDetails.phone) {
      found.owner = 'Add the owner’s name and phone number.';
    }

    setErrors(found);
    if (!isValid || found.photos || found.address || found.owner) return;

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
        onChange={setField('workshopName')}
        error={errors.workshopName}
        placeholder="Eg: Dwarka Mor Service"
        className="mb-[18px]"
      />

      <Textarea
        label="Workshop Description"
        name="description"
        rows={4}
        value={workshopInfo.description}
        onChange={setField('description')}
        error={errors.description}
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
      {errors.address && <FieldError>{errors.address}</FieldError>}

      <FieldLabel required>Upload workshop images</FieldLabel>
      <div className="mb-[26px]">
        <PhotoGrid
          photos={shopPhotos}
          onAdd={addShopPhoto}
          onRemove={removeShopPhoto}
          onError={toast.error}
        />
        {errors.photos && <FieldError>{errors.photos}</FieldError>}
      </div>

      <Link
        href="/onboarding/owner"
        className="flex items-center gap-3.5 rounded-[var(--radius-field)] p-[18px]"
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
      {errors.owner && <FieldError>{errors.owner}</FieldError>}
      <div className="mb-[26px]" />
    </OnboardingShell>
  );
}
