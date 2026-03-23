const { DataSource } = require('typeorm');
const entities = require('../entities/entities');
const oracledb = require('oracledb');
const path = require('path');

const dbType = process.env.DB_TYPE || 'oracle';

if (dbType === 'oracle') {
    try {
        const libDir = path.join(__dirname, '..', '..', '..', 'instantclient_21_15');
        oracledb.initOracleClient({ libDir });
    } catch (err) {}
}

const config = {
    type: dbType,
    synchronize: process.env.NODE_ENV !== 'production', // Disable on Render
    logging: false,
    entities: Object.values(entities),
    subscribers: [],
    migrations: [],
};

if (dbType === 'oracle') {
    Object.assign(config, {
        connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_DB}`,
        username: process.env.ORACLE_USER || "admin",
        password: process.env.ORACLE_PASSWORD || "password",
    });
} else {
    Object.assign(config, {
        database: process.env.SQLITE_PATH || "database.sqlite",
    });
}

const AppDataSource = new DataSource(config);

module.exports = AppDataSource;
