import { readFile } from 'node:fs/promises';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';

export const api = request(app);
export { pool };

export const auth = (token) => ({
  Authorization: `Bearer ${token}`,
});

export async function resetDb() {
  await pool.query(
    await readFile(new URL('../src/db/schema.sql', import.meta.url), 'utf8'),
  );
  await pool.query('TRUNCATE ratings, stores, users RESTART IDENTITY CASCADE');
}

export async function createUser({
  role = 'USER',
  email,
  password = 'Test@1234',
}) {
  const hash = await bcrypt.hash(password, 4);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, address, role)
     VALUES ('Integration Test User Name', $1, $2, 'Patna, Bihar', $3)
     RETURNING id`,
    [email, hash, role],
  );

  const res = await api
    .post('/api/auth/login')
    .send({ email, password });

  return {
    id: rows[0].id,
    token: res.body.data.token,
  };
}

export async function createStore({
  email,
  ownerId = null,
  name = 'Integration Test Store Name',
}) {
  const { rows } = await pool.query(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES ($1, $2, 'Boring Road, Patna', $3)
     RETURNING id`,
    [name, email, ownerId],
  );

  return { id: rows[0].id };
}

export const closeDb = () => pool.end();
