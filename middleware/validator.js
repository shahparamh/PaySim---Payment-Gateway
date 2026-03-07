const { body, validationResult } = require('express-validator');

// Reusable validation handler
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: errors.array().map(err => ({ field: err.path, message: err.msg }))
            }
        });
    }
    next();
};

// Auth Validation Schemas
exports.loginSchema = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    body('type').isIn(['customer', 'merchant', 'admin']).withMessage('Invalid type selected')
];

exports.registerSchema = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('business_name').optional().notEmpty().withMessage('Business name is required for merchants')
];

// Platform Session Validation
exports.sessionSchema = [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code (e.g., INR)'),
    body('callback_url').optional().isURL({ require_tld: false }).withMessage('Please provide a valid callback URL'),
    body('success_redirect_url').optional().isURL({ require_tld: false }).withMessage('Please provide a valid success redirect URL'),
    body('failure_redirect_url').optional().isURL({ require_tld: false }).withMessage('Please provide a valid failure redirect URL')
];

// Profile Update Validation
exports.profileSchema = [
    body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
];

// PIN Change Validation
exports.pinChangeSchema = [
    body('old_pin').isLength({ min: 4, max: 6 }).withMessage('Old PIN must be 4-6 digits'),
    body('new_pin').isLength({ min: 4, max: 6 }).withMessage('New PIN must be 4-6 digits')
];
