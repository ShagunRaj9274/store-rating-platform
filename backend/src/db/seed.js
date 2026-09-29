import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './pool.js';

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@storerating.com';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

const owners = [
  { name: 'Priya Sharma Store Owner', email: 'owner1@storerating.com', address: 'Boring Road, Patna, Bihar 800001' },
  { name: 'Rahul Verma Store Owner', email: 'owner2@storerating.com', address: 'Fraser Road, Patna, Bihar 800001' },
];
const users = [
  { name: 'Ananya Singh Normal User', email: 'user1@storerating.com', address: 'Kankarbagh, Patna, Bihar 800020' },
  { name: 'Vikram Kumar Normal User', email: 'user2@storerating.com', address: 'Rajendra Nagar, Patna, Bihar 800016' },
  { name: 'Sneha Gupta Normal User', email: 'user3@storerating.com', address: 'Patliputra Colony, Patna, Bihar 800013' },
];
const stores = [
  { name: 'Sharma Fresh Grocery Mart', email: 'grocery@stores.com', address: 'Boring Road, Patna, Bihar 800001', owner: 0 },
  { name: 'Verma Electronics Superstore', email: 'electronics@stores.com', address: 'Fraser Road, Patna, Bihar 800001', owner: 1 },
  { name: 'Ganga Books and Stationery', email: 'books@stores.com', address: 'Ashok Rajpath, Patna, Bihar 800004', owner: null },
  { name: 'Maurya Lok Fashion Outlet', email: 'fashion@stores.com', address: 'Maurya Lok Complex, Patna, Bihar 800001', owner: null },
];
// [userIndex, storeIndex, rating]
const ratings = [
  [0, 0, 5], [1, 0, 4], [2, 0, 4],
  [0, 1, 3], [1, 1, 2],
  [0, 2, 5], [2, 2, 4],
];

try {
  const { rowCount } = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [adminEmail]);
  if (rowCount > 0) {
    console.log('ℹ Seed data already present — skipping.');
  } else {
    await withTransaction(async (client) => {
      const hash = (p) => bcrypt.hash(p, 10);
      const insertUser = async (u, role, password) => {
        const { rows } = await client.query(
          `INSERT INTO users (name, email, password_hash, address, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [u.name, u.email, await hash(password), u.address, role],
        );
        return rows[0].id;
      };

      await insertUser(
        { name: 'System Administrator Account', email: adminEmail, address: 'Head Office, Patna, Bihar' },
        'ADMIN',
        adminPassword,
      );
      const ownerIds = [];
      for (const o of owners) ownerIds.push(await insertUser(o, 'OWNER', 'Owner@123'));
      const userIds = [];
      for (const u of users) userIds.push(await insertUser(u, 'USER', 'User@1234'));

      const storeIds = [];
      for (const s of stores) {
        const { rows } = await client.query(
          `INSERT INTO stores (name, email, address, owner_id) VALUES ($1,$2,$3,$4) RETURNING id`,
          [s.name, s.email, s.address, s.owner === null ? null : ownerIds[s.owner]],
        );
        storeIds.push(rows[0].id);
      }

      for (const [u, s, r] of ratings) {
        await client.query('INSERT INTO ratings (user_id, store_id, rating) VALUES ($1,$2,$3)', [userIds[u], storeIds[s], r]);
      }
    });

    console.log('✔ Seed complete. Demo accounts:');
    console.table([
      { role: 'Admin', email: adminEmail, password: adminPassword },
      { role: 'Store owner', email: 'owner1@storerating.com', password: 'Owner@123' },
      { role: 'Normal user', email: 'user1@storerating.com', password: 'User@1234' },
    ]);
  }
} catch (err) {
  console.error('✖ Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
