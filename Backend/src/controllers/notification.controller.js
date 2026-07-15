// src/controllers/notification.controller.js

const Notification = require('../models/Notification.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// =========================================
// @desc    Get logged-in user's notifications (targeted + broadcast)
// @route   GET /api/v1/notifications
// @access  Private
// =========================================
const getMyNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const notifications = await Notification.getForUser(req.user._id, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, { notifications }, 'Notifications fetched successfully'));
});

// =========================================
// @desc    Get unread notification count (for bell badge)
// @route   GET /api/v1/notifications/unread-count
// @access  Private
// =========================================
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user._id);

  return res.status(200).json(new ApiResponse(200, { count }, 'Unread count fetched successfully'));
});

// =========================================
// @desc    Mark a specific notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
// =========================================
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    $or: [{ user: req.user._id }, { isBroadcast: true }],
  });

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  notification.isRead = true;
  await notification.save();

  return res.status(200).json(new ApiResponse(200, { notification }, 'Notification marked as read'));
});

// =========================================
// @desc    Mark all of logged-in user's notifications as read
// @route   PATCH /api/v1/notifications/read-all
// @access  Private
// =========================================
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { $or: [{ user: req.user._id }, { isBroadcast: true }], isRead: false },
    { $set: { isRead: true } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedCount: result.modifiedCount }, 'All notifications marked as read'));
});

// =========================================
// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
// =========================================
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    throw ApiError.notFound('Notification not found (or is a broadcast, which cannot be deleted individually)');
  }

  await Notification.findByIdAndDelete(notification._id);

  return res.status(200).json(new ApiResponse(200, null, 'Notification deleted successfully'));
});

// =========================================
// ADMIN: Send a broadcast notification to all users
// @route   POST /api/v1/notifications/broadcast
// @access  Private/Admin
// =========================================
const sendBroadcast = asyncHandler(async (req, res) => {
  const { title, message, type, link } = req.body;

  if (!title || !message) {
    throw ApiError.badRequest('Title and message are required');
  }

  const notification = await Notification.notifyAll({ title, message, type, link });

  return res
    .status(201)
    .json(new ApiResponse(201, { notification }, 'Broadcast notification sent successfully'));
});

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendBroadcast,
};