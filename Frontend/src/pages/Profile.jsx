// src/pages/Profile.jsx

import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { FiPackage, FiMapPin, FiHeart, FiLogOut, FiCamera, FiLock } from 'react-icons/fi';
import { updateProfile, updateAvatar } from '../redux/slices/authSlice';
import axiosInstance from '../services/axiosInstance';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm();

  const onProfileSubmit = (data) => {
    dispatch(updateProfile(data));
  };

  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(updateAvatar(file));
    }
  };

  const onPasswordSubmit = async (data) => {
    setChangingPassword(true);
    try {
      await axiosInstance.patch('/users/change-password', data);
      toast.success('Password changed. Please log in again.');
      resetPasswordForm();
      setShowPasswordForm(false);
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Account</h1>

      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {user?.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-sm"
            >
              <FiCamera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            error={profileErrors.name?.message}
            {...registerProfile('name', { required: 'Name is required' })}
          />
          <Input
            label="Phone"
            error={profileErrors.phone?.message}
            {...registerProfile('phone', {
              pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid phone number' },
            })}
          />
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary px-6 py-2">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Navigation menu */}
      <div className="card p-2 mb-6">
        <Link to="/orders" className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <FiPackage className="text-primary-600" size={20} />
          <span className="font-medium text-gray-800 dark:text-gray-100">My Orders</span>
        </Link>
        <Link to="/addresses" className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <FiMapPin className="text-primary-600" size={20} />
          <span className="font-medium text-gray-800 dark:text-gray-100">My Addresses</span>
        </Link>
        <Link to="/wishlist" className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <FiHeart className="text-primary-600" size={20} />
          <span className="font-medium text-gray-800 dark:text-gray-100">My Wishlist</span>
        </Link>
        <button
          onClick={() => setShowPasswordForm((s) => !s)}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
        >
          <FiLock className="text-primary-600" size={20} />
          <span className="font-medium text-gray-800 dark:text-gray-100">Change Password</span>
        </button>
      </div>

      {showPasswordForm && (
        <div className="card p-6 mb-6">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword', { required: 'Required' })}
            />
            <Input
              label="New Password"
              type="password"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword', {
                required: 'Required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
            <button type="submit" disabled={changingPassword} className="btn-primary px-6 py-2">
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10"
      >
        <FiLogOut size={18} /> Log Out
      </button>
    </div>
  );
};

export default Profile;