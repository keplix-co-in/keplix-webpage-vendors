// Run: node --test lib/__tests__/subscription.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bannerFor, planPrice, sortPlans, checkoutOptions } from '../subscription.js';

test('no banner for healthy states', () => {
  assert.equal(bannerFor(null), null);
  assert.equal(bannerFor({ status: 'active', days_left: 3 }), null);
  assert.equal(bannerFor({ status: 'trial', days_left: 40 }), null);
});

test('trial banner within 7 days, singular and today', () => {
  assert.match(bannerFor({ status: 'trial', days_left: 7 }).title, /7 days/);
  assert.match(bannerFor({ status: 'trial', days_left: 1 }).title, /1 day$/);
  assert.match(bannerFor({ status: 'trial', days_left: 0 }).title, /today/);
  assert.equal(bannerFor({ status: 'trial', days_left: 8 }), null);
});

test('grace and expired banners', () => {
  assert.equal(bannerFor({ status: 'grace', days_left: 0 }).tone, 'warning');
  const e = bannerFor({ status: 'expired' });
  assert.equal(e.tone, 'danger');
  assert.match(e.body, /hidden/);
});

test('plan pricing is monthly only', () => {
  const p = { monthly_price: '999.00', yearly_price: 9990 };
  assert.equal(planPrice(p), 999);
  assert.equal(planPrice({}), null);
});

test('sortPlans tolerates bad payloads', () => {
  assert.deepEqual(sortPlans(null), []);
  assert.deepEqual(sortPlans([{ code: 'b', sort_order: 2 }, { code: 'a', sort_order: 1 }]).map((p) => p.code), ['a', 'b']);
});

test('checkoutOptions uses server key and amount', () => {
  const o = checkoutOptions(
    { order_id: 'o1', amount: 99900, currency: 'INR', key_id: 'rzp_x', plan_code: 'gold', period: 'monthly' },
    { name: 'A', onSuccess: () => {}, onDismiss: () => {} }
  );
  assert.equal(o.key, 'rzp_x');
  assert.equal(o.amount, 99900);
  assert.equal(o.order_id, 'o1');
});
