const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const path = require('path');

// Standardize database path
const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const databaseUrl = `file:${dbPath}`;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
});
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

async function initDemo() {
    console.log(`🚀 Initializing Demo Merchant for NexStore...`);
    console.log(`📂 Database: ${process.env.DATABASE_URL}`);

    try {
        // 1. Create Merchant
        const email = 'sales@nexstore.com';
        let merchant = await prisma.merchants.findUnique({ where: { business_email: email } });

        if (!merchant) {
            const passwordHash = await bcrypt.hash('nexstore123', 10);
            merchant = await prisma.merchants.create({
                data: {
                    uuid: uuidv4(),
                    business_name: 'NexStore',
                    business_email: email,
                    password_hash: passwordHash,
                    status: 'active'
                }
            });
            console.log('✅ Merchant "NexStore" created.');
        } else {
            console.log('ℹ️ Merchant "NexStore" already exists.');
        }

        // 2. Create App
        let app = await prisma.merchant_apps.findFirst({
            where: { merchant_id: merchant.id, app_name: 'NexStore Online' }
        });

        if (!app) {
            const appUuid = uuidv4();
            app = await prisma.merchant_apps.create({
                data: {
                    merchant_id: merchant.id,
                    app_uuid: uuidv4(),
                    app_name: 'NexStore Online',
                    environment: 'sandbox',
                    callback_url: 'http://localhost:3000/demo/webhook', // Mock webhook
                    status: 'active'
                }
            });
            console.log('✅ App "NexStore Online" created.');
        } else {
            console.log('ℹ️ App "NexStore Online" already exists.');
        }

        // 3. Create or Update API Key
        const DEMO_KEY = 'sk_test_nexstore_demo_key_2026_secure';
        let apiKeyRecord = await prisma.api_keys.findFirst({
            where: { merchant_app_id: app.id, key_prefix: 'sk_test_' }
        });

        if (!apiKeyRecord) {
            apiKeyRecord = await prisma.api_keys.create({
                data: {
                    merchant_app_id: app.id,
                    key_type: 'secret',
                    key_prefix: 'sk_test_',
                    key_hash: DEMO_KEY, // Simulator uses this for internal verification
                    last_used_at: null
                }
            });
            console.log('✅ Demo API Key created.');
        } else {
            // Update to ensure it matches our DEMO_KEY
            await prisma.api_keys.update({
                where: { id: apiKeyRecord.id },
                data: { key_hash: DEMO_KEY }
            });
            console.log('ℹ️ Demo API Key updated/verified.');
        }

        const apiKey = DEMO_KEY;
        console.log(`\n🔑 YOUR DEMO API KEY: ${apiKey}\n`);

        // 4. Write to Demo Config
        const configContent = `// Auto-generated config for DEMO_ECOMMERCE
const NEXSTORE_CONFIG = {
    API_KEY: "${apiKey}",
    API_BASE_URL: "http://localhost:3000/api/v1"
};
`;
        fs.writeFileSync(path.join(__dirname, '../DEMO_ECOMMERCE/js/config.js'), configContent);
        console.log('✅ Config written to DEMO_ECOMMERCE/js/config.js');

    } catch (err) {
        console.error('❌ Initialization failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

initDemo();
