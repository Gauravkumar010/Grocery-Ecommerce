// src/controllers/review.controller.js

const Review = require('../models/Review.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadMultipleToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// =========================================
// @desc    Get all approved reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
// =========================================
const getProductReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter = { product: req.params.productId, isApproved: true };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { reviews, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
      'Reviews fetched successfully'
    )
  );
});

// =========================================
// @desc    Create a review for a product
// @route   POST /api/v1/reviews/product/:productId
// @access  Private
// =========================================
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    throw ApiError.badRequest('Rating is required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const existingReview = await Review.findOne({ product: productId, user: req.user._id });
  if (existingReview) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  // Check if the user has an actual delivered order containing this product
  // (used to mark verifiedPurchase — not required to leave a review)
  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    orderStatus: 'delivered',
    'items.product': productId,
  });

  let images = [];
  if (req.files && req.files.length > 0) {
    const filePaths = req.files.map((f) => f.path);
    images = await uploadMultipleToCloudinary(filePaths, 'grocery/reviews');
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    order: deliveredOrder ? deliveredOrder._id : null,
    rating: Number(rating),
    comment,
    images,
    verifiedPurchase: !!deliveredOrder,
  });

  await review.populate('user', 'name avatar');

  return res.status(201).json(new ApiResponse(201, { review }, 'Review submitted successfully'));
});

// =========================================
// @desc    Update own review
// @route   PATCH /api/v1/reviews/:id
// @access  Private
// =========================================
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  const { rating, comment } = req.body;

  if (rating !== undefined) review.rating = Number(rating);
  if (comment !== undefined) review.comment = comment;

  if (req.files && req.files.length > 0) {
    // Remove old images from Cloudinary, replace with new ones
    await Promise.all(
      review.images.map((img) => deleteFromCloudinary(img.publicId).catch(() => {}))
    );
    const filePaths = req.files.map((f) => f.path);
    review.images = await uploadMultipleToCloudinary(filePaths, 'grocery/reviews');
  }

  // Triggers post('save') hook -> recalculates product ratings
  await review.save();
  await review.populate('user', 'name avatar');

  return res.status(200).json(new ApiResponse(200, { review }, 'Review updated successfully'));
});

// =========================================
// @desc    Delete own review (or admin can delete any)
// @route   DELETE /api/v1/reviews/:id
// @access  Private
// =========================================
const deleteReview = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };

  const review = await Review.findOne(filter);

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  await Promise.all(
    review.images.map((img) => deleteFromCloudinary(img.publicId).catch(() => {}))
  );

  // Triggers post('findOneAndDelete') hook -> recalculates product ratings
  await Review.findOneAndDelete(filter);

  return res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
});

// =========================================
// @desc    Get logged-in user's own reviews
// @route   GET /api/v1/reviews/my-reviews
// @access  Private
// =========================================
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { reviews }, 'Your reviews fetched successfully'));
});

// =========================================
// ADMIN: Toggle review approval (moderation)
// @route   PATCH /api/v1/reviews/:id/toggle-approval
// @access  Private/Admin
// =========================================
const toggleReviewApproval = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  review.isApproved = !review.isApproved;
  await review.save(); // triggers rating recalculation

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { review },
        `Review ${review.isApproved ? 'approved' : 'hidden'} successfully`
      )
    );
});

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  toggleReviewApproval,
};