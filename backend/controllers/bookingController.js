const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Payment = require('../models/Payment');
const { getIO } = require('../socket');
const { releaseExpiredLocks, getLockTtlMs, isLockExpired } = require('../utils/seatLocks');

// @desc    Lock seats (temporary reservation)
// @route   POST /api/bookings/lock
// @access  Private
const lockSeats = async (req, res) => {
    const { showtimeId, seats } = req.body; // seats: [{ row, number }]

    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        // Release expired locks before checking
        const released = releaseExpiredLocks(showtime);
        if (released.length) {
            try {
                getIO().to(`showtime:${showtimeId}`).emit('seats:released', { showtimeId, seats: released });
            } catch (_) {}
        }

        // Check availability
        const unavailableSeats = seats.filter((reqSeat) => {
            const seat = showtime.seats.find(
                (s) => s.row === reqSeat.row && s.number === reqSeat.number
            );
            if (!seat) return true;
            if (seat.status === 'Booked') return true;
            if (seat.status === 'Available') return false;
            if (seat.status === 'Locked') {
                // Treat expired locks as available (should already be released, but double-safe)
                if (isLockExpired(seat.lockedAt)) return false;
                return String(seat.user) !== String(req.user._id); // allow refresh
            }
            return true;
        });

        if (unavailableSeats.length > 0) {
            return res.status(400).json({ message: 'Some seats are already booked or locked', unavailableSeats });
        }

        // Lock seats
        const now = Date.now();
        seats.forEach((reqSeat) => {
            const seatIndex = showtime.seats.findIndex(
                (s) => s.row === reqSeat.row && s.number === reqSeat.number
            );
            if (seatIndex > -1) {
                showtime.seats[seatIndex].status = 'Locked';
                showtime.seats[seatIndex].user = req.user._id;
                showtime.seats[seatIndex].lockedAt = now;
            }
        });

        await showtime.save();
        try {
            getIO().to(`showtime:${showtimeId}`).emit('seats:locked', {
                showtimeId,
                seats,
                byUserId: String(req.user._id),
                ttlMs: getLockTtlMs(),
                lockedAt: now,
            });
        } catch (_) {}
        res.json({ message: 'Seats locked successfully', seats, ttlMs: getLockTtlMs() });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Unlock seats (release locks held by current user)
// @route   POST /api/bookings/unlock
// @access  Private
const unlockSeats = async (req, res) => {
    const { showtimeId, seats } = req.body;

    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

        const released = [];
        (seats || []).forEach((reqSeat) => {
            const seatIndex = showtime.seats.findIndex((s) => s.row === reqSeat.row && s.number === reqSeat.number);
            if (seatIndex === -1) return;
            const seat = showtime.seats[seatIndex];
            if (seat.status !== 'Locked') return;
            if (String(seat.user) !== String(req.user._id)) return;

            showtime.seats[seatIndex].status = 'Available';
            showtime.seats[seatIndex].user = null;
            showtime.seats[seatIndex].lockedAt = null;
            released.push({ row: seat.row, number: seat.number });
        });

        await showtime.save();
        try {
            getIO().to(`showtime:${showtimeId}`).emit('seats:released', { showtimeId, seats: released });
        } catch (_) {}

        res.json({ message: 'Seats unlocked', seats: released });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create new booking (Confirm booking)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    const { showtimeId, seats, paymentId } = req.body;

    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        // Release expired locks before booking
        const released = releaseExpiredLocks(showtime);
        if (released.length) {
            try {
                getIO().to(`showtime:${showtimeId}`).emit('seats:released', { showtimeId, seats: released });
            } catch (_) {}
        }

        // Verify seats are locked by user OR available (direct book without lock)
        // For now, let's assume they MUST be locked by user or available.

        let totalAmount = 0;
        const finalSeats = [];

        for (const reqSeat of seats) {
            const seatIndex = showtime.seats.findIndex(
                (s) => s.row === reqSeat.row && s.number === reqSeat.number
            );

            if (seatIndex === -1) {
                return res.status(400).json({ message: `Seat ${reqSeat.row}${reqSeat.number} invalid` });
            }

            const seat = showtime.seats[seatIndex];

            // Check if seat is available OR locked by THIS user
            const isLockedByMe =
                seat.status === 'Locked' &&
                String(seat.user) === String(req.user._id) &&
                !isLockExpired(seat.lockedAt);
            const isAvailable = seat.status === 'Available';

            if (!isAvailable && !isLockedByMe) {
                return res.status(400).json({ message: `Seat ${seat.row}${seat.number} is not available` });
            }

            // Update seat status to Booked
            showtime.seats[seatIndex].status = 'Booked';
            showtime.seats[seatIndex].user = req.user._id;
            showtime.seats[seatIndex].lockedAt = null; // Clear lock timer

            totalAmount += seat.price;
            finalSeats.push({
                row: seat.row,
                number: seat.number,
                price: seat.price,
            });
        }

        await showtime.save();

        // Attach payment if present (mock verification is handled separately)
        let payment = null;
        if (paymentId) {
            payment = await Payment.findOneAndUpdate(
                { providerPaymentId: paymentId, user: req.user._id },
                { status: 'paid' },
                { new: true }
            );
        }

        const booking = new Booking({
            user: req.user._id,
            showtime: showtimeId,
            seats: finalSeats,
            totalAmount,
            paymentId: paymentId || (payment ? payment.providerPaymentId : 'MOCK_PAYMENT'),
            status: 'Confirmed',
        });

        const createdBooking = await booking.save();
        if (payment && !payment.booking) {
            payment.booking = createdBooking._id;
            await payment.save();
        }
        try {
            getIO().to(`showtime:${showtimeId}`).emit('seats:booked', {
                showtimeId,
                seats: finalSeats.map((s) => ({ row: s.row, number: s.number })),
                byUserId: String(req.user._id),
            });
        } catch (_) {}
        res.status(201).json(createdBooking);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'showtime',
                populate: { path: 'movie theater screen', select: 'title name name' }
            });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    lockSeats,
    unlockSeats,
    getMyBookings,
};
