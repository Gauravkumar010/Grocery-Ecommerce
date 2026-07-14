// src/routes/product.routes.js

const express = require('express');
const {
  getAllProducts,
  getAllProductsAdmin,
  getProductBySlug,
  createProduct,
  updateProduct,
  removeProductImage,
  deleteProduct,
} = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { uploadMultipleImages } = require('../middlewares/multer.middleware');

const router = express.Router();

// =========================================
// PUBLIC ROUTES
// =========================================
router.get('/', getAllProducts);
router.get('/admin', protect, isAdmin, getAllProductsAdmin); // before /:slug
router.get('/:slug', getProductBySlug);

// =========================================
// ADMIN-ONLY ROUTES
// =========================================
router.post('/', protect, isAdmin, uploadMultipleImages('images', 5), createProduct);
router.patch('/:id', protect, isAdmin, uploadMultipleImages('images', 5), updateProduct);
router.delete('/:id/images/:publicId', protect, isAdmin, removeProductImage);
router.delete('/:id', protect, isAdmin, deleteProduct);

module.exports = router;