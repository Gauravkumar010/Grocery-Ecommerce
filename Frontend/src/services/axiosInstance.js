// src/services/axiosInstance.js

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly cookies (refreshToken) with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========================================
// REQUEST INTERCEPTOR
// Automatically attach the JWT access token (from localStorage)
// to every outgoing request's Authorization header.
// =========================================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================
// RESPONSE INTERCEPTOR
// Globally handle common error scenarios — e.g., if the token is
// invalid/expired (401), clear stored auth state so the UI can
// redirect to login. We keep this simple for now (no silent
// refresh-token retry loop yet — can be added later if needed).
// =========================================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Note: we don't force a hard redirect here — components/pages
      // reading auth state from Redux will naturally show the logged-out
      // UI once the store is updated. Actual redirect logic lives in
      // ProtectedRoute (built later).
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;