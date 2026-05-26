import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Protected routes (Admin only)
router.post('/', protect, adminOnly, createBrand);
router.put('/:id', protect, adminOnly, updateBrand);
router.delete('/:id', protect, adminOnly, deleteBrand);

export default router;
