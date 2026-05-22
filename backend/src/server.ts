import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectMongoDB, disconnectDatabases } from './config/db';

const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Start Server (local dev only — Vercel uses api/index.ts) ───
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
