// src/utils/apiError.js

/**
 * Custom API Error class extending the native Error object.
 * Used throughout controllers/services to throw errors with
 * a specific HTTP status code, which our global error middleware
 * (src/middlewares/error.middleware.js) reads to build the response.
 *
 * Usage:
 *   throw new ApiError(404, 'Product not found');
 *   throw new ApiError(400, 'Validation failed', [{ field: 'email', message: 'Invalid email' }]);
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500, etc.)
   * @param {string} message - Human-readable error message
   * @param {Array} errors - Optional array of detailed validation errors
   * @param {string} stack - Optional custom stack trace
   */
  constructor(
    statusCode,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // -------------------------------------------
  // Static helper methods for common HTTP errors
  // (optional convenience — makes controllers more readable)
  // -------------------------------------------
  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;