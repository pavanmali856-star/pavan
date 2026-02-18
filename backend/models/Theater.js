const mongoose = require('mongoose');

const theaterSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a theater name'],
            trim: true,
        },
        location: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
        },
        screens: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Screen',
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // If we want to support theater owners in future
        },
    },
    {
        timestamps: true,
    }
);

const Theater = mongoose.model('Theater', theaterSchema);

module.exports = Theater;
