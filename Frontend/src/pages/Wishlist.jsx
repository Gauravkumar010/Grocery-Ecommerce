// src/pages/Wishlist.jsx

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart } from 'react-icons/fi';
import { fetchWishlist } from '../redux/slices/wishlistSlice';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<FiHeart />}
        title="Please log in"
        subtitle="Log in to view your saved items"
        actionLabel="Log In"
        actionTo="/login"
      />
    );
  }

  if (loading && products.length === 0) {
    return <Loader fullScreen />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<FiHeart />}
        title="Your wishlist is empty"
        subtitle="Save items you love by tapping the heart icon on any product"
        actionLabel="Browse Products"
        actionTo="/"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Wishlist</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.map(
          (item) => item.product && <ProductCard key={item.product._id} product={item.product} />
        )}
      </div>
    </div>
  );
};

export default Wishlist;