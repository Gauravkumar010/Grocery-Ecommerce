// src/redux/slices/cartSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import toast from 'react-hot-toast';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/cart');
    return res.data.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/cart/items', { productId, quantity });
      return res.data.data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(`/cart/items/${productId}`, { quantity });
      return res.data.data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update cart item');
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/cart/items/${productId}`);
      return res.data.data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove cart item');
    }
  }
);

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.delete('/cart');
    return res.data.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  couponApplied: null,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartState: () => initialState,
  },
  extraReducers: (builder) => {
    const setCartData = (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.totalItems = action.payload.totalItems || 0;
      state.subtotal = action.payload.subtotal || 0;
      state.couponApplied = action.payload.couponApplied || null;
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, setCartData)
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        setCartData(state, action);
        toast.success('Added to cart');
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload);
      })

      .addCase(updateCartItemQuantity.fulfilled, setCartData)
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        toast.error(action.payload);
      })

      .addCase(removeCartItem.fulfilled, (state, action) => {
        setCartData(state, action);
        toast.success('Item removed from cart');
      })

      .addCase(clearCart.fulfilled, setCartData);
  },
});

export const { resetCartState } = cartSlice.actions;
export default cartSlice.reducer;