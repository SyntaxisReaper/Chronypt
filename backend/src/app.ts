import express from 'express';
import type { CookieOptions } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import passport from './config/passport';
import authRoutes from './routes/auth';
import onboardingRoutes from './routes/onboarding';
import { createRateLimiter } from './middleware/rateLimit';

dotenv.config();

const app = express();
const authRateLimiter = createRateLimiter(30, 10 * 60 * 1000);

// ─── Middleware ───
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ─── Root route (health / API info) ───
app.get('/', (_req, res) => {
  res.json({
    name: 'Chronypt API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/onboarding', onboardingRoutes);

// ─── Health check ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 fallback ───
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
