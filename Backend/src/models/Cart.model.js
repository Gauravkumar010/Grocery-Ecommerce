// src/models/Cart.model.js

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    priceAtAddition: {
      // snapshot of sellingPrice at the moment this item was added/updated
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one cart document per user
    },
    items: [cartItemSchema],
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================
// INDEXES
// =========================================


// =========================================
// VIRTUALS
// =========================================

/**
 * Total number of individual items (sum of quantities) in the cart.
 * Useful for showing a badge count like "Cart (5)" in the header.
 */
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Subtotal — sum of (priceAtAddition * quantity) across all items,
 * BEFORE any coupon discount is applied.
 */
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.priceAtAddition * item.quantity, 0);
});

cartSchema.set('toObject', { virtuals: true });
cartSchema.set('toJSON', { virtuals: true });

// =========================================
// INSTANCE METHODS
// =========================================

/**
 * Adds a product to the cart, or increments quantity if it already exists.
 * Always refreshes priceAtAddition to the current product price passed in.
 */
cartSchema.methods.addItem = async function (productId, quantity, currentPrice) {
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.priceAtAddition = currentPrice;
  } else {
    this.items.push({
      product: productId,
      quantity,
      priceAtAddition: currentPrice,
    });
  }

  await this.save();
  return this;
};

/**
 * Updates the quantity of a specific item in the cart.
 * If newQuantity is 0 or less, the item is removed entirely.
 */
cartSchema.methods.updateItemQuantity = async function (productId, newQuantity) {
  const item = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (newQuantity <= 0) {
    this.items = this.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );
  } else {
    item.quantity = newQuantity;
  }

  await this.save();
  return this;
};

/**
 * Removes a specific item from the cart entirely.
 */
cartSchema.methods.removeItem = async function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  await this.save();
  return this;
};

/**
 * Empties the entire cart (called after successful checkout).
 */
cartSchema.methods.clearCart = async function () {
  this.items = [];
  this.couponApplied = null;
  await this.save();
  return this;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;