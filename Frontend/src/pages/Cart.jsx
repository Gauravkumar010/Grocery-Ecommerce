// src/pages/Cart.jsx

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart } from 'react-icons/fi';
import { fetchCart } from '../redux/slices/cartSlice';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';

const Cart = () => {
  const dispatch = useDispatch();
  const { items, subtotal, totalItems, loading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<FiShoppingCart />}
        title="Please log in"
        subtitle="Log in to view and manage your cart"
        actionLabel="Log In"
        actionTo="/login"
      />
    );
  }

  if (loading && items.length === 0) {
    return <Loader fullScreen />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FiShoppingCart />}
        title="Your cart is empty"
        subtitle="Looks like you haven't added anything yet. Start shopping!"
        actionLabel="Browse Products"
        actionTo="/"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 card p-6">
          {items.map((item) => (
            <CartItem key={item._id} item={item} />
          ))}
        </div>
        <div>
          <CartSummary subtotal={subtotal} itemCount={totalItems} />
        </div>
      </div>
    </div>
  );
};

export default Cart;