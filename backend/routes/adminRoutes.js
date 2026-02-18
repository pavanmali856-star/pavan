const express = require('express');
const router = express.Router();
const { getAdminStats, getRevenueSeries, getTopMovies, listBookings } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getAdminStats);
router.get('/revenue', protect, admin, getRevenueSeries);
router.get('/top-movies', protect, admin, getTopMovies);
router.get('/bookings', protect, admin, listBookings);

module.exports = router;
