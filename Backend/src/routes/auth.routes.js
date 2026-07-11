// src/routes/auth.routes.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// -------------------------------------------
// Stricter rate limiter for sensitive auth endpoints
// (prevents brute-force login attempts, spam registrations, etc.)
// -------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    success: false,
    message: 'Too many attempts, please try again after 15 minutes.',
  },
});

// =========================================
// PUBLIC ROUTES
// =========================================
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// =========================================
// PRIVATE ROUTES (require valid JWT)
// =========================================
router.post('/logout', protect, logout);
router.post('/resend-verification', protect, resendVerificationEmail);
router.get('/me', protect, getMe);

module.exports = router;