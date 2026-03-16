require('dotenv').config();
const oracledb = require('oracledb');
const AppDataSource = require('./src/config/database');

async function peek() {
    try {
        // Initialize Oracle Thick Client
        try {
            oracledb.initOracleClient({ libDir: '/Users/sandesara/Desktop/Project/instantclient_23' });
        } catch (e) {
            // Ignore if already initialized
        }

        console.log('⏳ Connecting to Oracle...');
        await AppDataSource.initialize();
        console.log('✅ Connected.\n');

        const codes = await AppDataSource.query(`
            SELECT "code", "type", "email", "created_at", "expires_at" 
            FROM "verification_codes" 
            ORDER BY "created_at" DESC 
            FETCH FIRST 10 ROWS ONLY
        `);

        if (codes.length === 0) {
            console.log('❌ No OTPs found in database.');
        } else {
            console.log('📋 LATEST 10 OTPS:');
            console.table(codes);
        }

        const [dbTime] = await AppDataSource.query('SELECT CURRENT_TIMESTAMP as now FROM DUAL');
        console.log('\n🕒 Database Time:', dbTime.NOW);
        console.log('🕒 System Time  :', new Date().toISOString());

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

peek();
