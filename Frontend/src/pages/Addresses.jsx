// src/pages/Addresses.jsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiMapPin, FiTrash2, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import orderService from '../services/orderService';
import axiosInstance from '../services/axiosInstance';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await orderService.getAddresses();
      setAddresses(data);
    } catch (err) {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data) => {
    try {
      const newAddress = await orderService.createAddress(data);
      setAddresses((prev) => [newAddress, ...prev.map((a) => ({ ...a, isDefault: newAddress.isDefault ? false : a.isDefault }))]);
      setShowModal(false);
      reset();
      toast.success('Address added');
      loadAddresses(); // re-fetch to get accurate default flags from server
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/addresses/${id}`);
      toast.success('Address deleted');
      loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await axiosInstance.patch(`/addresses/${id}/set-default`);
      toast.success('Default address updated');
      loadAddresses();
    } catch (err) {
      toast.error('Failed to update default address');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Addresses</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 text-sm">
          + Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon={<FiMapPin />} title="No addresses saved" subtitle="Add an address for faster checkout" />
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr._id} className="card p-5 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {addr.fullName}<br />
                  {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}<br />
                  {addr.phone}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    className="p-2 text-gray-400 hover:text-primary-600"
                    aria-label="Set as default"
                    title="Set as default"
                  >
                    <FiStar size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr._id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  aria-label="Delete address"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Address">
        <form onSubmit={handleSubmit(handleAdd)} className="space-y-3">
          <Input label="Full Name" error={errors.fullName?.message} {...register('fullName', { required: 'Required' })} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone', { required: 'Required', pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid phone number' } })} />
          <Input label="Address Line 1" error={errors.addressLine1?.message} {...register('addressLine1', { required: 'Required' })} />
          <Input label="Landmark (optional)" {...register('landmark')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" error={errors.city?.message} {...register('city', { required: 'Required' })} />
            <Input label="State" error={errors.state?.message} {...register('state', { required: 'Required' })} />
          </div>
          <Input label="Pincode" error={errors.pincode?.message} {...register('pincode', { required: 'Required', pattern: { value: /^\d{6}$/, message: 'Must be 6 digits' } })} />
          <button type="submit" className="btn-primary w-full py-2.5 mt-2">
            Save Address
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Addresses;