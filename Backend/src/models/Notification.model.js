// src/models/Notification.model.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      // null means this is a BROADCAST notification (shown to all users)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['order', 'promotion', 'system', 'account'],
      default: 'system',
    },
    // Optional link so tapping the notification navigates somewhere,
    // e.g. "/orders/ORD-20260710-1234" for an order update
    link: {
      type: String,
      default: '',
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================
// INDEXES
// =========================================
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, createdAt: -1 });

// =========================================
// STATIC METHODS
// =========================================

/**
 * Creates a notification targeted at a specific user.
 * Convenience wrapper used by other controllers (order status changes, etc.)
 */
notificationSchema.statics.notifyUser = async function ({
  userId,
  title,
  message,
  type = 'system',
  link = '',
  relatedOrder = null,
}) {
  return this.create({
    user: userId,
    title,
    message,
    type,
    link,
    relatedOrder,
    isBroadcast: false,
  });
};

/**
 * Creates a broadcast notification visible to ALL users
 * (e.g., a sale announcement). user is left null.
 */
notificationSchema.statics.notifyAll = async function ({
  title,
  message,
  type = 'promotion',
  link = '',
}) {
  return this.create({
    user: null,
    title,
    message,
    type,
    link,
    isBroadcast: true,
  });
};

/**
 * Fetches all notifications relevant to a given user — their own
 * targeted notifications PLUS all broadcast notifications — sorted
 * newest first. This is what the notification bell dropdown will call.
 */
notificationSchema.statics.getForUser = async function (userId, limit = 20) {
  return this.find({
    $or: [{ user: userId }, { isBroadcast: true }],
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Counts unread notifications for a user (targeted + broadcast).
 * Used for the notification bell's unread badge count.
 * Note: since broadcast notifications don't have a per-user read
 * state in this simple schema, we treat isRead only meaningfully
 * for targeted notifications here; broadcasts are always counted
 * as unread until explicitly marked (see markAsRead).
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    $or: [{ user: userId, isRead: false }, { isBroadcast: true, isRead: false }],
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;