import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import passport from '../config/passport';
import { prisma } from '../config/db';
import { Session } from '../models/Session';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  TokenPayload,
} from '../utils/jwt';
import { authenticate, getAuthUser } from '../middleware/auth';

const router = Router();

// ─── Validation Schemas ───
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Helper: Create tokens and session ───
async function createTokensAndSession(
  user: { id: string; email: string; username: string; onboarded: boolean },
  req: Request,
  res: Response
) {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store hashed refresh token in MongoDB with TTL
  await Session.create({
    userId: user.id,
    refreshToken: hashToken(refreshToken),
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.socket.remoteAddress || '',
    expiresAt: getRefreshTokenExpiry(),
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      onboarded: user.onboarded,
    },
  });
}

// ─── POST /api/auth/register ───
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { fullName, email, username, password } = parsed.data;

    // Check existing user
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      res.status(409).json({ error: `${field} already exists.` });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user + profile
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        profile: {
          create: {
            displayName: fullName,
          },
        },
      },
    });

    await createTokensAndSession(user, req, res);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/auth/login ───
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    await createTokensAndSession(user, req, res);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/auth/refresh ───
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required.' });
      return;
    }

    // Verify the JWT signature
    const payload = verifyRefreshToken(refreshToken);

    // Check if hashed token exists in MongoDB
    const hashed = hashToken(refreshToken);
    const session = await Session.findOne({ refreshToken: hashed });
    if (!session) {
      res.status(401).json({ error: 'Invalid refresh token.' });
      return;
    }

    // Delete the used session (rotation)
    await Session.deleteOne({ _id: session._id });

    // Fetch latest user data
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    await createTokensAndSession(user, req, res);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
});

// ─── GET /api/auth/me ───
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: getAuthUser(req).userId },
      include: { profile: true, onboarding: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      onboarded: user.onboarded,
      profile: user.profile,
      onboarding: user.onboarding,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/auth/logout ───
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await Session.deleteOne({ refreshToken: hashToken(refreshToken) });
    }
    // Optionally: delete all sessions for this user
    // await Session.deleteMany({ userId: req.user!.userId });
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── OAuth: Google ───
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req: Request, res: Response) => {
    const user = req.user as any;
    const payload: TokenPayload = { userId: user.id, email: user.email, username: user.username };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await Session.create({
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
      expiresAt: getRefreshTokenExpiry(),
    });
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&onboarded=${user.onboarded}`);
  }
);

// ─── OAuth: GitHub ───
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req: Request, res: Response) => {
    const user = req.user as any;
    const payload: TokenPayload = { userId: user.id, email: user.email, username: user.username };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await Session.create({
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
      expiresAt: getRefreshTokenExpiry(),
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&onboarded=${user.onboarded}`);
  }
);

// ─── OAuth: Microsoft ───
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'], session: false }));

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req: Request, res: Response) => {
    const user = req.user as any;
    const payload: TokenPayload = { userId: user.id, email: user.email, username: user.username };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await Session.create({
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
      expiresAt: getRefreshTokenExpiry(),
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&onboarded=${user.onboarded}`);
  }
);

export default router;
