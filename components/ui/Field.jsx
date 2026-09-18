'use client';

import { ChevronDown } from 'lucide-react';

export function Select({ label, error, required, options = [], className = '', id, ...props }) {
  const selectId = id || props.name;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[12.5px] font-bold text-[var(--color-ink-body)] mb-2"
        >
          {label}
          {required && <span className="text-[var(--color-danger)]"> *</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={[
            'w-full appearance-none rounded-[var(--radius-field)] px-[18px] py-[15px] pr-11 text-[14px] outline-none cursor-pointer',
            error
              ? 'bg-white border-2 border-[var(--color-danger-light)]'
              : 'bg-[var(--color-canvas)] border border-[var(--color-line)] focus:border-[var(--color-primary)]',
          ].join(' ')}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted)]"
        />
      </div>
      {error && <p className="mt-2 text-[11.5px] font-bold text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, required, rows = 4, className = '', id, ...props }) {
  const areaId = id || props.name;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={areaId}
          className="block text-[12.5px] font-bold text-[var(--color-ink-body)] mb-2"
        >
          {label}
          {required && <span className="text-[var(--color-danger)]"> *</span>}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        className={[
          'w-full rounded-[var(--radius-field)] px-[18px] py-[15px] text-[14px] outline-none resize-y leading-[1.6]',
          'placeholder:text-[var(--color-disabled)]',
          error
            ? 'bg-white border-2 border-[var(--color-danger-light)]'
            : 'bg-[var(--color-canvas)] border border-[var(--color-line)] focus:border-[var(--color-primary)]',
        ].join(' ')}
        {...props}
      />
      {error && <p className="mt-2 text-[11.5px] font-bold text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}

/** Pill filter chips — service categories, booking tabs, holiday days. */
export function Chip({ active = false, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={[
        'rounded-[var(--radius-pill)] px-4 py-2 text-[12.5px] font-bold border cursor-pointer whitespace-nowrap',
        active
          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
          : 'bg-white text-[var(--color-ink-body)] border-[var(--color-line)]',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative w-[44px] h-[24px] rounded-[var(--radius-pill)] cursor-pointer transition-colors shrink-0"
      style={{ background: checked ? 'var(--color-success)' : 'var(--color-line-strong)' }}
    >
      <span
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
        style={{ left: checked ? 23 : 3 }}
      />
    </button>
  );
}

export default Select;
