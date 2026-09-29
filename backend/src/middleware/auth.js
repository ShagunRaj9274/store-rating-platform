import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Verifies the Bearer token and loads the user fresh from the DB,
 * so deleted accounts and role changes take effect immediately.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw AppError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw AppError.unauthorized('Your session has expired. Please log in again.');
  }

  const { rows } = await query('SELECT id, name, email, address, role FROM users WHERE id = $1', [payload.sub]);
  if (!rows[0]) throw AppError.unauthorized('Account no longer exists');

  req.user = rows[0];
  next();
});

/** Allows the request through only for the given roles. */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(AppError.forbidden());
  next();
};
