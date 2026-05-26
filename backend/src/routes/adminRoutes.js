import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  toggleBlockUser,
  deleteUser,
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/block', toggleBlockUser);
router.delete('/users/:id', deleteUser);

export default router;
