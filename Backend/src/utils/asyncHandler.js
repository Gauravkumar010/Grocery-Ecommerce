// src/utils/asyncHandler.js

/**
 * Wraps an async Express route handler and automatically catches
 * any rejected promise / thrown error, forwarding it to next(err)
 * so our centralized error middleware can handle it.
 *
 * Usage:
 *   const getProduct = asyncHandler(async (req, res) => {
 *     const product = await Product.findById(req.params.id);
 *     res.json(product);
 *   });
 *
 * @param {Function} fn - An async Express route handler (req, res, next) => {}
 * @returns {Function} A wrapped function safe to use directly as Express middleware/route handler
 */

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;