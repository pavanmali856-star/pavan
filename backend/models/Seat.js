const mongoose = require('mongoose');

/**
 * Seats collection (static layout per screen).
 * Dynamic availability is tracked per showtime inside `Showtime.seats`.
 * This split keeps showtime reads fast while still providing a dedicated Seats module.
 */
const seatSchema = mongoose.Schema(
  {
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: true,
      index: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: true,
      index: true,
    },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    type: {
      type: String,
      enum: ['Standard', 'Premium', 'Recliner', 'Aisle'],
      default: 'Standard',
    },
    priceModifier: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

seatSchema.index({ screen: 1, row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);

