// ============================================================
// User Controller — controllers/user.controller.js
// Handles profile management, PIN changes, etc.
// ============================================================

const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/responseHelper');

/**
 * Get current user profile
 */
exports.getProfile = async (req, res, next) => {
    try {
        const user = await prisma.customers.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                uuid: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                status: true,
                created_at: true
            }
        });

        if (!user) {
            return res.status(404).json(error('NOT_FOUND', 'User not found'));
        }

        res.json(success('Profile retrieved', user));
    } catch (err) {
        next(err);
    }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const { first_name, last_name, phone } = req.body;

        const updatedUser = await prisma.customers.update({
            where: { id: req.user.id },
            data: {
                first_name,
                last_name,
                phone
            }
        });

        // Log the action
        await prisma.audit_logs.create({
            data: {
                customer_id: req.user.id,
                action: 'PROFILE_UPDATE',
                details: `Updated profile fields: ${Object.keys(req.body).join(', ')}`,
                ip_address: req.ip
            }
        });

        res.json(success('Profile updated', {
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            phone: updatedUser.phone
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * Change payment PIN
 */
exports.changePin = async (req, res, next) => {
    try {
        const { old_pin, new_pin } = req.body;

        if (!new_pin || new_pin.length < 4) {
            return res.status(400).json(error('VALIDATION', 'New PIN must be at least 4 digits'));
        }

        const user = await prisma.customers.findUnique({
            where: { id: req.user.id },
            select: { pin_hash: true }
        });

        // Verify old PIN if it exists
        if (user.pin_hash) {
            if (!old_pin) {
                return res.status(400).json(error('VALIDATION', 'Current PIN is required to set a new one'));
            }
            const match = await bcrypt.compare(old_pin, user.pin_hash);
            if (!match) {
                return res.status(401).json(error('AUTH_FAILED', 'Incorrect current PIN'));
            }
        }

        const salt = await bcrypt.genSalt(10);
        const pinHash = await bcrypt.hash(new_pin, salt);

        await prisma.customers.update({
            where: { id: req.user.id },
            data: { pin_hash: pinHash }
        });

        // Log the action
        await prisma.audit_logs.create({
            data: {
                customer_id: req.user.id,
                action: 'PIN_CHANGE',
                details: 'Payment PIN updated',
                ip_address: req.ip
            }
        });

        res.json(success('Payment PIN updated successfully'));
    } catch (err) {
        next(err);
    }
};
