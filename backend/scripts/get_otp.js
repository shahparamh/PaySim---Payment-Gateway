const AppDataSource = require('../src/config/database');
const { verification_codes } = require('../src/entities/entities');

async function getOTP() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(verification_codes);
    const code = await repo.findOne({ where: { user_email: 'merchant@nexstore.com', action: 'register' }, order: { created_at: 'DESC' } });
    if (code) {
        console.log("OTP FOUND:", code.code);
    } else {
        console.log("NO OTP FOUND");
    }
    process.exit(0);
}
getOTP();
