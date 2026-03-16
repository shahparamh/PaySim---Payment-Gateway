const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes here require ADMIN role
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// GET /api/v1/admin/overview
router.get('/overview', adminController.getDatabaseOverview);

// GET /api/v1/admin/customers
router.get('/customers', adminController.listCustomers);

// GET /api/v1/admin/merchants
router.get('/merchants', adminController.listMerchants);

// PATCH /api/v1/admin/users/:id
router.patch('/users/:id', adminController.updateUserSilent);

// DELETE /api/v1/admin/customers/:id
router.delete('/customers/:id', adminController.deleteCustomerForce);

// DELETE /api/v1/admin/merchants/:id
router.delete('/merchants/:id', adminController.deleteMerchantForce);

// ── Settlement Management ──────────────────────────────
router.get('/settlements', adminController.listSettlements);
router.patch('/settlements/:id', adminController.updateSettlementStatus);

module.exports = router;
