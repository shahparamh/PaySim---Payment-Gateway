// ============================================================
// ID Generator — utils/idGenerator.js
// Utilities for generating unique identifiers.
// ============================================================

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate a UUID v4.
 */
function generateUUID() {
    return uuidv4();
}

/**
 * Generate a short transaction ID.
 * Format: TXN-{timestamp}-{random}  e.g. TXN-1709654321-A3F9B2
 */
function generateTxnId() {
    const timestamp = Math.floor(Date.now() / 1000);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TXN-${timestamp}-${random}`;
}

/**
 * Generate an API key.
 * @param {'publishable' | 'secret'} type
 * @returns {string} e.g. pk_live_abc123... or sk_test_abc123...
 */
function generateApiKey(type = 'secret', environment = 'test') {
    const prefix = type === 'publishable' ? 'pk' : 'sk';
    const env = environment === 'production' ? 'live' : 'test';
    const key = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${env}_${key}`;
}

/**
 * Generate a session ID.
 * Format: cs_{uuid}  (cs = checkout session)
 */
function generateSessionId() {
    return `cs_${uuidv4()}`;
}

module.exports = { generateUUID, generateTxnId, generateApiKey, generateSessionId };
