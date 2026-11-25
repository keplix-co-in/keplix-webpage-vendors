'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { usePortalHeader } from '../layout';
import { Card, CardHeader, Kicker, EmptyState, ErrorState } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useSubscription } from '@/lib/queries';
import { subscriptionsAPI } from '@/api/subscriptions';
import { STATUS_LABEL, PERIOD_LABEL, subStatusTone } from '@/lib/subscription';
import { formatDate, formatMoney } from '@/lib/format';

export default function SubscriptionPage() {
  usePortalHeader('Subscription', 'Your plan, renewal date and payments');
  const { data: sub, isLoading, isError, refetch } = useSubscription();
  const { data: payments = [] } = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: async () => {
      const res = await subscriptionsAPI.getPayments();
      if (!res?.success) throw new Error(res?.error || 'Request failed');
      const d = res.data;
      return Array.isArray(d) ? d : d?.payments ?? [];
    },
  });

  if (isError) {
    return <ErrorState title="Could not load your subscription" body="Check your connection and try again." onRetry={refetch} />;
  }

  const days = Number(sub?.days_left);

  return (
    <div className="grid gap-5 max-w-[860px]">
      <Card>
        <CardHeader
          title="Current plan"
          action={
            <Link
              href="/subscription/plans"
              className="text-[12.5px] font-bold text-white rounded-[var(--radius-pill)] px-4 py-2"
              style={{ background: 'var(--color-primary)' }}
            >
              {sub?.status === 'active' ? 'Renew' : 'Subscribe'}
            </Link>
          }
        />
        {isLoading || !sub ? (
          <div className="text-[13px] text-[var(--color-muted)]">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Kicker>Plan</Kicker>
              <div className="text-[15px] font-bold mt-1">{sub.plan_name ?? sub.plan_code}</div>
              <div className="text-[12px] text-[var(--color-muted)]">{PERIOD_LABEL[sub.period] ?? sub.period}</div>
            </div>
            <div>
              <Kicker>Status</Kicker>
              <div className="mt-1"><Badge tone={subStatusTone(sub.status)}>{STATUS_LABEL[sub.status] ?? sub.status}</Badge></div>
            </div>
            <div>
              <Kicker>{sub.status === 'expired' ? 'Ended on' : 'Ends on'}</Kicker>
              <div className="text-[15px] font-bold mt-1">{formatDate(sub.ends_at)}</div>
            </div>
            <div>
              <Kicker>Days left</Kicker>
              <div className="text-[15px] font-bold mt-1">{Number.isFinite(days) ? Math.max(0, days) : '—'}</div>
              {sub.status === 'grace' && (
                <div className="text-[12px] text-[var(--color-muted)]">Listed until {formatDate(sub.grace_ends_at)}</div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Payment history" />
        {payments.length === 0 ? (
          <EmptyState title="No payments yet" body="Payments for your plan appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left">
              <thead>
                <tr className="text-[var(--color-muted)]">
                  <th className="py-2 pr-3 font-bold">Date</th>
                  <th className="py-2 pr-3 font-bold">Plan</th>
                  <th className="py-2 pr-3 font-bold">Amount</th>
                  <th className="py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id ?? p.razorpay_order_id} style={{ borderTop: '1px solid var(--color-divider)' }}>
                    <td className="py-2.5 pr-3">{formatDate(p.paid_at ?? p.created_at)}</td>
                    <td className="py-2.5 pr-3 capitalize">{p.plan_code} · {PERIOD_LABEL[p.period] ?? p.period}</td>
                    <td className="py-2.5 pr-3 font-bold">{formatMoney(p.amount, { precise: true })}</td>
                    <td className="py-2.5"><Badge tone={p.status === 'paid' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
