const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        showtime: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Showtime',
            required: true,
        },
        seats: [
            {
                row: String,
                number: Number,
                price: Number,
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        paymentId: {
            type: String, // Mock payment ID
        },
        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Cancelled'],
            default: 'Pending',
        },
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
