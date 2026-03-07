// ============================================================
// Payment Gateway Platform — Entry Point
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const path = require('path');

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
const linkRoutes = require('./routes/link.routes'); // Added Payment Links API
const subscriptionRoutes = require('./routes/subscription.routes'); // Added Subscriptions API

const app = express();

const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ──────────────────────────────────────────────────────────
// Global Middleware
// ──────────────────────────────────────────────────────────

// Security headers
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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (dev only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Session management (used by Simulator UI)
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Serve Demo E-commerce Showcase
app.use('/demo', express.static(path.join(__dirname, 'DEMO_ECOMMERCE')));
app.use('/DEMO_ECOMMERCE', express.static(path.join(__dirname, 'DEMO_ECOMMERCE')));

// Route for the hosted checkout page (Platform Mode)
app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Custom API logger and Rate Limiter middleware
app.use(`/api/${API_VERSION}`, apiLimiter);
app.use(`/api/${API_VERSION}`, apiLogger);

// ──────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────

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


// Detailed Health Check
app.get('/health', async (req, res) => {
    const health = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        services: {
            database: 'DOWN',
            email_provider: process.env.BREVO_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED'
        }
    };

    try {
        // Simple database query check
        await AppDataSource.query('SELECT 1 FROM DUAL');
        health.services.database = 'UP';
    } catch (err) {
        health.status = 'DEGRADED';
        health.error = err.message;
    }

    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
});

// UI Routes (Frontend Delivery)
app.get('/', (req, res) => res.redirect('/login.html'));

// Generic Payment Link Checkout Route
app.get('/pay/:sessionId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Admin Sub-routes
// ──────────────────────────────────────────────────────────
// Error Handling
// ──────────────────────────────────────────────────────────

// 404 handler (API routes only)
app.use(`/api/${API_VERSION}/*`, (req, res) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` }
    });
});

// Global error handler
app.use(errorHandler);

// ──────────────────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────────────────

async function startServer() {
    try {
        // Verify database connection
        await AppDataSource.initialize();
        console.log('✅ TypeORM connected successfully to Oracle DB');

        app.listen(PORT, () => {
            console.log(`🚀 Payment Gateway running on http://localhost:${PORT}`);
            console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
            console.log(`   API Base    : /api/${API_VERSION}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
}

startServer();

module.exports = app;
