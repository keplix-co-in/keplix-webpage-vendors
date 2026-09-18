// Money and date formatting for the portal.
//
// The backend stores service prices and payment amounts as rupee decimals
// (Prisma Float/Decimal), not paise, so values are formatted as-is rather than
// divided. Anything unparseable renders as "—" instead of "₹NaN".

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatMoney = (value, { precise = false } = {}) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return precise ? inrPrecise.format(amount) : inr.format(amount);
};

/** Compact form for dashboard tiles: ₹5.8k, ₹1.2L. */
export const formatMoneyCompact = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${Math.round(amount)}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('en-IN', options).format(date) : '—';
};

export const formatTime = (value) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
    : '—';
};

export const formatDateTime = (value) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date)
    : '—';
};

/** "Today" / "Tomorrow" / "12 Sep" — the vocabulary the booking rows use. */
export const formatRelativeDay = (value) => {
  const date = parseDate(value);
  if (!date) return '—';

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return formatDate(date, { day: 'numeric', month: 'short' });
};

export const initialsOf = (name = '') => {
  const trimmed = String(name).trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
};
