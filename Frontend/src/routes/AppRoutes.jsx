// src/routes/AppRoutes.jsx

import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import Home from '../pages/Home';
import ProductDetails from '../pages/ProductDetails';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Cart from '../pages/Cart';

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center py-24">
    <div className="card p-8 text-center">
      <h1 className="text-2xl font-bold text-primary-600">{title}</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">Page coming soon</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
        <Route path="/category/:slug" element={<Placeholder title="Category" />} />
        <Route path="/search" element={<Placeholder title="Search Results" />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Placeholder title="Wishlist" />} />
        <Route path="/checkout" element={<Placeholder title="Checkout" />} />
        <Route path="/orders" element={<Placeholder title="Orders" />} />
        <Route path="/orders/:orderNumber" element={<Placeholder title="Order Tracking" />} />
        <Route path="/profile" element={<Placeholder title="Profile" />} />
        <Route path="/addresses" element={<Placeholder title="Addresses" />} />
        <Route path="*" element={<Placeholder title="404 - Page Not Found" />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<Placeholder title="Forgot Password" />} />
      </Route>

      <Route path="/admin/*" element={<Placeholder title="Admin Dashboard" />} />
    </Routes>
  );
}

export default AppRoutes;