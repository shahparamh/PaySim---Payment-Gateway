// ============================================================
// Payment Routes — routes/payment.routes.js
// ============================================================

const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/v1/payments/:txnId — Get transaction details
router.get('/:txnId', paymentController.getTransaction);

// POST /api/v1/payments/:txnId/refund — Initiate a refund
router.post('/:txnId/refund', paymentController.initiateRefund);

// GET /api/v1/payments/:txnId/refunds — List refunds for a transaction
router.get('/:txnId/refunds', paymentController.getRefunds);

module.exports = router;
