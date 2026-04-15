import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: string;
  refreshToken: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true, index: true },
    refreshToken: { type: String, required: true, unique: true },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes documents when expiresAt is reached
// The background TTL monitor runs approximately every 60 seconds
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
