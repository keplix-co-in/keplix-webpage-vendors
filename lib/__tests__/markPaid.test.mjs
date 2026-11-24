// Run: node --test lib/__tests__/markPaid.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canMarkPaid, isValidMethod, billStatusText, PAY_METHODS } from '../markPaid.js';

test('canMarkPaid needs the backend flag and a bill', () => {
  assert.equal(canMarkPaid(null), false);
  assert.equal(canMarkPaid({ can: { mark_paid: true }, bill: null }), false);
  assert.equal(canMarkPaid({ can: { mark_paid: false }, bill: { total: 5 } }), false);
  assert.equal(canMarkPaid({ can: { mark_paid: true }, bill: { total: 5 } }), true);
  // can.pay is always false on the pay-the-garage backend and must not matter.
  assert.equal(canMarkPaid({ can: { pay: true }, bill: { total: 5 } }), false);
});

test('methods are cash, upi, card', () => {
  assert.deepEqual(PAY_METHODS.map((m) => m.value), ['cash', 'upi', 'card']);
  assert.equal(isValidMethod('upi'), true);
  assert.equal(isValidMethod('cheque'), false);
});

test('billStatusText', () => {
  assert.equal(billStatusText({ bill: null }), 'No bill yet.');
  assert.equal(billStatusText({ bill: { paid_at: null } }), 'Waiting for the customer to pay you.');
  assert.equal(billStatusText({ bill: { paid_at: 'x', paid_method: 'cash' } }), 'Paid by Cash.');
  assert.equal(billStatusText({ bill: { paid_at: 'x', paid_method: null } }), 'Paid.');
});
