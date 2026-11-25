'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardingShell, { FieldLabel, StepActions } from '@/components/onboarding/OnboardingShell';
import { PhotoWell } from '@/components/onboarding/PhotoPickers';
import { useDraft } from '@/components/onboarding/DraftProvider';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import { Select, Textarea } from '@/components/ui/Field';
import SERVICE_CATEGORIES from '@/shared/constants/services';
import { rules, validate } from '@/shared/utils/validation';
import PricingSection from '@/components/services/pricing/PricingSection';
import {
  chargesInspectionFee,
  initialPricingState,
  rekeyPricing,
  sumLines,
  parseAmount,
  validatePricing,
} from '@/lib/servicePricing';

// The same eight options the app offers, and the vocabulary formatDuration
// prints back — so a service reads identically on web and on the phone.
const DURATIONS = ['30 min', '45 min', '1 Hour', '1.5 Hours', '2 Hours', '2.5 Hours', '3 Hours', '4 Hours'];

const SCHEMA = {
  name: [rules.required('Service name'), rules.maxLength(120, 'Service name')],
  description: [rules.maxLength(2000, 'Description')],
  // Price is validated by the pricing section (lib/servicePricing.js) instead
  // of one number: pricing type, labour/part lines, inspection fee.
};

// Onboarding has no car-type picker (it never priced segments), so only the
// base section is shown and saved.
const NO_SEGMENTS = [];

export default function ChooseServicePage() {
  return (
    <Suspense fallback={null}>
      <ChooseServiceForm />
    </Suspense>
  );
}

function ChooseServiceForm() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { draft, patch } = useDraft();

  // Editing an already-added service reuses this same screen. `get` returns
  // null when the param is absent and Number(null) is 0, so the missing case
  // has to be handled before the conversion or every add would open as an edit
  // of the first service.
  const editParam = searchParams.get('edit');
  const editIndex = editParam === null ? -1 : Number(editParam);
  const editing = editIndex >= 0 ? draft.serviceDetails[editIndex] : null;

  const [form, setForm] = useState(
    editing
      ? { ...editing }
      : {
          category: SERVICE_CATEGORIES[0].name,
          name: '',
          description: '',
          duration: DURATIONS[0],
          image: null,
        }
  );
  // A draft saved before pricing v2 has only `price`; initialPricingState turns
  // that into one base labour line, the same way the server reads old services.
  const [pricing, setPricing] = useState(() =>
    editing?.pricing ? rekeyPricing(editing.pricing) : initialPricingState(editing)
  );
  const [pricingErrors, setPricingErrors] = useState({});

  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: null } : current));
  };

  const addService = () => {
    const { errors: found, isValid } = validate(form, SCHEMA);
    const priced = validatePricing(pricing, { segments: NO_SEGMENTS });
    setErrors(found);
    setPricingErrors(priced.errors);
    if (!priced.isValid) toast.error('Please check the price section.');
    if (!isValid || !priced.isValid) return;

    // `price` is kept on the draft as the base total (or the inspection fee):
    // the checklist and the services list read it, and old drafts only have it.
    const price =
      pricing.pricing_type === 'inspection'
        ? // Owner decision 2026-11-21: switch off = free inspection, price 0.
          chargesInspectionFee(pricing)
          ? parseAmount(pricing.inspection_fee) ?? 0
          : 0
        : sumLines(pricing.base).total;
    const saved = { ...form, price: String(price), pricing };

    const next = editing
      ? draft.serviceDetails.map((service, index) => (index === editIndex ? saved : service))
      : [...draft.serviceDetails, saved];

    patch({ serviceDetails: next });
    router.push('/onboarding/services/setup');
  };

  return (
    <OnboardingShell
      title="Choose service:"
      subtitle="Set the category, name, duration and price for one service at a time."
      footer={
        <StepActions
          backHref="/onboarding/services/setup"
          nextLabel={editing ? 'Save service' : 'Add service'}
          onNext={addService}
        />
      }
    >
      <FieldLabel>Service image</FieldLabel>
      <div className="mb-6">
        <PhotoWell
          file={form.image}
          onChange={(file) => set('image', file)}
          onError={toast.error}
          label="Upload service image"
          placeholder="image"
          size={110}
        />
      </div>

      <Select
        label="Choose category"
        required
        name="category"
        value={form.category}
        onChange={(e) => set('category', e.target.value)}
        options={SERVICE_CATEGORIES.map((category) => ({
          value: category.name,
          label: category.name,
        }))}
        className="mb-[18px]"
      />

      <Input
        label="Enter service name"
        required
        name="serviceName"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        error={errors.name}
        placeholder="Eg: Fuel Injector Cleaning"
        className="mb-[18px]"
      />

      <Textarea
        label="Service Description"
        name="serviceDescription"
        rows={3}
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        error={errors.description}
        placeholder="What the job includes."
        className="mb-[18px]"
      />

      <Select
        label="Service duration"
        required
        name="duration"
        value={form.duration}
        onChange={(e) => set('duration', e.target.value)}
        options={DURATIONS.map((duration) => ({ value: duration, label: duration }))}
        className="mb-[18px]"
      />

      <PricingSection
        value={pricing}
        onChange={(next) => {
          setPricing(next);
          setPricingErrors({});
        }}
        errors={pricingErrors}
        segments={NO_SEGMENTS}
      />
    </OnboardingShell>
  );
}
