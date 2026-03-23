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
const AppDataSource = require('../config/database');
const { customers, merchants, admins, verification_codes } = require('../entities/entities');
const { success, error } = require('../utils/responseHelper');
const { validateEmail, validatePassword } = require('../utils/validators');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');

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
        let { type, password, email, business_email } = req.body;

        // Normalize emails
        if (email) email = email.toLowerCase();
        if (business_email) business_email = business_email.toLowerCase();

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
            const { first_name, last_name, phone, pin } = req.body;


            if (!first_name || !last_name || !email) {
                return res.status(400).json(
                    error('VALIDATION', 'first_name, last_name, and email are required for customer registration')
                );
            }
            if (!validateEmail(email)) {
                return res.status(400).json(error('VALIDATION', 'Invalid email format'));
            }

            // Check duplicate
            const customerRepo = AppDataSource.getRepository(customers);
            const existing = await customerRepo.findOneBy({ email });
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
            const { business_name, phone, business_type } = req.body;


            if (!business_name || !business_email) {
                return res.status(400).json(
                    error('VALIDATION', 'business_name and business_email are required for merchant registration')
                );
            }
            if (!validateEmail(business_email)) {
                return res.status(400).json(error('VALIDATION', 'Invalid email format'));
            }

            const merchantRepo = AppDataSource.getRepository(merchants);
            const existing = await merchantRepo.findOneBy({ business_email });
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
            const { name, role } = req.body;


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

            const adminRepo = AppDataSource.getRepository(admins);
            const existing = await adminRepo.findOneBy({ email });
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
        const userEmail = type === 'merchant' ? business_email : email;

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 2 * 60000); // 2 mins

        const verificationRepo = AppDataSource.getRepository(verification_codes);
        await verificationRepo.save({
            email: userEmail,
            code: otp,
            type: 'register',
            expires_at: expiresAt
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
        let { email, password, type } = req.body;
        if (email) email = email.toLowerCase();

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
            const customerRepo = AppDataSource.getRepository(customers);
            user = await customerRepo.findOneBy({ email });
        } else if (userType === 'merchant') {
            const merchantRepo = AppDataSource.getRepository(merchants);
            user = await merchantRepo.findOneBy({ business_email: email });
        } else {
            const adminRepo = AppDataSource.getRepository(admins);
            user = await adminRepo.findOneBy({ email });
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
        const expiresAt = new Date(Date.now() + 2 * 60000); // 2 mins for login

        const verificationRepo = AppDataSource.getRepository(verification_codes);
        await verificationRepo.save({
            email: email,
            code: otp,
            type: 'login',
            expires_at: expiresAt
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
        let { email, code, type } = req.body;
        if (email) email = email.toLowerCase();

        if (!email || !code) {

            return res.status(400).json(error('VALIDATION', 'Email and OTP code are required'));
        }

        const userType = type || 'customer';

        const verificationRepo = AppDataSource.getRepository(verification_codes);
        const queryBuilder = verificationRepo.createQueryBuilder("vc");
        const verification = await queryBuilder
            .where("vc.email = :email", { email })
            .andWhere("vc.code = :code", { code })
            .andWhere("vc.type = :type", { type: 'login' })
            .andWhere("vc.expires_at > :now", { now: new Date() })
            .orderBy("vc.created_at", "DESC")
            .getOne();

        if (!verification) {
            return res.status(401).json(error('INVALID_OTP', 'Invalid or expired OTP code'));
        }

        // Delete used code
        await verificationRepo.delete(verification.id);

        // Retrieve user
        let user;
        if (userType === 'customer') {
            const customerRepo = AppDataSource.getRepository(customers);
            user = await customerRepo.findOneBy({ email });
        } else if (userType === 'merchant') {
            const merchantRepo = AppDataSource.getRepository(merchants);
            user = await merchantRepo.findOneBy({ business_email: email });
        } else {
            const adminRepo = AppDataSource.getRepository(admins);
            user = await adminRepo.findOneBy({ email });
        }

        if (!user) {
            return res.status(404).json(error('NOT_FOUND', 'User not found'));
        }

        const role = userType === 'admin' ? user.role : userType;
        const token = generateToken({ id: user.id, role, type: userType });

        // Set session for simulator UI (Safe check for Render environment)
        if (req.session) {
            req.session.user = { id: user.id, role, type: userType };
        } else {
            console.warn('⚠️ [SESSION] req.session is undefined in verifyLoginOTP. Simulator UI may not track user state.');
        }

        const { password_hash, pin_hash, ...userInfo } = user;

        // Trigger Notification
        await notificationService.createNotification(
            user.id, 
            userType, 
            'New Login Detected', 
            `Your account was logged into on ${new Date().toLocaleString()}`,
            'security'
        );

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
        let { email, code, type, pending_data } = req.body;
        if (email) email = email.toLowerCase();

        if (!email || !code || !pending_data) {

            return res.status(400).json(error('VALIDATION', 'Email, OTP code, and registration data are required'));
        }

        const verificationRepo = AppDataSource.getRepository(verification_codes);
        const queryBuilder = verificationRepo.createQueryBuilder("vc");
        const verification = await queryBuilder
            .where("vc.email = :email", { email })
            .andWhere("vc.code = :code", { code })
            .andWhere("vc.type = :type", { type: 'register' })
            .andWhere("vc.expires_at > :now", { now: new Date() })
            .orderBy("vc.created_at", "DESC")
            .getOne();

        if (!verification) {
            return res.status(401).json(error('INVALID_OTP', 'Invalid or expired OTP code'));
        }

        // Delete used code
        await verificationRepo.delete(verification.id);

        // Create user
        let user;
        if (type === 'customer') {
            const customerRepo = AppDataSource.getRepository(customers);
            user = await customerRepo.save({
                uuid: pending_data.uuid,
                first_name: pending_data.first_name,
                last_name: pending_data.last_name,
                email: pending_data.email,
                phone: pending_data.phone,
                password_hash: pending_data.passwordHash,
                pin_hash: pending_data.pinHash
            });
        } else if (type === 'merchant') {
            const merchantRepo = AppDataSource.getRepository(merchants);
            user = await merchantRepo.save({
                uuid: pending_data.uuid,
                business_name: pending_data.business_name,
                business_email: pending_data.business_email,
                phone: pending_data.phone,
                password_hash: pending_data.passwordHash,
                business_type: pending_data.business_type
            });
        } else if (type === 'admin') {
            const adminRepo = AppDataSource.getRepository(admins);
            user = await adminRepo.save({
                uuid: pending_data.uuid,
                name: pending_data.name,
                email: pending_data.email,
                password_hash: pending_data.passwordHash,
                role: pending_data.role
            });
        }

        const role = type === 'admin' ? user.role : type;
        const token = generateToken({ id: user.id, role, type });

        if (req.session) {
            req.session.user = { id: user.id, role, type };
        } else {
            console.warn('⚠️ [SESSION] req.session is undefined in verifyRegistrationOTP.');
        }

        const { password_hash, pin_hash, ...userInfo } = user;
        
        // Trigger Welcome Notification
        await notificationService.createNotification(
            user.id,
            type,
            'Welcome to PaySim!',
            'Your account has been successfully created. Explore your dashboard to get started.',
            'info'
        );

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
    if (req.session) {
        req.session.destroy(() => {
            res.json(success('Logged out successfully'));
        });
    } else {
        res.json(success('Logged out successfully (session already cleared)'));
    }
};

// ============================================================
// GET /auth/profile
// ============================================================

exports.getProfile = async (req, res, next) => {
    try {
        const { id, type } = req.user;
        let user;

        if (type === 'customer') {
            const customerRepo = AppDataSource.getRepository(customers);
            user = await customerRepo.findOneBy({ id: parseInt(id) });
        } else if (type === 'merchant') {
            const merchantRepo = AppDataSource.getRepository(merchants);
            user = await merchantRepo.findOneBy({ id: parseInt(id) });
        } else { // This covers 'admin'
            const adminRepo = AppDataSource.getRepository(admins);
            user = await adminRepo.findOneBy({ id: parseInt(id) });
        }

        if (!user) {
            return res.status(404).json(error('NOT_FOUND', 'User not found'));
        }

        const { password_hash, pin_hash, ...profile } = user;
        res.json(success('Profile retrieved', { ...profile, type, has_pin: !!pin_hash }));
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
            const customerRepo = AppDataSource.getRepository(customers);
            user = await customerRepo.findOne({ where: { id: parseInt(id) }, select: ['id', 'password_hash'] });
        } else if (type === 'merchant') {
            const merchantRepo = AppDataSource.getRepository(merchants);
            user = await merchantRepo.findOne({ where: { id: parseInt(id) }, select: ['id', 'password_hash'] });
        } else {
            const adminRepo = AppDataSource.getRepository(admins);
            user = await adminRepo.findOne({ where: { id: parseInt(id) }, select: ['id', 'password_hash'] });
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
            const customerRepo = AppDataSource.getRepository(customers);
            await customerRepo.update({ id }, { password_hash: newHash });
        } else if (type === 'merchant') {
            const merchantRepo = AppDataSource.getRepository(merchants);
            await merchantRepo.update({ id }, { password_hash: newHash });
        } else {
            const adminRepo = AppDataSource.getRepository(admins);
            await adminRepo.update({ id }, { password_hash: newHash });
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

        const customerRepo = AppDataSource.getRepository(customers);
        await customerRepo.update({ id }, { pin_hash: pinHash });

        res.json(success('Payment PIN set successfully'));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// POST /auth/forgot-password
// ============================================================
exports.forgotPassword = async (req, res, next) => {
    try {
        let { email, type } = req.body;
        if (email) email = email.toLowerCase();
        const userType = type || 'customer';


        if (!email) {
            return res.status(400).json(error('VALIDATION', 'Email is required'));
        }

        const config = getTableConfig(userType);
        const repo = AppDataSource.getRepository(config.table);
        const user = await repo.findOneBy({ [config.emailCol]: email });

        if (!user) {
            // Return success even if user not found for security reasons
            return res.json(success('If an account exists with this email, you will receive an OTP shortly'));
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 2 * 60000); // 2 mins

        const verificationRepo = AppDataSource.getRepository(verification_codes);
        await verificationRepo.save({
            email,
            code: otp,
            type: 'reset_password',
            expires_at: expiresAt
        });

        console.log(`\n[SECURITY] Password Reset OTP for ${email}: ${otp}\n`);
        await emailService.sendOTP(email, otp, 'reset');

        res.json(success('If an account exists with this email, you will receive an OTP shortly'));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// POST /auth/reset-password
// ============================================================
exports.resetPassword = async (req, res, next) => {
    try {
        let { email, code, new_password, type } = req.body;
        if (email) email = email.toLowerCase();
        const userType = type || 'customer';


        if (!email || !code || !new_password) {
            return res.status(400).json(error('VALIDATION', 'Email, OTP code, and new password are required'));
        }

        if (!validatePassword(new_password)) {
            return res.status(400).json(error('VALIDATION', 'Password must be at least 8 characters'));
        }

        const verificationRepo = AppDataSource.getRepository(verification_codes);
        const verification = await verificationRepo.findOne({
            where: {
                email,
                code,
                type: 'reset_password'
            },
            order: { created_at: 'DESC' }
        });

        if (!verification || verification.expires_at < new Date()) {
            return res.status(401).json(error('INVALID_OTP', 'Invalid or expired OTP code'));
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

        // Update user
        const config = getTableConfig(userType);
        const repo = AppDataSource.getRepository(config.table);
        const user = await repo.findOneBy({ [config.emailCol]: email });

        if (!user) {
            return res.status(404).json(error('NOT_FOUND', 'User not found'));
        }

        await repo.update(user.id, { password_hash: passwordHash });

        // Delete used code
        await verificationRepo.delete(verification.id);

        res.json(success('Password has been reset successfully. You can now log in.'));
    } catch (err) {
        next(err);
    }
};

