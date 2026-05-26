import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';

const router = express.Router();

// Apply auth middleware globally to all wishlist routes
router.use(protect);

router.route('/').get(getWishlist);

router
  .route('/:productId')
  .post(addToWishlist)
  .delete(removeFromWishlist);

export default router;
