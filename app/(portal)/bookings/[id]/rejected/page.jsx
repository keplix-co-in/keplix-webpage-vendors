'use client';

import { useRouter } from 'next/navigation';
import { usePortalHeader } from '../../../layout';
import ConfirmationPanel, { ConfirmationAction } from '@/components/bookings/ConfirmationPanel';

export default function RejectionSentPage() {
  const router = useRouter();
  usePortalHeader('Rejection sent', 'The customer has been notified and the slot is released');

  return (
    <ConfirmationPanel
      title="Rejection sent to the customer"
      body="The slot is free again. Declining does not affect your rating, but frequent declines lower how often you appear in search."
    >
      <ConfirmationAction onClick={() => router.push('/bookings')}>
        Back to bookings
      </ConfirmationAction>
      <ConfirmationAction onClick={() => router.push('/dashboard')}>Dashboard</ConfirmationAction>
    </ConfirmationPanel>
  );
}
