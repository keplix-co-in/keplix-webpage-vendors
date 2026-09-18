'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Auth/onboarding text field per the handoff: #F9FAFB fill, 1px #E5E7EB border,
 * 16px radius. The error state is a 2px red border on a white fill with a
 * 11.5px/700 message below — white, not tinted, so the error reads as the field
 * being wrong rather than the field being disabled.
 */
export default function Input({
  label,
  error,
  hint,
  required = false,
  type = 'text',
  className = '',
  id,
  ...props
}) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const inputId = id || props.name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[12.5px] font-bold text-[var(--color-ink-body)] mb-2"
        >
          {label}
          {required && <span className="text-[var(--color-danger)]"> *</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={Boolean(error)}
          className={[
            'w-full rounded-[var(--radius-field)] px-[18px] py-[15px] text-[14px] outline-none',
            'placeholder:text-[var(--color-disabled)]',
            error
              ? 'bg-white border-2 border-[var(--color-danger-light)]'
              : 'bg-[var(--color-canvas)] border border-[var(--color-line)] focus:border-[var(--color-primary)]',
            isPassword ? 'pr-12' : '',
          ].join(' ')}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-disabled)] cursor-pointer"
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-[11.5px] font-bold text-[var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-[11.5px] text-[var(--color-disabled)]">{hint}</p>
      ) : null}
    </div>
  );
}
