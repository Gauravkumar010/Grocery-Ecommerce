// src/components/product/ProductCard.jsx

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHeart, FiPlus } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { addToCart } from "../../redux/slices/cartSlice";
import { toggleWishlist } from "../../redux/slices/wishlistSlice";
import { formatCurrency } from "../../utils/formatCurrency";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const wishlistProducts = useSelector((state) => state.wishlist.products);

  const isWishlisted = wishlistProducts.some(
    (item) => item.product?._id === product._id,
  );

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please log in to add items to your cart");
      return;
    }
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please log in to use your wishlist");
      return;
    }
    dispatch(toggleWishlist(product._id));
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        to={`/products/${product.slug}`}
        className="card p-3 block relative group"
      >
        {/* Wishlist heart */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-sm"
          aria-label="Toggle wishlist"
        >
          <FiHeart
            size={16}
            className={
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
            }
          />
        </button>

        {/* Discount badge */}
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {product.discountPercent}% OFF
          </span>
        )}

        {/* Image */}
        <div className="w-full aspect-square mb-3 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
          <img
            src={product.images?.[0]?.url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mb-2">
          {product.unitValue} {product.unit}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(product.sellingPrice)}
          </span>
          {product.mrp > product.sellingPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(product.mrp)}
            </span>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.isInStock}
          className="btn-primary w-full text-sm py-1.5 flex items-center justify-center gap-1 disabled:opacity-50"
        >
          {product.isInStock ? (
            <>
              <FiPlus size={14} /> Add
            </>
          ) : (
            "Out of Stock"
          )}
        </button>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
