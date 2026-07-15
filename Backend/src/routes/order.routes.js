// src/routes/order.routes.js

const express = require('express');
const {
  placeCodOrder,
  getMyOrders,
  getOrderByNumber,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

const router = express.Router();

router.use(protect);

// =========================================
// ADMIN ROUTES (must come before /:orderNumber)
// =========================================
router.get('/admin/all', isAdmin, getAllOrdersAdmin);
router.patch('/admin/:orderNumber/status', isAdmin, updateOrderStatus);

// =========================================
// USER ROUTES
// =========================================
router.post('/cod', placeCodOrder);
router.get('/', getMyOrders);
router.get('/:orderNumber', getOrderByNumber);
router.patch('/:orderNumber/cancel', cancelOrder);

module.exports = router;