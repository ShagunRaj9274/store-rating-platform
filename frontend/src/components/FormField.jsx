import { useId, useState } from 'react';
import { IconEye, IconEyeOff, IconCheck, IconDot } from './icons';
import { passwordChecks } from '../utils/validation';

/**
 * Label + control + hint/error, wired up with aria attributes.
 * as: 'input' | 'textarea' | 'select'. maxLength shows a live counter.
 */
export default function FormField({ label, error, hint, as = 'input', maxLength, showCounter, children, className = '', ...props }) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  const isPassword = props.type === 'password';

  const controlProps = {
    id,
    className: `field__control${error ? ' has-error' : ''}`,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy,
    ...props,
    ...(isPassword && { type: reveal ? 'text' : 'password' }),
  };

  let control;
  if (as === 'textarea') control = <textarea rows={3} {...controlProps} />;
  else if (as === 'select') control = <select {...controlProps}>{children}</select>;
  else control = <input {...controlProps} />;

  const length = typeof props.value === 'string' ? props.value.trim().length : 0;

  return (
    <div className={`field ${className}`}>
      <div className="field__top">
        <label htmlFor={id} className="field__label">{label}</label>
        {showCounter && maxLength && (
          <span className={`field__counter${length > maxLength ? ' is-over' : ''}`}>{length}/{maxLength}</span>
        )}
      </div>
      <div className={isPassword ? 'field__pw' : undefined}>
        {control}
        {isPassword && (
          <button type="button" className="field__reveal" onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide password' : 'Show password'}>
            {reveal ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="field__hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="field__error">{error}</p>}
    </div>
  );
}

/** Live checklist of password requirements. */
export function PasswordChecklist({ value }) {
  return (
    <ul className="pw-checks" aria-label="Password requirements">
      {passwordChecks(value).map((c) => (
        <li key={c.id} className={c.ok ? 'is-ok' : ''}>
          {c.ok ? <IconCheck size={14} /> : <IconDot size={14} />}
          {c.label}
        </li>
      ))}
    </ul>
  );
}
