import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ─── Prisma (PostgreSQL) ───
export const prisma = new PrismaClient();

// ─── Mongoose (MongoDB) ───
export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chronypt';
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// ─── Graceful shutdown ───
export async function disconnectDatabases(): Promise<void> {
  await prisma.$disconnect();
  await mongoose.disconnect();
  console.log('🔌 Databases disconnected');
}
