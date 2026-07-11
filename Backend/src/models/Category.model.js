// src/models/Category.model.js

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      url: {
        type: String,
        required: [true, 'Category image is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Category image publicId is required'],
      },
    },
    displayOrder: {
      type: Number,
      default: 0, // lower numbers show first on homepage
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
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ isActive: 1 });

// =========================================
// MIDDLEWARE
// =========================================

/**
 * Auto-generates a URL-friendly slug from the category name
 * before saving, but only when the name changes (or on creation).
 * Example: "Fruits & Vegetables" -> "fruits-vegetables"
 */
categorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove special characters except spaces/hyphens
      .replace(/[\s_]+/g, '-') // replace spaces/underscores with hyphens
      .replace(/-+/g, '-'); // collapse multiple hyphens into one
  }
});

// =========================================
// VIRTUALS
// =========================================

/**
 * Virtual population: lets us do Category.find().populate('subCategories')
 * to get all subcategories belonging to this category, without storing
 * subcategory IDs directly on the category document (avoids array bloat).
 */
categorySchema.virtual('subCategories', {
  ref: 'SubCategory',
  localField: '_id',
  foreignField: 'category',
});

categorySchema.set('toObject', { virtuals: true });
categorySchema.set('toJSON', { virtuals: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;