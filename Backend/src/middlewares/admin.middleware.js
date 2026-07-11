// src/middlewares/admin.middleware.js

const ApiError = require('../utils/apiError');

/**
 * Role-based access control middleware.
 * Must be used AFTER the `protect` middleware, since it relies on
 * req.user already being set.
 *
 * Usage:
 *   router.post('/products', protect, authorize('admin'), createProduct);
 *   router.get('/reports', protect, authorize('admin', 'manager'), getReports);
 *
 * @param  {...string} allowedRoles - roles permitted to access this route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      // This should never happen if `protect` is always used before
      // `authorize`, but we guard against misconfiguration anyway.
      return next(ApiError.unauthorized('Not authorized, please log in'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Convenience shorthand specifically for admin-only routes,
 * since that's the most common case in this project.
 */
const isAdmin = authorize('admin');

module.exports = { authorize, isAdmin };