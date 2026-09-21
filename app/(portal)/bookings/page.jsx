'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, EmptyState } from '@/components/ui/Card';
import Badge, { statusTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Chip } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useWalkIns } from '@/lib/queries';
import { bookingsAPI, walkInsAPI } from '@/api/bookings';
import { bucketJobs } from '@/shared/utils/jobBuckets';
import { formatMoney, formatRelativeDay, initialsOf } from '@/lib/format';
import {
  readBooking,
  readWalkIn,
  bookingBadge,
  dateKey,
  formatSlotTime,
  BOOKING_TABS,
} from '@/components/bookings/bookingFields';
import { useTabbedBookings } from '@/components/bookings/useTabbedBookings';

const WALK_IN_PARAMS = { limit: 100 };

/** Seven-day strip, today in the middle of the week like the design. */
const buildDays = (bookings) => {
  const counts = new Map();
  bookings.forEach((b) => {
    const key = dateKey(b.date);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 2 + index);
    // en-CA is YYYY-MM-DD, the same shape booking_date's ISO date part has.
    const key = date.toLocaleDateString('en-CA');
    const jobs = counts.get(key) ?? 0;
    return {
      key,
      dow: date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase(),
      date: date.getDate(),
      jobs: jobs === 0 ? 'No jobs' : `${jobs} job${jobs === 1 ? '' : 's'}`,
    };
  });
};

export default function BookingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { vendorId } = useAuth();

  const [tab, setTab] = useState('upcoming');
  const [day, setDay] = useState(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const { bookings: rawBookings, isLoading } = useTabbedBookings();
  const { data: rawWalkIns = [] } = useWalkIns(WALK_IN_PARAMS);

  usePortalHeader('Bookings', 'Accept requests, track live jobs and close them out');

  const bookings = useMemo(() => rawBookings.map(readBooking), [rawBookings]);
  const walkIns = useMemo(() => rawWalkIns.map(readWalkIn), [rawWalkIns]);
  const buckets = useMemo(() => bucketJobs(rawBookings, rawWalkIns), [rawBookings, rawWalkIns]);

  const counts = useMemo(() => {
    const byTab = (id) => {
      const statuses = BOOKING_TABS.find((t) => t.id === id).apiStatus.split(',');
      return bookings.filter((b) => statuses.includes(b.status)).length;
    };
    return {
      ongoing: byTab('ongoing'),
      upcoming: byTab('upcoming'),
      completed: byTab('completed'),
      canceled: byTab('canceled'),
    };
  }, [bookings]);

  const rows = useMemo(() => {
    const statuses = BOOKING_TABS.find((t) => t.id === tab).apiStatus.split(',');
    const term = search.trim().toLowerCase();

    return bookings
      .filter((b) => statuses.includes(b.status))
      .filter((b) => (day ? dateKey(b.date) === day : true))
      .filter((b) =>
        term
          ? [b.customerName, b.customerPhone, b.serviceName, b.token]
              .filter(Boolean)
              .some((field) => String(field).toLowerCase().includes(term))
          : true
      );
  }, [bookings, tab, day, search]);

  const liveWalkIns = useMemo(
    () => walkIns.filter((w) => (tab === 'completed' ? w.status === 'completed' : ['open', 'in_progress'].includes(w.status))),
    [walkIns, tab]
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
  };

  const respond = async (booking, decision) => {
    setBusyId(booking.id);
    const result = await bookingsAPI.respondToServiceRequest(vendorId, booking.id, decision);
    setBusyId(null);

    if (result?.success) {
      refresh();
      toast.success(decision === 'accepted' ? 'Request accepted.' : 'Request declined.');
    } else {
      toast.error(result?.error || 'Could not update this request.');
    }
  };

  const startWalkIn = async (job) => {
    setBusyId(`walkin-${job.id}`);
    const result = await walkInsAPI.updateWalkInJobStatus(job.id, { status: 'in_progress' });
    setBusyId(null);

    if (result?.success) {
      refresh();
      toast.success('Job started.');
    } else {
      toast.error(result?.error || 'Could not start this job.');
    }
  };

  const days = buildDays(bookings);

  return (
    <div>
      <Card className="mb-5 flex items-center gap-[18px] flex-wrap" padded={false}>
        <div className="flex gap-2 flex-wrap px-[22px] py-[18px]">
          {BOOKING_TABS.map((t) => (
            <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label} <span className="opacity-60">{counts[t.id]}</span>
            </Chip>
          ))}
        </div>
        <div className="flex-1" />
        <div
          className="flex items-center gap-2 rounded-[var(--radius-pill)] px-3.5 py-2 min-w-[220px] mr-[22px] max-[880px]:mx-[22px] max-[880px]:mb-[18px]"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <Search size={15} color="var(--color-disabled)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, service or token"
            aria-label="Search bookings"
            className="flex-1 min-w-0 text-[12.5px] outline-none bg-transparent placeholder:text-[var(--color-disabled)]"
          />
        </div>
      </Card>

      <Card className="mb-5 flex gap-2.5 overflow-x-auto kx-scroll" padded={false}>
        <div className="flex gap-2.5 px-[22px] py-4">
          {days.map((d) => {
            const active = day === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setDay(active ? null : d.key)}
                className="shrink-0 w-[62px] rounded-[14px] py-2.5 cursor-pointer"
                style={{
                  border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-line)'}`,
                  background: active ? 'var(--color-primary)' : 'white',
                  color: active ? 'white' : 'var(--color-ink-body)',
                }}
              >
                <div className="text-[10.5px] font-semibold opacity-75">{d.dow}</div>
                <div className="text-[17px] font-bold">{d.date}</div>
                <div className="text-[10px] opacity-75">{d.jobs}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card padded={false}>
        <div
          className="grid gap-3.5 px-[22px] py-3.5 text-[11px] font-bold tracking-[.6px] text-[var(--color-muted)] max-[880px]:hidden"
          style={{
            gridTemplateColumns: '1.4fr 1.1fr .9fr .8fr 1.5fr',
            background: 'var(--color-canvas)',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          <div>SERVICE</div>
          <div>CUSTOMER</div>
          <div>SLOT</div>
          <div>AMOUNT</div>
          <div className="text-right">ACTION</div>
        </div>

        {isLoading ? (
          <div className="px-[22px] py-8 text-[13px] text-[var(--color-muted)]">Loading bookings…</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing in this tab"
            body={
              tab === 'upcoming'
                ? 'New requests land here as soon as a customer books you.'
                : 'Jobs move through here as you work them.'
            }
          />
        ) : (
          rows.map((booking) => {
            const isPending = booking.vendorStatus === 'pending';
            const isOngoing = booking.status === 'in_progress';
            const busy = busyId === booking.id;

            return (
              <div
                key={booking.id}
                className="grid gap-3.5 px-[22px] py-4 items-center max-[880px]:grid-cols-[minmax(0,1fr)]"
                style={{
                  gridTemplateColumns: '1.4fr 1.1fr .9fr .8fr 1.5fr',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <div className="min-w-0">
                  <Link href={`/bookings/${booking.id}`} className="text-[13.5px] font-bold hover:underline">
                    {booking.serviceName}
                  </Link>
                  <div className="text-[11.5px] text-[var(--color-disabled)]">
                    {booking.token} · {booking.category}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-[30px] h-[30px] rounded-full text-[12px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
                  >
                    {initialsOf(booking.customerName)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{booking.customerName}</div>
                    <div className="text-[11.5px] text-[var(--color-disabled)] truncate">
                      {booking.customerPhone ?? '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[13px] font-semibold">{formatSlotTime(booking.time)}</div>
                  <div className="text-[11.5px] text-[var(--color-disabled)]">
                    {booking.date ? formatRelativeDay(booking.date) : ''}
                  </div>
                </div>

                <div className="text-[13.5px] font-bold">{formatMoney(booking.price)}</div>

                <div className="flex gap-2 justify-end flex-wrap max-[880px]:justify-start">
                  {isPending && (
                    <>
                      <Link href={`/bookings/${booking.id}/reject`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="!bg-[var(--color-danger-tint)] !text-[var(--color-danger)] !border-[var(--color-danger-tint-strong)]"
                        >
                          Decline
                        </Button>
                      </Link>
                      <Button size="sm" loading={busy} onClick={() => respond(booking, 'accepted')}>
                        Accept
                      </Button>
                    </>
                  )}

                  {isOngoing && (
                    <>
                      <Link href={`/messages?booking=${booking.id}`}>
                        <Button size="sm" variant="outline">
                          Message
                        </Button>
                      </Link>
                      {/* Mark done always runs the health sheet first — the
                          backend refuses completion without one. */}
                      <Link href={`/bookings/${booking.id}/inspection`}>
                        <Button size="sm" variant="teal">
                          Mark done
                        </Button>
                      </Link>
                    </>
                  )}

                  {!isPending && !isOngoing && (
                    <Badge tone={bookingBadge(booking).tone}>{bookingBadge(booking).label}</Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {liveWalkIns.length > 0 && (
        <Card className="mt-5" padded={false}>
          <div
            className="px-[22px] py-[18px] text-[15px] font-bold"
            style={{ borderBottom: '1px solid var(--color-divider)' }}
          >
            Walk-ins {tab === 'completed' ? 'closed' : 'in the garage'}
          </div>

          {liveWalkIns.map((job) => (
            <div
              key={job.id}
              className="px-[22px] py-4 flex items-center gap-4 flex-wrap"
              style={{ borderBottom: '1px solid var(--color-divider)' }}
            >
              <div className="flex-1 min-w-[180px]">
                <Link href={`/walk-in/${job.id}`} className="text-[13.5px] font-bold hover:underline">
                  {job.registration ?? 'Walk-in job'}
                </Link>
                <div className="text-[11.5px] text-[var(--color-disabled)]">
                  {job.customerName}
                  {job.description ? ` · ${job.description}` : ''}
                </div>
              </div>

              <Badge tone={statusTone(job.status)}>
                {job.status === 'in_progress' ? 'In progress' : job.status === 'open' ? 'Open' : job.status}
              </Badge>

              <div className="flex gap-2">
                {job.status === 'open' && (
                  <Button
                    size="sm"
                    variant="tint"
                    loading={busyId === `walkin-${job.id}`}
                    onClick={() => startWalkIn(job)}
                  >
                    Start job
                  </Button>
                )}
                {job.status === 'in_progress' && (
                  <Button size="sm" variant="teal" onClick={() => router.push(`/walk-in/${job.id}/close`)}>
                    Close job
                  </Button>
                )}
                <Link href={`/walk-in/${job.id}`}>
                  <Button size="sm" variant="outline">
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card className="mt-5">
        <div className="text-[15px] font-bold mb-1">
          Vehicle inspection is required before closing a job
        </div>
        <div className="text-[12.5px] text-[var(--color-muted)] leading-[1.6]">
          Marking a job done opens the health sheet — brakes, tyres, fluids, battery, photos and
          notes — then the completion step with the amount collected and payment mode.
        </div>
      </Card>

      {buckets.overdue.length > 0 && (
        <p className="text-[12px] text-[var(--color-warning-dark)] mt-4">
          {buckets.overdue.length} job{buckets.overdue.length === 1 ? ' has' : 's have'} run past the
          booked duration without being closed.
        </p>
      )}
    </div>
  );
}
