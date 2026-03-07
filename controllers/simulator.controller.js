// ============================================================
// Simulator Controller — controllers/simulator.controller.js
//
// Endpoints:
//   POST /simulator/pay         — process a simulated payment
//   GET  /simulator/history     — transaction history
//   GET  /simulator/instruments — list user's instruments
// ============================================================

const simulatorService = require('../services/simulator.service');
const instrumentService = require('../services/instrument.service');
const { success, error } = require('../utils/responseHelper');

/**
 * POST /simulator/pay
 *
 * Body:
 *   { payment_method_id: number, amount: number }
 *
 * Calls the simulator engine's processPayment() which:
 *   1. validatePaymentMethod()  — ownership & status
 *   2. updateBalances()         — instrument-specific deduction
 *   3. recordTransaction()      — insert into transactions table
 *   All wrapped in a MySQL transaction with rollback on failure.
 */
exports.processPayment = async (req, res, next) => {
    try {
        const { payment_method_id, amount, pin, receiver_id, receiver_type, otp_code } = req.body;
        const customerId = req.user.id;

        // Input validation
        if (!payment_method_id) {
            return res.status(400).json(error('VALIDATION', 'payment_method_id is required'));
        }
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json(error('VALIDATION', 'amount must be a positive number'));
        }
        if (!pin) {
            return res.status(400).json(error('VALIDATION', 'Payment PIN is required'));
        }
        if (!receiver_id || !receiver_type) {
            return res.status(400).json(error('VALIDATION', 'receiver_id and receiver_type are required'));
        }

        // Call the simulator engine
        const result = await simulatorService.processPayment({
            customerId,
            paymentMethodId: payment_method_id,
            amount: parseFloat(amount),
            pin,
            receiverId: receiver_id,
            receiverType: receiver_type,
            otpCode: otp_code
        });

        // Return appropriate response
        if (result.status === 'success') {
            res.status(200).json(success('Payment processed successfully', {
                txn_id: result.txn_id,
                amount: result.amount,
                payment_method: result.payment_method,
                status: result.status
            }));
        } else if (result.status === 'requires_otp') {
            res.json(success(result.message, { status: 'requires_otp' }));
        } else {
            res.status(400).json(error('PAYMENT_FAILED', result.failure_reason, {
                txn_id: result.txn_id,
                amount: result.amount,
                status: result.status
            }));
        }
    } catch (err) {
        next(err);
    }
};

/**
 * GET /simulator/history
 *
 * Query params: ?page=1&limit=20
 */
exports.getTransactionHistory = async (req, res, next) => {
    try {
        const customerId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await simulatorService.getHistory(customerId, page, limit);
        res.json(success('Transaction history retrieved', result));
    } catch (err) {
        next(err);
    }
};

/**
 * GET /simulator/instruments
 *
 * Returns all instruments grouped by type:
 *   { wallets: [...], credit_cards: [...], bank_accounts: [...] }
 */
exports.getInstruments = async (req, res, next) => {
    try {
        const customerId = req.user.id;
        const instruments = await instrumentService.getCustomerInstruments(customerId);
        res.json(success('Instruments retrieved', instruments));
    } catch (err) {
        next(err);
    }
};

/**
 * GET /simulator/receivers
 * 
 * Returns a list of potential receivers (merchants and other customers).
 */
exports.getReceivers = async (req, res, next) => {
    try {
        const AppDataSource = require('../config/database');
        const { merchants, customers } = require('../src/entities');
        const customerId = req.user.id;

        const merchantRepo = AppDataSource.getRepository(merchants);
        const activeMerchants = await merchantRepo.find({
            where: { status: 'active' },
            select: ['id', 'business_name', 'uuid']
        });

        const customerRepo = AppDataSource.getRepository(customers);
        const queryBuilder = customerRepo.createQueryBuilder("c");
        const activeCustomers = await queryBuilder
            .where("c.status = :status", { status: 'active' })
            .andWhere("c.id != :customerId", { customerId })
            .select(['c.id', 'c.first_name', 'c.last_name', 'c.uuid'])
            .getMany();

        res.json(success('Receivers retrieved', {
            merchants: activeMerchants.map(m => ({ id: m.id, name: m.business_name, type: 'merchant' })),
            customers: activeCustomers.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}`, type: 'customer' }))
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/platform/process-link-payment
 * Public unauthenticated guest checkout for Payment Links
 */
exports.processGuestPayment = async (req, res, next) => {
    try {
        const { session_id, email, method_type, details } = req.body;
        const AppDataSource = require('../config/database');
        const crypto = require('crypto');
        const { v4: uuidv4 } = require('uuid');
        const { customers, credit_cards, bank_accounts, payment_methods } = require('../src/entities');
        const transactionService = require('../services/transaction.service');

        if (!session_id || !email) {
            return res.status(400).json(error('VALIDATION', 'session_id and email are required for guest checkout'));
        }

        // 1. Find or create guest customer
        const customerRepo = AppDataSource.getRepository(customers);
        let guest = await customerRepo.findOneBy({ email });
        if (!guest) {
            guest = await customerRepo.save({
                uuid: uuidv4(),
                first_name: 'Guest',
                last_name: 'Customer',
                email: email,
                password_hash: 'guest_bypass',
                status: 'active'
            });
        }
        const customerId = guest.id;

        // 2. Create Temporary Payment Instrument
        let instrumentId;
        if (method_type === 'card') {
            const cardRepo = AppDataSource.getRepository(credit_cards);
            const card = await cardRepo.save({
                customer_id: customerId,
                card_number_hash: crypto.createHash('sha256').update(details.card_number || '4242424242424242').digest('hex'),
                card_last_four: details.last4 || '4242',
                card_brand: details.brand || 'visa',
                cardholder_name: details.cardholder_name || 'Guest',
                expiry_month: details.expiry_month || '12',
                expiry_year: details.expiry_year || '2030',
                credit_limit: 1000000,
                used_credit: 0
            });
            instrumentId = card.id;
        } else {
            const bankRepo = AppDataSource.getRepository(bank_accounts);
            const bankAccount = await bankRepo.save({
                customer_id: customerId,
                account_number_hash: crypto.createHash('sha256').update(details.upi_id || details.bank || 'guest_account').digest('hex'),
                account_last_four: '9999',
                bank_name: details.bank || 'UPI Central',
                ifsc_code: 'GUEST0001',
                account_holder_name: details.account_holder_name || 'Guest',
                balance: 1000000
            });
            instrumentId = bankAccount.id;
        }

        // Create the payment method bridge
        const methodRepo = AppDataSource.getRepository(payment_methods);
        const method = await methodRepo.save({
            customer_id: customerId,
            method_type: method_type === 'card' ? 'credit_card' : 'bank_account',
            instrument_id: instrumentId,
            is_default: false,
            status: 'active'
        });

        // 3. Process Payment via Transaction Service
        const result = await transactionService.processPayment({
            sessionId: session_id,
            customerId: customerId,
            paymentMethodId: method.id,
            mode: 'platform',
            pin: 'SECRET_BYPASS' // Bypass PIN for public links
        });

        if (result.status === 'success') {
            res.status(200).json(success('Payment link processed successfully', {
                txn_id: result.txn_id,
                amount: result.amount,
                status: result.status
            }));
        } else {
            res.status(400).json(error('PAYMENT_FAILED', result.failure_reason, result));
        }

    } catch (err) {
        next(err);
    }
};
