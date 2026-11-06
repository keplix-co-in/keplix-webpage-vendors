'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import OtpInput from '@/components/ui/OtpInput';
import Button from '@/components/ui/Button';
import { PAYOUT_HOLD_NOTICE } from '@/lib/payoutChange';

/** Step-up OTP dialog for payout detail changes (A-023). Props: usePayoutOtp().modalProps. */
export default function PayoutOtpModal({
  visible,
  sending,
  submitting,
  error,
  cooldown,
  onResend,
  onSubmit,
  onClose,
}) {
  const [code, setCode] = useState('');
  // The hook closes the modal itself on success/failure; clear the code then
  // too (render-time reset) so a reopened dialog doesn't show the used code.
  const [wasVisible, setWasVisible] = useState(visible);
  if (wasVisible !== visible) {
    setWasVisible(visible);
    if (!visible) setCode('');
  }

  const handleClose = () => {
    setCode('');
    onClose();
  };

  let resendLabel = 'Resend code';
  if (sending) resendLabel = 'Sending…';
  else if (cooldown > 0) resendLabel = `Resend code in ${cooldown}s`;

  return (
    <Modal
      open={visible}
      onClose={handleClose}
      title="Confirm payout change"
      footer={
        <>
          <Button type="button" variant="outline" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="md"
            loading={submitting}
            disabled={code.length !== 6 || sending}
            onClick={() => onSubmit(code)}
          >
            Verify and save
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-[var(--color-muted)] mb-4">
        We emailed a 6-digit code to your account email. Enter it to change where your payouts go.
      </p>
      <OtpInput value={code} onChange={setCode} error={Boolean(error)} />
      {error && (
        <p role="alert" className="text-[12.5px] text-[var(--color-danger)] mt-3">
          {error}
        </p>
      )}
      <p className="text-[12px] text-[var(--color-muted)] mt-3">{PAYOUT_HOLD_NOTICE}</p>
      <button
        type="button"
        className="mt-3 text-[12.5px] font-bold text-[var(--color-primary)] disabled:opacity-50 cursor-pointer"
        disabled={sending || cooldown > 0}
        onClick={onResend}
      >
        {resendLabel}
      </button>
    </Modal>
  );
}
