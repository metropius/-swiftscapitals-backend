const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const cors = require('cors');
const path = require('path');
const { requireAuth, checkUser } = require('./server/authMiddleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 7000;

// ====================== DATABASE ======================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Error:', err.message);
    console.error(err);
  });

mongoose.connection.on('connected', () => console.log('Mongoose connected event'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err.message));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));


// ====================== MIDDLEWARES ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// ========== CORS (production-ready) ==========
const allowedOrigins = [
  process.env.FRONTEND_URL,                    // https://your-site-name.netlify.app
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Session (important for transfer OTP / pending deposit)
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-to-a-long-random-string',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true on Render (HTTPS)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// ====================== ROUTES ======================
app.use(checkUser);

app.use('/', require('./server/Route/indexRoute'));
app.use('/', requireAuth, require('./server/Route/userRoute'));
app.use('/', requireAuth, require('./server/Route/adminRoute'));

// ====================== ERROR HANDLER ======================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);

  const statusCode = err.status || err.statusCode || 500;

  const wantsJson =
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.headers['content-type']?.includes('application/json');

  if (wantsJson || err.message === 'Not allowed by CORS') {
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Something went wrong!'
    });
  }

  if (typeof req.flash === 'function') {
    req.flash('error', err.message || 'Something went wrong!');
  }
  return res.redirect(req.get('Referrer') || '/');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});