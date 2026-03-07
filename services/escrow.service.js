// ==========================================
// Escrow Service — services/escrow.service.js
// ==========================================

const AppDataSource = require('../config/database');
const { transactions, escrow_accounts, escrow_transactions } = require('../src/entities');


class EscrowService {
    /**
     * Initializes an escrow hold for a transaction
     */
    async holdFunds(transactionId, amount, manager = AppDataSource.manager) {
        const txn = await manager.findOne(transactions, {
            where: { id: transactionId },
            relations: ['merchants', 'customers']
        });

        if (!txn) throw new Error('Transaction not found');

        // 1. Get or Create escrow account for the merchant
        let escrowAccount = await manager.findOne(escrow_accounts, {
            where: { merchant_id: txn.merchant_id }
        });

        if (!escrowAccount) {
            escrowAccount = await manager.save(escrow_accounts, {
                merchant_id: txn.merchant_id,
                currency: txn.currency,
                balance: 0
            });
        }

        // 2. Create the escrow transaction record
        const escrowTxn = await manager.save(escrow_transactions, {
            escrow_account_id: escrowAccount.id,
            transaction_id: transactionId,
            amount: parseFloat(amount),
            status: 'held'
        });

        // 3. Update escrow account balance
        await manager.increment(escrow_accounts, { id: escrowAccount.id }, 'balance', parseFloat(amount));
        await manager.update(escrow_accounts, { id: escrowAccount.id }, { updated_at: new Date() });

        return escrowTxn;
    }

    /**
     * Releases funds from escrow to the merchant
     */
    async releaseFunds(escrowTxnId, manager = AppDataSource.manager) {
        const escrowTxn = await manager.findOne(escrow_transactions, {
            where: { id: parseInt(escrowTxnId) },
            relations: ['escrow_account']
        });

        if (!escrowTxn || escrowTxn.status !== 'held') {
            throw new Error('Escrow transaction not in held state');
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Update escrow transaction status
            await queryRunner.manager.update(escrow_transactions, { id: escrowTxn.id }, {
                status: 'released',
                release_date: new Date(),
                updated_at: new Date()
            });

            // 2. Decrement escrow account balance
            await queryRunner.manager.decrement(escrow_accounts, { id: escrowTxn.escrow_account_id }, 'balance', parseFloat(escrowTxn.amount));
            await queryRunner.manager.update(escrow_accounts, { id: escrowTxn.escrow_account_id }, { updated_at: new Date() });

            // In a real system, you would here move funds 
            // from the internal escrow pool to the merchant's settlement wallet.

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }

        return { success: true };
    }

    /**
     * Refunds funds from escrow back to the customer
     */
    async refundEscrow(escrowTxnId, manager = AppDataSource.manager) {
        // Implementation similar to release but status = refunded
        // and logic to reverse instrument balance would go in the transaction service
    }
}

module.exports = new EscrowService();
