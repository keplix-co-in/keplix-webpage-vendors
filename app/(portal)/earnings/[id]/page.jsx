'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { usePortalHeader } from '../../layout';
import { Card, Kicker } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useBookings } from '@/lib/queries';
import { toEarningRow } from '@/lib/entities';
import { ANY_BOOKING } from '@/components/bookings/bookingFields';
import { formatMoney, formatDateTime } from '@/lib/format';

export default function ReceiptPage() {
  const { id } = useParams();
  // The receipt is a booking plus its payment row; there is no per-transaction
  // endpoint, and /payments holds the vendor's payments to Keplix instead.
  const { data: bookings = [], isLoading } = useBookings(ANY_BOOKING);
  const booking = bookings.find((b) => String(b.id) === String(id));
  const row = booking ? toEarningRow(booking) : null;

  usePortalHeader('Transaction receipt', row ? formatDateTime(row.paidAt ?? row.at) : '');

  if (isLoading) {
    return (
      <Card>
        <div className="text-[13px] text-[var(--color-muted)]">Loading receipt…</div>
      </Card>
    );
  }

  if (!row) {
    return (
      <Card>
        <div className="text-[13px] text-[var(--color-muted)]">That transaction was not found.</div>
      </Card>
    );
  }

  const rows = [
    { label: 'Transaction number', value: row.transactionId ?? row.token },
    { label: 'Payment time', value: row.paidAt ? formatDateTime(row.paidAt) : '—' },
    { label: 'Payment method', value: row.method ?? '—' },
    { label: 'Customer', value: row.customer ?? '—' },
    { label: 'Service', value: row.service ?? '—' },
  ];

  return (
    <div className="max-w-[640px]">
      <Link
        href="/earnings"
        className="inline-flex items-center gap-2 text-[12.5px] font-bold text-[var(--color-ink-body)] mb-4"
      >
        <ArrowLeft size={14} /> Back to earnings
      </Link>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-5">
          <Kicker>Receipt</Kicker>
          <Badge tone={row.paid ? 'success' : 'warning'}>{row.paid ? 'Paid' : 'Pending'}</Badge>
        </div>

        {rows.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 py-3"
            style={{ borderBottom: '1px solid var(--color-divider)' }}
          >
            <span className="text-[13px] text-[var(--color-muted)]">{item.label}</span>
            <span className="text-[13px] font-medium text-right capitalize">{item.value}</span>
          </div>
        ))}

        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--color-line)' }}>
          <div className="flex items-center justify-between gap-4 py-1.5">
            <span className="text-[13px] text-[var(--color-muted)]">Service amount</span>
            <span className="text-[13px]">{formatMoney(row.amount, { precise: true })}</span>
          </div>

          {row.fee != null && (
            <div className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-[13px] text-[var(--color-muted)]">Platform fee</span>
              <span className="text-[13px]">−{formatMoney(row.fee, { precise: true })}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-3">
            <span className="text-[16px] font-bold">Net to you</span>
            <span className="text-[16px] font-bold text-[var(--color-primary)]">
              {row.net != null ? formatMoney(row.net, { precise: true }) : '—'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
