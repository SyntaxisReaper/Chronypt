import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import passport from './config/passport';
import { connectMongoDB, disconnectDatabases } from './config/db';
import authRoutes from './routes/auth';
import onboardingRoutes from './routes/onboarding';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

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

// ─── Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);

// ─── Health check ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start Server ───
async function start() {
  try {
    await connectMongoDB();
    console.log('✅ Prisma client ready (PostgreSQL)');

    app.listen(PORT, () => {
      console.log(`🚀 Chronypt API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// ─── Graceful shutdown ───
process.on('SIGINT', async () => {
  await disconnectDatabases();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabases();
  process.exit(0);
});

start();
