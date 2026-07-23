// src/pages/CategoryPage.jsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../redux/slices/productSlice';
import productService from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import ProductFilter from '../components/product/ProductFilter';
import ProductSort from '../components/product/ProductSort';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { FiBox } from 'react-icons/fi';

const CategoryPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.product);

  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', inStock: false });

  useEffect(() => {
    productService.getCategoryBySlug(slug).then(setCategory).catch(() => setCategory(null));
  }, [slug]);

  useEffect(() => {
    if (!category?._id) return;
    dispatch(
      fetchProducts({
        category: category._id,
        sort,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        inStock: filters.inStock || undefined,
        limit: 24,
      })
    );
  }, [dispatch, category, sort, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {category?.name || 'Category'}
        </h1>
        <ProductSort value={sort} onChange={setSort} />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <ProductFilter filters={filters} onChange={setFilters} />
        </div>

        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState icon={<FiBox />} title="No products in this category yet" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;