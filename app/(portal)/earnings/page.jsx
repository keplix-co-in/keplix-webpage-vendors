'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortalHeader } from '../layout';
import { Card, CardHeader, Kicker, EmptyState } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Field';
import { useAuth } from '@/context/AuthContext';
import { useBookings, useEarnings } from '@/lib/queries';
import { isEarningBooking, toEarningRow } from '@/lib/entities';
import { ANY_BOOKING } from '@/components/bookings/bookingFields';
import { formatMoney, formatDate } from '@/lib/format';

const TABS = ['All', 'Paid out', 'Pending'];

export default function EarningsPage() {
  const { vendorProfile } = useAuth();
  const { data: earnings } = useEarnings();
  const { data: bookings = [], isLoading } = useBookings(ANY_BOOKING);
  const [tab, setTab] = useState('All');

  usePortalHeader('Earnings & payouts', 'Transaction history and your settlement account');

  // Built from bookings, as the mobile screen does — /payments holds the
  // vendor's own payments to Keplix, not what customers paid for jobs.
  const rows = useMemo(
    () =>
      bookings
        .filter(isEarningBooking)
        .map(toEarningRow)
        .sort((a, b) => new Date(b.at) - new Date(a.at)),
    [bookings]
  );

  const visible = useMemo(() => {
    if (tab === 'All') return rows;
    return rows.filter((row) => (tab === 'Paid out' ? row.paid : !row.paid));
  }, [rows, tab]);

  const stats = [
    { label: 'LIFETIME', value: earnings?.total_earnings, note: 'Net of platform fees', feature: true },
    { label: 'THIS WEEK', value: earnings?.week_earnings, note: 'Settled this week' },
    { label: 'THIS MONTH', value: earnings?.month_earnings, note: 'Settled this month' },
    { label: 'PENDING', value: earnings?.pending_earnings, note: 'Awaiting release', tint: true },
  ];

  // Payout account lives on the vendor profile; payouts themselves are settled
  // by the Keplix team, so there is nothing for the vendor to request here.
  const payoutRows = [
    { label: 'UPI ID', value: vendorProfile?.upi_id },
    { label: 'Name in the bank', value: vendorProfile?.bank_account_holder_name },
    { label: 'Bank account', value: vendorProfile?.bank_account_number },
    { label: 'IFSC code', value: vendorProfile?.ifsc_code },
  ].filter((row) => row.value);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-5 max-[1000px]:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius-portal)] p-5"
            style={
              stat.feature
                ? { background: 'var(--color-primary)', color: '#fff' }
                : stat.tint
                  ? {
                      background: 'var(--color-primary-tint)',
                      border: '1px solid var(--color-primary-tint-border)',
                    }
                  : { background: '#fff', border: '1px solid var(--color-line)' }
            }
          >
            <div
              className="text-[10.5px] tracking-[1px] font-bold mb-2"
              style={{
                color: stat.feature
                  ? 'rgba(255,255,255,.75)'
                  : stat.tint
                    ? 'var(--color-primary)'
                    : 'var(--color-disabled)',
              }}
            >
              {stat.label}
            </div>
            <div
              className="text-[26px] font-bold tracking-[-1px] leading-none"
              style={{ color: stat.feature ? '#fff' : stat.tint ? 'var(--color-primary-dark)' : 'var(--color-ink)' }}
            >
              {formatMoney(stat.value ?? 0)}
            </div>
            <div
              className="text-[11.5px] mt-2.5"
              style={{
                color: stat.feature ? 'rgba(255,255,255,.75)' : 'var(--color-muted)',
              }}
            >
              {stat.note}
            </div>
          </div>
        ))}
      </div>

      <div
        className="grid gap-6 items-start max-[880px]:grid-cols-[minmax(0,1fr)]"
        style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}
      >
        <Card padded={false} className="min-w-0">
          <div className="px-[22px] pt-[22px] pb-4 flex gap-2.5 flex-wrap">
            {TABS.map((name) => (
              <Chip key={name} active={tab === name} onClick={() => setTab(name)}>
                {name}
              </Chip>
            ))}
          </div>

          {isLoading ? (
            <div className="px-[22px] py-8 text-[13px] text-[var(--color-muted)]">Loading…</div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              body="Completed jobs and their payouts appear here."
            />
          ) : (
            visible.map((row) => (
              <Link
                key={row.id}
                href={`/earnings/${row.id}`}
                className="px-[22px] py-4 flex items-center gap-4 flex-wrap"
                style={{ borderTop: '1px solid var(--color-divider)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold truncate">{row.customer ?? 'Customer'}</div>
                  <div className="text-[12px] text-[var(--color-muted)] truncate">
                    {row.service ?? 'Service'} · {formatDate(row.at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13.5px] font-bold">{formatMoney(row.amount)}</div>
                  {row.net != null && (
                    <div className="text-[11px] text-[var(--color-muted)]">
                      Net {formatMoney(row.net)}
                    </div>
                  )}
                </div>
                <Badge tone={row.paid ? 'success' : 'warning'}>{row.paid ? 'Paid' : 'Pending'}</Badge>
              </Link>
            ))
          )}
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Payout account" />
          {payoutRows.length === 0 ? (
            <p className="text-[12.5px] text-[var(--color-muted)] leading-[1.6]">
              No payout details saved yet. Add them under{' '}
              <Link href="/documents" className="font-bold text-[var(--color-primary)]">
                My documents
              </Link>
              .
            </p>
          ) : (
            payoutRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 py-3"
                style={{ borderBottom: '1px solid var(--color-divider)' }}
              >
                <span className="text-[12.5px] text-[var(--color-muted)]">{row.label}</span>
                <span className="text-[13px] font-bold truncate">{row.value}</span>
              </div>
            ))
          )}

          <Kicker className="mt-5 mb-2">How payouts work</Kicker>
          <p className="text-[12.5px] text-[var(--color-muted)] leading-[1.7]">
            Payouts are released by the Keplix team to this account after the customer confirms the
            service. There is nothing to request from here.
          </p>
        </Card>
      </div>
    </div>
  );
}
