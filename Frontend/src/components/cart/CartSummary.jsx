// src/components/cart/CartSummary.jsx

import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';

const DELIVERY_FEE = 20;

const CartSummary = ({ subtotal, itemCount }) => {
  const navigate = useNavigate();
  const total = subtotal + DELIVERY_FEE;

  return (
    <div className="card p-6 sticky top-24">
      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Order Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Delivery Fee</span>
          <span>{formatCurrency(DELIVERY_FEE)}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 flex justify-between font-bold text-gray-900 dark:text-white">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        disabled={itemCount === 0}
        className="btn-primary w-full mt-6 py-3 disabled:opacity-50"
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CartSummary;