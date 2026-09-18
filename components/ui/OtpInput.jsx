'use client';

import { useEffect, useRef } from 'react';

/**
 * Six OTP boxes per the handoff: flex:1, aspect-ratio 1/1.18, radius 14px,
 * 20px/700. Filled = 2px purple, empty = 2px grey, error = 2px red.
 */
export default function OtpInput({ value = '', onChange, length = 6, error = false, autoFocus = true }) {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const setDigit = (index, digit) => {
    const next = digits.map((d, i) => (i === index ? digit : d)).join('').trimEnd();
    onChange(next.replace(/\s/g, ''));
  };

  const handleChange = (index, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    setDigit(index, digit);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index].trim()) {
        setDigit(index, ' ');
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setDigit(index - 1, ' ');
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  };

  // Vendors paste the code out of an SMS more often than they type it.
  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2.5 w-full">
      {Array.from({ length }).map((_, index) => {
        const digit = digits[index].trim();
        const borderColor = error
          ? 'var(--color-danger-light)'
          : digit
            ? 'var(--color-primary)'
            : 'var(--color-line)';

        return (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
            className="flex-1 min-w-0 text-center text-[20px] font-bold rounded-[14px] outline-none bg-white"
            style={{ aspectRatio: '1 / 1.18', border: `2px solid ${borderColor}` }}
          />
        );
      })}
    </div>
  );
}
