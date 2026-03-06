// ============================================================
// Payment Controller — controllers/payment.controller.js
// ============================================================

const transactionService = require('../services/transaction.service');
const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/responseHelper');

/**
 * GET /payments/:txnId
 * Get transaction details by transaction ID.
 */
exports.getTransaction = async (req, res, next) => {
    try {
        const txn = await prisma.transactions.findFirst({
            where: { txn_id: req.params.txnId },
            include: { payment_methods: { select: { method_type: true } } }
        });

        if (!txn) {
            return res.status(404).json(error('NOT_FOUND', 'Transaction not found'));
        }

        // Format for backward compatibility
        const formatted = {
            ...txn,
            method_type: txn.payment_methods?.method_type
        };

        res.json(success('Transaction retrieved', formatted));
    } catch (err) {
        next(err);
    }
};

/**
 * POST /payments/:txnId/refund
 * Initiate a refund for a transaction.
 */
exports.initiateRefund = async (req, res, next) => {
    try {
        const { amount, reason } = req.body;
        const { txnId } = req.params;

        // Fetch original transaction
        const txn = await prisma.transactions.findFirst({
            where: { txn_id: txnId, status: 'success' }
        });

        if (!txn) {
            return res.status(404).json(
                error('NOT_FOUND', 'Successful transaction not found')
            );
        }

        const refundAmount = amount ? parseFloat(amount) : parseFloat(txn.amount);

        // Check total refunded amount doesn't exceed original
        const refunded = await prisma.refunds.aggregate({
            where: {
                transaction_id: txn.id,
                status: { in: ['initiated', 'processing', 'completed'] }
            },
            _sum: { amount: true }
        });

        const totalRefunded = parseFloat(refunded._sum.amount || 0);
        if (totalRefunded + refundAmount > parseFloat(txn.amount)) {
            return res.status(400).json(
                error('REFUND_EXCEEDED', 'Refund amount exceeds remaining refundable amount')
            );
        }

        const refundId = uuidv4();
        const refund = await prisma.refunds.create({
            data: {
                refund_id: refundId,
                transaction_id: txn.id,
                amount: refundAmount,
                currency: txn.currency,
                reason: reason || null,
                initiated_by: req.user.id,
                initiated_by_type: req.user.type || 'customer'
            }
        });

        res.status(201).json(success('Refund initiated', {
            refund_id: refundId,
            amount: refundAmount,
            currency: txn.currency,
            status: 'initiated'
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * GET /payments/:txnId/refunds
 * List all refunds for a specific transaction.
 */
exports.getRefunds = async (req, res, next) => {
    try {
        const txn = await prisma.transactions.findFirst({
            where: { txn_id: req.params.txnId },
            select: { id: true }
        });

        if (!txn) {
            return res.status(404).json(error('NOT_FOUND', 'Transaction not found'));
        }

        const refunds = await prisma.refunds.findMany({
            where: { transaction_id: txn.id },
            orderBy: { created_at: 'desc' }
        });

        res.json(success('Refunds retrieved', refunds));
    } catch (err) {
        next(err);
    }
};
