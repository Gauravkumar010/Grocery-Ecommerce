// src/redux/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../services/axiosInstance';
import toast from 'react-hot-toast';

// =========================================
// ASYNC THUNKS
// =========================================

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, phone }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/register', { name, email, password, phone });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.post('/auth/logout');
    return true;
  } catch (err) {
    // Even if the API call fails, we still want to clear local state,
    // so we don't reject here — just proceed with client-side logout.
    return true;
  }
});

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/auth/me');
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ name, phone }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch('/users/profile', { name, phone });
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateAvatar = createAsyncThunk(
  'auth/updateAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axiosInstance.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update avatar');
    }
  }
);

// =========================================
// INITIAL STATE
// Read persisted user/token from localStorage on app load, so a
// page refresh doesn't log the user out.
// =========================================
const persistedUser = (() => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const initialState = {
  user: persistedUser,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
};

// =========================================
// SLICE
// =========================================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---------- REGISTER ----------
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        toast.success('Account created successfully!');
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // ---------- LOGIN ----------
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        toast.success(`Welcome back, ${action.payload.user.name}!`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // ---------- LOGOUT ----------
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
      })

      // ---------- FETCH CURRENT USER ----------
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        // Token invalid/expired — clear everything
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      })

      // ---------- UPDATE PROFILE ----------
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
        toast.success('Profile updated successfully');
      })
      .addCase(updateProfile.rejected, (state, action) => {
        toast.error(action.payload);
      })

      // ---------- UPDATE AVATAR ----------
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
        toast.success('Avatar updated successfully');
      })
      .addCase(updateAvatar.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;