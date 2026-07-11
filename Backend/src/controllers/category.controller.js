// src/controllers/category.controller.js

const Category = require('../models/Category.model');
const SubCategory = require('../models/SubCategory.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// =========================================
// @desc    Get all active categories (public)
// @route   GET /api/v1/categories
// @access  Public
// =========================================
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { categories }, 'Categories fetched successfully'));
});

// =========================================
// @desc    Get all categories including inactive (admin)
// @route   GET /api/v1/categories/admin
// @access  Private/Admin
// =========================================
const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ displayOrder: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { categories }, 'Categories fetched successfully'));
});

// =========================================
// @desc    Get single category by slug, with its subcategories
// @route   GET /api/v1/categories/:slug
// @access  Public
// =========================================
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).populate({
    path: 'subCategories',
    match: { isActive: true },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return res.status(200).json(new ApiResponse(200, { category }, 'Category fetched successfully'));
});

// =========================================
// @desc    Create a new category
// @route   POST /api/v1/categories
// @access  Private/Admin
// =========================================
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, displayOrder } = req.body;

  if (!name) {
    throw ApiError.badRequest('Category name is required');
  }

  if (!req.file) {
    throw ApiError.badRequest('Category image is required');
  }

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    throw ApiError.conflict('A category with this name already exists');
  }

  const uploaded = await uploadToCloudinary(req.file.path, 'grocery/categories');

  const category = await Category.create({
    name,
    description,
    displayOrder: displayOrder ? Number(displayOrder) : 0,
    image: { url: uploaded.url, publicId: uploaded.publicId },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { category }, 'Category created successfully'));
});

// =========================================
// @desc    Update a category (fields and/or image)
// @route   PATCH /api/v1/categories/:id
// @access  Private/Admin
// =========================================
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  const { name, description, displayOrder, isActive } = req.body;

  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
  if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;

  // If a new image was uploaded, replace the old one
  if (req.file) {
    if (category.image && category.image.publicId) {
      try {
        await deleteFromCloudinary(category.image.publicId);
      } catch (error) {
        // Non-fatal, proceed anyway
      }
    }
    const uploaded = await uploadToCloudinary(req.file.path, 'grocery/categories');
    category.image = { url: uploaded.url, publicId: uploaded.publicId };
  }

  await category.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { category }, 'Category updated successfully'));
});

// =========================================
// @desc    Delete a category (blocked if subcategories still reference it)
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
// =========================================
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  const subCategoryCount = await SubCategory.countDocuments({ category: category._id });
  if (subCategoryCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete category with ${subCategoryCount} existing subcategories. Delete or reassign them first.`
    );
  }

  if (category.image && category.image.publicId) {
    try {
      await deleteFromCloudinary(category.image.publicId);
    } catch (error) {
      // Non-fatal
    }
  }

  await Category.findByIdAndDelete(category._id);

  return res.status(200).json(new ApiResponse(200, null, 'Category deleted successfully'));
});

module.exports = {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};