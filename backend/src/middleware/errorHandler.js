import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

export const notFound = (req, _res, next) =>
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return fail(res, 400, 'Please fix the highlighted fields', {
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof AppError) {
    return fail(
      res,
      err.statusCode,
      err.message,
      err.details ? { errors: err.details } : {},
    );
  }

  if (err.code === '23505') {
    const isEmail = /email/i.test(err.constraint || '');
    const message = isEmail
      ? 'That email is already registered'
      : 'This record already exists';

    return fail(
      res,
      409,
      message,
      isEmail ? { errors: [{ field: 'email', message }] } : {},
    );
  }

  if (err.code === '23503') {
    return fail(res, 400, 'Referenced record does not exist');
  }

  if (err.code === '23514') {
    return fail(res, 400, 'A value is outside the allowed range');
  }

  if (err.type === 'entity.parse.failed') {
    return fail(res, 400, 'Malformed JSON body');
  }

  req.log?.error({ err }, 'Unhandled error');

  return fail(res, 500, 'Something went wrong on our side', {
    requestId: req.id,
    ...(!env.isProd && { detail: err.message }),
  });
};
