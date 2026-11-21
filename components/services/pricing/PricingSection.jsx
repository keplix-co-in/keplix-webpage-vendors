'use client';

import Input from '@/components/ui/Input';
import { Textarea, Toggle } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { BREAKDOWN_BANNER, LIMITS, PRICING_TYPES, chargesInspectionFee, copyLines } from '@/lib/servicePricing';
import PriceLinesSection from './PriceLinesSection';
import ChipsField from './ChipsField';

function TypePicker({ value, onPick, error }) {
  return (
    <fieldset className="mb-5">
      <legend className="block text-[12.5px] font-bold text-[var(--color-ink-body)] mb-2">
        How is this service priced? <span className="text-[var(--color-danger)]">*</span>
      </legend>
      <div className="grid gap-2.5 sm:grid-cols-3" role="radiogroup">
        {PRICING_TYPES.map((type) => {
          const active = value === type.id;
          return (
            <button
              key={type.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(type.id)}
              className="rounded-[var(--radius-field)] px-4 py-3 text-left cursor-pointer"
              style={{
                border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-line)'}`,
                background: active ? 'var(--color-primary-tint)' : 'white',
              }}
            >
              <span className="block text-[13.5px] font-bold">{type.label}</span>
              <span className="block text-[12px] text-[var(--color-muted)] mt-0.5 leading-[1.45]">
                {type.hint}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-[11.5px] font-bold text-[var(--color-danger)]">{error}</p>}
    </fieldset>
  );
}

/**
 * Pricing v2 form section, shared by the portal service form and the onboarding
 * service step. State comes from lib/servicePricing (initialPricingState) and
 * is validated / turned into a payload there; this file only renders it.
 *
 * `segments` = car-type sections to show: [{ id, name, removable }].
 */
export default function PricingSection({
  value,
  onChange,
  errors = {},
  segments = [],
  onRemoveSegment,
  showBreakdownBanner = false,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const setSegment = (id, lines) => onChange({ ...value, segments: { ...value.segments, [id]: lines } });
  const lineErrors = errors.lines ?? {};
  const isInspection = value.pricing_type === 'inspection';

  return (
    <div>
      {showBreakdownBanner && (
        <p
          role="status"
          className="rounded-[var(--radius-field)] px-4 py-3 mb-5 text-[13px] font-bold leading-[1.5]"
          style={{
            background: 'var(--color-warning-tint)',
            border: '1px solid var(--color-warning-border)',
            color: 'var(--color-warning-text)',
          }}
        >
          {BREAKDOWN_BANNER}
        </p>
      )}

      <TypePicker value={value.pricing_type} onPick={(id) => set('pricing_type', id)} error={errors.pricing_type} />

      {isInspection ? (
        // Owner decision 2026-11-21: a switch decides if there is a fee at all.
        // Off = free inspection (inspection_fee 0 is sent); on = amount > 0.
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[12.5px] font-bold text-[var(--color-ink-body)]">
              Charge an inspection fee?
            </span>
            <Toggle
              checked={chargesInspectionFee(value)}
              onChange={(on) =>
                // Why: a free service loads with fee "0"; turning the switch on must not
                // show that 0 in the box (it would just fail "above 0" validation).
                onChange({
                  ...value,
                  charge_inspection_fee: on,
                  inspection_fee: on && !((parseFloat(value.inspection_fee) || 0) > 0) ? '' : value.inspection_fee,
                })
              }
              label="Charge an inspection fee?"
            />
          </div>
          {chargesInspectionFee(value) ? (
            <Input
              label="Inspection fee (₹)"
              name="inspection_fee"
              required
              inputMode="decimal"
              placeholder="Eg: 299"
              value={value.inspection_fee}
              onChange={(e) => set('inspection_fee', e.target.value.replace(/[^\d.]/g, ''))}
              error={errors.inspection_fee}
              hint="This is what the customer pays to book. You add the work after checking the car."
            />
          ) : (
            <p className="text-[12px] text-[var(--color-muted)]">Inspection is free — no fee on the bill.</p>
          )}
        </div>
      ) : (
        <>
          <PriceLinesSection
            title="Base price"
            subtitle={
              segments.length > 0
                ? 'Used for any car type without its own price below.'
                : 'Split the price into labour and parts.'
            }
            lines={value.base}
            onChange={(lines) => set('base', lines)}
            lineErrors={lineErrors}
            sectionError={errors.base}
          />
          {segments.map((segment) => (
            <PriceLinesSection
              key={segment.id}
              title={segment.name}
              lines={value.segments?.[segment.id] ?? []}
              onChange={(lines) => setSegment(segment.id, lines)}
              lineErrors={lineErrors}
              onCopyFromBase={() => setSegment(segment.id, copyLines(value.base))}
              emptyText={`Same as the base price. Add lines or copy from base to set a different price for ${segment.name}.`}
              action={
                segment.removable && onRemoveSegment ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveSegment(segment.id)}>
                    Stop pricing {segment.name}
                  </Button>
                ) : null
              }
            />
          ))}
        </>
      )}

      <ChipsField
        id="pricing-inclusions"
        label="What is included"
        required={value.pricing_type === 'starting'}
        items={value.inclusions}
        onChange={(items) => set('inclusions', items)}
        error={errors.inclusions}
        placeholder="Eg: Brake cleaning"
        hint={`Up to ${LIMITS.listCount} items.`}
      />
      <ChipsField
        id="pricing-exclusions"
        label="What is not included"
        items={value.exclusions}
        onChange={(items) => set('exclusions', items)}
        error={errors.exclusions}
        placeholder="Eg: Brake discs"
      />

      <Textarea
        label="What can change the price"
        name="price_change_note"
        rows={2}
        maxLength={LIMITS.note}
        placeholder="Eg: Price may change if the discs are worn"
        value={value.price_change_note}
        onChange={(e) => set('price_change_note', e.target.value)}
        error={errors.price_change_note}
        className="mb-4"
      />

      <label className="flex items-start gap-2.5 text-[13px] text-[var(--color-ink-body)] cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 w-4 h-4 accent-[var(--color-primary)]"
          checked={value.tax_inclusive !== false}
          onChange={(e) => set('tax_inclusive', e.target.checked)}
        />
        <span>Prices include tax</span>
      </label>
    </div>
  );
}
