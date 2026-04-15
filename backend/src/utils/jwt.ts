import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

/**
 * Generate a short-lived access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  const opts: SignOptions = { expiresIn: ACCESS_EXPIRY as any };
  return jwt.sign(payload as any, JWT_SECRET, opts);
}

/**
 * Generate a long-lived refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const opts: SignOptions = { expiresIn: REFRESH_EXPIRY as any };
  return jwt.sign(payload as any, JWT_REFRESH_SECRET, opts);
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}

/**
 * Hash a refresh token for secure storage in MongoDB
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate refresh token expiry date for MongoDB TTL
 */
export function getRefreshTokenExpiry(): Date {
  const match = REFRESH_EXPIRY.match(/(\d+)/);
  const days = match ? parseInt(match[1], 10) : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
