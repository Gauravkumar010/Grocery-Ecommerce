// src/controllers/admin.controller.js

const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const User = require('../models/User.model');
const Review = require('../models/Review.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

// =========================================
// @desc    Get dashboard overview stats (cards at top of admin dashboard)
// @route   GET /api/v1/admin/dashboard/overview
// @access  Private/Admin
// =========================================
const getDashboardOverview = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    totalRevenue,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockCount,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed', 'processing'] } }),
    Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockCount,
      },
      'Dashboard overview fetched successfully'
    )
  );
});

// =========================================
// @desc    Get sales data grouped by day for a chart (last N days)
// @route   GET /api/v1/admin/dashboard/sales-chart?days=30
// @access  Private/Admin
// =========================================
const getSalesChart = asyncHandler(async (req, res) => {
  const days = Math.min(90, parseInt(req.query.days) || 30);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        paymentStatus: 'paid',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { salesData }, 'Sales chart data fetched successfully'));
});

// =========================================
// @desc    Get top-selling products (by quantity sold)
// @route   GET /api/v1/admin/dashboard/top-products?limit=10
// @access  Private/Admin
// =========================================
const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 10);

  const topProducts = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        totalQuantitySold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: limit },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { topProducts }, 'Top products fetched successfully'));
});

// =========================================
// @desc    Get products with low stock (for inventory alerts)
// @route   GET /api/v1/admin/dashboard/low-stock
// @access  Private/Admin
// =========================================
const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    isActive: true,
  })
    .select('name slug stock lowStockThreshold images')
    .sort({ stock: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { products }, 'Low stock products fetched successfully'));
});

// =========================================
// @desc    Get most recent orders (for dashboard activity feed)
// @route   GET /api/v1/admin/dashboard/recent-orders?limit=10
// @access  Private/Admin
// =========================================
const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 10);

  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('orderNumber user totalAmount orderStatus paymentStatus createdAt');

  return res.status(200).json(new ApiResponse(200, { orders }, 'Recent orders fetched successfully'));
});

// =========================================
// @desc    Get customer growth data (new signups per day, last N days)
// @route   GET /api/v1/admin/dashboard/customer-growth?days=30
// @access  Private/Admin
// =========================================
const getCustomerGrowth = asyncHandler(async (req, res) => {
  const days = Math.min(90, parseInt(req.query.days) || 30);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const growthData = await User.aggregate([
    { $match: { createdAt: { $gte: startDate }, role: 'user' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        newCustomers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { growthData }, 'Customer growth data fetched successfully'));
});

// =========================================
// @desc    Get order status breakdown (for a pie/donut chart)
// @route   GET /api/v1/admin/dashboard/order-status-breakdown
// @access  Private/Admin
// =========================================
const getOrderStatusBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { breakdown }, 'Order status breakdown fetched successfully'));
});

module.exports = {
  getDashboardOverview,
  getSalesChart,
  getTopProducts,
  getLowStockProducts,
  getRecentOrders,
  getCustomerGrowth,
  getOrderStatusBreakdown,
};