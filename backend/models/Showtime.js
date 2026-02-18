const mongoose = require('mongoose');

const showtimeSchema = mongoose.Schema(
    {
        movie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie',
            required: true,
        },
        theater: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Theater',
            required: true,
        },
        screen: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Screen',
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        seats: [
            {
                row: String,
                number: Number,
                // IMPORTANT: `type` is reserved in Mongoose schema definitions.
                // To keep a seat field named `type`, it must be nested as `{ type: String }`.
                type: { type: String }, // Standard, Premium, etc.
                price: Number,
                status: {
                    type: String,
                    enum: ['Available', 'Booked', 'Locked'],
                    default: 'Available',
                },
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                }, // If booked/locked
                lockedAt: Date, // For releasing locks
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Showtime = mongoose.model('Showtime', showtimeSchema);

module.exports = Showtime;
