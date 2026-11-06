// Security A-023: changing EXISTING payout details (bank account number, IFSC,
// account holder name, UPI ID) needs a step-up OTP. Backend contract
// (keplix-backend/services/payoutChangeService.js):
//   POST /accounts/vendor/profile/payout-otp  -> emails a 6-digit code
//   The profile PUT/POST must then include `payout_otp`; otherwise 403
//   { code: 'PAYOUT_OTP_REQUIRED' } or { code: 'PAYOUT_OTP_INVALID' }.
//   First-time setup (nothing saved yet) needs no OTP.
// After a change the server holds payouts for 24h.
// Mirrors keplix-frontend/utils/payoutChange.js so web and app behave alike.

export const PAYOUT_OTP_REQUIRED = 'PAYOUT_OTP_REQUIRED';
export const PAYOUT_OTP_INVALID = 'PAYOUT_OTP_INVALID';

export const PAYOUT_HOLD_NOTICE =
  'For your security, payouts to the new account start after 24 hours.';

export const PAYOUT_KEYS = ['bank_account_number', 'ifsc_code', 'bank_account_holder_name', 'upi_id'];

// Trim only, no case-folding: must match the backend's payoutFieldsChanging
// exactly, or a case-only edit (e.g. lowercased IFSC) skips the OTP here and
// the server then rejects it with PAYOUT_OTP_REQUIRED.
const norm = (v) => String(v ?? '').trim();

/** Fields undefined in `next` are ignored (not edited on this screen). */
export function comparePayoutDetails(saved = {}, next = {}) {
  const hadSaved = PAYOUT_KEYS.some((k) => norm(saved?.[k]) !== '');
  const changed = PAYOUT_KEYS.some(
    (k) => next?.[k] !== undefined && norm(saved?.[k]) !== norm(next[k])
  );
  return { changed, hadSaved };
}

/** True when a change to existing payout details needs the OTP step-up. */
export function needsPayoutOtp(saved, next) {
  const { changed, hadSaved } = comparePayoutDetails(saved, next);
  return changed && hadSaved;
}

/** Machine-readable error code from either the axios or the fetch result shape. */
export function payoutErrorCode(res) {
  return res?.details?.code || res?.code || null;
}
