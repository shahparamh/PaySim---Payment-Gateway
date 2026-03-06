const rateLimit = require('express-rate-limit');

// Generic limiter for all API requests
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP, please try again after 15 minutes' }
    }
});

// Stricter limiter for Auth (Login/Register)
exports.authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'TOO_MANY_AUTH_ATTEMPTS', message: 'Too many auth attempts from this IP, please try again after an hour' }
    }
});

// Stricter limiter for Platform Session creation (To prevent spam)
exports.platformSessionLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // Limit each IP to 20 session creations per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'TOO_MANY_SESSIONS', message: 'Too many payment sessions created, please try again later' }
    }
});
