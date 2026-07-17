// src/pages/Home.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';

const Home = () => {
  const dispatch = useDispatch();
  const { products, categories, loading } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 12, sort: 'newest' }));
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Shop by Category</h2>
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {categories.map((category) => (
            <Link
              key={category._id}
              to={`/category/${category.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 group-hover:ring-2 ring-primary-500 transition-all">
                <img
                  src={category.image?.url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs text-center text-gray-700 dark:text-gray-300 line-clamp-2">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Fresh Picks for You
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>

        {!loading && products.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            No products available yet. Check back soon!
          </p>
        )}
      </section>
    </div>
  );
};

export default Home;