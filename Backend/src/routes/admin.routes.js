// src/routes/admin.routes.js

const express = require('express');
const {
  getDashboardOverview,
  getSalesChart,
  getTopProducts,
  getLowStockProducts,
  getRecentOrders,
  getCustomerGrowth,
  getOrderStatusBreakdown,
} = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');

const router = express.Router();

router.use(protect, isAdmin);

router.get('/dashboard/overview', getDashboardOverview);
router.get('/dashboard/sales-chart', getSalesChart);
router.get('/dashboard/top-products', getTopProducts);
router.get('/dashboard/low-stock', getLowStockProducts);
router.get('/dashboard/recent-orders', getRecentOrders);
router.get('/dashboard/customer-growth', getCustomerGrowth);
router.get('/dashboard/order-status-breakdown', getOrderStatusBreakdown);

module.exports = router;