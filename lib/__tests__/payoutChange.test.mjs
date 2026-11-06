// Run: node --test lib/__tests__/payoutChange.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { needsPayoutOtp, comparePayoutDetails, payoutErrorCode } from '../payoutChange.js';

const saved = { bank_account_number: '123', ifsc_code: 'HDFC0001', bank_account_holder_name: 'A', upi_id: '' };

test('first-time setup needs no OTP', () => {
  assert.equal(needsPayoutOtp({}, { upi_id: 'a@okaxis' }), false);
});

test('changing saved details needs an OTP', () => {
  assert.equal(needsPayoutOtp(saved, { ...saved, ifsc_code: 'SBIN0001' }), true);
  assert.equal(needsPayoutOtp(saved, { ...saved, upi_id: 'a@okaxis' }), true);
});

test('unchanged (case/whitespace) or GST-only edits need no OTP', () => {
  assert.equal(needsPayoutOtp(saved, { ...saved, ifsc_code: ' HDFC0001 ', gst_number: 'X' }), false);
  assert.deepEqual(comparePayoutDetails(saved, {}), { changed: false, hadSaved: true });
});

test('error code read from axios and fetch shapes', () => {
  assert.equal(payoutErrorCode({ details: { code: 'PAYOUT_OTP_INVALID' } }), 'PAYOUT_OTP_INVALID');
  assert.equal(payoutErrorCode({ code: 'PAYOUT_OTP_REQUIRED' }), 'PAYOUT_OTP_REQUIRED');
  assert.equal(payoutErrorCode({}), null);
});

test('case-only change needs an OTP, matching the backend (trim only)', () => {
  assert.equal(needsPayoutOtp(saved, { ...saved, ifsc_code: 'hdfc0001' }), true);
});
