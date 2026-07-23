// full-reset-check.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const Category = require('./src/models/Category.model');
const SubCategory = require('./src/models/SubCategory.model');
const Product = require('./src/models/Product.model');
const Banner = require('./src/models/Banner.model');

const run = async () => {
  await connectDB();

  const cats = await Category.find().select('name');
  const subs = await SubCategory.find().select('name');
  const prods = await Product.find().select('name');
  const banners = await Banner.find().select('title');

  console.log('Existing categories:', cats.map(c => c.name));
  console.log('Existing subcategories:', subs.map(s => s.name));
  console.log('Existing products:', prods.map(p => p.name));
  console.log('Existing banners:', banners.map(b => b.title));

  // Now actually delete everything to get a truly clean slate
  await Product.deleteMany({});
  await SubCategory.deleteMany({});
  await Category.deleteMany({});
  await Banner.deleteMany({});

  console.log('\n✅ All cleared. Starting fresh.');

  await mongoose.connection.close();
  process.exit(0);
};
run();