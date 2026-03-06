// ============================================================
// Authentication Middleware — middleware/auth.js
//
// Provides:
//   authenticate       — session or JWT verification
//   authenticateApiKey  — x-api-key header verification
//   authorize           — role-based access control (RBAC)
//   verifyToken         — standalone token verification utility
// ============================================================

const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { error } = require('../utils/responseHelper');

// ── Table config helper ─────────────────────────────────

function getTableConfig(type) {
    switch (type) {
        case 'merchant': return { table: 'merchants', emailCol: 'business_email' };
        case 'admin': return { table: 'admins', emailCol: 'email' };
        case 'customer':
        default: return { table: 'customers', emailCol: 'email' };
    }
}

// ============================================================
// 1. authenticate — Session or JWT
// ============================================================
//
// Checks (in order):
//   1. Session cookie (Simulator UI)
//   2. Authorization: Bearer <token> (JWT)
//
// On success → attaches req.user = { id, role, type }
// ============================================================

const authenticate = async (req, res, next) => {
    try {
        // ── Strategy 1: Session-based auth ──────────────────
        if (req.session && req.session.user) {
            req.user = req.session.user;
            return next();
        }

        // ── Strategy 2: JWT Bearer token ────────────────────
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json(
                error('UNAUTHORIZED', 'Authentication required. Provide a Bearer token or login via session.')
            );
        }

        const token = authHeader.split(' ')[1];

        // Verify token signature and expiry
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists and is active in the database
        let userRecord = null;
        if (decoded.type === 'merchant') {
            userRecord = await prisma.merchants.findUnique({ where: { id: decoded.id }, select: { id: true, status: true } });
        } else if (decoded.type === 'admin') {
            userRecord = await prisma.admins.findUnique({ where: { id: decoded.id }, select: { id: true, name: true } });
            if (userRecord) userRecord.status = 'active'; // Admins don't have status in schema
        } else {
            userRecord = await prisma.customers.findUnique({ where: { id: decoded.id }, select: { id: true, status: true } });
        }

        if (!userRecord) {
            return res.status(401).json(
                error('USER_NOT_FOUND', 'User associated with this token no longer exists')
            );
        }

        if (userRecord.status && userRecord.status !== 'active') {
            return res.status(403).json(
                error('ACCOUNT_INACTIVE', 'Your account has been suspended or deleted')
            );
        }

        // Attach user info to request
        req.user = {
            id: decoded.id,
            role: decoded.role,
            type: decoded.type
        };

        return next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json(
                error('TOKEN_EXPIRED', 'Token has expired. Please login again.')
            );
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json(
                error('INVALID_TOKEN', 'Token is malformed or invalid')
            );
        }
        next(err);
    }
};

// ============================================================
// 2. authenticateApiKey — x-api-key header
// ============================================================
//
// Used by merchants integrating via platform mode.
// On success → attaches req.merchantApp = { id, merchantId, environment }
// ============================================================

const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json(
                error('API_KEY_MISSING', 'x-api-key header is required for platform API access')
            );
        }

        // Look up by prefix (first 8 chars)
        const prefix = apiKey.substring(0, 8);
        const keyRecord = await prisma.api_keys.findFirst({
            where: { key_prefix: prefix, is_active: true },
            include: { merchant_apps: true }
        });

        if (!keyRecord) {
            return res.status(401).json(
                error('INVALID_API_KEY', 'API key is invalid or has been revoked')
            );
        }

        // Check expiry
        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
            return res.status(401).json(
                error('API_KEY_EXPIRED', 'API key has expired. Generate a new one.')
            );
        }

        // Check app status
        if (keyRecord.merchant_apps?.status !== 'active') {
            return res.status(403).json(
                error('APP_DISABLED', 'Merchant application is disabled')
            );
        }

        // Update last_used_at
        await prisma.api_keys.update({
            where: { id: keyRecord.id },
            data: { last_used_at: new Date() }
        });

        req.merchantApp = {
            id: keyRecord.merchant_app_id,
            merchantId: keyRecord.merchant_id,
            app_name: keyRecord.merchant_apps?.app_name,
            environment: keyRecord.environment
        };

        next();
    } catch (err) {
        next(err);
    }
};

// ============================================================
// 3. authorize — Role-Based Access Control (RBAC)
// ============================================================
//
// Usage in routes:
//   router.get('/admin-only', authenticate, authorize('admin', 'super_admin'), handler);
//   router.get('/merchants',  authenticate, authorize('merchant'), handler);
//
// Must be used AFTER authenticate middleware.
// ============================================================

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(
                error('UNAUTHORIZED', 'Authentication required before authorization')
            );
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(
                error('FORBIDDEN', `Access denied. Required role(s): ${allowedRoles.join(', ')}`)
            );
        }

        next();
    };
};

// ============================================================
// 4. verifyToken — Standalone token verification utility
// ============================================================
//
// Can be used outside of Express middleware, e.g. in WebSocket
// authentication or background jobs.
// ============================================================

const verifyToken = (token) => {
    try {
        return { valid: true, decoded: jwt.verify(token, process.env.JWT_SECRET) };
    } catch (err) {
        return { valid: false, error: err.message };
    }
};

module.exports = { authenticate, authenticateApiKey, authorize, verifyToken };
