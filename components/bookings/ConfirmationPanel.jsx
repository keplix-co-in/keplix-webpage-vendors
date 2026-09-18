'use client';

import { Check } from 'lucide-react';

const TONES = {
  primary: 'var(--color-primary)',
  teal: 'var(--color-teal)',
  danger: 'var(--color-danger)',
};

/**
 * End-of-flow confirmation — the full-bleed coloured panel with a 92px white
 * circle and check, used by rejection sent, job completed and walk-in closed.
 */
export default function ConfirmationPanel({ tone = 'primary', title, body, children }) {
  return (
    <div
      className="rounded-[var(--radius-auth)] px-7 py-16 flex flex-col items-center text-center"
      style={{ background: TONES[tone] ?? TONES.primary }}
    >
      <div className="w-[92px] h-[92px] rounded-full bg-white flex items-center justify-center mb-7">
        <Check size={40} color={TONES[tone] ?? TONES.primary} strokeWidth={3} />
      </div>

      <h2 className="text-[24px] font-bold text-white leading-[1.4] max-w-[520px]">{title}</h2>
      {body && (
        <p className="text-[13.5px] mt-3 max-w-[460px] leading-[1.6]" style={{ color: 'rgba(255,255,255,.85)' }}>
          {body}
        </p>
      )}

      {children && <div className="mt-8 flex gap-3 flex-wrap justify-center">{children}</div>}
    </div>
  );
}

/** White pill CTA, for use inside the coloured panel. */
export function ConfirmationAction({ children, ...props }) {
  return (
    <button
      type="button"
      className="bg-white text-[14px] font-bold rounded-[var(--radius-pill)] px-7 py-3.5 cursor-pointer"
      style={{ color: 'var(--color-primary-dark)' }}
      {...props}
    >
      {children}
    </button>
  );
}
