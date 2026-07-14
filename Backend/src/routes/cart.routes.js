// src/routes/cart.routes.js

const express = require('express');
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/items', addItemToCart);
router.patch('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);

module.exports = router;