// src/models/Product.model.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: [true, 'Subcategory is required'],
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },

    // -------------------------------------------
    // PRICING
    // -------------------------------------------
    mrp: {
      type: Number,
      required: [true, 'MRP (Maximum Retail Price) is required'],
      min: [0, 'MRP cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
      validate: {
        validator: function (value) {
          // sellingPrice must not exceed mrp
          return value <= this.mrp;
        },
        message: 'Selling price cannot be greater than MRP',
      },
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // -------------------------------------------
    // UNIT / QUANTITY (grocery-specific)
    // -------------------------------------------
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['kg', 'g', 'litre', 'ml', 'piece', 'pack', 'dozen', 'box'],
    },
    unitValue: {
      // e.g., for "500 g" -> unitValue: 500, unit: 'g'
      // for "1 kg" -> unitValue: 1, unit: 'kg'
      type: Number,
      required: [true, 'Unit value is required'],
      min: [0.01, 'Unit value must be greater than 0'],
    },

    // -------------------------------------------
    // IMAGES
    // -------------------------------------------
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],

    // -------------------------------------------
    // INVENTORY
    // -------------------------------------------
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10, // admin gets warned in inventory dashboard below this
    },
    isInStock: {
      type: Boolean,
      default: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // allows multiple docs with no sku without unique conflict
      trim: true,
      uppercase: true,
    },

    // -------------------------------------------
    // RATINGS (aggregated from Review documents)
    // -------------------------------------------
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    // -------------------------------------------
    // FLAGS / MERCHANDISING
    // -------------------------------------------
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true, // admin can deactivate without deleting
    },

    // -------------------------------------------
    // NUTRITIONAL / ADDITIONAL INFO (optional, grocery-relevant)
    // -------------------------------------------
    countryOfOrigin: {
      type: String,
      trim: true,
      default: '',
    },
    shelfLife: {
      type: String,
      trim: true,
      default: '', // e.g., "7 days", "6 months"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// =========================================
// INDEXES
// =========================================
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // full-text search
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ sellingPrice: 1 }); // for price sorting/filtering
productSchema.index({ 'ratings.average': -1 }); // for sorting by top-rated

// =========================================
// MIDDLEWARE
// =========================================

/**
 * Auto-generates slug from name, and auto-calculates discountPercent
 * from mrp/sellingPrice whenever either changes.
 */
productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }

  if (this.isModified('mrp') || this.isModified('sellingPrice')) {
    if (this.mrp > 0) {
      this.discountPercent = Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
    } else {
      this.discountPercent = 0;
    }
  }

  if (this.isModified('stock')) {
    this.isInStock = this.stock > 0;
  }
});

// =========================================
// INSTANCE METHODS
// =========================================

/**
 * Reduces stock by a given quantity (used during order placement).
 * Throws if insufficient stock.
 */
productSchema.methods.reduceStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error(`Insufficient stock for ${this.name}. Available: ${this.stock}`);
  }
  this.stock -= quantity;
  this.isInStock = this.stock > 0;
  await this.save();
};

/**
 * Increases stock by a given quantity (used for order cancellation/return,
 * or admin restocking).
 */
productSchema.methods.increaseStock = async function (quantity) {
  this.stock += quantity;
  this.isInStock = this.stock > 0;
  await this.save();
};

/**
 * Recalculates and updates the average rating + count.
 * Called by the Review controller whenever a review is added/updated/deleted.
 */
productSchema.methods.updateRatings = async function (newAverage, newCount) {
  this.ratings.average = Math.round(newAverage * 10) / 10; // round to 1 decimal
  this.ratings.count = newCount;
  await this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;