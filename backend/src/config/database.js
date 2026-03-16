const { DataSource } = require('typeorm');
const entities = require('../entities/entities');
const oracledb = require('oracledb');
const path = require('path');

const dbType = process.env.DB_TYPE || 'oracle';


const config = {
    type: dbType,
    synchronize: true, // Auto-create tables in dev environment
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
