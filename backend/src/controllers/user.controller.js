// ============================================================
// User Controller — controllers/user.controller.js
// Handles profile management, PIN changes, etc.
// ============================================================

const AppDataSource = require('../config/database');
const { customers, audit_logs } = require('../entities/entities');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/responseHelper');

/**
 * Get current user profile
 */
exports.getProfile = async (req, res, next) => {
    try {
        const userRepo = AppDataSource.getRepository(customers);
        const user = await userRepo.findOne({
            where: { id: parseInt(req.user.id) },
            select: ['id', 'uuid', 'first_name', 'last_name', 'email', 'phone', 'status', 'created_at']
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

        const userRepo = AppDataSource.getRepository(customers);
        await userRepo.update({ id: parseInt(req.user.id) }, {
            first_name,
            last_name,
            phone
        });

        const updatedUser = await userRepo.findOneBy({ id: parseInt(req.user.id) });

        // Log the action
        const auditRepo = AppDataSource.getRepository(audit_logs);
        await auditRepo.save({
            customer_id: parseInt(req.user.id),
            action: 'PROFILE_UPDATE',
            details: `Updated profile fields: ${Object.keys(req.body).join(', ')}`,
            ip_address: req.ip
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

        const userRepo = AppDataSource.getRepository(customers);
        const user = await userRepo.findOne({
            where: { id: parseInt(req.user.id) },
            select: ['id', 'pin_hash']
        });

        if (!user) {
            return res.status(404).json(error('NOT_FOUND', 'User record not found'));
        }

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

        await userRepo.update({ id: parseInt(req.user.id) }, { pin_hash: pinHash });

        // Log the action
        const auditRepo = AppDataSource.getRepository(audit_logs);
        await auditRepo.save({
            customer_id: parseInt(req.user.id),
            action: 'PIN_CHANGE',
            details: 'Payment PIN updated',
            ip_address: req.ip
        });

        res.json(success('Payment PIN updated successfully'));
    } catch (err) {
        next(err);
    }
};
