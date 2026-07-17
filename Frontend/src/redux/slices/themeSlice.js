// src/redux/slices/themeSlice.js

import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;
  // Fall back to OS preference if no explicit choice saved yet
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialState = {
  mode: getInitialTheme(), // 'light' | 'dark'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('theme', action.payload);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;