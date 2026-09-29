import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/services';
import { useListQuery } from '../../hooks/useListQuery';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import { FilterBar, FilterInput, PageHeader, RoleTag } from '../../components/ui';
import { RatingFigure } from '../../components/StarRating';
import { IconPlus } from '../../components/icons';
import CreateUserModal from './CreateUserModal';

const FILTERS = { name: '', email: '', address: '', role: '' };

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(params.get('new') === '1');
  const list = useListQuery(adminApi.listUsers, { sortBy: 'name', filters: FILTERS });

  const closeCreate = () => {
    setShowCreate(false);
    if (params.has('new')) setParams({}, { replace: true });
  };

  const columns = [
    { key: 'name', label: 'Name', sortKey: 'name', render: (u) => <Link to={`/admin/users/${u.id}`} className="cell-link">{u.name}</Link> },
    { key: 'email', label: 'Email', sortKey: 'email' },
    { key: 'address', label: 'Address', sortKey: 'address', className: 'cell-wrap' },
    { key: 'role', label: 'Role', sortKey: 'role', render: (u) => <RoleTag role={u.role} /> },
    {
      key: 'rating', label: 'Store rating', sortKey: 'rating',
      render: (u) => (u.role === 'OWNER' ? <RatingFigure value={u.rating} size="sm" /> : <span className="muted">Not applicable</span>),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with an account. Open a name to see their details."
        actions={<button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}><IconPlus /> Add user</button>}
      />

      <FilterBar onClear={list.clearFilters} canClear={list.hasFilters}>
        <FilterInput label="Name" value={list.filters.name} onChange={(v) => list.setFilter('name', v)} />
        <FilterInput label="Email" value={list.filters.email} onChange={(v) => list.setFilter('email', v)} />
        <FilterInput label="Address" value={list.filters.address} onChange={(v) => list.setFilter('address', v)} />
        <label className="filter">
          <span className="filter__label">Role</span>
          <select className="filter__input" value={list.filters.role} onChange={(e) => list.setFilter('role', e.target.value)}>
            <option value="">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">Normal user</option>
            <option value="OWNER">Store owner</option>
          </select>
        </label>
      </FilterBar>

      <DataTable
        caption="Users"
        columns={columns}
        rows={list.rows}
        sort={list.sort}
        onSort={list.toggleSort}
        loading={list.loading}
        error={list.error}
        emptyMessage={list.hasFilters ? 'No users match these filters. Try clearing one.' : 'No users yet. Add the first one.'}
      />
      <Pagination meta={list.meta} page={list.page} onPage={list.setPage} />

      {showCreate && <CreateUserModal onClose={closeCreate} onCreated={list.reload} />}
    </>
  );
}
