/** An error that is safe to show to the client, with an HTTP status. */
export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(msg, details) { return new AppError(400, msg, details); }
  static unauthorized(msg = 'Authentication required') { return new AppError(401, msg); }
  static forbidden(msg = 'You do not have permission to do that') { return new AppError(403, msg); }
  static notFound(msg = 'Resource not found') { return new AppError(404, msg); }
  static conflict(msg) { return new AppError(409, msg); }
}
