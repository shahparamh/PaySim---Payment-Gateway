// ============================================================
// Response Helper — utils/responseHelper.js
// Standardised JSON response formats.
// ============================================================

/**
 * Success response.
 * @param {string} message
 * @param {*} [data]
 */
function success(message, data = null) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return response;
}

/**
 * Error response.
 * @param {string} code    — machine-readable error code
 * @param {string} message — human-readable message
 * @param {*} [details]    — optional extra details
 */
function error(code, message, details = null) {
    const response = { success: false, error: { code, message } };
    if (details !== null) response.error.details = details;
    return response;
}

module.exports = { success, error };
