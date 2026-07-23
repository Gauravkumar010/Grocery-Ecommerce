// src/pages/admin/Dashboard.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiShoppingBag, FiDollarSign, FiUsers, FiBox, FiAlertTriangle } from 'react-icons/fi';
import adminService from '../../services/adminService';
import StatsCard from '../../components/admin/StatsCard';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getOverview(),
      adminService.getSalesChart(14),
      adminService.getLowStock(),
      adminService.getRecentOrders(5),
    ])
      .then(([ov, sales, low, recent]) => {
        setOverview(ov);
        setSalesData(sales.map((d) => ({ date: d._id.slice(5), revenue: d.revenue })));
        setLowStock(low);
        setRecentOrders(recent);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={FiShoppingBag} label="Total Orders" value={overview.totalOrders} accent="primary" />
        <StatsCard icon={FiDollarSign} label="Total Revenue" value={formatCurrency(overview.totalRevenue)} accent="accent" />
        <StatsCard icon={FiUsers} label="Customers" value={overview.totalCustomers} accent="blue" />
        <StatsCard icon={FiBox} label="Products" value={overview.totalProducts} accent="primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Revenue (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertTriangle className="text-accent-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Low Stock Alerts</h3>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">All products well-stocked 🎉</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 6).map((p) => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                  <Badge variant="red">{p.stock} left</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Recent Orders</h3>
          <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <th className="pb-2">Order</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id} className="border-b border-gray-50 dark:border-gray-800/50">
                  <td className="py-3 font-medium text-gray-800 dark:text-gray-100">{order.orderNumber}</td>
                  <td className="py-3 text-gray-500">{order.user?.name}</td>
                  <td className="py-3">{formatCurrency(order.totalAmount)}</td>
                  <td className="py-3">
                    <Badge variant={order.orderStatus === 'delivered' ? 'green' : 'gray'}>
                      {order.orderStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;