// src/routes/subcategory.routes.js

const express = require('express');
const {
  getAllSubCategories,
  getAllSubCategoriesAdmin,
  getSubCategoryBySlug,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require('../controllers/subcategory.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { uploadSingleImage } = require('../middlewares/multer.middleware');

const router = express.Router();

// =========================================
// PUBLIC ROUTES
// =========================================
router.get('/', getAllSubCategories);
router.get('/admin', protect, isAdmin, getAllSubCategoriesAdmin); // before /:slug
router.get('/:slug', getSubCategoryBySlug);

// =========================================
// ADMIN-ONLY ROUTES
// =========================================
router.post('/', protect, isAdmin, uploadSingleImage('image'), createSubCategory);
router.patch('/:id', protect, isAdmin, uploadSingleImage('image'), updateSubCategory);
router.delete('/:id', protect, isAdmin, deleteSubCategory);

module.exports = router;