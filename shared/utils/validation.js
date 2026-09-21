/**
 * Field validation for every form in the portal.
 *
 * Rules here mirror what the backend actually enforces, so a form never accepts
 * something the API will reject (a confusing round trip) and never rejects
 * something the API would have accepted (a vendor blocked for no reason).
 * Where a rule is stricter than the backend it is marked, and the reason given.
 *
 * Sources:
 *   keplix-backend/util/phone.js                        (Indian mobile)
 *   validators/vendor/walkInJobValidators.js            (name, registration, amount, payment mode)
 *   validators/vendor/profileValidators.js              (business name, phone, email)
 *   validators/vendor/availabilityValidators.js         (HH:MM)
 *   validators/user/interactionValidators.js            (message length)
 *   keplix-frontend/components/Vendor/ResetPassword.jsx (password rules)
 */

export const PATTERNS = {
  // 10 digits starting 6-9; landlines are deliberately excluded, as on the backend.
  indianMobile: /^[6-9]\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  // Backend keeps registration loose (4-12 alphanumerics after stripping
  // spaces and dashes) because the controller tightens it against vehicles the
  // vendor already has on file.
  registration: /^[A-Z0-9]{4,12}$/,
  pincode: /^[1-9]\d{5}$/,
  time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  // Statutory formats. The backend stores these as free text, but a typo here
  // costs the vendor a rejected verification days later, so the portal checks
  // the shape up front.
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  upi: /^[\w.\-]{2,}@[a-zA-Z]{2,}$/,
};

/** Strips formatting the way the backend's normaliser does, then validates. */
export const normalizeIndianMobile = (input) => {
  if (typeof input !== 'string') return null;
  let digits = input.trim().replace(/[^\d+]/g, '').replace(/\+/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return PATTERNS.indianMobile.test(digits) ? digits : null;
};

const isBlank = (value) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/**
 * Each rule returns an error message or null. They are deliberately small and
 * composable: `validate()` below runs a list of them per field.
 */
export const rules = {
  required:
    (label = 'This field') =>
    (value) =>
      isBlank(value) ? `${label} is required.` : null,

  email: (value) =>
    isBlank(value) || PATTERNS.email.test(String(value).trim())
      ? null
      : 'Enter a valid email address.',

  mobile: (value) =>
    isBlank(value) || normalizeIndianMobile(value)
      ? null
      : 'Enter a valid 10-digit Indian mobile number.',

  registration: (value) =>
    isBlank(value) ||
    PATTERNS.registration.test(String(value).replace(/[\s-]/g, '').toUpperCase())
      ? null
      : 'Enter a valid registration number, e.g. DL3C8821.',

  pincode: (value) =>
    isBlank(value) || PATTERNS.pincode.test(String(value).trim())
      ? null
      : 'Enter a valid 6-digit pincode.',

  gstin: (value) =>
    isBlank(value) || PATTERNS.gstin.test(String(value).trim().toUpperCase())
      ? null
      : 'Enter a valid 15-character GSTIN.',

  pan: (value) =>
    isBlank(value) || PATTERNS.pan.test(String(value).trim().toUpperCase())
      ? null
      : 'Enter a valid PAN, e.g. ABCDE1234F.',

  ifsc: (value) =>
    isBlank(value) || PATTERNS.ifsc.test(String(value).trim().toUpperCase())
      ? null
      : 'Enter a valid IFSC code, e.g. HDFC0001234.',

  upi: (value) =>
    isBlank(value) || PATTERNS.upi.test(String(value).trim())
      ? null
      : 'Enter a valid UPI ID, e.g. name@okaxis.',

  accountNumber: (value) =>
    isBlank(value) || /^\d{9,18}$/.test(String(value).replace(/\s/g, ''))
      ? null
      : 'Bank account numbers are 9 to 18 digits.',

  time: (value) =>
    isBlank(value) || PATTERNS.time.test(String(value).trim()) ? null : 'Use the HH:MM format.',

  minLength: (min, label = 'This field') =>
    (value) =>
      isBlank(value) || String(value).trim().length >= min
        ? null
        : `${label} must be at least ${min} characters.`,

  maxLength: (max, label = 'This field') =>
    (value) =>
      isBlank(value) || String(value).trim().length <= max
        ? null
        : `${label} must be ${max} characters or fewer.`,

  /** Money and durations: a positive number the backend will accept. */
  positiveNumber:
    (label = 'Amount') =>
    (value) => {
      if (isBlank(value)) return null;
      const amount = Number(value);
      if (!Number.isFinite(amount)) return `${label} must be a number.`;
      return amount > 0 ? null : `${label} must be more than zero.`;
    },

  nonNegativeNumber:
    (label = 'Amount') =>
    (value) => {
      if (isBlank(value)) return null;
      const amount = Number(value);
      if (!Number.isFinite(amount)) return `${label} must be a number.`;
      return amount >= 0 ? null : `${label} cannot be negative.`;
    },

  /** Guards against a fat-fingered price that would bill a real customer. */
  maxAmount:
    (max, label = 'Amount') =>
    (value) =>
      isBlank(value) || Number(value) <= max
        ? null
        : `${label} looks too high — the maximum is ${max.toLocaleString('en-IN')}.`,

  matches:
    (other, message) =>
    (value) =>
      isBlank(value) || value === other ? null : message,
};

/**
 * Runs a `{ field: [rule, rule] }` schema over a values object.
 * Returns `{ errors, isValid }`; the first failing rule per field wins, so a
 * vendor sees one clear message rather than a stack of them.
 */
export const validate = (values, schema) => {
  const errors = {};

  Object.entries(schema).forEach(([field, fieldRules]) => {
    for (const rule of [].concat(fieldRules)) {
      const message = rule(values[field], values);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  });

  return { errors, isValid: Object.keys(errors).length === 0 };
};

/** Password rules, kept identical to the mobile app's reset screen. */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v) => String(v).length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'digit', label: 'One number', test: (v) => /\d/.test(v) },
  {
    id: 'special',
    label: 'One special character',
    test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v),
  },
];

export const passwordErrors = (value) => PASSWORD_RULES.filter((rule) => !rule.test(value ?? ''));

export const rulePassword = (value) =>
  isBlank(value) || passwordErrors(value).length === 0
    ? null
    : 'Password needs 8+ characters, an uppercase letter, a number and a special character.';
