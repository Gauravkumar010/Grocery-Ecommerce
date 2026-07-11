// src/routes/category.routes.js

const express = require('express');
const {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { uploadSingleImage } = require('../middlewares/multer.middleware');

const router = express.Router();

// =========================================
// PUBLIC ROUTES
// =========================================
router.get('/', getAllCategories);
router.get('/admin', protect, isAdmin, getAllCategoriesAdmin); // must come before /:slug
router.get('/:slug', getCategoryBySlug);

// =========================================
// ADMIN-ONLY ROUTES
// =========================================
router.post('/', protect, isAdmin, uploadSingleImage('image'), createCategory);
router.patch('/:id', protect, isAdmin, uploadSingleImage('image'), updateCategory);
router.delete('/:id', protect, isAdmin, deleteCategory);

module.exports = router;