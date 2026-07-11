// src/middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const User = require('../models/User.model');

/**
 * Extracts the JWT from the request — checks the Authorization header
 * first (Bearer token), then falls back to an httpOnly cookie.
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * REQUIRED authentication middleware.
 * Blocks the request with 401 if no valid token/user is found.
 * Attaches the authenticated user document to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw ApiError.unauthorized('Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired, please log in again');
    }
    throw ApiError.unauthorized('Not authorized, invalid token');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw ApiError.unauthorized('Not authorized, user no longer exists');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  req.user = user;
  next();
});

/**
 * OPTIONAL authentication middleware.
 * If a valid token is present, attaches req.user (same as protect).
 * If no token or an invalid token is present, simply continues with
 * req.user left undefined — does NOT throw an error.
 * Useful for routes that work for both guests and logged-in users.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Silently ignore invalid/expired tokens for optional auth —
    // just proceed as a guest request
  }

  next();
});

module.exports = { protect, optionalAuth };