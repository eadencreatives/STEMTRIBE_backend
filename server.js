// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// =======================
// Middleware
// =======================

app.use(cors({
  origin: process.env.CLIENT_URL, // e.g. https://your-frontend.vercel.app
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());

// =======================
// MongoDB Model
// =======================

const User = require('./models/User');

// =======================
// JWT Helper
// =======================

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// =======================
// Passport Google OAuth
// =======================

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;

      let user = await User.findOne({
        $or: [{ providerId: profile.id }, { email }]
      });

      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email,
          provider: 'google',
          providerId: profile.id,
          avatar: profile.photos?.[0]?.value
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// =======================
// Passport GitHub OAuth
// =======================

passport.use(new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email =
        profile.emails?.[0]?.value ||
        `${profile.username}@github.local`;

      let user = await User.findOne({
        $or: [{ providerId: profile.id }, { email }]
      });

      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username,
          email,
          provider: 'github',
          providerId: profile.id,
          avatar: profile.photos?.[0]?.value
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// =======================
// Routes
// =======================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    message: 'StemTribe Africa LMS Backend running!',
    time: new Date()
  });
});

// Google OAuth routes
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/login?token=${token}`);
  }
);

// GitHub OAuth routes
app.get(
  '/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get(
  '/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/login?token=${token}`);
  }
);

// =======================
// Error handler
// =======================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// =======================
// MongoDB Connection
// =======================

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');
};

// =======================
// Start Server
// =======================

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 LMS Backend running on port ${PORT}`);
  });
});
