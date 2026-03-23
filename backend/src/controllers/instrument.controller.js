// ============================================================
// Instrument Controller — controllers/instrument.controller.js
// ============================================================

const instrumentService = require('../services/instrument.service');
const { success, error } = require('../utils/responseHelper');

// ── Wallets ─────────────────────────────────────────────

exports.createWallet = async (req, res, next) => {
    try {
        const { currency, initial_balance } = req.body;
        const wallet = await instrumentService.createWallet(
            parseInt(req.user.id), currency || 'INR', parseFloat(initial_balance) || 0
        );
        res.status(201).json(success('Wallet created', wallet));
    } catch (err) {
        next(err);
    }
};

exports.getWallets = async (req, res, next) => {
    try {
        const wallets = await instrumentService.getWallets(parseInt(req.user.id));
        res.json(success('Wallets retrieved', wallets));
    } catch (err) {
        next(err);
    }
};

exports.topUpWallet = async (req, res, next) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json(error('VALIDATION', 'A positive amount is required'));
        }
        const wallet = await instrumentService.topUpWallet(
            parseInt(req.params.id), parseInt(req.user.id), parseFloat(amount)
        );
        res.json(success('Wallet topped up', wallet));
    } catch (err) {
        next(err);
    }
};

// ── Credit Cards ────────────────────────────────────────

exports.addCreditCard = async (req, res, next) => {
    try {
        const { card_number, cardholder_name, expiry_month, expiry_year, card_brand, credit_limit } = req.body;

        if (!card_number || !cardholder_name || !expiry_month || !expiry_year) {
            return res.status(400).json(
                error('VALIDATION', 'card_number, cardholder_name, expiry_month, and expiry_year are required')
            );
        }

        const card = await instrumentService.addCreditCard(parseInt(req.user.id), {
            card_number, cardholder_name, expiry_month, expiry_year,
            card_brand: card_brand || 'visa',
            credit_limit: (credit_limit !== undefined && !isNaN(parseFloat(credit_limit))) ? parseFloat(credit_limit) : 50000
        });
        res.status(201).json(success('Credit card added', card));
    } catch (err) {
        next(err);
    }
};

exports.getCreditCards = async (req, res, next) => {
    try {
        const cards = await instrumentService.getCreditCards(parseInt(req.user.id));
        res.json(success('Credit cards retrieved', cards));
    } catch (err) {
        next(err);
    }
};

exports.getCardDetails = async (req, res, next) => {
    try {
        const result = await instrumentService.getFullCardNumber(parseInt(req.params.id), parseInt(req.user.id));
        res.json(success('Card details retrieved', result));
    } catch (err) {
        next(err);
    }
};

exports.removeCreditCard = async (req, res, next) => {
    try {
        await instrumentService.removeCreditCard(parseInt(req.params.id), parseInt(req.user.id));
        res.json(success('Credit card removed'));
    } catch (err) {
        next(err);
    }
};

// ── Bank Accounts ───────────────────────────────────────

exports.addBankAccount = async (req, res, next) => {
    try {
        const { account_number, bank_name, ifsc_code, account_holder_name, account_type, balance } = req.body;

        if (!account_number || !bank_name || !ifsc_code || !account_holder_name) {
            return res.status(400).json(
                error('VALIDATION', 'account_number, bank_name, ifsc_code, and account_holder_name are required')
            );
        }

        const account = await instrumentService.addBankAccount(parseInt(req.user.id), {
            account_number, bank_name, ifsc_code, account_holder_name,
            account_type: account_type || 'savings',
            balance: parseFloat(balance) || 0
        }, req.user.role || 'customer');
        res.status(201).json(success('Bank account added', account));
    } catch (err) {
        next(err);
    }
};

exports.getBankAccounts = async (req, res, next) => {
    try {
        const userId = parseInt(req.user.id);
        const role = req.user.role || 'customer';
        const accounts = await instrumentService.getBankAccounts(userId, role);
        console.log(`🏦 [BANKS_FETCH] UserID: ${userId}, Role: ${role}, Found: ${accounts.length}`);
        res.json(success('Bank accounts retrieved', accounts));
    } catch (err) {
        next(err);
    }
};

exports.removeBankAccount = async (req, res, next) => {
    try {
        await instrumentService.removeBankAccount(parseInt(req.params.id), parseInt(req.user.id), req.user.role || 'customer');
        res.json(success('Bank account removed'));
    } catch (err) {
        next(err);
    }
};

// ── Net Banking ─────────────────────────────────────────

exports.addNetBanking = async (req, res, next) => {
    try {
        const { bank_account_id } = req.body;
        if (!bank_account_id) {
            return res.status(400).json(
                error('VALIDATION', 'bank_account_id is required to link net banking')
            );
        }
        const result = await instrumentService.addNetBanking(parseInt(req.user.id), bank_account_id);
        res.status(201).json(success('Net banking linked', result));
    } catch (err) {
        next(err);
    }
};

// ── Payment Methods (unified) ───────────────────────────

exports.getPaymentMethods = async (req, res, next) => {
    try {
        const methods = await instrumentService.getPaymentMethods(parseInt(req.user.id), req.user.role || 'customer');
        res.json(success('Payment methods retrieved', methods));
    } catch (err) {
        next(err);
    }
};

exports.setDefaultMethod = async (req, res, next) => {
    try {
        await instrumentService.setDefaultMethod(parseInt(req.params.id), parseInt(req.user.id));
        res.json(success('Default payment method updated'));
    } catch (err) {
        next(err);
    }
};

exports.payCreditCardBill = async (req, res, next) => {
    try {
        const { source_method_id, amount, pin } = req.body;
        const cardId = parseInt(req.params.id);

        if (!source_method_id || !amount || amount <= 0 || !pin) {
            return res.status(400).json(error('VALIDATION', 'source_method_id, pin, and a positive amount are required'));
        }

        const result = await instrumentService.payCreditCardBill(
            parseInt(req.user.id), cardId, source_method_id, parseFloat(amount), pin
        );

        res.json(success('Credit card bill paid successfully', result));
    } catch (err) {
        next(err);
    }
};

exports.removeInstrument = async (req, res, next) => {
    try {
        const result = await instrumentService.removePaymentMethod(req.params.id, parseInt(req.user.id));
        res.json(success('Payment method removed successfully', result));
    } catch (err) {
        next(err);
    }
};
