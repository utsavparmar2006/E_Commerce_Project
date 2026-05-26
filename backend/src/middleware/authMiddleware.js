import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

/**
 * Protect middleware: Verifies JWT token from Authorization header and attaches the user
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Format: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token string
      token = req.headers.authorization.split(' ')[1];

      // Decode the token and verify signature using the Access Token Secret
      const decoded = jwt.verify(token, env.accessTokenSecret);

      // Fetch the user from DB (excluding password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Check if user is blocked (mapped to database.txt 'isBlocked' flag)
      if (user.isBlocked) {
        res.status(403);
        throw new Error('This user account has been suspended/blocked');
      }

      // Attach user object to request
      req.user = user;
      next();
    } catch (error) {
      console.error(`Auth Middleware Error: ${error.message}`);
      res.status(401);
      next(new Error('Not authorized, token validation failed'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token provided'));
  }
};

/**
 * Admin middleware: Limits access to users with role === 'admin'
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    next(new Error('Access denied. Administrator privileges required.'));
  }
};

export default { protect, adminOnly };
