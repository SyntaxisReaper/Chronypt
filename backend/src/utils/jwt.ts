import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const JWT_SECRET = getRequiredEnv('JWT_SECRET');
const JWT_REFRESH_SECRET = getRequiredEnv('JWT_REFRESH_SECRET');
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

function parseDurationMs(duration: string): number {
  const match = duration.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}. Use values like 15m, 7d, 1h.`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (unit === 's') return value * 1000;
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  return value * 24 * 60 * 60 * 1000;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

/**
 * Generate a short-lived access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  const opts: SignOptions = { expiresIn: ACCESS_EXPIRY as SignOptions['expiresIn'] };
  return jwt.sign(payload as any, JWT_SECRET, opts);
}

/**
 * Generate a long-lived refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const opts: SignOptions = { expiresIn: REFRESH_EXPIRY as SignOptions['expiresIn'] };
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
  return new Date(Date.now() + parseDurationMs(REFRESH_EXPIRY));
}
