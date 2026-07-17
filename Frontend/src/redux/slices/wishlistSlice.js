// src/redux/slices/wishlistSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import toast from 'react-hot-toast';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/wishlist');
    return res.data.data.wishlist;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch wishlist');
  }
});

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggle',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/wishlist/toggle', { productId });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update wishlist');
    }
  }
);

const initialState = {
  products: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    resetWishlistState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.products = action.payload.wishlist.products || [];
        toast.success(
          action.payload.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist'
        );
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { resetWishlistState } = wishlistSlice.actions;
export default wishlistSlice.reducer;