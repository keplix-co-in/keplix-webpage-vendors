'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../../layout';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Chip } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useServices } from '@/lib/queries';
import { walkInsAPI } from '@/api/bookings';
import { formatMoney } from '@/lib/format';
import { formatDuration, totalDurationMinutes } from '@/shared/utils/duration';
import { normalizeIndianMobile, rules, validate } from '@/shared/utils/validation';

// Mirrors createWalkInJobSchema on the backend, so a job is never rejected
// after the vendor has already walked away from the counter.
const SCHEMA = {
  customerName: [rules.required('Customer name'), rules.minLength(2, 'Customer name')],
  customerPhone: [rules.required('Mobile number'), rules.mobile],
  registration: [rules.required('Car number'), rules.registration],
  amount: [rules.nonNegativeNumber('Estimate'), rules.maxAmount(500000, 'Estimate')],
};

export default function NewWalkInPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    registration: '',
    model: '',
    amount: '',
  });
  const [selected, setSelected] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const { data: services = [] } = useServices();

  usePortalHeader('Walk-in check-in', 'Log a car already on the forecourt in under 20 seconds');

  const chosenServices = useMemo(
    () => services.filter((s) => selected.includes(s.id)),
    [services, selected]
  );

  const estimatedMinutes = totalDurationMinutes(chosenServices);
  const estimatedTotal = chosenServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

  const toggleService = (serviceId) =>
    setSelected((prev) =>
      prev.includes(serviceId) ? prev.filter((x) => x !== serviceId) : [...prev, serviceId]
    );

  // Editing a field clears its error, so a corrected value stops looking wrong
  // before the vendor submits again.
  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const submit = async (event) => {
    event.preventDefault();

    const { errors: nextErrors, isValid } = validate(form, SCHEMA);
    setErrors(nextErrors);
    if (!isValid) return;

    setBusy(true);

    const payload = {
      customer_name: form.customerName.trim(),
      // Sent in the shape the backend normalises to, so what the vendor typed
      // and what is stored cannot disagree.
      customer_phone: normalizeIndianMobile(form.customerPhone),
      vehicle: {
        registration: form.registration.replace(/[\s-]/g, '').toUpperCase(),
        model: form.model.trim() || undefined,
      },
      // `description` is deliberately not sent — the backend composes it from
      // the selected service names.
      services: selected.length ? selected : undefined,
    };

    if (form.amount.trim()) {
      const parsed = Number(form.amount.trim());
      if (!Number.isNaN(parsed)) payload.amount_collected = parsed;
    }

    const result = await walkInsAPI.createWalkInJob(payload);
    setBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
      toast.success('Walk-in added. The customer has been sent a tracking link.');
      const newId = result.data?.job?.id ?? result.data?.id;
      router.replace(newId ? `/walk-in/${newId}` : '/bookings');
    } else {
      toast.error(result?.error || 'Could not save this job. Please try again.');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-[720px]" noValidate>
      <Card className="mb-5">
        <CardHeader title="Customer & vehicle" />

        <div className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-1">
          <Input
            label="Customer name"
            required
            placeholder="Eg: Sunil Kapoor"
            value={form.customerName}
            onChange={setField('customerName')}
            error={errors.customerName}
          />
          <Input
            label="Mobile number"
            required
            type="tel"
            inputMode="tel"
            placeholder="Eg: +91 98110 77219"
            value={form.customerPhone}
            onChange={setField('customerPhone')}
            error={errors.customerPhone}
          />
          <Input
            label="Car number"
            required
            placeholder="Eg: DL 5C AB 7719"
            value={form.registration}
            onChange={setField('registration')}
            error={errors.registration}
          />
          <Input
            label="Car model (optional)"
            placeholder="Eg: Maruti Swift"
            value={form.model}
            onChange={setField('model')}
          />
        </div>
      </Card>

      <Card className="mb-5">
        <CardHeader
          title="Services"
          subtitle="Pick what the car is in for — the health sheet uses these"
        />

        {services.length === 0 ? (
          <p className="text-[12.5px] text-[var(--color-muted)]">
            No services in your catalog yet. You can still log the job and add the amount at
            checkout.
          </p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {services.map((service) => (
              <Chip
                key={service.id}
                active={selected.includes(service.id)}
                onClick={() => toggleService(service.id)}
              >
                {service.name} · {formatMoney(service.price)}
              </Chip>
            ))}
          </div>
        )}

        {chosenServices.length > 0 && (
          <div
            className="mt-4 pt-4 flex items-center justify-between gap-3 flex-wrap"
            style={{ borderTop: '1px solid var(--color-divider)' }}
          >
            <span className="text-[12.5px] text-[var(--color-muted)]">
              {chosenServices.length} selected
              {estimatedMinutes > 0 ? ` · about ${formatDuration(estimatedMinutes)}` : ''}
            </span>
            <span className="text-[14px] font-bold">{formatMoney(estimatedTotal)}</span>
          </div>
        )}
      </Card>

      <Card className="mb-5">
        <CardHeader title="Estimate" subtitle="Optional — the final amount is taken at checkout" />
        <Input
          label="Estimated amount (optional)"
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="₹ Estimated amount"
          value={form.amount}
          onChange={setField('amount')}
          error={errors.amount}
        />
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Save walk-in
        </Button>
      </div>
    </form>
  );
}
