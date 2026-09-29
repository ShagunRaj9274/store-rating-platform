import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  api,
  auth,
  resetDb,
  closeDb,
  createUser,
  createStore,
  pool,
} from '../helpers.js';

const t = {};

const cases = [
  ['ADMIN', '/api/admin/dashboard', 200],
  ['USER', '/api/admin/dashboard', 403],
  ['OWNER', '/api/admin/users', 403],
  ['USER', '/api/stores', 200],
  ['ADMIN', '/api/stores', 403],
  ['OWNER', '/api/stores', 403],
  ['OWNER', '/api/owner/dashboard', 200],
  ['USER', '/api/owner/dashboard', 403],
];

describe('Role-based access', () => {
  before(async () => {
    await resetDb();

    t.ADMIN = await createUser({
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    t.USER = await createUser({
      role: 'USER',
      email: 'user@test.com',
    });

    t.OWNER = await createUser({
      role: 'OWNER',
      email: 'owner@test.com',
    });

    t.store = await createStore({
      email: 'store@test.com',
      ownerId: t.OWNER.id,
    });
  });

  after(closeDb);

  for (const [role, url, status] of cases) {
    it(`${role} -> GET ${url} returns ${status}`, async () => {
      const res = await api
        .get(url)
        .set(auth(t[role].token));

      assert.equal(res.status, status);
    });
  }

  it('admin cannot change their own role', async () => {
    const res = await api
      .patch(`/api/admin/users/${t.ADMIN.id}/role`)
      .set(auth(t.ADMIN.token))
      .send({ role: 'USER' });

    assert.equal(res.status, 400);
  });

  it('demoting an owner unassigns their store in the same transaction', async () => {
    const res = await api
      .patch(`/api/admin/users/${t.OWNER.id}/role`)
      .set(auth(t.ADMIN.token))
      .send({ role: 'USER' });

    assert.equal(res.status, 200);

    const { rows } = await pool.query(
      'SELECT owner_id FROM stores WHERE id = $1',
      [t.store.id],
    );

    assert.equal(rows[0].owner_id, null);
  });

  it('admin cannot assign an owner who already has a store', async () => {
    const owner = await createUser({
      role: 'OWNER',
      email: 'o2@test.com',
    });

    await createStore({
      email: 's2@test.com',
      ownerId: owner.id,
    });

    const res = await api
      .post('/api/admin/stores')
      .set(auth(t.ADMIN.token))
      .send({
        name: 'Second Store For Same Owner',
        email: 's3@test.com',
        address: 'Patna',
        ownerId: owner.id,
      });

    assert.equal(res.status, 400);
  });
});

