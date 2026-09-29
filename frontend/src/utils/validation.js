// Mirrors backend/src/validators/schemas.js so users see errors before submitting.
export const LIMITS = { nameMin: 20, nameMax: 60, addressMax: 400, passwordMin: 8, passwordMax: 16 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const passwordChecks = (pw = '') => [
  { id: 'length', label: '8–16 characters', ok: pw.length >= LIMITS.passwordMin && pw.length <= LIMITS.passwordMax },
  { id: 'upper', label: 'One uppercase letter', ok: /[A-Z]/.test(pw) },
  { id: 'special', label: 'One special character', ok: /[^A-Za-z0-9]/.test(pw) },
];

export const rules = {
  name: (v = '') => {
    const len = v.trim().length;
    if (!len) return 'Name is required';
    if (len < LIMITS.nameMin) return `Name must be at least ${LIMITS.nameMin} characters (${len} so far)`;
    if (len > LIMITS.nameMax) return `Name must be at most ${LIMITS.nameMax} characters`;
    return '';
  },
  email: (v = '') => {
    if (!v.trim()) return 'Email is required';
    return EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address';
  },
  address: (v = '') => {
    if (!v.trim()) return 'Address is required';
    return v.trim().length > LIMITS.addressMax ? `Address must be at most ${LIMITS.addressMax} characters` : '';
  },
  password: (v = '') => {
    if (!v) return 'Password is required';
    const failed = passwordChecks(v).find((c) => !c.ok);
    return failed ? `Password needs: ${failed.label.toLowerCase()}` : '';
  },
  required: (label) => (v = '') => (String(v).trim() ? '' : `${label} is required`),
};

/** Runs { field: ruleFn } against values; returns { field: message } for failures only. */
export function validate(values, schema) {
  return Object.fromEntries(
    Object.entries(schema)
      .map(([field, rule]) => [field, rule(values[field], values)])
      .filter(([, msg]) => msg),
  );
}
