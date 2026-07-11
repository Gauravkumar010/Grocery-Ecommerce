// src/controllers/address.controller.js

const Address = require('../models/Address.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// =========================================
// @desc    Get all addresses for logged-in user
// @route   GET /api/v1/addresses
// @access  Private
// =========================================
const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { addresses }, 'Addresses fetched successfully'));
});

// =========================================
// @desc    Get a single address by ID (must belong to logged-in user)
// @route   GET /api/v1/addresses/:id
// @access  Private
// =========================================
const getAddressById = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  return res.status(200).json(new ApiResponse(200, { address }, 'Address fetched successfully'));
});

// =========================================
// @desc    Create a new address for logged-in user
// @route   POST /api/v1/addresses
// @access  Private
// =========================================
const createAddress = asyncHandler(async (req, res) => {
  const {
    label,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    country,
    latitude,
    longitude,
    isDefault,
  } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    throw ApiError.badRequest(
      'fullName, phone, addressLine1, city, state, and pincode are required'
    );
  }

  // If this is the user's very first address, force it to be default
  // regardless of what was passed, so there's always exactly one default.
  const existingCount = await Address.countDocuments({ user: req.user._id });
  const shouldBeDefault = existingCount === 0 ? true : !!isDefault;

  const address = await Address.create({
    user: req.user._id,
    label,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    country,
    location:
      latitude && longitude
        ? { type: 'Point', coordinates: [Number(longitude), Number(latitude)] }
        : undefined,
    isDefault: shouldBeDefault,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { address }, 'Address created successfully'));
});

// =========================================
// @desc    Update an existing address
// @route   PATCH /api/v1/addresses/:id
// @access  Private
// =========================================
const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  const allowedFields = [
    'label',
    'fullName',
    'phone',
    'addressLine1',
    'addressLine2',
    'landmark',
    'city',
    'state',
    'pincode',
    'country',
    'isDefault',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      address[field] = req.body[field];
    }
  });

  if (req.body.latitude && req.body.longitude) {
    address.location = {
      type: 'Point',
      coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
    };
  }

  // Triggers the pre('save') hook in Address.model.js, which handles
  // unsetting isDefault on other addresses if this one is now default
  await address.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { address }, 'Address updated successfully'));
});

// =========================================
// @desc    Delete an address
// @route   DELETE /api/v1/addresses/:id
// @access  Private
// =========================================
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  const wasDefault = address.isDefault;
  await Address.findByIdAndDelete(address._id);

  // If the deleted address was the default one, promote the most
  // recently created remaining address to be the new default —
  // ensures the user always has a default address if any exist.
  if (wasDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return res.status(200).json(new ApiResponse(200, null, 'Address deleted successfully'));
});

// =========================================
// @desc    Set a specific address as the default
// @route   PATCH /api/v1/addresses/:id/set-default
// @access  Private
// =========================================
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  address.isDefault = true;
  await address.save(); // triggers auto-unset of other defaults via model hook

  return res
    .status(200)
    .json(new ApiResponse(200, { address }, 'Default address updated successfully'));
});

module.exports = {
  getMyAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};