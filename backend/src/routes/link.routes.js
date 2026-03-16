// ============================================================
// Payment Links Routes
// /api/v1/platform/links
// ============================================================

const express = require('express');
const router = express.Router();
const linkController = require('../controllers/link.controller');
const auth = require('../middleware/auth.middleware');

router.use((req, res, next) => auth.authenticate(req, res, next));
router.use((req, res, next) => auth.authorize('merchant')(req, res, next));

// Create a new payment link
router.post('/', linkController.createLink);

// Get all payment links for the merchant
router.get('/', linkController.getLinks);

module.exports = router;
