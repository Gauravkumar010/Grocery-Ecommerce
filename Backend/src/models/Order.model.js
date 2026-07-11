// src/models/Order.model.js

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Snapshot fields — captured at order time, never change even if
    // the live Product document is later edited or deleted
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    unitValue: {
      type: Number,
      required: true,
    },
    price: {
      // sellingPrice at the time of order
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    // -------------------------------------------
    // SHIPPING ADDRESS SNAPSHOT
    // (copied from Address doc at order time, not a live reference)
    // -------------------------------------------
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },

    // -------------------------------------------
    // PRICING BREAKDOWN
    // -------------------------------------------
    itemsSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // -------------------------------------------
    // PAYMENT
    // -------------------------------------------
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },

    // -------------------------------------------
    // ORDER STATUS & TRACKING
    // -------------------------------------------
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: 'pending', note: 'Order placed' }],
    },
    estimatedDeliveryTime: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// =========================================
// INDEXES
// =========================================
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 }); // recent orders first

// =========================================
// MIDDLEWARE
// =========================================

/**
 * Auto-generates a human-readable order number on creation,
 * formatted as ORD-YYYYMMDD-XXXX (XXXX = random 4-digit sequence).
 * Uses a retry-safe approach: keeps generating until a unique one is found.
 */
orderSchema.pre('save', async function () {
  if (this.isNew && !this.orderNumber) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let isUnique = false;
    let generatedNumber;

    while (!isUnique) {
      const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random
      generatedNumber = `ORD-${datePart}-${randomPart}`;
      const existing = await this.constructor.findOne({ orderNumber: generatedNumber });
      if (!existing) isUnique = true;
    }

    this.orderNumber = generatedNumber;
  }
});

// =========================================
// INSTANCE METHODS
// =========================================

/**
 * Updates the order status and appends an entry to the status history
 * timeline. This is what powers the Order Tracking page.
 */
orderSchema.methods.updateStatus = async function (newStatus, note = '') {
  const validStatuses = [
    'pending',
    'confirmed',
    'processing',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid order status: ${newStatus}`);
  }

  this.orderStatus = newStatus;
  this.statusHistory.push({ status: newStatus, note, timestamp: new Date() });

  if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  }

  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    if (note) this.cancellationReason = note;
  }

  await this.save();
  return this;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;