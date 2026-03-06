// ==========================================
// Subscription Service — services/subscription.service.js
// ==========================================

const prisma = require('../config/prisma');
const transactionService = require('./transaction.service');
const { v4: uuidv4 } = require('uuid');

class SubscriptionService {
    /**
     * Creates a new subscription for a customer
     */
    async createSubscription(data) {
        const {
            customer_id,
            merchant_id,
            plan_name,
            amount,
            currency = 'INR',
            billing_interval,
            payment_method_id
        } = data;

        // Calculate next billing date
        const nextBillingDate = this.calculateNextBillingDate(new Date(), billing_interval);

        return await prisma.subscriptions.create({
            data: {
                subscription_id: uuidv4(),
                customer_id: parseInt(customer_id),
                merchant_id: parseInt(merchant_id),
                plan_name,
                amount: parseFloat(amount),
                currency,
                billing_interval,
                next_billing_date: nextBillingDate,
                payment_method_id: parseInt(payment_method_id),
                status: 'active'
            }
        });
    }

    /**
     * Simulation: Processes all subscriptions that are due for billing
     */
    async processDueSubscriptions() {
        const now = new Date();
        const due = await prisma.subscriptions.findMany({
            where: {
                next_billing_date: { lte: now },
                status: 'active'
            }
        });

        console.log(`[SubscriptionManager] Found ${due.length} subscriptions due for billing.`);

        const results = [];
        for (const sub of due) {
            try {
                // Generate a payment for this subscription
                // Note: Subscription payments usually don't require an interactive PIN 
                // but for this simulator we'll use a pre-authorized flag or mock the PIN
                const txn = await transactionService.processPayment({
                    customerId: sub.customer_id,
                    paymentMethodId: sub.payment_method_id,
                    amount: sub.amount,
                    currency: sub.currency,
                    merchant_id: sub.merchant_id,
                    mode: 'platform',
                    description: `Recurring payment for ${sub.plan_name}`,
                    is_subscription: true, // Internal flag
                    pin: 'SECRET_BYPASS' // In a real system, subscription tokens are used
                });

                // Record the subscription payment link
                await prisma.subscription_payments.create({
                    data: {
                        subscription_id: sub.id,
                        transaction_id: txn.txn_internal_id,
                        billing_date: sub.next_billing_date,
                        status: 'success'
                    }
                });

                // Update next billing date
                const nextDate = this.calculateNextBillingDate(sub.next_billing_date, sub.billing_interval);
                await prisma.subscriptions.update({
                    where: { id: sub.id },
                    data: { next_billing_date: nextDate, updated_at: new Date() }
                });

                results.push({ id: sub.id, status: 'success' });
            } catch (err) {
                console.error(`[SubscriptionError] Failed to bill sub ${sub.id}:`, err.message);

                // Update to failed status or retry later
                await prisma.subscriptions.update({
                    where: { id: sub.id },
                    data: { status: 'past_due', updated_at: new Date() }
                });

                results.push({ id: sub.id, status: 'failed', error: err.message });
            }
        }
        return results;
    }

    calculateNextBillingDate(currentDate, interval) {
        const next = new Date(currentDate);
        switch (interval) {
            case 'daily': next.setDate(next.getDate() + 1); break;
            case 'weekly': next.setDate(next.getDate() + 7); break;
            case 'monthly': next.setMonth(next.getMonth() + 1); break;
            case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
        }
        return next;
    }
}

module.exports = new SubscriptionService();
