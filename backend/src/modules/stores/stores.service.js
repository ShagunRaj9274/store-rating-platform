import { query } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
import { buildWhere, buildOrderBy, paginate, buildMeta } from '../../utils/queryBuilder.js';

const FILTERS = {
  search: { sql: ['s.name', 's.address'] }, // one box that matches either field
  name: { sql: 's.name' },
  address: { sql: 's.address' },
};
const SORTS = { name: 's.name', address: 's.address', rating: 'srs.avg_rating', myRating: 'r.rating' };

const toStore = (row) => ({
  id: row.id,
  name: row.name,
  address: row.address,
  overallRating: row.avg_rating,
  ratingCount: row.rating_count,
  myRating: row.my_rating,
  myRatedAt: row.my_rated_at,
});

export async function listStoresForUser(userId, q) {
  // $1 is reserved for the user id, so filters start at $2.
  const { where, values } = buildWhere({ search: q.search, name: q.name, address: q.address }, FILTERS, 2);
  const orderBy = buildOrderBy(q.sortBy, q.order, SORTS, 'name', 's.id');
  const { limit, offset, page } = paginate(q.page, q.limit);
  const params = [userId, ...values, limit, offset];

  const { rows } = await query(
    `SELECT s.id, s.name, s.address,
            srs.avg_rating, srs.rating_count,
            r.rating     AS my_rating,
            r.updated_at AS my_rated_at,
            COUNT(*) OVER() AS total
       FROM stores s
       JOIN store_rating_summary srs ON srs.store_id = s.id
       LEFT JOIN ratings r           ON r.store_id = s.id AND r.user_id = $1
       ${where}
       ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return { data: rows.map(toStore), meta: buildMeta(rows[0]?.total ?? 0, page, limit) };
}

/** Creates the user's rating, or updates it if they already rated this store. */
export async function upsertRating(userId, storeId, rating) {
  const exists = await query('SELECT 1 FROM stores WHERE id = $1', [storeId]);
  if (!exists.rowCount) throw AppError.notFound('Store not found');

  const { rows } = await query(
    `INSERT INTO ratings (user_id, store_id, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, store_id) DO UPDATE SET rating = EXCLUDED.rating
     RETURNING rating, updated_at, (xmax = 0) AS created`,
    [userId, storeId, rating],
  );

  const summary = await query(
    'SELECT avg_rating, rating_count FROM store_rating_summary WHERE store_id = $1',
    [storeId],
  );

  return {
    created: rows[0].created,
    myRating: rows[0].rating,
    myRatedAt: rows[0].updated_at,
    overallRating: summary.rows[0].avg_rating,
    ratingCount: summary.rows[0].rating_count,
  };
}
