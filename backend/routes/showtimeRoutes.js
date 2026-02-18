const express = require('express');
const router = express.Router();
const {
    getShowtimes,
    getShowtimeById,
    createShowtime,
} = require('../controllers/showtimeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getShowtimes).post(protect, admin, createShowtime);
router.route('/:id').get(getShowtimeById);

module.exports = router;
