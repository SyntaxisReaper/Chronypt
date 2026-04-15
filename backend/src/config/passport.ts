import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import dotenv from 'dotenv';

dotenv.config();

// ─── Local Strategy (email + password) ───
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid email or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ─── Google OAuth Strategy ───
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findFirst({
            where: { provider: 'google', providerId: profile.id },
          });
          if (!user) {
            const email = profile.emails?.[0]?.value || `${profile.id}@google.oauth`;
            const username = `google_${profile.id}`;
            user = await prisma.user.create({
              data: {
                email,
                username,
                provider: 'google',
                providerId: profile.id,
                profile: {
                  create: {
                    displayName: profile.displayName || username,
                    avatar: profile.photos?.[0]?.value,
                  },
                },
              },
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy loaded');
}

// ─── GitHub OAuth Strategy ───
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          let user = await prisma.user.findFirst({
            where: { provider: 'github', providerId: profile.id },
          });
          if (!user) {
            const email = profile.emails?.[0]?.value || `${profile.id}@github.oauth`;
            const username = profile.username || `github_${profile.id}`;
            user = await prisma.user.create({
              data: {
                email,
                username,
                provider: 'github',
                providerId: profile.id,
                profile: {
                  create: {
                    displayName: profile.displayName || username,
                    avatar: profile.photos?.[0]?.value,
                  },
                },
              },
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  console.log('✅ GitHub OAuth strategy loaded');
}

// ─── Microsoft OAuth Strategy ───
// passport-microsoft may need specific setup depending on the package version
// This is a placeholder that you can configure once you have MS credentials
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  try {
    // Dynamic import to avoid crash if package has issues
    const MicrosoftStrategy = require('passport-microsoft').Strategy;
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          callbackURL: process.env.MICROSOFT_CALLBACK_URL || '/api/auth/microsoft/callback',
          scope: ['user.read'],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            let user = await prisma.user.findFirst({
              where: { provider: 'microsoft', providerId: profile.id },
            });
            if (!user) {
              const email = profile.emails?.[0]?.value || `${profile.id}@microsoft.oauth`;
              const username = `microsoft_${profile.id}`;
              user = await prisma.user.create({
                data: {
                  email,
                  username,
                  provider: 'microsoft',
                  providerId: profile.id,
                  profile: {
                    create: {
                      displayName: profile.displayName || username,
                    },
                  },
                },
              });
            }
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
    console.log('✅ Microsoft OAuth strategy loaded');
  } catch (err) {
    console.warn('⚠️  Microsoft OAuth strategy not loaded (package may not be installed)');
  }
}

export default passport;
