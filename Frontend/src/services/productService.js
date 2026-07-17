// src/services/productService.js

import axiosInstance from './axiosInstance';

const productService = {
  getAll: (params = {}) => axiosInstance.get('/products', { params }).then((res) => res.data.data),

  getBySlug: (slug) => axiosInstance.get(`/products/${slug}`).then((res) => res.data.data.product),

  getCategories: () => axiosInstance.get('/categories').then((res) => res.data.data.categories),

  getCategoryBySlug: (slug) =>
    axiosInstance.get(`/categories/${slug}`).then((res) => res.data.data.category),

  getSubCategories: (categoryId) =>
    axiosInstance
      .get('/subcategories', { params: categoryId ? { category: categoryId } : {} })
      .then((res) => res.data.data.subCategories),

  getBanners: (position = 'hero') =>
    axiosInstance.get('/banners', { params: { position } }).then((res) => res.data.data.banners),
};

export default productService;