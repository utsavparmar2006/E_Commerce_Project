import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  validateCoupon,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = express.Router();

// --- Customer Order Operations ---
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.post('/coupon/validate', protect, validateCoupon);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);

// --- Administrative Dashboard Operations ---
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
