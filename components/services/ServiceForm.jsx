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

  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    category: service?.category ?? SERVICE_CATEGORIES[0]?.name ?? '',
    segment: service?.segment_prices?.[0]?.segment ?? VEHICLE_SEGMENTS[0].id,
    vehicle_note: service?.vehicle_note ?? '',
    duration: durationLabelFor(service?.duration) ?? DURATIONS[0],
    price: service?.price != null ? String(service.price) : '',
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

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Give this service a name.';
    if (!form.segment) next.segment = 'Pick the vehicle segment this price applies to.';
    const price = Number(form.price);
    if (!form.price || !Number.isFinite(price) || price <= 0) next.price = 'Enter a price.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      duration: DURATION_MAP[form.duration],
      price: Number(form.price),
      is_active: service?.is_active ?? true,
      vehicle_note: form.vehicle_note.trim() || undefined,
      segment_prices: [{ segment: form.segment, price: Number(form.price) }],
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
                onClick={() => setForm({ ...form, segment: segment.id })}
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
          onChange={(e) => setForm({ ...form, vehicle_note: e.target.value })}
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
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="mb-4"
        />
        <Input
          label="Service name"
          name="name"
          required
          placeholder="Eg: Engine Oil Change"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          className="mb-4"
        />
        <Textarea
          label="Description"
          name="description"
          placeholder="What is included in this service?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
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
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
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
          onChange={(e) => setForm({ ...form, price: e.target.value })}
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
