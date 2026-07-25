// Backend/bulk-add-products.js — reusable tool, keep it around
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const connectDB = require('./src/config/db');
const { uploadToCloudinary } = require('./src/config/cloudinary');
const Category = require('./src/models/Category.model');
const SubCategory = require('./src/models/SubCategory.model');
const Product = require('./src/models/Product.model');
const User = require('./src/models/User.model');

// =========================================
// EDIT THIS LIST — add as many products as you want
// categoryName / subCategoryName must match EXISTING names in your DB
// (create the category/subcategory first via admin UI if it doesn't exist)
// =========================================
const PRODUCTS = [
  {
    name: 'Fresh Spinach',
    categoryName: 'Fruits & Vegetables',
    subCategoryName: 'Fresh Fruits', // change to a veggie subcategory if you have one
    mrp: 40,
    sellingPrice: 30,
    unit: 'pack',
    unitValue: 1,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500',
  },
  {
    name: 'Fresh Carrots',
    categoryName: 'Fruits & Vegetables',
    subCategoryName: 'Fresh Fruits',
    mrp: 60,
    sellingPrice: 45,
    unit: 'kg',
    unitValue: 1,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=500',
  },

  // -------- Cleaning Essentials --------
  {
    name: 'Floor Cleaner Liquid',
    categoryName: 'Cleaning Essentials',
    subCategoryName: 'Home Cleaners',
    mrp: 180,
    sellingPrice: 149,
    unit: 'litre',
    unitValue: 1,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500',
  },
  {
    name: 'Dishwash Liquid Gel',
    categoryName: 'Cleaning Essentials',
    subCategoryName: 'Home Cleaners',
    mrp: 120,
    sellingPrice: 99,
    unit: 'ml',
    unitValue: 500,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500',
  },
  {
    name: 'Toilet Cleaner',
    categoryName: 'Cleaning Essentials',
    subCategoryName: 'Home Cleaners',
    mrp: 95,
    sellingPrice: 79,
    unit: 'ml',
    unitValue: 500,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74320d833?w=500',
  },

  // -------- Ice Cream & Desserts --------
  {
    name: 'Vanilla Ice Cream Tub',
    categoryName: 'Ice Creams & More',
    subCategoryName: 'Ice Cream',
    mrp: 250,
    sellingPrice: 199,
    unit: 'pack',
    unitValue: 1,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500',
  },
  {
    name: 'Chocolate Ice Cream Cone',
    categoryName: 'Ice Creams & More',
    subCategoryName: 'Ice Cream',
    mrp: 60,
    sellingPrice: 45,
    unit: 'piece',
    unitValue: 1,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=500',
  },
  {
    name: 'Strawberry Ice Cream Tub',
    categoryName: 'Ice Creams & More',
    subCategoryName: 'Ice Cream',
    mrp: 240,
    sellingPrice: 189,
    unit: 'pack',
    unitValue: 1,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1633933358116-a26cb2edd06f?w=500',
  },
  // 👉 Add more products below, same shape:
  // {
  //   name: '...',
  //   categoryName: '...',
  //   subCategoryName: '...',
  //   mrp: 0,
  //   sellingPrice: 0,
  //   unit: 'kg',
  //   unitValue: 1,
  //   stock: 0,
  //   imageUrl: 'https://...',
  // },
];

const downloadImage = async (url, filename) => {
  const filePath = path.join(__dirname, filename);
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  fs.writeFileSync(filePath, response.data);
  return filePath;
};

const run = async () => {
  await connectDB();

  const admin = await User.findOne({ email: 'admintest@example.com' });
  if (!admin) {
    console.log('Admin user not found.');
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const [idx, item] of PRODUCTS.entries()) {
    try {
      const category = await Category.findOne({ name: item.categoryName });
      if (!category) {
        console.log(`❌ Skipping "${item.name}" — category "${item.categoryName}" not found`);
        failCount++;
        continue;
      }

      const subCategory = await SubCategory.findOne({
        name: item.subCategoryName,
        category: category._id,
      });
      if (!subCategory) {
        console.log(`❌ Skipping "${item.name}" — subcategory "${item.subCategoryName}" not found under "${item.categoryName}"`);
        failCount++;
        continue;
      }

      const existing = await Product.findOne({ name: item.name });
      if (existing) {
        console.log(`⏭  Skipping "${item.name}" — already exists`);
        continue;
      }

      const localPath = await downloadImage(item.imageUrl, `temp_bulk_${idx}.jpg`);
      const uploaded = await uploadToCloudinary(localPath, 'grocery/products');

      await Product.create({
        name: item.name,
        category: category._id,
        subCategory: subCategory._id,
        mrp: item.mrp,
        sellingPrice: item.sellingPrice,
        unit: item.unit,
        unitValue: item.unitValue,
        stock: item.stock,
        images: [{ url: uploaded.url, publicId: uploaded.publicId }],
        createdBy: admin._id,
      });

      console.log(`✅ Created: ${item.name}`);
      successCount++;
    } catch (err) {
      console.log(`❌ Failed "${item.name}": ${err.message}`);
      failCount++;
    }
  }

  console.log(`\nDone. ${successCount} created, ${failCount} failed/skipped.`);
  await mongoose.connection.close();
  process.exit(0);
};

run();