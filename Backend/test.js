// cleanup-review-test.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User.model');
const Category = require('./src/models/Category.model');
const SubCategory = require('./src/models/SubCategory.model');
const Product = require('./src/models/Product.model');
const Review = require('./src/models/Review.model');

const run = async () => {
  await connectDB();
  await Review.deleteMany({});
  await Product.deleteMany({});
  await SubCategory.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({ email: { $ne: 'admintest@example.com' } });
  console.log('Cleanup complete.');
  await mongoose.connection.close();
  process.exit(0);
};
run();