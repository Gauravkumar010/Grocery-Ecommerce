// src/controllers/cart.controller.js

const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * Finds the user's cart, creating an empty one if it doesn't exist yet.
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// =========================================
// @desc    Get logged-in user's cart (populated with product details)
// @route   GET /api/v1/cart
// @access  Private
// =========================================
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate('items.product', 'name slug images unit unitValue sellingPrice isInStock stock');

  return res.status(200).json(new ApiResponse(200, { cart }, 'Cart fetched successfully'));
});

// =========================================
// @desc    Add an item to the cart
// @route   POST /api/v1/cart/items
// @access  Private
// =========================================
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    throw ApiError.badRequest('productId and a quantity of at least 1 are required');
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw ApiError.notFound('Product not found');
  }

  if (!product.isInStock) {
    throw ApiError.badRequest(`${product.name} is currently out of stock`);
  }

  const cart = await getOrCreateCart(req.user._id);

  // Check combined quantity (existing + new) doesn't exceed available stock
  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  const combinedQuantity = (existingItem ? existingItem.quantity : 0) + Number(quantity);

  if (combinedQuantity > product.stock) {
    throw ApiError.badRequest(
      `Only ${product.stock} units of ${product.name} available. You already have ${existingItem ? existingItem.quantity : 0} in your cart.`
    );
  }

  await cart.addItem(productId, Number(quantity), product.sellingPrice);
  await cart.populate('items.product', 'name slug images unit unitValue sellingPrice isInStock stock');

  return res.status(200).json(new ApiResponse(200, { cart }, 'Item added to cart'));
});

// =========================================
// @desc    Update quantity of an item in the cart
// @route   PATCH /api/v1/cart/items/:productId
// @access  Private
// =========================================
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity < 0) {
    throw ApiError.badRequest('A valid quantity is required');
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  if (!existingItem) {
    throw ApiError.notFound('Item not found in cart');
  }

  if (quantity > 0) {
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }
    if (quantity > product.stock) {
      throw ApiError.badRequest(`Only ${product.stock} units of ${product.name} available`);
    }
  }

  await cart.updateItemQuantity(productId, Number(quantity));
  await cart.populate('items.product', 'name slug images unit unitValue sellingPrice isInStock stock');

  return res.status(200).json(new ApiResponse(200, { cart }, 'Cart updated successfully'));
});

// =========================================
// @desc    Remove an item from the cart
// @route   DELETE /api/v1/cart/items/:productId
// @access  Private
// =========================================
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req.user._id);
  await cart.removeItem(productId);
  await cart.populate('items.product', 'name slug images unit unitValue sellingPrice isInStock stock');

  return res.status(200).json(new ApiResponse(200, { cart }, 'Item removed from cart'));
});

// =========================================
// @desc    Clear the entire cart
// @route   DELETE /api/v1/cart
// @access  Private
// =========================================
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await cart.clearCart();

  return res.status(200).json(new ApiResponse(200, { cart }, 'Cart cleared successfully'));
});

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};