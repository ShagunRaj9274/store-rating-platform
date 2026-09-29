import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { api, auth, resetDb, closeDb } from '../helpers.js';

const valid = {
  name: 'Integration Test User Name',
  email: 'new@test.com',
  address: 'Patna, Bihar',
  password: 'Valid@123',
};

describe('Authentication', () => {
  before(resetDb);
  after(closeDb);

  it('registers a normal user and never returns the password hash', async () => {
    const res = await api.post('/api/auth/register').send(valid);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'USER');
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.password_hash, undefined);
  });

  it('ignores a role sent during sign-up (no self-promotion to admin)', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ ...valid, email: 'sneaky@test.com', role: 'ADMIN' });

    assert.equal(res.body.data.user.role, 'USER');
  });

  it('rejects a duplicate email regardless of case', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ ...valid, email: 'NEW@test.com' });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  it('returns an error for each invalid field', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({
        name: 'short',
        email: 'x',
        address: '',
        password: 'weak',
      });

    assert.equal(res.status, 400);

    const fields = res.body.errors.map((e) => e.field);

    for (const field of ['name', 'email', 'address', 'password']) {
      assert.ok(fields.includes(field), field);
    }
  });

  it('uses the same message for wrong password and unknown email', async () => {
    const a = await api
      .post('/api/auth/login')
      .send({ email: 'new@test.com', password: 'Wrong@123' });

    const b = await api
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Wrong@123' });

    assert.equal(a.status, 401);
    assert.equal(a.body.message, b.body.message);
  });

  it('rejects missing and tampered tokens', async () => {
    assert.equal((await api.get('/api/auth/me')).status, 401);
    assert.equal(
      (await api.get('/api/auth/me').set(auth('not.a.jwt'))).status,
      401,
    );
  });

  it('changes password only with the correct current password', async () => {
    const { body } = await api
      .post('/api/auth/login')
      .send({
        email: valid.email,
        password: valid.password,
      });

    const token = body.data.token;

    const bad = await api
      .patch('/api/auth/password')
      .set(auth(token))
      .send({
        currentPassword: 'Nope@123',
        newPassword: 'Newer@123',
      });

    assert.equal(bad.status, 400);

    const good = await api
      .patch('/api/auth/password')
      .set(auth(token))
      .send({
        currentPassword: valid.password,
        newPassword: 'Newer@123',
      });

    assert.equal(good.status, 200);

    const login = await api
      .post('/api/auth/login')
      .send({
        email: valid.email,
        password: 'Newer@123',
      });

    assert.equal(login.status, 200);
  });
});
