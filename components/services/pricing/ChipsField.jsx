'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { chipError, LIMITS } from '@/lib/servicePricing';

/** Add/remove text chips (inclusions, exclusions). Enter adds too. */
export default function ChipsField({ id, label, hint, items, onChange, error, placeholder, required }) {
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState(null);

  const add = () => {
    const problem = chipError(items, text);
    if (problem) {
      setLocalError(problem);
      return;
    }
    onChange([...items, text.trim()]);
    setText('');
    setLocalError(null);
  };

  const shownError = localError || error;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-[12.5px] font-bold text-[var(--color-ink-body)] mb-2">
        {label}
        {required && <span className="text-[var(--color-danger)]"> *</span>}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          className={[
            'w-full rounded-[var(--radius-field)] px-[18px] py-3 text-base sm:text-[14px] outline-none placeholder:text-[var(--color-disabled)]',
            shownError
              ? 'bg-white border-2 border-[var(--color-danger-light)]'
              : 'bg-[var(--color-canvas)] border border-[var(--color-line)] focus:border-[var(--color-primary)]',
          ].join(' ')}
          value={text}
          maxLength={LIMITS.listItem}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            if (localError) setLocalError(null);
          }}
          onKeyDown={(e) => {
            // Enter would submit the whole service form.
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" size="md" onClick={add}>
          Add
        </Button>
      </div>

      {items.length > 0 && (
        <ul className="flex gap-2 flex-wrap mt-2.5">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] pl-3 pr-1 py-1 text-[12.5px] font-bold max-w-full"
              style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary-dark)' }}
            >
              <span className="truncate">{item}</span>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="w-7 h-7 grid place-items-center rounded-full cursor-pointer shrink-0"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {shownError ? (
        <p className="mt-2 text-[11.5px] font-bold text-[var(--color-danger)]">{shownError}</p>
      ) : hint ? (
        <p className="mt-2 text-[11.5px] text-[var(--color-disabled)]">{hint}</p>
      ) : null}
    </div>
  );
}
