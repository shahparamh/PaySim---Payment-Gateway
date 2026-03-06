// ============================================================
// Fraud Detection Service — services/fraud.service.js
//
// Application-level fraud detection that complements the
// MySQL triggers. The triggers handle real-time detection;
// this service provides:
//
//   1. On-demand fraud scanning for a transaction
//   2. Alert management (list, detail, resolve, stats)
//   3. Customer risk assessment
//   4. Fraud rule evaluation (extensible)
// ============================================================

const prisma = require('../config/prisma');
const riskService = require('./risk.service');

// ============================================================
// Fraud Rules Configuration
// ============================================================
// Each rule has a name, condition check, severity, and description.
// These are evaluated by checkTransaction() for application-level
// fraud detection (in addition to the MySQL triggers).
// ============================================================

const FRAUD_RULES = [
    {
        name: 'amount_spike',
        threshold: 50000,
        severity: (amount) => {
            if (amount > 200000) return 'critical';
            if (amount > 100000) return 'high';
            return 'medium';
        },
        check: (txn) => txn.amount > 50000,
        description: (txn) =>
            `High-value transaction: ₹${parseFloat(txn.amount).toFixed(2)} exceeds ₹50,000 threshold`
    }
];

// ============================================================
// checkTransaction()
// ============================================================
// Run all fraud rules against a transaction. Called from the
// transaction service after a payment is recorded.
//
// Note: The MySQL triggers also detect fraud in real-time.
// This function provides an additional application-level check
// for rules that require complex logic not suited for SQL.
// ============================================================

async function checkTransaction(transactionId) {
    // Fetch the full transaction
    const txn = await prisma.transactions.findUnique({
        where: { id: transactionId },
        include: { payment_methods: { select: { method_type: true } } }
    });

    if (!txn) return { alerts: [] };

    const alerts = [];

    // Evaluate each rule
    for (const rule of FRAUD_RULES) {
        if (rule.check(txn)) {
            // Check if this alert already exists (from trigger)
            const existing = await prisma.fraud_alerts.findFirst({
                where: { transaction_id: transactionId, alert_type: rule.name }
            });

            if (!existing) {
                // Insert only if trigger didn't already catch it
                const result = await prisma.fraud_alerts.create({
                    data: {
                        transaction_id: transactionId,
                        customer_id: txn.customer_id,
                        alert_type: rule.name,
                        severity: typeof rule.severity === 'function' ? rule.severity(txn.amount) : rule.severity,
                        description: rule.description(txn)
                    }
                });
                alerts.push({ id: result.id, type: rule.name });
            }
        }
    }

    // Additional check: velocity (application-level, backs up trigger)
    const velocityAlerts = await checkVelocity(txn.customer_id, transactionId);
    alerts.push(...velocityAlerts);

    return { alerts, count: alerts.length };
}

// ============================================================
// checkVelocity() — Application-level velocity check
// ============================================================

async function checkVelocity(customerId, currentTxnId) {
    const alerts = [];
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const count = await prisma.transactions.count({
        where: {
            customer_id: customerId,
            created_at: { gte: tenMinutesAgo },
            NOT: { id: currentTxnId }
        }
    });

    if (count >= 5) {
        // Check if trigger already created this alert
        const existing = await prisma.fraud_alerts.findFirst({
            where: { transaction_id: currentTxnId, alert_type: 'velocity_breach' }
        });

        if (!existing) {
            const severity = count >= 10 ? 'critical' : count >= 7 ? 'high' : 'medium';
            const result = await prisma.fraud_alerts.create({
                data: {
                    transaction_id: currentTxnId,
                    customer_id: customerId,
                    alert_type: 'velocity_breach',
                    severity: severity,
                    description: `Velocity breach: ${count + 1} transactions in 10 minutes`
                }
            });
            alerts.push({ id: result.id, type: 'velocity_breach' });
        }
    }

    return alerts;
}

// ============================================================
// getAlerts() — Paginated fraud alert listing
// ============================================================

async function getAlerts({ status, severity, alertType, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (alertType) where.alert_type = alertType;

    const [alerts, total] = await Promise.all([
        prisma.fraud_alerts.findMany({
            where,
            include: {
                transactions: true,
                customers: true,
                admins: { select: { name: true } }
            },
            orderBy: [
                { severity: 'asc' }, // Note: This doesn't strictly follow 'critical,high...' unless enum order is right.
                { created_at: 'desc' }
            ],
            take: limit,
            skip: skip
        }),
        prisma.fraud_alerts.count({ where })
    ]);

    // Flatten for frontend
    const formatted = alerts.map(a => ({
        ...a,
        txn_id: a.transactions?.txn_id,
        amount: a.transactions?.amount,
        currency: a.transactions?.currency,
        txn_status: a.transactions?.status,
        mode: a.transactions?.mode,
        txn_date: a.transactions?.created_at,
        first_name: a.customers?.first_name,
        last_name: a.customers?.last_name,
        customer_email: a.customers?.email,
        resolved_by_name: a.admins?.name
    }));

    return {
        alerts: formatted,
        pagination: { page, limit, total }
    };
}

// ============================================================
// getAlertDetail() — Single alert with full context
// ============================================================

async function getAlertDetail(alertId) {
    const alert = await prisma.fraud_alerts.findUnique({
        where: { id: parseInt(alertId) },
        include: {
            transactions: {
                include: { payment_methods: { select: { method_type: true } } }
            },
            customers: true,
            admins: { select: { name: true } }
        }
    });

    if (!alert) return null;

    // Format for frontend
    const formatted = {
        ...alert,
        txn_id: alert.transactions?.txn_id,
        amount: alert.transactions?.amount,
        currency: alert.transactions?.currency,
        txn_type: alert.transactions?.txn_type,
        txn_status: alert.transactions?.status,
        mode: alert.transactions?.mode,
        failure_reason: alert.transactions?.failure_reason,
        txn_date: alert.transactions?.created_at,
        customer_id: alert.customers?.id,
        first_name: alert.customers?.first_name,
        last_name: alert.customers?.last_name,
        email: alert.customers?.email,
        phone: alert.customers?.phone,
        method_type: alert.transactions?.payment_methods?.method_type,
        resolved_by_name: alert.admins?.name
    };

    // Get customer's recent transaction history for context
    if (alert.customer_id) {
        formatted.customer_recent_transactions = await prisma.transactions.findMany({
            where: { customer_id: alert.customer_id },
            orderBy: { created_at: 'desc' },
            take: 10
        });
    }

    return formatted;
}

// ============================================================
// resolveAlert()
// ============================================================

async function resolveAlert(alertId, adminId, resolution, notes = null) {
    const validResolutions = ['resolved', 'false_positive', 'investigating'];
    if (!validResolutions.includes(resolution)) {
        throw Object.assign(
            new Error(`Invalid resolution. Must be: ${validResolutions.join(', ')}`),
            { statusCode: 400 }
        );
    }

    try {
        const alert = await prisma.fraud_alerts.update({
            where: {
                id: parseInt(alertId),
                status: { in: ['open', 'investigating'] }
            },
            data: {
                status: resolution,
                resolved_by: adminId,
                resolved_at: new Date()
            }
        });
        return { id: alertId, status: alert.status };
    } catch (err) {
        throw Object.assign(
            new Error('Alert not found or already resolved'),
            { statusCode: 404 }
        );
    }
}

// ============================================================
// getAlertStats() — Summary statistics for admin dashboard
// ============================================================

async function getAlertStats() {
    const [byStatus, bySeverity, byType, last24hCount] = await Promise.all([
        prisma.fraud_alerts.groupBy({
            by: ['status'],
            _count: true
        }),
        prisma.fraud_alerts.groupBy({
            by: ['severity'],
            where: { status: 'open' },
            _count: true
        }),
        prisma.fraud_alerts.groupBy({
            by: ['alert_type'],
            where: { status: 'open' },
            _count: true
        }),
        prisma.fraud_alerts.count({
            where: {
                created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        })
    ]);

    return {
        by_status: byStatus.map(s => ({ status: s.status, count: s._count })),
        open_by_severity: bySeverity.map(s => ({ severity: s.severity, count: s._count })),
        open_by_type: byType.map(t => ({ alert_type: t.alert_type, count: t._count })),
        last_24h: last24hCount
    };
}

// ============================================================
// getCustomerRisk() — Risk assessment for a customer
// ============================================================

async function getCustomerRisk(customerId) {
    const counts = await prisma.fraud_alerts.aggregate({
        where: { customer_id: parseInt(customerId) },
        _count: { _all: true },
        _sum: {
            open_alerts: true, // This is tricky because sum needs numeric
        }
    });

    // Aggregate is simpler with separate counts if needed
    const [total, open, critical] = await Promise.all([
        prisma.fraud_alerts.count({ where: { customer_id: parseInt(customerId) } }),
        prisma.fraud_alerts.count({ where: { customer_id: parseInt(customerId), status: 'open' } }),
        prisma.fraud_alerts.count({ where: { customer_id: parseInt(customerId), severity: { in: ['high', 'critical'] } } })
    ]);

    let riskLevel = 'low';
    if (open >= 3 || critical >= 2) {
        riskLevel = 'high';
    } else if (open >= 1 || total >= 3) {
        riskLevel = 'medium';
    }

    return {
        customer_id: customerId,
        risk_level: riskLevel,
        total_alerts: total,
        open_alerts: open,
        high_severity_alerts: critical
    };
}

module.exports = {
    checkTransaction,
    getAlerts,
    getAlertDetail,
    resolveAlert,
    getAlertStats,
    getCustomerRisk
};
