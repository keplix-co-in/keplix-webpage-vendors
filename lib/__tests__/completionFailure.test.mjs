// Run: node --test lib/__tests__/completionFailure.test.mjs
// Completion page failure branches (pricing v2 BILL_NOT_ISSUED gate).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completionFailureKind, BILL_NOT_ISSUED_MESSAGE } from '../completionFailure.js';

test('409 BILL_NOT_ISSUED is the bill case, not the health-sheet case', () => {
  // Shape uploadWithFetch returns (lib/api.js): code from the body, plus status.
  assert.equal(completionFailureKind({ success: false, status: 409, code: 'BILL_NOT_ISSUED' }), 'bill_not_issued');
  // Code only inside details still counts.
  assert.equal(completionFailureKind({ status: 409, details: { code: 'BILL_NOT_ISSUED' } }), 'bill_not_issued');
});

test('health-sheet gate and any other 409 go to the health sheet (unchanged)', () => {
  assert.equal(completionFailureKind({ status: 409, code: 'HEALTH_SHEET_REQUIRED' }), 'health_sheet');
  assert.equal(completionFailureKind({ status: 409 }), 'health_sheet');
});

test('everything else is a plain error', () => {
  assert.equal(completionFailureKind({ status: 400, error: 'Cannot mark completed' }), 'error');
  assert.equal(completionFailureKind({ status: 0, error: 'Network error' }), 'error');
  assert.equal(completionFailureKind(undefined), 'error');
  assert.equal(completionFailureKind(null), 'error');
});

test('the message names the vendor app where bills are issued', () => {
  assert.match(BILL_NOT_ISSUED_MESSAGE, /Garage Partner app/);
});
