// src/components/layout/Header.jsx

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiHeart, FiUser, FiSun, FiMoon, FiSearch } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import useDarkMode from '../../hooks/useDarkMode';
import useAuth from '../../hooks/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { isDark, toggle } = useDarkMode();
  const { user, isAuthenticated } = useAuth();
  const cartCount = useSelector((state) => state.cart.totalItems);
  const wishlistCount = useSelector((state) => state.wishlist.products.length);

  const navigate = useNavigate();
const [searchQuery, setSearchQuery] = useState('');

const handleSearch = (e) => {
  e.preventDefault();
  if (searchQuery.trim()) {
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }
};

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-extrabold text-primary-600">Grocery</span>
            <span className="hidden xs:inline text-xs font-semibold bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full">
              10 min
            </span>
          </Link>

          {/* Search bar (visual placeholder — functional search wired later) */}
       <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search for fruits, vegetables, snacks..."
    className="input-field pl-10"
  />
</form>

          {/* Right icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggle}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </motion.button>

            <Link
              to="/wishlist"
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Wishlist"
            >
              <FiHeart size={20} />
              {wishlistCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Cart"
            >
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || <FiUser size={14} />}
                  </div>
                )}
              </Link>
            ) : (
              <Link to="/login" className="btn-primary text-sm px-3 py-1.5">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;