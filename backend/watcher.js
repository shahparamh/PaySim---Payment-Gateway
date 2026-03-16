require('dotenv').config();
const oracledb = require('oracledb');
const AppDataSource = require('./src/config/database');

async function startWatcher() {
    try {
        // Initialize Oracle Thick Client
        try {
            oracledb.initOracleClient({ libDir: '/Users/sandesara/Desktop/Project/instantclient_23' });
        } catch (e) {
            // Ignore if already initialized
        }

        console.log('⏳ Watcher: Connecting to Oracle...');
        await AppDataSource.initialize();
        console.log('✅ Watcher: Connected. Monitoring for new OTPs...\n');

        let lastCodeId = null;

        // Get initial latest ID
        const initial = await AppDataSource.query('SELECT "id" FROM "verification_codes" ORDER BY "created_at" DESC FETCH FIRST 1 ROWS ONLY');
        if (initial && initial.length > 0) {
            lastCodeId = initial[0].id || initial[0].ID;
        }

        setInterval(async () => {
            try {
                const latest = await AppDataSource.query(`
                    SELECT "id", "code", "type", "email" 
                    FROM "verification_codes" 
                    ORDER BY "created_at" DESC 
                    FETCH FIRST 1 ROWS ONLY
                `);

                if (latest && latest.length > 0) {
                    const row = latest[0];
                    const id = row.id || row.ID;
                    const code = row.code || row.CODE;
                    const type = row.type || row.TYPE;
                    const email = row.email || row.EMAIL;

                    if (id !== lastCodeId) {
                        lastCodeId = id;
                        console.log(`\n✨ [OTP RECEIVED]`);
                        console.log(`📧 Email : ${email}`);
                        console.log(`🔢 Code  : ${code}`);
                        console.log(`🏷️ Type  : ${type?.toUpperCase()}`);
                        console.log(`------------------------------------------------`);
                    }
                }
            } catch (err) {
                // Silently handle transient DB errors
            }
        }, 1500); 

    } catch (err) {
        console.error('❌ Watcher Error:', err.message);
        process.exit(1);
    }
}

startWatcher();
