// src/middlewares/error.middleware.js

const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Handles requests to routes that don't exist (404).
 * Mounted AFTER all real routes in app.js, so if nothing matched,
 * this runs and forwards a 404 ApiError into the error pipeline.
 */
const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Route not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Global error-handling middleware.
 * Must be defined with 4 arguments (err, req, res, next) —
 * this is how Express recognizes it as an error handler.
 *
 * Mounted LAST in app.js, after all routes and the notFound handler.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // -------------------------------------------
  // Normalize known error types into ApiError
  // -------------------------------------------

  // Mongoose bad ObjectId (e.g., malformed :id in a URL param)
  if (error instanceof mongoose.Error.CastError) {
    const message = `Invalid ${error.path}: ${error.value}`;
    error = ApiError.badRequest(message);
  }

  // Mongoose validation errors (e.g., required field missing)
  else if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((val) => val.message);
    error = ApiError.badRequest('Validation failed', messages);
  }

  // MongoDB duplicate key error (e.g., email already exists)
  else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    const message = field
      ? `${field} already exists`
      : 'Duplicate field value entered';
    error = ApiError.conflict(message);
  }

  // JWT errors
  else if (error.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token. Please log in again.');
  } else if (error.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  // Multer file upload errors
  else if (error.name === 'MulterError') {
    error = ApiError.badRequest(`File upload error: ${error.message}`);
  }

  // If it's not already an ApiError by this point, wrap it as a generic 500
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], error.stack);
  }

  // -------------------------------------------
  // Log the error
  // -------------------------------------------
  if (error.statusCode >= 500) {
    logger.error(
      `${req.method} ${req.originalUrl} - ${error.statusCode} - ${error.message}\n${error.stack}`
    );
  } else {
    logger.warn(
      `${req.method} ${req.originalUrl} - ${error.statusCode} - ${error.message}`
    );
  }

  // -------------------------------------------
  // Send consistent JSON response to client
  // -------------------------------------------
  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    errors: error.errors || [],
    // Only expose stack trace in development for debugging
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

module.exports = { notFound, errorHandler };