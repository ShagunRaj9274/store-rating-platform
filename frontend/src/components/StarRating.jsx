import { useState } from 'react';
import { StarShape } from './icons';
import { formatRating, plural } from '../utils/format';

/** Read-only stars with fractional fill (e.g. 3.7 fills 74%). */
export function StarMeter({ value, size = 16 }) {
  const pct = value ? Math.max(0, Math.min(100, (value / 5) * 100)) : 0;
  const row = (cls) => (
    <span className={cls}>
      {[1, 2, 3, 4, 5].map((i) => <StarShape key={i} size={size} />)}
    </span>
  );
  return (
    <span className="star-meter" role="img" aria-label={value ? `${formatRating(value)} out of 5 stars` : 'No ratings yet'}>
      {row('star-meter__base')}
      <span className="star-meter__fill" style={{ width: `${pct}%` }}>{row('star-meter__on')}</span>
    </span>
  );
}

/** The large-numeral rating treatment used across the app. */
export function RatingFigure({ value, count, size = 'md' }) {
  return (
    <span className={`rating-figure rating-figure--${size}`}>
      <span className="rating-figure__num">{formatRating(value)}</span>
      <span className="rating-figure__meta">
        <StarMeter value={value} size={size === 'lg' ? 22 : 14} />
        {count !== undefined && <span className="rating-figure__count">{count ? plural(count, 'rating') : 'No ratings yet'}</span>}
      </span>
    </span>
  );
}

/** Interactive 1–5 picker. Hover/focus previews; click commits. */
export function StarPicker({ value, onChange, disabled, label = 'Your rating', size = 22 }) {
  const [preview, setPreview] = useState(0);
  const shown = preview || value || 0;

  return (
    <div className="star-picker" role="radiogroup" aria-label={label} onMouseLeave={() => setPreview(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={plural(n, 'star')}
          className={`star-picker__btn${n <= shown ? ' is-on' : ''}`}
          disabled={disabled}
          onMouseEnter={() => setPreview(n)}
          onFocus={() => setPreview(n)}
          onBlur={() => setPreview(0)}
          onClick={() => value !== n && onChange(n)}
        >
          <StarShape size={size} />
        </button>
      ))}
    </div>
  );
}
