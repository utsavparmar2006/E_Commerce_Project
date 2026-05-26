import User from '../models/User.js';
import Order from '../models/Order.js';
import { escapeRegex } from '../utils/escapeRegex.js';

/**
 * @desc    Get dashboard stats (total users, new today, active, blocked, admins)
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, newToday, blocked, admins, totalOrders, pendingOrders, shippedOrders, deliveredOrders, salesResult] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ role: 'admin' }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'Processing' }),
      Order.countDocuments({ orderStatus: 'Shipped' }),
      Order.countDocuments({ orderStatus: 'Delivered' }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    const totalSales = salesResult[0]?.total || 0;

    res.status(200).json({
      total,
      newToday,
      active: total - blocked,
      blocked,
      admins,
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      totalSales,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with optional search and pagination
 * @route   GET /api/admin/users?search=&page=1&limit=10
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const roleFilter = req.query.role || '';
    const statusFilter = req.query.status || '';

    // Build dynamic filter
    const filter = {};

    if (search) {
      const sanitizedSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    if (roleFilter && ['user', 'admin'].includes(roleFilter)) {
      filter.role = roleFilter;
    }

    if (statusFilter === 'blocked') {
      filter.isBlocked = true;
    } else if (statusFilter === 'active') {
      filter.isBlocked = false;
    }

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      users,
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
 * @desc    Get single user details by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle block / unblock a user
 * @route   PATCH /api/admin/users/:id/block
 * @access  Private/Admin
 */
export const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent admins from blocking themselves or other admins
    if (user.role === 'admin') {
      res.status(403);
      throw new Error('Admin accounts cannot be blocked through this panel');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      message: user.isBlocked
        ? `User "${user.name}" has been blocked.`
        : `User "${user.name}" has been unblocked.`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user permanently
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(403);
      throw new Error('Admin accounts cannot be deleted through this panel');
    }

    await User.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: `User "${user.name}" has been permanently deleted.` });
  } catch (error) {
    next(error);
  }
};
