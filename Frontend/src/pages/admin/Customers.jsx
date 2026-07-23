// src/pages/admin/Customers.jsx

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';

const Customers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = () => {
    setLoading(true);
    adminService.getUsers({ search: search || undefined, limit: 100 }).then((data) => {
      setUsers(data.users);
      setLoading(false);
    });
  };

  useEffect(() => {
    const timer = setTimeout(loadUsers, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleStatus = async (id) => {
    try {
      await adminService.toggleUserStatus(id);
      toast.success('Customer status updated');
      loadUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar?.url ? (
            <img src={row.avatar.url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
              {row.name?.[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-medium text-gray-800 dark:text-gray-100">{row.name}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'isEmailVerified',
      label: 'Verified',
      render: (row) => <Badge variant={row.isEmailVerified ? 'green' : 'gray'}>{row.isEmailVerified ? 'Yes' : 'No'}</Badge>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <button onClick={() => handleToggleStatus(row.id)}>
          <Badge variant={row.isActive === false ? 'red' : 'green'}>
            {row.isActive === false ? 'Deactivated' : 'Active'}
          </Badge>
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-64 text-sm py-2"
        />
      </div>

      <div className="card p-6">
        <DataTable columns={columns} data={users} loading={loading} emptyMessage="No customers found" />
      </div>
    </div>
  );
};

export default Customers;