import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/services';
import { getErrorMessage } from '../../api/client';
import { Alert, PageHeader, Spinner } from '../../components/ui';
import { RatingFigure } from '../../components/StarRating';
import { ROLE_LABELS } from '../../utils/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.dashboard().then(setStats).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!stats) return <Spinner />;

  const totals = [
    { label: 'Users', value: stats.totalUsers, to: '/admin/users' },
    { label: 'Stores', value: stats.totalStores, to: '/admin/stores' },
    { label: 'Ratings submitted', value: stats.totalRatings },
  ];
  const maxRole = Math.max(1, ...Object.values(stats.usersByRole));

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everything happening on the platform right now."
        actions={
          <>
            <Link to="/admin/users?new=1" className="btn btn--ghost">Add user</Link>
            <Link to="/admin/stores?new=1" className="btn btn--primary">Add store</Link>
          </>
        }
      />

      <section className="ledger" aria-label="Platform totals">
        {totals.map((t) => (
          <div key={t.label} className="ledger__item">
            <span className="ledger__value">{t.value.toLocaleString()}</span>
            {t.to ? <Link to={t.to} className="ledger__label">{t.label}</Link> : <span className="ledger__label">{t.label}</span>}
          </div>
        ))}
      </section>

      <div className="split">
        <section className="panel">
          <h2 className="panel__title">Accounts by role</h2>
          <ul className="bars">
            {['USER', 'OWNER', 'ADMIN'].map((role) => {
              const count = stats.usersByRole[role] ?? 0;
              return (
                <li key={role} className="bars__row">
                  <span className="bars__label">{ROLE_LABELS[role]}</span>
                  <span className="bars__track"><span className="bars__fill bars__fill--pine" style={{ width: `${(count / maxRole) * 100}%` }} /></span>
                  <span className="bars__count">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel">
          <h2 className="panel__title">Highest rated stores</h2>
          {stats.topStores.length === 0 ? (
            <p className="muted">No ratings yet. Stores appear here once shoppers rate them.</p>
          ) : (
            <ol className="top-list">
              {stats.topStores.map((s) => (
                <li key={s.id} className="top-list__item">
                  <span className="top-list__name">{s.name}</span>
                  <RatingFigure value={s.avgRating} count={s.ratingCount} size="sm" />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
