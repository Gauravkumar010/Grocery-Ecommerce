// src/controllers/product.controller.js

const Product = require('../models/Product.model');
const Category = require('../models/Category.model');
const SubCategory = require('../models/SubCategory.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const {
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
} = require('../config/cloudinary');
const { deleteLocalFile } = require('../middlewares/multer.middleware');

// =========================================
// @desc    Get products with search, filter, sort, pagination
// @route   GET /api/v1/products
// @query   page, limit, search, category, subCategory, minPrice, maxPrice,
//          inStock, isFeatured, isBestSeller, sort
// @access  Public
// =========================================
const getAllProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  // -------------------------------------------
  // Full-text search
  // -------------------------------------------
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // -------------------------------------------
  // Category / SubCategory filters
  // -------------------------------------------
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.subCategory) {
    filter.subCategory = req.query.subCategory;
  }

  // -------------------------------------------
  // Price range filter
  // -------------------------------------------
  if (req.query.minPrice || req.query.maxPrice) {
    filter.sellingPrice = {};
    if (req.query.minPrice) filter.sellingPrice.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.sellingPrice.$lte = Number(req.query.maxPrice);
  }

  // -------------------------------------------
  // Boolean flag filters
  // -------------------------------------------
  if (req.query.inStock === 'true') {
    filter.isInStock = true;
  }
  if (req.query.isFeatured === 'true') {
    filter.isFeatured = true;
  }
  if (req.query.isBestSeller === 'true') {
    filter.isBestSeller = true;
  }

  // -------------------------------------------
  // Sorting
  // -------------------------------------------
  let sort = { createdAt: -1 }; // default: newest first
  switch (req.query.sort) {
    case 'price_asc':
      sort = { sellingPrice: 1 };
      break;
    case 'price_desc':
      sort = { sellingPrice: -1 };
      break;
    case 'rating':
      sort = { 'ratings.average': -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'name_asc':
      sort = { name: 1 };
      break;
  }

  // If searching by text, sort by text relevance score first unless
  // the user explicitly requested a different sort
  const projection = req.query.search && !req.query.sort ? { score: { $meta: 'textScore' } } : {};
  if (req.query.search && !req.query.sort) {
    sort = { score: { $meta: 'textScore' } };
  }

  const [products, total] = await Promise.all([
    Product.find(filter, projection)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Products fetched successfully'
    )
  );
});

// =========================================
// @desc    Get all products including inactive (admin)
// @route   GET /api/v1/products/admin
// @access  Private/Admin
// =========================================
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find()
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
      'Products fetched successfully'
    )
  );
});

// =========================================
// @desc    Get single product by slug
// @route   GET /api/v1/products/:slug
// @access  Public
// =========================================
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug');

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return res.status(200).json(new ApiResponse(200, { product }, 'Product fetched successfully'));
});

// =========================================
// @desc    Create a new product
// @route   POST /api/v1/products
// @access  Private/Admin
// =========================================
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    subCategory,
    brand,
    mrp,
    sellingPrice,
    unit,
    unitValue,
    stock,
    lowStockThreshold,
    sku,
    tags,
    isFeatured,
    isBestSeller,
    countryOfOrigin,
    shelfLife,
  } = req.body;

  if (!name || !category || !subCategory || !mrp || !sellingPrice || !unit || !unitValue) {
    throw ApiError.badRequest(
      'name, category, subCategory, mrp, sellingPrice, unit, and unitValue are required'
    );
  }

  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest('At least one product image is required');
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw ApiError.badRequest('Category does not exist');
  }

  const subCategoryExists = await SubCategory.findById(subCategory);
  if (!subCategoryExists) {
    throw ApiError.badRequest('Subcategory does not exist');
  }

  const filePaths = req.files.map((f) => f.path);
  const uploadedImages = await uploadMultipleToCloudinary(filePaths, 'grocery/products');

  const product = await Product.create({
    name,
    description,
    category,
    subCategory,
    brand,
    mrp: Number(mrp),
    sellingPrice: Number(sellingPrice),
    unit,
    unitValue: Number(unitValue),
    images: uploadedImages,
    stock: stock ? Number(stock) : 0,
    lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : 10,
    sku,
    tags: tags ? tags.split(',').map((t) => t.trim()) : [],
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isBestSeller: isBestSeller === 'true' || isBestSeller === true,
    countryOfOrigin,
    shelfLife,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, { product }, 'Product created successfully'));
});

// =========================================
// @desc    Update a product
// @route   PATCH /api/v1/products/:id
// @access  Private/Admin
// =========================================
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const simpleFields = [
    'name',
    'description',
    'brand',
    'unit',
    'sku',
    'countryOfOrigin',
    'shelfLife',
  ];
  const numberFields = ['mrp', 'sellingPrice', 'unitValue', 'stock', 'lowStockThreshold'];
  const booleanFields = ['isFeatured', 'isBestSeller', 'isActive'];

  if (req.body.category !== undefined) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) throw ApiError.badRequest('Category does not exist');
    product.category = req.body.category;
  }

  if (req.body.subCategory !== undefined) {
    const subCategoryExists = await SubCategory.findById(req.body.subCategory);
    if (!subCategoryExists) throw ApiError.badRequest('Subcategory does not exist');
    product.subCategory = req.body.subCategory;
  }

  simpleFields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  numberFields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = Number(req.body[field]);
  });

  booleanFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field] === 'true' || req.body[field] === true;
    }
  });

  if (req.body.tags !== undefined) {
    product.tags = req.body.tags.split(',').map((t) => t.trim());
  }

  // If new images uploaded, ADD to existing gallery (doesn't replace) —
  // admin can remove specific old images via a separate endpoint if needed
  if (req.files && req.files.length > 0) {
    const filePaths = req.files.map((f) => f.path);
    const uploadedImages = await uploadMultipleToCloudinary(filePaths, 'grocery/products');
    product.images.push(...uploadedImages);
  }

  await product.save();

  return res.status(200).json(new ApiResponse(200, { product }, 'Product updated successfully'));
});

// =========================================
// @desc    Remove a single image from a product's gallery
// @route   DELETE /api/v1/products/:id/images/:publicId
// @access  Private/Admin
// =========================================
const removeProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const { publicId } = req.params;
  // publicId comes URL-encoded (contains slashes), decode it
  const decodedPublicId = decodeURIComponent(publicId);

  const imageExists = product.images.some((img) => img.publicId === decodedPublicId);
  if (!imageExists) {
    throw ApiError.notFound('Image not found on this product');
  }

  if (product.images.length === 1) {
    throw ApiError.badRequest('Cannot remove the last remaining image. Product must have at least one image.');
  }

  await deleteFromCloudinary(decodedPublicId);

  product.images = product.images.filter((img) => img.publicId !== decodedPublicId);
  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { product }, 'Image removed successfully'));
});

// =========================================
// @desc    Delete a product entirely
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
// =========================================
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Delete all images from Cloudinary
  await Promise.all(
    product.images.map((img) =>
      deleteFromCloudinary(img.publicId).catch(() => {
        // Non-fatal — proceed with deletion even if some images fail to remove from Cloudinary
      })
    )
  );

  await Product.findByIdAndDelete(product._id);

  return res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully'));
});

module.exports = {
  getAllProducts,
  getAllProductsAdmin,
  getProductBySlug,
  createProduct,
  updateProduct,
  removeProductImage,
  deleteProduct,
};