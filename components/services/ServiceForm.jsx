'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { servicesAPI } from '@/api/services';
import { Card, Kicker } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select, Textarea } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { SERVICE_CATEGORIES } from '@/shared/constants/services';
import { VEHICLE_SEGMENTS } from '@/shared/constants/vehicleSegments';
import { DURATIONS, DURATION_MAP, durationLabelFor } from '@/shared/constants/durations';
import { rules, validate } from '@/shared/utils/validation';

const SEGMENT_IDS = VEHICLE_SEGMENTS.map((s) => s.id);
const CATEGORY_NAMES = SERVICE_CATEGORIES.map((c) => c.name);

// Category, segment and duration are fixed lists the backend stores as enums or
// exact minutes, so a value outside them is a rejected save, not a typo.
const SCHEMA = {
  name: [rules.required('Service name'), rules.maxLength(120, 'Service name')],
  description: [rules.maxLength(2000, 'Description')],
  price: [
    rules.required('Price'),
    rules.positiveNumber('Price'),
    rules.maxAmount(100000, 'Price'),
  ],
  duration: [(value) => (DURATIONS.includes(value) ? null : 'Choose how long this takes.')],
  category: [(value) => (CATEGORY_NAMES.includes(value) ? null : 'Choose a category.')],
  segment: [
    (value) =>
      SEGMENT_IDS.includes(value) ? null : 'Pick the vehicle segment this price applies to.',
  ],
};

/**
 * Create and edit share one form, as they do on mobile (EditService.jsx): the
 * only differences are the heading, the button label and whether Delete exists.
 *
 * Categories, vehicle segments and durations are fixed constants, not user
 * data — the backend stores the segment ids as an enum.
 */
export default function ServiceForm({ service }) {
  const isEdit = Boolean(service);
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { vendorId } = useAuth();
  const fileRef = useRef(null);

  // The API returns these as `segmentPrices` (camelCase) — reading the
  // snake_case name found nothing, so editing never pre-selected the segment
  // and always showed the service's base price.
  const existingSegments = service?.segmentPrices ?? [];

  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    category: service?.category ?? SERVICE_CATEGORIES[0]?.name ?? '',
    segment: existingSegments[0]?.segment ?? VEHICLE_SEGMENTS[0].id,
    vehicle_note: service?.vehicle_note ?? '',
    duration: durationLabelFor(service?.duration) ?? DURATIONS[0],
    price:
      existingSegments[0]?.price != null
        ? String(Number(existingSegments[0].price))
        : service?.price != null
          ? String(Number(service.price))
          : '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(service?.image_url ?? null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categoryOptions = useMemo(
    () => SERVICE_CATEGORIES.map((c) => ({ value: c.name, label: c.name })),
    []
  );

  const pickImage = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const submit = async (event) => {
    event.preventDefault();

    const { errors: nextErrors, isValid } = validate(form, SCHEMA);
    setErrors(nextErrors);
    if (!isValid) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      duration: DURATION_MAP[form.duration],
      price: Number(form.price),
      is_active: service?.is_active ?? true,
      vehicle_note: form.vehicle_note.trim() || undefined,
      // The form edits one segment, but a service made in the app can price
      // several. Sending only the edited one would replace the list and silently
      // delete the rest, so the others are carried through unchanged.
      segment_prices: [
        ...existingSegments
          .filter((entry) => entry.segment !== form.segment)
          .map((entry) => ({ segment: entry.segment, price: Number(entry.price) })),
        { segment: form.segment, price: Number(form.price) },
      ],
    };

    setBusy(true);
    const result = isEdit
      ? imageFile
        ? await servicesAPI.updateServiceWithImage(vendorId, service.id, payload, imageFile)
        : await servicesAPI.updateService(vendorId, service.id, payload)
      : imageFile
        ? await servicesAPI.createServiceWithImage(vendorId, payload, imageFile)
        : await servicesAPI.createService(vendorId, payload);
    setBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(isEdit ? 'Service updated' : 'Service created');
      router.push('/services');
    } else {
      toast.error(result?.error || 'Could not save that service');
    }
  };

  const remove = async () => {
    setBusy(true);
    const result = await servicesAPI.deleteService(vendorId, service.id);
    setBusy(false);
    setConfirmDelete(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service deleted');
      router.push('/services');
    } else {
      toast.error(result?.error || 'Could not delete that service');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-[720px]">
      <Card className="mb-5">
        <div className="flex items-center gap-5 flex-wrap">
          <div
            className="w-[112px] h-[112px] rounded-[var(--radius-field)] overflow-hidden shrink-0 grid place-items-center"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-line)' }}
          >
            {preview ? (
              <Image
                src={preview}
                alt=""
                width={112}
                height={112}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-[11.5px] text-[var(--color-disabled)]">No photo</span>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Change Photo
            </Button>
            <p className="text-[11.5px] text-[var(--color-disabled)] mt-2">JPG, PNG or WebP.</p>
          </div>
        </div>
      </Card>

      <Card className="mb-5">
        <Kicker className="mb-4">Which vehicle</Kicker>
        <div className="grid gap-3">
          {VEHICLE_SEGMENTS.map((segment) => {
            const active = form.segment === segment.id;
            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => setField('segment', segment.id)}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-field)] px-4 py-3.5 text-left cursor-pointer"
                style={{
                  border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-line)'}`,
                  background: active ? 'var(--color-primary-tint)' : 'white',
                }}
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold">{segment.name}</span>
                  <span className="block text-[12px] text-[var(--color-muted)]">
                    {segment.description}
                  </span>
                </span>
                {active && <span className="text-[var(--color-primary)] font-bold">✓</span>}
              </button>
            );
          })}
        </div>
        {errors.segment && (
          <p className="mt-2 text-[11.5px] font-bold text-[var(--color-danger)]">{errors.segment}</p>
        )}

        <Input
          label="Car name (optional)"
          name="vehicle_note"
          placeholder="Eg: Swift, i20"
          value={form.vehicle_note}
          onChange={(e) => setField('vehicle_note', e.target.value)}
          className="mt-4"
        />
      </Card>

      <Card className="mb-5">
        <Kicker className="mb-4">The service</Kicker>
        <Select
          label="Category"
          name="category"
          required
          options={categoryOptions}
          value={form.category}
          onChange={(e) => setField('category', e.target.value)}
          error={errors.category}
          className="mb-4"
        />
        <Input
          label="Service name"
          name="name"
          required
          placeholder="Eg: Engine Oil Change"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          error={errors.name}
          className="mb-4"
        />
        <Textarea
          label="Description"
          name="description"
          placeholder="What is included in this service?"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          error={errors.description}
        />
      </Card>

      <Card className="mb-6">
        <Kicker className="mb-4">Time &amp; price</Kicker>
        <Select
          label="Duration"
          name="duration"
          required
          options={DURATIONS.map((d) => ({ value: d, label: d }))}
          value={form.duration}
          onChange={(e) => setField('duration', e.target.value)}
          error={errors.duration}
          className="mb-4"
        />
        <Input
          label="Price (₹)"
          name="price"
          type="number"
          min="0"
          required
          placeholder="Eg: 899"
          value={form.price}
          onChange={(e) => setField('price', e.target.value)}
          error={errors.price}
        />
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button type="submit" loading={busy}>
          {isEdit ? 'Save changes' : 'Create Service'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/services')}>
          Cancel
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="danger"
            className="ml-auto"
            onClick={() => setConfirmDelete(true)}
          >
            Delete service
          </Button>
        )}
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Remove service"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={remove} loading={busy}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-[var(--color-ink-body)] leading-[1.6]">
          Are you sure you want to delete this service? This action cannot be undone.
        </p>
      </Modal>
    </form>
  );
}
