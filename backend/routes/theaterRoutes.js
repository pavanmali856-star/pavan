const express = require('express');
const router = express.Router();
const {
    getTheaters,
    createTheater,
    addScreen,
    getScreens,
} = require('../controllers/theaterController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getTheaters).post(protect, admin, createTheater);
router.route('/:id/screens').get(getScreens).post(protect, admin, addScreen);

module.exports = router;
