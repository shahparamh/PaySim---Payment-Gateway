// ============================================================
// Platform / Gateway Controller — controllers/platform.controller.js
//
// Implements the external gateway APIs used by merchant
// applications to integrate payments.
//
// Flow:
//   1. Merchant registers → creates app → generates API key
//   2. External app creates a payment session (with API key)
//   3. Customer is redirected to checkout URL
//   4. Customer pays → payment is processed
//   5. Webhook fires to merchant's callback_url
//   6. Customer is redirected back to merchant's success/failure URL
// ============================================================

const sessionService = require('../services/session.service');
const transactionService = require('../services/transaction.service');
const AppDataSource = require('../config/database');
const { transactions, customers, credit_cards, bank_accounts, payment_methods, merchant_apps, api_keys, payment_sessions, api_logs } = require('../src/entities');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { success, error } = require('../utils/responseHelper');

// ============================================================
// GATEWAY APIs (API-key authenticated)
// ============================================================

// ────────────────────────────────────────────────────────
// POST /platform/create-payment-session
// ────────────────────────────────────────────────────────
//
// Creates a payment session that an external app can redirect
// its customer to. Returns a checkout_url and session_id.
//
// Body: {
//   amount, currency?, description?,
//   callback_url?,           — webhook URL for payment notifications
//   success_redirect_url?,   — where to redirect customer on success
//   failure_redirect_url?,   — where to redirect customer on failure
//   metadata?                — arbitrary JSON for merchant context
// }
// ────────────────────────────────────────────────────────

exports.createPaymentSession = async (req, res, next) => {
    try {
        const {
            amount, currency, description,
            callback_url, success_redirect_url, failure_redirect_url,
            metadata
        } = req.body;
        const merchantApp = req.merchantApp;

        // Validation
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json(
                error('VALIDATION', 'A positive amount is required')
            );
        }

        // Automatic enhancements for demo environment
        const finalMetadata = { ...(metadata || {}) };
        if (merchantApp.app_name === 'NexStore Online') {
            finalMetadata.force_otp = true;
        }

        const session = await sessionService.createSession({
            merchantAppId: merchantApp.id,
            amount: parseFloat(amount),
            currency: currency || process.env.DEFAULT_CURRENCY || 'INR',
            description: description || null,
            callbackUrl: callback_url || null,
            successRedirectUrl: success_redirect_url || null,
            failureRedirectUrl: failure_redirect_url || null,
            metadata: finalMetadata,
            splits: req.body.splits // Pass splits if provided
        });

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        res.status(201).json(success('Payment session created', {
            session_id: session.sessionId,
            checkout_url: `${baseUrl}/checkout?session=${session.sessionId}`,
            amount: session.amount,
            currency: session.currency,
            status: 'pending',
            expires_at: session.expiresAt
        }));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /platform/payment/:session_id
// ────────────────────────────────────────────────────────
//
// Retrieves full payment session details, including the
// associated transaction if payment has been processed.
// ────────────────────────────────────────────────────────

exports.getPayment = async (req, res, next) => {
    try {
        const { session_id } = req.params;
        const session = await sessionService.getSession(session_id);

        if (!session) {
            return res.status(404).json(
                error('NOT_FOUND', 'Payment session not found')
            );
        }

        // If session has been completed, include transaction details
        let transaction = null;
        if (['completed', 'failed'].includes(session.status)) {
            const txnRepo = AppDataSource.getRepository(transactions);
            transaction = await txnRepo.findOne({
                where: { session_id: session.id },
                order: { created_at: 'DESC' }
            });
        }

        res.json(success('Payment details retrieved', {
            session_id: session.session_id,
            amount: session.amount,
            currency: session.currency,
            description: session.description,
            status: session.status,
            merchant: session.business_name,
            app_name: session.app_name,
            transaction,
            expires_at: session.expires_at,
            created_at: session.created_at
        }));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// POST /platform/process-payment
// ────────────────────────────────────────────────────────
//
// Processes payment for a session. Called from the hosted
// checkout page after the customer selects a payment method.
//
// Body: { session_id, payment_method_id }
//
// On success:
//   1. Transaction is recorded
//   2. Webhook fires to callback_url
//   3. Returns redirect URLs for the checkout page
// ────────────────────────────────────────────────────────

exports.processPayment = async (req, res, next) => {
    try {
        const { session_id, payment_method_id, email, method_type, details, pin, otp_code } = req.body;
        let customerId;

        // 1. Resolve Customer (Authenticated or Guest)
        if (req.user) {
            customerId = req.user.id;
        } else if (email) {
            // Find or create guest customer
            const customerRepo = AppDataSource.getRepository(customers);
            let guest = await customerRepo.findOneBy({ email });
            if (!guest) {
                guest = await customerRepo.save({
                    uuid: uuidv4(),
                    first_name: 'Guest',
                    last_name: 'Customer',
                    email: email,
                    password_hash: 'guest_bypass', // Placeholder
                    status: 'active'
                });
            }
            customerId = guest.id;
        } else {
            return res.status(401).json(error('AUTH_REQUIRED', 'Please login or provide guest email'));
        }

        if (!session_id) {
            return res.status(400).json(error('VALIDATION', 'session_id is required'));
        }

        // 2. Resolve Payment Method
        let finalPaymentMethodId = payment_method_id;

        if (!finalPaymentMethodId && method_type && details) {
            let instrumentId;

            // Create the underlying instrument for the simulator to track
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
                // For UPI/Bank, we create a bank account
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
            finalPaymentMethodId = method.id;
        }

        if (!finalPaymentMethodId) {
            return res.status(400).json(error('VALIDATION', 'payment_method_id or method details required'));
        }

        // 3. Process the payment via transaction service
        const result = await transactionService.processPayment({
            sessionId: session_id,
            customerId,
            paymentMethodId: finalPaymentMethodId,
            mode: 'platform',
            pin: pin || 'SECRET_BYPASS', // Bypass PIN for guest checkout
            otpCode: otp_code
        });

        // Fetch session for redirect URLs and callback
        const session = await sessionService.getSession(session_id);

        // Fire webhook (simulated) to merchant's callback_url
        if (session && session.callback_url) {
            await fireWebhook(session.callback_url, {
                event: result.status === 'success' ? 'payment.success' : 'payment.failed',
                session_id: session.session_id,
                txn_id: result.txn_id,
                amount: result.amount,
                currency: session.currency,
                status: result.status,
                failure_reason: result.failure_reason,
                timestamp: new Date().toISOString()
            });
        }

        // Build response with redirect URL
        let redirectUrl = null;
        if (session) {
            const meta = typeof session.metadata === 'string'
                ? JSON.parse(session.metadata)
                : session.metadata;

            if (result.status === 'success' && meta?.success_redirect_url) {
                redirectUrl = `${meta.success_redirect_url}?session_id=${session.session_id}&txn_id=${result.txn_id}&status=success`;
            } else if (result.status === 'failed' && meta?.failure_redirect_url) {
                redirectUrl = `${meta.failure_redirect_url}?session_id=${session.session_id}&status=failed&reason=${encodeURIComponent(result.failure_reason || '')}`;
            }
        }

        const statusCode = result.status === 'success' ? 200 : 400;
        res.status(statusCode).json(
            result.status === 'success'
                ? success('Payment successful', {
                    txn_id: result.txn_id,
                    amount: result.amount,
                    status: 'success',
                    redirect_url: redirectUrl
                })
                : error('PAYMENT_FAILED', result.failure_reason, {
                    txn_id: result.txn_id,
                    amount: result.amount,
                    status: 'failed',
                    redirect_url: redirectUrl
                })
        );
    } catch (err) {
        if (err.message === 'HIGH_VALUE_OTP_REQUIRED' || err.requires_otp) {
            return res.json(success(err.message, { status: 'requires_otp' }));
        }
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /platform/payment-status
// ────────────────────────────────────────────────────────
//
// Check payment status by either session_id or txn_id.
// Query params: ?session_id=xxx  OR  ?txn_id=xxx
// ────────────────────────────────────────────────────────

exports.getPaymentStatus = async (req, res, next) => {
    try {
        const { session_id, txn_id } = req.query;

        if (!session_id && !txn_id) {
            return res.status(400).json(
                error('VALIDATION', 'Provide either session_id or txn_id as query parameter')
            );
        }

        // Lookup by txn_id
        if (txn_id) {
            const txnRepo = AppDataSource.getRepository(transactions);
            const txn = await txnRepo.findOne({
                where: { txn_id },
                relations: ['payment_methods']
            });

            if (!txn) {
                return res.status(404).json(error('NOT_FOUND', 'Transaction not found'));
            }

            return res.json(success('Payment status retrieved', {
                txn_id: txn.txn_id,
                amount: txn.amount,
                currency: txn.currency,
                status: txn.status,
                payment_method: txn.payment_methods?.method_type,
                failure_reason: txn.failure_reason,
                created_at: txn.created_at
            }));
        }

        // Lookup by session_id
        if (session_id) {
            const session = await sessionService.getSession(session_id);
            if (!session) {
                return res.status(404).json(error('NOT_FOUND', 'Session not found'));
            }

            // Get associated transaction
            const txnRepo = AppDataSource.getRepository(transactions);
            const txn = await txnRepo.findOne({
                where: { session_id: session.id },
                order: { created_at: 'DESC' }
            });

            return res.json(success('Payment status retrieved', {
                session_id: session.session_id,
                session_status: session.status,
                amount: session.amount,
                currency: session.currency,
                transaction: txn
            }));
        }
    } catch (err) {
        next(err);
    }
};

// ============================================================
// MERCHANT MANAGEMENT (JWT authenticated)
// ============================================================

// ────────────────────────────────────────────────────────
// POST /platform/register-app
// ────────────────────────────────────────────────────────
//
// Register a new merchant application. Merchants can have
// multiple apps (e.g., one for sandbox, one for production).
//
// Body: {
//   app_name, website_url?, callback_url,
//   environment: 'sandbox' | 'production'
// }
// ────────────────────────────────────────────────────────

exports.registerApp = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const { app_name, website_url, callback_url, environment } = req.body;

        if (!app_name || !callback_url) {
            return res.status(400).json(
                error('VALIDATION', 'app_name and callback_url are required')
            );
        }

        const appUuid = uuidv4();
        const env = environment || 'sandbox';

        if (!['sandbox', 'production'].includes(env)) {
            return res.status(400).json(
                error('VALIDATION', 'environment must be sandbox or production')
            );
        }

        const appRepo = AppDataSource.getRepository(merchant_apps);
        const app = await appRepo.save({
            merchant_id: merchantId,
            app_name: app_name,
            app_uuid: appUuid,
            website_url: website_url || null,
            callback_url: callback_url,
            environment: env
        });

        // Auto-generate a secret API key for the new app
        const rawKey = `sk_${env === 'production' ? 'live' : 'test'}_${crypto.randomBytes(32).toString('hex')}`;
        const keyPrefix = rawKey.substring(0, 8);

        const apiKeyRepo = AppDataSource.getRepository(api_keys);
        await apiKeyRepo.save({
            merchant_app_id: app.id,
            key_prefix: keyPrefix,
            key_hash: rawKey,
            key_type: 'secret'
        });

        res.status(201).json(success('Merchant app registered', {
            app_id: app.id,
            app_uuid: appUuid,
            app_name,
            environment: env,
            api_key: rawKey,
            note: 'Store your API key securely — it will not be shown again.'
        }));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// POST /platform/api-keys
// ────────────────────────────────────────────────────────

exports.createApiKey = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const { merchant_app_id, key_type } = req.body;

        if (!merchant_app_id || !key_type) {
            return res.status(400).json(
                error('VALIDATION', 'merchant_app_id and key_type (publishable/secret) are required')
            );
        }

        if (!['publishable', 'secret'].includes(key_type)) {
            return res.status(400).json(
                error('VALIDATION', 'key_type must be publishable or secret')
            );
        }

        // Verify ownership
        const appRepo = AppDataSource.getRepository(merchant_apps);
        const app = await appRepo.findOneBy({ id: parseInt(merchant_app_id), merchant_id: merchantId });
        if (!app) {
            return res.status(403).json(
                error('FORBIDDEN', 'App does not belong to this merchant')
            );
        }

        const env = app.environment;
        const prefix = key_type === 'publishable' ? 'pk' : 'sk';
        const envLabel = env === 'production' ? 'live' : 'test';
        const rawKey = `${prefix}_${envLabel}_${crypto.randomBytes(32).toString('hex')}`;
        const keyPrefix = rawKey.substring(0, 8);

        const apiKeyRepo = AppDataSource.getRepository(api_keys);
        await apiKeyRepo.save({
            merchant_app_id: parseInt(merchant_app_id),
            key_prefix: keyPrefix,
            key_hash: rawKey,
            key_type: key_type
        });

        res.status(201).json(success('API key generated', {
            key: rawKey,
            prefix: keyPrefix,
            type: key_type,
            environment: env,
            note: 'Store this key securely — it will not be shown again.'
        }));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /platform/api-keys
// ────────────────────────────────────────────────────────

exports.getApiKeys = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const apiKeyRepo = AppDataSource.getRepository(api_keys);
        const keys = await apiKeyRepo.find({
            where: { merchant_apps: { merchant_id: merchantId } },
            relations: ['merchant_apps'],
            order: { created_at: 'DESC' }
        });

        // Flatten for compatibility
        const formatted = keys.map(k => ({
            id: k.id,
            key_prefix: k.key_prefix,
            key_type: k.key_type,
            is_active: k.is_active,
            last_used_at: k.last_used_at,
            created_at: k.created_at,
            app_name: k.merchant_apps?.app_name,
            environment: k.merchant_apps?.environment
        }));

        res.json(success('API keys retrieved', formatted));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /platform/dashboard
// ────────────────────────────────────────────────────────

exports.getDashboard = async (req, res, next) => {
    try {
        const merchantId = req.user.id;

        const txnRepo = AppDataSource.getRepository(transactions);

        // Aggregate stats
        const summaryRaw = await txnRepo.createQueryBuilder("txn")
            .where("txn.merchant_id = :merchantId", { merchantId })
            .select("txn.status", "status")
            .addSelect("COUNT(txn.id)", "_count")
            .addSelect("SUM(txn.amount)", "_sum_amount")
            .groupBy("txn.status")
            .getRawMany();

        const stats = {
            total_transactions: 0,
            successful: 0,
            failed: 0,
            total_revenue: 0
        };

        summaryRaw.forEach(group => {
            const count = parseInt(group._count, 10);
            stats.total_transactions += count;
            if (group.status === 'success') {
                stats.successful = count;
                stats.total_revenue = parseFloat(group._sum_amount || 0);
            } else if (group.status === 'failed') {
                stats.failed = count;
            }
        });

        // Chart Data (Last N Days vs Previous N Days)
        const range = parseInt(req.query.range) || 7;
        const daysToShow = [7, 30].includes(range) ? range : 7;

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const thisPeriodStart = new Date(startOfToday);
        thisPeriodStart.setDate(thisPeriodStart.getDate() - (daysToShow - 1));

        const lastPeriodStart = new Date(thisPeriodStart);
        lastPeriodStart.setDate(lastPeriodStart.getDate() - daysToShow);

        const recentTxnsForChart = await txnRepo.createQueryBuilder("txn")
            .where("txn.merchant_id = :merchantId", { merchantId })
            .andWhere("txn.status = :status", { status: 'success' })
            .andWhere("txn.created_at >= :lastPeriodStart", { lastPeriodStart })
            .select(['txn.amount', 'txn.created_at'])
            .getMany();

        const labels = [];
        const thisPeriodData = [];
        const lastPeriodData = [];
        const thisPeriodMap = new Map();
        const lastPeriodMap = new Map();

        // Initialize maps with zero for all days in the range
        for (let i = 0; i < daysToShow; i++) {
            const dThis = new Date(thisPeriodStart);
            dThis.setDate(dThis.getDate() + i);

            // Format label: "MMM DD" for 7 days or 30 days
            labels.push(dThis.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            thisPeriodMap.set(dThis.toDateString(), 0);

            const dLast = new Date(lastPeriodStart);
            dLast.setDate(dLast.getDate() + i);
            lastPeriodMap.set(dLast.toDateString(), 0);
        }

        // Aggregate transactions by day
        recentTxnsForChart.forEach(t => {
            const dStr = t.created_at.toDateString();
            if (thisPeriodMap.has(dStr)) {
                thisPeriodMap.set(dStr, thisPeriodMap.get(dStr) + parseFloat(t.amount || 0));
            } else if (lastPeriodMap.has(dStr)) {
                lastPeriodMap.set(dStr, lastPeriodMap.get(dStr) + parseFloat(t.amount || 0));
            }
        });

        // Convert map to arrays
        for (let i = 0; i < daysToShow; i++) {
            const dThis = new Date(thisPeriodStart);
            dThis.setDate(dThis.getDate() + i);
            thisPeriodData.push(thisPeriodMap.get(dThis.toDateString()));

            const dLast = new Date(lastPeriodStart);
            dLast.setDate(dLast.getDate() + i);
            lastPeriodData.push(lastPeriodMap.get(dLast.toDateString()));
        }

        const chart = { labels, this_period: thisPeriodData, last_period: lastPeriodData };

        // Recent transactions
        const recent = await txnRepo.find({
            where: { merchant_id: merchantId },
            order: { created_at: 'DESC' },
            take: 10
        });

        // Active sessions
        const sessionRepo = AppDataSource.getRepository(payment_sessions);
        const sessions = await sessionRepo.find({
            where: { merchant_apps: { merchant_id: merchantId } },
            order: { created_at: 'DESC' },
            take: 10
        });

        res.json(success('Dashboard data retrieved', {
            stats: stats,
            chart: chart,
            recent_transactions: recent,
            recent_sessions: sessions
        }));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /platform/transactions
// ────────────────────────────────────────────────────────

exports.getTransactions = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const txnRepo = AppDataSource.getRepository(transactions);
        const [transactionsRes, total] = await txnRepo.findAndCount({
            where: { merchant_id: merchantId },
            relations: ['payment_methods'],
            order: { created_at: 'DESC' },
            take: limit,
            skip: skip
        });

        // Flatten method_type
        const formatted = transactionsRes.map(t => ({
            ...t,
            method_type: t.payment_methods?.method_type || 'unknown'
        }));

        res.json(success('Transactions retrieved', {
            transactions: formatted,
            pagination: { page, limit, total }
        }));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// WEBHOOK SIMULATION
// ============================================================
//
// In a real gateway, this would make an HTTP POST to the
// merchant's callback_url. In simulator mode, we log the
// webhook payload to the database and console.
// ============================================================

async function fireWebhook(callbackUrl, payload) {
    const webhookId = uuidv4();

    console.log('──────────────────────────────────────');
    console.log('🔔 WEBHOOK FIRED');
    console.log(`   ID       : ${webhookId}`);
    console.log(`   URL      : ${callbackUrl}`);
    console.log(`   Event    : ${payload.event}`);
    console.log(`   Session  : ${payload.session_id}`);
    console.log(`   Txn      : ${payload.txn_id}`);
    console.log(`   Amount   : ₹${payload.amount}`);
    console.log(`   Status   : ${payload.status}`);
    console.log(`   Time     : ${payload.timestamp}`);
    console.log('──────────────────────────────────────');

    // Log webhook to api_logs table for audit
    try {
        const apiLogRepo = AppDataSource.getRepository(api_logs);
        await apiLogRepo.save({
            request_id: webhookId,
            method: 'POST',
            endpoint: `WEBHOOK → ${callbackUrl}`,
            status_code: 200,
            ip_address: '127.0.0.1',
            request_body: JSON.stringify(payload),
            response_body: JSON.stringify({ received: true, simulated: true }),
            response_time_ms: 0
        });
    } catch (err) {
        console.error('⚠️  Webhook log failed:', err.message);
    }

    // In a production system, you would:
    // const response = await fetch(callbackUrl, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', 'X-Webhook-Id': webhookId },
    //     body: JSON.stringify(payload)
    // });

    return { webhookId, status: 'simulated' };
}
