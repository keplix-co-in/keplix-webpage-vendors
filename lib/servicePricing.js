/**
 * Pricing v2 for services: pure helpers shared by the portal service form and
 * the onboarding service step. No React, no network, so node:test can cover it.
 *
 * Contract: keplix-backend/docs/PRICING_V2_API.md, section 1. The server
 * recomputes every amount; the totals here are only for showing the vendor what
 * they typed, plus the legacy `price` / `segment_prices` fields that keep the
 * form working against a backend that does not know `price_lines` yet.
 */

export const PRICING_TYPES = [
  {
    id: 'fixed',
    label: 'Fixed package',
    hint: 'One set price. The customer pays exactly this.',
  },
  {
    id: 'starting',
    label: 'Starting from',
    hint: 'The lowest price. The final bill can be higher once you check the car.',
  },
  {
    id: 'inspection',
    label: 'Inspection first',
    hint: 'The customer pays an inspection fee. You quote the work after checking the car.',
  },
];

const PRICING_TYPE_IDS = PRICING_TYPES.map((t) => t.id);
export const LINE_KINDS = ['labour', 'part'];
export const SEGMENT_IDS = ['HATCHBACK', 'SEDAN', 'COMPACT_SUV', 'MUV', 'LUXURY'];

export const LIMITS = { name: 80, listItem: 80, listCount: 20, note: 300 };

// Review fix (2026-11-21): the server's own caps (keplix-backend
// validators/vendor/serviceValidators.js: priceLineSchema, priceLinesField,
// optionalMoneyField). Without them the form let a save through that the
// server then refused with a generic 400.
export const MONEY_LIMITS = { qty: 9999, amount: 9999999, lines: 100 };

export const BREAKDOWN_BANNER =
  'Please split this price into labour and parts so customers can see what they pay for.';

// ---------------------------------------------------------------- numbers

// Strict decimal text: "12", "12.5", ".5". Number('') is 0 and Number(' ') is
// 0, so plain Number() would let an empty field through as a free line.
const DECIMAL = /^\d*\.?\d+$/;

/** Parses a form value (string or number) to a finite number, or null. */
export const parseAmount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value ?? '').trim();
  return DECIMAL.test(text) ? Number(text) : null;
};

const hasAtMostTwoDecimals = (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

// Money is summed in integer paise, like the server, so 0.1 + 0.2 style float
// drift never shows the vendor a total that differs from what the API returns.
const toPaise = (n) => Math.round(n * 100);
const fromPaise = (p) => p / 100;

/** qty × unit_price in rupees; 0 for a row that is not filled in yet. */
export const lineTotal = (line) => {
  const qty = parseAmount(line?.qty);
  const unit = parseAmount(line?.unit_price);
  if (qty === null || unit === null) return 0;
  // Review fix (2026-11-21): same maths as the server's lineTotalPaise
  // (keplix-backend util/billMath.js): qty is scaled to whole hundredths first
  // and multiplied as integers, then rounded once. The old `qty * paise` was
  // a float product: 1.15 x Rs 0.10 gave 11.4999.. paise, rounded to 11,
  // while the server gets exactly 11.5 and rounds to 12.
  const qtyHundredths = Math.round(qty * 100);
  return fromPaise(Math.round((qtyHundredths * toPaise(unit)) / 100));
};

/** { labour, parts, total } in rupees for a list of lines. */
export const sumLines = (lines = []) => {
  let labour = 0;
  let parts = 0;
  for (const line of lines) {
    const paise = toPaise(lineTotal(line));
    if (line.kind === 'part') parts += paise;
    else labour += paise;
  }
  return { labour: fromPaise(labour), parts: fromPaise(parts), total: fromPaise(labour + parts) };
};

// ---------------------------------------------------------------- lines

// React keys only; never sent. A module counter is enough: keys just have to
// be unique within one page's lifetime.
let keySeq = 0;
const nextKey = () => `pl-${(keySeq += 1)}`;

export const newLine = (kind = 'labour') => ({
  key: nextKey(),
  kind: kind === 'part' ? 'part' : 'labour',
  name: '',
  qty: '1',
  unit_price: '',
});

/** Fresh copies with new keys ("Copy from base"). */
export const copyLines = (lines = []) => lines.map((line) => ({ ...line, key: nextKey() }));

/**
 * Same state with fresh line keys. Needed for a pricing state restored from the
 * onboarding draft in localStorage: its keys came from a previous page load,
 * where the counter above also started at 1, so they could collide with lines
 * added now (duplicate React keys, errors shown on the wrong row).
 */
export const rekeyPricing = (state) => {
  const safe = withPricingDefaults(state);
  return {
    ...safe,
    // A stored state with a missing/unknown type opens as 'fixed' (the
    // server's default) instead of with no type picked.
    pricing_type: PRICING_TYPE_IDS.includes(safe.pricing_type) ? safe.pricing_type : 'fixed',
    base: copyLines(safe.base),
    segments: Object.fromEntries(
      Object.entries(safe.segments).map(([id, lines]) => [id, copyLines(lines)])
    ),
  };
};

/**
 * Review fix (2026-11-21): a pricing state read back from localStorage is not
 * guaranteed to have every array (a hand-edited, truncated or older-shape
 * draft). validatePricing runs inside stepCompletion on every render of the
 * onboarding checklist, so a missing `inclusions` threw there and took the
 * whole page down. Missing or wrong-typed fields become empty instead; the
 * validation then reports what is missing like any other empty form.
 */
const withPricingDefaults = (state) => {
  const s = state && typeof state === 'object' ? state : {};
  const isLines = (v) => Array.isArray(v) && v.every((l) => l && typeof l === 'object');
  const segments =
    s.segments && typeof s.segments === 'object' && !Array.isArray(s.segments)
      ? Object.fromEntries(Object.entries(s.segments).filter(([, lines]) => isLines(lines)))
      : {};
  return {
    ...s,
    base: isLines(s.base) ? s.base : [],
    segments,
    kept_segments: Array.isArray(s.kept_segments) ? s.kept_segments : [],
    inclusions: Array.isArray(s.inclusions) ? s.inclusions : [],
    exclusions: Array.isArray(s.exclusions) ? s.exclusions : [],
  };
};

const fromApiLine = (line) => ({
  key: nextKey(),
  kind: line.kind === 'part' ? 'part' : 'labour',
  name: String(line.name ?? ''),
  qty: line.qty != null ? String(Number(line.qty)) : '1',
  unit_price: line.unit_price != null ? String(Number(line.unit_price)) : '',
});

// Same shape the server synthesises for a legacy service (contract §1), used
// when the response has no `price_lines` at all (backend not upgraded yet).
const legacyLine = (price) => ({
  key: nextKey(),
  kind: 'labour',
  name: 'Service charge',
  qty: '1',
  unit_price: String(Number(price)),
});

const sameLines = (a, b) =>
  a.length === b.length &&
  a.every(
    (line, i) =>
      line.kind === b[i].kind &&
      line.name.trim() === b[i].name.trim() &&
      parseAmount(line.qty) === parseAmount(b[i].qty) &&
      parseAmount(line.unit_price) === parseAmount(b[i].unit_price)
  );

/**
 * Form state for a service (or an empty one).
 *
 * `kept_segments` are the car types this service already prices. They stay
 * priced on save (dropping them would delete their price on the server), and a
 * car type whose lines equal the base lines is loaded as an empty section that
 * means "same as base", so editing the base keeps it in step — exactly how the
 * old one-price form behaved, where the picked car type always got the base price.
 */
export const initialPricingState = (service) => {
  const segmentPrices = service?.segmentPrices ?? service?.segment_prices ?? [];
  let base = [];
  const segments = {};

  if (Array.isArray(service?.price_lines)) {
    for (const line of service.price_lines) {
      if (line.segment && SEGMENT_IDS.includes(line.segment)) {
        (segments[line.segment] ??= []).push(fromApiLine(line));
      } else if (!line.segment) {
        base.push(fromApiLine(line));
      }
    }
  } else {
    if (service?.price != null && service.price !== '') base = [legacyLine(service.price)];
    for (const entry of segmentPrices) {
      if (SEGMENT_IDS.includes(entry.segment) && entry.price != null) {
        segments[entry.segment] = [legacyLine(entry.price)];
      }
    }
  }

  const kept = SEGMENT_IDS.filter((id) => segments[id]);
  for (const id of kept) {
    if (sameLines(segments[id], base)) segments[id] = [];
  }

  const pricingType = PRICING_TYPE_IDS.includes(service?.pricing_type) ? service.pricing_type : 'fixed';

  const state = {
    pricing_type: pricingType,
    base: base.length > 0 ? base : [newLine('labour')],
    segments,
    kept_segments: kept,
    inclusions: Array.isArray(service?.inclusions) ? service.inclusions.map(String) : [],
    exclusions: Array.isArray(service?.exclusions) ? service.exclusions.map(String) : [],
    price_change_note: service?.price_change_note ?? '',
    inspection_fee:
      service?.inspection_fee != null
        ? String(Number(service.inspection_fee))
        : pricingType === 'inspection' && service?.price != null
          ? String(Number(service.price))
          : '',
    tax_inclusive: service?.tax_inclusive !== false,
  };
  // Owner decision 2026-11-21: the "Charge an inspection fee?" switch. An
  // existing fee of 0/null loads as off, > 0 loads as on with the amount.
  state.charge_inspection_fee = (parseAmount(state.inspection_fee) ?? 0) > 0;
  return state;
};

/**
 * Is the inspection-fee switch on? Owner decision 2026-11-21. Falls back to
 * "fee > 0" for pricing state saved before the switch existed (old onboarding
 * drafts carry no charge_inspection_fee key).
 */
export const chargesInspectionFee = (state) =>
  typeof state?.charge_inspection_fee === 'boolean'
    ? state.charge_inspection_fee
    : (parseAmount(state?.inspection_fee) ?? 0) > 0;

/** Car types that get a section: the ones already priced plus the picked one. */
export const shownSegments = (state, pickedSegment) =>
  SEGMENT_IDS.filter(
    (id) => id === pickedSegment || (state.kept_segments ?? []).includes(id)
  );

/**
 * The lines a car type will actually be saved with: its own, or a copy of the
 * base lines when its section is empty ("same as base", see initialPricingState).
 */
export const effectiveSegmentLines = (state, segment) => {
  const own = state.segments?.[segment] ?? [];
  return own.length > 0 ? own : state.base;
};

// ---------------------------------------------------------------- validation

const validateLine = (line) => {
  const errors = {};
  const name = String(line.name ?? '').trim();
  if (!LINE_KINDS.includes(line.kind)) errors.kind = 'Choose labour or part.';
  if (!name) errors.name = 'Name the work or part.';
  // Review fix (2026-11-21): the server allows exactly 80; "under 80" read as 79.
  else if (name.length > LIMITS.name) errors.name = `Use ${LIMITS.name} characters or fewer.`;

  const qty = parseAmount(line.qty);
  if (qty === null || qty <= 0) errors.qty = 'Qty must be more than 0.';
  else if (!hasAtMostTwoDecimals(qty)) errors.qty = 'Up to 2 decimals.';
  else if (qty > MONEY_LIMITS.qty) errors.qty = `Qty can be at most ${MONEY_LIMITS.qty}.`;

  // Review fix (2026-11-21): unit_price also needs at most 2 decimals and a
  // cap, as on the server; "12.345" used to pass here and fail the save.
  const unit = parseAmount(line.unit_price);
  if (unit === null || unit < 0) errors.unit_price = 'Enter a price (0 or more).';
  else if (!hasAtMostTwoDecimals(unit)) errors.unit_price = 'Up to 2 decimals (paise).';
  else if (unit > MONEY_LIMITS.amount) errors.unit_price = 'That price is too high.';
  return Object.keys(errors).length > 0 ? errors : null;
};

const validateList = (items, label) => {
  if (items.length > LIMITS.listCount) return `Up to ${LIMITS.listCount} ${label}.`;
  for (const item of items) {
    const text = String(item ?? '').trim();
    if (!text || text.length > LIMITS.listItem) {
      return `Each item must be 1 to ${LIMITS.listItem} characters.`;
    }
  }
  return null;
};

/** Checks one chip before it is added; returns an error string or null. */
export const chipError = (items, text) => {
  const value = String(text ?? '').trim();
  if (!value) return 'Type something first.';
  if (value.length > LIMITS.listItem) return `Use ${LIMITS.listItem} characters or fewer.`;
  if (items.length >= LIMITS.listCount) return `Up to ${LIMITS.listCount} items.`;
  if (items.some((i) => i.toLowerCase() === value.toLowerCase())) return 'Already added.';
  return null;
};

/**
 * Validation exactly as the contract (§1). Returns
 * `{ isValid, errors: { pricing_type?, base?, lines: {[key]: {...}}, inclusions?,
 * exclusions?, price_change_note?, inspection_fee? } }`.
 *
 * `segments` = the car-type sections being saved (shownSegments). Inspection
 * sends no lines, so its rows are not checked at all.
 */
export const validatePricing = (rawState, { segments = [] } = {}) => {
  const state = withPricingDefaults(rawState);
  const errors = { lines: {} };
  const type = state.pricing_type;

  if (!PRICING_TYPE_IDS.includes(type)) errors.pricing_type = 'Choose how this service is priced.';

  if (type !== 'inspection') {
    if (state.base.length === 0) errors.base = 'Add at least one labour or part line.';
    const toCheck = [...state.base, ...segments.flatMap((id) => state.segments?.[id] ?? [])];
    for (const line of toCheck) {
      const lineErrors = validateLine(line);
      if (lineErrors) errors.lines[line.key] = lineErrors;
    }
    // Review fix (2026-11-21): the server takes at most 100 price_lines per
    // save. Count what will really be sent: an empty car-type section goes out
    // as a copy of the base lines (effectiveSegmentLines).
    const sentCount =
      state.base.length + segments.reduce((n, id) => n + effectiveSegmentLines(state, id).length, 0);
    if (!errors.base && sentCount > MONEY_LIMITS.lines) {
      errors.base = `Up to ${MONEY_LIMITS.lines} lines in total, counting each car type. Remove some lines or car types.`;
    }
  } else {
    // Owner decision 2026-11-21: switch off = free inspection, nothing to
    // check; switch on = the fee must be more than 0 (use "off" for free).
    const fee = parseAmount(state.inspection_fee);
    if (!chargesInspectionFee(state)) {
      // free inspection: no fee input shown, nothing to validate
    } else if (fee === null || fee <= 0) errors.inspection_fee = 'Enter a fee above 0, or turn the switch off for a free inspection.';
    // Review fix (2026-11-21): same 2-decimal rule and cap as the server.
    else if (!hasAtMostTwoDecimals(fee)) errors.inspection_fee = 'Up to 2 decimals (paise).';
    else if (fee > MONEY_LIMITS.amount) errors.inspection_fee = 'That fee is too high.';
  }

  const inclusionsError = validateList(state.inclusions, 'inclusions');
  if (inclusionsError) errors.inclusions = inclusionsError;
  else if (type === 'starting' && state.inclusions.length === 0) {
    // A "from" price means nothing unless the customer can see what it covers.
    errors.inclusions = 'Add at least one thing this starting price includes.';
  }

  const exclusionsError = validateList(state.exclusions, 'exclusions');
  if (exclusionsError) errors.exclusions = exclusionsError;

  // Review fix (2026-11-21): measured after trim, as the server does (and as
  // the payload sends it); the server allows exactly 300.
  if (String(state.price_change_note ?? '').trim().length > LIMITS.note) {
    errors.price_change_note = `Use ${LIMITS.note} characters or fewer.`;
  }

  const isValid =
    Object.keys(errors.lines).length === 0 && Object.keys(errors).filter((k) => k !== 'lines').length === 0;
  return { isValid, errors };
};

// ---------------------------------------------------------------- payload

const toApiLine = (line, segment) => ({
  segment,
  kind: line.kind,
  name: String(line.name).trim(),
  qty: parseAmount(line.qty),
  unit_price: parseAmount(line.unit_price),
});

/**
 * The pricing part of a create/update body. Call only after validatePricing.
 *
 * Sends the v2 fields AND the legacy ones: `price` (base total, or the fee for
 * inspection) and `segment_prices` (each car type's total). A new backend
 * ignores the legacy fields when `price_lines` is present; an old backend
 * ignores the v2 fields, so the same form saves correctly against either.
 */
export const buildPricingPayload = (rawState, { segments = [] } = {}) => {
  // Same defaults as validatePricing, so a partial draft state cannot throw here.
  const state = withPricingDefaults(rawState);
  const type = state.pricing_type;
  const common = {
    pricing_type: type,
    inclusions: state.inclusions.map((i) => String(i).trim()),
    exclusions: state.exclusions.map((i) => String(i).trim()),
    price_change_note: String(state.price_change_note ?? '').trim(),
    tax_inclusive: state.tax_inclusive !== false,
  };

  if (type === 'inspection') {
    // Owner decision 2026-11-21: switch off sends inspection_fee 0, whatever
    // amount is left in the (hidden) input.
    const fee = chargesInspectionFee(state) ? parseAmount(state.inspection_fee) ?? 0 : 0;
    // price_lines is still sent (empty): without it the server treats the save
    // as a legacy payload and forces pricing_type back to 'fixed'.
    return { ...common, inspection_fee: fee, price_lines: [], price: fee, segment_prices: [] };
  }

  const priceLines = state.base.map((line) => toApiLine(line, null));
  const segmentPrices = [];
  for (const segment of segments) {
    const lines = effectiveSegmentLines(state, segment);
    priceLines.push(...lines.map((line) => toApiLine(line, segment)));
    const total = sumLines(lines).total;
    // The old backend rejects a segment price of 0 (positive-only), and the new
    // one ignores segment_prices anyway, so a 0 total is simply not sent here.
    if (total > 0) segmentPrices.push({ segment, price: total });
  }

  return {
    ...common,
    price_lines: priceLines,
    price: sumLines(state.base).total,
    segment_prices: segmentPrices,
  };
};

/**
 * Multipart form entries for the v2 fields. multer turns every field into a
 * string, so arrays go as JSON strings and booleans/numbers as text (contract §1).
 * Returns [] for a legacy body, so callers can always spread it.
 */
export const pricingFormEntries = (data) => {
  if (!Array.isArray(data?.price_lines)) return [];
  const entries = [
    ['pricing_type', String(data.pricing_type)],
    ['price_lines', JSON.stringify(data.price_lines)],
    ['inclusions', JSON.stringify(data.inclusions ?? [])],
    ['exclusions', JSON.stringify(data.exclusions ?? [])],
    ['price_change_note', String(data.price_change_note ?? '')],
    ['tax_inclusive', String(data.tax_inclusive !== false)],
  ];
  if (data.inspection_fee != null) entries.push(['inspection_fee', String(data.inspection_fee)]);
  return entries;
};

// ---------------------------------------------------------------- display

/** "₹899", "From ₹899" or "Inspection ₹299" for list rows. Needs a formatter. */
export const servicePriceLabel = (service, format) => {
  // Review fix (2026-11-21): lines can carry paise now, and formatMoney's
  // default drops them (Rs 2800.50 showed as "Rs 2,801"). Ask for the precise
  // form only when the amount is not whole, so "Rs 899" stays as it was.
  const show = (value) => {
    const n = Number(value);
    return format(value, { precise: Number.isFinite(n) && !Number.isInteger(n) });
  };
  const type = service?.pricing_type;
  if (type === 'inspection') {
    // Owner decision 2026-11-21: a 0 fee reads "Free inspection", not "Inspection Rs0".
    const fee = service.inspection_fee ?? service.price;
    if (fee != null && fee !== '' && Number(fee) === 0) return 'Free inspection';
    return `Inspection ${show(fee)}`;
  }
  if (type === 'starting') return `From ${show(service.price)}`;
  return show(service?.price);
};
