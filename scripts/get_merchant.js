const AppDataSource = require('../config/database');
const { merchants, api_keys } = require('../src/entities');

async function check() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(merchants);
    const m = await repo.find();
    console.log("ALL MERCHANTS:");
    m.forEach(mr => console.log(mr.business_email, mr.business_name));

    const keyRepo = AppDataSource.getRepository(api_keys);
    const keys = await keyRepo.find({ relations: ['merchant_apps', 'merchant_apps.merchants'] });
    console.log("\nALL API KEYS:");
    keys.forEach(k => console.log(k.key_hash, "->", k.merchant_apps?.merchants?.business_email));

    process.exit(0);
}
check();
