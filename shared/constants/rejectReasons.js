// Reasons a vendor can give for declining a request.
//
// Ported verbatim from keplix-frontend/components/Vendor/HomePage/HomePage.jsx
// (REJECTION_REASONS, ~L50) so the same set of reasons reaches the customer
// whether the vendor declined on the phone or on the web.
export const REJECTION_REASONS = [
  'Too busy at selected time',
  'I want to reschedule this order',
  'Service cannot be provided',
  'Equipment/parts not available',
  'Other Reason',
];

// The design preselects the second option on the reject screen.
export const DEFAULT_REJECTION_REASON = REJECTION_REASONS[1];

export default REJECTION_REASONS;
