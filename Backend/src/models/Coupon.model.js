// src/models/Coupon.model.js

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['flat', 'percentage'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    maxDiscountAmount: {
      // only relevant for 'percentage' type — caps the discount
      // e.g., "10% off, up to ₹100"
      type: Number,
      default: null,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order value cannot be negative'],
    },
    usageLimit: {
      // total number of times this coupon can be used across ALL users
      type: Number,
      default: null, // null = unlimited
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    usedCount: {
      // total times used so far (across all users)
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        usedCount: {
          type: Number,
          default: 1,
        },
      },
    ],
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Coupon expiry date is required'],
    },
    isActive: {
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
couponSchema.index({ isActive: 1 });
couponSchema.index({ validUntil: 1 });

// =========================================
// INSTANCE METHODS
// =========================================

/**
 * Calculates the actual discount amount for a given order subtotal.
 * Applies the maxDiscountAmount cap for percentage-type coupons.
 */
couponSchema.methods.calculateDiscount = function (orderSubtotal) {
  let discount = 0;

  if (this.discountType === 'flat') {
    discount = this.discountValue;
  } else if (this.discountType === 'percentage') {
    discount = (orderSubtotal * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  }

  // Discount should never exceed the order subtotal itself
  return Math.min(discount, orderSubtotal);
};

/**
 * Validates whether a given user can use this coupon for a given
 * order subtotal. Returns { valid: boolean, message: string }.
 * This is the single source of truth for all coupon validity rules.
 */
couponSchema.methods.validateForUser = function (userId, orderSubtotal) {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, message: 'This coupon is no longer active' };
  }

  if (now < this.validFrom) {
    return { valid: false, message: 'This coupon is not yet valid' };
  }

  if (now > this.validUntil) {
    return { valid: false, message: 'This coupon has expired' };
  }

  if (orderSubtotal < this.minOrderValue) {
    return {
      valid: false,
      message: `Minimum order value of ₹${this.minOrderValue} required for this coupon`,
    };
  }

  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'This coupon has reached its usage limit' };
  }

  const userUsage = this.usedBy.find(
    (entry) => entry.user.toString() === userId.toString()
  );

  if (userUsage && userUsage.usedCount >= this.usageLimitPerUser) {
    return {
      valid: false,
      message: 'You have already used this coupon the maximum number of times',
    };
  }

  return { valid: true, message: 'Coupon is valid' };
};

/**
 * Records usage of this coupon by a user — increments both the
 * global usedCount and that user's individual usage count.
 * Should be called only AFTER a successful order placement.
 */
couponSchema.methods.recordUsage = async function (userId) {
  this.usedCount += 1;

  const userUsage = this.usedBy.find(
    (entry) => entry.user.toString() === userId.toString()
  );

  if (userUsage) {
    userUsage.usedCount += 1;
  } else {
    this.usedBy.push({ user: userId, usedCount: 1 });
  }

  await this.save();
  return this;
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;