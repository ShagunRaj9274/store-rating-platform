export const ok = (res, data, { status = 200, meta, message } = {}) =>
  res.status(status).json({
    success: true,
    ...(message && { message }),
    data,
    ...(meta && { meta }),
  });
