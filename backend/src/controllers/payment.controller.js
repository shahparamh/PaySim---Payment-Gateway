// ============================================================
// Payment Controller — controllers/payment.controller.js
// ============================================================

const transactionService = require('../services/transaction.service');
const AppDataSource = require('../config/database');
const { transactions, refunds } = require('../entities/entities');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/responseHelper');

/**
 * GET /payments/:txnId
 * Get transaction details by transaction ID.
 */
exports.getTransaction = async (req, res, next) => {
    try {
        const txnRepo = AppDataSource.getRepository(transactions);
        const txn = await txnRepo.findOne({
            where: { txn_id: req.params.txnId },
            relations: ['payment_methods']
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
        const txnRepo = AppDataSource.getRepository(transactions);
        const txn = await txnRepo.findOneBy({ txn_id: txnId, status: 'success' });

        if (!txn) {
            return res.status(404).json(
                error('NOT_FOUND', 'Successful transaction not found')
            );
        }

        const refundAmount = amount ? parseFloat(amount) : parseFloat(txn.amount);

        // Check total refunded amount doesn't exceed original
        const refundRepo = AppDataSource.getRepository(refunds);
        const refundedRaw = await refundRepo.createQueryBuilder("r")
            .where("r.transaction_id = :txnId", { txnId: txn.id })
            .andWhere("r.status IN (:...statuses)", { statuses: ['initiated', 'processing', 'completed'] })
            .select("SUM(r.amount)", "_sum_amount")
            .getRawOne();

        const totalRefunded = parseFloat(refundedRaw?._sum_amount || 0);
        if (totalRefunded + refundAmount > parseFloat(txn.amount)) {
            return res.status(400).json(
                error('REFUND_EXCEEDED', 'Refund amount exceeds remaining refundable amount')
            );
        }

        const refundId = uuidv4();
        const refund = await refundRepo.save({
            refund_id: refundId,
            transaction_id: txn.id,
            amount: refundAmount,
            currency: txn.currency,
            reason: reason || null,
            initiated_by: req.user.id,
            initiated_by_type: req.user.type || 'customer',
            status: 'initiated'
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
        const txnRepo = AppDataSource.getRepository(transactions);
        const txn = await txnRepo.findOne({
            where: { txn_id: req.params.txnId },
            select: ['id']
        });

        if (!txn) {
            return res.status(404).json(error('NOT_FOUND', 'Transaction not found'));
        }

        const refundRepo = AppDataSource.getRepository(refunds);
        const refundsList = await refundRepo.find({
            where: { transaction_id: txn.id },
            order: { created_at: 'DESC' }
        });

        res.json(success('Refunds retrieved', refundsList));
    } catch (err) {
        next(err);
    }
};
