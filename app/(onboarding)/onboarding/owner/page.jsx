'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingShell, { FieldLabel, StepActions } from '@/components/onboarding/OnboardingShell';
import { PhotoWell } from '@/components/onboarding/PhotoPickers';
import UploadField from '@/components/ui/Upload';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import { initialsOf } from '@/lib/format';
import { rules, validate } from '@/shared/utils/validation';

const SCHEMA = {
  fullName: [rules.required('Owner name'), rules.minLength(2, 'Owner name'), rules.maxLength(100, 'Owner name')],
  phone: [rules.required('Owner phone number'), rules.mobile],
};

export default function OwnerDetailsPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, files, patch, setFile } = useDraft();
  const { ownerDetails } = draft;
  const [errors, setErrors] = useState({});

  const setField = (key) => (event) => {
    patch({ ownerDetails: { [key]: event.target.value } });
    setErrors((current) => (current[key] ? { ...current, [key]: null } : current));
  };

  const done = () => {
    const { errors: found, isValid } = validate(ownerDetails, SCHEMA);
    setErrors(found);
    if (!isValid) return;

    router.push('/onboarding/workshop');
  };

  return (
    <OnboardingShell
      title="Owner details"
      subtitle="Fill up business details."
      footer={<StepActions backHref="/onboarding/workshop" nextLabel="Done" onNext={done} />}
    >
      <FieldLabel required>Owner selfie</FieldLabel>
      <div className="mb-6">
        <PhotoWell
          file={files.ownerSelfie}
          onChange={(file) => setFile('ownerSelfie', file)}
          onError={toast.error}
          label="Upload owner selfie"
          placeholder={initialsOf(ownerDetails.fullName || 'O')}
          round
        />
      </div>

      <Input
        label="Enter owner name"
        required
        name="ownerName"
        value={ownerDetails.fullName}
        onChange={setField('fullName')}
        error={errors.fullName}
        placeholder="Eg: Rajesh Sharma"
        className="mb-[18px]"
      />

      <Input
        label="Enter owner phone number"
        required
        name="ownerPhone"
        type="tel"
        inputMode="tel"
        value={ownerDetails.phone}
        onChange={setField('phone')}
        error={errors.phone}
        placeholder="+91 98110 44718"
        className="mb-[18px]"
      />

      <div className="mb-[26px]">
        <UploadField
          label="Aadhar card"
          required
          value={files.ownerAadhar}
          onChange={(file) => setFile('ownerAadhar', file)}
          onError={toast.error}
          placeholder="Tap to upload Aadhar card"
        />
      </div>

      {/* Payout details are deliberately not collected here — they live in the
          documents step alone, so the backend has one source of truth for where
          a vendor gets paid. */}
    </OnboardingShell>
  );
}
