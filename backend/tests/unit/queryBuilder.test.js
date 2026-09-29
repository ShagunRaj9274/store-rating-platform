import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhere, buildOrderBy, escapeLike, paginate } from '../../src/utils/queryBuilder.js';

const MAP = { name: { sql: 'u.name' }, role: { sql: 'u.role', exact: true }, q: { sql: ['s.name', 's.address'] } };

test('buildWhere parameterises values and skips empty filters', () => {
  const { where, values } = buildWhere({ name: 'ann', role: 'USER', q: '' }, MAP);
  assert.equal(where, 'WHERE u.name ILIKE $1 AND u.role = $2');
  assert.deepEqual(values, ['%ann%', 'USER']);
});

test('buildWhere ORs multi-column search and honours start index', () => {
  const { where } = buildWhere({ q: 'patna' }, MAP, 2);
  assert.equal(where, 'WHERE (s.name ILIKE $2 OR s.address ILIKE $2)');
});

test('buildWhere ignores unknown keys (no column injection)', () => {
  const { where, values } = buildWhere({ 'name; DROP TABLE users': 'x' }, MAP);
  assert.equal(where, '');
  assert.deepEqual(values, []);
});

test('buildOrderBy falls back to default for unknown sort keys', () => {
  const sql = buildOrderBy('password_hash', 'desc', { name: 'u.name' }, 'name', 'u.id');
  assert.equal(sql, 'ORDER BY u.name DESC NULLS LAST, u.id ASC');
});

test('escapeLike escapes wildcards', () => {
  assert.equal(escapeLike('50%_off'), '50\\%\\_off');
});

test('paginate clamps page and limit', () => {
  assert.deepEqual(paginate(0, 1000), { limit: 100, offset: 0, page: 1 });
  assert.deepEqual(paginate(3, 10), { limit: 10, offset: 20, page: 3 });
});
