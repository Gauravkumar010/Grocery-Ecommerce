// src/pages/admin/Coupons.jsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { discountType: 'flat' },
  });
  const discountType = watch('discountType');

  const loadCoupons = () => {
    setLoading(true);
    adminService.getCouponsAdmin().then((data) => {
      setCoupons(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const onSubmit = async (data) => {
    try {
      await adminService.createCoupon({
        ...data,
        discountValue: Number(data.discountValue),
        minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : 0,
        maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        usageLimitPerUser: data.usageLimitPerUser ? Number(data.usageLimitPerUser) : 1,
      });
      toast.success('Coupon created');
      setShowModal(false);
      reset();
      loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await adminService.deleteCoupon(id);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (row) => <span className="font-mono font-bold">{row.code}</span> },
    {
      key: 'discount',
      label: 'Discount',
      render: (row) =>
        row.discountType === 'flat' ? formatCurrency(row.discountValue) : `${row.discountValue}%`,
    },
    { key: 'minOrderValue', label: 'Min Order', render: (row) => formatCurrency(row.minOrderValue) },
    { key: 'usedCount', label: 'Used', render: (row) => `${row.usedCount}${row.usageLimit ? ` / ${row.usageLimit}` : ''}` },
    {
      key: 'validUntil',
      label: 'Expires',
      render: (row) => new Date(row.validUntil).toLocaleDateString('en-IN'),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => <Badge variant={row.isActive ? 'green' : 'gray'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button onClick={() => handleDelete(row._id, row.code)} className="p-2 text-gray-400 hover:text-red-500">
          <FiTrash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
          <FiPlus size={16} /> Add Coupon
        </button>
      </div>

      <div className="card p-6">
        <DataTable columns={columns} data={coupons} loading={loading} emptyMessage="No coupons yet" />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Coupon">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Code" placeholder="SAVE50" error={errors.code?.message} {...register('code', { required: 'Required' })} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Discount Type
            </label>
            <select className="input-field" {...register('discountType')}>
              <option value="flat">Flat Amount (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>

          <Input
            label={discountType === 'flat' ? 'Discount Amount (₹)' : 'Discount Percentage (%)'}
            type="number"
            error={errors.discountValue?.message}
            {...register('discountValue', { required: 'Required', min: 0 })}
          />

          {discountType === 'percentage' && (
            <Input label="Max Discount Cap (₹, optional)" type="number" {...register('maxDiscountAmount')} />
          )}

          <Input label="Minimum Order Value (₹)" type="number" {...register('minOrderValue')} />
          <Input label="Usage Limit Per User" type="number" defaultValue={1} {...register('usageLimitPerUser')} />
          <Input label="Total Usage Limit (optional)" type="number" {...register('usageLimit')} />

          <Input
            label="Valid Until"
            type="date"
            error={errors.validUntil?.message}
            {...register('validUntil', { required: 'Required' })}
          />

          <button type="submit" className="btn-primary w-full py-2.5">Create Coupon</button>
        </form>
      </Modal>
    </div>
  );
};

export default Coupons;