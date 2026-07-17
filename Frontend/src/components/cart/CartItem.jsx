// src/components/cart/CartItem.jsx

import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { updateCartItemQuantity, removeCartItem } from '../../redux/slices/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';

const CartItem = ({ item }) => {
  const dispatch = useDispatch();
  const product = item.product;

  if (!product) return null; // handles stale cart items referencing deleted products

  const handleQuantityChange = (newQty) => {
    if (newQty < 1) return;
    dispatch(updateCartItemQuantity({ productId: product._id, quantity: newQty }));
  };

  const handleRemove = () => {
    dispatch(removeCartItem(product._id));
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800">
      <Link to={`/products/${product.slug}`} className="shrink-0">
        <img
          src={product.images?.[0]?.url}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover bg-gray-50 dark:bg-gray-800"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${product.slug}`}
          className="font-medium text-gray-800 dark:text-gray-100 line-clamp-1 hover:text-primary-600"
        >
          {product.name}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">
          {product.unitValue} {product.unit}
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
          {formatCurrency(item.priceAtAddition)}
        </p>
      </div>

      <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shrink-0">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FiMinus size={14} />
        </button>
        <span className="px-3 text-sm font-semibold">{item.quantity}</span>
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= product.stock}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
        >
          <FiPlus size={14} />
        </button>
      </div>

      <button
        onClick={handleRemove}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        aria-label="Remove item"
      >
        <FiTrash2 size={18} />
      </button>
    </div>
  );
};

export default CartItem;