const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');

const router = express.Router();

// Rate limiting for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    error: 'Too many registration attempts',
    message: 'Please try again after 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    error: 'Too many password reset attempts',
    message: 'Please try again after 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    {string} email - User's email address
 * @body    {string} password - User's password (min 8 chars, must contain uppercase, lowercase, and number)
 * @body    {string} [fullName] - User's full name
 * @body    {string} [phone] - User's phone number
 */
router.post('/register', 
  registerLimiter,
  authValidation.register, 
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 * @body    {string} email - User's email address
 * @body    {string} password - User's password
 */
router.post('/login', 
  loginLimiter,
  authValidation.login, 
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @body    {string} refreshToken - Valid refresh token
 */
router.post('/refresh', 
  authValidation.refreshToken, 
  authController.refreshToken
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.get('/profile', 
  authenticate, 
  authController.getProfile
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 * @headers {string} Authorization - Bearer token
 * @body    {string} [fullName] - User's full name
 * @body    {string} [phone] - User's phone number
 */
router.put('/profile', 
  authenticate,
  authValidation.updateProfile, 
  authController.updateProfile
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @headers {string} Authorization - Bearer token
 * @body    {string} currentPassword - Current password
 * @body    {string} newPassword - New password (min 8 chars, must contain uppercase, lowercase, and number)
 */
router.post('/change-password', 
  authenticate,
  passwordResetLimiter,
  authValidation.changePassword, 
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify user's email address
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.post('/verify-email', 
  authenticate, 
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client-side token invalidation)
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.post('/logout', 
  authenticate, 
  authController.logout
);

/**
 * @route   GET /api/v1/auth/validate
 * @desc    Validate access token
 * @access  Private
 * @headers {string} Authorization - Bearer token
 */
router.get('/validate', 
  authenticate, 
  authController.validateToken
);

module.exports = router;