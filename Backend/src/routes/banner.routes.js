// src/routes/banner.routes.js

const express = require('express');
const {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/banner.controller');
const { protect } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { uploadSingleImage } = require('../middlewares/multer.middleware');

const router = express.Router();

router.get('/', getActiveBanners);
router.get('/admin', protect, isAdmin, getAllBannersAdmin);
router.post('/', protect, isAdmin, uploadSingleImage('image'), createBanner);
router.patch('/:id', protect, isAdmin, uploadSingleImage('image'), updateBanner);
router.delete('/:id', protect, isAdmin, deleteBanner);

module.exports = router;