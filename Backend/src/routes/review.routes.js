// src/routes/review.routes.js

const express = require('express');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  toggleReviewApproval,
} = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { uploadMultipleImages } = require('../middlewares/multer.middleware');

const router = express.Router();

// =========================================
// PUBLIC
// =========================================
router.get('/product/:productId', getProductReviews);

// =========================================
// PRIVATE
// =========================================
router.post('/product/:productId', protect, uploadMultipleImages('images', 3), createReview);
router.get('/my-reviews', protect, getMyReviews);
router.patch('/:id', protect, uploadMultipleImages('images', 3), updateReview);
router.delete('/:id', protect, deleteReview);

// =========================================
// ADMIN
// =========================================
router.patch('/:id/toggle-approval', protect, isAdmin, toggleReviewApproval);

module.exports = router;