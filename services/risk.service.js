// ==========================================
// Risk Scoring Service — services/risk.service.js
// ==========================================

const prisma = require('../config/prisma');

class RiskService {
    /**
     * Evaluates and updates the risk score for a customer
     * @param {number} customerId 
     * @returns {Promise<Object>} The updated risk score record
     */
    async evaluateRiskScore(customerId) {
        // 1. Fetch relevant data for risk assessment
        const customer = await prisma.customers.findUnique({
            where: { id: customerId },
            include: {
                transactions: {
                    take: 20,
                    orderBy: { created_at: 'desc' }
                },
                fraud_alerts: {
                    where: { status: 'open' }
                },
                payment_methods: true
            }
        });

        if (!customer) throw new Error('Customer not found');

        let score = 0;
        let factors = [];

        // Factor 1: Transaction Volume & Amount Spikes
        const highValueLimit = parseFloat(process.env.MIN_HIGH_VALUE_TRANSACTION) || 50000;
        const highValueTxns = customer.transactions.filter(t => parseFloat(t.amount) > highValueLimit);
        if (highValueTxns.length > 0) {
            score += Math.min(highValueTxns.length * 10, 30);
            factors.push(`${highValueTxns.length} high-value transactions (>${highValueLimit / 1000}k) detected`);
        }
        // Factor 2: Failed Transactions (Potential Card Testing / Brute Force)
        const failedTxns = customer.transactions.filter(t => t.status === 'failed');
        if (failedTxns.length > 5) {
            score += 20;
            factors.push('High frequency of failed transactions');
        }

        // Factor 3: Existing Open Fraud Alerts
        const openAlerts = customer.fraud_alerts.length;
        if (openAlerts > 0) {
            score += Math.min(openAlerts * 15, 40);
            factors.push(`${openAlerts} open fraud alerts pending investigation`);
        }

        // Factor 4: Account Age (New accounts are higher risk)
        const accountAgeDays = Math.floor((new Date() - new Date(customer.created_at)) / (1000 * 60 * 60 * 24));
        if (accountAgeDays < 7) {
            score += 15;
            factors.push('Account is less than 7 days old');
        }

        // Normalize score to 0-100
        score = Math.min(score, 100);

        // Determine risk level using env thresholds
        const medium = parseInt(process.env.RISK_THRESHOLD_MEDIUM) || 25;
        const high = parseInt(process.env.RISK_THRESHOLD_HIGH) || 50;
        const critical = parseInt(process.env.RISK_THRESHOLD_CRITICAL) || 75;

        let riskLevel = 'low';
        if (score > critical) riskLevel = 'critical';
        else if (score > high) riskLevel = 'high';
        else if (score > medium) riskLevel = 'medium';

        // 2. Update or Create risk_scores record
        return await prisma.risk_scores.upsert({
            where: { customer_id: customerId },
            update: {
                risk_score: score,
                risk_level: riskLevel,
                factors: factors,
                last_evaluated: new Date()
            },
            create: {
                customer_id: customerId,
                risk_score: score,
                risk_level: riskLevel,
                factors: factors,
                last_evaluated: new Date()
            }
        });
    }

    /**
     * Gets the current risk status of a customer
     */
    async getCustomerRisk(customerId) {
        let risk = await prisma.risk_scores.findUnique({
            where: { customer_id: customerId }
        });

        // If no risk score exists yet, evaluate it now
        if (!risk) {
            risk = await this.evaluateRiskScore(customerId);
        }

        return risk;
    }
}

module.exports = new RiskService();
