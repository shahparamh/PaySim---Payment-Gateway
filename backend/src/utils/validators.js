// ============================================================
// Validators — utils/validators.js
// Input validation utilities.
// ============================================================

/**
 * Validate email format.
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate password strength (minimum 8 characters).
 */
function validatePassword(password) {
    return typeof password === 'string' && password.length >= 8;
}

/**
 * Validate amount (positive number).
 */
function validateAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
}

/**
 * Validate UUID format.
 */
function validateUUID(str) {
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return re.test(str);
}

/**
 * Validate IFSC code (Indian Financial System Code).
 * Format: 4 letters + 0 + 6 alphanumeric characters
 */
function validateIFSC(code) {
    const re = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return re.test(code);
}

/**
 * Validate card number using Luhn algorithm.
 */
function validateCardNumber(number) {
    const digits = number.replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(digits)) return false;

    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (alternate) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
    }
    return sum % 10 === 0;
}

module.exports = {
    validateEmail,
    validatePassword,
    validateAmount,
    validateUUID,
    validateIFSC,
    validateCardNumber
};
