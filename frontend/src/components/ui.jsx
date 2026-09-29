import { ROLE_LABELS } from '../utils/format';

export function PageHeader({ title, description, actions }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-head__title">{title}</h1>
        {description && <p className="page-head__desc">{description}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

export function RoleTag({ role }) {
  return <span className={`role-tag role-tag--${role.toLowerCase()}`}>{ROLE_LABELS[role] ?? role}</span>;
}

export function Spinner({ label = 'Loading' }) {
  return <div className="spinner" role="status"><span className="sr-only">{label}</span></div>;
}

export function FullPageSpinner() {
  return <div className="full-center"><Spinner /></div>;
}

export function Alert({ children, tone = 'error' }) {
  if (!children) return null;
  return <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h2 className="empty__title">{title}</h2>
      <div className="empty__body">{children}</div>
    </div>
  );
}

export function FilterBar({ children, onClear, canClear }) {
  return (
    <div className="filters" role="search">
      {children}
      <button type="button" className="btn btn--link" onClick={onClear} disabled={!canClear}>
        Clear filters
      </button>
    </div>
  );
}

export function FilterInput({ label, value, onChange, placeholder }) {
  return (
    <label className="filter">
      <span className="filter__label">{label}</span>
      <input className="filter__input" type="search" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
