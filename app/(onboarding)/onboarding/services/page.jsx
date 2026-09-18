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

// The same eight options the app offers, and the vocabulary formatDuration
// prints back — so a service reads identically on web and on the phone.
const DURATIONS = ['30 min', '45 min', '1 Hour', '1.5 Hours', '2 Hours', '2.5 Hours', '3 Hours', '4 Hours'];

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
          price: '',
          image: null,
        }
  );

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const addService = () => {
    if (!form.name) {
      toast.error('Give the service a name.');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error('Set a price for this service.');
      return;
    }

    const next = editing
      ? draft.serviceDetails.map((service, index) => (index === editIndex ? form : service))
      : [...draft.serviceDetails, form];

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
        placeholder="Eg: Fuel Injector Cleaning"
        className="mb-[18px]"
      />

      <Textarea
        label="Service Description"
        name="serviceDescription"
        rows={3}
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="What the job includes."
        className="mb-[18px]"
      />

      <div className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-1">
        <Select
          label="Service duration"
          required
          name="duration"
          value={form.duration}
          onChange={(e) => set('duration', e.target.value)}
          options={DURATIONS.map((duration) => ({ value: duration, label: duration }))}
        />
        <Input
          label="Price"
          required
          name="price"
          inputMode="numeric"
          value={form.price}
          onChange={(e) => set('price', e.target.value.replace(/[^\d.]/g, ''))}
          placeholder="₹ 1500"
        />
      </div>
    </OnboardingShell>
  );
}
