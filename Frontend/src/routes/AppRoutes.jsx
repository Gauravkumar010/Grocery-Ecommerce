// src/routes/AppRoutes.jsx

import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import Home from "../pages/Home";
import ProductDetails from "../pages/ProductDetails";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Checkout from "../pages/Checkout";
import OrderTracking from '../pages/OrderTracking';
import Orders from '../pages/Orders';
import Profile from '../pages/Profile';
import Addresses from '../pages/Addresses';
import SearchResults from '../pages/SearchResults';
import CategoryPage from '../pages/CategoryPage';
import AdminLayout from '../layouts/AdminLayout';
import AdminRoute from './AdminRoute';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import ProductForm from '../pages/admin/ProductForm';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/Orders';
import AdminCustomers from '../pages/admin/Customers';
import AdminCoupons from '../pages/admin/Coupons';
import AdminBanners from '../pages/admin/Banners';

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
       <Route path="/category/:slug" element={<CategoryPage />} />
       <Route path="/search" element={<SearchResults />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
       <Route path="/orders/:orderNumber" element={<OrderTracking />} />
        <Route path="/profile" element={<Profile />} />
         <Route path="/addresses" element={<Addresses />} />
        <Route
          path="*"
          element={<Placeholder title="404 - Page Not Found" />}
        />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/forgot-password"
          element={<Placeholder title="Forgot Password" />}
        />
      </Route>

     <Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
  <Route index element={<AdminDashboard />} />
  <Route path="products" element={<AdminProducts />} />
<Route path="products/new" element={<ProductForm />} />
<Route path="products/edit/:id" element={<ProductForm />} />
 <Route path="categories" element={<AdminCategories />} />
<Route path="orders" element={<AdminOrders />} />
<Route path="customers" element={<AdminCustomers />} />
 <Route path="coupons" element={<AdminCoupons />} />
<Route path="banners" element={<AdminBanners />} />
  <Route path="analytics" element={<Placeholder title="Analytics" />} />
</Route>

    </Routes>
  );
}

export default AppRoutes;
