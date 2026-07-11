// create-admin-test.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User.model');

const run = async () => {
  await connectDB();

  const existing = await User.findOne({ email: 'admintest@example.com' });
  if (existing) await User.deleteOne({ email: 'admintest@example.com' });

  const admin = await User.create({
    name: 'Admin Test',
    email: 'admintest@example.com',
    password: 'AdminPassword123',
    role: 'admin',
  });

  console.log('Admin created:', admin.email, '| role:', admin.role);
  await mongoose.connection.close();
  process.exit(0);
};
run();