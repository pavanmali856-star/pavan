const Movie = require('../models/Movie');
const Booking = require('../models/Booking');
const { createCache } = require('../utils/simpleCache');

const moviesListCache = createCache({ ttlMs: 30_000, max: 200 });
const movieByIdCache = createCache({ ttlMs: 60_000, max: 500 });

function toArrayParam(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res) => {
    try {
        const cacheKey = req.originalUrl || `${req.path}?${new URLSearchParams(req.query).toString()}`;
        const cached = moviesListCache.get(cacheKey);
        if (cached) return res.json(cached);

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
        const skip = (page - 1) * limit;

        const genres = toArrayParam(req.query.genre);
        const languages = toArrayParam(req.query.language);
        const minRating = Number(req.query.minRating || 0);
        const q = (req.query.q || '').toString().trim();

        const filter = {};
        if (genres.length) filter.genre = { $in: genres };
        if (languages.length) filter.language = { $in: languages };
        if (Number.isFinite(minRating) && minRating > 0) filter.rating = { $gte: minRating };
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
            ];
        }

        const sort = (req.query.sort || 'newest').toString();
        const sortSpec =
            sort === 'rating'
                ? { rating: -1, createdAt: -1 }
                : sort === 'releaseDate'
                ? { releaseDate: -1 }
                : { createdAt: -1 };

        const [items, total] = await Promise.all([
            Movie.find(filter).sort(sortSpec).skip(skip).limit(limit),
            Movie.countDocuments(filter),
        ]);

        const payload = {
            items,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        };
        moviesListCache.set(cacheKey, payload);
        res.json(payload);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single movie
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res) => {
    try {
        const cacheKey = req.params.id;
        const cached = movieByIdCache.get(cacheKey);
        if (cached) return res.json(cached);

        const movie = await Movie.findById(req.params.id);

        if (movie) {
            movieByIdCache.set(cacheKey, movie);
            res.json(movie);
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Autocomplete movie titles
// @route   GET /api/movies/autocomplete?q=...
// @access  Public
const autocompleteMovies = async (req, res) => {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json({ items: [] });

    const items = await Movie.find({ title: { $regex: q, $options: 'i' } })
        .select('title posterUrl rating')
        .sort({ rating: -1 })
        .limit(10);
    res.json({ items });
};

// @desc    AI-lite recommendations (content-based)
// @route   GET /api/movies/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
    // Preferences from: savedMovies + booking history genres/languages
    const userId = req.user._id;
    const bookings = await Booking.find({ user: userId }).populate({
        path: 'showtime',
        populate: { path: 'movie', select: 'genre language rating' },
    });

    const genreScores = new Map();
    const langScores = new Map();

    for (const b of bookings) {
        const m = b?.showtime?.movie;
        if (!m) continue;
        (m.genre || []).forEach((g) => genreScores.set(g, (genreScores.get(g) || 0) + 2));
        (m.language || []).forEach((l) => langScores.set(l, (langScores.get(l) || 0) + 1));
    }

    const topGenres = [...genreScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([g]) => g);
    const topLangs = [...langScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l);

    const filter = {};
    if (topGenres.length) filter.genre = { $in: topGenres };
    if (topLangs.length) filter.language = { $in: topLangs };

    const alreadyBookedMovieIds = new Set(
        bookings.map((b) => b?.showtime?.movie?._id).filter(Boolean).map((id) => String(id))
    );

    const candidates = await Movie.find(filter).sort({ rating: -1, createdAt: -1 }).limit(30);
    const items = candidates.filter((m) => !alreadyBookedMovieIds.has(String(m._id))).slice(0, 12);

    // Fallback: top-rated
    if (items.length < 6) {
        const topRated = await Movie.find({}).sort({ rating: -1, createdAt: -1 }).limit(12);
        const merged = [...items];
        for (const m of topRated) {
            if (merged.some((x) => String(x._id) === String(m._id))) continue;
            merged.push(m);
            if (merged.length >= 12) break;
        }
        return res.json({ items: merged });
    }

    res.json({ items });
};

// @desc    Create a movie
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = async (req, res) => {
    const {
        title,
        description,
        genre,
        duration,
        language,
        releaseDate,
        posterUrl,
        trailerUrl,
    } = req.body;

    try {
        const movie = new Movie({
            title,
            description,
            genre,
            duration,
            language,
            releaseDate,
            posterUrl,
            trailerUrl,
        });

        const createdMovie = await movie.save();
        moviesListCache.clear();
        res.status(201).json(createdMovie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (movie) {
            movie.title = req.body.title || movie.title;
            movie.description = req.body.description || movie.description;
            movie.genre = req.body.genre || movie.genre;
            movie.duration = req.body.duration || movie.duration;
            movie.language = req.body.language || movie.language;
            movie.releaseDate = req.body.releaseDate || movie.releaseDate;
            movie.posterUrl = req.body.posterUrl || movie.posterUrl;
            movie.trailerUrl = req.body.trailerUrl || movie.trailerUrl;

            const updatedMovie = await movie.save();
            moviesListCache.clear();
            movieByIdCache.del(String(updatedMovie._id));
            res.json(updatedMovie);
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a movie
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (movie) {
            await movie.deleteOne();
            moviesListCache.clear();
            movieByIdCache.del(String(req.params.id));
            res.json({ message: 'Movie removed' });
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMovies,
    getMovieById,
    autocompleteMovies,
    getRecommendations,
    createMovie,
    updateMovie,
    deleteMovie,
};
