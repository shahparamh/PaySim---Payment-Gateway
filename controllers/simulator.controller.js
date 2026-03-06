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
        const prisma = require('../config/prisma');
        const customerId = req.user.id;

        const merchants = await prisma.merchants.findMany({
            where: { status: 'active' },
            select: { id: true, business_name: true, uuid: true }
        });

        const customers = await prisma.customers.findMany({
            where: { status: 'active', NOT: { id: customerId } },
            select: { id: true, first_name: true, last_name: true, uuid: true }
        });

        res.json(success('Receivers retrieved', {
            merchants: merchants.map(m => ({ id: m.id, name: m.business_name, type: 'merchant' })),
            customers: customers.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}`, type: 'customer' }))
        }));
    } catch (err) {
        next(err);
    }
};
