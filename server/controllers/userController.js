const mongoose = require('mongoose');
const User = require('../Model/User');
const Deposit = require('../Model/depositSchema');
const transferMoney = require("../Model/Transfer");
const Loan = require("../Model/loan");
const Ticket = require("../Model/support");
const Wallet = require("../Model/Wallet");
const Card = require('../Model/card')
const Verification = require('../Model/Verification');
const IRSRefund = require('../Model/IrsRefund');
const crypto = require("crypto")
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const fsPromises = require('fs').promises;
const cloudinary = require('cloudinary').v2;
const { validationResult } = require('express-validator');
const moment = require('moment');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Generate verification URL dynamically
const generateVerificationUrl = (verificationToken) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:7000';
  return `${baseUrl}/verify-email?user=${verificationToken}&ver_code=${verificationToken}`;
};

// Send verification email using Resend
const sendVerificationEmail = async (email, firstname,lastname, verificationToken) => {
  const verificationUrl = generateVerificationUrl(verificationToken);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Support < support@swiftscapitals.com>',
      to: [email],
      subject: 'Verify Your Email - Swift Capital',
      html: `
        <div style="background-color: #1C2526; padding: 20px; font-family: Arial, sans-serif; color: #F5F6F5; text-align: center; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background-color: #2E3A3B; padding: 15px; border-bottom: 2px solid #F5F6F5;">
            <img src="https://swiftcaptial.com/assets/img/gkgr73S0C0AVl3XX0UUQh8Ffr0fmzCSK4EhmlcPQ.jpg" alt="Swift Capital Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
            <h2 style="color: #F5F6F5; margin: 10px 0 0; font-size: 24px;">Verify Your Email Account</h2>
          </div>
          <!-- Body -->
          <div style="padding: 20px; font-size: 16px; line-height: 1.5;">
            <p>Hi ${firstname}${lastname},</p>
            <p style="color: #F5F6F5;">Thanks for creating an account with us at Swift Capital. Please click the button below to verify your account:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3F3EED; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Confirm Email</a>
            <p style="color: #F5F6F5;">If the button above doesn't work, please copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}" style="color: #4A90E2; text-decoration: none;">${verificationUrl}</a></p>
    
          <!-- Footer -->
          <div style="background-color: #2E3A3B; padding: 15px; border-top: 2px solid #F5F6F5; font-size: 14px;">
            <p style="margin: 0 0 10px; color: #F5F6F5;">© ${new Date().getFullYear()} Capital Swift. All rights reserved.</p>
            <div style="display: flex; justify-content: center; gap: 20px;">
              <a href="mailto: support@swifts-capitals.com" style="color: #4A90E2; text-decoration: none; display: flex; align-items: center; gap: 5px;">
                <img src="https://img.icons8.com/ios-filled/24/4A90E2/email.png" alt="Email Icon" style="width: 20px; height: 20px;">
                <span>Contact Support</span>
              </a>
              <a href="signalsmine.org" style="color: #4A90E2; text-decoration: none; display: flex; align-items: center; gap: 5px;">
                <img src="https://img.icons8.com/ios-filled/24/4A90E2/globe.png" alt="Website Icon" style="width: 20px; height: 20px;">
                <span>Visit Website</span>
              </a>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message || 'Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data.id);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// ──────────────────────────────────────────────────────────────
// SEND PASSWORD RESET EMAIL (new function)
// ──────────────────────────────────────────────────────────────
const sendPasswordResetEmail = async (email, firstname, resetUrl) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Support <support@swiftscapitals.com>',
      to: [email],
      subject: 'Reset Your Password - Swift Capital',
      html: `
        <div style="background-color: #1C2526; padding: 20px; font-family: Arial, sans-serif; color: #F5F6F5; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background-color: #2E3A3B; padding: 15px; text-align: center; border-bottom: 2px solid #F5F6F5;">
            <img src="https://swiftcaptial.com/assets/img/gkgr73S0C0AVl3XX0UUQh8Ffr0fmzCSK4EhmlcPQ.jpg" alt="Swift Capital Logo" style="max-width: 150px;">
            <h2 style="color: #F5F6F5; margin: 10px 0;">Password Reset Request</h2>
          </div>

          <!-- Body -->
          <div style="padding: 25px; background: #ffffff; border-radius: 8px; margin: 20px 0; color: #333;">
            <h3 style="color: #1a1a1a;">Hello ${firstname || 'User'}!</h3>
            <p>You are receiving this email because we received a password reset request for your account.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 14px 32px; background-color: #3F3EED; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 15px;">This password reset link will expire in <strong>60 minutes</strong>.</p>
            <p style="font-size: 14px; color: #555;">If you did not request a password reset, no further action is required.</p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; font-size: 13px; color: #aaa;">
            <p>© ${new Date().getFullYear()} Swift Capital. All rights reserved.</p>
            <p style="margin-top: 10px;">
              If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:<br>
              <a href="${resetUrl}" style="color: #4A90E2; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend password reset error:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Password reset email sent:', data.id);
  } catch (err) {
    console.error('Error sending password reset email:', err);
    throw err;
  }
};

// Send welcome email using Resend
const sendWelcomeEmail = async (email, firstname,lastname, username, password, createdAt) => {
  const signInUrl = process.env.BASE_URL;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Support <support@swiftscapitals.com>',
      to: [email],
      subject: 'Welcome to  Swift Capital',
      html: `
        <div style="background-color: #1C2526; padding: 20px; font-family: Arial, sans-serif; color: #F5F6F5; text-align: center; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background-color: #2E3A3B; padding: 15px; border-bottom: 2px solid #F5F6F5;">
            <img src="https://swiftcaptial.com/assets/img/gkgr73S0C0AVl3XX0UUQh8Ffr0fmzCSK4EhmlcPQ.jpg" alt=" Swift Capital Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
            <h2 style="color: #F5F6F5; margin: 10px 0 0; font-size: 24px;">Welcome, ${firstname}${lastname}</h2>
          </div>
          <!-- Body -->
          <div style="padding: 20px; font-size: 16px; line-height: 1.5;">
            <h3 style="color: #F5F6F5; font-size: 18px;">We are happy to have you join us</h3>
            <p style="color: #F5F6F5;">Your account registration and email verification was successful. Welcome to Capital Swift.</p>
            <p style="color: #F5F6F5; font-weight: bold;">Below is your personal details. Do not disclose to anyone.</p>
            <hr style="border: 1px solid #4A4A4A; margin: 20px 0;">
            <p style="color: #F5F6F5; text-align: left; margin: 10px 0;"><strong>Acc No:</strong> ${username}</p>
            <p style="color: #F5F6F5; text-align: left; margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #F5F6F5; text-align: left; margin: 10px 0;"><strong>Password:</strong> ${password}</p>
            <hr style="border: 1px solid #4A4A4A; margin: 20px 0;">
            <a href="${signInUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3F3EED; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Sign In</a>
            <p style="color: #F5F6F5; font-size: 14px;">Account created on: ${new Date(createdAt).toLocaleDateString()}</p>
          </div>
          <!-- Footer -->
          <div style="background-color: #2E3A3B; padding: 15px; border-top: 2px solid #F5F6F5; font-size: 14px;">
            <p style="margin: 0 0 10px; color: #F5F6F5;">© ${new Date().getFullYear()} Capital Swift. All rights reserved.</p>
            <div style="display: flex; justify-content: center; gap: 20px;">
              <a href="mailto:support@swiftscapitals.com" style="color: #4A90E2; text-decoration: none; display: flex; align-items: center; gap: 5px;">
                <img src="https://img.icons8.com/ios-filled/24/4A90E2/email.png" alt="Email Icon" style="width: 20px; height: 20px;">
                <span>Contact Support</span>
              </a>
              <a href="#" style="color: #4A90E2; text-decoration: none; display: flex; align-items: center; gap: 5px;">
                <img src="https://img.icons8.com/ios-filled/24/4A90E2/globe.png" alt="Website Icon" style="width: 20px; height: 20px;">
                <span>Visit Website</span>
              </a>
            </div>
          </div>
        </div>
      `,
    });

    if (error) throw error;
    console.log('Welcome email sent successfully:', data.id);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw — verification already succeeded
  }
};


// Unified handleErrors function
const handleErrors = (err) => {
  let errors = {
    fullname: '',
    username: '',
    email: '',
    tel: '',
    country: '',
    zip_code: '',
    city: '',
    currency: '',
    password: '',
    address: ''
  };

  // Handle duplicate key errors (MongoDB error code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      errors.email = 'That email is already registered';
    } else if (field === 'username') {
      errors.username = 'That username is already taken';
    } else if (field === 'fullname') {
      errors.fullname = 'That full name is already registered';
    }
    return errors;
  }

  // Handle Mongoose validation errors
  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
    return errors;
  }

  // Handle login-specific errors
  if (err.message === 'incorrect email') {
    errors.email = 'Incorrect email';
  } else if (err.message === 'incorrect password') {
    errors.password = 'Incorrect password';
  } else if (err.message === 'Your account is not verified. Please verify it or create another account.') {
    errors.email = err.message;
  } else if (err.message === 'Your account is suspended. If you believe this is a mistake, please contact support at  support@swiftscapitals.com') {
    errors.email = err.message;
  }

  // Handle custom errors
  if (err.message === 'All fields are required') {
    errors.fullname = 'All fields are required';
  } else if (err.message === 'Passwords do not match') {
    errors.password = 'Passwords do not match';
  } else if (err.message === 'Invalid email format') {
    errors.email = 'Invalid email format';
  }

  // Handle Nodemailer errors
  if (err.message.includes('nodemailer') || err.message.includes('SMTP')) {
    errors.email = 'Failed to send email. Please try again later or contact support.';
  }

  // Handle generic errors
  if (Object.values(errors).every(val => val === '')) {
    errors.email = 'An unexpected error occurred. Please try again or contact support.';
  }

  return errors;
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'piuscandothis', { expiresIn: maxAge });
};

// Unchanged routes (homePage, aboutPage, etc.)
module.exports.homePage = (req, res) => { res.render("index"); };
module.exports.aboutPage = (req, res) => { res.render("about"); };
module.exports.businessPage = (req, res) => { res.render("business"); };
module.exports.personalPage = (req, res) => { res.render("personal"); };
module.exports.outcardPage = (req, res) => { res.render("cards"); };
module.exports.appPage = (req, res) => { res.render("apps"); };
module.exports.loanPages = (req, res) => { res.render("loans"); };
module.exports.contactPage = (req, res) => { res.render("contact"); };
module.exports.securityPage = (req, res) => { res.render("converter"); };
module.exports.licensesPage = (req, res) => { res.render("chart"); };
module.exports.alertsPage = (req, res) => { res.render("alerts"); };
module.exports.faqPage = (req, res) => { res.render("faq"); };
module.exports.privacyPage = (req, res) => { res.render("privacy-policy"); };
module.exports.termsPage = (req, res) => { res.render("terms-of-service"); };
module.exports.policyPage = (req, res) => { res.render("policy"); };
module.exports.termPage = (req, res) => { res.render("term"); };
module.exports.loginAdmin = (req, res) => { res.render('loginAdmin'); };
module.exports.registerPage = (req, res) => { res.render("register"); };
// module.exports.loginPage = (req, res) => { res.render("login"); };
// Show login page (GET /login)
module.exports.loginPage = (req, res) => {
  // If user is already logged in → redirect to PIN or dashboard
  if (res.locals.user) {
    // Optional: already logged in → go straight to PIN or dashboard
    return res.redirect('/pin');
  }
  res.render("login", { title: "Login - swiftcaptial" });
};

module.exports.register_post = async (req, res) => {
  const {
    firstname,
    midname = '',
    lastname,
    username,
    email,
    phone,           // ← was tel in your destructuring
    country,
    accounttype,  // ← was account in your code
    pin,
    password,
    password_confirmation,
    // optional ones
    postal = 'postal code',
    address = 'your address',
    state = 'your state',
    Dob = '',
    city = 'your city',
    gender = '',
    currency = '$'
  } = req.body;

  try {
    // Basic upfront validation (extra safety layer)
    if (!firstname || !lastname || !username || !email || !phone || !country || !accounttype || !pin || !password) {
      throw new Error('Please fill all required fields');
    }

    if (password !== password_confirmation) {
      throw new Error('Passwords do not match');
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }


    // Generate random account number (10 digits)
    const account_no = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const user = await User.create({
      firstname,
      midname,
      lastname,
      username,
      email: email.toLowerCase(),
      phone,
      country,
      accounttype,
      pin,
      password,               // plain text – consider hashing later
      account_no,
      postal,
      address,
      state,
      Dob,
      city,
      gender,
      currency
      // defaults handle the rest
    });

    // Create JWT
    const token = createToken(user._id);   // assuming this function exists
    res.cookie('jwt', token, {
     httpOnly: true,
     maxAge: maxAge * 1000,
     secure: true,
     sameSite: 'none'
      }); // assuming maxAge defined

    // Send verification email (your function)
    // await sendVerificationEmail(
    //   user.email,
    //   user.firstname,
    //   user.lastname ? ' ' + user.lastname : '',
    //   verificationToken
    // );

    // Success JSON response
    return res.status(201).json({
  success: true,
  message: 'Registration successful',
  token,
  user: {
    _id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email
  },
  redirect: 'dashboard.html'   // or '/login.html' if you still want email verification first
});

  } catch (err) {
    let errors = {};

    // Handle Mongoose duplicate key error (code 11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      errors[field] = `This ${field} is already taken. Please choose another.`;
    }

    // Handle Mongoose validation errors
    else if (err.name === 'ValidationError') {
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
    }

    // Generic or custom Error
    else {
      const message = err.message || 'Registration failed. Please try again.';
      if (message.includes('incorrect') || message.includes('required')) {
        errors.general = message;
      } else {
        errors.general = 'An unexpected error occurred. Please try again later.';
      }
    }

    // Prepare user-friendly message
    let errorMsg = errors.general || 
      Object.values(errors).filter(Boolean).join(' • ') || 
      'Registration failed. Please check your details.';

    return res.status(400).json({
      success: false,
      errors,
      message: errorMsg
    });
  }
};

module.exports.verifyEmailPage = (req, res) => {
  res.render("verify-email");
};

// verify email functionalities

module.exports.verifyEmail = async (req, res) => {
  const { user: token, ver_code } = req.query;

  if (!token || !ver_code) {
    return res.redirect('/register?error=' + encodeURIComponent('Invalid verification link.'));
  }

  try {
    // Find user by verificationToken (which is what we passed as "user" in URL)
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect('/register?error=' + encodeURIComponent('Invalid or expired verification link. Please register again.'));
    }

    if (user.isVerified) {
      return res.redirect('/login?success=' + encodeURIComponent('Your account is already verified. You can now log in.'));
    }

    if (ver_code !== token) {
      return res.redirect('/register?error=' + encodeURIComponent('Invalid verification code.'));
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(
      user.email,
      user.firstname,
      user.lastname ? ' ' + user.lastname : '',
      user.email,
      user.password,
      user.createdAt
    );

    res.redirect('/login?success=' + encodeURIComponent('Email verified successfully! You can now log in.'));

  } catch (err) {
    console.error('Verification error:', err);
    res.redirect('/register?error=' + encodeURIComponent('Something went wrong during verification. Please try again.'));
  }
};



// Handle login submission (POST /login)
module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
     const user = await User.login(email.toLowerCase(), password);
    const token = createToken(user._id);

    // Still set cookie for backward compatibility
    // res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.cookie('jwt', token, {
     httpOnly: true,
     maxAge: maxAge * 1000,
     secure: true,
     sameSite: 'none'
    });

    let redirectUrl = 'pin.html'; // frontend page
    if (email.toLowerCase() === 'support@swifts-capitals.com') {
      redirectUrl = 'adminDashboard.html'; // or whatever your admin page will be
    }

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.firstname || 'User'}!`,
      token,                    // ← important for frontend
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        account_no: user.account_no
      },
      redirectUrl
    });

  } catch (err) {
    const errors = handleErrors(err);
    let errorMessage = err.message || 'Login failed. Please try again.';

    // More user-friendly messages
    if (err.message === 'incorrect email') {
      errorMessage = 'Invalid email address.';
    } else if (err.message === 'incorrect password') {
      errorMessage = 'Invalid password.';
    } else if (err.message.includes('not verified')) {
      errorMessage = 'Your account is not verified. Please check your email.';
    } else if (err.message.includes('suspended')) {
      errorMessage = 'Your account is suspended. Contact support.';
    }

    return res.status(400).json({
      success: false,
      message: errorMessage,
      errors
    });
  }
};

module.exports.forgetPasswordPage = (req, res) => { res.render("forgot-password"); };

// ──────────────────────────────────────────────────────────────
// FORGOT PASSWORD – SEND RESET LINK
// ──────────────────────────────────────────────────────────────

module.exports.forgetPasswordPage_post = async (req, res) => {
  const { email } = req.body;

  // Always respond with JSON (for AJAX)
  res.setHeader('Content-Type', 'application/json');

  try {
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 60 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Generate reset URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:7000';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}?email=${encodeURIComponent(email)}`;

    // Send email
    await sendPasswordResetEmail(user.email, user.firstname || 'User', resetUrl);

    return res.status(200).json({
      success: true,
      message: 'A password reset link has been sent to your email (valid for 60 minutes)'
    });

  } catch (err) {
    console.error('Forgot password error:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

// ──────────────────────────────────────────────────────────────
// RESET PASSWORD PAGE (GET)
// ──────────────────────────────────────────────────────────────
module.exports.resetPasswordPage = async (req, res) => {
  const { token } = req.params;
  const { email } = req.query;

  console.log('Reset password GET attempt:', {
    token,
    provided_email: email,
    now: Date.now(),
  });

  try {
    // ─── Only check by token + expiration ───
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('No user found with this valid reset token → invalid/expired');
      req.flash('error', 'Password reset link is invalid or has expired');
      return res.redirect('/forgot-password');
    }

    // Optional safety: warn if provided email doesn't match stored email
    if (email && user.email.toLowerCase() !== email.toLowerCase().trim()) {
      console.warn('Email mismatch on reset link:', {
        provided: email,
        stored: user.email
      });
      // You can still proceed — or redirect with warning if you want to be strict
    }

    console.log('Valid reset token found for user:', user.email);

    res.render('reset-password', {
      token,
      email: user.email,          // ← use the stored email (more secure)
      messages: req.flash()
    });

  } catch (err) {
    console.error('Reset password page error:', err.message, err.stack);
    req.flash('error', 'Something went wrong. Please request a new link.');
    res.redirect('/forgot-password');
  }
};
// ──────────────────────────────────────────────────────────────
// RESET PASSWORD SUBMISSION (POST)
// ──────────────────────────────────────────────────────────────

module.exports.resetPasswordPage_post = async (req, res) => {
  const { token } = req.params;
  const { email, password, password_confirmation } = req.body;

  // Always respond with JSON for AJAX requests
  res.setHeader('Content-Type', 'application/json');

  try {
    if (!password || !password_confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Both password fields are required'
      });
    }

    if (password !== password_confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired'
      });
    }

    // Optional: also check email matches (extra security)
    if (email && user.email.toLowerCase() !== email.toLowerCase().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email mismatch. Please use the link sent to your email.'
      });
    }

    // Update password
    user.password = password;

    // Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Success → redirect to login (but return JSON so AJAX can handle it)
    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. Redirecting to login...',
      redirect: '/login'
    });

  } catch (err) {
    console.error('Reset password error:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
};



// OTP CODES

// OTP generation function
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// OTP sending function using Resend
const sendOTP = async (user) => {
    const otp = generateOTP(); // assuming you have this function defined
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = expires;
    await user.save();

    try {
        const { data, error } = await resend.emails.send({
            from: 'Capital Swift Bank < support@swiftscapitals.com>', // Use your verified sender
            to: [user.email],
            subject: 'Transfer Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
                    <div style="text-align: center; padding: 10px 0;">
                        <h2 style="color: #1a1a1a;">Capital Swift Bank</h2>
                    </div>
                    <div style="padding: 20px; background-color: #ffffff; border-radius: 8px; text-align: center;">
                        <h3 style="color: #333;">Transfer Verification Required</h3>
                        <p style="font-size: 16px; color: #555;">
                            Your One-Time Password (OTP) for the transfer is:
                        </p>
                        <div style="font-size: 32px; font-weight: bold; color: #0d6efd; letter-spacing: 8px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p style="font-size: 14px; color: #888;">
                            This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="font-size: 12px; color: #aaa;">
                            If you didn't initiate this transfer, please contact support immediately.
                        </p>
                    </div>
                    <div style="text-align: center; padding: 15px; font-size: 12px; color: #999;">
                        © ${new Date().getFullYear()} Capital Swift Bank. All rights reserved.<br>
                        <a href="mailto: support@swifts-capitals.com" style="color: #0d6efd; text-decoration: none;"> support@swifts-capitals.com</a>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('Resend OTP email error:', error);
            return false;
        }

        console.log('OTP email sent successfully via Resend:', data.id);
        return true;

    } catch (error) {
        console.error('Error sending OTP via Resend:', error);
        return false;
    }
};




module.exports.Pin = async (req, res) => {
  res.render("pin")
};

module.exports.verifyPin = async (req, res) => {
  const { pin } = req.body;

  console.log('Received PIN attempt:', { 
    userId: req.user?._id, 
    pinLength: pin?.length 
  });

  try {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 4-digit PIN'
      });
    }

    // Now req.user is guaranteed to exist (thanks to requireAuth)
    const user = req.user;

    if (user.pin !== pin) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect PIN. Please try again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'PIN verified successfully!',
      redirect: 'dashboard.html'
    });

  } catch (err) {
    console.error('PIN verification error:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during verification.'
    });
  }
};



module.exports.dashboardPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('deposits')
      .populate('transfers');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Global wallet
    const wallet = await Wallet.findOne().sort({ createdAt: -1 }) || {
      bank_name: "No bank details configured",
      account_name: "—",
      account_no: "—",
      sortcode: "—",
      swift_code: "—",
      btc_wallet_address: "—",
      btc_qr_image: null,
      paypal_email: "—"
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyIncome = user.deposits
      .filter(d => d.status === 'approved' && new Date(d.createdAt) >= startOfMonth)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const monthlyOutgoing = user.transfers
      .filter(t => t.status === 'approved' && new Date(t.createdAt) >= startOfMonth)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pendingDeposits = user.deposits
      .filter(d => d.status === 'pending')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const pendingTransfers = user.transfers
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pendingTransactions = pendingDeposits + pendingTransfers;

    const transactionVolume = user.deposits
      .filter(d => d.status === 'approved')
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    // Account age
    const created = moment(user.createdAt);
    const age = moment.duration(moment().diff(created));
    let accountAgeStr;

    if (age.asMinutes() < 60) {
      accountAgeStr = `${Math.floor(age.asMinutes())} minutes`;
    } else if (age.asHours() < 24) {
      accountAgeStr = `${Math.floor(age.asHours())} hours`;
    } else if (age.asDays() < 30) {
      accountAgeStr = `${Math.floor(age.asDays())} days`;
    } else if (age.asMonths() < 12) {
      accountAgeStr = `${Math.floor(age.asMonths())} months`;
    } else {
      accountAgeStr = `${Math.floor(age.asYears())} years`;
    }

    // Recent transactions (combine deposits + transfers)
    const recentTransactions = [
      ...user.deposits.map(d => ({
        type: 'deposit',
        icon: 'plus',
        color: 'green',
        amount: Number(d.amount),
        displayType: 'Credit',
        status: d.status.charAt(0).toUpperCase() + d.status.slice(1),
        reference: d._id.toString(),
        createdAt: d.createdAt,
        createdAtFormatted: moment(d.createdAt).fromNow(),
        narration: d.narration || 'Deposit'
      })),
      ...user.transfers.map(t => ({
        type: t.isIncoming ? 'deposit' : 'transfer',
        icon: t.isIncoming ? 'plus' : 'minus',
        color: t.isIncoming ? 'green' : 'red',
        amount: Number(t.amount),
        displayType: t.isIncoming ? 'Credit' : 'Debit',
        status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
        reference: t._id.toString(),
        createdAt: t.createdAt,
        createdAtFormatted: moment(t.createdAt).fromNow(),
        note: t.isIncoming
          ? `From ${t.counterpartName || 'Unknown'}`
          : (t.note || t.type + (t.accountname ? ` to ${t.accountname}` : ''))
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // ========== RETURN JSON (important!) ==========
    return res.status(200).json({
      success: true,
      user,
      wallet,
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyOutgoing: monthlyOutgoing.toFixed(2),
      pendingTransactions: pendingTransactions.toFixed(2),
      transactionVolume: transactionVolume.toFixed(2),
      accountAge: accountAgeStr,
      recentTransactions
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};


exports.swapPage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Unauthorized');
      return res.redirect('/dashboard');
    }
    res.render('swap');
  } catch (err) {
    req.flash('error', 'Error loading page');
    res.redirect('/dashboard');
  }
};

exports.swap_post = async (req, res) => {
  try {
    const { amount, source = 'main' } = req.body;
    const usdAmount = parseFloat(amount);

    if (isNaN(usdAmount) || usdAmount < 50) {
      return res.status(400).json({ error: 'Minimum swap amount is $50' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let availableBalance;
    let updateField;

    switch(source) {
      case 'main':
        availableBalance = parseFloat(user.balance) || 0;
        updateField = 'balance';
        break;
      case 'card':
        // For simplicity — using first card only
        // In real app you should let user select which card
        if (!user.cards || user.cards.length === 0) {
          return res.status(400).json({ error: 'No active card found' });
        }
        const card = await Card.findOne({ _id: user.cards[0], status: 'active' });
        if (!card) {
          return res.status(400).json({ error: 'No active card found' });
        }
        availableBalance = card.balance || 0;
        updateField = null; // we'll update card separately
        break;
      case 'irs':
        // Assuming IRS balance is stored somewhere (e.g. last approved refund)
        // Here we simulate — you should adjust logic
        const lastIRS = await IRSRefund.findOne({ 
          user: user._id, 
          status: 'sent' 
        }).sort({ sentAt: -1 });
        availableBalance = lastIRS ? lastIRS.refundAmount : 0;
        updateField = null; // IRS balance usually not stored in user
        break;
      default:
        return res.status(400).json({ error: 'Invalid balance source' });
    }

    if (usdAmount > availableBalance) {
      return res.status(400).json({ error: 'Insufficient balance in selected source' });
    }

    // Get BTC price
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    if (!data.bitcoin?.usd) throw new Error('Failed to fetch BTC price');

    const btcPrice = data.bitcoin.usd;
    const btcAmount = usdAmount / btcPrice;

    // Update balances
    if (source === 'main') {
      user.balance = (parseFloat(user.balance) - usdAmount).toFixed(2);
    } else if (source === 'card') {
      const card = await Card.findById(user.cards[0]);
      card.balance = (card.balance - usdAmount);
      await card.save();
    } 
    // IRS case → usually not deducted from user model

    user.btcBalance = (user.btcBalance || 0) + btcAmount;
    await user.save();

    req.flash('success', `Swapped $${usdAmount.toFixed(2)} from ${source} to ${btcAmount.toFixed(8)} BTC`);

    return res.json({
      success: true,
      message: `Successfully swapped $${usdAmount.toFixed(2)} to ${btcAmount.toFixed(8)} BTC`
    });

  } catch (err) {
    console.error(err);
    req.flash('error', 'Swap failed: ' + (err.message || 'Server error'));
    return res.status(500).json({ error: err.message || 'Swap failed' });
  }
};

// end swap codes functionalities


// ====================== DEPOSIT CONTROLLERS ======================

// GET /deposits  (or /deposit-page)
module.exports.depositsPage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'firstname lastname midname email account_no currency balance btcBalance image'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        midname: user.midname || '',
        email: user.email,
        account_no: user.account_no,
        currency: user.currency || '$',
        balance: Number(user.balance || 0),
        btcBalance: Number(user.btcBalance || 0),
        image: user.image
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to load deposits page' });
  }
};

// POST /deposit/:id
module.exports.deposit_post = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { amount, payment_method } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!payment_method) {
      return res.status(400).json({ success: false, message: 'Please select a payment method' });
    }

    // Store pending deposit (session + DB fallback for cross-origin)
    const pending = {
      amount: Number(amount),
      payment_method,
      createdAt: new Date()
    };
    if (req.session) {
      req.session.pendingDeposit = pending;
    }
    user.pendingDeposit = pending;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Proceed to payment',
      redirect: `payment.html?id=${user._id}`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to process deposit request' });
  }
};

// GET /payment  or /deposit-payment/:id  (payment page data)
module.exports.paymentPage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'firstname lastname midname email account_no currency balance btcBalance image pendingDeposit'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const pending = req.session?.pendingDeposit || user.pendingDeposit;
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'No pending deposit found. Please start a new deposit.',
        redirect: 'deposits.html'
      });
    }

    // Get wallet settings (your Wallet model or Settings model)
    const wallet = await Wallet.findOne() || {};   // adjust to your model name

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        midname: user.midname || '',
        email: user.email,
        account_no: user.account_no,
        currency: user.currency || '$',
        balance: Number(user.balance || 0),
        btcBalance: Number(user.btcBalance || 0),
        image: user.image
      },
      amount: pending.amount,
      payment_method: pending.payment_method,
      wallet: {
        bank_name: wallet.bank_name || '',
        account_name: wallet.account_name || '',
        account_no: wallet.account_no || '',
        swift_code: wallet.swift_code || '',
        btc_wallet_address: wallet.btc_wallet_address || '',
        btc_qr_image: wallet.btc_qr_image || '',
        paypal_email: wallet.paypal_email || ''
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to load payment page' });
  }
};


// ────────────────────────────────────────────────
// Deposit Confirm - Upload proof of payment
// POST /deposit/confirm/:id
// ────────────────────────────────────────────────
module.exports.depositConfirm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get data from body (FormData)
    const amount = Number(req.body.amount);
    const payment_method = req.body.payment_method;

    // Basic validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deposit amount'
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Check that a proof file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload proof of payment (image or PDF)'
      });
    }

    // Optional: verify that the pending deposit still exists and matches
    const pending = req.session?.pendingDeposit || user.pendingDeposit;
    if (pending) {
      // Soft check – you can make it stricter if you want
      if (Number(pending.amount) !== amount || pending.payment_method !== payment_method) {
        console.warn('Pending deposit mismatch – still allowing submission');
      }
    }

    // Create the deposit record
    // (Adjust the model name if yours is different – e.g. Deposit, depositMoney, etc.)
    const newDeposit = new Deposit({
      owner: user._id,
      amount: amount,
      payment_method: payment_method,
      proofImage: req.file.path || req.file.filename,   // depending on how multer is configured
      status: 'pending',                                // waiting for admin approval
      type: 'Deposit',
      currency: user.currency || 'USD',
      createdAt: new Date()
    });

    await newDeposit.save();

    // Add reference to user (if you store deposits array on user)
    if (!user.deposits) user.deposits = [];
    user.deposits.push(newDeposit._id);

    // Clear the pending deposit
    user.pendingDeposit = undefined;
    if (req.session) {
      delete req.session.pendingDeposit;
    }

    await user.save();

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully. Your deposit is now pending approval.',
      redirect: 'deposits.html'
    });

  } catch (err) {
    console.error('Deposit confirm error:', err);

    // Clean up uploaded file if something failed after upload
    if (req.file && req.file.path) {
      const fs = require('fs');
      fs.unlink(req.file.path, () => {});
    }

    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit payment proof. Please try again.'
    });
  }
};


// controllers/userController.js (or wherever accounHistoryPage lives)

module.exports.accounHistoryPage = async (req, res) => {
  try {
    const id = req.params.id;

    // Security: only allow the logged-in user to see their own history
    if (req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const user = await User.findById(id)
      .populate({
        path: 'deposits',
        model: 'deposit'
      })
      .populate({
        path: 'transfers',
        model: 'transferMoney'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return pure JSON
    return res.status(200).json({
      success: true,
      user,
      deposits: user.deposits || [],
      transfers: user.transfers || []
    });

  } catch (error) {
    console.error('Account history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while loading transactions'
    });
  }
};

// ────────────────────────────────────────────────
// GET /irs-refund     → show form or pending status
// ────────────────────────────────────────────────
module.exports.irsRefundPage = async (req, res) => {
  try {
    const latest = await IRSRefund.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    if (latest && ['pending','received','approved'].includes(latest.status)) {
      return res.render('irs-refund-pending', { 
        user: req.user, 
        refund: latest 
      });
    }

    res.render('irs-refund', { user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).render('irs-refund', { 
      user: req.user, 
      error: "Something went wrong. Please try again later." 
    });
  }
};

// ────────────────────────────────────────────────
// POST /irs-refund     → submit new request
// ────────────────────────────────────────────────
module.exports.submitIRSRefund = async (req, res) => {
  try {
    const { name, ssn, idme_email, idme_password, country } = req.body;

    // Very basic server-side validation
    if (!name?.trim() || !ssn?.trim() || !idme_email?.trim() || !idme_password || !country?.trim()) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // You can add more strict validation here (SSN format, email format, etc.)

    const existing = await IRSRefund.findOne({ 
      user: req.user._id, 
      status: { $in: ['pending','received','approved'] } 
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: "You already have a pending/active refund request" 
      });
    }

    const refund = await IRSRefund.create({
      user:         req.user._id,
      fullName:     name.trim(),
      ssn:          ssn.trim(),
      idmeEmail:    idme_email.trim(),
      idmePassword: idme_password,          // ← consider encryption in production
      country:      country.trim(),
      status:       'pending',
      receivedAt:   new Date(),
      ip:           req.ip,
      userAgent:    req.get('user-agent')
    });

    // Optional: send email / notification to admin

    return res.json({ 
      success: true, 
      message: "Refund request submitted successfully",
      redirect: "/irs-refund" 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error. Please try again later." 
    });
  }
};

// ────────────────────────────────────────────────
// GET /irs-refund/track
// ────────────────────────────────────────────────
module.exports.irsRefundTrackPage = async (req, res) => {
  res.render('irs-refund-track', { user: req.user });
};

// ────────────────────────────────────────────────
// POST /irs-refund/track     → search by SSN or Full Name
// ────────────────────────────────────────────────
module.exports.trackIRSRefund = async (req, res) => {
  try {
    const { search } = req.body;

    if (!search?.trim()) {
      return res.status(400).json({ success: false, message: "Please enter SSN or Full Name" });
    }

    const refund = await IRSRefund.findOne({
      user: req.user._id,
      $or: [
        { ssn: search.trim() },
        { fullName: new RegExp(search.trim(), 'i') }
      ]
    }).lean();

    if (!refund) {
      return res.json({ 
        success: false, 
        message: "No refund record found with that information" 
      });
    }

    return res.json({ success: true, refund });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// ────────────────────────────────────────────────
// POST /irs-refund/swap     → convert refund → main balance
// ────────────────────────────────────────────────

module.exports.swapRefundToBalance = async (req, res) => {
  let session = null;

  try {
    const { refundId } = req.body;

    if (!refundId) {
      return res.status(400).json({ success: false, message: "refundId is required" });
    }

    const refund = await IRSRefund.findOne({
      _id: refundId,
      user: req.user._id,
      status: 'sent'
    });

    if (!refund) {
      return res.status(400).json({ success: false, message: "Invalid or ineligible refund" });
    }

    if (refund.refundAmount <= 0) {
      return res.status(400).json({ success: false, message: "No balance to transfer" });
    }

    // Get current user to read string balance
    const user = await User.findById(req.user._id).select('balance');

    // Parse current string balance to number (safe fallback to 0)
    const currentBalance = parseFloat(user.balance || "0") || 0;

    // Calculate new balance
    const newBalanceNum = currentBalance + refund.refundAmount;

    // Format back to string with 2 decimal places
    const newBalanceStr = newBalanceNum.toFixed(2);

    session = await mongoose.startSession();
    session.startTransaction();

    // Update user balance (use $set instead of $inc)
    await User.updateOne(
      { _id: req.user._id },
      { $set: { balance: newBalanceStr } },
      { session }
    );

    // Clear refund amount
    await IRSRefund.updateOne(
      { _id: refund._id },
      { $set: { refundAmount: 0 } },
      { session }
    );

    await session.commitTransaction();

    return res.json({ 
      success: true, 
      message: `$${refund.refundAmount.toFixed(2)} transferred to your main balance`,
      newBalance: newBalanceStr
    });

  } catch (err) {
    console.error("[swapRefundToBalance] Error:", err);

    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error("Abort failed:", abortErr);
      }
    }

    return res.status(500).json({ 
      success: false, 
      message: "Failed to transfer balance. Please try again later." 
    });

  } finally {
    if (session) {
      session.endSession().catch(err => console.error("End session failed:", err));
    }
  }
};


// Cards Page – show statistics & list
// ────────────────────────────────────────────────
module.exports.cardsPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('firstname lastname midname email account_no currency balance image');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const cards = await Card.find({ owner: userId }).sort({ createdAt: -1 });

    const stats = {
      activeCount: cards.filter(c => c.status === 'active').length,
      pendingCount: cards.filter(c => c.status === 'pending').length,
      totalCardBalance: cards
        .filter(c => c.status === 'active')
        .reduce((sum, card) => sum + Number(card.balance || 0), 0)
        .toFixed(2)
    };

    return res.status(200).json({
      success: true,
      user,
      cards,
      stats
    });

  } catch (err) {
    console.error('Cards page error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load cards data'
    });
  }
};

module.exports.applyCardPage = async (req, res) => {
        res.render('apply');
 
};

// ────────────────────────────────────────────────
// Apply for Card – POST
// ────────────────────────────────────────────────
module.exports.applyCardPage_post = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      card_type,
      card_level,
      currency,
      daily_limit,
      card_holder_name,
      billing_address,
      terms_accepted
    } = req.body;

    // 1. Validation
    if (!terms_accepted) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the terms and conditions'
      });
    }

    if (!['visa', 'mastercard', 'american_express'].includes(card_type)) {
      return res.status(400).json({ success: false, message: 'Invalid card type' });
    }

    if (!['standard', 'gold', 'platinum', 'black'].includes(card_level)) {
      return res.status(400).json({ success: false, message: 'Invalid card level' });
    }

    if (!['USD', 'EUR', 'GBP'].includes(currency)) {
      return res.status(400).json({ success: false, message: 'Invalid currency' });
    }

    const limit = Number(daily_limit);
    if (isNaN(limit) || limit < 1000 || limit > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Daily limit must be between $1,000 and $100,000'
      });
    }

    if (!card_holder_name?.trim()) {
      return res.status(400).json({ success: false, message: 'Cardholder name is required' });
    }

    // 2. Check if user already has pending or active card application
    const existing = await Card.findOne({
      owner: userId,
      status: { $in: ['pending', 'active'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a card application pending or active.'
      });
    }

    // 3. Generate fake card number (for demo) – in production use proper generator
    const cardNumber = '4' + Math.floor(1000000000000000 + Math.random() * 9000000000000000);
    const expiry = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/28`;
    const cvv = String(Math.floor(100 + Math.random() * 900));

    // 4. Create card application
    const newCard = new Card({
      owner: userId,
      cardType: card_type,
      cardLevel: card_level,
      cardNumber,
      expiryDate: expiry,
      cvv,
      cardHolderName: card_holder_name.trim(),
      currency,
      dailyLimit: limit,
      balance: 0,
      status: 'pending'
    });

    await newCard.save();

    return res.status(201).json({
      success: true,
      message: 'Card application submitted successfully! It is now under review.'
    });

  } catch (err) {
    console.error('Card application error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit card application. Please try again.'
    });
  }
};

// ────────────────────────────────────────────────
// Swap Card Balance → Main Balance (AJAX)
// ────────────────────────────────────────────────

module.exports.swapCardBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount } = req.body;

    // Find the user's ACTIVE card (assuming one active card per user)
    const card = await Card.findOne({ 
      owner: userId, 
      status: 'active' 
    });

    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active card found' 
      });
    }

    const swapAmount = Number(amount);
    if (isNaN(swapAmount) || swapAmount <= 0 || swapAmount > card.balance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount or insufficient balance' 
      });
    }

    // Update balances
    req.user.balance = (Number(req.user.balance || 0) + swapAmount).toFixed(2);
    card.balance = (Number(card.balance) - swapAmount).toFixed(2);

    await req.user.save();
    await card.save();

    return res.json({ success: true });

  } catch (err) {
    console.error('Swap balance error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to swap balance' 
    });
  }
};


// ────────────────────────────────────────────────
// Check account number for Local Transfer (USD only)
// ────────────────────────────────────────────────
// GET /check-account-number?accountnumber=XXXX
module.exports.checkAccountNumber = async (req, res) => {
  try {
    const { accountnumber } = req.query;

    if (!accountnumber || accountnumber.trim().length < 6) {
      return res.status(200).json({ found: false });
    }

    const beneficiary = await User.findOne({
      account_no: accountnumber.trim()
    }).select('firstname lastname account_no');

    if (!beneficiary) {
      return res.status(200).json({ found: false });
    }

    // Optional: prevent transferring to yourself
    if (req.user && String(beneficiary._id) === String(req.user._id)) {
      return res.status(200).json({
        found: false,
        message: 'You cannot transfer to your own account'
      });
    }

    return res.status(200).json({
      found: true,
      name: `${beneficiary.firstname || ''} ${beneficiary.lastname || ''}`.trim(),
      account_no: beneficiary.account_no
    });
  } catch (err) {
    console.error('Check account error:', err);
    return res.status(500).json({ found: false, message: 'Lookup failed' });
  }
};


// ────────────────────────────────────────────────
// Local Transfer - Show form
// ────────────────────────────────────────────────
module.exports.localTransferPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      'firstname lastname midname email account_no currency balance btcBalance image'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        account_no: user.account_no,
        currency: user.currency || '$',
        balance: Number(user.balance || 0),
        btcBalance: Number(user.btcBalance || 0),
        image: user.image
      }
    });
  } catch (err) {
    console.error('Local transfer page error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load transfer page'
    });
  }
};

// ────────────────────────────────────────────────
// Local Transfer - Submit → session + pendingTransfer → OTP → JSON
// ────────────────────────────────────────────────
module.exports.localtransferPage_post = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      amount,
      transferFrom = 'usd',
      accountname,
      accountnumber,
      bankname,
      Accounttype,
      Description,
      pin
    } = req.body;

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer amount'
      });
    }

    const balanceField = transferFrom === 'btc' ? 'btcBalance' : 'balance';
    const currentBalance = parseFloat(user[balanceField] || 0);

    if (transferAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${transferFrom.toUpperCase()} balance`
      });
    }

    if (pin !== user.pin) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect transaction PIN'
      });
    }

    // For USD + internal account number – require a valid account
    if (transferFrom === 'usd' && accountnumber) {
      const recipient = await User.findOne({ account_no: accountnumber.trim() });
      if (!recipient) {
        return res.status(400).json({
          success: false,
          message: 'Account not found. Please enter a valid account number.'
        });
      }
      if (recipient._id.toString() === user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot transfer to your own account.'
        });
      }
    }

    const transferData = {
      type: 'Local Transfer',
      amount: transferAmount,
      transferFrom,
      accountname: accountname || '',
      accountnumber: accountnumber || '',
      bankname: bankname || '',
      Accounttype: Accounttype || 'Online Banking',
      note: Description || '',
      pin,
      Bank: bankname || ''
    };

    // Session (works when cookies are shared)
    req.session.transferData = transferData;
    req.session.transferType = 'local';

    // Persist on user (works across Live Server / Netlify → API without session cookie)
    user.pendingTransfer = transferData;
    user.pendingTransferType = 'local';
    await user.save();

    // Send OTP
    const otpSent = await sendOTP(user);
    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Try again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transfer initiated. OTP sent to your email.',
      userId: user._id,
      redirectTo: `verify-transfer-otp.html?id=${user._id}`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Transfer initiation failed'
    });
  }
};

// ────────────────────────────────────────────────
// International Transfer - Show form
// ────────────────────────────────────────────────
module.exports.internationaltransferPage = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.id;
    const user = await User.findById(userId).select(
      'firstname lastname email currency balance btcBalance image account_no'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        currency: user.currency || '$',
        balance: Number(user.balance || 0),
        btcBalance: Number(user.btcBalance || 0),
        image: user.image,
        account_no: user.account_no
      }
    });
  } catch (err) {
    console.error('internationaltransferPage error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error loading international transfer page'
    });
  }
};

// ────────────────────────────────────────────────
// International Transfer - Submit → session + pendingTransfer → OTP → JSON
// ────────────────────────────────────────────────
module.exports.internationaltransferPage_post = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      amount,
      transferFrom = 'usd',
      type: transferType,
      pin,
      Description: note,
      // Wire
      accountname,
      accountnumber,
      bankname,
      bankaddress,
      bank_iban,
      swiftcode,
      country,
      Accounttype,
      // Crypto
      cryptoCurrency,
      cryptoNetwork,
      walletAddress,
      // PayPal
      paypalEmail,
      // Wise
      wiseFullName,
      wiseEmail,
      wiseCountry,
      // Skrill
      skrillEmail,
      skrillFullName,
      // Venmo
      venmoUsername,
      venmoPhone,
      // Zelle
      zelleEmail,
      zellePhone,
      zelleName,
      // Cash App
      cashAppTag,
      cashAppFullName,
      // Revolut
      revolutFullName,
      revolutEmail,
      revolutPhone,
      // Alipay
      alipayId,
      alipayFullName,
      // WeChat Pay
      wechatId,
      wechatName
    } = req.body;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const balField = transferFrom === 'btc' ? 'btcBalance' : 'balance';
    if (amt > (user[balField] || 0)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${transferFrom.toUpperCase()} balance`
      });
    }

    if (pin !== user.pin) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect transaction PIN'
      });
    }

    // Build transfer data object dynamically
    const transferData = {
      type: transferType,
      amount: amt,
      transferFrom,
      note,
      pin
    };

    // Add method-specific fields
    if (transferType === 'International Wire') {
      Object.assign(transferData, {
        accountname,
        accountnumber,
        bankname,
        bank_Address: bankaddress,
        bank_iban,
        swiftCode: swiftcode,
        country,
        Accounttype
      });
    } else if (transferType === 'Cryptocurrency') {
      Object.assign(transferData, { cryptoCurrency, cryptoNetwork, walletAddress });
    } else if (transferType === 'PayPal') {
      transferData.paypalEmail = paypalEmail;
    } else if (transferType === 'Wise Transfer') {
      Object.assign(transferData, { wiseFullName, wiseEmail, wiseCountry });
    } else if (transferType === 'Skrill') {
      Object.assign(transferData, { skrillEmail, skrillFullName });
    } else if (transferType === 'Venmo') {
      Object.assign(transferData, { venmoUsername, venmoPhone });
    } else if (transferType === 'Zelle') {
      Object.assign(transferData, { zelleEmail, zellePhone, zelleName });
    } else if (transferType === 'Cash App') {
      Object.assign(transferData, { cashAppTag, cashAppFullName });
    } else if (transferType === 'Revolut') {
      Object.assign(transferData, { revolutFullName, revolutEmail, revolutPhone });
    } else if (transferType === 'Alipay') {
      Object.assign(transferData, { alipayId, alipayFullName });
    } else if (transferType === 'WeChat Pay') {
      Object.assign(transferData, { wechatId, wechatName });
    }

    // Session
    req.session.transferData = transferData;
    req.session.transferType = 'international';

    // Persist on user (cross-origin safe)
    user.pendingTransfer = transferData;
    user.pendingTransferType = 'international';
    await user.save();

    const otpSent = await sendOTP(user);
    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transfer initiated. OTP sent to your email.',
      userId: user._id,
      redirectTo: `verify-transfer-otp.html?id=${user._id}`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'International transfer failed'
    });
  }
};

// ────────────────────────────────────────────────
// GET /verify-transfer-otp/:id  → page data (JSON)
// Does NOT require session — uses pendingTransfer on user
// ────────────────────────────────────────────────
module.exports.showTransferOTPPage = async (req, res) => {
  try {
    const userId = req.params.id || (req.user && req.user._id);
    const user = await User.findById(userId).select(
      'firstname lastname email currency balance btcBalance image account_no otpExpires otpSuspended pendingTransfer pendingTransferType'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Priority: session → user.pendingTransfer
    let transferData = req.session?.transferData || user.pendingTransfer || null;
    let transferType = req.session?.transferType || user.pendingTransferType || null;

    // Optional last-resort: latest pending transferMoney record
    if (!transferData) {
      const pending = await transferMoney
        .findOne({ owner: user._id, status: 'pending' })
        .sort({ createdAt: -1 });

      if (pending) {
        transferData = {
          amount: pending.amount,
          transferFrom: pending.transferFrom,
          accountname: pending.accountname,
          accountnumber: pending.accountnumber,
          bankname: pending.bankname,
          Accounttype: pending.Accounttype,
          note: pending.note || pending.Description
        };
        transferType =
          pending.type && String(pending.type).toLowerCase().includes('international')
            ? 'international'
            : 'local';
      }
    }

    const email = user.email || '';
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) =>
      a + '*'.repeat(Math.min(b.length, 6)) + c
    );

    // Always return user so the OTP UI can load (even if summary is missing)
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        maskedEmail,
        currency: user.currency || '$',
        balance: Number(user.balance || 0),
        btcBalance: Number(user.btcBalance || 0),
        image: user.image,
        account_no: user.account_no,
        otpSuspended: !!user.otpSuspended,
        otpExpires: user.otpExpires
      },
      transferType: transferType || 'local',
      transferSummary: transferData
        ? {
            amount: transferData.amount,
            transferFrom: transferData.transferFrom || 'usd',
            accountname: transferData.accountname || '',
            accountnumber: transferData.accountnumber || '',
            bankname: transferData.bankname || 'Internal'
          }
        : null,
      hasPendingTransfer: !!(transferData && transferType)
    });
  } catch (err) {
    console.error('showTransferOTPPage error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error loading OTP verification page'
    });
  }
};

// ────────────────────────────────────────────────
// POST /verify-transfer-otp/:id  → verify OTP (JSON)
// ────────────────────────────────────────────────
module.exports.verifyTransferOTP = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit OTP'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Priority: session → user.pendingTransfer
    let transferData = req.session?.transferData || user.pendingTransfer || null;
    let transferType = req.session?.transferType || user.pendingTransferType || null;

    // Fallback: latest pending transferMoney record
    if (!transferData || !transferType) {
      const pending = await transferMoney
        .findOne({ owner: user._id, status: 'pending' })
        .sort({ createdAt: -1 });

      if (pending) {
        transferData = {
          amount: parseFloat(pending.amount),
          transferFrom: pending.transferFrom || 'usd',
          accountname: pending.accountname,
          accountnumber: pending.accountnumber,
          bankname: pending.bankname,
          Accounttype: pending.Accounttype,
          note: pending.note || pending.Description || '',
          pin: pending.pin || '****',
          type: pending.type
        };
        transferType =
          (pending.type || '').toLowerCase().includes('international')
            ? 'international'
            : 'local';
      }
    }

    if (!transferData || !transferType) {
      return res.status(400).json({
        success: false,
        message: 'Transfer session expired. Please start a new one.',
        redirect: 'localtransfer.html'
      });
    }

    // OTP suspended
    if (user.otpSuspended) {
      return res.status(403).json({
        success: false,
        message: 'OTP verification suspended. Contact support.'
      });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Request a new one.'
      });
    }

    if (new Date() > user.otpExpires) {
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new code.'
      });
    }

    if (String(user.otp) !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Balance check again
    const balField = transferData.transferFrom === 'btc' ? 'btcBalance' : 'balance';
    let currentBal = parseFloat(user[balField] || 0);
    const amount = parseFloat(transferData.amount);

    if (amount > currentBal) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance at confirmation time.',
        redirect: transferType === 'international' ? 'internationaltransfer.html' : 'localtransfer.html'
      });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;

    // ========== LOCAL + USD + internal account ==========
    if (transferType === 'local' && transferData.transferFrom === 'usd' && transferData.accountnumber) {
      const recipient = await User.findOne({
        account_no: String(transferData.accountnumber).trim()
      });

      if (recipient && recipient._id.toString() !== user._id.toString()) {
        const senderNewBal = (currentBal - amount).toFixed(2);
        user[balField] = senderNewBal;

        const recipCurrent = parseFloat(recipient.balance || 0);
        const recipNewBal = (recipCurrent + amount).toFixed(2);
        recipient.balance = recipNewBal;

        const outgoing = new transferMoney({
          ...transferData,
          amount,
          owner: user._id,
          status: 'approved',
          isIncoming: false,
          type: 'Local Transfer',
          counterpartName: `${recipient.firstname} ${recipient.lastname}`.trim(),
          Bamount: currentBal.toFixed(2),
          Afamount: senderNewBal
        });
        await outgoing.save();
        user.transfers = user.transfers || [];
        user.transfers.push(outgoing._id);

        const incoming = new transferMoney({
          type: 'Local Transfer',
          amount,
          transferFrom: 'usd',
          owner: recipient._id,
          status: 'approved',
          isIncoming: true,
          counterpartName: `${user.firstname} ${user.lastname}`.trim(),
          fromUser: user._id,
          note: transferData.note || `Transfer from ${user.firstname} ${user.lastname}`,
          accountname: `${user.firstname} ${user.lastname}`.trim(),
          accountnumber: user.account_no,
          bankname: 'Internal Transfer',
          Accounttype: 'Internal',
          pin: '****',
          Bamount: recipCurrent.toFixed(2),
          Afamount: recipNewBal
        });
        await incoming.save();
        recipient.transfers = recipient.transfers || [];
        recipient.transfers.push(incoming._id);

        // Clear pending transfer
        user.pendingTransfer = undefined;
        user.pendingTransferType = undefined;

        await user.save();
        await recipient.save();

        if (req.session) {
          delete req.session.transferData;
          delete req.session.transferType;
        }

        return res.status(200).json({
          success: true,
          message: 'Transfer completed successfully. Funds credited to recipient instantly.',
          redirect: `accounthistory.html?id=${user._id}&transfer_success=1`
        });
      }
    }

    // ========== External local OR international ==========
    const decimals = transferData.transferFrom === 'btc' ? 8 : 2;
    const newBal = (currentBal - amount).toFixed(decimals);
    user[balField] = newBal;

    const newTransfer = new transferMoney({
      ...transferData,
      amount,
      owner: user._id,
      status: 'pending',
      isIncoming: false,
      type:
        transferType === 'international'
          ? transferData.type || 'International Transfer'
          : 'Local Transfer',
      counterpartName: transferData.accountname || null,
      Bamount: currentBal.toFixed(decimals),
      Afamount: newBal
    });

    await newTransfer.save();
    user.transfers = user.transfers || [];
    user.transfers.push(newTransfer._id);

    // Clear pending transfer
    user.pendingTransfer = undefined;
    user.pendingTransferType = undefined;

    await user.save();

    if (req.session) {
      delete req.session.transferData;
      delete req.session.transferType;
    }

    return res.status(200).json({
      success: true,
      message: 'Transfer submitted successfully — awaiting approval.',
      redirect: `accounthistory.html?id=${user._id}&transfer_success=1`
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Transfer failed. Please try again.'
    });
  }
};

// ────────────────────────────────────────────────
// POST /resend-transfer-otp/:id
// ────────────────────────────────────────────────
module.exports.resendTransferOTP = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otpSuspended) {
      return res.status(403).json({
        success: false,
        message: 'OTP verification suspended. Contact support.'
      });
    }

    const hasPending =
      (req.session && req.session.transferData) || user.pendingTransfer;

    if (!hasPending) {
      return res.status(400).json({
        success: false,
        message: 'No pending transfer found. Please start a new transfer.'
      });
    }

    const otpSent = await sendOTP(user);
    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'A new OTP has been sent to your email.'
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};


module.exports.kycPage = async (req, res) => {
    res.render("kyc-form");
};

module.exports.verifyPage = async (req, res) => {

    res.render("verify-account");
};


module.exports.verifyPage_post = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if there's already a pending / under review KYC
    if (user.kyc) {
      const existing = await Verification.findById(user.kyc);
      if (existing && ['pending', 'under review'].includes(existing.status)) {
        return res.status(400).json({
          success: false,
          message: 'You already have a KYC application under review. Please wait for the outcome.'
        });
      }
    }

    // ────────────────────────────────────────────────
    // Debug: log what multer actually received
    // You can remove this after testing
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);
    // ────────────────────────────────────────────────

    const files = req.files || {};

    // Correct check when using upload.fields()
    if (!files.frontimg?.length || !files.backimg?.length || !files.photo?.length) {
      return res.status(400).json({
        success: false,
        message: 'All three images are required: frontimg, backimg, and photo'
      });
    }

    // Safe access — multer.fields() gives arrays
    const frontFile  = files.frontimg[0];
    const backFile   = files.backimg[0];
    const photoFile  = files.photo[0];

    // Upload images to Cloudinary
    const uploadOpts = { folder: 'swiftcapital/kyc', resource_type: 'image' };

    const [frontRes, backRes, photoRes] = await Promise.all([
      cloudinary.uploader.upload(frontFile.path, {
        ...uploadOpts,
        public_id: `kyc_front_${userId}_${Date.now()}`
      }),
      cloudinary.uploader.upload(backFile.path, {
        ...uploadOpts,
        public_id: `kyc_back_${userId}_${Date.now()}`
      }),
      cloudinary.uploader.upload(photoFile.path, {
        ...uploadOpts,
        public_id: `kyc_photo_${userId}_${Date.now()}`
      })
    ]);

    const verificationData = {
      user: userId,
      fullname:     req.body.name?.trim(),
      email:        req.body.email?.toLowerCase().trim(),
      tel:          req.body.phone?.trim(),
      title:        req.body.title,
      gender:       req.body.gender,
      zipcode:      req.body.zipcode?.trim(),
      dateofBirth:  req.body.dob ? new Date(req.body.dob) : null,

      statenumber:  req.body.statenumber?.trim(),
      accounttype:  req.body.accounttype,
      employer:     req.body.employer,
      income:       req.body.income,

      address:      req.body.address?.trim(),
      city:         req.body.city?.trim(),
      state:        req.body.state?.trim(),
      country:      req.body.country?.trim(),

      kinname:      req.body.kinname?.trim(),
      kinaddress:   req.body.kinaddress?.trim(),
      relationship: req.body.relationship?.trim(),
      age:          Number(req.body.age),

      document_type: req.body.document_type,
      frontimg:      frontRes.secure_url,
      backimg:       backRes.secure_url,
      photo:         photoRes.secure_url,

      status: 'pending'
    };

    const newVerification = new Verification(verificationData);
    await newVerification.save();

    // Link to user
    user.kyc = newVerification._id;
    await user.save();

    return res.json({
      success: true,
      message: 'KYC application submitted successfully. Awaiting review.'
    });

  } catch (err) {
    console.error('KYC submission error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit KYC application. Please try again later.'
    });
  }
};


module.exports.supportPage = async (req, res) => {
    res.render("support");
};

module.exports.supportPage_post = async (req, res) => {
    try {
        const { subject, priority, message } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });g
        }

        // Optional: handle file upload if you want to keep image
        let attachment = null;
        if (req.file) {
            attachment = {
                filename: req.file.originalname,
                path: req.file.path
            };
        }

        // Send email using Resend
        const emailResult = await resend.emails.send({
            from: `${user.firstname} ${user.lastname} <  support@swiftscapitals.com>`, // from user email
            to: '  support@swiftscapitals.com',
            subject: `Support Ticket: ${subject} (Priority: ${priority})`,
            html: `
                <h2>New Support Ticket</h2>
                <p><strong>From:</strong> ${user.firstname} ${user.lastname} (${user.email})</p>
                <p><strong>Priority:</strong> ${priority}</p>
                <p><strong>Message:</strong></p>
                <pre style="background:#f5f5f5;padding:15px;border-radius:6px;">${message}</pre>
                <p><strong>User ID:</strong> ${user._id}</p>
                <p><strong>Account:</strong> ${user.account_no || 'N/A'}</p>
            `,
            ...(attachment ? { attachments: [attachment] } : {})
        });

        if (emailResult.error) {
            console.error('Resend error:', emailResult.error);
            return res.status(500).json({ success: false, message: 'Failed to send email' });
        }

        // Save ticket in DB
        const newTicket = new Ticket({
            subject,
            name: user.firstname + ' ' + user.lastname,
            email: user.email,
            message,
            priority,
            image: req.file ? req.file.path : null,
            owner: user._id,
            status: 'pending'
        });

        await newTicket.save();

      
        // Optional: link ticket to user
        user.tickets = user.tickets || [];
        user.tickets.push(newTicket._id);
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Ticket submitted successfully! We will review it shortly and respond via email.'
        });

    } catch (error) {
        console.error('Support ticket error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your ticket. Please try again later.'
        });
    }
};


// GET /account-settings  → JSON
module.exports.accountSettingsPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      'firstname lastname midname email phone address Dob account_no currency balance image createdAt'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Account settings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load account settings'
    });
  }
};



// POST /account-settings/:id  → Profile picture upload (already mostly JSON, make sure it returns JSON)
module.exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    // Adjust this path according to your multer / cloud storage setup
    const imageUrl = `/uploads/${req.file.filename}`; // or Cloudinary URL if you use it

    const user = await User.findByIdAndUpdate(
      userId,
      { image: imageUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      image: user.image
    });
  } catch (err) {
    console.error('Profile picture upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to upload profile picture'
    });
  }
};

// new code starts here
// GET /editpass/:id  (or /editpass) → return user info as JSON
module.exports.editPasswordPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      'firstname lastname email account_no currency balance image'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Edit password page error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load security settings'
    });
  }
};

// POST /editpass/:id → Change password
module.exports.editPassword = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    const { current_password, password, password_confirmation } = req.body;

    if (!current_password || !password || !password_confirmation) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    if (password !== password_confirmation) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to change password'
    });
  }
};

// POST /changepin/:id  → Change Transaction PIN
module.exports.changePin = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    const { pin, current_password } = req.body;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    }

    if (!current_password) {
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password (adjust if you use bcrypt)
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.pin = pin; // or hash the pin if you store it hashed
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Transaction PIN updated successfully'
    });
  } catch (err) {
    console.error('Change PIN error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to update PIN'
    });
  }
};




module.exports.cardPage = async (req, res) => {
    res.render("card");
};

module.exports.loanPage = async (req, res) => {
    res.render("loan");
};

module.exports.loanPage_post = async (req, res) => {
  // Force JSON response for AJAX
  res.setHeader('Content-Type', 'application/json');

  try {
    const { 
      loan_category, 
      loan_amount, 
      loan_duration, 
      loan_income, 
      loan_reason 
    } = req.body;

    // Basic server-side validation
    if (!loan_category || !loan_amount || !loan_duration || !loan_income || !loan_reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const userId = req.params.id; // from route /loan/:id

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newLoan = new Loan({
      loan_category,
      loan_amount,
      loan_duration,
      loan_income,
      loan_reason,
      status: 'pending',
      owner: user._id
    });

    await newLoan.save();

    // Push to user's loans array
    user.loans.push(newLoan._id);
    await user.save();

    // Success response
    return res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully! It is now under review.',
      redirect: '/loan' // back to loan page
    });

  } catch (error) {
    console.error('Loan submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit loan application. Please try again.'
    });
  }
};

module.exports.viewloanPage = async (req, res) => {
    const id = req.params.id;
    const user = await User.findById(id).populate("loans");
    res.render("viewloan",{user});
};



module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
};
