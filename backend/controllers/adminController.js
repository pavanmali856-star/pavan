const User = require('../models/User');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMovies = await Movie.countDocuments();
        const totalTheaters = await Theater.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // Calculate pending vs confirmed revenue
        const bookings = await Booking.find({});
        const totalRevenue = bookings.reduce(
            (acc, booking) => acc + (booking.status === 'Confirmed' ? booking.totalAmount : 0),
            0
        );

        res.json({
            totalUsers,
            totalMovies,
            totalTheaters,
            totalBookings,
            totalRevenue,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Revenue timeseries (grouped by day)
// @route   GET /api/admin/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private/Admin
const getRevenueSeries = async (req, res) => {
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : new Date();

    const rows = await Booking.aggregate([
        { $match: { status: 'Confirmed', createdAt: { $gte: from, $lte: to } } },
        {
            $group: {
                _id: {
                    y: { $year: '$createdAt' },
                    m: { $month: '$createdAt' },
                    d: { $dayOfMonth: '$createdAt' },
                },
                revenue: { $sum: '$totalAmount' },
                bookings: { $sum: 1 },
            },
        },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]);

    const items = rows.map((r) => ({
        date: `${r._id.y}-${String(r._id.m).padStart(2, '0')}-${String(r._id.d).padStart(2, '0')}`,
        revenue: r.revenue,
        bookings: r.bookings,
    }));

    res.json({ from, to, items });
};

// @desc    Top movies by bookings and revenue
// @route   GET /api/admin/top-movies
// @access  Private/Admin
const getTopMovies = async (req, res) => {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
    const rows = await Booking.aggregate([
        { $match: { status: 'Confirmed' } },
        {
            $lookup: {
                from: 'showtimes',
                localField: 'showtime',
                foreignField: '_id',
                as: 'showtimeDoc',
            },
        },
        { $unwind: '$showtimeDoc' },
        {
            $group: {
                _id: '$showtimeDoc.movie',
                revenue: { $sum: '$totalAmount' },
                bookings: { $sum: 1 },
                seats: { $sum: { $size: '$seats' } },
            },
        },
        { $sort: { revenue: -1, bookings: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'movies',
                localField: '_id',
                foreignField: '_id',
                as: 'movie',
            },
        },
        { $unwind: '$movie' },
        {
            $project: {
                _id: 0,
                movieId: '$movie._id',
                title: '$movie.title',
                posterUrl: '$movie.posterUrl',
                revenue: 1,
                bookings: 1,
                seats: 1,
            },
        },
    ]);

    res.json({ items: rows });
};

// @desc    List bookings (admin)
// @route   GET /api/admin/bookings
// @access  Private/Admin
const listBookings = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status) : null;

    const filter = status ? { status } : {};
    const [items, total] = await Promise.all([
        Booking.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email role')
            .populate({
                path: 'showtime',
                populate: { path: 'movie theater screen', select: 'title name name' },
            }),
        Booking.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
};

module.exports = {
    getAdminStats,
    getRevenueSeries,
    getTopMovies,
    listBookings,
};
