// src/pages/admin/Products.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = () => {
    setLoading(true);
    adminService.getProducts({ limit: 100 }).then((data) => {
      setProducts(data.products);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteProduct(id);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.images?.[0]?.url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
          <span className="font-medium text-gray-800 dark:text-gray-100">{row.name}</span>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (row) => row.category?.name || '—' },
    { key: 'sellingPrice', label: 'Price', render: (row) => formatCurrency(row.sellingPrice) },
    {
      key: 'stock',
      label: 'Stock',
      render: (row) => <Badge variant={row.stock <= row.lowStockThreshold ? 'red' : 'green'}>{row.stock}</Badge>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => <Badge variant={row.isActive ? 'green' : 'gray'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Link to={`/admin/products/edit/${row._id}`} className="p-2 text-gray-500 hover:text-primary-600">
            <FiEdit2 size={16} />
          </Link>
          <button onClick={() => handleDelete(row._id, row.name)} className="p-2 text-gray-500 hover:text-red-600">
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <Link to="/admin/products/new" className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
          <FiPlus size={16} /> Add Product
        </Link>
      </div>

      <div className="card p-6">
        <DataTable columns={columns} data={products} loading={loading} emptyMessage="No products yet" />
      </div>
    </div>
  );
};

export default Products;