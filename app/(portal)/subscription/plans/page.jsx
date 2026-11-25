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
import Badge from '@/components/ui/Badge';
import {
  sortPlans, planPrice, purchasePlan, bannerFor, subStatusTone, STATUS_LABEL,
  PARTNER_PLAN_CODE, PARTNER_PLAN_NAME, PARTNER_FALLBACK_PRICE, PARTNER_FEATURES,
} from '@/lib/subscription';
import { formatMoney } from '@/lib/format';

export default function PlansPage() {
  usePortalHeader('Keplix Partner', 'One simple plan for every garage. Renew whenever you like.');
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, vendorProfile } = useAuth();
  const { data: sub } = useSubscription();
  const [busy, setBusy] = useState(false);

  const { data: plan, isError, refetch } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await subscriptionsAPI.getPlans();
      if (!res?.success) throw new Error(res?.error || 'Request failed');
      const list = sortPlans(Array.isArray(res.data) ? res.data : res.data?.plans);
      return list.find((p) => p.code === PARTNER_PLAN_CODE) ?? null;
    },
  });

  const price = planPrice(plan) ?? PARTNER_FALLBACK_PRICE;
  const banner = bannerFor(sub);
  const isActive = sub?.status === 'active';
  const isTrial = sub?.status === 'trial';
  const trialDays = Number.isFinite(Number(sub?.days_left)) ? Number(sub.days_left) : null;

  const pay = async () => {
    if (busy) return; // double-click guard: one checkout at a time
    setBusy(true);
    // Always the single Partner plan, billed monthly. The server enforces this too.
    const result = await purchasePlan({
      planCode: PARTNER_PLAN_CODE,
      period: 'monthly',
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
    setBusy(false);
  };

  if (isError) {
    return <ErrorState title="Could not load the plan" body="Check your connection and try again." onRetry={refetch} />;
  }

  return (
    <div className="max-w-[560px] grid gap-4">
      {banner && (
        <div
          role="status"
          className="rounded-[var(--radius-portal)] px-4 py-3"
          style={{
            background: banner.tone === 'danger' ? 'var(--color-danger-tint)' : 'var(--color-warning-tint)',
            color: banner.tone === 'danger' ? 'var(--color-danger)' : 'var(--color-warning-text)',
          }}
        >
          <div className="text-[13px] font-bold">{banner.title}</div>
          <div className="text-[12px] leading-[1.5]">{banner.body}</div>
        </div>
      )}
      {!banner && isTrial && (
        <div role="status" className="rounded-[var(--radius-portal)] px-4 py-3 text-[13px]" style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary-dark)' }}>
          <span className="font-bold">Free trial</span>
          {trialDays !== null && ` - ${trialDays} day${trialDays === 1 ? '' : 's'} left. `}
          Subscribe any time; you stay listed either way.
        </div>
      )}

      <Card className="flex flex-col" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[18px] font-bold">{PARTNER_PLAN_NAME}</div>
          {sub?.status && (isActive || sub.status === 'grace') && (
            <Badge tone={subStatusTone(sub.status)}>{STATUS_LABEL[sub.status]}</Badge>
          )}
        </div>
        <div className="mt-2 text-[32px] font-bold" style={{ color: 'var(--color-primary)' }}>
          {formatMoney(price)}
          <span className="text-[14px] font-medium text-[var(--color-muted)]"> / month</span>
        </div>
        <div className="text-[12.5px] text-[var(--color-muted)]">Same price for every garage</div>
        <ul className="my-5 grid gap-2.5 text-[13.5px]">
          {PARTNER_FEATURES.map((f) => (
            <li key={f}>
              <span aria-hidden="true" style={{ color: 'var(--color-success-dark)' }}>✓ </span>
              {f}
            </li>
          ))}
        </ul>
        <Button size="md" fullWidth loading={busy} disabled={busy} onClick={pay}>
          {`Pay ${formatMoney(price)}`}
        </Button>
      </Card>
      <p className="text-[12px] text-[var(--color-muted)]">
        Payments are processed securely by Razorpay. Renewal is manual: nothing is charged automatically.
      </p>
    </div>
  );
}
