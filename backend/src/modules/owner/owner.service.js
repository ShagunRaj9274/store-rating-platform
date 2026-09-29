import { query } from '../../db/pool.js';
import { buildOrderBy } from '../../utils/queryBuilder.js';

const RATER_SORTS = { name: 'u.name', email: 'u.email', rating: 'r.rating', ratedAt: 'r.updated_at' };

export async function getOwnerDashboard(ownerId, q) {
  const storeRes = await query(
    `SELECT s.id, s.name, s.email, s.address, srs.avg_rating, srs.rating_count
       FROM stores s
       JOIN store_rating_summary srs ON srs.store_id = s.id
      WHERE s.owner_id = $1`,
    [ownerId],
  );
  const store = storeRes.rows[0];
  if (!store) return { store: null, distribution: [], raters: [] };

  const orderBy = buildOrderBy(q.sortBy, q.order, RATER_SORTS, 'ratedAt', 'u.id');
  const [ratersRes, distRes] = await Promise.all([
    query(
      `SELECT u.id, u.name, u.email, r.rating, r.updated_at
         FROM ratings r
         JOIN users u ON u.id = r.user_id
        WHERE r.store_id = $1
        ${orderBy}`,
      [store.id],
    ),
    query('SELECT rating, COUNT(*) AS count FROM ratings WHERE store_id = $1 GROUP BY rating', [store.id]),
  ]);

  // Always return all five buckets so the UI can draw a full histogram.
  const counts = Object.fromEntries(distRes.rows.map((d) => [d.rating, d.count]));
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: counts[star] ?? 0 }));

  return {
    store: {
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      avgRating: store.avg_rating,
      ratingCount: store.rating_count,
    },
    distribution,
    raters: ratersRes.rows.map((r) => ({ id: r.id, name: r.name, email: r.email, rating: r.rating, ratedAt: r.updated_at })),
  };
}
