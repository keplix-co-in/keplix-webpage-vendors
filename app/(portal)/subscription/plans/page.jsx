'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../../layout';
import { Card, ErrorState } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { subscriptionsAPI } from '@/api/subscriptions';
import { useSubscription } from '@/lib/queries';
import { sortPlans, planPrice, yearlySaving, purchasePlan } from '@/lib/subscription';
import { formatMoney } from '@/lib/format';

export default function PlansPage() {
  usePortalHeader('Choose a plan', 'Pay monthly or yearly. Renew whenever you like.');
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, vendorProfile } = useAuth();
  const { data: sub } = useSubscription();
  const [period, setPeriod] = useState('monthly');
  const [busy, setBusy] = useState(null);

  const { data: plans, isError, refetch } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await subscriptionsAPI.getPlans();
      if (!res?.success) throw new Error(res?.error || 'Request failed');
      return sortPlans(Array.isArray(res.data) ? res.data : res.data?.plans);
    },
  });

  const pay = async (plan) => {
    if (busy) return; // double-click guard: one checkout at a time
    setBusy(plan.code);
    const result = await purchasePlan({
      planCode: plan.code,
      period,
      api: subscriptionsAPI,
      prefill: { name: vendorProfile?.business_name, email: user?.email, phone: vendorProfile?.phone ?? user?.phone },
    });
    if (result.status === 'paid') {
      toast.success('Payment received. Your plan is active.');
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['subscription-payments'] });
      router.push('/subscription');
      return;
    }
    if (result.status === 'verify_failed') {
      // Money may have been taken and the webhook may still activate the plan, so refresh the banner.
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.error('We could not confirm your payment yet. If money was deducted, your plan will update shortly.');
    } else if (result.status === 'error') {
      toast.error(result.message || 'Could not start payment');
    }
    setBusy(null);
  };

  if (isError) {
    return <ErrorState title="Could not load plans" body="Check your connection and try again." onRetry={refetch} />;
  }

  return (
    <div className="max-w-[980px]">
      <div role="group" aria-label="Billing period" className="inline-flex rounded-[var(--radius-pill)] p-1 mb-5" style={{ background: 'var(--color-primary-tint)' }}>
        {['monthly', 'yearly'].map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className="px-5 py-2 rounded-[var(--radius-pill)] text-[13px] font-bold cursor-pointer capitalize"
            style={period === p ? { background: 'var(--color-primary)', color: '#fff' } : { color: 'var(--color-primary-dark)' }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {(plans ?? []).map((plan) => {
          const price = planPrice(plan, period);
          const saving = yearlySaving(plan);
          const current = sub?.plan_code === plan.code && sub?.status === 'active' && sub?.period === period;
          return (
            <Card key={plan.code} className="flex flex-col">
              <div className="text-[16px] font-bold">{plan.name}</div>
              <div className="mt-2 text-[28px] font-bold" style={{ color: 'var(--color-primary)' }}>
                {price === null ? '—' : formatMoney(price)}
                <span className="text-[13px] font-medium text-[var(--color-muted)]"> / {period === 'yearly' ? 'year' : 'month'}</span>
              </div>
              {period === 'yearly' && saving > 0 && (
                <div className="text-[12px] font-bold text-[var(--color-success-dark)]">Save {formatMoney(saving)} a year</div>
              )}
              <ul className="my-4 grid gap-2 text-[13px] flex-1">
                {(plan.features ?? []).map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Button size="md" fullWidth loading={busy === plan.code} disabled={busy !== null || price === null} onClick={() => pay(plan)}>
                {current ? 'Renew' : `Pay ${price === null ? '' : formatMoney(price)}`}
              </Button>
            </Card>
          );
        })}
      </div>
      <p className="text-[12px] text-[var(--color-muted)] mt-4">
        Payments are processed securely by Razorpay. Renewal is manual: nothing is charged automatically.
      </p>
    </div>
  );
}
