import { useEffect, useState } from 'react';
import { ownerApi } from '../../api/services';
import { getErrorMessage } from '../../api/client';
import DataTable from '../../components/DataTable';
import { Alert, EmptyState, PageHeader, Spinner } from '../../components/ui';
import { RatingFigure, StarMeter } from '../../components/StarRating';
import { formatDate } from '../../utils/format';

export default function OwnerDashboard() {
  const [sort, setSort] = useState({ sortBy: 'ratedAt', order: 'desc' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    ownerApi
      .dashboard(sort)
      .then((d) => active && setData(d))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [sort]);

  const toggleSort = (key) =>
    setSort((s) => (s.sortBy === key ? { sortBy: key, order: s.order === 'asc' ? 'desc' : 'asc' } : { sortBy: key, order: 'asc' }));

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner />;

  if (!data.store) {
    return (
      <>
        <PageHeader title="My store" />
        <EmptyState title="No store is linked to your account yet">
          <p>An administrator needs to add your store and choose you as its owner. Your ratings will show up here after that.</p>
        </EmptyState>
      </>
    );
  }

  const { store, distribution, raters } = data;
  const maxBucket = Math.max(1, ...distribution.map((d) => d.count));

  const columns = [
    { key: 'name', label: 'Customer', sortKey: 'name', className: 'strong' },
    { key: 'email', label: 'Email', sortKey: 'email' },
    { key: 'rating', label: 'Rating', sortKey: 'rating', render: (r) => <span className="inline-rating"><StarMeter value={r.rating} size={15} /> {r.rating}</span> },
    { key: 'ratedAt', label: 'Last rated', sortKey: 'ratedAt', render: (r) => formatDate(r.ratedAt) },
  ];

  return (
    <>
      <PageHeader title={store.name} description={store.address} />

      <section className="owner-hero" aria-label="Rating summary">
        <div className="owner-hero__score">
          <p className="owner-hero__caption">Average rating</p>
          <RatingFigure value={store.avgRating} count={store.ratingCount} size="lg" />
        </div>
        <ul className="bars bars--stars" aria-label="Ratings by number of stars">
          {distribution.map((d) => (
            <li key={d.star} className="bars__row">
              <span className="bars__label">{d.star} star{d.star > 1 ? 's' : ''}</span>
              <span className="bars__track"><span className="bars__fill" style={{ width: `${(d.count / maxBucket) * 100}%` }} /></span>
              <span className="bars__count">{d.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="section-title">Customers who rated your store</h2>
      <DataTable
        caption="Customers who rated your store"
        columns={columns}
        rows={raters}
        sort={sort}
        onSort={toggleSort}
        loading={loading}
        emptyMessage="Nobody has rated your store yet. Ratings appear here as soon as customers submit them."
      />
    </>
  );
}
