import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';

const getRazorpayConfigurationError = () => {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    const error = new Error(
      'Razorpay is not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
    );
    error.statusCode = 500;
    return error;
  }

  if (env.razorpayKeyId === env.razorpayKeySecret) {
    const error = new Error(
      'Razorpay server configuration looks invalid. RAZORPAY_KEY_SECRET should be your secret key, not the public Key ID.',
    );
    error.statusCode = 500;
    return error;
  }

  if (/^rzp_(test|live)_/i.test(env.razorpayKeySecret)) {
    const error = new Error(
      'Razorpay server configuration looks invalid. Please paste the secret key from Razorpay Dashboard, not another Key ID.',
    );
    error.statusCode = 500;
    return error;
  }

  return null;
};

const getRazorpayClient = () => {
  const configurationError = getRazorpayConfigurationError();
  if (configurationError) {
    throw configurationError;
  }

  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
};

export const getRazorpayConfig = async (req, res) => {
  const configurationError = getRazorpayConfigurationError();

  if (configurationError) {
    return res.status(200).json({
      available: false,
      message: configurationError.message,
    });
  }

  return res.status(200).json({
    available: true,
    message: 'Razorpay is configured.',
  });
};

/**
 * @desc    Create a Razorpay order before opening the payment modal
 * @route   POST /api/payments/razorpay/create-order
 * @access  Private
 *
 * Flow:
 *  1. Validate the LUXE order exists and belongs to this user
 *  2. Create a Razorpay order (in paise = amount × 100)
 *  3. Return Razorpay order details + public Key ID to frontend
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400);
      throw new Error('Order ID is required to initiate payment.');
    }

    // 1. Fetch our LUXE order from DB and verify ownership
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Unauthorised access to this order.');
    }

    if (order.isPaid) {
      res.status(400);
      throw new Error('This order has already been paid.');
    }

    // 2. Create the Razorpay order (amount in paise)
    const amountInPaise = Math.round(order.totalPrice * 100);

    const razorpay = getRazorpayClient();

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        luxe_order_id: order._id.toString(),
        user_email: req.user.email,
      },
    });

    // 3. Return the Razorpay order details to the frontend
    res.status(200).json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,          // in paise
      currency: razorpayOrder.currency,
      key: env.razorpayKeyId,                // public key — safe to send
      luxe_order_id: order._id.toString(),
      prefill: {
        name: req.user.name,
        email: req.user.email,
        contact: req.user.phone || '',
      },
    });
  } catch (error) {
    if (error.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    if (error?.error?.description) {
      res.status(502);
      return next(new Error(`Razorpay could not create the payment order: ${error.error.description}`));
    }

    next(error);
  }
};

/**
 * @desc    Verify Razorpay signature after successful payment
 * @route   POST /api/payments/razorpay/verify
 * @access  Private
 *
 * Flow:
 *  1. Reconstruct expected signature using HMAC-SHA256
 *  2. Compare with Razorpay's returned signature (fraud prevention)
 *  3. On match → update Order to isPaid + create Payment record
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      luxe_order_id,
    } = req.body;

    // 1. Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !luxe_order_id) {
      res.status(400);
      throw new Error('Missing required Razorpay verification fields.');
    }

    // 2. Reconstruct HMAC-SHA256 signature
    //    Razorpay spec: sign( razorpay_order_id + "|" + razorpay_payment_id )
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.razorpayKeySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400);
      throw new Error('Payment verification failed. Signature mismatch — possible tampering detected.');
    }

    // 3. Fetch and update our LUXE order
    const order = await Order.findById(luxe_order_id);

    if (!order) {
      res.status(404);
      throw new Error('LUXE order not found during payment verification.');
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentStatus = 'Paid';
    const updatedOrder = await order.save();

    // 4. Create the Payment audit record in MongoDB
    await Payment.create({
      user: req.user._id,
      order: order._id,
      paymentGateway: 'Razorpay',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      amount: order.totalPrice,
      currency: 'INR',
      status: 'Success',
      gatewayResponse: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    });

    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed.',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
