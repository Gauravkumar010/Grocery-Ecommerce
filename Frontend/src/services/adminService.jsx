// src/services/adminService.js

import axiosInstance from './axiosInstance';

const adminService = {
  // Dashboard
  getOverview: () => axiosInstance.get('/admin/dashboard/overview').then((r) => r.data.data),
  getSalesChart: (days = 30) =>
    axiosInstance.get('/admin/dashboard/sales-chart', { params: { days } }).then((r) => r.data.data.salesData),
  getTopProducts: (limit = 10) =>
    axiosInstance.get('/admin/dashboard/top-products', { params: { limit } }).then((r) => r.data.data.topProducts),
  getLowStock: () => axiosInstance.get('/admin/dashboard/low-stock').then((r) => r.data.data.products),
  getRecentOrders: (limit = 10) =>
    axiosInstance.get('/admin/dashboard/recent-orders', { params: { limit } }).then((r) => r.data.data.orders),
  getOrderStatusBreakdown: () =>
    axiosInstance.get('/admin/dashboard/order-status-breakdown').then((r) => r.data.data.breakdown),

  // Products
  getProducts: (params) => axiosInstance.get('/products/admin', { params }).then((r) => r.data.data),
  createProduct: (formData) =>
    axiosInstance.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.product),
  updateProduct: (id, formData) =>
    axiosInstance.patch(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.product),
  deleteProduct: (id) => axiosInstance.delete(`/products/${id}`),
  removeProductImage: (id, publicId) =>
    axiosInstance.delete(`/products/${id}/images/${encodeURIComponent(publicId)}`),

  // Categories
  getCategoriesAdmin: () => axiosInstance.get('/categories/admin').then((r) => r.data.data.categories),
  createCategory: (formData) =>
    axiosInstance.post('/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.category),
  updateCategory: (id, formData) =>
    axiosInstance.patch(`/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.category),
  deleteCategory: (id) => axiosInstance.delete(`/categories/${id}`),

  // SubCategories
  getSubCategoriesAdmin: () => axiosInstance.get('/subcategories/admin').then((r) => r.data.data.subCategories),
  createSubCategory: (formData) =>
    axiosInstance.post('/subcategories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.subCategory),
  updateSubCategory: (id, formData) =>
    axiosInstance.patch(`/subcategories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.subCategory),
  deleteSubCategory: (id) => axiosInstance.delete(`/subcategories/${id}`),

  // Orders
  getAllOrders: (params) => axiosInstance.get('/orders/admin/all', { params }).then((r) => r.data.data),
  updateOrderStatus: (orderNumber, status, note) =>
    axiosInstance.patch(`/orders/admin/${orderNumber}/status`, { status, note }).then((r) => r.data.data.order),

  // Customers
  getUsers: (params) => axiosInstance.get('/users', { params }).then((r) => r.data.data),
  toggleUserStatus: (id) => axiosInstance.patch(`/users/${id}/toggle-status`).then((r) => r.data.data.user),

  // Coupons
  getCouponsAdmin: () => axiosInstance.get('/coupons/admin').then((r) => r.data.data.coupons),
  createCoupon: (data) => axiosInstance.post('/coupons', data).then((r) => r.data.data.coupon),
  updateCoupon: (id, data) => axiosInstance.patch(`/coupons/${id}`, data).then((r) => r.data.data.coupon),
  deleteCoupon: (id) => axiosInstance.delete(`/coupons/${id}`),

  // Banners
  getBannersAdmin: () => axiosInstance.get('/banners/admin').then((r) => r.data.data.banners),
  createBanner: (formData) =>
    axiosInstance.post('/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.banner),
  updateBanner: (id, formData) =>
    axiosInstance.patch(`/banners/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.banner),
  deleteBanner: (id) => axiosInstance.delete(`/banners/${id}`),
};

export default adminService;