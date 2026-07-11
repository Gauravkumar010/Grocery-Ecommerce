// src/routes/address.routes.js

const express = require('express');
const {
  getMyAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getMyAddresses);
router.post('/', createAddress);
router.get('/:id', getAddressById);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/set-default', setDefaultAddress);

module.exports = router;