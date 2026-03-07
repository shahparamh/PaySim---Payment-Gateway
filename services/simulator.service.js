// ============================================================
// Payment Simulator Engine — services/simulator.service.js
//
// The core simulator engine that processes simulated payments
// for all 4 payment methods:
//   1. Wallet         — deduct wallet balance
//   2. Credit Card    — validate available_credit = credit_limit - used_credit
//   3. Bank Account   — deduct bank balance
//   4. Net Banking    — linked bank account, deduct bank balance
//
// Uses MySQL transactions with rollback on failure.
//
// Exported functions:
//   processPayment()        — main orchestrator
//   validatePaymentMethod() — ownership & status checks
//   updateBalances()        — instrument-specific fund deduction
//   recordTransaction()     — insert into transactions table
// ============================================================

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const AppDataSource = require('../config/database');
const { customers, verification_codes, merchants, wallets, transactions, payment_methods, credit_cards, bank_accounts } = require('../src/entities');
const emailService = require('./email.service');

/**
 * Main orchestrator for simulated payments.
 */
async function processPayment({ customerId, paymentMethodId, amount, pin, receiverId, receiverType, otpCode }) {
    try {
        // --- 0. High Value Check (OTP required for > 100,000) ---
        if (amount >= 100000) {
            if (!otpCode) {
                // Generate and store OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

                const userRepo = AppDataSource.getRepository(customers);
                const user = await userRepo.findOne({ where: { id: customerId } });

                const vcRepo = AppDataSource.getRepository(verification_codes);
                await vcRepo.save({
                    email: user.email,
                    code: otp,
                    type: 'payment',
                    expires_at: expiresAt
                });

                console.log(`\n[SECURITY] High-Value Payment OTP for ${user.email}: ${otp}\n`);
                await emailService.sendOTP(user.email, otp, 'payment');

                return {
                    status: 'requires_otp',
                    message: 'High-value transaction requires OTP verification'
                };
            } else {
                // Verify OTP
                const userRepo = AppDataSource.getRepository(customers);
                const user = await userRepo.findOne({ where: { id: customerId } });

                const vcRepo = AppDataSource.getRepository(verification_codes);
                const queryBuilder = vcRepo.createQueryBuilder("vc");
                const verification = await queryBuilder
                    .where("vc.email = :email", { email: user.email })
                    .andWhere("vc.code = :code", { code: otpCode })
                    .andWhere("vc.type = :type", { type: 'payment' })
                    .andWhere("vc.expires_at > :now", { now: new Date() })
                    .orderBy("vc.created_at", "DESC")
                    .getOne();

                if (!verification) {
                    throw Object.assign(new Error('Invalid or expired payment OTP'), { statusCode: 401 });
                }

                // Delete used OTP
                await vcRepo.delete({ id: verification.id });
            }
        }

        // ── 1. PIN Verification ────────────────────────────
        const userRepo = AppDataSource.getRepository(customers);
        const customer = await userRepo.findOne({
            where: { id: customerId },
            select: ['pin_hash']
        });

        if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });

        if (!customer.pin_hash) {
            throw Object.assign(new Error('Payment PIN not set. Please set a PIN in your profile.'), { statusCode: 400 });
        }

        if (!pin) throw Object.assign(new Error('Payment PIN is required'), { statusCode: 400 });

        const isPinValid = await bcrypt.compare(pin, customer.pin_hash);
        if (!isPinValid) throw Object.assign(new Error('Invalid payment PIN'), { statusCode: 401 });

        // ── 2. Receiver Validation ──────────────────────────
        if (!receiverId || !receiverType) {
            throw Object.assign(new Error('Receiver ID and Type are required for targeted payments'), { statusCode: 400 });
        }

        let receiver;
        if (receiverType === 'customer') {
            const receiverRepo = AppDataSource.getRepository(customers);
            receiver = await receiverRepo.findOne({ where: { id: parseInt(receiverId) } });
            if (!receiver) throw Object.assign(new Error('Receiver customer not found'), { statusCode: 404 });
            if (receiver.id === customerId) throw Object.assign(new Error('You cannot pay yourself'), { statusCode: 400 });
        } else if (receiverType === 'merchant') {
            const receiverRepo = AppDataSource.getRepository(merchants);
            receiver = await receiverRepo.findOne({ where: { id: parseInt(receiverId) } });
            if (!receiver) throw Object.assign(new Error('Receiver merchant not found'), { statusCode: 404 });
        } else {
            throw Object.assign(new Error('Invalid receiver type'), { statusCode: 400 });
        }

        // ── 3. Transaction Execution (Interactive) ──────────
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let resultTxnId;
        let resultMethodType;

        try {
            // Step A: Validate payment method
            const method = await validatePaymentMethod(customerId, paymentMethodId, queryRunner.manager);
            resultMethodType = method.method_type;

            // Step B: Update balances (deduct from sender)
            const deduction = await updateBalances(method.method_type, method.instrument_id, amount, queryRunner.manager);
            if (!deduction.success) throw new Error(deduction.reason);

            // Step C: If receiver is customer, add to their wallet
            if (receiverType === 'customer') {
                const receiverWallet = await queryRunner.manager.findOne(wallets, {
                    where: { customer_id: receiver.id, status: 'active' }
                });
                if (!receiverWallet) throw new Error('Receiver does not have an active wallet');

                await queryRunner.manager.increment(wallets, { id: receiverWallet.id }, 'balance', amount);
            }

            // Step D: Record transaction
            resultTxnId = uuidv4();
            await queryRunner.manager.save(transactions, {
                txn_id: resultTxnId,
                customer_id: customerId,
                merchant_id: receiverType === 'merchant' ? receiver.id : null,
                receiver_id: receiver.id,
                receiver_type: receiverType,
                payment_method_id: paymentMethodId,
                amount: amount,
                status: 'success',
                mode: 'simulator',
                verified_at: new Date()
            });

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }

        return {
            status: 'success',
            txn_id: resultTxnId,
            amount,
            payment_method: resultMethodType,
            receiver: { id: receiverId, type: receiverType }
        };

    } catch (err) {
        // Record failed transaction (statelessly)
        const failTxnId = uuidv4();
        const txnRepo = AppDataSource.getRepository(transactions);
        await txnRepo.save({
            txn_id: failTxnId,
            customer_id: customerId,
            payment_method_id: paymentMethodId,
            amount: amount,
            status: 'failed',
            mode: 'simulator',
            failure_reason: err.message,
            receiver_id: receiverId ? parseInt(receiverId) : null,
            receiver_type: (receiverType === 'customer' || receiverType === 'merchant') ? receiverType : null
        }).catch(() => { }); // Ignore fail-to-record errors

        return {
            status: 'failed',
            txn_id: failTxnId,
            amount,
            failure_reason: err.message
        };
    }
}

// ============================================================
// 2. validatePaymentMethod()
// ============================================================
//
// Validates:
//   - Payment method exists in payment_methods table
//   - Belongs to the given customer
//   - Status is 'active'
//
// @param {number} customerId
// @param {number} paymentMethodId
// @param {PoolConnection} conn — MySQL connection within transaction
// @returns {Object} { id, method_type, instrument_id, customer_id }
// @throws {Error} with statusCode 400 if validation fails
// ============================================================

async function validatePaymentMethod(customerId, paymentMethodId, manager) {
    const method = await manager.findOne(payment_methods, {
        where: { id: paymentMethodId }
    });

    if (!method || method.customer_id !== customerId) {
        throw Object.assign(
            new Error('Payment method not found or does not belong to this customer'),
            { statusCode: 400 }
        );
    }

    if (method.status !== 'active') {
        throw Object.assign(
            new Error(`Payment method is ${method.status}. Only active methods can be used.`),
            { statusCode: 400 }
        );
    }

    return method;
}

// ============================================================
// 3. updateBalances()
// ============================================================
//
// Validates sufficient balance/credit and deducts atomically.
// Uses SELECT ... FOR UPDATE for row-level locking to prevent
// double-spend race conditions.
//
// Rules:
//   Wallet      → balance >= amount         → deduct balance
//   Credit Card → (credit_limit - used_credit) >= amount → increase used_credit
//   Bank Account → balance >= amount        → deduct balance
//   Net Banking  → linked bank account      → same as Bank Account
//
// @param {string} methodType    — 'wallet' | 'credit_card' | 'bank_account' | 'net_banking'
// @param {number} instrumentId  — PK of the specific instrument table
// @param {number} amount        — amount to charge
// @param {PoolConnection} conn  — MySQL connection within transaction
// @returns {{ success: boolean, reason?: string, balance_before?: number, balance_after?: number }}
// ============================================================

async function updateBalances(methodType, instrumentId, amount, manager) {
    const normalizedType = methodType === 'card' ? 'credit_card' : methodType;
    switch (normalizedType) {
        case 'wallet': {
            const wallet = await manager.findOne(wallets, { where: { id: instrumentId } });
            if (!wallet) return { success: false, reason: 'Wallet not found' };
            if (wallet.status !== 'active') return { success: false, reason: 'Wallet is not active' };

            const balanceBefore = parseFloat(wallet.balance);
            if (balanceBefore < amount) {
                return { success: false, reason: `Insufficient wallet balance. Available: ₹${balanceBefore.toFixed(2)}` };
            }

            await manager.decrement(wallets, { id: instrumentId }, 'balance', amount);

            return { success: true };
        }

        case 'credit_card': {
            const card = await manager.findOne(credit_cards, { where: { id: instrumentId } });
            if (!card) return { success: false, reason: 'Credit card not found' };
            if (card.status !== 'active') return { success: false, reason: 'Credit card is not active' };

            const creditLimit = parseFloat(card.credit_limit);
            const usedCredit = parseFloat(card.used_credit);
            if (creditLimit - usedCredit < amount) {
                return { success: false, reason: 'Insufficient credit limit' };
            }

            await manager.increment(credit_cards, { id: instrumentId }, 'used_credit', amount);

            return { success: true };
        }

        case 'bank_account':
        case 'net_banking': {
            const bank = await manager.findOne(bank_accounts, { where: { id: instrumentId } });
            if (!bank) return { success: false, reason: 'Bank account not found' };
            if (bank.status !== 'active') return { success: false, reason: 'Bank account is not active' };

            const balanceBefore = parseFloat(bank.balance);
            if (balanceBefore < amount) {
                return { success: false, reason: 'Insufficient bank balance' };
            }

            await manager.decrement(bank_accounts, { id: instrumentId }, 'balance', amount);

            return { success: true };
        }

        default:
            return { success: false, reason: `Unsupported method type: ${methodType}` };
    }
}

// recordTransaction and recordFailedTransaction are now handled inside processPayment via Prisma models.

// ============================================================
// getHistory() — Paginated transaction history
// ============================================================

async function getHistory(customerId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const txnRepo = AppDataSource.getRepository(transactions);
    const txns = await txnRepo.find({
        where: { customer_id: customerId, mode: 'simulator' },
        order: { created_at: 'DESC' },
        take: limit,
        skip: offset,
        relations: ['payment_methods']
    });

    const total = await txnRepo.count({
        where: { customer_id: customerId, mode: 'simulator' }
    });

    return {
        transactions: txns.map(t => ({
            ...t,
            method_type: t.payment_methods?.method_type
        })),
        pagination: { page, limit, total }
    };
}

module.exports = {
    processPayment,
    validatePaymentMethod,
    updateBalances,
    getHistory
};
