import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/services';
import { useListQuery } from '../../hooks/useListQuery';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import { FilterBar, FilterInput, PageHeader } from '../../components/ui';
import { RatingFigure } from '../../components/StarRating';
import { IconPlus } from '../../components/icons';
import CreateStoreModal from './CreateStoreModal';

const FILTERS = { name: '', email: '', address: '' };

export default function AdminStores() {
  const [params, setParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(params.get('new') === '1');
  const list = useListQuery(adminApi.listStores, { sortBy: 'name', filters: FILTERS });

  const closeCreate = () => {
    setShowCreate(false);
    if (params.has('new')) setParams({}, { replace: true });
  };

  const columns = [
    { key: 'name', label: 'Name', sortKey: 'name', className: 'strong' },
    { key: 'email', label: 'Email', sortKey: 'email' },
    { key: 'address', label: 'Address', sortKey: 'address', className: 'cell-wrap' },
    { key: 'rating', label: 'Rating', sortKey: 'rating', render: (s) => <RatingFigure value={s.rating} count={s.ratingCount} size="sm" /> },
    {
      key: 'owner', label: 'Owner',
      render: (s) => (s.owner ? <Link className="cell-link" to={`/admin/users/${s.owner.id}`}>{s.owner.name}</Link> : <span className="muted">Unassigned</span>),
    },
  ];

  return (
    <>
      <PageHeader
        title="Stores"
        description="Every store shoppers can rate."
        actions={<button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}><IconPlus /> Add store</button>}
      />

      <FilterBar onClear={list.clearFilters} canClear={list.hasFilters}>
        <FilterInput label="Name" value={list.filters.name} onChange={(v) => list.setFilter('name', v)} />
        <FilterInput label="Email" value={list.filters.email} onChange={(v) => list.setFilter('email', v)} />
        <FilterInput label="Address" value={list.filters.address} onChange={(v) => list.setFilter('address', v)} />
      </FilterBar>

      <DataTable
        caption="Stores"
        columns={columns}
        rows={list.rows}
        sort={list.sort}
        onSort={list.toggleSort}
        loading={list.loading}
        error={list.error}
        emptyMessage={list.hasFilters ? 'No stores match these filters. Try clearing one.' : 'No stores yet. Add the first one.'}
      />
      <Pagination meta={list.meta} page={list.page} onPage={list.setPage} />

      {showCreate && <CreateStoreModal onClose={closeCreate} onCreated={list.reload} />}
    </>
  );
}
