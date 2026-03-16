// ============================================================
// Simulator Routes — routes/simulator.routes.js
// ============================================================

const router = require('express').Router();
const simulatorController = require('../controllers/simulator.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { modeResolver } = require('../middleware/modeResolver');

// All simulator routes require authentication and mode tagging
router.use(authenticate);
router.use(modeResolver);

// POST /api/v1/simulator/pay — Process a simulated payment
router.post('/pay', simulatorController.processPayment);

// GET /api/v1/simulator/history — Transaction history for current user
router.get('/history', simulatorController.getTransactionHistory);

// GET /api/v1/simulator/instrument — List user's payment instruments
router.get('/instrument', simulatorController.getInstruments);

// GET /api/v1/simulator/receivers — List potential payment receivers
router.get('/receivers', simulatorController.getReceivers);

module.exports = router;
