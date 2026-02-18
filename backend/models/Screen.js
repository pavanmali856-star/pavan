const mongoose = require('mongoose');

const screenSchema = mongoose.Schema(
    {
        theater: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Theater',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Please add a screen name (e.g., Screen 1, IMAX)'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['Standard', 'IMAX', '3D', '4DX', 'Gold'],
            default: 'Standard',
        },
        capacity: {
            type: Number,
            required: true,
        },
        seatLayout: [
            {
                row: String, // e.g., 'A'
                seats: [
                    {
                        number: Number, // e.g., 1
                        type: {
                            type: String,
                            enum: ['Standard', 'Premium', 'Recliner', 'Aisle'],
                            default: 'Standard',
                        },
                        priceModifier: {
                            type: Number,
                            default: 0, // Extra cost for this seat
                        },
                        isAvailable: {
                            type: Boolean,
                            default: true, // Used for layout purposes (e.g., gaps)
                        },
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Screen = mongoose.model('Screen', screenSchema);

module.exports = Screen;
