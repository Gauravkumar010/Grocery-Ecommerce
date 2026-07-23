// src/pages/admin/Orders.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_BADGE_VARIANT = {
  pending: 'gray', confirmed: 'primary', processing: 'accent',
  out_for_delivery: 'accent', delivered: 'green', cancelled: 'red',
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = () => {
    setLoading(true);
    adminService.getAllOrders({ status: statusFilter || undefined, limit: 100 }).then((data) => {
      setOrders(data.orders);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderNumber, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderNumber, newStatus, `Status updated to ${newStatus}`);
      toast.success('Order status updated');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order',
      render: (row) => (
        <Link to={`/orders/${row.orderNumber}`} target="_blank" className="font-medium text-primary-600 hover:underline">
          {row.orderNumber}
        </Link>
      ),
    },
    { key: 'customer', label: 'Customer', render: (row) => row.user?.name || '—' },
    { key: 'totalAmount', label: 'Total', render: (row) => formatCurrency(row.totalAmount) },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (row) => <Badge variant={row.paymentStatus === 'paid' ? 'green' : 'gray'}>{row.paymentStatus}</Badge>,
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (row) => (
        <select
          value={row.orderStatus}
          onChange={(e) => handleStatusChange(row.orderNumber, e.target.value)}
          className="input-field text-xs py-1.5 w-auto"
          disabled={row.orderStatus === 'cancelled'}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-IN'),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto text-sm py-2">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card p-6">
        <DataTable columns={columns} data={orders} loading={loading} emptyMessage="No orders found" />
      </div>
    </div>
  );
};

export default Orders;