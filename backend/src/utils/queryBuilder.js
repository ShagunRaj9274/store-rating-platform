/**
 * Helpers that turn validated query params into safe SQL fragments.
 * Values are always parameterised; column names only ever come from
 * server-side whitelists, never from user input.
 */

/** Escape LIKE wildcards so a search for "50%" matches literally. */
export const escapeLike = (value) => String(value).replace(/[\\%_]/g, '\\$&');

/**
 * @param {Record<string, string|undefined>} filters  e.g. { name: 'mart', role: 'USER' }
 * @param {Record<string, {sql: string|string[], exact?: boolean}>} columnMap
 * @param {number} startIndex first placeholder number ($n) to use
 */
export function buildWhere(filters, columnMap, startIndex = 1) {
  const clauses = [];
  const values = [];

  for (const [key, raw] of Object.entries(filters)) {
    const column = columnMap[key];
    if (!column || raw === undefined || raw === null || String(raw).trim() === '') continue;

    const placeholder = `$${startIndex + values.length}`;
    if (column.exact) {
      values.push(raw);
      clauses.push(`${column.sql} = ${placeholder}`);
    } else {
      values.push(`%${escapeLike(String(raw).trim())}%`);
      const cols = Array.isArray(column.sql) ? column.sql : [column.sql];
      const parts = cols.map((c) => `${c} ILIKE ${placeholder}`);
      clauses.push(parts.length > 1 ? `(${parts.join(' OR ')})` : parts[0]);
    }
  }

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values };
}

/**
 * @param {string|undefined} sortBy  requested key
 * @param {'asc'|'desc'|undefined} order
 * @param {Record<string,string>} sortMap  key -> SQL expression
 * @param {string} defaultKey
 * @param {string} tieBreaker  stable secondary sort, e.g. 'u.id'
 */
export function buildOrderBy(sortBy, order, sortMap, defaultKey, tieBreaker) {
  const expr = sortMap[sortBy] ?? sortMap[defaultKey];
  const dir = order === 'desc' ? 'DESC' : 'ASC';
  // Unrated stores (NULL averages) always sink to the bottom.
  return `ORDER BY ${expr} ${dir} NULLS LAST${tieBreaker ? `, ${tieBreaker} ASC` : ''}`;
}

export function paginate(page = 1, limit = 10) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  return { limit: safeLimit, offset: (safePage - 1) * safeLimit, page: safePage };
}

export const buildMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});
