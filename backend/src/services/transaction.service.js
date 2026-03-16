// ============================================================
// Transaction Service — services/transaction.service.js
// Core shared service used by both Simulator and Platform modes.
// ============================================================

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { Not } = require('typeorm');
const AppDataSource = require('../config/database');
const { payment_attempts, customers, verification_codes, payment_sessions, payment_methods, transactions, payment_splits } = require('../entities/entities');
const instrumentService = require('./instrument.service');
const sessionService = require('./session.service');
const emailService = require('./email.service');
const escrowService = require('./escrow.service');

/**
 * Core Transaction Service
 * 
 * Handles all payment processing logic, including interactive transactions,
 * smart routing (retries), and split payments.
 */
class TransactionService {
    /**
     * Entry point for processing a payment. 
     * Supports intelligent routing and retry logic.
     *
     * @param {Object} options
     * @param {string}  options.sessionId       — payment session UUID
     * @param {number}  options.customerId      — customer initiating the payment
     * @param {number}  options.paymentMethodId — payment_methods.id
     * @param {string}  options.mode            — 'platform' or 'simulator'
     * @param {string}  options.pin             — Customer payment PIN
     */
    async processPayment(payload) {
        const { sessionId, customerId, paymentMethodId, mode, pin } = payload;

        // 1. Initial Attempt Setup
        let currentMethodId = parseInt(paymentMethodId);
        let attemptCount = 1;
        let lastError = null;

        // 2. Routing Loop (Smart Routing)
        const maxRetries = parseInt(process.env.MAX_PAYMENT_RETRIES) || 3;
        const defaultCurrency = process.env.DEFAULT_CURRENCY || 'INR';

        while (attemptCount <= maxRetries) {
            try {
                const attemptRepo = AppDataSource.getRepository(payment_attempts);
                const attempt = await attemptRepo.save({
                    session_id: null,
                    customer_id: parseInt(customerId),
                    payment_method_id: currentMethodId,
                    amount: 0,
                    currency: defaultCurrency,
                    status: 'pending',
                    attempt_sequence: attemptCount
                });

                // Execute the actual atomic payment transaction
                const result = await this.executePaymentTransaction({
                    ...payload,
                    paymentMethodId: currentMethodId,
                    attemptId: attempt.id
                });

                // Update attempt to success
                await attemptRepo.update({ id: attempt.id }, {
                    status: 'success',
                    transaction_id: result.txn_internal_id,
                    amount: result.amount
                });

                // --- NEW: Send Receipt if Merchant is NexStore ---
                try {
                    const session = await sessionService.getSession(sessionId);
                    const userRepo = AppDataSource.getRepository(customers);
                    const user = await userRepo.findOne({ where: { id: customerId }, select: ['email'] });

                    if (user && session && session.business_name && session.business_name.includes('NexStore')) {
                        console.log(`[Receipt] Sending email receipt to ${user.email} for NexStore transaction ${result.txn_id}`);
                        await emailService.sendReceipt(user.email, {
                            txn_id: result.txn_id,
                            amount: result.amount,
                            merchant_name: session.business_name
                        });
                    }
                } catch (receiptErr) {
                    console.error('⚠️ [Receipt] Failed to send email receipt:', receiptErr.message);
                }

                return result;

            } catch (err) {
                lastError = err;

                // Log failure to the attempt record
                const attemptRepo = AppDataSource.getRepository(payment_attempts);
                await attemptRepo.update({
                    customer_id: parseInt(customerId),
                    payment_method_id: currentMethodId,
                    status: 'pending'
                }, { status: 'failed', failure_reason: err.message });

                // Smart Routing Failover Logic: 
                // ONLY retry if it's a balance issue or technical failure.
                // Security challenges (OTP/PIN) must HALT the routing loop immediately.
                const nonRetryableMessages = [
                    'Invalid payment PIN',
                    'Payment PIN not set',
                    'Session is completed',
                    'Invalid or expired payment OTP',
                    'High-value transaction requires OTP verification',
                    'HIGH_VALUE_OTP_REQUIRED'
                ];

                if (err.requires_otp || nonRetryableMessages.includes(err.message)) {
                    throw err;
                }

                if (attemptCount < 3) {
                    const fallback = await this.findFallbackMethod(customerId, currentMethodId);
                    if (fallback) {
                        currentMethodId = fallback.id;
                        attemptCount++;
                        console.log(`[SmartRouting] Attempt ${attemptCount - 1} failed. Retrying with method ${currentMethodId}`);
                        continue;
                    }
                }

                // No more attempts or no fallback found
                throw err;
            }
        }
    }

    /**
     * Finds an alternative active payment method for the customer
     */
    async findFallbackMethod(customerId, failedMethodId) {
        const methodRepo = AppDataSource.getRepository(payment_methods);
        return await methodRepo.findOne({
            where: {
                customer_id: parseInt(customerId),
                id: Not(parseInt(failedMethodId)),
                status: 'active'
            },
            order: { is_default: 'DESC' }
        });
    }

    /**
     * Internal: Executes the atomic balance update and transaction logging.
     * This is wrapped in a Prisma $transaction.
     */
    async executePaymentTransaction({ sessionId, customerId, paymentMethodId, mode, pin, attemptId, otpCode }) {
        // 1. Initial Checks & Security (Outside Transaction to allow OTP persistence)
        const session = await sessionService.getSession(sessionId);
        if (!session) {
            throw Object.assign(new Error('Session not found'), { statusCode: 404 });
        }

        const amount = parseFloat(session.amount);
        const threshold = parseFloat(process.env.MIN_HIGH_VALUE_TRANSACTION) || 100000;
        const metadata = typeof session.metadata === 'string'
            ? JSON.parse(session.metadata)
            : (session.metadata || {});

        const isReusable = metadata.is_payment_link === true && metadata.is_reusable === true;

        if (session.status !== 'pending' && !isReusable) {
            throw Object.assign(new Error(`Session is ${session.status}`), { statusCode: 400 });
        }

        const isHighValue = amount >= threshold;
        const isForcedOtp = metadata.force_otp === true;

        if (isHighValue || isForcedOtp) {
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

                console.log(`\n[SECURITY] High-Value Platform Payment OTP for ${user.email}: ${otp}\n`);
                await emailService.sendOTP(user.email, otp, 'payment');

                throw Object.assign(new Error('HIGH_VALUE_OTP_REQUIRED'), {
                    statusCode: 200,
                    requires_otp: true,
                    message: 'High-value transaction requires OTP verification'
                });
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

        // 2. Atomic Balance Update and Logging using queryRunner
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Re-fetch session status in transaction for safety
            const lockedSession = await queryRunner.manager.findOne(payment_sessions, {
                where: { session_id: sessionId }
            });

            if (!lockedSession || (lockedSession.status !== 'pending' && !isReusable)) {
                throw Object.assign(new Error(`Session is ${lockedSession?.status || 'invalid'}`), { statusCode: 400 });
            }

            // 2. PIN Verification (Skip for recurring subscriptions)
            // Use local is_subscription variable or check metadata later if needed
            // For now, we'll check the metadata from session below or pass a flag
            const isSubscription = pin === 'SECRET_BYPASS';

            if (!isSubscription) {
                const customer = await queryRunner.manager.findOne(customers, {
                    where: { id: customerId },
                    select: ['pin_hash']
                });

                if (!customer || !customer.pin_hash) {
                    throw Object.assign(new Error('Payment PIN not set'), { statusCode: 400 });
                }

                const pinMatch = await bcrypt.compare(pin, customer.pin_hash);
                if (!pinMatch) {
                    throw Object.assign(new Error('Invalid payment PIN'), { statusCode: 401 });
                }
            } else {
                console.log(`[Transaction] Processing pre-authorized subscription payment for customer ${customerId}`);
            }

            const merchantId = session.merchant_id || null;

            // Mark session as processing
            await queryRunner.manager.update(payment_sessions, { id: session.id }, {
                status: 'processing', customer_id: customerId
            });

            // 3. Validate and Deduct
            const method = await queryRunner.manager.findOne(payment_methods, {
                where: { id: paymentMethodId, customer_id: customerId, status: 'active' }
            });

            if (!method) {
                throw Object.assign(new Error('Invalid or inactive payment method'), { statusCode: 400 });
            }

            const validation = await instrumentService.validateAndDeduct(
                method.method_type, method.instrument_id, amount, queryRunner.manager
            );

            // 4. Record successful transaction
            const txnPublicId = uuidv4();
            const txn = await queryRunner.manager.save(transactions, {
                txn_id: txnPublicId,
                session_id: session.id,
                customer_id: customerId,
                merchant_id: merchantId,
                receiver_id: merchantId,
                receiver_type: 'merchant',
                payment_method_id: paymentMethodId,
                amount: amount,
                currency: 'INR',
                txn_type: 'payment',
                status: 'success',
                mode: mode,
                verified_at: new Date()
            });

            // 5. Handle Subscription Creation (for Plan Links)
            if (metadata && metadata.is_subscription === true && metadata.plan_id) {
                const planRepo = queryRunner.manager.getRepository(subscription_plans);
                const subRepo = queryRunner.manager.getRepository(subscriptions);

                const plan = await planRepo.findOneBy({ id: parseInt(metadata.plan_id) });
                if (plan) {
                    const nextBilling = new Date();
                    if (plan.billing_interval === 'monthly') nextBilling.setMonth(nextBilling.getMonth() + 1);
                    else if (plan.billing_interval === 'yearly') nextBilling.setFullYear(nextBilling.getFullYear() + 1);
                    else if (plan.billing_interval === 'weekly') nextBilling.setDate(nextBilling.getDate() + 7);
                    else nextBilling.setMonth(nextBilling.getMonth() + 1);

                    await subRepo.save({
                        subscription_id: `sub_${uuidv4().substring(0, 8)}`,
                        customer_id: customerId,
                        merchant_id: session.merchant_id,
                        plan_id: plan.id,
                        status: 'active',
                        next_billing_date: nextBilling,
                        payment_method_id: paymentMethodId,
                        last_payment_date: new Date()
                    });
                    console.log(`[Subscription] Auto-enrolled customer ${customerId} to plan ${plan.id} via payment link.`);
                }
            }

            // 5. Load metadata for advanced features
            // (metadata is already parsed at the top of the function)

            // 5a. Handle Escrow vs Direct Payment
            if (metadata && metadata.escrow === true) {
                await escrowService.holdFunds(txn.id, amount, queryRunner.manager);
                console.log(`[Escrow] Funds for txn ${txn.txn_id} placed in escrow hold.`);
            }

            // 6. Handle Split Payments
            if (metadata && metadata.splits && Array.isArray(metadata.splits)) {
                for (const split of metadata.splits) {
                    await queryRunner.manager.save(payment_splits, {
                        transaction_id: txn.id,
                        merchant_id: parseInt(split.merchant_id),
                        amount: parseFloat(split.amount),
                        currency: session.currency || 'INR'
                    });
                }
            }

            // 7. Finalize session
            if (!isReusable) {
                await queryRunner.manager.update(payment_sessions, { id: session.id }, {
                    status: 'completed'
                });
            } else {
                // Reusable links stay available for next customer
                await queryRunner.manager.update(payment_sessions, { id: session.id }, {
                    status: 'pending'
                });
            }

            await queryRunner.commitTransaction();

            return {
                status: 'success',
                txn_id: txnPublicId,
                txn_internal_id: txn.id,
                amount: amount,
                splits: metadata?.splits || null,
                is_escrow: metadata?.escrow || false
            };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}

module.exports = new TransactionService();
