// ============================================================
// Subscription Routes
// ============================================================

const express = require('express');
const router = express.Router();
const subController = require('../controllers/subscription.controller');
const auth = require('../middleware/auth');

// Apply merchant auth lazily to avoid circular dependency issues
router.use((req, res, next) => auth.authenticate(req, res, next));
router.use((req, res, next) => auth.authorize('merchant')(req, res, next));

// Plans
router.post('/plans', subController.createPlan);
router.get('/plans', subController.getPlans);
router.post('/plans/:id/link', subController.createPlanLink);

// Subscriptions
router.post('/enroll', subController.createSubscription);
router.get('/list', subController.getSubscriptions);

module.exports = router;
