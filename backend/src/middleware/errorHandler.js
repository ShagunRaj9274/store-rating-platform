import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Please fix the highlighted fields',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, ...(err.details && { errors: err.details }) });
  }

  // PostgreSQL constraint violations -> friendly client errors
  if (err.code === '23505') {
    const field = /email/i.test(err.constraint || '') ? 'email' : undefined;
    const message = field ? 'That email is already registered' : 'This record already exists';
    return res.status(409).json({ message, ...(field && { errors: [{ field, message }] }) });
  }
  if (err.code === '23503') return res.status(400).json({ message: 'Referenced record does not exist' });
  if (err.code === '23514') return res.status(400).json({ message: 'A value is outside the allowed range' });

  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });

  console.error(err);
  return res.status(500).json({
    message: 'Something went wrong on our side',
    ...(!env.isProd && { detail: err.message }),
  });
};
