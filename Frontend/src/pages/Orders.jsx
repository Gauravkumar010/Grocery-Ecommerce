// src/pages/Orders.jsx

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import { fetchMyOrders } from '../redux/slices/orderSlice';
import { formatCurrency } from '../utils/formatCurrency';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';

const STATUS_BADGE_VARIANT = {
  pending: 'gray',
  confirmed: 'primary',
  processing: 'accent',
  out_for_delivery: 'accent',
  delivered: 'green',
  cancelled: 'red',
};

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.order);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyOrders());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<FiPackage />}
        title="Please log in"
        subtitle="Log in to view your order history"
        actionLabel="Log In"
        actionTo="/login"
      />
    );
  }

  if (loading && orders.length === 0) {
    return <Loader fullScreen />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<FiPackage />}
        title="No orders yet"
        subtitle="When you place an order, it will appear here"
        actionLabel="Start Shopping"
        actionTo="/"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order._id}
            to={`/orders/${order.orderNumber}`}
            className="card p-5 flex items-center justify-between hover:shadow-card-hover transition-shadow"
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {order.orderNumber}
                </span>
                <Badge variant={STATUS_BADGE_VARIANT[order.orderStatus]}>
                  {order.orderStatus.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                · {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} ·{' '}
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
            <FiChevronRight className="text-gray-400" size={20} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Orders;