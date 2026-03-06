// ============================================================
// Dashboard Controller — controllers/dashboard.controller.js
//
// Provides:
//   - Role-aware stats (customer/merchant/admin)
//   - Paginated transaction listing
//   - Settlement history
//   - Fraud alert management (admin-only)
//     - List alerts (filterable by status/severity/type)
//     - Alert detail with customer context
//     - Resolve/investigate alerts
//     - Alert summary stats
//     - Customer risk assessment
// ============================================================

const prisma = require('../config/prisma');
const fraudService = require('../services/fraud.service');
const { success, error } = require('../utils/responseHelper');

// ============================================================
// GET /dashboard/stats
// ============================================================

exports.getStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userType = req.user.type;

        const where = {};
        if (userType === 'merchant') where.merchant_id = userId;
        else if (userType === 'customer') where.customer_id = userId;

        const summary = await prisma.transactions.groupBy({
            by: ['status'],
            where: where,
            _count: true,
            _sum: { amount: true }
        });

        // Format result to match previous structure
        const result = {
            total_transactions: 0,
            successful: 0,
            failed: 0,
            total_volume: 0
        };

        summary.forEach(group => {
            result.total_transactions += group._count;
            if (group.status === 'success') {
                result.successful = group._count;
                result.total_volume = parseFloat(group._sum.amount || 0);
            } else if (group.status === 'failed') {
                result.failed = group._count;
            }
        });

        // 7-day spending trends
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const sevenDaysAgo = new Date(startOfToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const recentTxns = await prisma.transactions.findMany({
            where: {
                ...where,
                status: 'success',
                created_at: { gte: sevenDaysAgo }
            },
            select: { amount: true, created_at: true }
        });

        const labels = [];
        const dataArr = [];
        const map = new Map();

        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            labels.push(dateStr);
            map.set(d.toDateString(), 0);
        }

        recentTxns.forEach(t => {
            const dStr = t.created_at.toDateString();
            if (map.has(dStr)) {
                map.set(dStr, map.get(dStr) + parseFloat(t.amount || 0));
            }
        });

        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            dataArr.push(map.get(d.toDateString()));
        }

        result.chart = { labels, data: dataArr };

        // Spent This Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStats = await prisma.transactions.aggregate({
            where: {
                ...where,
                status: 'success',
                created_at: { gte: startOfMonth }
            },
            _sum: { amount: true }
        });
        result.spent_this_month = parseFloat(monthStats._sum.amount || 0);

        // Wallet Balance (for customers)
        if (userType === 'customer') {
            const wallet = await prisma.wallets.findFirst({
                where: { customer_id: userId }
            });
            result.wallet_balance = wallet ? parseFloat(wallet.balance) : 0;
        }

        res.json(success('Dashboard stats retrieved', result));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// GET /dashboard/transactions
// ============================================================

exports.getTransactions = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { status, mode } = req.query;

        const where = {};
        if (req.user.type === 'merchant') where.merchant_id = req.user.id;
        else if (req.user.type === 'customer') where.customer_id = req.user.id;

        if (status) where.status = status;
        if (mode) where.mode = mode;

        const [transactions, total] = await Promise.all([
            prisma.transactions.findMany({
                where,
                include: { payment_methods: { select: { method_type: true } } },
                orderBy: { created_at: 'desc' },
                take: limit,
                skip: skip
            }),
            prisma.transactions.count({ where })
        ]);

        // Flatten method_type for frontend compatibility
        const formatted = transactions.map(t => ({
            ...t,
            method_type: t.payment_methods?.method_type || 'unknown'
        }));

        res.json(success('Transactions retrieved', {
            transactions: formatted,
            pagination: { page, limit, total }
        }));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// GET /dashboard/settlements
// ============================================================

exports.getSettlements = async (req, res, next) => {
    try {
        const where = {};
        if (req.user.type !== 'admin') where.merchant_id = req.user.id;

        const settlements = await prisma.settlements.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 50
        });

        res.json(success('Settlements retrieved', settlements));
    } catch (err) {
        next(err);
    }
};

// ============================================================
// FRAUD ALERT MANAGEMENT (Admin-only)
// ============================================================

// ────────────────────────────────────────────────────────
// GET /dashboard/fraud-alerts/stats
// Summary statistics for the fraud dashboard.
// ────────────────────────────────────────────────────────

exports.getFraudAlertStats = async (req, res, next) => {
    try {
        const stats = await fraudService.getAlertStats();
        res.json(success('Fraud alert stats retrieved', stats));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /dashboard/fraud-alerts
// Paginated list with filters.
// Query params: ?status=open&severity=high&type=amount_spike&page=1&limit=20
// ────────────────────────────────────────────────────────

exports.getFraudAlerts = async (req, res, next) => {
    try {
        const { status, severity, type, page, limit } = req.query;

        const result = await fraudService.getAlerts({
            status: status || null,
            severity: severity || null,
            alertType: type || null,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });

        res.json(success('Fraud alerts retrieved', result));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /dashboard/fraud-alerts/:id
// Full alert detail with customer transaction history.
// ────────────────────────────────────────────────────────

exports.getFraudAlertDetail = async (req, res, next) => {
    try {
        const alert = await fraudService.getAlertDetail(req.params.id);
        if (!alert) {
            return res.status(404).json(error('NOT_FOUND', 'Fraud alert not found'));
        }
        res.json(success('Fraud alert detail retrieved', alert));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// PUT /dashboard/fraud-alerts/:id/resolve
// Body: { resolution: 'resolved' | 'false_positive' | 'investigating' }
// ────────────────────────────────────────────────────────

exports.resolveFraudAlert = async (req, res, next) => {
    try {
        const { resolution } = req.body;
        if (!resolution) {
            return res.status(400).json(
                error('VALIDATION', 'resolution is required (resolved, false_positive, investigating)')
            );
        }

        const result = await fraudService.resolveAlert(
            req.params.id,
            req.user.id,
            resolution
        );

        res.json(success('Fraud alert updated', result));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /dashboard/customer-risk/:customerId
// Risk assessment for a specific customer.
// ────────────────────────────────────────────────────────

exports.getCustomerRisk = async (req, res, next) => {
    try {
        const risk = await fraudService.getCustomerRisk(req.params.customerId);
        res.json(success('Customer risk assessment', risk));
    } catch (err) {
        next(err);
    }
};
