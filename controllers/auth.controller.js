// ============================================================
// Auth Controller — controllers/auth.controller.js
//
// Unified registration & login for all user types:
//   customers, merchants, admins
//
// Uses: JWT authentication + bcrypt password hashing
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const { success, error } = require('../utils/responseHelper');
const { validateEmail, validatePassword } = require('../utils/validators');
const emailService = require('../services/email.service');

// ── Helpers ─────────────────────────────────────────────

const SALT_ROUNDS = 12;

/**
 * Generate a signed JWT for any user type.
 */
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
}

/**
 * Table & email column mapping per user type.
 */
function getTableConfig(type) {
    switch (type) {
        case 'merchant':
            return { table: 'merchants', emailCol: 'business_email' };
        case 'admin':
            return { table: 'admins', emailCol: 'email' };
        case 'customer':
        default:
            return { table: 'customers', emailCol: 'email' };
    }
}

/**
 * Generate a 6-digit random OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================================
// POST /auth/register
// ============================================================
//
// Body:
//   { type: 'customer' | 'merchant' | 'admin', ...type-specific fields }
//
// Customer fields : first_name, last_name, email, phone, password
// Merchant fields : business_name, business_email, phone, password, business_type
// Admin fields    : name, email, password, role (super_admin|admin|support)
// ============================================================

exports.register = async (req, res, next) => {
    try {
        const { type, password } = req.body;

        // ── Validate common fields ──────────────────────────
        if (!type || !['customer', 'merchant', 'admin'].includes(type)) {
            return res.status(400).json(
                error('VALIDATION', 'type must be one of: customer, merchant, admin')
            );
        }
        if (!password) {
            return res.status(400).json(error('VALIDATION', 'password is required'));
        }
        if (!validatePassword(password)) {
            return res.status(400).json(
                error('VALIDATION', 'Password must be at least 8 characters')
            );
        }

        const uuid = uuidv4();
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        let result, responseData;

        // ── Customer registration ───────────────────────────
        if (type === 'customer') {
            const { first_name, last_name, email, phone, pin } = req.body;

            if (!first_name || !last_name || !email) {
                return res.status(400).json(
                    error('VALIDATION', 'first_name, last_name, and email are required for customer registration')
                );
            }
            if (!validateEmail(email)) {
                return res.status(400).json(error('VALIDATION', 'Invalid email format'));
            }

            // Check duplicate
            const existing = await prisma.customers.findUnique({
                where: { email }
            });
            if (existing) {
                return res.status(409).json(error('DUPLICATE', 'Email is already registered'));
            }

            let pinHash = null;
            if (pin) {
                if (pin.length !== 4 || !/^\d+$/.test(pin)) {
                    return res.status(400).json(error('VALIDATION', 'PIN must be a 4-digit number'));
                }
                pinHash = await bcrypt.hash(pin, SALT_ROUNDS);
            }

            // Delay customer creation to verification step
            const pendingUser = {
                type: 'customer', uuid, first_name, last_name, email,
                phone: phone || null, passwordHash, pinHash
            };
            responseData = { pendingUser };
        }

        // ── Merchant registration ───────────────────────────
        else if (type === 'merchant') {
            const { business_name, business_email, phone, business_type } = req.body;

            if (!business_name || !business_email) {
                return res.status(400).json(
                    error('VALIDATION', 'business_name and business_email are required for merchant registration')
                );
            }
            if (!validateEmail(business_email)) {
                return res.status(400).json(error('VALIDATION', 'Invalid email format'));
            }

            const existing = await prisma.merchants.findUnique({
                where: { business_email }
            });
            if (existing) {
                return res.status(409).json(error('DUPLICATE', 'Business email is already registered'));
            }

            // Delay merchant creation to verification step
            const pendingUser = {
                type: 'merchant', uuid, business_name, business_email,
                phone: phone || null, passwordHash, business_type: business_type || null
            };
            responseData = { pendingUser };
        }

        // ── Admin registration ──────────────────────────────
        else if (type === 'admin') {
            const { name, email, role } = req.body;

            if (!name || !email) {
                return res.status(400).json(
                    error('VALIDATION', 'name and email are required for admin registration')
                );
            }
            if (!validateEmail(email)) {
                return res.status(400).json(error('VALIDATION', 'Invalid email format'));
            }

            const adminRole = role || 'admin';
            if (!['super_admin', 'admin', 'support'].includes(adminRole)) {
                return res.status(400).json(
                    error('VALIDATION', 'role must be one of: super_admin, admin, support')
                );
            }

            const existing = await prisma.admins.findUnique({
                where: { email }
            });
            if (existing) {
                return res.status(409).json(error('DUPLICATE', 'Admin email is already registered'));
            }

            // Delay admin creation to verification step
            const pendingUser = {
                type: 'admin', uuid, name, email, passwordHash, role: adminRole
            };
            responseData = { pendingUser };
        }

        // --- Generate OTP for Registration ---
        const userEmail = type === 'merchant' ? req.body.business_email : req.body.email;
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

        await prisma.verification_codes.create({
            data: {
                email: userEmail,
                code: otp,
                type: 'register',
                expires_at: expiresAt
            }
        });

        console.log(`\n[SECURITY] Registration OTP for ${userEmail}: ${otp}\n`);
        await emailService.sendOTP(userEmail, otp, 'registration');

        res.status(200).json(success('OTP sent to email. Please verify to complete registration', {
            requires_otp: true,
            email: userEmail,
            type,
            pending_data: responseData.pendingUser // In a real app, encrypt this or store in session/cache
        }));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// POST /auth/login
// ============================================================
//
// Body:
//   { email, password, type: 'customer' | 'merchant' | 'admin' }
//
// type defaults to 'customer' if not provided.
// ============================================================

exports.login = async (req, res, next) => {
    try {
        const { email, password, type } = req.body;

        if (!email || !password) {
            return res.status(400).json(
                error('VALIDATION', 'email and password are required')
            );
        }

        const userType = type || 'customer';
        if (!['customer', 'merchant', 'admin'].includes(userType)) {
            return res.status(400).json(
                error('VALIDATION', 'type must be one of: customer, merchant, admin')
            );
        }

        let user;
        if (userType === 'customer') {
            user = await prisma.customers.findUnique({ where: { email } });
        } else if (userType === 'merchant') {
            user = await prisma.merchants.findUnique({ where: { business_email: email } });
        } else {
            user = await prisma.admins.findUnique({ where: { email } });
        }

        if (!user) {
            return res.status(401).json(error('AUTH_FAILED', 'Invalid credentials'));
        }

        // Check account status
        if (user.status && user.status !== 'active') {
            return res.status(403).json(
                error('ACCOUNT_INACTIVE', 'Account is suspended or deleted')
            );
        }

        // Verify password with bcrypt
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json(error('AUTH_FAILED', 'Invalid credentials'));
        }

        const role = userType === 'admin' ? user.role : userType;

        // --- 2FA Login Flow (Send OTP) ---
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins for login

        await prisma.verification_codes.create({
            data: {
                email: email,
                code: otp,
                type: 'login',
                expires_at: expiresAt
            }
        });

        console.log(`\n[SECURITY] Login OTP for ${email}: ${otp}\n`);
        await emailService.sendOTP(email, otp, 'registration'); // Using registration template for simplicity or generic

        return res.json(success('OTP sent to email. Please verify to complete login', {
            requires_otp: true,
            email: email,
            type: userType
        }));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// POST /auth/login/verify
// ============================================================
exports.verifyLoginOTP = async (req, res, next) => {
    try {
        const { email, code, type } = req.body;

        if (!email || !code) {
            return res.status(400).json(error('VALIDATION', 'Email and OTP code are required'));
        }

        const userType = type || 'customer';

        const verification = await prisma.verification_codes.findFirst({
            where: {
                email,
                code,
                type: 'login',
                expires_at: { gt: new Date() }
            },
            orderBy: { created_at: 'desc' }
        });

        if (!verification) {
            return res.status(401).json(error('INVALID_OTP', 'Invalid or expired OTP code'));
        }

        // Delete used code
        await prisma.verification_codes.delete({ where: { id: verification.id } });

        // Retrieve user
        let user;
        if (userType === 'customer') {
            user = await prisma.customers.findUnique({ where: { email } });
        } else if (userType === 'merchant') {
            user = await prisma.merchants.findUnique({ where: { business_email: email } });
        } else {
            user = await prisma.admins.findUnique({ where: { email } });
        }

        if (!user) {
            return res.status(404).json(error('NOT_FOUND', 'User not found'));
        }

        const role = userType === 'admin' ? user.role : userType;
        const token = generateToken({ id: user.id, role, type: userType });

        // Set session for simulator UI
        req.session.user = { id: user.id, role, type: userType };

        const { password_hash, pin_hash, ...userInfo } = user;

        return res.json(success('Login successful', {
            token,
            user: { ...userInfo, type: userType, role }
        }));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// POST /auth/register/verify
// ============================================================
exports.verifyRegistrationOTP = async (req, res, next) => {
    try {
        const { email, code, type, pending_data } = req.body;

        if (!email || !code || !pending_data) {
            return res.status(400).json(error('VALIDATION', 'Email, OTP code, and registration data are required'));
        }

        const verification = await prisma.verification_codes.findFirst({
            where: {
                email,
                code,
                type: 'register',
                expires_at: { gt: new Date() }
            },
            orderBy: { created_at: 'desc' }
        });

        if (!verification) {
            return res.status(401).json(error('INVALID_OTP', 'Invalid or expired OTP code'));
        }

        // Delete used code
        await prisma.verification_codes.delete({ where: { id: verification.id } });

        // Create user
        let user;
        if (type === 'customer') {
            user = await prisma.customers.create({
                data: {
                    uuid: pending_data.uuid,
                    first_name: pending_data.first_name,
                    last_name: pending_data.last_name,
                    email: pending_data.email,
                    phone: pending_data.phone,
                    password_hash: pending_data.passwordHash,
                    pin_hash: pending_data.pinHash
                }
            });
        } else if (type === 'merchant') {
            user = await prisma.merchants.create({
                data: {
                    uuid: pending_data.uuid,
                    business_name: pending_data.business_name,
                    business_email: pending_data.business_email,
                    phone: pending_data.phone,
                    password_hash: pending_data.passwordHash,
                    business_type: pending_data.business_type
                }
            });
        } else if (type === 'admin') {
            user = await prisma.admins.create({
                data: {
                    uuid: pending_data.uuid,
                    name: pending_data.name,
                    email: pending_data.email,
                    password_hash: pending_data.passwordHash,
                    role: pending_data.role
                }
            });
        }

        const role = type === 'admin' ? user.role : type;
        const token = generateToken({ id: user.id, role, type });
        req.session.user = { id: user.id, role, type };

        const { password_hash, pin_hash, ...userInfo } = user;
        res.status(201).json(success(`${type.charAt(0).toUpperCase() + type.slice(1)} registered successfully`, {
            token,
            user: { ...userInfo, type, role }
        }));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// POST /auth/logout
// ============================================================

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.json(success('Logged out successfully'));
    });
};

// ============================================================
// GET /auth/profile
// ============================================================

exports.getProfile = async (req, res, next) => {
    try {
        const { id, type } = req.user;
        let user;

        if (type === 'customer') {
            user = await prisma.customers.findUnique({ where: { id } });
        } else if (type === 'merchant') {
            user = await prisma.merchants.findUnique({ where: { id } });
        } else {
            user = await prisma.admins.findUnique({ where: { id } });
        }

        if (!user) {
            return res.status(404).json(error('NOT_FOUND', 'User not found'));
        }

        const { password_hash, pin_hash, ...profile } = user;
        res.json(success('Profile retrieved', { ...profile, type }));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// PUT /auth/change-password
// ============================================================

exports.changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;
        const { id, type } = req.user;

        if (!current_password || !new_password) {
            return res.status(400).json(
                error('VALIDATION', 'current_password and new_password are required')
            );
        }
        if (!validatePassword(new_password)) {
            return res.status(400).json(
                error('VALIDATION', 'New password must be at least 8 characters')
            );
        }

        let user;
        if (type === 'customer') {
            user = await prisma.customers.findUnique({ where: { id }, select: { password_hash: true } });
        } else if (type === 'merchant') {
            user = await prisma.merchants.findUnique({ where: { id }, select: { password_hash: true } });
        } else {
            user = await prisma.admins.findUnique({ where: { id }, select: { password_hash: true } });
        }

        if (!user) {
            return res.status(404).json(error('NOT_FOUND', 'User not found'));
        }

        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            return res.status(410).json(error('AUTH_FAILED', 'Current password is incorrect'));
        }

        const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);

        if (type === 'customer') {
            await prisma.customers.update({ where: { id }, data: { password_hash: newHash } });
        } else if (type === 'merchant') {
            await prisma.merchants.update({ where: { id }, data: { password_hash: newHash } });
        } else {
            await prisma.admins.update({ where: { id }, data: { password_hash: newHash } });
        }

        res.json(success('Password changed successfully'));
    } catch (err) {
        next(err);
    }
};

exports.setPaymentPin = async (req, res, next) => {
    try {
        const { pin } = req.body;
        const { id, type } = req.user;

        if (type !== 'customer') {
            return res.status(403).json(error('FORBIDDEN', 'Only customers can set a payment PIN'));
        }

        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            return res.status(400).json(error('VALIDATION', 'PIN must be a 4-digit number'));
        }

        const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);

        await prisma.customers.update({
            where: { id },
            data: { pin_hash: pinHash }
        });

        res.json(success('Payment PIN set successfully'));
    } catch (err) {
        next(err);
    }
};
