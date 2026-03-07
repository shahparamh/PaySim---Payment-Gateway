const AppDataSource = require('../config/database');
const entities = require('../src/entities');
const { success, error } = require('../utils/responseHelper');
const bcrypt = require('bcryptjs');

/**
 * Get system-wide overview stats for Admin
 */
exports.getDatabaseOverview = async (req, res, next) => {
    try {
        const customerRepo = AppDataSource.getRepository(entities.customers);
        const merchantRepo = AppDataSource.getRepository(entities.merchants);
        const txnRepo = AppDataSource.getRepository(entities.transactions);
        const logRepo = AppDataSource.getRepository(entities.api_logs);

        const [userCount, merchantCount, txnStats, logCount] = await Promise.all([
            customerRepo.count(),
            merchantRepo.count(),
            txnRepo.createQueryBuilder("t").select("SUM(t.amount)", "sum").addSelect("COUNT(t.id)", "count").getRawOne(),
            logRepo.count()
        ]);

        res.json(success('Database overview retrieved', {
            counts: {
                customers: userCount,
                merchants: merchantCount,
                transactions: parseInt(txnStats.count || 0),
                api_logs: logCount
            },
            volume: parseFloat(txnStats.sum || 0)
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * List all customers with pagination and search
 */
exports.listCustomers = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const repo = AppDataSource.getRepository(entities.customers);
        const qb = repo.createQueryBuilder("c");

        if (search) {
            qb.where("c.email LIKE :search OR c.first_name LIKE :search OR c.last_name LIKE :search", { search: `%${search}%` });
        }

        const [users, total] = await qb
            .orderBy("c.created_at", "DESC")
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        res.json(success('Customers retrieved', { users, pagination: { total, page, limit } }));
    } catch (err) {
        next(err);
    }
};

/**
 * List all merchants
 */
exports.listMerchants = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const repo = AppDataSource.getRepository(entities.merchants);
        const qb = repo.createQueryBuilder("m");

        if (search) {
            qb.where("m.business_email LIKE :search OR m.business_name LIKE :search", { search: `%${search}%` });
        }

        const [merchants, total] = await qb
            .orderBy("m.created_at", "DESC")
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        res.json(success('Merchants retrieved', { merchants, pagination: { total, page, limit } }));
    } catch (err) {
        next(err);
    }
};

/**
 * Silent Modification of a user record
 */
exports.updateUserSilent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type, ...updates } = req.body;

        const entityName = type === 'merchant' ? 'merchants' : 'customers';
        const repo = AppDataSource.getRepository(entities[entityName]);

        const existing = await repo.findOneBy({ id });
        if (!existing) return res.status(404).json(error('NOT_FOUND', 'User not found'));

        // Prevent password update via this endpoint for security, or handle hash
        if (updates.password) {
            updates.password_hash = await bcrypt.hash(updates.password, 10);
            delete updates.password;
        }

        // Normalize email updates
        if (updates.email) updates.email = updates.email.toLowerCase();
        if (updates.business_email) updates.business_email = updates.business_email.toLowerCase();

        await repo.update(id, updates);


        // Log the admin action
        console.log(`[ADMIN_ACTION] Admin ${req.user.email} silently modified ${type} ${id}: ${JSON.stringify(updates)}`);

        res.json(success(`${type} updated successfully`));
    } catch (err) {
        next(err);
    }
};

/**
 * Force Delete Customer and all associated records
 */
exports.deleteCustomerForce = async (req, res, next) => {
    const { id } = req.params;

    // Check existence first to avoid wasted transactions
    const customerRepo = AppDataSource.getRepository(entities.customers);
    const existing = await customerRepo.findOneBy({ id: parseInt(id) });
    if (!existing) {
        return res.status(404).json(error('NOT_FOUND', 'Customer not found'));
    }


    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Use a higher isolation level or locks if needed, 
    // but in Oracle, standard delete order is usually enough.
    await queryRunner.startTransaction();

    try {
        // Order of deletion to satisfy ORA-02292 (Foreign Key Constraints)
        // Deleting from child tables first
        const tables = [
            'audit_logs',
            'payment_attempts',
            'subscriptions',
            'fraud_alerts',
            'transactions',
            'payment_sessions',
            'payment_methods',
            'wallets',
            'credit_cards',
            'bank_accounts'
        ];

        for (const tableName of tables) {
            await queryRunner.query(`DELETE FROM "${tableName}" WHERE "customer_id" = :id`, [id]);
        }

        // Final deletion of the customer record
        await queryRunner.query(`DELETE FROM "customers" WHERE "id" = :id`, [id]);

        await queryRunner.commitTransaction();
        console.log(`[ADMIN_ACTION] Admin ${req.user.email} force-purged customer ${id}`);
        res.json(success('Customer and all related data purged successfully'));
    } catch (err) {
        await queryRunner.rollbackTransaction();
        // If it's a deadlock, we might want to retry or just log it clearly
        if (err.message.includes('ORA-00060')) {
            console.error(`[DEADLOCK] Conflict deleting customer ${id}. This usually happens if other transactions are locking related records.`);
            return res.status(409).json(error('CONFLICT', 'A database deadlock occurred. Please try again in a few seconds.'));
        }
        next(err);
    } finally {
        await queryRunner.release();
    }
};


/**
 * Force Delete Merchant and related records
 */
exports.deleteMerchantForce = async (req, res, next) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const { id } = req.params;

        // Delete Merchant Apps and their nested data first
        const apps = await queryRunner.query(`SELECT id FROM "merchant_apps" WHERE "merchant_id" = :id`, [id]);
        for (const app of apps) {
            await queryRunner.query(`DELETE FROM "api_keys" WHERE "merchant_app_id" = :appId`, [app.id]);
            await queryRunner.query(`DELETE FROM "api_logs" WHERE "merchant_app_id" = :appId`, [app.id]);
            await queryRunner.query(`DELETE FROM "payment_sessions" WHERE "merchant_app_id" = :appId`, [app.id]);
        }
        await queryRunner.query(`DELETE FROM "merchant_apps" WHERE "merchant_id" = :id`, [id]);

        // Clean up other merchant relations
        await queryRunner.query(`DELETE FROM "settlements" WHERE "merchant_id" = :id`, [id]);
        await queryRunner.query(`DELETE FROM "payment_splits" WHERE "merchant_id" = :id`, [id]);
        await queryRunner.query(`DELETE FROM "subscriptions" WHERE "merchant_id" = :id`, [id]);

        // Handle transactions (usually customer_id is the primary blocker, but merchant_id exists too)
        await queryRunner.query(`DELETE FROM "transactions" WHERE "merchant_id" = :id`, [id]);

        await queryRunner.query(`DELETE FROM "merchants" WHERE "id" = :id`, [id]);

        await queryRunner.commitTransaction();
        res.json(success('Merchant and all related applications/data purged successfully'));
    } catch (err) {
        await queryRunner.rollbackTransaction();
        next(err);
    } finally {
        await queryRunner.release();
    }
};
