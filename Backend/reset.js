// Backend/seed-real-data.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const connectDB = require('./src/config/db');
const { uploadToCloudinary } = require('./src/config/cloudinary');
const User = require('./src/models/User.model');
const Category = require('./src/models/Category.model');
const SubCategory = require('./src/models/SubCategory.model');
const Product = require('./src/models/Product.model');
const Banner = require('./src/models/Banner.model');

// Downloads an image from a URL to a local temp file, returns the path
const downloadImage = async (url, filename) => {
  console.log(`  Downloading: ${url}`);
  const filePath = path.join(__dirname, filename);
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    fs.writeFileSync(filePath, response.data);
    return filePath;
  } catch (err) {
    console.log(`  FAILED to download from: ${url}`);
    console.log(`  Status: ${err.response?.status}, Message: ${err.message}`);
    throw err;
  }
};

const run = async () => {
  await connectDB();

  const admin = await User.findOne({ email: 'admintest@example.com' });
  if (!admin) {
    console.log('Admin user not found — run your admin setup script first');
    process.exit(1);
  }

  // -------------------------------------------
  // CATEGORIES (real Unsplash photos)
  // -------------------------------------------
  const categoryData = [
    { name: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400' },
    { name: 'Dairy & Breakfast', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
   { name: 'Snacks & Munchies', img: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400' },
    { name: 'Beverages', img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400' },
    { name: 'Bakery', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
    { name: 'Personal Care', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },
  ];

  const categories = [];
  for (const [idx, cat] of categoryData.entries()) {
    const localPath = await downloadImage(cat.img, `temp_cat_${idx}.jpg`);
    const uploaded = await uploadToCloudinary(localPath, 'grocery/categories');
    const created = await Category.create({
      name: cat.name,
      image: { url: uploaded.url, publicId: uploaded.publicId },
      displayOrder: idx,
    });
    categories.push(created);
    console.log('Created category:', cat.name);
  }

  // -------------------------------------------
  // SUBCATEGORIES
  // -------------------------------------------
  const subCatImg = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400';
  const subCatLocalPath = await downloadImage(subCatImg, 'temp_subcat.jpg');
  const subCatUploaded = await uploadToCloudinary(subCatLocalPath, 'grocery/subcategories');

  const freshFruits = await SubCategory.create({
    name: 'Fresh Fruits',
    category: categories[0]._id,
    image: { url: subCatUploaded.url, publicId: subCatUploaded.publicId },
  });
  console.log('Created subcategory: Fresh Fruits');

  // -------------------------------------------
  // PRODUCTS (real Unsplash photos)
  // -------------------------------------------
  const productData = [
    { name: 'Fresh Bananas', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500', mrp: 60, price: 50, unit: 'dozen', unitValue: 1, stock: 100 },
    { name: 'Fresh Apples', img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500', mrp: 200, price: 150, unit: 'kg', unitValue: 1, stock: 50 },
    { name: 'Fresh Oranges', img: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500', mrp: 100, price: 80, unit: 'kg', unitValue: 1, stock: 60 },
    { name: 'Fresh Tomatoes', img: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=500', mrp: 50, price: 40, unit: 'kg', unitValue: 1, stock: 80 },
    { name: 'Fresh Strawberries', img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500', mrp: 150, price: 120, unit: 'pack', unitValue: 1, stock: 30 },
    { name: 'Fresh Mangoes', img: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500', mrp: 180, price: 140, unit: 'kg', unitValue: 1, stock: 40 },
  ];

  for (const [idx, prod] of productData.entries()) {
    const localPath = await downloadImage(prod.img, `temp_prod_${idx}.jpg`);
    const uploaded = await uploadToCloudinary(localPath, 'grocery/products');
    await Product.create({
      name: prod.name,
      description: `Farm-fresh ${prod.name.toLowerCase()}, hand-picked for quality and freshness.`,
      category: categories[0]._id,
      subCategory: freshFruits._id,
      mrp: prod.mrp,
      sellingPrice: prod.price,
      unit: prod.unit,
      unitValue: prod.unitValue,
      images: [{ url: uploaded.url, publicId: uploaded.publicId }],
      stock: prod.stock,
      isFeatured: idx < 3,
      createdBy: admin._id,
    });
    console.log('Created product:', prod.name);
  }

  // -------------------------------------------
  // BANNER
  // -------------------------------------------
  const bannerImg = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200';
  const bannerLocalPath = await downloadImage(bannerImg, 'temp_banner.jpg');
  const bannerUploaded = await uploadToCloudinary(bannerLocalPath, 'grocery/banners');
  await Banner.create({
    title: 'Fresh Groceries, Delivered Fast',
    subtitle: 'Get up to 25% off on your first order',
    image: { url: bannerUploaded.url, publicId: bannerUploaded.publicId },
    position: 'hero',
    displayOrder: 0,
  });
  console.log('Created hero banner');

  console.log('\n✅ Seed complete with real images!');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});