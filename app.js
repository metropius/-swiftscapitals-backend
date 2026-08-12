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
// const connectDB = require("./server/config/db")

const app = express();
const PORT = process.env.PORT || 7000;

// ====================== DATABASE ======================
// connectDB();
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://marcelpolocha1:081358pius@cluster0.f9a85hv.mongodb.net/switchswiftBank')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// ====================== MIDDLEWARES ======================
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// CORS - Good for development
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Session + Flash (still useful for any remaining EJS pages)
app.use(session({
  secret: process.env.SESSION_SECRET || 'piuscandothis',
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());

// Make flash available to views (optional)
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// View engine (only needed if you still have some EJS pages)
// app.set('view engine', 'ejs');

// ====================== ROUTES ======================
app.use(checkUser); // runs on every request

// Public routes (login, register, etc.)
app.use('/', require('./server/Route/indexRoute'));

// Protected routes
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

  if (wantsJson) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Something went wrong!'
    });
  }

  // Fallback for EJS pages
  if (typeof req.flash === 'function') {
    req.flash('error', err.message || 'Something went wrong!');
  }
  return res.redirect(req.get('Referrer') || '/');
});

// ====================== START SERVER ======================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
