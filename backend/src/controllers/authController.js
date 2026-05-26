import User from '../models/User.js';
import { generateAccessToken } from '../utils/generateToken.js';
import {
  buildAuthResponse,
  clearRefreshTokenCookie,
  createAuthTokens,
  setRefreshTokenCookie,
} from '../utils/authSession.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  const { name, email, password, phone, avatar } = req.body;

  try {
    // 1. Basic validation
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    // 2. Check for duplicate email
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('Email is already registered');
    }

    // 3. Create user in database (automatically hashes password in pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      avatar: avatar || null,
    });

    if (user) {
      // 4. Generate Access and Refresh Tokens
      const { accessToken, refreshToken } = createAuthTokens(user._id);

      // 5. Store Refresh Token in secure HTTP-Only Cookie
      setRefreshTokenCookie(res, refreshToken);

      // 6. Return Access Token in JSON response body
      res.status(201).json(buildAuthResponse(user, accessToken));
    } else {
      res.status(400);
      throw new Error('Invalid user data provided');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get tokens (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Basic validation
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide both email and password');
    }

    // 2. Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // 3. Check if user is blocked
    if (user.isBlocked) {
      res.status(403);
      throw new Error('This user account has been suspended/blocked');
    }

    // 4. Verify password using Mongoose model method
    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      // 5. Generate Access and Refresh Tokens
      const { accessToken, refreshToken } = createAuthTokens(user._id);

      // 6. Store Refresh Token in secure HTTP-Only Cookie
      setRefreshTokenCookie(res, refreshToken);

      // 7. Return Access Token in JSON response body
      res.status(200).json(buildAuthResponse(user, accessToken));
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token using refresh token stored in cookie
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = async (req, res, next) => {
  // Retrieve the refresh token from parsed cookies
  const refreshToken = req.cookies?.refreshToken;

  try {
    if (!refreshToken) {
      res.status(401);
      throw new Error('Access denied. Session expired or missing refresh token');
    }

    // Verify the Refresh Token signature using REFRESH_TOKEN_SECRET
    const decoded = jwt.verify(refreshToken, env.refreshTokenSecret);

    // Look up user
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('Unauthorized. User not found.');
    }

    if (user.isBlocked) {
      res.status(403);
      throw new Error('Suspended user account cannot perform this action');
    }

    // Generate a fresh access token (1d validity)
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      status: 'success',
      accessToken: newAccessToken,
    });
  } catch (error) {
    // Catch expired refresh token error specifically or other errors
    res.status(401);
    next(new Error('Session invalid or expired. Please sign in again.'));
  }
};

/**
 * @desc    Logout user & wipe cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = async (req, res, next) => {
  try {
    // Clear cookie by resetting value and expiring it immediately
    clearRefreshTokenCookie(res);

    res.status(200).json({
      status: 'success',
      message: 'User logged out successfully and secure session cleared',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    // 1. Fetch user from DB using req.user._id (attached by protect middleware)
    const user = await User.findById(req.user._id);

    if (user) {
      // 2. Dynamically update fields if sent in body
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

      // 3. Update password if sent (will trigger Mongoose hashing pre-save hook)
      if (req.body.password) {
        user.password = req.body.password;
      }

      // 4. Save changes
      const updatedUser = await user.save();

      // 5. Generate fresh access token and return profile details
      res.status(200).json(buildAuthResponse(updatedUser, generateAccessToken(updatedUser._id)));
    } else {
      res.status(404);
      throw new Error('User profile not found');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404);
      throw new Error('User profile not found');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate/Register user via Google Sign-In
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res, next) => {
  const { idToken } = req.body;

  try {
    if (!idToken) {
      res.status(400);
      throw new Error('Google ID token is required');
    }

    // 1. Verify Google token integrity
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      res.status(400);
      throw new Error('Invalid Google ID token');
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      res.status(400);
      throw new Error('Google account is missing an email address');
    }

    // 2. Check if user already exists by email
    let user = await User.findOne({ email });

    if (user) {
      // Check if user is blocked
      if (user.isBlocked) {
        res.status(403);
        throw new Error('This user account has been suspended/blocked');
      }

      // If user exists but has no googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        await user.save();
      }
    } else {
      // 3. User does not exist -> Automatically register (Signup)
      // Generate a secure secure random password
      const randomPassword = crypto.randomBytes(16).toString('hex');
      
      user = await User.create({
        name,
        email,
        password: randomPassword,
        googleId,
        avatar: picture || null,
        isVerified: true, // Google email is verified
      });
    }

    // 4. Generate Tokens & Session Cookie
    const { accessToken, refreshToken } = createAuthTokens(user._id);
    setRefreshTokenCookie(res, refreshToken);

    // 5. Send verified login payload
    res.status(200).json(buildAuthResponse(user, accessToken));
  } catch (error) {
    next(error);
  }
};

export default { registerUser, loginUser, googleAuth, refreshAccessToken, logoutUser, updateUserProfile, getUserProfile };
