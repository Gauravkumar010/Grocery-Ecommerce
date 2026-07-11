// src/models/Wishlist.model.js

const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one wishlist document per user
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// =========================================
// VIRTUALS
// =========================================
wishlistSchema.virtual('totalItems').get(function () {
  return this.products.length;
});

wishlistSchema.set('toObject', { virtuals: true });
wishlistSchema.set('toJSON', { virtuals: true });

// =========================================
// INSTANCE METHODS
// =========================================

/**
 * Adds a product to the wishlist if not already present.
 * Silently does nothing if the product is already wishlisted
 * (idempotent — safe to call repeatedly, e.g., from a toggle button).
 */
wishlistSchema.methods.addProduct = async function (productId) {
  const alreadyExists = this.products.some(
    (item) => item.product.toString() === productId.toString()
  );

  if (!alreadyExists) {
    this.products.push({ product: productId });
    await this.save();
  }

  return this;
};

/**
 * Removes a product from the wishlist.
 */
wishlistSchema.methods.removeProduct = async function (productId) {
  this.products = this.products.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  await this.save();
  return this;
};

/**
 * Toggles a product — adds it if absent, removes it if present.
 * Returns 'added' or 'removed' so the controller can respond appropriately.
 */
wishlistSchema.methods.toggleProduct = async function (productId) {
  const existingIndex = this.products.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingIndex > -1) {
    this.products.splice(existingIndex, 1);
    await this.save();
    return 'removed';
  } else {
    this.products.push({ product: productId });
    await this.save();
    return 'added';
  }
};

/**
 * Checks whether a specific product is in the wishlist.
 */
wishlistSchema.methods.hasProduct = function (productId) {
  return this.products.some(
    (item) => item.product.toString() === productId.toString()
  );
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;