// src/routes/payment.routes.js

const express = require('express');
const { createPaymentOrder, verifyPayment } = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);

module.exports = router;