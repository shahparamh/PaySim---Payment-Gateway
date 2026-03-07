const AppDataSource = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { merchants, merchant_apps, api_keys } = require('./src/entities');

async function seed() {
    try {
        await AppDataSource.initialize();
        const merchantRepo = AppDataSource.getRepository(merchants);
        let merchant = await merchantRepo.findOneBy({ business_email: 'merchant@nexstore.com' });
        
        if (!merchant) {
            merchant = await merchantRepo.save({
                uuid: uuidv4(),
                business_name: 'NexStore Demo',
                business_email: 'merchant@nexstore.com',
                phone: '5551234567',
                password_hash: await bcrypt.hash('password123', 10),
                status: 'active',
                kyc_status: 'verified'
            });
            console.log("Created Merchant ID:", merchant.id);
        }

        const appRepo = AppDataSource.getRepository(merchant_apps);
        let app = await appRepo.findOneBy({ merchant_id: merchant.id, app_name: 'NexStore Online' });
        
        if (!app) {
            app = await appRepo.save({
                merchant_id: merchant.id,
                app_name: 'NexStore Online',
                app_uuid: uuidv4(),
                website_url: 'http://localhost:3000/demo',
                callback_url: 'http://localhost:3000/demo/webhook',
                environment: 'sandbox'
            });
            console.log("Created App ID:", app.id);
        }

        const keyRepo = AppDataSource.getRepository(api_keys);
        let keys = await keyRepo.find({ where: { merchant_app_id: app.id, key_type: 'secret' } });
        
        if (keys.length > 0) {
            console.log("Existing App API Key:", keys[0].key_hash);
        } else {
            console.log("Creating hardcoded demo API key...");
            await keyRepo.save({
                merchant_app_id: app.id,
                key_prefix: 'sk_test_',
                key_hash: 'sk_test_nexstore_demo_key_2026_secure',
                key_type: 'secret'
            });
            console.log("Created API Key: sk_test_nexstore_demo_key_2026_secure");
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
seed();
