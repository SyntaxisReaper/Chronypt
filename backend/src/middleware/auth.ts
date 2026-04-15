import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

/**
 * JWT authentication middleware
 * Expects: Authorization: Bearer <token>
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken as string | undefined;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined;
  const token = bearerToken || cookieToken;

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    // Attach to req using a custom property to avoid Passport type conflicts
    (req as any).authUser = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Helper to get the authenticated user from request
 */
export function getAuthUser(req: Request): TokenPayload {
  return (req as any).authUser;
}
