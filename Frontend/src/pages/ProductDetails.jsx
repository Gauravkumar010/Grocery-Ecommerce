// src/pages/ProductDetails.jsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiHeart, FiMinus, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { fetchProductBySlug, clearCurrentProduct } from '../redux/slices/productSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import { formatCurrency } from '../utils/formatCurrency';
import Loader from '../components/common/Loader';
import Badge from '../components/common/Badge';

const ProductDetails = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentProduct: product, productLoading } = useSelector((state) => state.product);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const wishlistProducts = useSelector((state) => state.wishlist.products);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    return () => dispatch(clearCurrentProduct());
  }, [dispatch, slug]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [product?._id]);

  if (productLoading || !product) {
    return <Loader fullScreen />;
  }

  const isWishlisted = wishlistProducts.some((item) => item.product?._id === product._id);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      return;
    }
    dispatch(addToCart({ productId: product._id, quantity }));
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to use your wishlist');
      return;
    }
    dispatch(toggleWishlist(product._id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Image Gallery */}
        <div>
          <motion.div
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 mb-4"
          >
            <img
              src={product.images?.[activeImage]?.url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          {product.images?.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img.publicId || idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === idx ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category?.name && (
            <Badge variant="primary" className="mb-3">
              {product.category.name}
            </Badge>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {product.name}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {product.unitValue} {product.unit} {product.brand && `· ${product.brand}`}
          </p>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(product.sellingPrice)}
            </span>
            {product.mrp > product.sellingPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatCurrency(product.mrp)}
                </span>
                <Badge variant="accent">{product.discountPercent}% OFF</Badge>
              </>
            )}
          </div>

          <div className="mb-6">
            {product.isInStock ? (
              <Badge variant="green">In Stock</Badge>
            ) : (
              <Badge variant="red">Out of Stock</Badge>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Quantity selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</span>
            <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiMinus size={16} />
              </button>
              <span className="px-4 font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiPlus size={16} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.isInStock}
              className="btn-primary flex-1 py-3 disabled:opacity-50"
            >
              {product.isInStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button
              onClick={handleToggleWishlist}
              className="btn-secondary px-4"
              aria-label="Toggle wishlist"
            >
              <FiHeart
                size={20}
                className={isWishlisted ? 'fill-red-500 text-red-500' : ''}
              />
            </button>
          </div>

          {/* Ratings summary */}
          {product.ratings?.count > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              ⭐ {product.ratings.average.toFixed(1)} ({product.ratings.count} review
              {product.ratings.count !== 1 ? 's' : ''})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;