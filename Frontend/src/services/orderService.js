// src/services/orderService.js

import axiosInstance from './axiosInstance';

const orderService = {
  getAddresses: () => axiosInstance.get('/addresses').then((res) => res.data.data.addresses),

  createAddress: (data) =>
    axiosInstance.post('/addresses', data).then((res) => res.data.data.address),

  applyCoupon: (code) =>
    axiosInstance.post('/coupons/apply', { code }).then((res) => res.data.data),

  removeCoupon: () => axiosInstance.delete('/coupons/apply').then((res) => res.data.data),

  createRazorpayOrder: (addressId) =>
    axiosInstance
      .post('/payments/create-order', { addressId })
      .then((res) => res.data.data),

  verifyPayment: (payload) =>
    axiosInstance.post('/payments/verify', payload).then((res) => res.data.data.order),
};

export default orderService;