import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';
import { getErrorMessage } from '../api/client';

/**
 * Server-driven list state: filters (debounced), sorting and pagination.
 * @param {(params) => Promise<{data: any[], meta: object}>} fetcher  must be stable
 */
export function useListQuery(fetcher, { sortBy, order = 'asc', filters: initialFilters = {}, limit = 10 } = {}) {
  const [sort, setSort] = useState({ sortBy, order });
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ rows: [], meta: null, loading: true, error: '' });
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    let active = true;
    fetcher({ ...debouncedFilters, ...sort, page, limit })
      .then((res) => active && setState({ rows: res.data, meta: res.meta, loading: false, error: '' }))
      .catch((err) => active && setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) })));
    return () => {
      active = false;
    };
  }, [fetcher, debouncedFilters, sort, page, limit, reloadKey]);

  const toggleSort = useCallback((key) => {
    setSort((s) => (s.sortBy === key ? { sortBy: key, order: s.order === 'asc' ? 'desc' : 'asc' } : { sortBy: key, order: 'asc' }));
    setPage(1);
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  /** Patch one row locally, e.g. after an optimistic update. */
  const updateRow = useCallback((id, patch) => {
    setState((s) => ({ ...s, rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }, []);

  const hasFilters = Object.values(filters).some((v) => v !== '' && v !== undefined);

  return { ...state, sort, toggleSort, filters, setFilter, clearFilters, hasFilters, page, setPage, reload, updateRow };
}
