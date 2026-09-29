import { useState } from 'react';
import { storeApi } from '../../api/services';
import { getErrorMessage } from '../../api/client';
import { useListQuery } from '../../hooks/useListQuery';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import { FilterBar, FilterInput, PageHeader } from '../../components/ui';
import { RatingFigure, StarPicker } from '../../components/StarRating';

const FILTERS = { name: '', address: '' };

export default function StoreBrowser() {
  const notify = useToast();
  const list = useListQuery(storeApi.list, { sortBy: 'name', filters: FILTERS });
  const [savingId, setSavingId] = useState(null);

  const rate = async (store, rating) => {
    const previous = { myRating: store.myRating, overallRating: store.overallRating, ratingCount: store.ratingCount };
    list.updateRow(store.id, { myRating: rating }); // optimistic
    setSavingId(store.id);
    try {
      const res = await storeApi.rate(store.id, rating);
      list.updateRow(store.id, res);
      notify(res.created ? `Rating submitted for ${store.name}` : `Rating updated for ${store.name}`);
    } catch (err) {
      list.updateRow(store.id, previous);
      notify(getErrorMessage(err), 'error');
    } finally {
      setSavingId(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Store', sortKey: 'name', className: 'strong' },
    { key: 'address', label: 'Address', sortKey: 'address', className: 'cell-wrap' },
    { key: 'overall', label: 'Overall rating', sortKey: 'rating', render: (s) => <RatingFigure value={s.overallRating} count={s.ratingCount} size="sm" /> },
    {
      key: 'mine', label: 'Your rating', sortKey: 'myRating',
      render: (s) => (
        <div className="my-rating">
          <StarPicker value={s.myRating} onChange={(n) => rate(s, n)} disabled={savingId === s.id} label={`Your rating for ${s.name}`} />
          <span className="my-rating__hint">
            {s.myRating ? `You rated ${s.myRating}. Pick a star to change it.` : 'Not rated yet. Pick a star to rate.'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Stores" description="Find a store and rate it from 1 to 5 stars. You can change your rating any time." />

      <FilterBar onClear={list.clearFilters} canClear={list.hasFilters}>
        <FilterInput label="Store name" placeholder="Search by name" value={list.filters.name} onChange={(v) => list.setFilter('name', v)} />
        <FilterInput label="Address" placeholder="Search by address" value={list.filters.address} onChange={(v) => list.setFilter('address', v)} />
      </FilterBar>

      <DataTable
        caption="Stores"
        columns={columns}
        rows={list.rows}
        sort={list.sort}
        onSort={list.toggleSort}
        loading={list.loading}
        error={list.error}
        emptyMessage={list.hasFilters ? 'No stores match your search. Try a shorter name or address.' : 'No stores have been added yet.'}
      />
      <Pagination meta={list.meta} page={list.page} onPage={list.setPage} />
    </>
  );
}
