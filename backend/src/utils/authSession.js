import { env } from '../config/env.js';
import { generateAccessToken, generateRefreshToken } from './generateToken.js';

export const buildAuthResponse = (user, accessToken) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  isVerified: user.isVerified,
  isBlocked: user.isBlocked,
  accessToken,
});

export const createAuthTokens = (userId) => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId),
});

export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: env.isProduction,
    sameSite: 'strict',
  });
};
