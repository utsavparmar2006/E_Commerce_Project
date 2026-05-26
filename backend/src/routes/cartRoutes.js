import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';

const router = express.Router();

// Apply auth middleware globally to all shopping cart routes
router.use(protect);

router
  .route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router
  .route('/:productId')
  .put(updateCartItem)
  .delete(removeCartItem);

export default router;
