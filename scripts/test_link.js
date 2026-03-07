const { v4: uuidv4 } = require('uuid');
const AppDataSource = require('../config/database');
const { payment_sessions, merchant_apps } = require('../src/entities');

async function run() {
    await AppDataSource.initialize();

    const appRepo = AppDataSource.getRepository(merchant_apps);
    const app = await appRepo.findOne({ order: { id: 'ASC' } });

    const session_id = uuidv4();
    const sessionRepo = AppDataSource.getRepository(payment_sessions);
    const session = await sessionRepo.save({
        session_id,
        merchant_app_id: app.id,
        amount: 5000,
        currency: 'INR',
        description: 'Test Link Checkout',
        status: 'pending',
        callback_url: app.callback_url,
        metadata: JSON.stringify({ is_payment_link: true, is_reusable: true }),
        expires_at: new Date(Date.now() + 86400000 * 365)
    });

    console.log(`Payment Link Created: http://localhost:3000/pay/${session_id}`);
    console.log(`SESSION_ID=${session_id}`);
    process.exit(0);
}
run();
