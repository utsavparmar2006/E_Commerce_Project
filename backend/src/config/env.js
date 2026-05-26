import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const requiredEnv = [
  'MONGO_URI',
  'ACCESS_TOKEN_SECRET',
  'ACCESS_TOKEN_EXPIRY',
  'REFRESH_TOKEN_SECRET',
  'REFRESH_TOKEN_EXPIRY',
];

// Simple validation to ensure crucial variables exist
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`\x1b[31m%s\x1b[0m`, `Configuration Error: Missing required environment variable [${key}]`);
    process.exit(1);
  }
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
  frontendUrls: (process.env.FRONTEND_URLS ||
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:4173,http://127.0.0.1:4173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
};

export default env;
