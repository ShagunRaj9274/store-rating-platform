import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { query } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';

const SALT_ROUNDS = 10;
const PUBLIC_USER_COLUMNS = 'id, name, email, address, role';

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export async function register({ name, email, address, password }) {
  const passwordHash = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, address, role)
     VALUES ($1, $2, $3, $4, 'USER')
     RETURNING ${PUBLIC_USER_COLUMNS}`,
    [name, email, passwordHash, address],
  );
  const user = rows[0];
  return { user, token: signToken(user) };
}

export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT ${PUBLIC_USER_COLUMNS}, password_hash FROM users WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  const record = rows[0];
  // Same message for "no such user" and "wrong password" to avoid account enumeration.
  const ok = record && (await bcrypt.compare(password, record.password_hash));
  if (!ok) throw AppError.unauthorized('Invalid email or password');

  const { password_hash: _omit, ...user } = record;
  return { user, token: signToken(user) };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw AppError.notFound('User not found');

  const matches = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!matches) {
    throw AppError.badRequest('Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(newPassword), userId]);
}
