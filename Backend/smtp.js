// cleanup-addr-test2.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User.model');
const Address = require('./src/models/Address.model');

const run = async () => {
  await connectDB();
  const user = await User.findOne({ email: 'addrroutetest2@example.com' });
  if (user) {
    await Address.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);
  }
  console.log('Cleanup complete.');
  await mongoose.connection.close();
  process.exit(0);
};
run();