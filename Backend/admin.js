// cleanup-notif.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User.model');
const Notification = require('./src/models/Notification.model');

const run = async () => {
  await connectDB();
  await Notification.deleteMany({});
  await User.deleteMany({ email: { $ne: 'admintest@example.com' } });
  console.log('Cleanup complete.');
  await mongoose.connection.close();
  process.exit(0);
};
run();