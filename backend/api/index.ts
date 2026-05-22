/**
 * Vercel Serverless Entry Point
 *
 * Vercel calls this file for every request.
 * We connect to MongoDB here (with caching so we reuse the
 * connection across warm invocations) then hand off to Express.
 */
import { connectMongoDB } from '../src/config/db';
import app from '../src/app';

// Track whether MongoDB is already connected in this Lambda instance
let mongoReady = false;

// Vercel expects a default export that is a request handler
export default async function handler(req: any, res: any) {
  if (!mongoReady) {
    await connectMongoDB();
    mongoReady = true;
  }
  // Delegate to Express
  return app(req, res);
}
