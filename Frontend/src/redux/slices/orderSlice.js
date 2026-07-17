// src/redux/slices/orderSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import toast from 'react-hot-toast';

export const placeCodOrder = createAsyncThunk(
  'order/placeCod',
  async (addressId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/orders/cod', { addressId });
      return res.data.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to place order');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'order/fetchMy',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/orders', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderByNumber = createAsyncThunk(
  'order/fetchByNumber',
  async (orderNumber, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/orders/${orderNumber}`);
      return res.data.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Order not found');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'order/cancel',
  async ({ orderNumber, reason }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(`/orders/${orderNumber}/cancel`, { reason });
      return res.data.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel order');
    }
  }
);

const initialState = {
  orders: [],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  currentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeCodOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(placeCodOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        toast.success('Order placed successfully!');
      })
      .addCase(placeCodOrder.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload);
      })

      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOrderByNumber.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })

      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        const idx = state.orders.findIndex((o) => o.orderNumber === action.payload.orderNumber);
        if (idx !== -1) state.orders[idx] = action.payload;
        toast.success('Order cancelled successfully');
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;