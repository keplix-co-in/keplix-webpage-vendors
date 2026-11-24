// Pure helpers for the "Mark as paid" action on the booking bill.
// Pricing object contract: keplix-backend/docs/PRICING_V2_API.md section 3.

export const PAY_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
];

const METHOD_LABEL = Object.fromEntries(PAY_METHODS.map((m) => [m.value, m.label]));

/** Show the action only when the backend says the vendor may mark this bill paid. */
export const canMarkPaid = (pricing) => pricing?.can?.mark_paid === true && Boolean(pricing?.bill);

export const isValidMethod = (m) => PAY_METHODS.some((x) => x.value === m);

/** Short status line for the bill card, in simple words. */
export function billStatusText(pricing) {
  const bill = pricing?.bill;
  if (!bill) return 'No bill yet.';
  if (bill.paid_at) {
    const how = METHOD_LABEL[bill.paid_method];
    return how ? `Paid by ${how}.` : 'Paid.';
  }
  return 'Waiting for the customer to pay you.';
}
