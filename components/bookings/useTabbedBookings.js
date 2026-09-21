'use client';

import { useMemo } from 'react';
import { useBookings } from '@/lib/queries';
import { BOOKING_TABS } from './bookingFields';

const TAB_LIMIT = 200;

/**
 * One request per tab, each with that tab's own status filter, as the app does.
 *
 * A single unfiltered request cannot serve every tab: with no `status` the
 * backend returns only bookings dated today or later, so Completed and Canceled
 * would always come back empty. The four calls are written out rather than
 * looped because hooks cannot be called in a loop.
 */
export function useTabbedBookings() {
  const [ongoing, upcoming, completed, canceled] = BOOKING_TABS.map((tab) => ({
    status: tab.apiStatus,
    limit: TAB_LIMIT,
  }));

  const ongoingQuery = useBookings(ongoing);
  const upcomingQuery = useBookings(upcoming);
  const completedQuery = useBookings(completed);
  const canceledQuery = useBookings(canceled);

  const bookings = useMemo(
    () => [
      ...(ongoingQuery.data ?? []),
      ...(upcomingQuery.data ?? []),
      ...(completedQuery.data ?? []),
      ...(canceledQuery.data ?? []),
    ],
    [ongoingQuery.data, upcomingQuery.data, completedQuery.data, canceledQuery.data]
  );

  return {
    bookings,
    isLoading:
      ongoingQuery.isLoading ||
      upcomingQuery.isLoading ||
      completedQuery.isLoading ||
      canceledQuery.isLoading,
  };
}

export default useTabbedBookings;
