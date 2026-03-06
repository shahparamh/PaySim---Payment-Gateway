// ============================================================
// Mode Resolver Middleware — middleware/modeResolver.js
// ============================================================

/**
 * Determines the operating mode based on route prefix.
 *   /api/v1/simulator/*  →  mode = 'simulator'
 *   /api/v1/platform/*   →  mode = 'platform'
 *   everything else      →  mode = 'general'
 *
 * Attaches req.mode for downstream use.
 */
const modeResolver = (req, res, next) => {
    const url = req.originalUrl.toLowerCase();

    if (url.includes('/simulator')) {
        req.mode = 'simulator';
    } else if (url.includes('/platform')) {
        req.mode = 'platform';
    } else {
        req.mode = 'general';
    }

    next();
};

module.exports = { modeResolver };
