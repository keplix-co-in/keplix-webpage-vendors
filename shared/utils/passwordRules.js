/**
 * Password rules, ported verbatim from the mobile app's
 * keplix-frontend/components/Vendor/ResetPassword.jsx (~L61-72).
 *
 * Kept as data rather than a single boolean so the reset screen can show which
 * specific rule is still unmet — on mobile these arrive as one alert listing
 * everything at once, which tells the vendor less than it could.
 */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'number', label: 'Contains a number', test: (value) => /\d/.test(value) },
  { id: 'uppercase', label: 'Contains an uppercase letter', test: (value) => /[A-Z]/.test(value) },
  {
    id: 'special',
    label: 'Contains a special character',
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
  },
];

export const checkPassword = (password = '') =>
  PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));

export const isPasswordValid = (password = '') =>
  PASSWORD_RULES.every((rule) => rule.test(password));

/** The single-line summary the design puts under the Reset Password title. */
export const PASSWORD_HINT =
  'Password must contain 8 characters, including a number, an uppercase letter and a special character';

export default PASSWORD_RULES;
