const { DataSource } = require('typeorm');
const entities = require('../src/entities');

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
