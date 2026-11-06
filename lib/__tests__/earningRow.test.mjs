// Run: node --test lib/__tests__/earningRow.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toEarningRow } from '../entities.js';

test('on_top booking: full service price to vendor, no fee line', () => {
  const row = toEarningRow({ id: 1, payment: { feeModel: 'on_top', amount: 1100, platformFee: 100, vendorAmount: 1000 } });
  assert.equal(row.amount, 1000);
  assert.equal(row.net, 1000);
  assert.equal(row.fee, null);
});

test('legacy booking keeps the stored deduction', () => {
  const row = toEarningRow({ id: 2, payment: { amount: 1000, platformFee: 150, vendorAmount: 850 } });
  assert.equal(row.amount, 1000);
  assert.equal(row.fee, 150);
  assert.equal(row.net, 850);
});

test('zero fee is not shown as a deduction', () => {
  const row = toEarningRow({ id: 3, payment: { amount: 500, platformFee: 0, vendorAmount: 500 } });
  assert.equal(row.fee, null);
  assert.equal(row.net, 500);
});
