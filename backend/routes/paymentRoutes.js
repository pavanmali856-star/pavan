const express = require('express');
const router = express.Router();
const {
    createPaymentIntent,
    verifyPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/verify', protect, verifyPayment);

module.exports = router;
