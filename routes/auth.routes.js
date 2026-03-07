// ============================================================
// Auth Routes — routes/auth.routes.js
// ============================================================

const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, loginSchema, registerSchema } = require('../middleware/validator');

// ── Public routes ───────────────────────────────────────

// POST /api/v1/auth/register
// Body: { type: 'customer'|'merchant'|'admin', ...fields }
router.post('/register', authLimiter, registerSchema, validate, authController.register);

// POST /api/v1/auth/login
// Body: { email, password, type: 'customer'|'merchant'|'admin' }
router.post('/login', authLimiter, loginSchema, validate, authController.login);

// POST /api/v1/auth/register/verify
// Body: { email, code, type, pending_data }
router.post('/register/verify', authController.verifyRegistrationOTP);

// POST /api/v1/auth/login/verify
// Body: { email, code, type }
router.post('/login/verify', authController.verifyLoginOTP);

// POST /api/v1/auth/forgot-password
// Body: { email, type }
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// POST /api/v1/auth/reset-password
// Body: { email, code, new_password, type }
router.post('/reset-password', authLimiter, authController.resetPassword);


// ── Protected routes ────────────────────────────────────

// POST /api/v1/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/v1/auth/profile — get current user's profile
router.get('/profile', authenticate, authController.getProfile);

// PUT /api/v1/auth/change-password
router.put('/change-password', authenticate, authController.changePassword);

// PUT /api/v1/auth/set-pin
router.put('/set-pin', authenticate, authController.setPaymentPin);

module.exports = router;
