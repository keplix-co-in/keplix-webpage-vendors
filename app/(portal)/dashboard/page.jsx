'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, CardHeader, Kicker, EmptyState } from '@/components/ui/Card';
import Badge, { statusTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useBookings, useWalkIns, useEarnings } from '@/lib/queries';
import { bucketJobs } from '@/shared/utils/jobBuckets';
import { formatMoney } from '@/lib/format';
import {
  DASHBOARD_BOOKINGS,
  bookingBadge,
  dateKey,
  formatSlotTime,
  readBooking,
  readWalkIn,
  timeToMinutes,
  todayKey,
} from '@/components/bookings/bookingFields';

// Only the live walk-ins matter here; the app asks for the same slice.
const LIVE_WALK_INS = { status: 'open,in_progress', limit: 100 };

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardPage() {
  const { user, vendorProfile } = useAuth();
  const { data: bookings = [], isLoading } = useBookings(DASHBOARD_BOOKINGS);
  const { data: walkIns = [] } = useWalkIns(LIVE_WALK_INS);
  const { data: earnings } = useEarnings();

  const businessName = vendorProfile?.business_name ?? user?.business_name ?? 'your workshop';

  usePortalHeader(
    `${greeting()}, ${businessName}`,
    new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  );

  const buckets = useMemo(() => bucketJobs(bookings, walkIns), [bookings, walkIns]);

  const todaysJobs = useMemo(() => {
    const today = todayKey();
    return bookings
      .filter((b) => dateKey(b.booking_date) === today)
      .map(readBooking)
      .sort((a, b) => (timeToMinutes(a.time) ?? 0) - (timeToMinutes(b.time) ?? 0));
  }, [bookings]);

  const liveWalkIns = useMemo(
    () => walkIns.map(readWalkIn).filter((w) => ['open', 'in_progress'].includes(w.status)),
    [walkIns]
  );

  const stats = [
    { label: 'PENDING', value: buckets.pendingCount, note: 'Requests awaiting a decision', color: 'var(--color-danger)' },
    { label: 'ONGOING', value: buckets.ongoing.length, note: 'In the bay right now', color: 'var(--color-primary)' },
    { label: 'IN QUEUE', value: buckets.queue.length, note: 'Accepted, waiting for their slot', color: 'var(--color-ink)' },
  ];

  return (
    <div>
      {buckets.awaitingDecision.length > 0 && (
        <div
          className="bg-white rounded-[14px] px-5 py-4 flex items-center gap-4 mb-5 flex-wrap"
          style={{
            border: '1px solid var(--color-primary-tint-border)',
            borderLeft: '4px solid var(--color-primary)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            className="w-[42px] h-[42px] rounded-[var(--radius-well)] flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary-tint)' }}
          >
            <Clock size={20} color="var(--color-primary)" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-[14px] font-bold">
              {buckets.awaitingDecision.length} service request
              {buckets.awaitingDecision.length === 1 ? '' : 's'} awaiting your decision
            </div>
            <div className="text-[12.5px] text-[var(--color-muted)]">
              Accept or decline so the customer can pay and the slot gets locked in.
            </div>
          </div>
          <Link href="/bookings">
            <Button size="md">Review requests</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-5 max-[1000px]:grid-cols-2">
        <div
          className="rounded-[var(--radius-portal)] p-5 text-white"
          style={{
            background: 'linear-gradient(135deg,#4E46B4,#3E3792)',
            boxShadow: 'var(--shadow-feature)',
          }}
        >
          <div className="text-[10.5px] tracking-[1px] font-bold opacity-80 mb-2">TOTAL EARNINGS</div>
          <div className="text-[30px] font-bold tracking-[-1px] leading-none">
            {formatMoney(earnings?.total_earnings ?? 0)}
          </div>
          <div className="text-[11.5px] mt-2.5 opacity-80">
            {formatMoney(earnings?.today_earnings ?? 0)} today
          </div>
        </div>

        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <Kicker className="mb-2">{stat.label}</Kicker>
            <div
              className="text-[30px] font-bold tracking-[-1px] leading-none"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-[11.5px] text-[var(--color-muted)] mt-2.5">{stat.note}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 max-[1000px]:grid-cols-[minmax(0,1fr)]" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}>
        <div className="min-w-0">
          <Card className="mb-5" padded={false}>
            <div
              className="px-[22px] py-[18px] flex justify-between items-center gap-3"
              style={{ borderBottom: '1px solid var(--color-divider)' }}
            >
              <div className="text-[15px] font-bold">Today&apos;s schedule</div>
              <Link href="/bookings" className="text-[12.5px] font-bold text-[var(--color-primary)]">
                View all bookings →
              </Link>
            </div>

            {isLoading ? (
              <div className="px-[22px] py-8 text-[13px] text-[var(--color-muted)]">Loading…</div>
            ) : todaysJobs.length === 0 ? (
              <EmptyState
                title="Nothing booked for today"
                body="New requests appear here the moment a customer books you."
              />
            ) : (
              todaysJobs.map((job) => {
                const badge = bookingBadge(job);
                return (
                  <Link
                    key={job.id}
                    href={`/bookings/${job.id}`}
                    className="px-[22px] py-4 flex items-center gap-4 flex-wrap"
                    style={{ borderBottom: '1px solid var(--color-canvas)' }}
                  >
                    <div className="w-[72px] text-center shrink-0">
                      <div className="text-[13.5px] font-bold">{formatSlotTime(job.time)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-bold truncate">{job.serviceName}</div>
                      <div className="text-[12px] text-[var(--color-muted)] truncate">
                        {job.customerName}
                        {job.customerPhone ? ` · ${job.customerPhone}` : ''}
                      </div>
                    </div>
                    <div className="text-[13.5px] font-bold">{formatMoney(job.price)}</div>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </Link>
                );
              })
            )}
          </Card>
        </div>

        <div className="min-w-0">
          <Card className="mb-5">
            <div className="text-[15px] font-bold mb-1.5">Walk-in customer</div>
            <div className="text-[12.5px] text-[var(--color-muted)] leading-[1.5] mb-4">
              Car already on the forecourt? Log the job, send a tracking link, close it with the
              amount collected.
            </div>
            <Link href="/walk-in/new">
              <Button fullWidth size="md">
                + Add walk-in job
              </Button>
            </Link>
          </Card>

          <Card className="mb-5">
            <CardHeader title="Live walk-ins" />
            {liveWalkIns.length === 0 ? (
              <div className="text-[12.5px] text-[var(--color-muted)]">
                No walk-ins in the garage right now.
              </div>
            ) : (
              liveWalkIns.map((walkIn) => (
                <div
                  key={walkIn.id}
                  className="rounded-[14px] p-3.5 mb-2.5"
                  style={{ border: '1px solid var(--color-divider)' }}
                >
                  <div className="flex justify-between items-center gap-2 mb-1.5">
                    <div className="text-[13px] font-bold truncate">
                      {walkIn.registration ?? 'Walk-in'}
                    </div>
                    <Badge tone={statusTone(walkIn.status)}>
                      {walkIn.status === 'in_progress' ? 'In progress' : 'Open'}
                    </Badge>
                  </div>
                  <div className="text-[12px] text-[var(--color-muted)] mb-3 truncate">
                    {walkIn.customerName}
                    {walkIn.vehicleLabel ? ` · ${walkIn.vehicleLabel}` : ''}
                  </div>
                  <Link href={`/walk-in/${walkIn.id}`}>
                    <Button variant="tint" size="sm" fullWidth>
                      {walkIn.status === 'in_progress' ? 'Close job' : 'Start job'}
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </Card>

          {Number(earnings?.pending_earnings) > 0 && (
            <div
              className="rounded-[var(--radius-portal)] p-5"
              style={{ background: 'var(--color-warning-tint)', border: '1px solid var(--color-warning-tint-strong)' }}
            >
              <div className="text-[13.5px] font-bold text-[var(--color-warning-dark)] mb-1.5">
                {formatMoney(earnings.pending_earnings)} payout processing
              </div>
              <div className="text-[12px] text-[var(--color-warning-text)] leading-[1.5]">
                Released to your saved payout account after the service is confirmed.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
