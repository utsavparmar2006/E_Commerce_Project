import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../controllers/paymentController.js';

const router = express.Router();

router.get('/razorpay/config', getRazorpayConfig);

/**
 * POST /api/payments/razorpay/create-order
 * Creates a Razorpay order before the payment modal opens.
 * Requires JWT auth.
 */
router.post('/razorpay/create-order', protect, createRazorpayOrder);

/**
 * POST /api/payments/razorpay/verify
 * Cryptographically verifies Razorpay signature post-payment.
 * Marks the order as paid and records the transaction.
 * Requires JWT auth.
 */
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

export default router;
