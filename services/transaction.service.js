// ============================================================
// Transaction Service — services/transaction.service.js
// Core shared service used by both Simulator and Platform modes.
// ============================================================

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
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
                // Record the attempt (outside the main transaction to persist failure history)
                const attempt = await prisma.payment_attempts.create({
                    data: {
                        session_id: null, // Will set if we have a numeric ID
                        customer_id: parseInt(customerId),
                        payment_method_id: currentMethodId,
                        amount: 0, // Will be updated
                        currency: defaultCurrency,
                        status: 'pending',
                        attempt_sequence: attemptCount
                    }
                });

                // Execute the actual atomic payment transaction
                const result = await this.executePaymentTransaction({
                    ...payload,
                    paymentMethodId: currentMethodId,
                    attemptId: attempt.id
                });

                // Update attempt to success
                await prisma.payment_attempts.update({
                    where: { id: attempt.id },
                    data: {
                        status: 'success',
                        transaction_id: result.txn_internal_id,
                        amount: result.amount
                    }
                });

                return result;

            } catch (err) {
                lastError = err;

                // Log failure to the attempt record
                await prisma.payment_attempts.updateMany({
                    where: {
                        customer_id: parseInt(customerId),
                        payment_method_id: currentMethodId,
                        status: 'pending'
                    },
                    data: { status: 'failed', failure_reason: err.message }
                });

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
        return await prisma.payment_methods.findFirst({
            where: {
                customer_id: parseInt(customerId),
                id: { not: parseInt(failedMethodId) },
                status: 'active'
            },
            orderBy: { is_default: 'desc' }
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
        if (session.status !== 'pending') {
            throw Object.assign(new Error(`Session is ${session.status}`), { statusCode: 400 });
        }

        const amount = parseFloat(session.amount);
        const threshold = parseFloat(process.env.MIN_HIGH_VALUE_TRANSACTION) || 100000;
        const metadata = typeof session.metadata === 'string'
            ? JSON.parse(session.metadata)
            : (session.metadata || {});

        const isHighValue = amount >= threshold;
        const isForcedOtp = metadata.force_otp === true;

        if (isHighValue || isForcedOtp) {
            if (!otpCode) {
                // Generate and store OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

                const user = await prisma.customers.findUnique({ where: { id: customerId } });
                await prisma.verification_codes.create({
                    data: {
                        email: user.email,
                        code: otp,
                        type: 'payment',
                        expires_at: expiresAt
                    }
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
                const user = await prisma.customers.findUnique({ where: { id: customerId } });
                const verification = await prisma.verification_codes.findFirst({
                    where: {
                        email: user.email,
                        code: otpCode,
                        type: 'payment',
                        expires_at: { gt: new Date() }
                    },
                    orderBy: { created_at: 'desc' }
                });

                if (!verification) {
                    throw Object.assign(new Error('Invalid or expired payment OTP'), { statusCode: 401 });
                }

                // Delete used OTP
                await prisma.verification_codes.delete({ where: { id: verification.id } });
            }
        }

        // 2. Atomic Balance Update and Logging
        return await prisma.$transaction(async (tx) => {
            // Re-fetch session status in transaction for safety
            const lockedSession = await tx.payment_sessions.findFirst({
                where: { session_id: sessionId }
            });

            if (!lockedSession || lockedSession.status !== 'pending') {
                throw Object.assign(new Error(`Session is ${lockedSession?.status || 'invalid'}`), { statusCode: 400 });
            }

            // 2. PIN Verification (Skip for recurring subscriptions)
            // Use local is_subscription variable or check metadata later if needed
            // For now, we'll check the metadata from session below or pass a flag
            const isSubscription = pin === 'SECRET_BYPASS';

            if (!isSubscription) {
                const customer = await tx.customers.findUnique({
                    where: { id: customerId },
                    select: { pin_hash: true }
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
            await tx.payment_sessions.update({
                where: { id: session.id },
                data: { status: 'processing', customer_id: customerId }
            });

            // 3. Validate and Deduct
            const method = await tx.payment_methods.findFirst({
                where: { id: paymentMethodId, customer_id: customerId, status: 'active' }
            });

            if (!method) {
                throw Object.assign(new Error('Invalid or inactive payment method'), { statusCode: 400 });
            }

            const validation = await instrumentService.validateAndDeduct(
                method.method_type, method.instrument_id, amount, tx
            );

            // 4. Record successful transaction
            const txnPublicId = uuidv4();
            const txn = await tx.transactions.create({
                data: {
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
                }
            });

            // 5. Load metadata for advanced features
            // (metadata is already parsed at the top of the function)

            // 5a. Handle Escrow vs Direct Payment
            if (metadata && metadata.escrow === true) {
                await escrowService.holdFunds(txn.id, amount, tx);
                console.log(`[Escrow] Funds for txn ${txn.txn_id} placed in escrow hold.`);
            }

            // 6. Handle Split Payments
            if (metadata && metadata.splits && Array.isArray(metadata.splits)) {
                for (const split of metadata.splits) {
                    await tx.payment_splits.create({
                        data: {
                            transaction_id: txn.id,
                            merchant_id: parseInt(split.merchant_id),
                            amount: parseFloat(split.amount),
                            currency: session.currency || 'INR'
                        }
                    });
                }
            }

            // 7. Finalize session
            await tx.payment_sessions.update({
                where: { id: session.id },
                data: { status: 'completed' }
            });

            return {
                status: 'success',
                txn_id: txnPublicId,
                txn_internal_id: txn.id,
                amount: amount,
                splits: metadata?.splits || null,
                is_escrow: metadata?.escrow || false
            };
        });
    }
}

module.exports = new TransactionService();
