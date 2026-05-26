import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generates a short-lived Access Token
 * @param {string} id - The MongoDB user ID
 * @returns {string} The signed JWT access token
 */
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiry, // Matches 'ACCESS_TOKEN_EXPIRY' in env (1d)
  });
};

/**
 * Generates a long-lived Refresh Token
 * @param {string} id - The MongoDB user ID
 * @returns {string} The signed JWT refresh token
 */
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiry, // Matches 'REFRESH_TOKEN_EXPIRY' in env (10d)
  });
};

export default { generateAccessToken, generateRefreshToken };
