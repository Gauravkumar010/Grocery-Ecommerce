// src/controllers/subcategory.controller.js

const SubCategory = require('../models/SubCategory.model');
const Category = require('../models/Category.model');
const Product = require('../models/Product.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// =========================================
// @desc    Get all active subcategories (optionally filtered by category)
// @route   GET /api/v1/subcategories?category=<categoryId>
// @access  Public
// =========================================
const getAllSubCategories = asyncHandler(async (req, res) => {
  const filter = { isActive: true };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  const subCategories = await SubCategory.find(filter)
    .populate('category', 'name slug')
    .sort({ displayOrder: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { subCategories }, 'Subcategories fetched successfully'));
});

// =========================================
// @desc    Get all subcategories including inactive (admin)
// @route   GET /api/v1/subcategories/admin
// @access  Private/Admin
// =========================================
const getAllSubCategoriesAdmin = asyncHandler(async (req, res) => {
  const subCategories = await SubCategory.find()
    .populate('category', 'name slug')
    .sort({ displayOrder: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { subCategories }, 'Subcategories fetched successfully'));
});

// =========================================
// @desc    Get single subcategory by slug
// @route   GET /api/v1/subcategories/:slug
// @access  Public
// =========================================
const getSubCategoryBySlug = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate('category', 'name slug');

  if (!subCategory) {
    throw ApiError.notFound('Subcategory not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { subCategory }, 'Subcategory fetched successfully'));
});

// =========================================
// @desc    Create a new subcategory
// @route   POST /api/v1/subcategories
// @access  Private/Admin
// =========================================
const createSubCategory = asyncHandler(async (req, res) => {
  const { name, category, description, displayOrder } = req.body;

  if (!name || !category) {
    throw ApiError.badRequest('Name and parent category are required');
  }

  if (!req.file) {
    throw ApiError.badRequest('Subcategory image is required');
  }

  const parentCategory = await Category.findById(category);
  if (!parentCategory) {
    throw ApiError.badRequest('Parent category does not exist');
  }

  const existing = await SubCategory.findOne({ name: name.trim(), category });
  if (existing) {
    throw ApiError.conflict('A subcategory with this name already exists under this category');
  }

  const uploaded = await uploadToCloudinary(req.file.path, 'grocery/subcategories');

  const subCategory = await SubCategory.create({
    name,
    category,
    description,
    displayOrder: displayOrder ? Number(displayOrder) : 0,
    image: { url: uploaded.url, publicId: uploaded.publicId },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { subCategory }, 'Subcategory created successfully'));
});

// =========================================
// @desc    Update a subcategory
// @route   PATCH /api/v1/subcategories/:id
// @access  Private/Admin
// =========================================
const updateSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id);

  if (!subCategory) {
    throw ApiError.notFound('Subcategory not found');
  }

  const { name, category, description, displayOrder, isActive } = req.body;

  if (category !== undefined) {
    const parentCategory = await Category.findById(category);
    if (!parentCategory) {
      throw ApiError.badRequest('Parent category does not exist');
    }
    subCategory.category = category;
  }

  if (name !== undefined) subCategory.name = name;
  if (description !== undefined) subCategory.description = description;
  if (displayOrder !== undefined) subCategory.displayOrder = Number(displayOrder);
  if (isActive !== undefined) subCategory.isActive = isActive === 'true' || isActive === true;

  if (req.file) {
    if (subCategory.image && subCategory.image.publicId) {
      try {
        await deleteFromCloudinary(subCategory.image.publicId);
      } catch (error) {
        // Non-fatal
      }
    }
    const uploaded = await uploadToCloudinary(req.file.path, 'grocery/subcategories');
    subCategory.image = { url: uploaded.url, publicId: uploaded.publicId };
  }

  await subCategory.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { subCategory }, 'Subcategory updated successfully'));
});

// =========================================
// @desc    Delete a subcategory (blocked if products still reference it)
// @route   DELETE /api/v1/subcategories/:id
// @access  Private/Admin
// =========================================
const deleteSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id);

  if (!subCategory) {
    throw ApiError.notFound('Subcategory not found');
  }

  const productCount = await Product.countDocuments({ subCategory: subCategory._id });
  if (productCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete subcategory with ${productCount} existing products. Delete or reassign them first.`
    );
  }

  if (subCategory.image && subCategory.image.publicId) {
    try {
      await deleteFromCloudinary(subCategory.image.publicId);
    } catch (error) {
      // Non-fatal
    }
  }

  await SubCategory.findByIdAndDelete(subCategory._id);

  return res.status(200).json(new ApiResponse(200, null, 'Subcategory deleted successfully'));
});

module.exports = {
  getAllSubCategories,
  getAllSubCategoriesAdmin,
  getSubCategoryBySlug,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
};