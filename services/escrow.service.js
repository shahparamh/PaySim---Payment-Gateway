// ==========================================
// Escrow Service — services/escrow.service.js
// ==========================================

const prisma = require('../config/prisma');

class EscrowService {
    /**
     * Initializes an escrow hold for a transaction
     */
    async holdFunds(transactionId, amount, tx = prisma) {
        const txn = await tx.transactions.findUnique({
            where: { id: transactionId },
            include: { merchants: true, customers: true }
        });

        if (!txn) throw new Error('Transaction not found');

        // 1. Get or Create escrow account for the merchant
        let escrowAccount = await tx.escrow_accounts.findUnique({
            where: { merchant_id: txn.merchant_id }
        });

        if (!escrowAccount) {
            escrowAccount = await tx.escrow_accounts.create({
                data: {
                    merchant_id: txn.merchant_id,
                    currency: txn.currency,
                    balance: 0
                }
            });
        }

        // 2. Create the escrow transaction record
        const escrowTxn = await tx.escrow_transactions.create({
            data: {
                escrow_account_id: escrowAccount.id,
                transaction_id: transactionId,
                amount: parseFloat(amount),
                status: 'held'
            }
        });

        // 3. Update escrow account balance
        await tx.escrow_accounts.update({
            where: { id: escrowAccount.id },
            data: {
                balance: { increment: parseFloat(amount) },
                updated_at: new Date()
            }
        });

        return escrowTxn;
    }

    /**
     * Releases funds from escrow to the merchant
     */
    async releaseFunds(escrowTxnId, tx = prisma) {
        const escrowTxn = await tx.escrow_transactions.findUnique({
            where: { id: parseInt(escrowTxnId) },
            include: { escrow_account: true }
        });

        if (!escrowTxn || escrowTxn.status !== 'held') {
            throw new Error('Escrow transaction not in held state');
        }

        await tx.$transaction(async (innerTx) => {
            // 1. Update escrow transaction status
            await innerTx.escrow_transactions.update({
                where: { id: escrowTxn.id },
                data: {
                    status: 'released',
                    release_date: new Date(),
                    updated_at: new Date()
                }
            });

            // 2. Decrement escrow account balance
            await innerTx.escrow_accounts.update({
                where: { id: escrowTxn.escrow_account_id },
                data: {
                    balance: { decrement: parseFloat(escrowTxn.amount) },
                    updated_at: new Date()
                }
            });

            // In a real system, you would here move funds 
            // from the internal escrow pool to the merchant's settlement wallet.
        });

        return { success: true };
    }

    /**
     * Refunds funds from escrow back to the customer
     */
    async refundEscrow(escrowTxnId, tx = prisma) {
        // Implementation similar to release but status = refunded
        // and logic to reverse instrument balance would go in the transaction service
    }
}

module.exports = new EscrowService();
