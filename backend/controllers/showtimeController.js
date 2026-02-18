const Showtime = require('../models/Showtime');
const Screen = require('../models/Screen');
const Seat = require('../models/Seat');
const { releaseExpiredLocks } = require('../utils/seatLocks');
const { getIO } = require('../socket');

// @desc    Get all showtimes (can filter by movie, theater, date)
// @route   GET /api/showtimes
// @access  Public
const getShowtimes = async (req, res) => {
    const { movie, theater, date } = req.query;
    let query = {};

    if (movie) query.movie = movie;
    if (theater) query.theater = theater;
    if (date) {
        // Simple date filtering (needs refinement for ranges)
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.startTime = { $gte: startDate, $lt: endDate };
    }

    try {
        const showtimes = await Showtime.find(query)
            .populate('movie', 'title')
            .populate('theater', 'name')
            .populate('screen', 'name');
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single showtime and its seat status
// @route   GET /api/showtimes/:id
// @access  Public
const getShowtimeById = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie')
            .populate('theater')
            .populate('screen');

        if (showtime) {
            const released = releaseExpiredLocks(showtime);
            if (released.length) {
                await showtime.save();
                try {
                    getIO().to(`showtime:${showtime._id}`).emit('seats:released', {
                        showtimeId: String(showtime._id),
                        seats: released,
                    });
                } catch (_) {}
            }
            res.json(showtime);
        } else {
            res.status(404).json({ message: 'Showtime not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a showtime
// @route   POST /api/showtimes
// @access  Private/Admin
const createShowtime = async (req, res) => {
    const { movie, theater, screen, startTime, price } = req.body;

    try {
        // Check if screen exists
        const screenDoc = await Screen.findById(screen);
        if (!screenDoc) {
            return res.status(404).json({ message: 'Screen not found' });
        }

        // Initialize seats from Seats collection (preferred) or screen layout fallback
        const initialSeats = [];
        const seatTemplates = await Seat.find({ screen }).lean();
        if (seatTemplates.length > 0) {
            seatTemplates.forEach((s) => {
                if (s.isAvailable === false) return;
                initialSeats.push({
                    row: s.row,
                    number: s.number,
                    type: s.type,
                    price: price + (s.priceModifier || 0),
                    status: 'Available',
                });
            });
        } else {
            (screenDoc.seatLayout || []).forEach((row) => {
                (row.seats || []).forEach((seat) => {
                    if (seat.isAvailable === false) return;
                    initialSeats.push({
                        row: row.row,
                        number: seat.number,
                        type: seat.type,
                        price: price + (seat.priceModifier || 0), // Base price + modifier
                        status: 'Available',
                    });
                });
            });
        }

        const showtime = new Showtime({
            movie,
            theater,
            screen,
            startTime,
            price,
            seats: initialSeats,
        });

        const createdShowtime = await showtime.save();
        res.status(201).json(createdShowtime);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getShowtimes,
    getShowtimeById,
    createShowtime,
};
