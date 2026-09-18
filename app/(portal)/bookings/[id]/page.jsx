'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../../layout';
import { Card, CardHeader, EmptyState } from '@/components/ui/Card';
import Badge, { statusTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/lib/queries';
import { bookingsAPI } from '@/api/bookings';
import JobTimeline from '@/components/bookings/JobTimeline';
import { readBooking } from '@/components/bookings/bookingFields';
import { formatMoney, formatRelativeDay } from '@/lib/format';
import { formatDuration } from '@/shared/utils/duration';

const Row = ({ label, value }) => (
  <div
    className="flex items-center justify-between gap-4 py-3"
    style={{ borderBottom: '1px solid var(--color-divider)' }}
  >
    <span className="text-[12.5px] text-[var(--color-muted)]">{label}</span>
    <span className="text-[13px] font-semibold text-right min-w-0 truncate">{value ?? '—'}</span>
  </div>
);

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { vendorId } = useAuth();
  const [busy, setBusy] = useState(false);

  const { data: rawBookings = [], isLoading } = useBookings();

  // The vendor bookings endpoint returns the whole list; there is no
  // single-booking route for vendors, so the row is picked out of it.
  const booking = useMemo(() => {
    const match = rawBookings.find((b) => String(b.id) === String(id));
    return match ? readBooking(match) : null;
  }, [rawBookings, id]);

  usePortalHeader(
    booking ? `Booking ${booking.token}` : 'Booking',
    booking ? `${booking.serviceName} · ${booking.customerName}` : ''
  );

  if (isLoading) {
    return <div className="text-[13px] text-[var(--color-muted)]">Loading booking…</div>;
  }

  if (!booking) {
    return (
      <Card>
        <EmptyState
          title="Booking not found"
          body="It may have been cancelled, or it belongs to another workshop."
          action={
            <Link href="/bookings">
              <Button size="md">Back to bookings</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['bookings'] });

  const accept = async () => {
    setBusy(true);
    const result = await bookingsAPI.respondToServiceRequest(vendorId, booking.id, 'accepted');
    setBusy(false);
    if (result?.success) {
      refresh();
      toast.success('Request accepted — the customer can pay now.');
    } else {
      toast.error(result?.error || 'Could not accept this request.');
    }
  };

  const requestEarlyStart = async () => {
    setBusy(true);
    const result = await bookingsAPI.requestEarlyStart(vendorId, booking.id);
    setBusy(false);
    if (result?.success) {
      refresh();
      toast.success('Early start requested — the job stays booked until the customer agrees.');
    } else {
      toast.error(result?.error || 'Could not request an early start.');
    }
  };

  const isPending = booking.vendorStatus === 'pending';
  const isAccepted = booking.vendorStatus === 'accepted';
  const isOngoing = booking.status === 'in_progress';

  return (
    <div
      className="grid gap-6 items-start max-[880px]:grid-cols-[minmax(0,1fr)]"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}
    >
      <div className="min-w-0">
        <Card className="mb-5">
          <CardHeader
            title="Booking details"
            action={<Badge tone={statusTone(booking.status)}>{booking.status || '—'}</Badge>}
          />
          <Row label="Token" value={booking.token} />
          <Row label="Service" value={booking.serviceName} />
          <Row label="Category" value={booking.category} />
          <Row
            label="Slot"
            value={
              booking.date
                ? `${formatRelativeDay(booking.date)}${booking.time ? ` · ${booking.time}` : ''}`
                : booking.time
            }
          />
          <Row label="Duration" value={formatDuration(booking.durationMinutes) ?? '—'} />
          <Row label="Vendor status" value={booking.vendorStatus || '—'} />
          <Row label="Booking status" value={booking.status || '—'} />
          <Row label="Amount" value={formatMoney(booking.price)} />
        </Card>

        <Card>
          <CardHeader title="Customer & vehicle" />
          <Row label="Customer" value={booking.customerName} />
          <Row label="Mobile" value={booking.customerPhone} />
          <Row
            label="Vehicle"
            value={[booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(' ') || '—'}
          />
          <Row label="Registration" value={booking.registration} />
          <Row label="Odometer" value={booking.odometer ? `${booking.odometer} km` : '—'} />
        </Card>
      </div>

      <div className="min-w-0">
        <Card className="mb-5">
          <CardHeader title="Job timeline" />
          <JobTimeline booking={booking} />
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <div className="flex flex-col gap-2.5">
            {isPending && (
              <>
                <Button fullWidth loading={busy} onClick={accept}>
                  Accept request
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  className="!bg-[var(--color-danger-tint)] !text-[var(--color-danger)] !border-[var(--color-danger-tint-strong)]"
                  onClick={() => router.push(`/bookings/${booking.id}/reject`)}
                >
                  Decline
                </Button>
              </>
            )}

            {isAccepted && !isOngoing && (
              /* An early start is a request to the customer, never a unilateral
                 start — the car may not be there yet. */
              <Button
                variant="outline"
                fullWidth
                loading={busy}
                disabled={booking.earlyStartRequested}
                onClick={requestEarlyStart}
              >
                {booking.earlyStartRequested ? 'Early start requested' : 'Request early start'}
              </Button>
            )}

            {isOngoing && (
              <Button variant="teal" fullWidth onClick={() => router.push(`/bookings/${booking.id}/inspection`)}>
                Mark done
              </Button>
            )}

            <Link href={`/messages?booking=${booking.id}`}>
              <Button variant="outline" fullWidth>
                Message customer
              </Button>
            </Link>
          </div>

          {isOngoing && (
            <p className="text-[11.5px] text-[var(--color-muted)] leading-[1.6] mt-4">
              Marking done opens the vehicle health sheet. It is required before the job can be
              closed and is sent to the customer as a digital report.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
