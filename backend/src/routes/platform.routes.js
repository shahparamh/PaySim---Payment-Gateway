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
const { authenticate, authenticateApiKey } = require('../middleware/auth.middleware');
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

// GET /api/v1/platform/apps
router.get('/apps', authenticate, platformController.getApps);

router.get('/seed-demo', async (req, res) => {
    try {
        const AppDataSource = require('../config/database');
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        const { merchants, merchant_apps, api_keys } = require('../entities/entities');

        const merchantRepo = AppDataSource.getRepository(merchants);
        let merchant = await merchantRepo.findOneBy({ business_email: 'merchant@nexstore.com' });

        if (!merchant) {
            merchant = await merchantRepo.save({
                uuid: uuidv4(),
                business_name: 'NexStore Demo',
                business_email: 'merchant@nexstore.com',
                phone: '5551234567',
                password_hash: await bcrypt.hash('password123', 10),
                status: 'active',
                kyc_status: 'verified'
            });
        }

        const appRepo = AppDataSource.getRepository(merchant_apps);
        let app = await appRepo.findOneBy({ merchant_id: merchant.id, app_name: 'NexStore Online' });

        if (!app) {
            app = await appRepo.save({
                merchant_id: merchant.id,
                app_name: 'NexStore Online',
                app_uuid: uuidv4(),
                website_url: 'http://localhost:3000/demo',
                callback_url: 'http://localhost:3000/demo/webhook',
                environment: 'sandbox'
            });
        }

        const keyRepo = AppDataSource.getRepository(api_keys);
        let keys = await keyRepo.find({ where: { merchant_app_id: app.id, key_type: 'secret' } });

        if (keys.length === 0) {
            await keyRepo.save({
                merchant_app_id: app.id,
                key_prefix: 'sk_test_',
                key_hash: 'sk_test_nexstore_demo_key_2026_secure',
                key_type: 'secret'
            });
        }
        res.json({ success: true, message: "Demo merchant seeded: merchant@nexstore.com / password123" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/debug-txns', async (req, res) => {
    try {
        const AppDataSource = require('../config/database');
        const { transactions, payment_sessions } = require('../entities/entities');
        const txnRepo = AppDataSource.getRepository(transactions);
        const txns = await txnRepo.find({
            order: { created_at: 'DESC' },
            take: 10
        });

        const sessionRepo = AppDataSource.getRepository(payment_sessions);
        const sessions = await sessionRepo.find({
            order: { created_at: 'DESC' },
            take: 5
        });

        res.json({ "success": true, txns, sessions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/debug-dashboard', async (req, res, next) => {
    try {
        req.user = { id: 21 }; // Mock merchant
        req.query = { range: 7 };
        await platformController.getDashboard(req, res, next);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Merchant Dashboard (JWT authenticated) ──────────────

// POST /api/v1/platform/process-link-payment (Public guest checkout)
const simulatorController = require('../controllers/simulator.controller');
router.post('/process-link-payment', simulatorController.processGuestPayment);

// GET /api/v1/platform/dashboard
router.get('/dashboard', authenticate, platformController.getDashboard);

// GET /api/v1/platform/transactions
router.get('/transactions', authenticate, platformController.getTransactions);

// ── Merchant Payouts (JWT authenticated) ────────────────
router.get('/payouts', authenticate, platformController.getPayouts);
router.get('/balance', authenticate, platformController.getPayoutBalance);
router.post('/payouts', authenticate, platformController.createPayout);

module.exports = router;
