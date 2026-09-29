export const formatRating = (v) => (v === null || v === undefined ? '—' : Number(v).toFixed(1));

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const ROLE_LABELS = { ADMIN: 'Admin', USER: 'Normal user', OWNER: 'Store owner' };

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
