// src/routes/user.routes.js

const express = require('express');
const {
  updateProfile,
  updateAvatar,
  changePassword,
  deactivateAccount,
  getAllUsers,
  toggleUserStatus,
} = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { uploadSingleImage } = require('../middlewares/multer.middleware');

const router = express.Router();

// All routes below require authentication
router.use(protect);

// =========================================
// USER ROUTES (any logged-in user)
// =========================================
router.patch('/profile', updateProfile);
router.post('/avatar', uploadSingleImage('avatar'), updateAvatar);
router.patch('/change-password', changePassword);
router.delete('/deactivate', deactivateAccount);

// =========================================
// ADMIN-ONLY ROUTES
// =========================================
router.get('/', isAdmin, getAllUsers);
router.patch('/:id/toggle-status', isAdmin, toggleUserStatus);

module.exports = router;