// src/controllers/wishlist.controller.js

const Wishlist = require('../models/Wishlist.model');
const Product = require('../models/Product.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * Finds the user's wishlist, creating an empty one if it doesn't exist yet.
 */
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

// =========================================
// @desc    Get logged-in user's wishlist (populated with product details)
// @route   GET /api/v1/wishlist
// @access  Private
// =========================================
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  await wishlist.populate(
    'products.product',
    'name slug images sellingPrice mrp discountPercent isInStock ratings'
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { wishlist }, 'Wishlist fetched successfully'));
});

// =========================================
// @desc    Toggle a product in the wishlist (add if absent, remove if present)
// @route   POST /api/v1/wishlist/toggle
// @access  Private
// =========================================
const toggleWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    throw ApiError.badRequest('productId is required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const wishlist = await getOrCreateWishlist(req.user._id);
  const action = await wishlist.toggleProduct(productId);
  await wishlist.populate(
    'products.product',
    'name slug images sellingPrice mrp discountPercent isInStock ratings'
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { wishlist, action },
        action === 'added' ? 'Product added to wishlist' : 'Product removed from wishlist'
      )
    );
});

// =========================================
// @desc    Check if a specific product is in the user's wishlist
// @route   GET /api/v1/wishlist/check/:productId
// @access  Private
// =========================================
const checkWishlistStatus = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  const isWishlisted = wishlist.hasProduct(req.params.productId);

  return res
    .status(200)
    .json(new ApiResponse(200, { isWishlisted }, 'Wishlist status checked'));
});

// =========================================
// @desc    Remove a specific product from the wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
// =========================================
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  await wishlist.removeProduct(req.params.productId);
  await wishlist.populate(
    'products.product',
    'name slug images sellingPrice mrp discountPercent isInStock ratings'
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { wishlist }, 'Product removed from wishlist'));
});

module.exports = {
  getWishlist,
  toggleWishlistItem,
  checkWishlistStatus,
  removeFromWishlist,
};