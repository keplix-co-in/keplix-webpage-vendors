'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../../../layout';
import InspectionSheet from '@/components/bookings/InspectionSheet';

export default function BookingInspectionPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  usePortalHeader(
    'Vehicle health inspection',
    'Required before a job can be closed — sent to the customer as a digital report'
  );

  return (
    <InspectionSheet
      bookingId={id}
      onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        // This screen only records the inspection; completion still owns
        // marking the booking done.
        router.replace(`/bookings/${id}/completion?from=inspection`);
      }}
    />
  );
}
