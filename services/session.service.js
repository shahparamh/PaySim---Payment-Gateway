// ============================================================
// Session Service — services/session.service.js
//
// Manages the payment session lifecycle:
//   create → pending → processing → completed/failed/expired
//
// Sessions support:
//   - TTL-based auto-expiry
//   - Redirect URLs (success/failure)
//   - Webhook callback URL
//   - Arbitrary metadata
// ============================================================

const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');

const SESSION_TTL = parseInt(process.env.SESSION_TTL_MINUTES) || 15;

/**
 * Create a new payment session.
 *
 * @param {Object} options
 * @param {number} options.merchantAppId
 * @param {number} options.amount
 * @param {string} options.currency
 * @param {string} [options.description]
 * @param {string} [options.callbackUrl]           — webhook URL
 * @param {string} [options.successRedirectUrl]    — customer redirect on success
 * @param {string} [options.failureRedirectUrl]    — customer redirect on failure
 * @param {Object} [options.metadata]              — arbitrary JSON
 * @returns {{ sessionId, amount, currency, expiresAt }}
 */
async function createSession({
    merchantAppId, amount, currency, description,
    callbackUrl, successRedirectUrl, failureRedirectUrl,
    metadata, splits
}) {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_TTL * 60 * 1000);

    // Get the merchant's default callback_url if not provided
    if (!callbackUrl) {
        const app = await prisma.merchant_apps.findUnique({
            where: { id: merchantAppId },
            select: { callback_url: true }
        });
        callbackUrl = app ? app.callback_url : '';
    }

    // Store redirect URLs inside metadata
    const fullMetadata = {
        ...(metadata || {}),
        success_redirect_url: successRedirectUrl || null,
        failure_redirect_url: failureRedirectUrl || null,
        splits: splits || null
    };

    await prisma.payment_sessions.create({
        data: {
            session_id: sessionId,
            merchant_app_id: merchantAppId,
            amount: amount,
            currency: currency,
            description: description || null,
            callback_url: callbackUrl,
            metadata: JSON.stringify(fullMetadata),
            expires_at: expiresAt
        }
    });

    return { sessionId, amount, currency, expiresAt };
}

/**
 * Retrieve a payment session by its public session_id.
 * Automatically expires sessions past their TTL.
 */
async function getSession(sessionId) {
    const session = await prisma.payment_sessions.findFirst({
        where: { session_id: sessionId },
        include: {
            merchant_apps: {
                include: { merchants: true }
            }
        }
    });

    if (!session) return null;

    // Flatten for compatibility
    const formatted = {
        ...session,
        app_name: session.merchant_apps?.app_name,
        merchant_id: session.merchant_apps?.merchant_id,
        business_name: session.merchant_apps?.merchants?.business_name
    };

    // Auto-expire if past TTL and still pending
    if (formatted.status === 'pending' && new Date(formatted.expires_at) < new Date()) {
        await prisma.payment_sessions.update({
            where: { id: formatted.id },
            data: { status: 'expired' }
        });
        formatted.status = 'expired';
    }

    return formatted;
}

/**
 * Update session status.
 */
async function updateSessionStatus(sessionId, status, customerId = null) {
    const data = { status };
    if (customerId) data.customer_id = customerId;

    await prisma.payment_sessions.updateMany({
        where: { session_id: sessionId },
        data
    });
}

module.exports = { createSession, getSession, updateSessionStatus };
