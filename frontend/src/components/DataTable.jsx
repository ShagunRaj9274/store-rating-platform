import { IconSort } from './icons';

/**
 * Accessible, server-sorted table.
 * columns: [{ key, label, sortKey?, render?(row), className? }]
 */
export default function DataTable({ columns, rows, sort, onSort, loading, error, emptyMessage, caption }) {
  const colSpan = columns.length;

  let body;
  if (error) {
    body = <tr><td colSpan={colSpan} className="table__state table__state--error">{error}</td></tr>;
  } else if (loading && rows.length === 0) {
    body = Array.from({ length: 4 }, (_, i) => (
      <tr key={i} className="table__skeleton">
        {columns.map((c) => <td key={c.key}><span /></td>)}
      </tr>
    ));
  } else if (rows.length === 0) {
    body = <tr><td colSpan={colSpan} className="table__state">{emptyMessage}</td></tr>;
  } else {
    body = rows.map((row) => (
      <tr key={row.id}>
        {columns.map((c) => (
          <td key={c.key} className={c.className}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>
        ))}
      </tr>
    ));
  }

  return (
    <div className={`table-wrap${loading && rows.length ? ' is-refreshing' : ''}`} aria-busy={loading}>
      <table className="table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.sortBy === c.sortKey;
              const ariaSort = c.sortKey ? (active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none') : undefined;
              return (
                <th key={c.key} scope="col" aria-sort={ariaSort} className={c.className}>
                  {c.sortKey ? (
                    <button type="button" className={`th-sort${active ? ' is-active' : ''}`} onClick={() => onSort(c.sortKey)}>
                      {c.label}
                      <IconSort dir={active ? sort.order : null} />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  );
}
