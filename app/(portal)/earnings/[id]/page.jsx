'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { usePortalHeader } from '../../layout';
import { Card, Kicker } from '@/components/ui/Card';
import Badge, { statusTone } from '@/components/ui/Badge';
import { usePayments } from '@/lib/queries';
import { formatMoney, formatDateTime } from '@/lib/format';

export default function ReceiptPage() {
  const { id } = useParams();
  const { data: payments = [], isLoading } = usePayments();
  const payment = payments.find((p) => String(p.id) === String(id));

  usePortalHeader('Transaction receipt', payment ? formatDateTime(payment.createdAt ?? payment.created_at) : '');

  if (isLoading) {
    return (
      <Card>
        <div className="text-[13px] text-[var(--color-muted)]">Loading receipt…</div>
      </Card>
    );
  }

  if (!payment) {
    return (
      <Card>
        <div className="text-[13px] text-[var(--color-muted)]">That transaction was not found.</div>
      </Card>
    );
  }

  const gross = Number(payment.amount ?? 0);
  // The platform fee is only shown when the backend actually reports one —
  // deriving it from a hardcoded percentage would invent a number on a receipt.
  const fee = Number(payment.platform_fee ?? payment.commission ?? NaN);
  const net = Number.isFinite(fee) ? gross - fee : Number(payment.net_amount ?? gross);

  const rows = [
    { label: 'Transaction number', value: payment.transaction_id ?? payment.order_id ?? `#${payment.id}` },
    { label: 'Payment time', value: formatDateTime(payment.createdAt ?? payment.created_at) },
    { label: 'Payment method', value: payment.payment_mode ?? payment.method ?? '—' },
    { label: 'Customer', value: payment.customer?.name ?? payment.customer_name ?? '—' },
    { label: 'Service', value: payment.booking?.service?.name ?? payment.service_name ?? '—' },
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
          <Badge tone={statusTone(payment.status)}>{payment.status ?? '—'}</Badge>
        </div>

        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 py-3"
            style={{ borderBottom: '1px solid var(--color-divider)' }}
          >
            <span className="text-[13px] text-[var(--color-muted)]">{row.label}</span>
            <span className="text-[13px] font-medium text-right">{row.value}</span>
          </div>
        ))}

        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--color-line)' }}>
          <div className="flex items-center justify-between gap-4 py-1.5">
            <span className="text-[13px] text-[var(--color-muted)]">Service amount</span>
            <span className="text-[13px]">{formatMoney(gross, { precise: true })}</span>
          </div>

          {Number.isFinite(fee) && (
            <div className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-[13px] text-[var(--color-muted)]">Platform fee</span>
              <span className="text-[13px]">−{formatMoney(fee, { precise: true })}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-3">
            <span className="text-[16px] font-bold">Net to you</span>
            <span className="text-[16px] font-bold text-[var(--color-primary)]">
              {formatMoney(net, { precise: true })}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
