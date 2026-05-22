import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ─── Prisma (PostgreSQL) ───
// Re-use a single PrismaClient across serverless invocations via globalThis cache
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  // In dev, attach to global to survive HMR restarts
  globalThis.__prisma = prisma;
}

// ─── Mongoose (MongoDB) — serverless-safe connection caching ───
// We track connection state on the module-level cached object so that
// warm Vercel Lambda instances reuse the existing connection instead of
// opening a new one on every request.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__mongoose ?? { conn: null, promise: null };
globalThis.__mongoose = cached;

export async function connectMongoDB(): Promise<void> {
  // Already connected — reuse
  if (cached.conn) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        // Recommended settings for serverless
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log('✅ MongoDB connected');
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so next invocation retries
    cached.promise = null;
    // Don't process.exit() in serverless — throw instead so Vercel logs it
    throw err;
  }
}

// ─── Graceful shutdown (local dev only) ───
export async function disconnectDatabases(): Promise<void> {
  await prisma.$disconnect();
  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;
  console.log('🔌 Databases disconnected');
}
