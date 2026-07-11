// src/models/Review.model.js

const mongoose = require('mongoose');
const Product = require('./Product.model');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      // optional — links to the order this review is based on,
      // used to verify a genuine purchase
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      // admin moderation — allows hiding inappropriate reviews without deleting
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================
// INDEXES
// =========================================
// A user can only leave ONE review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1 });

// =========================================
// STATIC METHODS
// =========================================

/**
 * Recalculates and updates the aggregate rating (average + count)
 * on the associated Product document. Called after any review is
 * created, updated, or deleted.
 */
reviewSchema.statics.recalculateProductRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const product = await Product.findById(productId);
  if (!product) return;

  if (stats.length > 0) {
    await product.updateRatings(stats[0].averageRating, stats[0].count);
  } else {
    // no approved reviews left — reset to zero
    await product.updateRatings(0, 0);
  }
};

// =========================================
// MIDDLEWARE
// =========================================

// After a review is saved (created or updated), recalculate product ratings
reviewSchema.post('save', async function (doc) {
  await doc.constructor.recalculateProductRatings(doc.product);
});

// After a review is removed via findOneAndDelete/findByIdAndDelete, recalculate
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.recalculateProductRatings(doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;