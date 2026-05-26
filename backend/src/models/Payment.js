import mongoose from 'mongoose';

/**
 * Payments collection — stores Razorpay transaction records.
 * COD orders do NOT create a Payment document.
 */
const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
    },
    paymentGateway: {
      type: String,
      enum: ['Razorpay', 'Stripe'],
      required: true,
    },
    // Razorpay payment ID returned after user completes payment
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
    },
    // The Razorpay order_id we created before opening modal
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay Order ID is required'],
    },
    // Amount stored in rupees (NOT paise) for readability
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Pending',
    },
    // Full raw response from Razorpay (for auditing)
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
