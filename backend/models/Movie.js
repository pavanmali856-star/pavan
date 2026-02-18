const mongoose = require('mongoose');

const movieSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a movie title'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
        },
        genre: {
            type: [String],
            required: [true, 'Please add at least one genre'],
        },
        duration: {
            type: Number, // in minutes
            required: [true, 'Please add duration in minutes'],
        },
        language: {
            type: [String],
            required: [true, 'Please add languages'],
        },
        releaseDate: {
            type: Date,
            required: [true, 'Please add release date'],
        },
        posterUrl: {
            type: String,
            required: [true, 'Please add a poster URL'],
        },
        trailerUrl: {
            type: String,
            required: [true, 'Please add a trailer URL'],
        },
        rating: {
            type: Number,
            default: 0,
        },
        reviews: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                rating: Number,
                comment: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Avoid MongoDB text index language_override collision with our `language: string[]` field.
movieSchema.index(
    { title: 'text', description: 'text' },
    { default_language: 'english', language_override: 'textLanguage' }
);
movieSchema.index({ rating: -1, createdAt: -1 });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
