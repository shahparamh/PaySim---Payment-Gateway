// ============================================================
// Instrument Routes — routes/instrument.routes.js
// ============================================================

const router = require('express').Router();
const instrumentController = require('../controllers/instrument.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// ── Wallets ──
router.post('/wallets', instrumentController.createWallet);
router.get('/wallets', instrumentController.getWallets);
router.put('/wallets/:id/topup', instrumentController.topUpWallet);

// ── Credit Cards ──
router.post('/cards', instrumentController.addCreditCard);
router.get('/cards', instrumentController.getCreditCards);
router.get('/cards/:id/details', instrumentController.getCardDetails);
router.delete('/cards/:id', instrumentController.removeCreditCard);
router.post('/cards/:id/pay-bill', instrumentController.payCreditCardBill);

// ── Bank Accounts ──
router.post('/bank-accounts', instrumentController.addBankAccount);
router.get('/bank-accounts', instrumentController.getBankAccounts);
router.delete('/bank-accounts/:id', instrumentController.removeBankAccount);

// ── Net Banking ──
router.post('/net-banking', instrumentController.addNetBanking);

// ── Payment Methods (unified view) ──
router.get('/', instrumentController.getPaymentMethods);
router.get('/payment-methods', instrumentController.getPaymentMethods);
router.put('/payment-methods/:id/default', instrumentController.setDefaultMethod);
router.delete('/:id', instrumentController.removeInstrument);

module.exports = router;
