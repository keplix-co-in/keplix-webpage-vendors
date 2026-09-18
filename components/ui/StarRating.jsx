'use client';

import { Star } from 'lucide-react';

/**
 * Real star components rather than a "★★★★★" string, so half-stars are
 * possible — the handoff calls this out explicitly.
 */
export default function StarRating({ value = 0, size = 14, showValue = false, interactive = false, onChange }) {
  const rating = Number(value) || 0;

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => {
        const fill = Math.max(0, Math.min(1, rating - (index - 1)));
        const star = (
          <span key={index} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-[var(--color-line-strong)]" fill="none" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
                aria-hidden="true"
              >
                <Star size={size} style={{ color: 'var(--color-star-alt)' }} fill="var(--color-star-alt)" />
              </span>
            )}
          </span>
        );

        return interactive ? (
          <button
            key={index}
            type="button"
            aria-label={`${index} star${index > 1 ? 's' : ''}`}
            onClick={() => onChange?.(index)}
            className="cursor-pointer"
          >
            {star}
          </button>
        ) : (
          star
        );
      })}
      {showValue && (
        <span className="text-[12.5px] font-bold text-[var(--color-ink-secondary)] ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
