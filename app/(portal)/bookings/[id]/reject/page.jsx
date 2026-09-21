'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../../../layout';
import { Card, EmptyState } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/lib/queries';
import { bookingsAPI } from '@/api/bookings';
import { ANY_BOOKING, formatSlotTime, readBooking } from '@/components/bookings/bookingFields';
import { REJECTION_REASONS, DEFAULT_REJECTION_REASON } from '@/shared/constants/rejectReasons';
import { formatMoney, formatRelativeDay } from '@/lib/format';
import { rules, validate } from '@/shared/utils/validation';

const OTHER_REASON = 'Other Reason';

const SCHEMA = {
  reason: [(value) => (REJECTION_REASONS.includes(value) ? null : 'Choose a reason.')],
  // "Other" with nothing written says no more than declining silently.
  details: [
    (value, values) =>
      values.reason === OTHER_REASON && !String(value ?? '').trim()
        ? 'Tell the customer why, so the slot is not declined without explanation.'
        : null,
    rules.maxLength(2000, 'Details'),
  ],
};

export default function RejectOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { vendorId } = useAuth();

  const [reason, setReason] = useState(DEFAULT_REJECTION_REASON);
  const [details, setDetails] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // ANY_BOOKING: the default hides bookings dated before today, so a pending
  // request for an earlier slot would read as not found.
  const { data: rawBookings = [] } = useBookings(ANY_BOOKING);
  const booking = useMemo(() => {
    const match = rawBookings.find((b) => String(b.id) === String(id));
    return match ? readBooking(match) : null;
  }, [rawBookings, id]);

  usePortalHeader('Reason for rejection', booking ? `${booking.token} · ${booking.serviceName}` : '');

  const submit = async () => {
    const { errors: nextErrors, isValid } = validate({ reason, details }, SCHEMA);
    setErrors(nextErrors);
    if (!isValid) return;

    setBusy(true);
    // Only `vendor_status` is read by the backend's respond handler — the
    // reason is collected for the customer-facing message the app shows, but
    // nothing persists it yet, exactly as on mobile.
    const result = await bookingsAPI.respondToServiceRequest(vendorId, id, 'rejected', {
      rejection_reason: reason === OTHER_REASON ? details.trim() : reason,
    });
    setBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.replace(`/bookings/${id}/rejected`);
    } else {
      toast.error(result?.error || 'Could not decline this request.');
    }
  };

  if (!booking) {
    return (
      <Card>
        <EmptyState
          title="Booking not found"
          body="This request may already have been answered."
          action={
            <Link href="/bookings">
              <Button size="md">Back to bookings</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="max-w-[640px]">
      <Card padded={false} className="overflow-hidden">
        <div
          className="px-6 py-[18px] text-white"
          style={{ background: 'var(--color-danger)' }}
        >
          <div className="text-[16px] font-bold">Decline this request?</div>
          <div className="text-[12.5px] opacity-90 mt-0.5">
            The customer is told straight away and the slot is released.
          </div>
        </div>

        <div className="px-6 py-6">
          <div
            className="rounded-[var(--radius-small)] p-4 mb-6"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-line)' }}
          >
            <div className="text-[13.5px] font-bold">{booking.serviceName}</div>
            <div className="text-[12px] text-[var(--color-muted)] mt-1">
              {booking.token} · {booking.customerName}
              {booking.date ? ` · ${formatRelativeDay(booking.date)}` : ''}
              {booking.time ? ` ${formatSlotTime(booking.time)}` : ''}
            </div>
            <div className="text-[13.5px] font-bold mt-2">{formatMoney(booking.price)}</div>
          </div>

          <fieldset className="border-0 p-0 m-0">
            <legend className="text-[12.5px] font-bold text-[var(--color-ink-body)] mb-3">
              Why are you declining?
            </legend>

            {REJECTION_REASONS.map((option) => {
              const selected = reason === option;
              return (
                <label
                  key={option}
                  className="flex items-center gap-3 px-4 py-3 mb-2 rounded-[var(--radius-small)] cursor-pointer"
                  style={{
                    border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-line)'}`,
                    background: selected ? 'var(--color-primary-tint)' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option}
                    checked={selected}
                    onChange={() => {
                      setReason(option);
                      setErrors({});
                    }}
                    className="accent-[var(--color-primary)]"
                  />
                  <span
                    className="text-[13.5px]"
                    style={{
                      fontWeight: selected ? 700 : 500,
                      color: selected ? 'var(--color-primary-dark)' : 'var(--color-ink-body)',
                    }}
                  >
                    {option}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <Textarea
            label={reason === OTHER_REASON ? 'Tell the customer why' : 'Anything to add?'}
            required={reason === OTHER_REASON}
            placeholder="Specify here"
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              setErrors((prev) => (prev.details ? { ...prev, details: undefined } : prev));
            }}
            error={errors.details}
            className="mt-4"
          />
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end flex-wrap">
          <Button variant="outline" size="md" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button variant="danger" size="md" loading={busy} onClick={submit}>
            Submit
          </Button>
        </div>
      </Card>
    </div>
  );
}
