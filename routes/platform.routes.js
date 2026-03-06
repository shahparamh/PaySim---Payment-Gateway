// ============================================================
// Platform / Gateway Routes — routes/platform.routes.js
//
// External-facing gateway APIs for merchant integrations.
// All payment endpoints use API key authentication (x-api-key).
//
// Gateway APIs:
//   POST /create-payment-session   — create a checkout session
//   GET  /payment/:session_id      — get session/payment details
//   POST /process-payment          — process payment on a session
//   GET  /payment-status           — check payment status by txn_id
//
// Merchant Management:
//   POST /register-app             — register a merchant application
//   POST /api-keys                 — generate API key for an app
//   GET  /api-keys                 — list merchant's API keys
//   GET  /dashboard                — merchant analytics
// ============================================================

const router = require('express').Router();
const platformController = require('../controllers/platform.controller');
const { authenticate, authenticateApiKey } = require('../middleware/auth');
const { modeResolver } = require('../middleware/modeResolver');
const { platformSessionLimiter } = require('../middleware/rateLimiter');
const { validate, sessionSchema } = require('../middleware/validator');

router.use(modeResolver);

// ── Gateway APIs (API-key authenticated) ────────────────

// POST /api/v1/platform/create-payment-session
router.post('/create-payment-session', authenticateApiKey, platformSessionLimiter, sessionSchema, validate, platformController.createPaymentSession);

// GET /api/v1/platform/payment/:session_id
// Publicly accessible for the hosted checkout page
router.get('/payment/:session_id', platformController.getPayment);

// POST /api/v1/platform/process-payment
// Authentication is optional to support Guest Checkout
router.post('/process-payment', (req, res, next) => {
    // If authorization header exists, authenticate, otherwise continue as guest
    if (req.headers.authorization) {
        return authenticate(req, res, next);
    }
    next();
}, platformController.processPayment);

// GET /api/v1/platform/payment-status
router.get('/payment-status', authenticateApiKey, platformController.getPaymentStatus);

// ── Merchant App Management (JWT authenticated) ─────────

// POST /api/v1/platform/register-app
router.post('/register-app', authenticate, platformController.registerApp);

// POST /api/v1/platform/api-keys
router.post('/api-keys', authenticate, platformController.createApiKey);

// GET /api/v1/platform/api-keys
router.get('/api-keys', authenticate, platformController.getApiKeys);

// ── Merchant Dashboard (JWT authenticated) ──────────────

// GET /api/v1/platform/dashboard
router.get('/dashboard', authenticate, platformController.getDashboard);

// GET /api/v1/platform/transactions
router.get('/transactions', authenticate, platformController.getTransactions);

module.exports = router;
