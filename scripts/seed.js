require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const AppDataSource = require('../config/database');

async function seed() {
    try {
        console.log('🌱 Starting Database Seeding (Cleaning first)...');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log('✅ Connected to Oracle DB');

        // Order is critical due to Foreign Key Constraints
        const orderedTables = [
            'api_keys',
            'api_logs',
            'fraud_alerts',
            'payment_splits',
            'payment_attempts',
            'transactions',
            'payment_sessions',
            'payment_methods',
            'wallets',
            'subscriptions',
            'merchant_apps',
            'merchants',
            'customers',
            'admins',
            'verification_codes',
            'audit_logs'
        ];

        console.log('🧹 Cleaning existing data...');
        for (const table of orderedTables) {
            try {
                // Using raw query for more control over Oracle constraints if needed
                await AppDataSource.query(`DELETE FROM "${table}"`);
                console.log(`   - Cleared ${table}`);
            } catch (e) {
                console.warn(`   ⚠️ Warning: Could not clear ${table}: ${e.message}`);
            }
        }

        const passwordHash = await bcrypt.hash('customer123', 10);
        const merchantPassHash = await bcrypt.hash('merchant123', 10);
        const nexstorePassHash = await bcrypt.hash('nexstore123', 10);
        const adminPassHash = await bcrypt.hash('admin123', 10);
        const pinHash = await bcrypt.hash('1234', 10);

        // 1. Create Admin
        const adminRepo = AppDataSource.getRepository('admins');
        await adminRepo.save(adminRepo.create({
            uuid: uuidv4(),
            name: 'System Admin',
            email: 'admin@paysim.com',
            password_hash: adminPassHash,
            role: 'admin'
        }));
        console.log('👤 Admin created');

        // 2. Create Merchants
        const merchantRepo = AppDataSource.getRepository('merchants');
        const mainStore = await merchantRepo.save(merchantRepo.create({
            uuid: uuidv4(), business_name: 'Main Demo Store',
            business_email: 'store@main.com', password_hash: merchantPassHash
        }));
        const nexStore = await merchantRepo.save(merchantRepo.create({
            uuid: uuidv4(), business_name: 'NexStore',
            business_email: 'sales@nexstore.com', password_hash: nexstorePassHash
        }));
        console.log('🏢 Merchants created (Main Store, NexStore)');

        // 3. Create Customers
        const customerRepo = AppDataSource.getRepository('customers');
        const users = [
            { first: 'John', last: 'Doe', email: 'john@doe.com' },
            { first: 'Jane', last: 'Smith', email: 'jane@smith.com' },
            { first: 'Mike', last: 'Ross', email: 'mike@ross.com' }
        ];

        const savedUsers = [];
        for (const u of users) {
            const user = await customerRepo.save(customerRepo.create({
                uuid: uuidv4(), first_name: u.first, last_name: u.last,
                email: u.email, password_hash: passwordHash, pin_hash: pinHash
            }));
            savedUsers.push(user);
            console.log(`👤 Customer created: ${u.first}`);
        }

        // 4. Create Wallets & Link Payment Methods
        const walletRepo = AppDataSource.getRepository('wallets');
        const methodRepo = AppDataSource.getRepository('payment_methods');

        for (const user of savedUsers) {
            const wallet = await walletRepo.save(walletRepo.create({
                customer_id: user.id, wallet_id: uuidv4(),
                balance: 10000.00, currency: 'INR'
            }));
            await methodRepo.save(methodRepo.create({
                customer_id: user.id, method_type: 'wallet',
                instrument_id: wallet.id, is_default: 1
            }));
            console.log(`💰 Wallet & Method created for ${user.first_name}`);
        }

        // 5. Create Apps for Merchants
        const appRepo = AppDataSource.getRepository('merchant_apps');
        const keyRepo = AppDataSource.getRepository('api_keys');

        const merchants = [
            { m: mainStore, name: 'Main App' },
            { m: nexStore, name: 'NexStore API' }
        ];

        for (const item of merchants) {
            const app = await appRepo.save(appRepo.create({
                merchant_id: item.m.id, app_name: item.name,
                app_uuid: uuidv4(), callback_url: 'http://localhost:3000/webhooks/dummy'
            }));
            await keyRepo.save(keyRepo.create({
                merchant_app_id: app.id, key_prefix: 'sk_test_',
                key_hash: `dummy_hash_for_${item.name.replace(/\s/g, '_')}`,
                key_type: 'secret', is_active: 1
            }));
            console.log(`📱 App & Key created for ${item.m.business_name}`);
        }

        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
