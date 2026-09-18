'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../../../layout';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Chip } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { walkInsAPI } from '@/api/bookings';
import { readWalkIn } from '@/components/bookings/bookingFields';
import { formatMoney } from '@/lib/format';

const PAYMENT_MODES = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
];

// The close payload survives the trip through the health-sheet gate, so the
// vendor never re-types the amount after filling the checklist.
const draftKey = (id) => `keplix_walkin_close_${id}`;

export default function CloseWalkInPage() {
  return (
    <Suspense fallback={null}>
      <CloseWalkInForm />
    </Suspense>
  );
}

function CloseWalkInForm() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  // null means "not edited yet", so the fetched job (or a restored draft) can
  // supply the value without an effect syncing server data into state.
  const [amountInput, setAmountInput] = useState(null);
  const [modeInput, setModeInput] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const retried = useRef(false);

  const { data: job } = useQuery({
    queryKey: ['walk-in', id],
    queryFn: async () => {
      const result = await walkInsAPI.getWalkInJob(id);
      if (!result?.success) return null;
      const raw = result.data?.job ?? result.data;
      return raw ? readWalkIn(raw) : null;
    },
  });

  usePortalHeader('Close walk-in job', job ? `${job.registration ?? ''} · ${job.customerName}` : '');

  const amount =
    amountInput ??
    (draft?.amount_collected != null
      ? String(draft.amount_collected)
      : job?.amountCollected != null
        ? String(job.amountCollected)
        : '');

  const mode = modeInput ?? draft?.payment_mode ?? job?.paymentMode ?? 'cash';

  /**
   * Closes the job in ONE request (status + amount + mode).
   *
   * The backend applies the mandatory-inspection gate before writing anything,
   * so a 409 means nothing was persisted — which is exactly what lets the same
   * payload be resent once the health sheet exists, with no partial state.
   */
  const close = useCallback(
    async (payload) => {
      setBusy(true);
      const result = await walkInsAPI.updateWalkInJobStatus(id, {
        status: 'completed',
        ...payload,
      });
      setBusy(false);

      if (result?.success) {
        try {
          sessionStorage.removeItem(draftKey(id));
        } catch {
          // Nothing to clean up if storage is blocked.
        }
        queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
        queryClient.invalidateQueries({ queryKey: ['walk-in', id] });
        router.replace(`/walk-in/${id}/closed`);
        return;
      }

      const code = result?.details?.code ?? result?.code;
      if (code === 'HEALTH_SHEET_REQUIRED' || result?.status === 409) {
        try {
          sessionStorage.setItem(draftKey(id), JSON.stringify(payload));
        } catch {
          // Losing the draft is better than losing the flow.
        }
        toast.info('The health sheet is required first — opening it now.');
        router.push(`/walk-in/${id}/inspection?next=close`);
        return;
      }

      toast.error(result?.error || 'Could not close this job.');
    },
    [id, queryClient, router, toast]
  );

  // Coming back from the checklist: finish the close the vendor already started.
  // Read after mount — the draft lives in the browser only.
  useEffect(() => {
    if (searchParams.get('retry') !== '1' || retried.current) return;
    retried.current = true;

    let cancelled = false;

    Promise.resolve()
      .then(() => {
        try {
          return JSON.parse(sessionStorage.getItem(draftKey(id)) ?? 'null');
        } catch {
          return null;
        }
      })
      .then((saved) => {
        if (cancelled || saved?.amount_collected == null) return;
        setDraft(saved);
        close(saved);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, id, close]);

  const submit = (event) => {
    event.preventDefault();

    const parsed = Number(amount.trim());
    if (!amount.trim() || Number.isNaN(parsed) || parsed < 0) {
      setError('Enter the amount you collected.');
      return;
    }

    setError(null);
    close({ amount_collected: parsed, payment_mode: mode });
  };

  return (
    <form onSubmit={submit} className="max-w-[560px]" noValidate>
      <Card className="mb-5">
        <CardHeader title="Amount collected" subtitle="What the customer actually paid" />

        <Input
          label="Amount"
          required
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="₹ 0"
          value={amount}
          onChange={(e) => setAmountInput(e.target.value)}
          error={error}
        />

        <div className="mt-5">
          <div className="text-[12.5px] font-bold text-[var(--color-ink-body)] mb-2.5">
            Payment mode
          </div>
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_MODES.map((option) => (
              <Chip
                key={option.value}
                active={mode === option.value}
                onClick={() => setModeInput(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        {job?.services?.length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-divider)' }}>
            {job.services.map((service) => (
              <div key={service.id} className="flex justify-between gap-3 py-1.5">
                <span className="text-[12.5px] text-[var(--color-muted)] truncate">
                  {service.name}
                </span>
                <span className="text-[12.5px] font-semibold shrink-0">
                  {service.price != null ? formatMoney(service.price) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Back
        </Button>
        <Button variant="teal" type="submit" loading={busy}>
          Close job
        </Button>
      </div>

      <p className="text-[11.5px] text-[var(--color-muted)] leading-[1.6] mt-4">
        The health sheet must be saved before a job can be closed. If it is missing you will be sent
        to the checklist and brought straight back here.
      </p>
    </form>
  );
}
