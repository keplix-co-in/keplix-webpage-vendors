// Run: node --test lib/__tests__/servicePricing.test.mjs
// Pricing v2 helpers (contract: keplix-backend/docs/PRICING_V2_API.md §1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAmount,
  lineTotal,
  sumLines,
  newLine,
  copyLines,
  rekeyPricing,
  initialPricingState,
  shownSegments,
  validatePricing,
  buildPricingPayload,
  pricingFormEntries,
  chipError,
  servicePriceLabel,
  chargesInspectionFee,
} from '../servicePricing.js';

const line = (kind, name, qty, unit_price) => ({ ...newLine(kind), name, qty, unit_price });
const state = (over = {}) => ({ ...initialPricingState(null), ...over });

// ------------------------------------------------------------- totals

test('parseAmount accepts decimals and rejects empty or junk text', () => {
  assert.equal(parseAmount('12.5'), 12.5);
  assert.equal(parseAmount(' 7 '), 7);
  assert.equal(parseAmount(3), 3);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('  '), null);
  assert.equal(parseAmount('-1'), null);
  assert.equal(parseAmount('1,000'), null);
  assert.equal(parseAmount(NaN), null);
});

test('line total is qty x unit price, 0 while unfilled', () => {
  assert.equal(lineTotal(line('labour', 'a', '2', '450')), 900);
  assert.equal(lineTotal(line('part', 'b', '1.5', '100.10')), 150.15);
  assert.equal(lineTotal(line('part', 'c', '1', '')), 0);
});

test('sums labour and parts in paise (no float drift)', () => {
  const t = sumLines([
    line('labour', 'x', '1', '0.1'),
    line('labour', 'y', '1', '0.2'),
    line('part', 'z', '3', '933.33'),
  ]);
  assert.equal(t.labour, 0.3);
  assert.equal(t.parts, 2799.99);
  assert.equal(t.total, 2800.29);
});

test('copyLines gives new keys and the same content', () => {
  const src = [line('part', 'pads', '1', '2200')];
  const [copy] = copyLines(src);
  assert.notEqual(copy.key, src[0].key);
  assert.equal(copy.name, 'pads');
});

test('rekeyPricing replaces every line key (draft restored from storage)', () => {
  const restored = JSON.parse(JSON.stringify(state({
    base: [line('labour', 'L', '1', '10')],
    segments: { SEDAN: [line('part', 'P', '1', '5')] },
  })));
  const fresh = rekeyPricing(restored);
  assert.notEqual(fresh.base[0].key, restored.base[0].key);
  assert.notEqual(fresh.segments.SEDAN[0].key, restored.segments.SEDAN[0].key);
  assert.equal(fresh.segments.SEDAN[0].name, 'P');
});

// ------------------------------------------------------------- initial state

test('empty service starts as fixed, one blank labour line, tax inclusive', () => {
  const s = initialPricingState(null);
  assert.equal(s.pricing_type, 'fixed');
  assert.equal(s.base.length, 1);
  assert.equal(s.base[0].kind, 'labour');
  assert.equal(s.tax_inclusive, true);
  assert.deepEqual(s.kept_segments, []);
});

test('v2 service: lines split into base and car types, other fields loaded', () => {
  const s = initialPricingState({
    pricing_type: 'starting',
    price_lines: [
      { id: 1, segment: null, kind: 'labour', name: 'Labour', qty: 1, unit_price: 1200 },
      { id: 2, segment: null, kind: 'part', name: 'Pads', qty: 1, unit_price: 2800 },
      { id: 3, segment: 'SEDAN', kind: 'labour', name: 'Labour', qty: 1, unit_price: 1500 },
    ],
    inclusions: ['Brake cleaning'],
    exclusions: ['Discs'],
    price_change_note: 'If discs are worn',
    inspection_fee: null,
    tax_inclusive: false,
  });
  assert.equal(s.pricing_type, 'starting');
  assert.equal(s.base.length, 2);
  assert.equal(s.base[1].unit_price, '2800');
  assert.equal(s.segments.SEDAN.length, 1);
  assert.deepEqual(s.kept_segments, ['SEDAN']);
  assert.deepEqual(s.inclusions, ['Brake cleaning']);
  assert.equal(s.tax_inclusive, false);
});

test('a car type identical to the base loads as "same as base" (empty)', () => {
  const s = initialPricingState({
    price_lines: [
      { segment: null, kind: 'labour', name: 'Service charge', qty: 1, unit_price: 899 },
      { segment: 'HATCHBACK', kind: 'labour', name: 'Service charge', qty: 1, unit_price: 899 },
    ],
  });
  assert.deepEqual(s.segments.HATCHBACK, []);
  assert.deepEqual(s.kept_segments, ['HATCHBACK']);
});

test('old backend response (no price_lines) is synthesised like the server does', () => {
  const s = initialPricingState({
    price: '899.00',
    segmentPrices: [
      { segment: 'HATCHBACK', price: '899.00' },
      { segment: 'LUXURY', price: '1500' },
    ],
  });
  assert.equal(s.base.length, 1);
  assert.equal(s.base[0].name, 'Service charge');
  assert.equal(s.base[0].unit_price, '899');
  assert.deepEqual(s.segments.HATCHBACK, []); // same as base
  assert.equal(s.segments.LUXURY[0].unit_price, '1500');
  assert.deepEqual(s.kept_segments, ['HATCHBACK', 'LUXURY']);
});

test('inspection service without inspection_fee falls back to price', () => {
  const s = initialPricingState({ pricing_type: 'inspection', price: 299, price_lines: [] });
  assert.equal(s.inspection_fee, '299');
});

test('shownSegments = kept car types plus the picked one, in list order', () => {
  const s = state({ kept_segments: ['LUXURY'] });
  assert.deepEqual(shownSegments(s, 'HATCHBACK'), ['HATCHBACK', 'LUXURY']);
  assert.deepEqual(shownSegments(s, 'LUXURY'), ['LUXURY']);
  assert.deepEqual(shownSegments(state(), null), []);
});

// ------------------------------------------------------------- validation

const valid = (s, opts) => validatePricing(s, opts);

test('fixed: a filled base line is valid', () => {
  const r = valid(state({ base: [line('labour', 'Oil change labour', '1', '499')] }));
  assert.equal(r.isValid, true);
});

test('fixed/starting need at least one base line', () => {
  const r = valid(state({ base: [] }));
  assert.equal(r.isValid, false);
  assert.ok(r.errors.base);
  assert.ok(valid(state({ pricing_type: 'starting', base: [], inclusions: ['x'] })).errors.base);
});

test('line rules: name 1-80, qty > 0 with max 2 decimals, unit price >= 0', () => {
  const bad = [
    line('labour', '', '1', '10'),
    line('labour', 'x'.repeat(81), '1', '10'),
    line('part', 'q0', '0', '10'),
    line('part', 'q3', '1.555', '10'),
    line('part', 'neg', '1', '-5'),
    line('part', 'blank', '1', ''),
  ];
  const r = valid(state({ base: bad }));
  assert.equal(r.isValid, false);
  assert.ok(r.errors.lines[bad[0].key].name);
  assert.ok(r.errors.lines[bad[1].key].name);
  assert.ok(r.errors.lines[bad[2].key].qty);
  assert.ok(r.errors.lines[bad[3].key].qty);
  assert.ok(r.errors.lines[bad[4].key].unit_price);
  assert.ok(r.errors.lines[bad[5].key].unit_price);

  const ok = valid(state({ base: [line('part', 'Coolant', '1.25', '0'), line('labour', 'x'.repeat(80), '2', '10')] }));
  assert.equal(ok.isValid, true);
});

test('car-type lines are validated only for shown car types', () => {
  const broken = line('labour', '', '1', '10');
  const s = state({
    base: [line('labour', 'Labour', '1', '100')],
    segments: { SEDAN: [broken] },
    kept_segments: [],
  });
  assert.equal(valid(s, { segments: [] }).isValid, true);
  assert.equal(valid(s, { segments: ['SEDAN'] }).isValid, false);
});

test('starting needs at least one inclusion', () => {
  const base = [line('labour', 'AC check', '1', '1499')];
  assert.ok(valid(state({ pricing_type: 'starting', base })).errors.inclusions);
  assert.equal(valid(state({ pricing_type: 'starting', base, inclusions: ['Gas top-up'] })).isValid, true);
});

test('inclusions/exclusions: 1-80 chars each, max 20', () => {
  const base = [line('labour', 'L', '1', '1')];
  assert.ok(valid(state({ base, inclusions: Array.from({ length: 21 }, (_, i) => `i${i}`) })).errors.inclusions);
  assert.ok(valid(state({ base, exclusions: ['  '] })).errors.exclusions);
  assert.ok(valid(state({ base, exclusions: ['y'.repeat(81)] })).errors.exclusions);
  assert.equal(valid(state({ base, exclusions: Array.from({ length: 20 }, (_, i) => `e${i}`) })).isValid, true);
});

test('price change note max 300', () => {
  const base = [line('labour', 'L', '1', '1')];
  assert.ok(valid(state({ base, price_change_note: 'n'.repeat(301) })).errors.price_change_note);
  assert.equal(valid(state({ base, price_change_note: 'n'.repeat(300) })).isValid, true);
});

// Updated 2026-11-21 (owner decision): with the fee switch on, 0 is no longer
// allowed; free inspection = switch off.
test('inspection: switch on needs a fee > 0, lines not checked', () => {
  const s = state({ pricing_type: 'inspection', charge_inspection_fee: true, base: [line('labour', '', '', '')] });
  assert.ok(valid({ ...s, inspection_fee: '' }).errors.inspection_fee);
  assert.ok(valid({ ...s, inspection_fee: '0' }).errors.inspection_fee);
  assert.equal(valid({ ...s, inspection_fee: '299' }).isValid, true);
});

test('unknown pricing type is rejected', () => {
  assert.ok(valid(state({ pricing_type: 'free', base: [line('labour', 'L', '1', '1')] })).errors.pricing_type);
});

test('chipError blocks empty, too long, duplicate and the 21st chip', () => {
  assert.ok(chipError([], '  '));
  assert.ok(chipError([], 'z'.repeat(81)));
  assert.ok(chipError(['Brake cleaning'], 'brake cleaning'));
  assert.ok(chipError(Array.from({ length: 20 }, (_, i) => `c${i}`), 'new'));
  assert.equal(chipError([], 'Wheel alignment'), null);
});

// ------------------------------------------------------------- payload

test('fixed payload: v2 lines + legacy price (base total) + segment totals', () => {
  const s = state({
    base: [line('labour', ' Brake labour ', '1', '1200'), line('part', 'Pads', '2', '1400')],
    segments: { LUXURY: [line('labour', 'Brake labour', '1', '2000')] },
    kept_segments: ['LUXURY'],
    inclusions: [' Brake cleaning '],
    price_change_note: ' Discs extra ',
  });
  const p = buildPricingPayload(s, { segments: ['HATCHBACK', 'LUXURY'] });

  assert.equal(p.pricing_type, 'fixed');
  assert.equal(p.tax_inclusive, true);
  assert.deepEqual(p.inclusions, ['Brake cleaning']);
  assert.equal(p.price_change_note, 'Discs extra');
  assert.equal('inspection_fee' in p, false);

  // Base lines first (segment null), names trimmed, numbers parsed.
  assert.deepEqual(p.price_lines.slice(0, 2), [
    { segment: null, kind: 'labour', name: 'Brake labour', qty: 1, unit_price: 1200 },
    { segment: null, kind: 'part', name: 'Pads', qty: 2, unit_price: 1400 },
  ]);
  // HATCHBACK is the picked car type with an empty section: it gets a copy of
  // the base lines, like the old form gave the picked car type the base price.
  const hatch = p.price_lines.filter((l) => l.segment === 'HATCHBACK');
  assert.equal(hatch.length, 2);
  assert.equal(p.price_lines.filter((l) => l.segment === 'LUXURY').length, 1);

  // Legacy compat fields.
  assert.equal(p.price, 4000);
  assert.deepEqual(p.segment_prices, [
    { segment: 'HATCHBACK', price: 4000 },
    { segment: 'LUXURY', price: 2000 },
  ]);
});

test('car types not shown are not sent (even if they still hold lines)', () => {
  const s = state({
    base: [line('labour', 'L', '1', '500')],
    segments: { SEDAN: [line('labour', 'L', '1', '700')] },
  });
  const p = buildPricingPayload(s, { segments: [] });
  assert.equal(p.price_lines.every((l) => l.segment === null), true);
  assert.deepEqual(p.segment_prices, []);
});

test('a 0 car-type total is left out of legacy segment_prices (old backend rejects 0)', () => {
  const s = state({
    base: [line('labour', 'Free check', '1', '0')],
  });
  const p = buildPricingPayload(s, { segments: ['SEDAN'] });
  assert.equal(p.price, 0);
  assert.equal(p.price_lines.filter((l) => l.segment === 'SEDAN').length, 1);
  assert.deepEqual(p.segment_prices, []);
});

test('inspection payload: empty price_lines, fee, legacy price = fee', () => {
  const s = state({
    pricing_type: 'inspection',
    charge_inspection_fee: true,
    inspection_fee: '299',
    base: [line('labour', 'ignored', '1', '999')],
    tax_inclusive: false,
  });
  const p = buildPricingPayload(s, { segments: ['HATCHBACK'] });
  assert.deepEqual(p.price_lines, []);
  assert.equal(p.inspection_fee, 299);
  assert.equal(p.price, 299);
  assert.deepEqual(p.segment_prices, []);
  assert.equal(p.tax_inclusive, false);
});

test('multipart entries: arrays as JSON strings, booleans/numbers as text', () => {
  const p = buildPricingPayload(
    state({ pricing_type: 'inspection', inspection_fee: '0', inclusions: ['Scan'] }),
    { segments: [] }
  );
  const entries = Object.fromEntries(pricingFormEntries(p));
  assert.equal(entries.pricing_type, 'inspection');
  assert.equal(entries.price_lines, '[]');
  assert.equal(entries.inclusions, '["Scan"]');
  assert.equal(entries.exclusions, '[]');
  assert.equal(entries.tax_inclusive, 'true');
  assert.equal(entries.inspection_fee, '0');
  assert.equal(entries.price_change_note, '');
  assert.ok(pricingFormEntries(p).every(([, v]) => typeof v === 'string'));
});

test('multipart entries: none for a legacy body, no inspection_fee for fixed', () => {
  assert.deepEqual(pricingFormEntries({ price: 100 }), []);
  const p = buildPricingPayload(state({ base: [line('labour', 'L', '1', '10')] }));
  const keys = pricingFormEntries(p).map(([k]) => k);
  assert.equal(keys.includes('inspection_fee'), false);
  assert.deepEqual(JSON.parse(Object.fromEntries(pricingFormEntries(p)).price_lines), p.price_lines);
});

// ------------------------------------------------------------- display

test('servicePriceLabel by pricing type', () => {
  const fmt = (v) => `Rs${Number(v)}`;
  assert.equal(servicePriceLabel({ price: 899 }, fmt), 'Rs899');
  assert.equal(servicePriceLabel({ pricing_type: 'starting', price: 1499 }, fmt), 'From Rs1499');
  assert.equal(servicePriceLabel({ pricing_type: 'inspection', price: 299, inspection_fee: 0 }, fmt), 'Free inspection');
  assert.equal(servicePriceLabel({ pricing_type: 'inspection', price: 299 }, fmt), 'Inspection Rs299');
});

// ------------------------------------------------------------- review fixes (2026-11-21)

test('line total rounds like the server (integer hundredths, not a float product)', () => {
  // 1.15 x Rs 0.10 = 11.5 paise -> 12. The old float maths gave 11.
  assert.equal(lineTotal(line('part', 'washer', '1.15', '0.10')), 0.12);
  // 0.25 x Rs 0.02 = 0.5 paise -> 1 (half rounds up, as on the server).
  assert.equal(lineTotal(line('part', 'tiny', '0.25', '0.02')), 0.01);
  // 2.55 x Rs 1.10 = 280.5 paise -> 281.
  assert.equal(lineTotal(line('labour', 'x', '2.55', '1.10')), 2.81);
  assert.equal(sumLines([line('part', 'a', '1.15', '0.10'), line('part', 'b', '1.15', '0.10')]).total, 0.24);
});

test('unit price: at most 2 decimals and the server cap', () => {
  const tooFine = line('part', 'p', '1', '12.345');
  const tooBig = line('part', 'q', '1', '10000000');
  const r = valid(state({ base: [tooFine, tooBig] }));
  assert.ok(r.errors.lines[tooFine.key].unit_price);
  assert.ok(r.errors.lines[tooBig.key].unit_price);
  assert.equal(valid(state({ base: [line('part', 'ok', '1', '9999999')] })).isValid, true);
  assert.equal(valid(state({ base: [line('part', 'ok', '1', '0.05')] })).isValid, true);
});

test('qty cap is 9999, as on the server', () => {
  const big = line('part', 'bolts', '10000', '1');
  assert.ok(valid(state({ base: [big] })).errors.lines[big.key].qty);
  assert.equal(valid(state({ base: [line('part', 'bolts', '9999', '1')] })).isValid, true);
});

test('inspection fee: at most 2 decimals and the server cap; 0 valid only when off', () => {
  const s = state({ pricing_type: 'inspection', charge_inspection_fee: true });
  assert.ok(valid({ ...s, inspection_fee: '299.999' }).errors.inspection_fee);
  assert.ok(valid({ ...s, inspection_fee: '10000000' }).errors.inspection_fee);
  assert.equal(valid({ ...s, charge_inspection_fee: false, inspection_fee: '0' }).isValid, true);
  assert.equal(valid({ ...s, inspection_fee: '299.50' }).isValid, true);
});

test('at most 100 lines are sent, counting car types that copy the base', () => {
  const base = Array.from({ length: 40 }, (_, i) => line('labour', `L${i}`, '1', '10'));
  // 40 base + 40 (HATCHBACK, same as base) + 40 (SEDAN) = 120 > 100.
  const r = valid(state({ base }), { segments: ['HATCHBACK', 'SEDAN'] });
  assert.equal(r.isValid, false);
  assert.match(r.errors.base, /100/);
  // 40 + 40 = 80 is fine.
  assert.equal(valid(state({ base }), { segments: ['HATCHBACK'] }).isValid, true);
  // Inspection sends no lines, so the cap does not apply.
  assert.equal(
    valid(state({ base, pricing_type: 'inspection', inspection_fee: '0' }), { segments: ['HATCHBACK', 'SEDAN'] }).isValid,
    true
  );
});

test('length messages say "or fewer" (the server allows exactly the limit)', () => {
  const long = line('labour', 'x'.repeat(81), '1', '1');
  assert.match(valid(state({ base: [long] })).errors.lines[long.key].name, /80 characters or fewer/);
  assert.match(chipError([], 'z'.repeat(81)), /80 characters or fewer/);
  const base = [line('labour', 'L', '1', '1')];
  assert.match(
    valid(state({ base, price_change_note: 'n'.repeat(301) })).errors.price_change_note,
    /300 characters or fewer/
  );
});

test('price change note is measured after trim, like the server', () => {
  const base = [line('labour', 'L', '1', '1')];
  assert.equal(valid(state({ base, price_change_note: `${'n'.repeat(300)}   ` })).isValid, true);
});

test('a partial or malformed stored pricing state does not throw', () => {
  // Missing arrays / wrong types, as a damaged localStorage draft could hold.
  for (const bad of [{}, { pricing_type: 'fixed' }, { base: 'x', inclusions: null, segments: [] }, null]) {
    const r = validatePricing(bad);
    assert.equal(r.isValid, false);
    assert.doesNotThrow(() => buildPricingPayload(bad));
    const fresh = rekeyPricing(bad);
    assert.equal(fresh.pricing_type, 'fixed');
    assert.deepEqual(fresh.base, []);
    assert.deepEqual(fresh.inclusions, []);
  }
  // A missing inclusions array on an otherwise fine fixed state is still valid.
  const s = { pricing_type: 'fixed', base: [line('labour', 'L', '1', '100')] };
  assert.equal(validatePricing(s).isValid, true);
  assert.deepEqual(buildPricingPayload(s).inclusions, []);
});

test('old draft without a pricing key: price becomes one base labour line', () => {
  const s = initialPricingState({ name: 'Oil change', price: '1500', duration: '1 Hour' });
  assert.equal(s.pricing_type, 'fixed');
  assert.equal(s.base.length, 1);
  assert.equal(s.base[0].unit_price, '1500');
  assert.equal(validatePricing(s).isValid, true);
  const p = buildPricingPayload(s);
  assert.equal(p.price, 1500);
  assert.deepEqual(p.price_lines, [
    { segment: null, kind: 'labour', name: 'Service charge', qty: 1, unit_price: 1500 },
  ]);
  // An old draft with an empty price opens with one blank line, not a crash.
  assert.equal(initialPricingState({ name: 'x', price: '' }).base[0].unit_price, '');
});

test('editing a service keeps every car type it already prices', () => {
  // Server response for a service with base 899, HATCHBACK = base, LUXURY 1500.
  const svc = {
    pricing_type: 'fixed',
    price: 899,
    price_lines: [
      { segment: null, kind: 'labour', name: 'Service charge', qty: 1, unit_price: 899 },
      { segment: 'HATCHBACK', kind: 'labour', name: 'Service charge', qty: 1, unit_price: 899 },
      { segment: 'LUXURY', kind: 'labour', name: 'Service charge', qty: 1, unit_price: 1500 },
    ],
    segmentPrices: [{ segment: 'HATCHBACK', price: '899' }, { segment: 'LUXURY', price: '1500' }],
  };
  const s = initialPricingState(svc);
  // The form picks the first kept car type; nothing is edited.
  const p = buildPricingPayload(s, { segments: shownSegments(s, s.kept_segments[0]) });
  assert.deepEqual(p.segment_prices, [
    { segment: 'HATCHBACK', price: 899 },
    { segment: 'LUXURY', price: 1500 },
  ]);
  assert.equal(p.price_lines.filter((l) => l.segment === 'LUXURY')[0].unit_price, 1500);
  assert.equal(p.price_lines.filter((l) => l.segment === 'HATCHBACK')[0].unit_price, 899);
});

test('servicePriceLabel keeps paise when the amount is not whole', () => {
  const calls = [];
  const fmt = (v, opts) => {
    calls.push(opts);
    return opts?.precise ? `Rs${Number(v).toFixed(2)}` : `Rs${Math.round(Number(v))}`;
  };
  assert.equal(servicePriceLabel({ price: 2800.5 }, fmt), 'Rs2800.50');
  assert.equal(servicePriceLabel({ price: '899.00' }, fmt), 'Rs899');
  assert.equal(servicePriceLabel({ pricing_type: 'starting', price: '1499.25' }, fmt), 'From Rs1499.25');
  assert.equal(calls[1].precise, false);
});

// ------------------------------------------------- inspection fee switch (owner 2026-11-21)

test('fee switch load state: new service and fee 0/null load off, fee > 0 loads on', () => {
  assert.equal(initialPricingState(null).charge_inspection_fee, false);
  assert.equal(initialPricingState({ pricing_type: 'inspection', inspection_fee: 0 }).charge_inspection_fee, false);
  assert.equal(initialPricingState({ pricing_type: 'inspection', inspection_fee: null, price: null }).charge_inspection_fee, false);
  const on = initialPricingState({ pricing_type: 'inspection', inspection_fee: 299 });
  assert.equal(on.charge_inspection_fee, true);
  assert.equal(on.inspection_fee, '299');
});

test('chargesInspectionFee: explicit flag wins; old drafts without it fall back to fee > 0', () => {
  assert.equal(chargesInspectionFee({ charge_inspection_fee: false, inspection_fee: '299' }), false);
  assert.equal(chargesInspectionFee({ charge_inspection_fee: true, inspection_fee: '' }), true);
  assert.equal(chargesInspectionFee({ inspection_fee: '299' }), true);
  assert.equal(chargesInspectionFee({ inspection_fee: '0' }), false);
  assert.equal(chargesInspectionFee({}), false);
});

test('fee switch off: valid with any leftover input, payload sends inspection_fee 0', () => {
  const s = state({ pricing_type: 'inspection', charge_inspection_fee: false, inspection_fee: '299' });
  assert.equal(valid(s).isValid, true);
  assert.equal(valid({ ...s, inspection_fee: '' }).isValid, true);
  const p = buildPricingPayload(s, { segments: [] });
  assert.equal(p.inspection_fee, 0);
  assert.equal(p.price, 0);
  assert.equal(Object.fromEntries(pricingFormEntries(p)).inspection_fee, '0');
});

test('fee switch on: inline error for empty/0, payload sends the amount', () => {
  const s = state({ pricing_type: 'inspection', charge_inspection_fee: true });
  assert.match(valid({ ...s, inspection_fee: '' }).errors.inspection_fee, /above 0/);
  assert.match(valid({ ...s, inspection_fee: '0' }).errors.inspection_fee, /above 0/);
  const ok = { ...s, inspection_fee: '149.50' };
  assert.equal(valid(ok).isValid, true);
  assert.equal(buildPricingPayload(ok, { segments: [] }).inspection_fee, 149.5);
});

test('servicePriceLabel: Free inspection only for a real 0 fee', () => {
  const fmt = (v) => `Rs${Number(v)}`;
  assert.equal(servicePriceLabel({ pricing_type: 'inspection', price: 0 }, fmt), 'Free inspection');
  assert.equal(servicePriceLabel({ pricing_type: 'inspection', inspection_fee: '0' }, fmt), 'Free inspection');
  assert.equal(servicePriceLabel({ pricing_type: 'inspection', inspection_fee: 199 }, fmt), 'Inspection Rs199');
  assert.equal(servicePriceLabel({ price: 0 }, fmt), 'Rs0');
});
