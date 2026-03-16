// ============================================================
// Global Error Handler — middleware/errorHandler.js
// ============================================================

/**
 * Express error-handling middleware (4 args).
 * Catches all errors thrown or passed via next(err).
 */
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error('🔴 Error:', err.stack || err.message);

    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message
        }
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = { errorHandler };
