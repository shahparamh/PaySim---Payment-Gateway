// ============================================================
// Subscription Controller
// Handles billing plans and customer subscriptions
// ============================================================

const { v4: uuidv4 } = require('uuid');
const AppDataSource = require('../config/database');
const { subscription_plans, subscriptions, customers, payment_methods } = require('../src/entities');
const { success, error } = require('../utils/responseHelper');

// ── Plans ───────────────────────────────────────────────────

exports.createPlan = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const { name, description, amount, currency, billing_interval } = req.body;

        if (!name || !amount || !billing_interval) {
            return res.status(400).json(error('VALIDATION', 'Name, amount, and interval are required'));
        }

        const planRepo = AppDataSource.getRepository(subscription_plans);
        const plan = await planRepo.save({
            merchant_id: merchantId,
            name,
            description,
            amount: parseFloat(amount),
            currency: currency || 'INR',
            billing_interval,
            status: 'active'
        });

        res.status(201).json(success('Plan created', plan));
    } catch (err) {
        next(err);
    }
};
exports.getPlans = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const planRepo = AppDataSource.getRepository(subscription_plans);
        const plans = await planRepo.find({ where: { merchant_id: merchantId } });
        res.json(success('Plans retrieved', plans));
    } catch (err) {
        next(err);
    }
};

exports.createPlanLink = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const planId = req.params.id;

        const planRepo = AppDataSource.getRepository(subscription_plans);
        const plan = await planRepo.findOneBy({ id: parseInt(planId), merchant_id: merchantId });

        if (!plan) return res.status(404).json(error('NOT_FOUND', 'Plan not found'));

        const session_id = uuidv4();
        // Subscriptions usually don't expire quickly like single payments
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const sessionRepo = AppDataSource.getRepository(payment_sessions);
        const session = await sessionRepo.save({
            session_id,
            merchant_id: merchantId,
            amount: plan.amount,
            currency: plan.currency || 'INR',
            description: `Subscription: ${plan.name}`,
            status: 'pending',
            metadata: JSON.stringify({
                is_subscription: true,
                plan_id: plan.id,
                is_payment_link: true // Reusing the layout logic for links
            }),
            expires_at: expiresAt
        });

        res.json(success('Subscription link generated', {
            url: `http://localhost:3000/pay/${session_id}`
        }));
    } catch (err) {
        next(err);
    }
};

// ── Subscriptions ──────────────────────────────────────────

exports.createSubscription = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const { customer_id, plan_id, payment_method_id } = req.body;

        if (!customer_id || !plan_id || !payment_method_id) {
            return res.status(400).json(error('VALIDATION', 'Customer, plan, and payment method are required'));
        }

        const planRepo = AppDataSource.getRepository(subscription_plans);
        const plan = await planRepo.findOneBy({ id: parseInt(plan_id), merchant_id: merchantId });
        if (!plan) return res.status(404).json(error('NOT_FOUND', 'Plan not found'));

        const subRepo = AppDataSource.getRepository(subscriptions);

        // Calculate next billing date
        const nextBilling = new Date();
        if (plan.billing_interval === 'monthly') nextBilling.setMonth(nextBilling.getMonth() + 1);
        else if (plan.billing_interval === 'yearly') nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        else if (plan.billing_interval === 'weekly') nextBilling.setDate(nextBilling.getDate() + 7);
        else nextBilling.setMonth(nextBilling.getMonth() + 1); // default monthly

        const subscription = await subRepo.save({
            subscription_id: `sub_${uuidv4().substring(0, 8)}`,
            customer_id: parseInt(customer_id),
            merchant_id: merchantId,
            plan_id: plan.id,
            status: 'active',
            next_billing_date: nextBilling,
            payment_method_id: parseInt(payment_method_id)
        });

        res.status(201).json(success('Subscription created', subscription));
    } catch (err) {
        next(err);
    }
};

exports.getSubscriptions = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const subRepo = AppDataSource.getRepository(subscriptions);

        const subs = await subRepo.find({
            where: { merchant_id: merchantId },
            relations: ['customers', 'subscription_plans']
        });

        res.json(success('Subscriptions retrieved', subs));
    } catch (err) {
        next(err);
    }
};
