// src/controllers/coupon.controller.js

const Coupon = require('../models/Coupon.model');
const Cart = require('../models/Cart.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// =========================================
// @desc    Get all coupons (admin)
// @route   GET /api/v1/coupons/admin
// @access  Private/Admin
// =========================================
const getAllCouponsAdmin = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { coupons }, 'Coupons fetched successfully'));
});

// =========================================
// @desc    Get all currently active/valid coupons (public, for display)
// @route   GET /api/v1/coupons
// @access  Public
// =========================================
const getActiveCoupons = asyncHandler(async (req, res) => {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  })
    .select('code description discountType discountValue maxDiscountAmount minOrderValue validUntil')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { coupons }, 'Active coupons fetched successfully'));
});

// =========================================
// @desc    Create a new coupon
// @route   POST /api/v1/coupons
// @access  Private/Admin
// =========================================
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderValue,
    usageLimit,
    usageLimitPerUser,
    validFrom,
    validUntil,
  } = req.body;

  if (!code || !discountType || discountValue === undefined || !validUntil) {
    throw ApiError.badRequest('code, discountType, discountValue, and validUntil are required');
  }

  const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (existing) {
    throw ApiError.conflict('A coupon with this code already exists');
  }

  const coupon = await Coupon.create({
    code,
    description,
    discountType,
    discountValue: Number(discountValue),
    maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
    minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
    usageLimit: usageLimit ? Number(usageLimit) : null,
    usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : 1,
    validFrom: validFrom ? new Date(validFrom) : Date.now(),
    validUntil: new Date(validUntil),
  });

  return res.status(201).json(new ApiResponse(201, { coupon }, 'Coupon created successfully'));
});

// =========================================
// @desc    Update a coupon
// @route   PATCH /api/v1/coupons/:id
// @access  Private/Admin
// =========================================
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }

  const numberFields = ['discountValue', 'maxDiscountAmount', 'minOrderValue', 'usageLimit', 'usageLimitPerUser'];
  const simpleFields = ['description', 'discountType'];

  simpleFields.forEach((field) => {
    if (req.body[field] !== undefined) coupon[field] = req.body[field];
  });

  numberFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      coupon[field] = req.body[field] === '' ? null : Number(req.body[field]);
    }
  });

  if (req.body.validFrom !== undefined) coupon.validFrom = new Date(req.body.validFrom);
  if (req.body.validUntil !== undefined) coupon.validUntil = new Date(req.body.validUntil);
  if (req.body.isActive !== undefined) {
    coupon.isActive = req.body.isActive === 'true' || req.body.isActive === true;
  }

  await coupon.save();

  return res.status(200).json(new ApiResponse(200, { coupon }, 'Coupon updated successfully'));
});

// =========================================
// @desc    Delete a coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
// =========================================
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }

  await Coupon.findByIdAndDelete(coupon._id);

  return res.status(200).json(new ApiResponse(200, null, 'Coupon deleted successfully'));
});

// =========================================
// @desc    Validate and apply a coupon to the logged-in user's cart
// @route   POST /api/v1/coupons/apply
// @access  Private
// =========================================
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw ApiError.badRequest('Coupon code is required');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon) {
    throw ApiError.notFound('Invalid coupon code');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  const subtotal = cart.subtotal;

  const validation = coupon.validateForUser(req.user._id, subtotal);
  if (!validation.valid) {
    throw ApiError.badRequest(validation.message);
  }

  const discount = coupon.calculateDiscount(subtotal);

  cart.couponApplied = coupon._id;
  await cart.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
        subtotal,
        discount,
        total: subtotal - discount,
      },
      'Coupon applied successfully'
    )
  );
});

// =========================================
// @desc    Remove the applied coupon from the cart
// @route   DELETE /api/v1/coupons/apply
// @access  Private
// =========================================
const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  cart.couponApplied = null;
  await cart.save();

  return res.status(200).json(new ApiResponse(200, null, 'Coupon removed successfully'));
});

module.exports = {
  getAllCouponsAdmin,
  getActiveCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  removeCoupon,
};