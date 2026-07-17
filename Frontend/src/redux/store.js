// src/redux/store.js

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    product: productReducer,
    order: orderReducer,
    theme: themeReducer,
  },
  // Redux Toolkit's default middleware already includes helpful checks
  // (serializable state, immutable state) — we keep those enabled in
  // development for safety, no custom middleware needed yet.
  devTools: import.meta.env.MODE !== 'production',
});

export default store;