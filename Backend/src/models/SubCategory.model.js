// src/models/SubCategory.model.js

const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
      minlength: [2, 'Subcategory name must be at least 2 characters'],
      maxlength: [50, 'Subcategory name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Parent category is required'],
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
        required: [true, 'Subcategory image is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Subcategory image publicId is required'],
      },
    },
    displayOrder: {
      type: Number,
      default: 0,
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
// Compound index: a subcategory name should be unique WITHIN a category
// (e.g., "Fresh Fruits" can't repeat under the same category, but
// "Fresh Fruits" under "Fruits & Vegetables" and a different subcategory
// under "Snacks" are fine)
subCategorySchema.index({ name: 1, category: 1 }, { unique: true });
subCategorySchema.index({ category: 1 });
subCategorySchema.index({ isActive: 1 });

// =========================================
// MIDDLEWARE
// =========================================
subCategorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }
});

// =========================================
// VIRTUALS
// =========================================

/**
 * Virtual population: lets us do SubCategory.find().populate('products')
 * to get all products belonging to this subcategory.
 */
subCategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'subCategory',
});

subCategorySchema.set('toObject', { virtuals: true });
subCategorySchema.set('toJSON', { virtuals: true });

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategory;