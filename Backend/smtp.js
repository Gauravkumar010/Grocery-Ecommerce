// cleanup-wishlist-test.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User.model');
const Wishlist = require('./src/models/Wishlist.model');

const run = async () => {
  await connectDB();
  const user = await User.findOne({ email: 'wishtest_route@example.com' });
  if (user) {
    await Wishlist.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);
  }
  console.log('Cleanup complete.');
  await mongoose.connection.close();
  process.exit(0);
};
run();