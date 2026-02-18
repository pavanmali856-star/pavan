const express = require('express');
const router = express.Router();
const {
    getMovies,
    getMovieById,
    autocompleteMovies,
    getRecommendations,
    createMovie,
    updateMovie,
    deleteMovie,
} = require('../controllers/movieController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/autocomplete', autocompleteMovies);
router.get('/recommendations', protect, getRecommendations);
router.route('/').get(getMovies).post(protect, admin, createMovie);
router
    .route('/:id')
    .get(getMovieById)
    .put(protect, admin, updateMovie)
    .delete(protect, admin, deleteMovie);

module.exports = router;
