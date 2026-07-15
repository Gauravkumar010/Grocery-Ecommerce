// src/controllers/order.controller.js

const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Address = require('../models/Address.model');
const Product = require('../models/Product.model');
const Coupon = require('../models/Coupon.model');
const Notification = require('../models/Notification.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');
const logger = require('../utils/logger');

const DELIVERY_FEE = 20; // flat delivery fee; could be made dynamic later

/**
 * Shared logic: validates cart + address, checks stock, calculates totals.
 * Used by both COD and Razorpay order creation flows.
 * Returns everything needed to build an Order document, WITHOUT actually
 * creating it yet (Razorpay flow needs to create a payment order first).
 */
const prepareOrderData = async (userId, addressId) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw ApiError.notFound('Delivery address not found');
  }

  // Validate stock for every item and build order item snapshots
  const orderItems = [];
  for (const cartItem of cart.items) {
    const product = cartItem.product;

    if (!product || !product.isActive) {
      throw ApiError.badRequest(`A product in your cart is no longer available`);
    }
    if (cartItem.quantity > product.stock) {
      throw ApiError.badRequest(
        `Only ${product.stock} units of ${product.name} available. Please update your cart.`
      );
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      unit: product.unit,
      unitValue: product.unitValue,
      price: product.sellingPrice,
      quantity: cartItem.quantity,
    });
  }

  const itemsSubtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Apply coupon if one is attached to the cart
  let couponDiscount = 0;
  let couponCode = null;
  let coupon = null;

  if (cart.couponApplied) {
    coupon = await Coupon.findById(cart.couponApplied);
    if (coupon) {
      const validation = coupon.validateForUser(userId, itemsSubtotal);
      if (validation.valid) {
        couponDiscount = coupon.calculateDiscount(itemsSubtotal);
        couponCode = coupon.code;
      }
      // If no longer valid (e.g., expired between apply and checkout),
      // silently skip the discount rather than blocking checkout
    }
  }

  const totalAmount = itemsSubtotal + DELIVERY_FEE - couponDiscount;

  const shippingAddress = {
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
  };

  return { cart, orderItems, itemsSubtotal, couponDiscount, couponCode, coupon, totalAmount, shippingAddress };
};

/**
 * Shared logic: after an order is successfully created (COD immediately,
 * or Razorpay after payment verification), finalize side effects —
 * reduce stock, record coupon usage, clear cart, send confirmation email,
 * create a notification.
 */
const finalizeOrder = async (order, userId, cart, coupon) => {
  // Reduce stock for each item
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      await product.reduceStock(item.quantity);
    }
  }

  // Record coupon usage if one was applied
  if (coupon) {
    await coupon.recordUsage(userId);
  }

  // Clear the cart
  await cart.clearCart();

  // Create in-app notification
  await Notification.notifyUser({
    userId,
    title: 'Order Placed Successfully',
    message: `Your order ${order.orderNumber} has been placed and is being processed.`,
    type: 'order',
    link: `/orders/${order.orderNumber}`,
    relatedOrder: order._id,
  });

  // Send confirmation email (non-fatal if it fails)
  try {
    const User = require('../models/User.model');
    const user = await User.findById(userId);
    await sendOrderConfirmationEmail(user.email, user.name, order);
  } catch (error) {
    logger.error(`Failed to send order confirmation email: ${error.message}`);
  }
};

// =========================================
// @desc    Place a Cash-on-Delivery order
// @route   POST /api/v1/orders/cod
// @access  Private
// =========================================
const placeCodOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;

  if (!addressId) {
    throw ApiError.badRequest('Delivery address is required');
  }

  const { cart, orderItems, itemsSubtotal, couponDiscount, couponCode, coupon, totalAmount, shippingAddress } =
    await prepareOrderData(req.user._id, addressId);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    itemsSubtotal,
    deliveryFee: DELIVERY_FEE,
    couponDiscount,
    couponCode,
    totalAmount,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
  });

  await finalizeOrder(order, req.user._id, cart, coupon);

  return res.status(201).json(new ApiResponse(201, { order }, 'Order placed successfully'));
});

// =========================================
// @desc    Get logged-in user's order history
// @route   GET /api/v1/orders
// @access  Private
// =========================================
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
      'Orders fetched successfully'
    )
  );
});

// =========================================
// @desc    Get single order details (must belong to logged-in user)
// @route   GET /api/v1/orders/:orderNumber
// @access  Private
// =========================================
const getOrderByNumber = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: req.user._id });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  return res.status(200).json(new ApiResponse(200, { order }, 'Order fetched successfully'));
});

// =========================================
// @desc    Cancel an order (only if not yet shipped)
// @route   PATCH /api/v1/orders/:orderNumber/cancel
// @access  Private
// =========================================
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: req.user._id });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    throw ApiError.badRequest(
      `Order cannot be cancelled once it is ${order.orderStatus.replace('_', ' ')}`
    );
  }

  // Restore stock for each item
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      await product.increaseStock(item.quantity);
    }
  }

  await order.updateStatus('cancelled', reason || 'Cancelled by customer');

  await Notification.notifyUser({
    userId: req.user._id,
    title: 'Order Cancelled',
    message: `Your order ${order.orderNumber} has been cancelled.`,
    type: 'order',
    link: `/orders/${order.orderNumber}`,
    relatedOrder: order._id,
  });

  return res.status(200).json(new ApiResponse(200, { order }, 'Order cancelled successfully'));
});

// =========================================
// ADMIN ENDPOINTS
// =========================================

// =========================================
// @desc    Get all orders (admin, with pagination + status filter)
// @route   GET /api/v1/orders/admin/all
// @access  Private/Admin
// =========================================
const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
      'Orders fetched successfully'
    )
  );
});

// =========================================
// @desc    Update order status (admin)
// @route   PATCH /api/v1/orders/admin/:orderNumber/status
// @access  Private/Admin
// =========================================
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  if (!status) {
    throw ApiError.badRequest('New status is required');
  }

  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  await order.updateStatus(status, note);

  await Notification.notifyUser({
    userId: order.user,
    title: 'Order Status Updated',
    message: `Your order ${order.orderNumber} is now ${status.replace('_', ' ')}.`,
    type: 'order',
    link: `/orders/${order.orderNumber}`,
    relatedOrder: order._id,
  });

  return res.status(200).json(new ApiResponse(200, { order }, 'Order status updated successfully'));
});

module.exports = {
  prepareOrderData,
  finalizeOrder,
  placeCodOrder,
  getMyOrders,
  getOrderByNumber,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatus,
};