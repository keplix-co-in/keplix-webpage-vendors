'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../../layout';
import { Card, CardHeader, EmptyState } from '@/components/ui/Card';
import Badge, { statusTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { walkInsAPI } from '@/api/bookings';
import { readWalkIn } from '@/components/bookings/bookingFields';
import { formatMoney, formatDateTime } from '@/lib/format';

const Row = ({ label, value }) => (
  <div
    className="flex items-center justify-between gap-4 py-3"
    style={{ borderBottom: '1px solid var(--color-divider)' }}
  >
    <span className="text-[12.5px] text-[var(--color-muted)]">{label}</span>
    <span className="text-[13px] font-semibold text-right min-w-0 truncate">{value ?? '—'}</span>
  </div>
);

export default function WalkInDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['walk-in', id],
    queryFn: async () => {
      const result = await walkInsAPI.getWalkInJob(id);
      if (!result?.success) return null;
      const raw = result.data?.job ?? result.data;
      return raw ? readWalkIn(raw) : null;
    },
  });

  usePortalHeader(
    job ? `Walk-in · ${job.registration ?? job.customerName}` : 'Walk-in',
    job ? job.customerName : ''
  );

  if (isLoading) {
    return <div className="text-[13px] text-[var(--color-muted)]">Loading job…</div>;
  }

  if (!job) {
    return (
      <Card>
        <EmptyState
          title="Walk-in not found"
          body="It may have been closed already."
          action={
            <Link href="/bookings">
              <Button size="md">Back to bookings</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['walk-in', id] });
    queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
  };

  const start = async () => {
    setBusy(true);
    const result = await walkInsAPI.updateWalkInJobStatus(id, { status: 'in_progress' });
    setBusy(false);
    if (result?.success) {
      refresh();
      toast.success('Job started.');
    } else {
      toast.error(result?.error || 'Could not start this job.');
    }
  };

  const resendNotification = async () => {
    setBusy(true);
    const result = await walkInsAPI.resendWalkInJobNotification(id);
    setBusy(false);
    if (result?.success) {
      refresh();
      toast.success('Tracking link sent again.');
    } else {
      toast.error(result?.error || 'Could not resend the tracking link.');
    }
  };

  return (
    <div
      className="grid gap-6 items-start max-[880px]:grid-cols-[minmax(0,1fr)]"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}
    >
      <div className="min-w-0">
        <Card className="mb-5">
          <CardHeader
            title="Job details"
            action={
              <Badge tone={statusTone(job.status)}>
                {job.status === 'in_progress' ? 'In progress' : job.status}
              </Badge>
            }
          />
          <Row label="Customer" value={job.customerName} />
          <Row label="Mobile" value={job.customerPhone} />
          <Row label="Car number" value={job.registration} />
          <Row label="Model" value={job.vehicleModel} />
          <Row label="What it is in for" value={job.description} />
          <Row label="Checked in" value={job.createdAt ? formatDateTime(job.createdAt) : '—'} />
          {job.startedAt && <Row label="Started" value={formatDateTime(job.startedAt)} />}
          {job.completedAt && <Row label="Closed" value={formatDateTime(job.completedAt)} />}
          {job.amountCollected != null && (
            <Row
              label="Amount collected"
              value={`${formatMoney(job.amountCollected)}${job.paymentMode ? ` · ${job.paymentMode}` : ''}`}
            />
          )}
        </Card>

        {job.services.length > 0 && (
          <Card>
            <CardHeader title="Services" />
            {job.services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-3 py-2.5"
                style={{ borderBottom: '1px solid var(--color-divider)' }}
              >
                <span className="text-[13px] truncate">{service.name}</span>
                <span className="text-[13px] font-semibold shrink-0">
                  {service.price != null ? formatMoney(service.price) : '—'}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div className="min-w-0">
        <Card>
          <CardHeader title="Actions" />
          <div className="flex flex-col gap-2.5">
            {/* A walk-in has no accept step — the car is already here. */}
            {job.status === 'open' && (
              <Button fullWidth loading={busy} onClick={start}>
                Start job
              </Button>
            )}

            {job.status === 'in_progress' && (
              <Button variant="teal" fullWidth onClick={() => router.push(`/walk-in/${id}/close`)}>
                Close job
              </Button>
            )}

            {job.status !== 'completed' && (
              <Button variant="outline" fullWidth onClick={() => router.push(`/walk-in/${id}/inspection`)}>
                {job.hasHealthSheet ? 'View health sheet' : 'Fill health sheet'}
              </Button>
            )}

            {job.notificationStatus === 'failed' && (
              <Button variant="outline" fullWidth loading={busy} onClick={resendNotification}>
                Resend tracking link
              </Button>
            )}
          </div>

          {job.notificationStatus === 'failed' && (
            <p className="text-[11.5px] text-[var(--color-danger)] leading-[1.6] mt-4 font-bold">
              The tracking SMS did not reach the customer.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
