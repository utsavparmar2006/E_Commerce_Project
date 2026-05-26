import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import {
  deductInventoryForItems,
  ensureProductsAvailable,
  restoreInventoryForItems,
} from '../utils/orderInventory.js';

/**
 * @desc    Create a new customer order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountAmount,
      totalPrice,
      couponCode,
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400);
      throw new Error('No items in this order request');
    }

    // 1. Verify and deduct product inventory stock bounds
    try {
      await ensureProductsAvailable(items, session);
    } catch (error) {
      res.status(error.message.startsWith('Insufficient inventory stock') ? 400 : 404);
      throw error;
    }

    // 2. Perform database deductions and increments
    await deductInventoryForItems(items, session);

    // 3. Construct and save the order in database
    const orderResults = await Order.create(
      [
        {
          user: req.user._id,
          items,
          shippingAddress,
          paymentMethod: paymentMethod || 'COD',
          paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
          itemsPrice,
          taxPrice: taxPrice || 0,
          shippingPrice: shippingPrice || 0,
          discountAmount: discountAmount || 0,
          totalPrice,
          couponCode: couponCode || '',
          isPaid: false,
        },
      ],
      { session }
    );

    const order = orderResults[0];

    // 4. For COD, the order is finalized immediately so we can clear the cart.
    // Online payment carts are cleared only after successful payment verification.
    if (paymentMethod === 'COD') {
      const cart = await Cart.findOne({ user: req.user._id }).session(session);
      if (cart) {
        cart.items = [];
        await cart.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * @desc    Get logged in user's order logs
 * @route   GET /api/orders/my
 * @access  Private
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Auth guard: User placed the order OR user is an administrator
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Unauthorized access to this order record');
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an order (only if still in Processing stage)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.orderStatus !== 'Processing') {
      res.status(400);
      throw new Error(`Orders in "${order.orderStatus}" state cannot be cancelled.`);
    }

    order.orderStatus = 'Cancelled';
    order.paymentStatus = 'Failed';
    await order.save();

    // Restore product stock and decrease sold counts
    await restoreInventoryForItems(order.items);

    res.status(200).json({ message: 'Order has been successfully cancelled.', order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate checkout coupon codes
 * @route   POST /api/orders/coupon/validate
 * @access  Private
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, itemsPrice } = req.body;
    const priceVal = Number(itemsPrice);

    if (!code) {
      res.status(400);
      throw new Error('Coupon code is required');
    }

    const codeUpper = code.trim().toUpperCase();

    if (codeUpper === 'LUXE10') {
      const discount = Math.round(priceVal * 0.1);
      return res.status(200).json({
        isValid: true,
        discount,
        message: 'LUXE10 Applied! 10% discount subtracted from your total.',
      });
    }

    if (codeUpper === 'WELCOME500') {
      if (priceVal >= 2500) {
        return res.status(200).json({
          isValid: true,
          discount: 500,
          message: 'WELCOME500 Applied! Flat ₹500 discount subtracted from your total.',
        });
      } else {
        res.status(400);
        throw new Error('WELCOME500 requires a minimum cart size of ₹2,500.');
      }
    }

    res.status(400);
    throw new Error('Invalid or expired coupon code.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (with optional search, pagination, and status filters)
 * @route   GET /api/orders?search=&status=&page=1&limit=10
 * @access  Private/Admin
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status || '';
    const search = req.query.search?.trim() || '';

    const filter = {};

    if (statusFilter) {
      filter.orderStatus = statusFilter;
    }

    // Dynamic user lookup for searches
    if (search) {
      // Find users matching search name/email
      const matchedUsers = await req.user.constructor.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchedUsers.map(u => u._id);
      
      // Search by matched user OR by exact Order MongoId if valid hex
      const isHexId = /^[0-9a-fA-F]{24}$/.test(search);
      if (isHexId) {
        filter.$or = [
          { user: { $in: userIds } },
          { _id: search },
        ];
      } else {
        filter.user = { $in: userIds };
      }
    }

    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order statuses (shipping and payments)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const { orderStatus, paymentStatus } = req.body;
    const oldStatus = order.orderStatus;

    if (orderStatus) {
      order.orderStatus = orderStatus;

      if (orderStatus === 'Delivered') {
        order.isPaid = true;
        order.paymentStatus = 'Paid';
        order.deliveredAt = Date.now();
        if (!order.paidAt) {
          order.paidAt = Date.now();
        }
      }

      if (orderStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
        // Stock restoration for admin cancellation
        order.paymentStatus = 'Failed';
        await restoreInventoryForItems(order.items);
      } else if (oldStatus === 'Cancelled' && orderStatus !== 'Cancelled') {
        // Stock re-deduction for admin un-cancellation
        await deductInventoryForItems(order.items);
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        order.isPaid = true;
        if (!order.paidAt) {
          order.paidAt = Date.now();
        }
      } else if (paymentStatus === 'Failed') {
        order.isPaid = false;
      }
    }

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
};
