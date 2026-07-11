// src/models/Banner.model.js

const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Subtitle cannot exceed 200 characters'],
    },
    image: {
      url: {
        type: String,
        required: [true, 'Banner image is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Banner image publicId is required'],
      },
    },
    // Where the banner links to when clicked, e.g. "/category/fruits-vegetables"
    // or "/product/fresh-mangoes" — kept as a flexible string set by admin
    linkUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkType: {
      type: String,
      enum: ['category', 'subcategory', 'product', 'external', 'none'],
      default: 'none',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    position: {
      // supports multiple banner zones in the UI, e.g. homepage hero
      // carousel vs a smaller promotional strip further down the page
      type: String,
      enum: ['hero', 'secondary', 'category_page'],
      default: 'hero',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // null = no expiry
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
bannerSchema.index({ isActive: 1, position: 1, displayOrder: 1 });

// =========================================
// STATIC METHODS
// =========================================

/**
 * Returns all currently active AND currently within their date range
 * banners for a given position, sorted by displayOrder.
 * This is what the homepage/frontend will call.
 */
bannerSchema.statics.getActiveBanners = async function (position = 'hero') {
  const now = new Date();

  return this.find({
    isActive: true,
    position,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  }).sort({ displayOrder: 1 });
};

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;