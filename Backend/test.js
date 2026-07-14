// full-cleanup.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const Category = require('./src/models/Category.model');
const SubCategory = require('./src/models/SubCategory.model');

const run = async () => {
  await connectDB();
  const sub = await SubCategory.deleteMany({});
  const cat = await Category.deleteMany({});
  console.log('Deleted subcategories:', sub.deletedCount, '| categories:', cat.deletedCount);
  await mongoose.connection.close();
  process.exit(0);
};
run();