// src/controllers/auth.controller.js

const crypto = require('crypto');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const logger = require('../utils/logger');

// -------------------------------------------
// Cookie options helper
// -------------------------------------------
const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: maxAgeMs,
});

/**
 * Generates access + refresh tokens for a user, saves the refresh
 * token to the DB, and sets both as httpOnly cookies on the response.
 */
const issueTokens = async (user, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', accessToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days
  res.cookie('refreshToken', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000)); // 30 days

  return { accessToken, refreshToken };
};

// =========================================
// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
// =========================================
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email, and password are required');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, phone });

  // Generate email verification token and send email
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (error) {
    // Don't fail registration if email sending fails — log it,
    // user can request a resend later. This is a deliberate UX choice.
    logger.error(`Failed to send verification email during registration: ${error.message}`);
  }

  const { accessToken } = await issueTokens(user, res);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: user.toSafeObject(), accessToken },
        'Registration successful. Please check your email to verify your account.'
      )
    );
});

// =========================================
// @desc    Log in an existing user
// @route   POST /api/v1/auth/login
// @access  Public
// =========================================
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { accessToken } = await issueTokens(user, res);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user.toSafeObject(), accessToken },
        'Login successful'
      )
    );
});

// =========================================
// @desc    Log out the current user
// @route   POST /api/v1/auth/logout
// @access  Private
// =========================================
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  res.clearCookie('accessToken', getCookieOptions(0));
  res.clearCookie('refreshToken', getCookieOptions(0));

  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

// =========================================
// @desc    Verify user's email using the token sent via email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
// =========================================
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpire');

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification link');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { user: user.toSafeObject() }, 'Email verified successfully'));
});

// =========================================
// @desc    Resend email verification link
// @route   POST /api/v1/auth/resend-verification
// @access  Private
// =========================================
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email is already verified');
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user.email, user.name, verificationToken);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Verification email resent. Please check your inbox.'));
});

// =========================================
// @desc    Request a password reset link
// @route   POST /api/v1/auth/forgot-password
// @access  Public
// =========================================
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw ApiError.badRequest('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Deliberately return the same success message whether or not the
  // email exists — prevents attackers from using this endpoint to
  // discover which emails are registered (user enumeration attack).
  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          'If an account with that email exists, a password reset link has been sent.'
        )
      );
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken);
  } catch (error) {
    // Roll back the token if email fails to send, so the user isn't
    // left with a dangling unusable reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.internal('Failed to send password reset email. Please try again later.');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        'If an account with that email exists, a password reset link has been sent.'
      )
    );
});

// =========================================
// @desc    Reset password using the token from email
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
// =========================================
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw ApiError.badRequest('New password is required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    throw ApiError.badRequest('Invalid or expired password reset link');
  }

  user.password = password; // will be auto-hashed by the pre('save') hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshToken = undefined; // force re-login on all devices for security
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Password reset successful. Please log in with your new password.'));
});

// =========================================
// @desc    Get currently logged-in user's profile
// @route   GET /api/v1/auth/me
// @access  Private
// =========================================
const getMe = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user.toSafeObject() }, 'User fetched successfully'));
});

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
};