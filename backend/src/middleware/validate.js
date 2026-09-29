/**
 * Validates req.body / req.query / req.params against Zod schemas.
 * Parsed (trimmed, coerced, defaulted) values replace the raw ones.
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    next();
  } catch (err) {
    next(err);
  }
};
