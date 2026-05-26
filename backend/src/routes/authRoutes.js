import express from 'express';
import { registerUser, loginUser, googleAuth, refreshAccessToken, logoutUser, updateUserProfile, getUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

// Private/Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
