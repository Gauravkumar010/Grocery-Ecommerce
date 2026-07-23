// src/layouts/AdminLayout.jsx

import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  FiGrid, FiBox, FiList, FiShoppingBag, FiUsers, FiTag, FiImage, FiBarChart2, FiLogOut,
} from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: FiGrid },
  { label: 'Products', path: '/admin/products', icon: FiBox },
  { label: 'Categories', path: '/admin/categories', icon: FiList },
  { label: 'Orders', path: '/admin/orders', icon: FiShoppingBag },
  { label: 'Customers', path: '/admin/customers', icon: FiUsers },
  { label: 'Coupons', path: '/admin/coupons', icon: FiTag },
  { label: 'Banners', path: '/admin/banners', icon: FiImage },
  { label: 'Analytics', path: '/admin/analytics', icon: FiBarChart2 },
];

const AdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-surface dark:bg-surface-dark">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <span className="text-xl font-extrabold text-primary-600">Grocery Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                {user?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <FiLogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;