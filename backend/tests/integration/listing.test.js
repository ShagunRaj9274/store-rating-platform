import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  api,
  auth,
  resetDb,
  closeDb,
  createUser,
  createStore,
} from '../helpers.js';

const t = {};

describe('Search, sort and pagination', () => {
  before(async () => {
    await resetDb();

    t.admin = await createUser({
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    t.user = await createUser({
      email: 'user@test.com',
    });

    await createStore({
      email: 'a@s.com',
      name: 'Alpha Grocery Store Patna',
    });

    await createStore({
      email: 'b@s.com',
      name: 'Beta Electronics Store Patna',
    });

    await createStore({
      email: 'c@s.com',
      name: 'Gamma Books Store Patna Bihar',
    });
  });

  after(closeDb);

  it('filters stores by name (case-insensitive)', async () => {
    const res = await api
      .get('/api/stores?name=beta')
      .set(auth(t.user.token));

    assert.equal(res.body.data.length, 1);
  });

  it('sorts descending', async () => {
    const res = await api
      .get('/api/admin/stores?sortBy=name&order=desc')
      .set(auth(t.admin.token));

    assert.equal(
      res.body.data[0].name,
      'Gamma Books Store Patna Bihar',
    );
  });

  it('paginates with correct meta', async () => {
    const res = await api
      .get('/api/admin/stores?limit=2&page=2')
      .set(auth(t.admin.token));

    assert.equal(res.body.data.length, 1);

    assert.deepEqual(res.body.meta, {
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it('rejects unknown sort columns (no SQL injection through sortBy)', async () => {
    const res = await api
      .get('/api/admin/users?sortBy=password_hash')
      .set(auth(t.admin.token));

    assert.equal(res.status, 400);
  });

  it('filters users by role', async () => {
    const res = await api
      .get('/api/admin/users?role=ADMIN')
      .set(auth(t.admin.token));

    assert.ok(
      res.body.data.every((user) => user.role === 'ADMIN'),
    );
  });
});
