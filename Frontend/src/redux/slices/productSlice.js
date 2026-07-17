// src/redux/slices/productSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';

export const fetchProducts = createAsyncThunk(
  'product/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/products', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductBySlug = createAsyncThunk(
  'product/fetchBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/products/${slug}`);
      return res.data.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Product not found');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'product/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/categories');
      return res.data.data.categories;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

const initialState = {
  products: [],
  pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
  currentProduct: null,
  categories: [],
  loading: false,
  productLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProductBySlug.pending, (state) => {
        state.productLoading = true;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.productLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.productLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const { clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;