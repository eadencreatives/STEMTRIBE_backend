// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
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
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// =======================
// Passport Google OAuth
// =======================
const User = require('./models/User');

const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://stemtribe-backend.onrender.com/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    let user = await User.findOne({ $or: [{ providerId: profile.id }, { email }] });
    if (!user) {
      user = await User.create({
        name: profile.displayName || 'Google User',
        email,
        provider: 'google',
        providerId: profile.id,
        avatar: profile.photos?.[0]?.value
      });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
    let user = await User.findOne({ $or: [{ providerId: profile.id }, { email }] });
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
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id || user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id).select('-password');
    done(null, u);
  } catch (err) {
    done(err, null);
  }
});

// =======================
// Routes
// =======================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'StemTribe Africa LMS Backend running!', timestamp: new Date() });
});

// Temporary debug endpoint for users
app.get('/api/all-users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Google OAuth routes (use environment-appropriate callback URL to avoid redirect_uri_mismatch)
app.get('/auth/google', (req, res, next) => {
  const callbackURL = process.env.NODE_ENV === 'production'
    ? process.env.GOOGLE_CALLBACK_URL
    : (process.env.GOOGLE_CALLBACK_URL_LOCAL || 'http://localhost:5000/auth/google/callback');
  console.log('[auth] initiating Google OAuth, callbackURL=', callbackURL);
  passport.authenticate('google', { scope: ['profile', 'email'], callbackURL })(req, res, next);
});

app.get('/auth/google/callback',
  (req, res, next) => {
    const callbackURL = process.env.NODE_ENV === 'production'
      ? process.env.GOOGLE_CALLBACK_URL
      : (process.env.GOOGLE_CALLBACK_URL_LOCAL || 'http://localhost:5000/auth/google/callback');
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, callbackURL })(req, res, next);
  },
  (req, res) => {
    const token = generateToken(req.user._id);
    const redirectUrl = `${process.env.CLIENT_URL}/login?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }))}`;
    res.redirect(redirectUrl);
  }
);

// GitHub OAuth routes (use environment-appropriate callback URL)
app.get('/auth/github', (req, res, next) => {
  const callbackURL = process.env.NODE_ENV === 'production'
    ? process.env.GITHUB_CALLBACK_URL
    : (process.env.GITHUB_CALLBACK_URL_LOCAL || 'http://localhost:5000/auth/github/callback');
  console.log('[auth] initiating GitHub OAuth, callbackURL=', callbackURL);
  passport.authenticate('github', { scope: ['user:email'], callbackURL })(req, res, next);
});

app.get('/auth/github/callback',
  (req, res, next) => {
    const callbackURL = process.env.NODE_ENV === 'production'
      ? process.env.GITHUB_CALLBACK_URL
      : (process.env.GITHUB_CALLBACK_URL_LOCAL || 'http://localhost:5000/auth/github/callback');
    passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login`, callbackURL })(req, res, next);
  },
  (req, res) => {
    const token = generateToken(req.user._id);
    const redirectUrl = `${process.env.CLIENT_URL}/login?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }))}`;
    res.redirect(redirectUrl);
  }
);

// Include other auth routes if you have them
app.use('/api/auth', require('./routes/auth'));

// Debug endpoint to inspect OAuth callback settings (does NOT return secrets)
app.get('/auth/debug', (req, res) => {
  const env = process.env.NODE_ENV || 'development';
  const googleProd = process.env.GOOGLE_CALLBACK_URL || null;
  const googleLocal = process.env.GOOGLE_CALLBACK_URL_LOCAL || 'http://localhost:5000/auth/google/callback';
  const githubProd = process.env.GITHUB_CALLBACK_URL || null;
  const githubLocal = process.env.GITHUB_CALLBACK_URL_LOCAL || 'http://localhost:5000/auth/github/callback';
  res.json({
    env,
    clientUrl: process.env.CLIENT_URL || null,
    google: { production: googleProd, local: googleLocal },
    github: { production: githubProd, local: githubLocal }
  });
});

// =======================
// Error handling
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// =======================
// MongoDB Connection
// =======================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 StemTribe Africa LMS running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`📊 Users: http://localhost:${PORT}/api/all-users`);
    console.log(`🌐 Google OAuth: http://localhost:${PORT}/auth/google`);
  });
};

startServer();

