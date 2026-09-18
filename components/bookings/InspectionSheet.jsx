'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { inspectionAPI, walkInsAPI } from '@/api/bookings';
import {
  iconFor,
  STATUS_OPTIONS,
  STATUS_UNSELECTED,
  DEFAULT_STATUS,
  MAX_PHOTOS_PER_ITEM,
} from '@/shared/constants/inspection';
import { formatMoney } from '@/lib/format';

/**
 * The digital vehicle health sheet, shared by bookings and walk-ins.
 *
 * Ported from keplix-frontend VehicleInspection.jsx. Two behaviours matter and
 * are easy to lose:
 *  - A walk-in is inspected against the services the vendor actually selected
 *    at check-in, not the fixed component checklist. Only if the job has no
 *    services recorded does it fall back, so the sheet is never empty.
 *  - "Skip" still WRITES a sheet. The backend refuses to complete a job with no
 *    sheet, so a true bypass would leave the vendor unable to close the job at
 *    all; an empty sheet keeps skip usable and the customer still sees what was
 *    done.
 */
export default function InspectionSheet({ bookingId, walkInJobId, onSaved }) {
  const toast = useToast();
  const fileInputs = useRef({});

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState({});
  const [prices, setPrices] = useState({});
  const [notes, setNotes] = useState({});
  const [photos, setPhotos] = useState({});
  const [odometer, setOdometer] = useState('');
  const [overallNotes, setOverallNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadComponentCards = async () => {
      const response = await inspectionAPI.getHealthComponents();
      if (!response?.success) return [];
      const list = response.data?.data ?? response.data ?? [];
      return (Array.isArray(list) ? list : []).map((c) => ({
        key: c.key,
        label: c.label,
        component_key: c.key,
      }));
    };

    (async () => {
      let next = [];

      if (walkInJobId) {
        const jobRes = await walkInsAPI.getWalkInJob(walkInJobId);
        const services = jobRes?.data?.job?.services ?? jobRes?.data?.services ?? [];
        if (services.length) {
          next = services.map((s) => ({
            key: `svc-${s.id}`,
            label: s.name,
            walk_in_service_id: s.id,
            defaultPrice: s.price != null ? String(s.price) : '',
          }));
        }
      }

      if (!next.length) next = await loadComponentCards();
      if (cancelled) return;

      setCards(next);
      setStatuses(Object.fromEntries(next.map((c) => [c.key, DEFAULT_STATUS])));
      setPrices(Object.fromEntries(next.map((c) => [c.key, c.defaultPrice ?? ''])));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [walkInJobId]);

  const runningTotal = useMemo(
    () =>
      cards.reduce((sum, card) => {
        const value = Number((prices[card.key] ?? '').toString().trim());
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [cards, prices]
  );

  const addPhoto = (key, file) => {
    if (!file) return;
    const current = photos[key] ?? [];
    if (current.length >= MAX_PHOTOS_PER_ITEM) {
      toast.error(`Up to ${MAX_PHOTOS_PER_ITEM} photos per item.`);
      return;
    }
    setPhotos((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { file, preview: URL.createObjectURL(file) }],
    }));
  };

  const removePhoto = (key, index) => {
    setPhotos((prev) => {
      const next = [...(prev[key] ?? [])];
      const [removed] = next.splice(index, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return { ...prev, [key]: next };
    });
  };

  const save = async (skip = false) => {
    if (!bookingId && !walkInJobId) {
      toast.error('Job information is missing. Please try again.');
      return;
    }
    if (!cards.length) {
      toast.error('The inspection checklist failed to load. Please try again.');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    if (bookingId) formData.append('bookingId', String(bookingId));
    if (walkInJobId) formData.append('walkInJobId', String(walkInJobId));
    if (!skip && odometer.trim()) formData.append('odometer_km', odometer.trim());
    if (!skip && overallNotes.trim()) formData.append('overall_notes', overallNotes.trim());

    const items = cards.map((card) => {
      const base = card.walk_in_service_id
        ? { walk_in_service_id: card.walk_in_service_id }
        : { component_key: card.component_key ?? card.key };

      if (skip) return base;

      const rawPrice = (prices[card.key] ?? '').toString().trim();
      const parsed = Number(rawPrice);
      return {
        ...base,
        status: statuses[card.key] || DEFAULT_STATUS,
        // Only sent when it parses, so one stray character cannot fail
        // validation for the whole sheet.
        price: rawPrice && !Number.isNaN(parsed) ? parsed : undefined,
        notes: (notes[card.key] ?? '').trim() || undefined,
      };
    });
    formData.append('items', JSON.stringify(items));

    if (!skip) {
      cards.forEach((card) => {
        (photos[card.key] ?? []).forEach(({ file }) => {
          // Field-name convention shared with the backend: photo_<key>.
          formData.append(`photo_${card.key}`, file);
        });
      });
    }

    const result = await inspectionAPI.submitHealthSheet(formData);
    setSubmitting(false);

    // A resubmission (a retried request after a network blip that actually
    // succeeded) must not dead-end the vendor: a sheet already exists, so the
    // outcome they wanted has happened.
    const alreadyExists =
      result?.code === 'HEALTH_SHEET_ALREADY_SUBMITTED' ||
      result?.details?.code === 'HEALTH_SHEET_ALREADY_SUBMITTED';

    if (result?.success || alreadyExists) {
      if (!alreadyExists) toast.success('Health sheet sent to the customer.');
      onSaved?.();
      return;
    }

    toast.error(result?.error || 'Could not save the health sheet.');
  };

  if (loading) {
    return <div className="text-[13px] text-[var(--color-muted)]">Loading the checklist…</div>;
  }

  return (
    <div
      className="grid gap-6 items-start max-[880px]:grid-cols-[minmax(0,1fr)]"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}
    >
      <div className="min-w-0">
        {cards.map((card) => (
          <Card key={card.key} className="mb-4">
            <div className="flex items-start gap-3.5 mb-4">
              <div
                className="w-[38px] h-[38px] rounded-[var(--radius-well)] flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-primary-tint)' }}
              >
                <Image
                  src={iconFor(card.component_key)}
                  alt=""
                  width={22}
                  height={22}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="text-[15px] font-bold truncate">{card.label}</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              {STATUS_OPTIONS.map((option) => {
                const selected = statuses[card.key] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatuses((prev) => ({ ...prev, [card.key]: option.value }))}
                    className="flex-1 min-w-[96px] rounded-[var(--radius-pill)] py-2.5 text-[12.5px] font-bold cursor-pointer"
                    style={{
                      border: `1px solid ${selected ? option.color : STATUS_UNSELECTED.border}`,
                      background: selected ? option.bg : STATUS_UNSELECTED.bg,
                      color: selected ? option.color : STATUS_UNSELECTED.color,
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 max-[880px]:grid-cols-1">
              <Input
                label="Price"
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="₹ 0"
                value={prices[card.key] ?? ''}
                onChange={(e) => setPrices((prev) => ({ ...prev, [card.key]: e.target.value }))}
              />
              <Input
                label="Notes"
                placeholder="What did you find?"
                value={notes[card.key] ?? ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [card.key]: e.target.value }))}
              />
            </div>

            <div className="flex gap-2.5 mt-4 flex-wrap items-center">
              {(photos[card.key] ?? []).map((photo, index) => (
                <div
                  key={photo.preview}
                  className="relative w-[64px] h-[64px] rounded-[var(--radius-well)] overflow-hidden"
                  style={{ border: '1px solid var(--color-line)' }}
                >
                  {/* Object URL from the vendor's own file picker — next/image
                      cannot optimise a blob: source. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(card.key, index)}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ background: 'rgba(17,24,39,.6)' }}
                  >
                    <X size={11} color="#fff" />
                  </button>
                </div>
              ))}

              {(photos[card.key] ?? []).length < MAX_PHOTOS_PER_ITEM && (
                <>
                  <input
                    ref={(el) => {
                      fileInputs.current[card.key] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      addPhoto(card.key, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputs.current[card.key]?.click()}
                    className="w-[64px] h-[64px] rounded-[var(--radius-well)] flex items-center justify-center cursor-pointer text-[var(--color-disabled)]"
                    style={{
                      border: '1px dashed var(--color-line-strong)',
                      background: 'var(--color-canvas)',
                    }}
                    aria-label={`Add a photo for ${card.label}`}
                  >
                    <Camera size={18} />
                  </button>
                </>
              )}
            </div>
          </Card>
        ))}

        <Card>
          <CardHeader title="Overall" />
          <Input
            label="Odometer reading (km)"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="e.g. 42180"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            className="mb-4"
          />
          <Textarea
            label="Notes for the customer"
            placeholder="Anything the customer should know"
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
          />
        </Card>
      </div>

      <div className="min-w-0">
        <Card className="sticky top-[86px]">
          <CardHeader title="Running bill" />
          {cards.map((card) => {
            const value = Number((prices[card.key] ?? '').toString().trim());
            return (
              <div
                key={card.key}
                className="flex items-center justify-between gap-3 py-2.5"
                style={{ borderBottom: '1px solid var(--color-divider)' }}
              >
                <span className="text-[12.5px] text-[var(--color-muted)] truncate">{card.label}</span>
                <span className="text-[13px] font-semibold shrink-0">
                  {Number.isFinite(value) && value > 0 ? formatMoney(value) : '—'}
                </span>
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-3 pt-4">
            <span className="text-[14px] font-bold">Total</span>
            <span className="text-[16px] font-bold" style={{ color: 'var(--color-primary)' }}>
              {formatMoney(runningTotal)}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 mt-6">
            <Button fullWidth loading={submitting} onClick={() => save(false)}>
              Save &amp; continue
            </Button>
            <Button variant="outline" fullWidth disabled={submitting} onClick={() => save(true)}>
              Skip
            </Button>
          </div>

          <p className="text-[11.5px] text-[var(--color-muted)] leading-[1.6] mt-4">
            The health sheet is required before a job can be closed. Skipping records an empty sheet
            rather than blocking you.
          </p>
        </Card>
      </div>
    </div>
  );
}
