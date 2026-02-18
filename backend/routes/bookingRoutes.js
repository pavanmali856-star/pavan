const express = require('express');
const router = express.Router();
const {
    createBooking,
    lockSeats,
    unlockSeats,
    getMyBookings,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createBooking);
router.route('/lock').post(protect, lockSeats);
router.route('/unlock').post(protect, unlockSeats);
router.route('/mybookings').get(protect, getMyBookings);

module.exports = router;
