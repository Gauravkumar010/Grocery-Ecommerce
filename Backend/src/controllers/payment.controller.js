// src/controllers/payment.controller.js

const Order = require('../models/Order.model');
const { createRazorpayOrder, verifyPaymentSignature } = require('../config/razorpay');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { prepareOrderData, finalizeOrder } = require('./order.controller');
const logger = require('../utils/logger');

// =========================================
// @desc    Create a Razorpay order (step 1 of online payment)
// @route   POST /api/v1/payments/create-order
// @access  Private
// =========================================
// const createPaymentOrder = asyncHandler(async (req, res) => {
//   const { addressId } = req.body;

//   if (!addressId) {
//     throw ApiError.badRequest('Delivery address is required');
//   }

//   // Validate cart/address/stock now, so the user isn't shown a payment
//   // popup for an order that would fail anyway
//   const { totalAmount } = await prepareOrderData(req.user._id, addressId);

//   const receipt = `receipt_${req.user._id}_${Date.now()}`;
//   const razorpayOrder = await createRazorpayOrder(totalAmount, receipt);



const createPaymentOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;

  if (!addressId) {
    throw ApiError.badRequest('Delivery address is required');
  }

  const { totalAmount } = await prepareOrderData(req.user._id, addressId);

  const receipt = `rcpt_${req.user._id.toString().slice(-8)}_${Date.now()}`;
  const razorpayOrder = await createRazorpayOrder(totalAmount, receipt);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
      'Payment order created successfully'
    )
  );
});

// =========================================
// @desc    Verify Razorpay payment and finalize the order (step 2)
// @route   POST /api/v1/payments/verify
// @access  Private
// =========================================
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    addressId,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !addressId) {
    throw ApiError.badRequest(
      'razorpay_order_id, razorpay_payment_id, razorpay_signature, and addressId are required'
    );
  }

  const isValidSignature = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValidSignature) {
    logger.error(`Payment signature verification FAILED for user ${req.user._id}`);
    throw ApiError.badRequest('Payment verification failed. Please contact support if money was deducted.');
  }

  // Signature is valid — NOW it's safe to actually create the order.
  // Re-run prepareOrderData to get fresh, validated order data (cart
  // could theoretically have changed between step 1 and step 2).
  const { cart, orderItems, itemsSubtotal, couponDiscount, couponCode, coupon, totalAmount, shippingAddress } =
    await prepareOrderData(req.user._id, addressId);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    itemsSubtotal,
    deliveryFee: 20,
    couponDiscount,
    couponCode,
    totalAmount,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  await order.updateStatus('confirmed', 'Payment received via Razorpay');
  await finalizeOrder(order, req.user._id, cart, coupon);

  return res
    .status(201)
    .json(new ApiResponse(201, { order }, 'Payment verified and order placed successfully'));
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
};