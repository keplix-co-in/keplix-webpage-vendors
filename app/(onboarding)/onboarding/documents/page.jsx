'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingShell, { FieldError, StepActions } from '@/components/onboarding/OnboardingShell';
import UploadField from '@/components/ui/Upload';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import { rules, validate } from '@/shared/utils/validation';

// Format rules only. Whether *enough* was filled in is the bank-or-UPI check
// below, which spans several fields and cannot be expressed per-field.
const SCHEMA = {
  gstNumber: [rules.required('GSTIN number'), rules.gstin],
  accountNumber: [rules.accountNumber],
  ifsc: [rules.ifsc],
  accountHolderName: [rules.maxLength(120, 'Account holder name')],
  upi: [rules.upi],
};

export default function DocumentsUploadPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, files, patch, setFile } = useDraft();
  const { gstInfo, bankDetails } = draft;
  const [errors, setErrors] = useState({});

  const bankComplete = Boolean(
    bankDetails.accountNumber && bankDetails.ifsc && bankDetails.accountHolderName
  );

  const clearError = (key) =>
    setErrors((current) => (current[key] ? { ...current, [key]: null } : current));

  const next = () => {
    const { errors: found } = validate(
      { ...bankDetails, gstNumber: gstInfo.gstNumber },
      SCHEMA
    );

    if (!files.panCard || !files.tradeLicense) {
      found.documents = 'Both the PAN card and the trade licence have to be uploaded.';
    }
    // Either a full bank account or a UPI ID — one payout destination is enough,
    // but a half-filled bank block is not.
    if (!bankComplete && !bankDetails.upi) {
      found.payout = 'Add your bank details or a UPI ID so payouts can reach you.';
    }

    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    router.push('/onboarding');
  };

  const bankField = (key) => ({
    name: key,
    value: bankDetails[key],
    error: errors[key],
    onChange: (e) => {
      patch({ bankDetails: { [key]: e.target.value } });
      clearError(key);
      clearError('payout');
    },
  });

  return (
    <OnboardingShell
      title="Workshop Documents"
      subtitle="Upload all the necessary documents for business verification."
      footer={<StepActions backHref="/onboarding" onNext={next} />}
    >
      <Input
        label="GSTIN number"
        required
        name="gstNumber"
        value={gstInfo.gstNumber}
        onChange={(e) => {
          patch({ gstInfo: { gstNumber: e.target.value.toUpperCase() } });
          clearError('gstNumber');
        }}
        error={errors.gstNumber}
        placeholder="07ABCDE1234F1Z5"
        className="mb-[18px]"
      />

      <div className="mb-[22px]">
        <UploadField
          label="Trade license"
          required
          value={files.tradeLicense}
          onChange={(file) => {
            setFile('tradeLicense', file);
            clearError('documents');
          }}
          onError={toast.error}
          placeholder="Tap to upload trade licence"
        />
      </div>

      <div className="mb-[22px]">
        <UploadField
          label="PAN card"
          required
          value={files.panCard}
          onChange={(file) => {
            setFile('panCard', file);
            clearError('documents');
          }}
          onError={toast.error}
          placeholder="Tap to upload PAN card"
        />
        {errors.documents && <FieldError>{errors.documents}</FieldError>}
      </div>

      <div className="mb-[22px]">
        <UploadField
          label="GSTIN certificate"
          value={files.gstCertificate}
          onChange={(file) => setFile('gstCertificate', file)}
          onError={toast.error}
          placeholder="Tap to upload GSTIN certificate"
        />
      </div>

      <div className="mb-1.5">
        <UploadField
          label="Bank proof"
          value={files.bankProof}
          onChange={(file) => setFile('bankProof', file)}
          onError={toast.error}
          placeholder="Tap to upload bank proof"
        />
      </div>

      <div
        className="mt-[26px] mb-5 pt-6"
        style={{ borderTop: '1px solid var(--color-divider)' }}
      >
        <div className="text-[17px] font-bold mb-[3px]">Payout Details</div>
        <div className="text-[13px] text-[var(--color-muted)]">
          Enter your bank details to receive payments for completed services.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-1">
        <Input label="Bank account number" {...bankField('accountNumber')} placeholder="Account number" />
        <Input label="IFSC code" {...bankField('ifsc')} placeholder="IFSC" />
      </div>

      <Input
        label="Name in the bank"
        className="mt-[18px]"
        {...bankField('accountHolderName')}
        placeholder="Account holder name"
      />

      <div className="flex items-center gap-3.5 my-[18px]">
        <div className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
        <span className="text-[12px] font-bold text-[var(--color-disabled)]">OR</span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
      </div>

      <Input label="UPI ID" {...bankField('upi')} placeholder="e.g. name@okaxis" />
      {errors.payout && <FieldError>{errors.payout}</FieldError>}
    </OnboardingShell>
  );
}
