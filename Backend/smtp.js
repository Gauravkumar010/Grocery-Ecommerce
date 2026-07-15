// debug-payment-now.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const { prepareOrderData } = require('./src/controllers/order.controller');
const { createRazorpayOrder } = require('./src/config/razorpay');
const User = require('./src/models/User.model');
const Address = require('./src/models/Address.model');

const run = async () => {
  await connectDB();

  const user = await User.findOne({ email: { $regex: /^paytest_/ } }).sort({ createdAt: -1 });
  if (!user) {
    console.log('No paytest user found');
    process.exit(1);
  }

  const address = await Address.findOne({ user: user._id });
  console.log('User:', user.email, '| Address:', address?._id?.toString());

  try {
    const orderData = await prepareOrderData(user._id, address._id);
    console.log('totalAmount:', orderData.totalAmount, typeof orderData.totalAmount);

    const receipt = `receipt_${user._id}_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(orderData.totalAmount, receipt);
    console.log('SUCCESS:', razorpayOrder.id);
  } catch (err) {
    console.log('ERROR NAME:', err.name);
    console.log('ERROR MESSAGE:', err.message);
    console.log('ERROR STACK:', err.stack);
  }

  await mongoose.connection.close();
  process.exit(0);
};
run();