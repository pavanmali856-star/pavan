const Payment = require('../models/Payment');

// @desc    Mock create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
    const { amount, provider = 'mock_stripe', currency = 'INR', metadata = {} } = req.body;

    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be > 0' });
    }

    // Mocking delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const clientSecret = 'mock_client_secret_' + Date.now();
    const paymentId = 'PAY_' + Date.now();

    const payment = await Payment.create({
        user: req.user._id,
        provider,
        amount: Number(amount),
        currency,
        status: 'requires_payment_method',
        clientSecret,
        providerPaymentId: paymentId,
        metadata,
    });

    res.json({
        clientSecret: payment.clientSecret,
        paymentId: payment.providerPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
    });
};

// @desc    Mock verify payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
    const { paymentId, success = true } = req.body;

    const payment = await Payment.findOne({ providerPaymentId: paymentId, user: req.user._id });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.status = success ? 'paid' : 'failed';
    await payment.save();

    res.json({
        success: payment.status === 'paid',
        paymentId: payment.providerPaymentId,
        status: payment.status,
    });
};

module.exports = {
    createPaymentIntent,
    verifyPayment,
};
