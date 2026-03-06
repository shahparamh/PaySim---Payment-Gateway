// ============================================================
// Prisma Client Singleton — config/prisma.js
// ============================================================

const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Standardize database path to prisma/dev.db relative to this file
const dbPath = path.resolve(__dirname, '../prisma/dev.db');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

module.exports = prisma;
