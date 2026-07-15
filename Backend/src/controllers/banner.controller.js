// src/controllers/banner.controller.js

const Banner = require('../models/Banner.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// =========================================
// @desc    Get active banners for a given position (public)
// @route   GET /api/v1/banners?position=hero
// @access  Public
// =========================================
const getActiveBanners = asyncHandler(async (req, res) => {
  const position = req.query.position || 'hero';
  const banners = await Banner.getActiveBanners(position);

  return res.status(200).json(new ApiResponse(200, { banners }, 'Banners fetched successfully'));
});

// =========================================
// @desc    Get all banners including inactive/expired (admin)
// @route   GET /api/v1/banners/admin
// @access  Private/Admin
// =========================================
const getAllBannersAdmin = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ position: 1, displayOrder: 1 });

  return res.status(200).json(new ApiResponse(200, { banners }, 'Banners fetched successfully'));
});

// =========================================
// @desc    Create a new banner
// @route   POST /api/v1/banners
// @access  Private/Admin
// =========================================
const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, linkUrl, linkType, displayOrder, position, startDate, endDate } = req.body;

  if (!title) {
    throw ApiError.badRequest('Banner title is required');
  }
  if (!req.file) {
    throw ApiError.badRequest('Banner image is required');
  }

  const uploaded = await uploadToCloudinary(req.file.path, 'grocery/banners');

  const banner = await Banner.create({
    title,
    subtitle,
    image: { url: uploaded.url, publicId: uploaded.publicId },
    linkUrl,
    linkType: linkType || 'none',
    displayOrder: displayOrder ? Number(displayOrder) : 0,
    position: position || 'hero',
    startDate: startDate ? new Date(startDate) : Date.now(),
    endDate: endDate ? new Date(endDate) : null,
  });

  return res.status(201).json(new ApiResponse(201, { banner }, 'Banner created successfully'));
});

// =========================================
// @desc    Update a banner
// @route   PATCH /api/v1/banners/:id
// @access  Private/Admin
// =========================================
const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    throw ApiError.notFound('Banner not found');
  }

  const simpleFields = ['title', 'subtitle', 'linkUrl', 'linkType', 'position'];
  simpleFields.forEach((field) => {
    if (req.body[field] !== undefined) banner[field] = req.body[field];
  });

  if (req.body.displayOrder !== undefined) banner.displayOrder = Number(req.body.displayOrder);
  if (req.body.startDate !== undefined) banner.startDate = new Date(req.body.startDate);
  if (req.body.endDate !== undefined) {
    banner.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
  }
  if (req.body.isActive !== undefined) {
    banner.isActive = req.body.isActive === 'true' || req.body.isActive === true;
  }

  if (req.file) {
    if (banner.image && banner.image.publicId) {
      await deleteFromCloudinary(banner.image.publicId).catch(() => {});
    }
    const uploaded = await uploadToCloudinary(req.file.path, 'grocery/banners');
    banner.image = { url: uploaded.url, publicId: uploaded.publicId };
  }

  await banner.save();

  return res.status(200).json(new ApiResponse(200, { banner }, 'Banner updated successfully'));
});

// =========================================
// @desc    Delete a banner
// @route   DELETE /api/v1/banners/:id
// @access  Private/Admin
// =========================================
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    throw ApiError.notFound('Banner not found');
  }

  if (banner.image && banner.image.publicId) {
    await deleteFromCloudinary(banner.image.publicId).catch(() => {});
  }

  await Banner.findByIdAndDelete(banner._id);

  return res.status(200).json(new ApiResponse(200, null, 'Banner deleted successfully'));
});

module.exports = {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
};
