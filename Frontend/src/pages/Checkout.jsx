// src/pages/Checkout.jsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchCart } from '../redux/slices/cartSlice';
import { placeCodOrder } from '../redux/slices/orderSlice';
import orderService from '../services/orderService';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/formatCurrency';

const DELIVERY_FEE = 20;

// Dynamically loads Razorpay's checkout.js script (only once)
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-sdk')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchCart());
    loadAddresses();
  }, [dispatch]);

  const loadAddresses = async () => {
    try {
      const data = await orderService.getAddresses();
      setAddresses(data);
      const defaultAddr = data.find((a) => a.isDefault) || data[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr._id);
    } catch (err) {
      toast.error('Failed to load addresses');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = async (data) => {
    try {
      const newAddress = await orderService.createAddress(data);
      setAddresses((prev) => [newAddress, ...prev]);
      setSelectedAddressId(newAddress._id);
      setShowAddressModal(false);
      reset();
      toast.success('Address added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await orderService.applyCoupon(couponCode.trim());
      setCouponResult(result);
      toast.success('Coupon applied!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const handleRemoveCoupon = async () => {
    await orderService.removeCoupon();
    setCouponResult(null);
    setCouponCode('');
  };

  const discount = couponResult?.discount || 0;
  const total = subtotal + DELIVERY_FEE - discount;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    setPlacing(true);

    if (paymentMethod === 'cod') {
      const result = await dispatch(placeCodOrder(selectedAddressId));
      setPlacing(false);
      if (placeCodOrder.fulfilled.match(result)) {
        navigate(`/orders/${result.payload.orderNumber}`);
      }
      return;
    }

    // Razorpay flow
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Check your connection.');
        setPlacing(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = await orderService.createRazorpayOrder(
        selectedAddressId
      );

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Grocery Store',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            const order = await orderService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              addressId: selectedAddressId,
            });
            toast.success('Payment successful! Order placed.');
            navigate(`/orders/${order.orderNumber}`);
          } catch (err) {
            toast.error('Payment verification failed. Contact support if money was deducted.');
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#16a34a' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setPlacing(false);
    }
  };

  if (loadingAddresses) return <Loader fullScreen />;

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Your cart is empty. Add items before checking out.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Address selection */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Delivery Address</h3>
              <button
                onClick={() => setShowAddressModal(true)}
                className="text-sm text-primary-600 font-medium hover:underline"
              >
                + Add New
              </button>
            </div>

            {addresses.length === 0 ? (
              <p className="text-sm text-gray-500">No saved addresses. Add one to continue.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedAddressId === addr._id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={selectedAddressId === addr._id}
                      onChange={() => setSelectedAddressId(addr._id)}
                      className="mt-1"
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {addr.label} · {addr.fullName}
                      </p>
                      <p className="text-gray-500 mt-0.5">
                        {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-gray-500">{addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Payment Method</h3>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span className="text-sm font-medium">Cash on Delivery</span>
              </label>
              <label
                className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer ${
                  paymentMethod === 'razorpay'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                />
                <span className="text-sm font-medium">Pay Online (Razorpay)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Order Summary</h3>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={!!couponResult}
                className="input-field text-sm py-2"
              />
              {couponResult ? (
                <button onClick={handleRemoveCoupon} className="btn-secondary text-sm px-3">
                  Remove
                </button>
              ) : (
                <button onClick={handleApplyCoupon} className="btn-secondary text-sm px-3">
                  Apply
                </button>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Delivery Fee</span>
                <span>{formatCurrency(DELIVERY_FEE)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 flex justify-between font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddressId}
              className="btn-primary w-full mt-6 py-3 disabled:opacity-50"
            >
              {placing ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title="Add New Address">
        <form onSubmit={handleSubmit(handleAddAddress)} className="space-y-3">
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

export default Checkout;