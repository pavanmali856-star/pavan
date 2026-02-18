const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
    provider: {
      type: String,
      enum: ['mock_stripe', 'mock_razorpay'],
      default: 'mock_stripe',
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'requires_payment_method', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    clientSecret: { type: String },
    providerPaymentId: { type: String, index: true }, // e.g. "PAY_..."
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);

