// ============================================================
// Dashboard Routes — routes/dashboard.routes.js
//
// Admin + role-aware dashboard endpoints.
// Fraud alert management is admin-only.
// ============================================================

const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// ── Role-aware routes (customer/merchant/admin) ─────────

// GET /api/v1/dashboard/stats
router.get('/stats', dashboardController.getStats);

// GET /api/v1/dashboard/transactions
router.get('/transactions', dashboardController.getTransactions);

// GET /api/v1/dashboard/settlements
router.get('/settlements', dashboardController.getSettlements);

// ── Admin-only: Fraud Alert Management ──────────────────

// GET /api/v1/dashboard/fraud-alerts/stats — Fraud overview stats
router.get('/fraud-alerts/stats',
    authorize('admin', 'super_admin'),
    dashboardController.getFraudAlertStats
);

// GET /api/v1/dashboard/fraud-alerts — Paginated alert list
router.get('/fraud-alerts',
    authorize('admin', 'super_admin'),
    dashboardController.getFraudAlerts
);

// GET /api/v1/dashboard/fraud-alerts/:id — Single alert detail
router.get('/fraud-alerts/:id',
    authorize('admin', 'super_admin'),
    dashboardController.getFraudAlertDetail
);

// PUT /api/v1/dashboard/fraud-alerts/:id/resolve — Resolve alert
router.put('/fraud-alerts/:id/resolve',
    authorize('admin', 'super_admin'),
    dashboardController.resolveFraudAlert
);

// GET /api/v1/dashboard/customer-risk/:customerId — Customer risk score
router.get('/customer-risk/:customerId',
    authorize('admin', 'super_admin'),
    dashboardController.getCustomerRisk
);

module.exports = router;
