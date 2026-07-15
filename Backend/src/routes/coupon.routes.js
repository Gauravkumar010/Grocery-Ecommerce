// src/routes/coupon.routes.js

const express = require('express');
const {
  getAllCouponsAdmin,
  getActiveCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  removeCoupon,
} = require('../controllers/coupon.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

const router = express.Router();

// =========================================
// PUBLIC
// =========================================
router.get('/', getActiveCoupons);

// =========================================
// PRIVATE (logged-in users)
// =========================================
router.post('/apply', protect, applyCoupon);
router.delete('/apply', protect, removeCoupon);

// =========================================
// ADMIN-ONLY
// =========================================
router.get('/admin', protect, isAdmin, getAllCouponsAdmin);
router.post('/', protect, isAdmin, createCoupon);
router.patch('/:id', protect, isAdmin, updateCoupon);
router.delete('/:id', protect, isAdmin, deleteCoupon);

module.exports = router;