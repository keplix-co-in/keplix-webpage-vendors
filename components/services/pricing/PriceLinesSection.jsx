'use client';

import { Plus, Trash2, Copy } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatMoney } from '@/lib/format';
import { lineTotal, newLine, sumLines } from '@/lib/servicePricing';

// Paise matter on a bill ("₹2,800.50"), but most prices are whole rupees.
export const money = (value) => formatMoney(value, { precise: !Number.isInteger(value) });

// Compact inputs for the table rows; the portal's Input is a tall labelled
// field that would make a 5-line breakdown a whole screen long.
const cell = (error) =>
  [
    'w-full rounded-[10px] px-3 py-2.5 text-base sm:text-[13.5px] outline-none',
    error
      ? 'bg-white border-2 border-[var(--color-danger-light)]'
      : 'bg-[var(--color-canvas)] border border-[var(--color-line)] focus:border-[var(--color-primary)]',
  ].join(' ');

function LineRow({ line, errors, onChange, onDelete }) {
  const set = (key) => (e) => onChange({ ...line, [key]: e.target.value });
  const firstError = errors?.name || errors?.qty || errors?.unit_price || errors?.kind;
  const kindLabel = line.kind === 'part' ? 'Part' : 'Labour';

  return (
    <li className="py-2.5" style={{ borderBottom: '1px solid var(--color-divider)' }}>
      <div className="grid grid-cols-[64px_minmax(0,1fr)_72px_104px_auto] max-sm:grid-cols-[72px_minmax(0,1fr)_auto] gap-2 items-center">
        <span
          className="max-sm:hidden text-[11px] font-bold uppercase tracking-[.5px] text-center rounded-[var(--radius-pill)] py-1"
          style={{
            background: line.kind === 'part' ? 'var(--color-warning-tint)' : 'var(--color-primary-tint)',
            color: line.kind === 'part' ? 'var(--color-warning-text)' : 'var(--color-primary-dark)',
          }}
        >
          {kindLabel}
        </span>
        <input
          aria-label={`${kindLabel} name`}
          className={`${cell(errors?.name)} max-sm:col-span-3`}
          placeholder={line.kind === 'part' ? 'Eg: Brake pads' : 'Eg: Brake service labour'}
          maxLength={80}
          value={line.name}
          onChange={set('name')}
        />
        <input
          aria-label="Quantity"
          className={cell(errors?.qty)}
          inputMode="decimal"
          placeholder="Qty"
          value={line.qty}
          onChange={set('qty')}
        />
        <input
          aria-label="Unit price in rupees"
          className={cell(errors?.unit_price)}
          inputMode="decimal"
          placeholder="₹ Price"
          value={line.unit_price}
          onChange={set('unit_price')}
        />
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${kindLabel.toLowerCase()} line ${line.name || ''}`.trim()}
          className="w-10 h-10 grid place-items-center rounded-full cursor-pointer text-[var(--color-danger)]"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex justify-between gap-3 mt-1 text-[11.5px]">
        <span className="font-bold text-[var(--color-danger)]">{firstError}</span>
        <span className="text-[var(--color-muted)] whitespace-nowrap">
          <span className="sm:hidden">{kindLabel} · </span>
          {money(lineTotal(line))}
        </span>
      </div>
    </li>
  );
}

/**
 * One price breakdown: the Base lines, or one car type's lines. Rows are
 * labour or part, and the live labour / parts / total is shown underneath.
 */
export default function PriceLinesSection({
  title,
  subtitle,
  lines,
  onChange,
  lineErrors = {},
  sectionError,
  onCopyFromBase,
  emptyText,
  action,
}) {
  const totals = sumLines(lines);
  const update = (index, line) => onChange(lines.map((l, i) => (i === index ? line : l)));
  const remove = (index) => onChange(lines.filter((_, i) => i !== index));
  const add = (kind) => onChange([...lines, newLine(kind)]);

  return (
    <section
      className="rounded-[var(--radius-field)] p-3.5 sm:p-4 mb-4"
      style={{ border: '1px solid var(--color-line)' }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold">{title}</h3>
          {subtitle && <p className="text-[12px] text-[var(--color-muted)]">{subtitle}</p>}
        </div>
        {action}
      </div>

      {lines.length > 0 ? (
        <ul>
          {lines.map((line, index) => (
            <LineRow
              key={line.key}
              line={line}
              errors={lineErrors[line.key]}
              onChange={(next) => update(index, next)}
              onDelete={() => remove(index)}
            />
          ))}
        </ul>
      ) : (
        emptyText && <p className="text-[12.5px] text-[var(--color-muted)] py-2">{emptyText}</p>
      )}

      {sectionError && (
        <p className="mt-2 text-[11.5px] font-bold text-[var(--color-danger)]">{sectionError}</p>
      )}

      <div className="flex gap-2 flex-wrap mt-3">
        <Button type="button" variant="tint" size="sm" onClick={() => add('labour')}>
          <Plus size={14} /> Labour
        </Button>
        <Button type="button" variant="tint" size="sm" onClick={() => add('part')}>
          <Plus size={14} /> Part
        </Button>
        {onCopyFromBase && (
          <Button type="button" variant="outline" size="sm" onClick={onCopyFromBase}>
            <Copy size={14} /> Copy from base
          </Button>
        )}
      </div>

      {lines.length > 0 && (
        <dl
          className="flex gap-x-5 gap-y-1 flex-wrap justify-end mt-3 pt-3 text-[12.5px]"
          style={{ borderTop: '1px solid var(--color-divider)' }}
          aria-live="polite"
        >
          <div className="flex gap-1.5"><dt className="text-[var(--color-muted)]">Labour</dt><dd className="font-bold">{money(totals.labour)}</dd></div>
          <div className="flex gap-1.5"><dt className="text-[var(--color-muted)]">Parts</dt><dd className="font-bold">{money(totals.parts)}</dd></div>
          <div className="flex gap-1.5"><dt className="text-[var(--color-muted)]">Total</dt><dd className="font-bold text-[var(--color-ink)]">{money(totals.total)}</dd></div>
        </dl>
      )}
    </section>
  );
}
