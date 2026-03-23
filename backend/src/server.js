// ============================================================
// Payment Gateway Platform — Entry Point
// ============================================================

require('dotenv').config();
require('reflect-metadata');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const { TypeormStore } = require('connect-typeorm');
const oracledb = require('oracledb');
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
const linkRoutes = require('./routes/link.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
app.set('trust proxy', 1); // Trust Render's proxy to correctly identify client IP for rate limiting

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
            mediaSrc: ["'self'", "data:"],
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
        // A. Static Files & Root Redirect (Only if not in separated mode)
        if (process.env.SERVE_FRONTEND !== 'false') {
            const frontendPath = path.join(__dirname, '../../frontend/dist');
            app.use(express.static(frontendPath));
            app.use('/demo', express.static(path.join(__dirname, '../../DEMO_ECOMMERCE'), { extensions: ['html'] }));
            
            // Redirect root to index.html
            app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
        }

        // B. API Routes & Health Check
        app.use(`/api/${API_VERSION}/auth`, authRoutes);
        app.use(`/api/${API_VERSION}/simulator`, simulatorRoutes);
        app.use(`/api/${API_VERSION}/platform`, platformRoutes);
        app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
        app.use(`/api/${API_VERSION}/instrument`, instrumentRoutes);
        app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
        app.use(`/api/${API_VERSION}/user`, userRoutes);
        app.use(`/api/${API_VERSION}/admin`, adminRoutes);
        app.use(`/api/${API_VERSION}/platform/links`, linkRoutes);
        app.use(`/api/${API_VERSION}/platform/subscriptions`, subscriptionRoutes);
        app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);

        // D. Health Check
        app.get('/health', async (req, res) => {
            res.json({ status: 'UP', timestamp: new Date().toISOString() });
        });

        // SPA fallback: handle React routing (MUST BE AFTER API ROUTES)
        if (process.env.SERVE_FRONTEND !== 'false') {
            const frontendPath = path.join(__dirname, '../../frontend/dist');
            app.get('*', (req, res, next) => {
                if (req.url.startsWith('/api/') || req.url === '/health') return next();
                res.sendFile(path.join(frontendPath, 'index.html'));
            });
        }

        // B. Database Connection (Background)
        await AppDataSource.initialize();
        console.log('✅ TypeORM connected successfully to Oracle DB');

        // C. Production-Safe Session Management
        app.use(session({
            secret: process.env.SESSION_SECRET || 'dev-secret',
            resave: false,
            saveUninitialized: false,
            proxy: true, // Required for secure cookies behind proxies like Render
            store: new TypeormStore({
                cleanupLimit: 2,
                limitSubquery: false,
                ttl: 86400
            }).connect(AppDataSource.getRepository("Session")),
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'lax'
            }
        }));



        // E. Error Handling
        app.use(errorHandler);

        // F. Start Listening
        app.listen(PORT, () => {
            console.log(`🚀 Payment Gateway running on http://localhost:${PORT}`);
            console.log(`   Environment : ${process.env.NODE_ENV || 'production'}`);
        });

    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

// Trigger startup
startServer();

module.exports = app;
