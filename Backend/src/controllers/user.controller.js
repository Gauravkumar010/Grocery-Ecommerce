// src/controllers/user.controller.js

const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { deleteLocalFile } = require('../middlewares/multer.middleware');

// =========================================
// @desc    Update logged-in user's profile (name, phone)
// @route   PATCH /api/v1/users/profile
// @access  Private
// =========================================
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('No valid fields provided to update');
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { user: user.toSafeObject() }, 'Profile updated successfully'));
});

// =========================================
// @desc    Upload/update user's avatar image
// @route   POST /api/v1/users/avatar
// @access  Private
// =========================================
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file provided');
  }

  const user = await User.findById(req.user._id);

  // If an old avatar exists on Cloudinary, delete it first to avoid
  // accumulating orphaned images in storage
  if (user.avatar && user.avatar.publicId) {
    try {
      await deleteFromCloudinary(user.avatar.publicId);
    } catch (error) {
      // Non-fatal — proceed with uploading the new one even if old
      // deletion fails (e.g., it was already removed manually)
    }
  }

  const uploaded = await uploadToCloudinary(req.file.path, 'grocery/avatars');

  user.avatar = { url: uploaded.url, publicId: uploaded.publicId };
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { user: user.toSafeObject() }, 'Avatar updated successfully'));
});

// =========================================
// @desc    Change password (while logged in, knows current password)
// @route   PATCH /api/v1/users/change-password
// @access  Private
// =========================================
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters');
  }

  const user = await User.findById(req.user._id).select('+password');

  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  user.password = newPassword; // auto-hashed by pre('save') hook
  user.refreshToken = undefined; // force re-login on all other devices
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Password changed successfully. Please log in again.'));
});

// =========================================
// @desc    Deactivate own account (soft delete — user-initiated)
// @route   DELETE /api/v1/users/deactivate
// @access  Private
// =========================================
const deactivateAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    isActive: false,
    refreshToken: undefined,
  });

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Account deactivated successfully'));
});

// =========================================
// ADMIN-ONLY ENDPOINTS
// =========================================

// =========================================
// @desc    Get all users with pagination + search (admin)
// @route   GET /api/v1/users?page=1&limit=20&search=john
// @access  Private/Admin
// =========================================
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users: users.map((u) => u.toSafeObject()),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Users fetched successfully'
    )
  );
});

// =========================================
// @desc    Toggle a user's active status (admin ban/unban)
// @route   PATCH /api/v1/users/:id/toggle-status
// @access  Private/Admin
// =========================================
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.isActive = !user.isActive;
  user.refreshToken = undefined; // force logout if being deactivated
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user.toSafeObject() },
        `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
      )
    );
});

module.exports = {
  updateProfile,
  updateAvatar,
  changePassword,
  deactivateAccount,
  getAllUsers,
  toggleUserStatus,
};