'use client';

/**
 * Half-hourly 12-hour times, matching the vocabulary `operating_hours` is
 * stored in ("10:00 AM - 8:00 PM").
 */
export const TIME_OPTIONS = Array.from({ length: 48 }).map((_, index) => {
  const hour24 = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? '00' : '30';
  const suffix = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minutes} ${suffix}`;
});

/**
 * "1:30 PM" to minutes past midnight, so two of these can be compared.
 *
 * The values come from the closed list above, so there is no format to
 * validate — only the ordering between two of them is worth checking.
 * Returns null for an unset or unrecognised value.
 */
export const toMinutes = (time) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(time ?? '').trim());
  if (!match) return null;

  const [, rawHour, minutes, suffix] = match;
  const hour = Number(rawHour) % 12;
  const offset = suffix.toUpperCase() === 'PM' ? 12 : 0;
  return (hour + offset) * 60 + Number(minutes);
};

export default function TimeSelect({ value, onChange, highlighted = false, ariaLabel, className = '' }) {
  return (
    <select
      aria-label={ariaLabel}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      // Narrower on phones so "from – to" fits on one line in a 375px card;
      // two 160px selects used to wrap and leave "to" dangling. Always 16px:
      // iOS Safari zooms in on a focused <select> with smaller text.
      className={`rounded-[var(--radius-pill)] px-2.5 sm:px-[26px] py-[13px] text-base font-bold text-center outline-none cursor-pointer w-[116px] sm:w-auto sm:min-w-[160px] ${className}`}
      style={
        highlighted
          ? {
              border: '2px solid var(--color-primary)',
              background: 'var(--color-primary-tint)',
              color: 'var(--color-primary)',
            }
          : { border: '1px solid var(--color-line-strong)', background: '#fff' }
      }
    >
      <option value="">Select</option>
      {TIME_OPTIONS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );
}
