const rateLimit = require('express-rate-limit');

// Generic limiter for all API requests
exports.apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Limit each IP to 1000 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP' }
    },
    validate: { trustProxy: false, forwardedHeader: false }
});

// Stricter limiter for Auth (Login/Register)
exports.authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Basically unlimited for dev
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'TOO_MANY_AUTH_ATTEMPTS', message: 'Too many auth attempts' }
    },
    validate: { trustProxy: false, forwardedHeader: false }
});

// Stricter limiter for Platform Session creation (To prevent spam)
exports.platformSessionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'TOO_MANY_SESSIONS', message: 'Too many payment sessions created' }
    },
    validate: { trustProxy: false, forwardedHeader: false }
});
