// src/utils/apiResponse.js

/**
 * Standardized success response wrapper.
 * Ensures every successful API response has a consistent shape:
 * { statusCode, data, message, success }
 *
 * Usage in a controller:
 *   return res
 *     .status(200)
 *     .json(new ApiResponse(200, product, 'Product fetched successfully'));
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (200, 201, etc.)
   * @param {*} data - The payload to send back (object, array, null, etc.)
   * @param {string} message - Human-readable success message
   */
  constructor(statusCode, data = null, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    // Anything below 400 is considered a success status code
    this.success = statusCode < 400;
  }
}

module.exports = ApiResponse;