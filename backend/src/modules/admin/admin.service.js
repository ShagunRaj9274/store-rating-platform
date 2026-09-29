import { query } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
import { buildWhere, buildOrderBy, paginate, buildMeta } from '../../utils/queryBuilder.js';
import { hashPassword } from '../auth/auth.service.js';

export async function getDashboard() {
  const [totals, byRole, topStores] = await Promise.all([
    query(`SELECT
             (SELECT COUNT(*) FROM users)   AS total_users,
             (SELECT COUNT(*) FROM stores)  AS total_stores,
             (SELECT COUNT(*) FROM ratings) AS total_ratings`),
    query(`SELECT role, COUNT(*) AS count FROM users GROUP BY role`),
    query(`SELECT s.id, s.name, srs.avg_rating, srs.rating_count
             FROM stores s JOIN store_rating_summary srs ON srs.store_id = s.id
            WHERE srs.rating_count > 0
            ORDER BY srs.avg_rating DESC, srs.rating_count DESC
            LIMIT 5`),
  ]);

  const t = totals.rows[0];
  return {
    totalUsers: t.total_users,
    totalStores: t.total_stores,
    totalRatings: t.total_ratings,
    usersByRole: Object.fromEntries(byRole.rows.map((r) => [r.role, r.count])),
    topStores: topStores.rows.map((s) => ({
      id: s.id, name: s.name, avgRating: s.avg_rating, ratingCount: s.rating_count,
    })),
  };
}

// ----------------------------- Users -----------------------------
const USER_FILTERS = {
  name: { sql: 'u.name' },
  email: { sql: 'u.email' },
  address: { sql: 'u.address' },
  role: { sql: 'u.role', exact: true },
};
const USER_SORTS = {
  name: 'u.name', email: 'u.email', address: 'u.address', role: 'u.role',
  rating: 'srs.avg_rating', createdAt: 'u.created_at',
};

const toUser = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  address: r.address,
  role: r.role,
  createdAt: r.created_at,
  // Only store owners have a rating; null for everyone else.
  rating: r.role === 'OWNER' ? r.avg_rating ?? null : undefined,
});

export async function listUsers(q) {
  const { where, values } = buildWhere(
    { name: q.name, email: q.email, address: q.address, role: q.role },
    USER_FILTERS,
  );
  const orderBy = buildOrderBy(q.sortBy, q.order, USER_SORTS, 'name', 'u.id');
  const { limit, offset, page } = paginate(q.page, q.limit);

  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
            srs.avg_rating,
            COUNT(*) OVER() AS total
       FROM users u
       LEFT JOIN stores s                  ON s.owner_id = u.id
       LEFT JOIN store_rating_summary srs  ON srs.store_id = s.id
       ${where}
       ${orderBy}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );

  return { data: rows.map(toUser), meta: buildMeta(rows[0]?.total ?? 0, page, limit) };
}

export async function getUserById(id) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
            s.id AS store_id, s.name AS store_name, s.address AS store_address,
            srs.avg_rating, srs.rating_count,
            (SELECT COUNT(*) FROM ratings r WHERE r.user_id = u.id) AS ratings_given
       FROM users u
       LEFT JOIN stores s                 ON s.owner_id = u.id
       LEFT JOIN store_rating_summary srs ON srs.store_id = s.id
      WHERE u.id = $1`,
    [id],
  );
  const r = rows[0];
  if (!r) throw AppError.notFound('User not found');

  return {
    ...toUser(r),
    ratingsGiven: r.ratings_given,
    store: r.store_id
      ? { id: r.store_id, name: r.store_name, address: r.store_address, avgRating: r.avg_rating, ratingCount: r.rating_count }
      : null,
  };
}

export async function createUser({ name, email, address, password, role }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, address, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, address, role, created_at`,
    [name, email, await hashPassword(password), address, role],
  );
  return toUser(rows[0]);
}

export async function listAvailableOwners() {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email
       FROM users u
       LEFT JOIN stores s ON s.owner_id = u.id
      WHERE u.role = 'OWNER' AND s.id IS NULL
      ORDER BY u.name`,
  );
  return rows;
}

// ----------------------------- Stores -----------------------------
const STORE_FILTERS = {
  name: { sql: 's.name' },
  email: { sql: 's.email' },
  address: { sql: 's.address' },
};
const STORE_SORTS = {
  name: 's.name', email: 's.email', address: 's.address',
  rating: 'srs.avg_rating', ratingCount: 'srs.rating_count', createdAt: 's.created_at',
};

const toStore = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  address: r.address,
  rating: r.avg_rating,
  ratingCount: r.rating_count,
  owner: r.owner_id ? { id: r.owner_id, name: r.owner_name } : null,
  createdAt: r.created_at,
});

export async function listStores(q) {
  const { where, values } = buildWhere({ name: q.name, email: q.email, address: q.address }, STORE_FILTERS);
  const orderBy = buildOrderBy(q.sortBy, q.order, STORE_SORTS, 'name', 's.id');
  const { limit, offset, page } = paginate(q.page, q.limit);

  const { rows } = await query(
    `SELECT s.id, s.name, s.email, s.address, s.created_at, s.owner_id,
            o.name AS owner_name, srs.avg_rating, srs.rating_count,
            COUNT(*) OVER() AS total
       FROM stores s
       JOIN store_rating_summary srs ON srs.store_id = s.id
       LEFT JOIN users o             ON o.id = s.owner_id
       ${where}
       ${orderBy}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );

  return { data: rows.map(toStore), meta: buildMeta(rows[0]?.total ?? 0, page, limit) };
}

export async function createStore({ name, email, address, ownerId }) {
  if (ownerId) {
    const { rows } = await query(
      `SELECT u.role, s.id AS store_id
         FROM users u LEFT JOIN stores s ON s.owner_id = u.id
        WHERE u.id = $1`,
      [ownerId],
    );
    const owner = rows[0];
    const fail = (message) => AppError.badRequest(message, [{ field: 'ownerId', message }]);
    if (!owner) throw fail('Selected owner does not exist');
    if (owner.role !== 'OWNER') throw fail('Selected user is not a store owner');
    if (owner.store_id) throw fail('This owner already has a store');
  }

  const { rows } = await query(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, address, owner_id, created_at`,
    [name, email, address, ownerId ?? null],
  );
  return toStore({ ...rows[0], avg_rating: null, rating_count: 0 });
}
