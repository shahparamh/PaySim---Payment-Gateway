const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateApiKey } = require('../utils/idGenerator');

const SALT_ROUNDS = 12;

async function seed() {
    console.log('🌱 Seeding SQLite database...');

    try {
        // 1. Clear existing data
        console.log('🧹 Cleaning up database...');
        const tables = [
            'risk_scores', 'payment_attempts', 'subscription_payments', 'subscriptions',
            'escrow_transactions', 'escrow_accounts', 'payment_splits', 'refunds',
            'transactions', 'payment_sessions', 'payment_methods', 'api_keys',
            'api_logs', 'merchant_apps', 'credit_cards', 'bank_accounts',
            'wallets', 'settlements', 'verification_codes', 'customers',
            'merchants', 'admins'
        ];

        for (const table of tables) {
            await prisma[table].deleteMany({});
        }

        // 2. Create Admin
        const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
        await prisma.admins.create({
            data: {
                uuid: uuidv4(),
                name: 'System Admin',
                email: 'admin@paysim.com',
                password_hash: adminPassword,
                role: 'super_admin'
            }
        });

        // 3. Create Merchants
        const merchantPassword = await bcrypt.hash('merchant123', SALT_ROUNDS);
        const merchantA = await prisma.merchants.create({
            data: {
                uuid: uuidv4(),
                business_name: 'Main Store',
                business_email: 'store@main.com',
                password_hash: merchantPassword,
                status: 'active'
            }
        });

        const merchantB = await prisma.merchants.create({
            data: {
                uuid: uuidv4(),
                business_name: 'Split Partner',
                business_email: 'partner@split.com',
                password_hash: merchantPassword,
                status: 'active'
            }
        });

        // 4. Create Merchant App & API Keys
        const app = await prisma.merchant_apps.create({
            data: {
                merchant_id: merchantA.id,
                app_name: 'Main Checkout App',
                app_uuid: uuidv4(),
                callback_url: 'http://localhost:3000/callback',
                environment: 'sandbox'
            }
        });

        const secretKey = generateApiKey('secret', 'sandbox');
        const keyPrefix = secretKey.split('_')[2].substring(0, 8);
        const keyHash = await bcrypt.hash(secretKey, SALT_ROUNDS);

        await prisma.api_keys.create({
            data: {
                merchant_app_id: app.id,
                key_prefix: keyPrefix,
                key_hash: keyHash,
                key_type: 'secret',
                is_active: true
            }
        });

        console.log(`🔑 Created API Key for 'Main Store': ${secretKey}`);

        // 5. Create Customer
        const customerPassword = await bcrypt.hash('customer123', SALT_ROUNDS);
        const userPassword = await bcrypt.hash('1234567890', SALT_ROUNDS); // User's preferred password
        const pinHash = await bcrypt.hash('1234', SALT_ROUNDS);

        // Seed John Doe
        const customer = await prisma.customers.create({
            data: {
                uuid: uuidv4(),
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@doe.com',
                password_hash: customerPassword,
                pin_hash: pinHash,
                status: 'active'
            }
        });

        // Seed User's Account (as customer)
        await prisma.customers.create({
            data: {
                uuid: uuidv4(),
                first_name: 'Param',
                last_name: 'S',
                email: 'param.s4@ahduni.edu.in',
                password_hash: userPassword,
                pin_hash: pinHash,
                status: 'active'
            }
        });

        // 6. Create Payment Instruments
        const wallet = await prisma.wallets.create({
            data: {
                customer_id: customer.id,
                wallet_id: 'W-' + uuidv4().substring(0, 8).toUpperCase(),
                balance: 10000.00,
                currency: 'INR'
            }
        });

        await prisma.payment_methods.create({
            data: {
                customer_id: customer.id,
                method_type: 'wallet',
                instrument_id: wallet.id,
                is_default: true
            }
        });

        const card = await prisma.credit_cards.create({
            data: {
                customer_id: customer.id,
                card_number_hash: await bcrypt.hash('4111222233334444', SALT_ROUNDS),
                card_last_four: '4444',
                card_brand: 'visa',
                cardholder_name: 'John Doe',
                expiry_month: '12',
                expiry_year: '2030',
                credit_limit: 50000.00,
                used_credit: 0.00
            }
        });

        await prisma.payment_methods.create({
            data: {
                customer_id: customer.id,
                method_type: 'credit_card',
                instrument_id: card.id,
                is_default: false
            }
        });

        // 7. Initial Risk Score
        await prisma.risk_scores.create({
            data: {
                customer_id: customer.id,
                risk_score: 5,
                risk_level: 'low',
                factors: 'New account'
            }
        });

        // 8. Create Additional Customers for P2P and High-Value Testing
        const otherCustomers = [
            { first: 'Jane', last: 'Smith', email: 'jane@smith.com', balance: 500000.00 }, // High value user
            { first: 'Bob', last: 'Wilson', email: 'bob@wilson.com', balance: 1000.00 },
            { first: 'Alice', last: 'Brown', email: 'alice@brown.com', balance: 25000.00 },
            { first: 'Charlie', last: 'Davis', email: 'charlie@davis.com', balance: 50.00 } // Low balance
        ];

        for (const c of otherCustomers) {
            const newCust = await prisma.customers.create({
                data: {
                    uuid: uuidv4(),
                    first_name: c.first,
                    last_name: c.last,
                    email: c.email,
                    password_hash: customerPassword,
                    pin_hash: pinHash,
                    status: 'active'
                }
            });

            const newWallet = await prisma.wallets.create({
                data: {
                    customer_id: newCust.id,
                    wallet_id: 'W-' + uuidv4().substring(0, 8).toUpperCase(),
                    balance: c.balance,
                    currency: 'INR'
                }
            });

            await prisma.payment_methods.create({
                data: {
                    customer_id: newCust.id,
                    method_type: 'wallet',
                    instrument_id: newWallet.id,
                    is_default: true
                }
            });

            await prisma.risk_scores.create({
                data: {
                    customer_id: newCust.id,
                    risk_score: 10,
                    risk_level: 'low',
                    factors: 'Seed data'
                }
            });
        }

        console.log('✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
