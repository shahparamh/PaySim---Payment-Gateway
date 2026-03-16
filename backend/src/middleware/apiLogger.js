// ============================================================
// API Logger Middleware — middleware/apiLogger.js
// ============================================================

const { v4: uuidv4 } = require('uuid');
const AppDataSource = require('../config/database');
const { api_logs } = require('../entities/entities');

/**
 * Logs every API request/response to the api_logs table.
 * Captures method, endpoint, status code, IP, timing, and bodies.
 */
const apiLogger = (req, res, next) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Attach request ID to response headers
    res.setHeader('X-Request-Id', requestId);
    req.requestId = requestId;

    // Capture original res.json to intercept response body
    const originalJson = res.json.bind(res);
    let responseBody = null;

    res.json = (body) => {
        responseBody = body;
        return originalJson(body);
    };

    // Log after response is sent
    res.on('finish', async () => {
        try {
            const merchantAppId = req.merchantApp ? req.merchantApp.id : null;
            const responseTimeMs = Date.now() - startTime;

            const apiLogRepo = AppDataSource.getRepository(api_logs);

            // Safety truncation even for CLOB to prevent massive memory/DB pressure
            const MAX_LOG_SIZE = 32768; // 32KB
            const truncate = (str) => {
                if (!str) return null;
                return str.length > MAX_LOG_SIZE ? str.substring(0, MAX_LOG_SIZE) + '...[TRUNCATED]' : str;
            };

            await apiLogRepo.save({
                merchant_app_id: merchantAppId,
                request_id: requestId,
                method: req.method,
                endpoint: req.originalUrl,
                status_code: res.statusCode,
                ip_address: req.ip || req.connection.remoteAddress,
                request_body: truncate(req.body ? JSON.stringify(req.body) : null),
                response_body: truncate(responseBody ? JSON.stringify(responseBody) : null),
                response_time_ms: responseTimeMs
            });

        } catch (err) {
            // Logging failures should not crash the app
            console.error('⚠️  API log write failed:', err.message);
        }
    });

    next();
};

module.exports = { apiLogger };
