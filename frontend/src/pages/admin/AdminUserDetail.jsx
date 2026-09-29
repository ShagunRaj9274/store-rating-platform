import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/services';
import { getErrorMessage } from '../../api/client';
import { Alert, EmptyState, RoleTag, Spinner } from '../../components/ui';
import { RatingFigure } from '../../components/StarRating';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { IconArrowLeft } from '../../components/icons';
import { formatDate, plural, ROLE_LABELS } from '../../utils/format';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const notify = useToast();
  const { user: me } = useAuth();
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);

  const saveRole = async () => {
    setSaving(true);
    try {
      await adminApi.changeRole(user.id, newRole);
      notify(`Role changed to ${ROLE_LABELS[newRole]}`);
      setNewRole('');
      setUser(await adminApi.getUser(id));
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    setUser(null);
    setError('');
    adminApi.getUser(id).then(setUser).catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  const back = <Link to="/admin/users" className="back-link"><IconArrowLeft size={16} /> All users</Link>;

  if (error) return <>{back}<Alert>{error}</Alert></>;
  if (!user) return <Spinner />;

  return (
    <>
      {back}
      <header className="page-head">
        <div>
          <h1 className="page-head__title">{user.name}</h1>
          <RoleTag role={user.role} />
        </div>
      </header>

      <div className="split">
        <section className="panel">
          <h2 className="panel__title">Details</h2>
          <dl className="details">
            <dt>Name</dt><dd>{user.name}</dd>
            <dt>Email</dt><dd><a href={`mailto:${user.email}`}>{user.email}</a></dd>
            <dt>Address</dt><dd>{user.address}</dd>
            <dt>Role</dt>
            <dd>
              {me.id === user.id ? (
                <RoleTag role={user.role} />
              ) : (
                <select
                  className="filter__input"
                  value={user.role}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {Object.entries(ROLE_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              )}
            </dd>
            <dt>Joined</dt><dd>{formatDate(user.createdAt)}</dd>
            {user.role === 'USER' && (<><dt>Ratings given</dt><dd>{user.ratingsGiven}</dd></>)}
          </dl>
        </section>

        {user.role === 'OWNER' && (
          <section className="panel">
            <h2 className="panel__title">Store rating</h2>
            {user.store ? (
              <div className="stack">
                <RatingFigure value={user.store.avgRating} count={user.store.ratingCount} size="lg" />
                <div>
                  <p className="strong">{user.store.name}</p>
                  <p className="muted">{user.store.address}</p>
                </div>
              </div>
            ) : (
              <EmptyState title="No store assigned">
                <p>Add a store and choose this owner to link them.</p>
                <Link to="/admin/stores?new=1" className="btn btn--ghost btn--sm">Add store</Link>
              </EmptyState>
            )}
          </section>
        )}
      </div>
      {user.role === 'OWNER' && user.store && <p className="muted small">{plural(user.store.ratingCount, 'rating')} counted in the average.</p>}

      {newRole && newRole !== user.role && (
        <ConfirmDialog
          title="Change role?"
          confirmLabel="Change role"
          busy={saving}
          onConfirm={saveRole}
          onClose={() => setNewRole('')}
        >
          <p>{user.name} will become a <strong>{ROLE_LABELS[newRole]}</strong>.</p>
          {user.role === 'OWNER' && user.store && (
            <p className="muted">
              Their store, {user.store.name}, will become unassigned.
            </p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
