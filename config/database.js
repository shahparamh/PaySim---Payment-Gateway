const { DataSource } = require('typeorm');
const entities = require('../src/entities');
const oracledb = require('oracledb');
const path = require('path');

try {
    // Attempt to initialize thick mode with provided binaries
    const libDir = process.env.ORACLE_LIB_DIR || path.join(__dirname, '..', 'instantclient_21_15');
    oracledb.initOracleClient({ libDir });
    console.log(`✅ Oracle Thick Client initialized from: ${libDir}`);
} catch (err) {
    if (err.message.includes('DPI-1047')) {
        console.warn('⚠️ Oracle Thick Client skipped: missing system dependencies (libaio). Falling back to Thin mode...');
    } else {
        console.warn('⚠️ Oracle Thick Client initialization issue:', err.message);
    }
}

const AppDataSource = new DataSource({
    type: "oracle",
    host: process.env.ORACLE_HOST || "localhost",
    port: parseInt(process.env.ORACLE_PORT || "1521", 10),
    username: process.env.ORACLE_USER || "admin",
    password: process.env.ORACLE_PASSWORD || "password",
    // Use serviceName if provided in ORACLE_DB, otherwise fallback to ORACLE_SID
    serviceName: process.env.ORACLE_DB || "ORCL",
    synchronize: true, // Auto-create tables in dev environment
    logging: false,
    entities: Object.values(entities),
    subscribers: [],
    migrations: [],
});

module.exports = AppDataSource;
