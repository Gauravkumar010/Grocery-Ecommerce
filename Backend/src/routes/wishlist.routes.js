// src/routes/wishlist.routes.js

const express = require('express');
const {
  getWishlist,
  toggleWishlistItem,
  checkWishlistStatus,
  removeFromWishlist,
} = require('../controllers/wishlist.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlistItem);
router.get('/check/:productId', checkWishlistStatus);
router.delete('/:productId', removeFromWishlist);

module.exports = router;