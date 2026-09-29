export default function Pagination({ meta, page, onPage }) {
  if (!meta || meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__info">Showing {from}–{to} of {meta.total}</span>
      <div className="pagination__buttons">
        <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="pagination__page">Page {meta.page} of {meta.totalPages}</span>
        <button type="button" className="btn btn--ghost btn--sm" disabled={page >= meta.totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}
