// Run: node --test lib/__tests__/subscriptionFlows.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bannerFor, purchasePlan, STATUS_LABEL, subStatusTone } from '../subscription.js';
import { canMarkPaid, billStatusText, isValidMethod } from '../markPaid.js';

const order = { success: true, data: { order_id: 'o1', amount: 99900, currency: 'INR', key_id: 'rzp_x', plan_code: 'gold', period: 'monthly' } };
const resp = { razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 's1' };
// Fake Razorpay constructor: `act(options)` runs when open() is called.
const fakeRzp = (act) => function (opts) { this.open = () => act(opts); };
const mk = (over = {}) => {
  const calls = { verify: 0, order: 0 };
  const api = {
    createOrder: async () => { calls.order++; return order; },
    verify: async () => { calls.verify++; return { success: true }; },
    ...over,
  };
  return { api, calls };
};

test('banner per subscription state: trial/active/grace/expired/never', () => {
  assert.equal(bannerFor({ status: 'trial', days_left: 60 }), null);
  assert.equal(bannerFor({ status: 'trial', days_left: 7 }).tone, 'warning');
  assert.equal(bannerFor({ status: 'active', days_left: 2 }), null);
  assert.equal(bannerFor({ status: 'grace', days_left: 0 }).cta, 'Renew now');
  assert.equal(bannerFor({ status: 'expired', days_left: 0 }).tone, 'danger');
  assert.equal(bannerFor(null), null);
  assert.equal(bannerFor({}), null);
  assert.equal(bannerFor({ status: 'trial' }), null);
});

test('every backend status has a label and tone', () => {
  for (const s of ['trial', 'active', 'grace', 'expired']) {
    assert.ok(STATUS_LABEL[s]);
    assert.notEqual(subStatusTone(s), 'neutral');
  }
  assert.equal(subStatusTone('weird'), 'neutral');
});

test('purchase success verifies with the three razorpay fields', async () => {
  const { api, calls } = mk();
  let sent;
  api.verify = async (p) => { sent = p; calls.verify++; return { success: true }; };
  const r = await purchasePlan({ planCode: 'gold', period: 'monthly', api, load: async () => fakeRzp((o) => o.handler(resp)) });
  assert.deepEqual(r, { status: 'paid' });
  assert.deepEqual(sent, resp);
  assert.equal(calls.verify, 1);
});

test('checkout passes server key, order and amount (paise)', async () => {
  const { api } = mk();
  let opts;
  await purchasePlan({ planCode: 'gold', period: 'monthly', api, load: async () => fakeRzp((o) => { opts = o; o.modal.ondismiss(); }) });
  assert.equal(opts.key, 'rzp_x');
  assert.equal(opts.order_id, 'o1');
  assert.equal(opts.amount, 99900);
});

test('user closes the checkout: cancelled, no verify', async () => {
  const { api, calls } = mk();
  const r = await purchasePlan({ planCode: 'gold', period: 'monthly', api, load: async () => fakeRzp((o) => o.modal.ondismiss()) });
  assert.equal(r.status, 'cancelled');
  assert.equal(calls.verify, 0);
});

test('order failure (e.g. gateway 502) is an error, checkout never loads', async () => {
  let loaded = false;
  const { api } = mk({ createOrder: async () => ({ success: false, error: 'Payment gateway error. Please try again.' }) });
  const r = await purchasePlan({ planCode: 'gold', period: 'monthly', api, load: async () => { loaded = true; } });
  assert.equal(r.status, 'error');
  assert.match(r.message, /gateway/);
  assert.equal(loaded, false);
});

test('verify fails (409 not captured) or throws: verify_failed, never paid', async () => {
  for (const verify of [async () => ({ success: false }), async () => { throw new Error('net'); }, async () => undefined]) {
    const { api } = mk({ verify });
    const r = await purchasePlan({ planCode: 'gold', period: 'yearly', api, load: async () => fakeRzp((o) => o.handler(resp)) });
    assert.equal(r.status, 'verify_failed');
  }
});

test('checkout script blocked (loader returns null): clear error', async () => {
  const { api } = mk();
  const r = await purchasePlan({ planCode: 'gold', period: 'monthly', api, load: async () => null });
  assert.equal(r.status, 'error');
  assert.match(r.message, /payment window/);
});

test('Razorpay constructor throwing is contained', async () => {
  const { api } = mk();
  const r = await purchasePlan({ planCode: 'gold', period: 'monthly', api, load: async () => function () { throw new Error('bad key'); } });
  assert.deepEqual(r, { status: 'error', message: 'bad key' });
});

test('createOrder throwing is contained', async () => {
  const { api } = mk({ createOrder: async () => { throw new Error('boom'); } });
  const r = await purchasePlan({ planCode: 'gold', period: 'monthly', api, load: async () => null });
  assert.deepEqual(r, { status: 'error', message: 'boom' });
});

test('CSP allows Razorpay checkout script, frame and API calls', () => {
  const src = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8');
  const line = (name) => src.split('\n').find((l) => l.includes(name + ' ') && l.includes('https://')) ?? '';
  assert.match(line('script-src'), /https:\/\/checkout\.razorpay\.com/);
  assert.match(line('frame-src'), /https:\/\/api\.razorpay\.com/);
  assert.match(line('frame-src'), /https:\/\/checkout\.razorpay\.com/);
  assert.match(line('connect-src'), /https:\/\/api\.razorpay\.com/);
  assert.match(line('connect-src'), /https:\/\/lumberjack\.razorpay\.com/);
  assert.match(line('img-src'), /razorpay\.com/);
});

test('mark paid: all three methods valid, junk rejected', () => {
  for (const m of ['cash', 'upi', 'card']) assert.ok(isValidMethod(m));
  for (const m of ['online', '', undefined, 'CASH']) assert.equal(isValidMethod(m), false);
});

test('mark paid visibility and status text across bill states', () => {
  const issued = { bill: { paid_at: null }, can: { mark_paid: true } };
  assert.equal(canMarkPaid(issued), true);
  assert.equal(billStatusText(issued), 'Waiting for the customer to pay you.');
  const paidUpi = { bill: { paid_at: '2026-11-24', paid_method: 'upi' }, can: { mark_paid: false } };
  assert.equal(canMarkPaid(paidUpi), false);
  assert.equal(billStatusText(paidUpi), 'Paid by UPI.');
  assert.equal(billStatusText({ bill: { paid_at: 'x', paid_method: 'online' } }), 'Paid.');
});

test('legacy booking without a bill: no card, no action, no crash', () => {
  for (const p of [null, undefined, {}, { bill: null, can: { mark_paid: true } }]) {
    assert.equal(canMarkPaid(p), false);
    assert.equal(billStatusText(p), 'No bill yet.');
  }
});
