import { formatMoney, formatMoneyCompact } from '@/lib/format';

/**
 * A money figure for a stat tile. Phones show the compact form (₹1.2L): in a
 * half-width tile at 375px a lifetime total like "₹9,87,65,432" had no room
 * and broke mid-number. The exact amount stays in the title tooltip and in the
 * full form from `sm` up. Missing values render "—" in both forms.
 */
export default function TileMoney({ value }) {
  const full = formatMoney(value);
  return (
    <span title={full}>
      <span className="sm:hidden" aria-hidden="true">
        {formatMoneyCompact(value)}
      </span>
      <span className="max-sm:sr-only">{full}</span>
    </span>
  );
}
