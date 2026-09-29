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

const rate = (token, storeId, rating) =>
  api
    .put(`/api/stores/${storeId}/rating`)
    .set(auth(token))
    .send({ rating });

describe('Ratings', () => {
  before(async () => {
    await resetDb();

    t.a = await createUser({
      email: 'a@test.com',
    });

    t.b = await createUser({
      email: 'b@test.com',
    });

    t.owner = await createUser({
      role: 'OWNER',
      email: 'owner@test.com',
    });

    t.store = await createStore({
      email: 'store@test.com',
      ownerId: t.owner.id,
    });
  });

  after(closeDb);

  it('creates a rating (201), then updates it (200) without duplicating', async () => {
    assert.equal(
      (await rate(t.a.token, t.store.id, 4)).status,
      201,
    );

    const res = await rate(t.a.token, t.store.id, 2);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.myRating, 2);

    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM ratings WHERE store_id = $1',
      [t.store.id],
    );

    assert.equal(rows[0].count, 1);
  });

  it('recalculates the average after each rating', async () => {
    const res = await rate(t.b.token, t.store.id, 5);

    assert.equal(res.body.data.overallRating, 3.5);
    assert.equal(res.body.data.ratingCount, 2);
  });

  for (const bad of [0, 6, 2.5, 'abc']) {
    it(`rejects rating ${JSON.stringify(bad)}`, async () => {
      assert.equal(
        (await rate(t.a.token, t.store.id, bad)).status,
        400,
      );
    });
  }

  it('returns 404 for a store that does not exist', async () => {
    assert.equal(
      (await rate(t.a.token, 99999, 3)).status,
      404,
    );
  });

  it('shows raters and star distribution to the owner', async () => {
    const res = await api
      .get('/api/owner/dashboard')
      .set(auth(t.owner.token));

    assert.equal(res.body.data.raters.length, 2);
    assert.equal(
      res.body.data.distribution.find((d) => d.star === 5).count,
      1,
    );
  });
});
