import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController.js';

const router = express.Router();

// Apply authorization guard globally for all address management routes
router.use(protect);

router.route('/')
  .get(getAddresses)
  .post(createAddress);

router.route('/:id')
  .put(updateAddress)
  .delete(deleteAddress);

router.route('/:id/default')
  .patch(setDefaultAddress);

export default router;
