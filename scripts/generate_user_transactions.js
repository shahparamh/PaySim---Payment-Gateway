const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Standardize database path
const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    }
});

async function generateData() {
    const email = 'param.s4@ahduni.edu.in';
    console.log(`🚀 Adding test data for ${email}...`);

    try {
        // 1. Find User
        const user = await prisma.customers.findUnique({ where: { email } });
        if (!user) {
            console.error('❌ User not found! Please run seeding scripts first.');
            return;
        }

        // 2. Ensure Wallet
        let wallet = await prisma.wallets.findFirst({ where: { customer_id: user.id } });
        if (!wallet) {
            wallet = await prisma.wallets.create({
                data: {
                    customer_id: user.id,
                    wallet_id: 'W-' + uuidv4().substring(0, 8).toUpperCase(),
                    balance: 45000.00,
                    currency: 'INR',
                    status: 'active'
                }
            });
            console.log('✅ Wallet created.');

            await prisma.payment_methods.create({
                data: {
                    customer_id: user.id,
                    method_type: 'wallet',
                    instrument_id: wallet.id,
                    is_default: true,
                    status: 'active'
                }
            });
        }

        // 3. Ensure Credit Card
        let card = await prisma.credit_cards.findFirst({ where: { customer_id: user.id } });
        if (!card) {
            card = await prisma.credit_cards.create({
                data: {
                    customer_id: user.id,
                    card_number_hash: await bcrypt.hash('4111222233331111', 10),
                    card_last_four: '1111',
                    card_brand: 'visa',
                    cardholder_name: 'Param S',
                    expiry_month: '09',
                    expiry_year: '2028',
                    credit_limit: 150000.00,
                    used_credit: 0.00
                }
            });
            console.log('✅ Credit card created.');

            await prisma.payment_methods.create({
                data: {
                    customer_id: user.id,
                    method_type: 'credit_card',
                    instrument_id: card.id,
                    is_default: false,
                    status: 'active'
                }
            });
        }

        // 4. Get Merchant Apps
        const apps = await prisma.merchant_apps.findMany();
        const mainApp = apps.find(a => a.app_name === 'Main Checkout App') || apps[0];
        const nexstore = apps.find(a => a.app_name === 'NexStore Online') || apps[1];

        // 5. Add Transactions
        console.log('🕒 Generating historical transactions...');
        const paymentMethod = await prisma.payment_methods.findFirst({
            where: { customer_id: user.id, method_type: 'wallet' }
        });

        const transactions = [
            { amount: 1200.50, desc: 'Groceries at Main Store', app: mainApp, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { amount: 599.00, desc: 'Monthly Subscription', app: mainApp, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            { amount: 3500.00, desc: 'Titan Pro Smarphone Installment', app: nexstore, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
            { amount: 450.00, desc: 'Caffeine Rush Coffee', app: mainApp, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { amount: 125000.00, desc: 'High Value Luxury Watch', app: nexstore, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        ];

        for (const t of transactions) {
            await prisma.transactions.create({
                data: {
                    txn_id: uuidv4(),
                    customer_id: user.id,
                    merchant_id: t.app.merchant_id,
                    payment_method_id: paymentMethod.id,
                    amount: t.amount,
                    currency: 'INR',
                    txn_type: 'payment',
                    status: 'success',
                    mode: 'platform',
                    verified_at: t.date,
                    created_at: t.date
                }
            });
        }

        console.log(`✅ Successfully added ${transactions.length} transactions.`);

    } catch (err) {
        console.error('❌ Operation failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

generateData();
