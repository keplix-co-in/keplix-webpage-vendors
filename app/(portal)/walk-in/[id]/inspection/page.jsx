'use client';

import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../../../layout';
import InspectionSheet from '@/components/bookings/InspectionSheet';

export default function WalkInInspectionPage() {
  return (
    <Suspense fallback={null}>
      <WalkInInspection />
    </Suspense>
  );
}

function WalkInInspection() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  usePortalHeader(
    'Vehicle health inspection',
    'Required before a job can be closed — sent to the customer as a digital report'
  );

  return (
    <InspectionSheet
      walkInJobId={id}
      onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['walk-in', id] });
        queryClient.invalidateQueries({ queryKey: ['walk-ins'] });

        // Came here because the close request hit the health-sheet gate — go
        // back and finish it with the amount the vendor already entered.
        if (searchParams.get('next') === 'close') {
          router.replace(`/walk-in/${id}/close?retry=1`);
          return;
        }

        router.replace(`/walk-in/${id}/close`);
      }}
    />
  );
}
