// ============================================================
// Payment Links Controller
// Handles generating and retrieving shareable payment URLs
// ============================================================

const { v4: uuidv4 } = require('uuid');
const AppDataSource = require('../config/database');
const { payment_sessions, merchant_apps } = require('../entities/entities');
const { success, error } = require('../utils/responseHelper');

// Helper: get the public base URL from the incoming request
const getBaseUrl = (req) => {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
};

// ────────────────────────────────────────────────────────
// POST /platform/links
// Creates a new reusable or single-use payment link
// ────────────────────────────────────────────────────────
exports.createLink = async (req, res, next) => {
    try {
        const merchantId = req.user.id;
        const { amount, currency, description, is_reusable, app_id } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json(error('VALIDATION', 'Valid amount is required'));
        }

        let app = null;
        if (app_id) {
            const appRepo = AppDataSource.getRepository(merchant_apps);
            app = await appRepo.findOneBy({ id: parseInt(app_id), merchant_id: merchantId });
            if (!app) {
                return res.status(403).json(error('FORBIDDEN', 'Invalid app selection for this merchant'));
            }
        }

        const session_id = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (is_reusable ? 365 : 1));

        const sessionRepo = AppDataSource.getRepository(payment_sessions);
        const session = await sessionRepo.save({
            session_id,
            merchant_app_id: app ? app.id : null,
            merchant_id: merchantId,
            amount,
            currency: currency || 'INR',
            description: description || 'Payment Link Checkout',
            status: 'pending',
            callback_url: app ? app.callback_url : null,
            metadata: JSON.stringify({
                is_payment_link: true,
                is_reusable: !!is_reusable,
                success_redirect_url: app?.website_url ? `${app.website_url}/success` : '',
                failure_redirect_url: app?.website_url ? `${app.website_url}/failure` : ''
            }),
            expires_at: expiresAt
        });

        // Use actual request host — works on any device/network
        const payUrl = `${getBaseUrl(req)}/pay/${session_id}`;

        res.status(201).json(success('Payment link created', {
            id: session.id,
            url: payUrl,
            session_id: session_id,
            amount,
            is_reusable: !!is_reusable,
            expires_at: expiresAt
        }));
    } catch (err) {
        next(err);
    }
};

// ────────────────────────────────────────────────────────
// GET /platform/links
// Retrieves all payment links created by the merchant
// ────────────────────────────────────────────────────────
exports.getLinks = async (req, res, next) => {
    try {
        const merchantId = req.user.id;

        const sessionRepo = AppDataSource.getRepository(payment_sessions);

        const links = await sessionRepo.createQueryBuilder("session")
            .leftJoinAndSelect("session.merchant_apps", "app")
            .where("session.merchant_id = :merchantId", { merchantId })
            .orWhere("app.merchant_id = :merchantId", { merchantId })
            .orderBy("session.created_at", "DESC")
            .getMany();

        const baseUrl = getBaseUrl(req);

        const paymentLinks = links.filter(s => {
            try {
                const meta = JSON.parse(s.metadata || '{}');
                return meta.is_payment_link === true;
            } catch (e) { return false; }
        }).map(s => {
            const meta = JSON.parse(s.metadata || '{}');
            return {
                id: s.id,
                session_id: s.session_id,
                url: `${baseUrl}/pay/${s.session_id}`,
                amount: s.amount,
                currency: s.currency,
                description: s.description,
                status: s.status,
                is_reusable: meta.is_reusable,
                created_at: s.created_at,
                expires_at: s.expires_at
            };
        });

        res.json(success('Payment links retrieved', paymentLinks));
    } catch (err) {
        next(err);
    }
};
