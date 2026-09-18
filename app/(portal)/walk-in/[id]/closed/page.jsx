'use client';

import { useRouter } from 'next/navigation';
import { usePortalHeader } from '../../../layout';
import ConfirmationPanel, { ConfirmationAction } from '@/components/bookings/ConfirmationPanel';

export default function WalkInClosedPage() {
  const router = useRouter();
  usePortalHeader('Walk-in closed', 'The job is complete and the customer has the health sheet');

  return (
    <ConfirmationPanel
      tone="teal"
      title="Walk-in job closed"
      body="The amount collected is recorded and the customer has been sent their digital health sheet."
    >
      <ConfirmationAction onClick={() => router.push('/walk-in/new')}>
        Add another walk-in
      </ConfirmationAction>
      <ConfirmationAction onClick={() => router.push('/bookings')}>
        Back to bookings
      </ConfirmationAction>
    </ConfirmationPanel>
  );
}
