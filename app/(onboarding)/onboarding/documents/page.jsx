'use client';

import { useRouter } from 'next/navigation';
import OnboardingShell, { StepActions } from '@/components/onboarding/OnboardingShell';
import UploadField from '@/components/ui/Upload';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';

export default function DocumentsUploadPage() {
  const router = useRouter();
  const toast = useToast();
  const { draft, files, patch, setFile } = useDraft();
  const { gstInfo, bankDetails } = draft;

  const bankComplete = Boolean(
    bankDetails.accountNumber && bankDetails.ifsc && bankDetails.accountHolderName
  );

  const next = () => {
    if (!gstInfo.gstNumber) {
      toast.error('Your GSTIN number is required.');
      return;
    }
    if (!files.panCard || !files.tradeLicense) {
      toast.error('Both the PAN card and the trade licence have to be uploaded.');
      return;
    }
    // Either a full bank account or a UPI ID — one payout destination is enough,
    // but a half-filled bank block is not.
    if (!bankComplete && !bankDetails.upi) {
      toast.error('Add your bank details or a UPI ID so payouts can reach you.');
      return;
    }
    router.push('/onboarding');
  };

  const bankField = (key) => ({
    name: key,
    value: bankDetails[key],
    onChange: (e) => patch({ bankDetails: { [key]: e.target.value } }),
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
        onChange={(e) => patch({ gstInfo: { gstNumber: e.target.value.toUpperCase() } })}
        placeholder="07ABCDE1234F1Z5"
        className="mb-[18px]"
      />

      <div className="mb-[22px]">
        <UploadField
          label="Trade license"
          required
          value={files.tradeLicense}
          onChange={(file) => setFile('tradeLicense', file)}
          onError={toast.error}
          placeholder="Tap to upload trade licence"
        />
      </div>

      <div className="mb-[22px]">
        <UploadField
          label="PAN card"
          required
          value={files.panCard}
          onChange={(file) => setFile('panCard', file)}
          onError={toast.error}
          placeholder="Tap to upload PAN card"
        />
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
    </OnboardingShell>
  );
}
