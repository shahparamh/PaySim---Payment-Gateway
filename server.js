// ============================================================
// Payment Gateway Platform — Entry Point
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const { TypeormStore } = require('connect-typeorm');
const oracledb = require('oracledb');
const path = require('path');

// 1. Initialize Oracle Thick Client
// This is required for Native Network Encryption support (ORA-12660)
try {
    oracledb.initOracleClient({ libDir: './instantclient_21_15' });
    console.log('✅ Oracle Thick Client initialized successfully');
} catch (err) {
    console.error('❌ Failed to initialize Oracle Thick Client:', err.message);
    // Note: Falling back to thin mode will fail if encryption is required
}

const AppDataSource = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLogger } = require('./middleware/apiLogger');
const { apiLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth.routes');
const simulatorRoutes = require('./routes/simulator.routes');
const platformRoutes = require('./routes/platform.routes');
const paymentRoutes = require('./routes/payment.routes');
const instrumentRoutes = require('./routes/instrument.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const linkRoutes = require('./routes/link.routes');
const subscriptionRoutes = require('./routes/subscription.routes');

const app = express();

const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ──────────────────────────────────────────────────────────
// Global Middleware
// ──────────────────────────────────────────────────────────

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://cdn.jsdelivr.net"]
        },
    },
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ──────────────────────────────────────────────────────────
// Database and Session Store Initialization
// ──────────────────────────────────────────────────────────

async function startServer() {
    try {
        // A. Verify Database Connection
        await AppDataSource.initialize();
        console.log('✅ TypeORM connected successfully to Oracle DB');

        // B. Production-Safe Session Management
        // We initialize this AFTER database connection is ready
        app.use(session({
            secret: process.env.SESSION_SECRET || 'dev-secret',
            resave: false,
            saveUninitialized: false,
            store: new TypeormStore({
                cleanupLimit: 2,
                limitSubquery: false, // Recommended for Oracle
                ttl: 86400
            }).connect(AppDataSource.getRepository("Session")),
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        // C. Static Files & Routing
        // (Static files can be used before session, but routes usually need it)
        app.use(express.static(path.join(__dirname, 'public')));
        app.use('/demo', express.static(path.join(__dirname, 'DEMO_ECOMMERCE')));

        app.use(`/api/${API_VERSION}/auth`, authRoutes);
        app.use(`/api/${API_VERSION}/simulator`, simulatorRoutes);
        app.use(`/api/${API_VERSION}/platform`, platformRoutes);
        app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
        app.use(`/api/${API_VERSION}/instruments`, instrumentRoutes);
        app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
        app.use(`/api/${API_VERSION}/users`, userRoutes);
        app.use(`/api/${API_VERSION}/admin`, adminRoutes);
        app.use(`/api/${API_VERSION}/platform/links`, linkRoutes);
        app.use(`/api/${API_VERSION}/platform/subscriptions`, subscriptionRoutes);

        // D. Health Check and UI Routes
        app.get('/health', async (req, res) => {
            res.json({ status: 'UP', timestamp: new Date().toISOString() });
        });

        app.get('/', (req, res) => res.redirect('/login.html'));

        // E. Error Handling
        app.use(errorHandler);

        // F. Start Listening
        app.listen(PORT, () => {
            console.log(`🚀 Payment Gateway running on http://localhost:${PORT}`);
            console.log(`   Environment : ${process.env.NODE_ENV || 'production'}`);
        });

    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
}

// Trigger startup
startServer();

module.exports = app;
