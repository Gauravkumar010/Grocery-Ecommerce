// src/models/Address.model.js

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode'],
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    location: {
      // GeoJSON format — enables MongoDB geospatial queries
      // (e.g., "find delivery zones near this point")
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    isDefault: {
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
addressSchema.index({ user: 1 });
addressSchema.index({ location: '2dsphere' }); // enables geospatial queries

// =========================================
// MIDDLEWARE
// =========================================

/**
 * Ensures only ONE address per user can be marked as default.
 * If this address is being saved with isDefault: true, unset
 * isDefault on all other addresses belonging to the same user.
 */
addressSchema.pre('save', async function () {
  if (this.isModified('isDefault') && this.isDefault === true) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;