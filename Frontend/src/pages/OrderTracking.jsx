// src/pages/OrderTracking.jsx

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheckCircle, FiPackage, FiTruck, FiHome, FiXCircle } from 'react-icons/fi';
import { fetchOrderByNumber, cancelOrder, clearCurrentOrder } from '../redux/slices/orderSlice';
import { formatCurrency } from '../utils/formatCurrency';
import Loader from '../components/common/Loader';
import Badge from '../components/common/Badge';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: FiCheckCircle },
  { key: 'confirmed', label: 'Confirmed', icon: FiCheckCircle },
  { key: 'processing', label: 'Processing', icon: FiPackage },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: FiTruck },
  { key: 'delivered', label: 'Delivered', icon: FiHome },
];

const STATUS_BADGE_VARIANT = {
  pending: 'gray',
  confirmed: 'primary',
  processing: 'accent',
  out_for_delivery: 'accent',
  delivered: 'green',
  cancelled: 'red',
};

const OrderTracking = () => {
  const { orderNumber } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, loading } = useSelector((state) => state.order);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    dispatch(fetchOrderByNumber(orderNumber));
    return () => dispatch(clearCurrentOrder());
  }, [dispatch, orderNumber]);

  if (loading || !order) return <Loader fullScreen />;

  const isCancelled = order.orderStatus === 'cancelled';
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.orderStatus);
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.orderStatus);

  const handleCancel = () => {
    dispatch(cancelOrder({ orderNumber, reason: 'Cancelled by customer' }));
    setShowCancelConfirm(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[order.orderStatus]}>
          {order.orderStatus.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Status Timeline */}
      {!isCancelled ? (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between relative">
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isDone = idx <= currentStepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isDone
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-xs text-center text-gray-600 dark:text-gray-300 max-w-[80px]">
                    {step.label}
                  </span>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${
                        idx < currentStepIndex ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-6 flex items-center gap-3 text-red-600">
          <FiXCircle size={24} />
          <div>
            <p className="font-semibold">Order Cancelled</p>
            {order.cancellationReason && (
              <p className="text-sm text-gray-500">{order.cancellationReason}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Items</h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-gray-50 dark:bg-gray-800" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} × {formatCurrency(item.price)} ({item.unitValue} {item.unit})
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>{formatCurrency(order.itemsSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Delivery Fee</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({order.couponCode})</span>
                <span>-{formatCurrency(order.couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Address & Payment */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Delivery Address</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.addressLine1}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
              {order.shippingAddress.phone}
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Payment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
              Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 capitalize mt-1">
              Status: <Badge variant={order.paymentStatus === 'paid' ? 'green' : 'gray'}>{order.paymentStatus}</Badge>
            </p>
          </div>

          {canCancel && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative card p-6 max-w-sm w-full text-center">
            <h3 className="font-bold text-lg mb-2">Cancel this order?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="btn-secondary flex-1">
                Keep Order
              </button>
              <button onClick={handleCancel} className="btn-primary flex-1 bg-red-600 hover:bg-red-700">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;