'use client';

import { useRouter } from 'next/navigation';
import { usePortalHeader } from '../../../layout';
import ConfirmationPanel, { ConfirmationAction } from '@/components/bookings/ConfirmationPanel';

export default function JobCompletedPage() {
  const router = useRouter();
  usePortalHeader('Service completed', 'The customer has the health sheet and the final bill');

  return (
    <ConfirmationPanel
      title="Job marked complete"
      body="The customer has been sent the health sheet and the bill. Your payout is released once they confirm the service."
    >
      <ConfirmationAction onClick={() => router.push('/bookings')}>
        Back to bookings
      </ConfirmationAction>
      <ConfirmationAction onClick={() => router.push('/earnings')}>
        View earnings
      </ConfirmationAction>
    </ConfirmationPanel>
  );
}
