// src/config/razorpay.js

const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

// -------------------------------------------
// Initialize Razorpay instance with credentials from .env
// -------------------------------------------
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Creates a Razorpay order — this must happen on the BACKEND before
 * the frontend can open the Razorpay payment popup. Returns an order
 * object containing an `id` that the frontend passes to Razorpay's
 * checkout.js widget.
 *
 * @param {number} amountInRupees - order amount in rupees (e.g., 499.50)
 * @param {string} receipt - a reference string, typically our internal orderNumber
 * @returns {Promise<object>} Razorpay order object
 */
const createRazorpayOrder = async (amountInRupees, receipt) => {
  try {
    // Razorpay requires amount in the smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amountInRupees * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      payment_capture: 1, // auto-capture payment immediately after authorization
    };

    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    const description = error?.error?.description || error.message || 'Unknown Razorpay error';
    logger.error(`Razorpay order creation failed: ${description}`);
    throw error;
  }
};

/**
 * Verifies the payment signature Razorpay sends back after a successful
 * payment. This is a CRITICAL security step — without this verification,
 * a malicious user could fake a "payment success" response from the
 * frontend without actually paying.
 *
 * Razorpay's signature is an HMAC-SHA256 hash of "order_id|payment_id"
 * signed with our secret key. We recompute it ourselves and compare.
 *
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} razorpaySignature - the signature sent by Razorpay/frontend
 * @returns {boolean} true if the signature is valid (payment is genuine)
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

module.exports = {
  razorpayInstance,
  createRazorpayOrder,
  verifyPaymentSignature,
};