<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Oracle_DB-21c-F80000?style=for-the-badge&logo=oracle&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeORM-0.3-FE0803?style=for-the-badge&logo=typeorm&logoColor=white" />
  <img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" />
</p>

# 💳 PaySim — Payment Gateway Platform

> A full-stack **Payment Gateway Simulator** built for FinTech demonstration. Supports merchant onboarding, customer payments, subscription billing, payment links, fraud detection, and a complete admin dashboard — all in one platform.

---

## ✨ Features

| Category | What's Included |
|---|---|
| **🏪 Merchant Portal** | Dashboard with analytics, transaction history, API key management, app registration |
| **💰 Payment Processing** | Wallet, Credit Card, Bank Account, Net Banking — with smart routing & retry logic |
| **🔗 Payment Links** | Generate shareable links (WhatsApp, email) — no website or API integration needed |
| **📦 Subscriptions** | Create billing plans, generate shareable plan links, auto-enrollment on payment |
| **🛡️ Fraud Detection** | Real-time risk scoring, velocity checks, amount spike alerts, auto-suspension |
| **🔐 Security** | 2FA email OTP (via Brevo), high-value transaction protection, bcrypt hashing, JWT auth |
| **👨‍💼 Admin Panel** | Platform-wide stats, user management, fraud alert triage, database browser |
| **🛒 E-commerce Demo** | Fully functional demo store with end-to-end checkout integration |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐  │
│  │  Login   │  │   Merchant   │  │  Customer  │  │   Admin    │  │
│  │   Page   │  │  Dashboard   │  │  Checkout  │  │  Dashboard │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬─────┘  └─────┬──────┘  │
└───────┼────────────────┼────────────────┼──────────────┼──────────┘
        │                │                │              │
        ▼                ▼                ▼              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API LAYER (Express.js)                        │
│  /api/v1/auth    /api/v1/platform    /api/v1/simulator           │
│  /api/v1/admin   /api/v1/instrument   /api/v1/dashboard           │
│  /api/v1/platform/links    /api/v1/platform/subscriptions        │
├──────────────────────────────────────────────────────────────────┤
│                    MIDDLEWARE LAYER                               │
│  JWT Auth │ API Key Auth │ Rate Limiter │ Fraud Engine │ Logger  │
├──────────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                                 │
│  TransactionService │ SessionService │ FraudService │ EmailSvc  │
│  InstrumentService  │ SimulatorService │ SubscriptionService    │
├──────────────────────────────────────────────────────────────────┤
│                    DATA LAYER (TypeORM + Oracle DB)               │
│  merchants │ customers │ transactions │ payment_sessions         │
│  wallets │ credit_cards │ bank_accounts │ fraud_alerts           │
│  subscription_plans │ subscriptions                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
PaySim---Payment-Gateway/
│
├── config/                 # Database configuration (TypeORM + Oracle)
│   └── database.js
│
├── controllers/            # Request handlers
│   ├── auth.controller.js          # Registration, Login, 2FA, Password Reset
│   ├── platform.controller.js      # Sessions, Payments, Dashboard, API Keys
│   ├── link.controller.js          # Payment Link generation
│   ├── subscription.controller.js  # Billing plans & enrollment
│   ├── admin.controller.js         # Admin operations
│   ├── simulator.controller.js     # Payment simulator
│   ├── instrument.controller.js    # Wallets, Cards, Bank Accounts
│   ├── dashboard.controller.js     # Fraud alerts & analytics
│   ├── payment.controller.js       # External payment processing
│   └── user.controller.js          # Profile management
│
├── middleware/             # Express middleware
│   ├── auth.js                     # JWT + API Key authentication
│   ├── rateLimiter.js              # Request throttling
│   ├── apiLogger.js                # Colored API request logging
│   ├── errorHandler.js             # Global error handler
│   ├── modeResolver.js             # Payment mode detection
│   └── validator.js                # Input validation rules
│
├── routes/                 # API route definitions
├── services/               # Core business logic
│   ├── transaction.service.js      # Payment processing engine
│   ├── session.service.js          # Payment session lifecycle
│   ├── fraud.service.js            # Risk scoring & alert generation
│   ├── instrument.service.js       # Financial instrument management
│   ├── email.service.js            # Brevo email integration (OTP delivery)
│   ├── subscription.service.js     # Recurring billing logic
│   ├── simulator.service.js        # Payment simulation engine
│   └── risk.service.js             # Risk assessment calculations
│
├── src/
│   └── entities.js                 # All TypeORM entity definitions
│
├── public/                 # Frontend (HTML/CSS/JS + Bootstrap 5)
│   ├── login.html                  # Unified login/register page
│   ├── checkout.html               # Payment checkout page
│   ├── merchant/                   # Merchant dashboard pages
│   ├── customer/                   # Customer-facing pages
│   ├── admin/                      # Admin panel pages
│   ├── css/style.css               # Global stylesheet
│   └── js/app.js                   # Shared frontend utilities
│
├── scripts/                # Utility & seed scripts
├── docs/                   # Detailed documentation
├── DEMO_ECOMMERCE/         # Standalone e-commerce demo app
├── tests/                  # Test files
│
├── server.js               # Application entry point
├── run.sh / stop.sh        # Start & stop scripts
├── schema.sql              # Database schema (SQL reference)
├── docker-compose.yml      # Docker setup for Oracle DB
└── package.json            # Dependencies & npm scripts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **Oracle Database** 21c (XE or higher)
- **Oracle Instant Client** 21.x (included in repo as `instantclient_21_15/`)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/shahparamh/PaySim---Payment-Gateway.git
cd PaySim---Payment-Gateway

# 2. Configure environment
cp .env.example .env
# Edit .env with your Oracle DB credentials and Brevo API key

# 3. Install dependencies
npm install

# 4. Start the server
./run.sh

# 5. Stop the server
./stop.sh
```

### Access the Platform

| Portal | URL | Credentials (Demo) |
|---|---|---|
| 🏠 Home / Login | http://localhost:5001 | `pratham.s3@gmail.com` / `password123` |
| 🏪 Merchant Dashboard | http://localhost:5001/merchant/dashboard | `sales@nexstore.com` / `password123` |
| 👨‍💼 Admin Dashboard | http://localhost:5001/admin/dashboard | `admin@paysim.com` / `password123` |
| 🛒 E-commerce Demo | http://localhost:5001/demo | — |

---

## 🔑 User Roles

| Role | Registration | Capabilities |
|---|---|---|
| **Customer** | `type: "customer"` | Add wallets/cards, make payments, view transaction history |
| **Merchant** | `type: "merchant"` | Create apps, API keys, payment links, subscriptions, view analytics |
| **Admin** | `type: "admin"` | Platform-wide stats, user management, fraud alert triage, database browser |

---

## 💳 Payment Methods

| Method | How It Works |
|---|---|
| **Wallet** | Pre-loaded digital wallet. Balance deducted on payment. |
| **Credit Card** | Simulated card with spending limit. Used credit increases on payment. |
| **Bank Account** | Direct bank debit. Balance deducted from linked account. |
| **Net Banking** | Links to an existing bank account for online payment. |

---

## 🔗 Payment Links

Generate shareable payment links **without any API integration or website**:

1. **Merchant Dashboard → Payment Links**
2. Enter **Amount** and **Description**
3. Click **Generate Link** → Copy the URL
4. Share via **WhatsApp, Email, or any platform**
5. Customer clicks → Pays → Money credited to merchant

---

## 📦 Subscriptions

Create recurring billing plans and share them as links:

1. **Merchant Dashboard → Subscriptions**
2. Create a **Plan** (name, amount, interval)
3. Click **Copy Link** next to the plan
4. Share with customers
5. Customer pays → **auto-enrolled** in the subscription

Supported intervals: **Weekly**, **Monthly**, **Yearly**

---

## 🛡️ Security Features

| Feature | Description |
|---|---|
| **2FA Login** | Email OTP verification on every login (via Brevo) |
| **High-Value OTP** | Mandatory OTP for transactions above configurable threshold |
| **Fraud Detection** | Amount spike detection, velocity checks, auto-suspension |
| **Risk Scoring** | Real-time customer risk assessment (low / medium / high / critical) |
| **Rate Limiting** | API request throttling to prevent abuse |
| **Password Security** | bcrypt hashing with salt rounds |
| **JWT Authentication** | Stateless token-based auth with expiry |
| **API Key Auth** | Secure merchant app authentication for external integrations |

---

## 🔌 API Quick Reference

**Base URL:** `http://localhost:5001/api/v1`

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Auth** | `/auth/register` | POST | Register (customer / merchant / admin) |
| **Auth** | `/auth/login` | POST | Login (returns JWT or triggers 2FA) |
| **Auth** | `/auth/login/verify` | POST | Verify 2FA OTP |
| **Auth** | `/auth/register/verify` | POST | Verify registration OTP |
| **Platform** | `/platform/register-app` | POST | Register a merchant app |
| **Platform** | `/platform/create-payment-session` | POST | Create a payment session |
| **Platform** | `/platform/process-payment` | POST | Process a payment |
| **Platform** | `/platform/dashboard` | GET | Merchant analytics |
| **Platform** | `/platform/transactions` | GET | Merchant transactions |
| **Platform** | `/platform/api-keys` | GET | List API keys |
| **Links** | `/platform/links` | POST | Generate a payment link |
| **Links** | `/platform/links` | GET | List all payment links |
| **Subs** | `/platform/subscriptions/plans` | POST | Create a billing plan |
| **Subs** | `/platform/subscriptions/plans` | GET | List billing plans |
| **Subs** | `/platform/subscriptions/plans/:id/link` | POST | Generate subscription link |
| **Instruments** | `/instrument/wallets` | POST | Create a wallet |
| **Instruments** | `/instrument/cards` | POST | Add a credit card |
| **Instruments** | `/instrument/bank-accounts` | POST | Add a bank account |
| **Instruments** | `/instrument` | GET | List all payment methods |
| **Simulator** | `/simulator/pay` | POST | Simulate a direct payment |
| **Simulator** | `/simulator/history` | GET | Customer transaction history |
| **Admin** | `/admin/stats` | GET | Platform-wide statistics |
| **Admin** | `/admin/users` | GET | User management |
| **Fraud** | `/dashboard/fraud-alerts` | GET | View fraud alerts |
| **Fraud** | `/dashboard/fraud-alerts/:id/resolve` | PUT | Resolve an alert |

> 📖 Full API documentation with request/response examples: [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `ORACLE_HOST` | Oracle DB host | `localhost` |
| `ORACLE_PORT` | Oracle DB port | `1521` |
| `ORACLE_USER` | Database user | — |
| `ORACLE_PASSWORD` | Database password | — |
| `ORACLE_DB` | Database name | `ORCL` |
| `JWT_SECRET` | JWT signing secret | — |
| `SESSION_TTL_MINUTES` | Payment session expiry (minutes) | `15` |
| `MAX_PAYMENT_RETRIES` | Smart routing retry limit | `3` |
| `MIN_HIGH_VALUE_TRANSACTION` | OTP trigger threshold (₹) | `50000` |
| `BREVO_API_KEY` | Brevo email API key | — |

---

## 🧰 Utility Scripts

```bash
node scripts/seed.js              # Seed the database with test data
node scripts/seed_merchant.js     # Quick merchant account setup
node scripts/get_otp.js           # Retrieve latest OTP from database
node scripts/get_merchant.js      # List all registered merchants
```

---

## 📖 Documentation

| Document | Description |
|---|---|
| [How to Run](./docs/HOW_TO_RUN.md) | Local and Cloud setup instructions |
| [Oracle Docker](./docs/ORACLE_DOCKER_SETUP.md) | Local database setup using Docker |
| [Usage Guide](./docs/USAGE_GUIDE.md) | Step-by-step walkthrough for first-time users |
| [Architecture](./docs/ARCHITECTURE.md) | System design, data flow, and component overview |
| [API Documentation](./docs/API_DOCUMENTATION.md) | Complete REST API reference with examples |
| [Database Schema](./docs/DATABASE_SCHEMA.md) | Entity relationships and table definitions |
| [Future Improvements](./docs/FUTURE_IMPROVEMENTS.md) | Planned features and roadmap |

---

## 🧪 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20.x |
| **Framework** | Express.js 4.x |
| **Database** | Oracle Database 21c |
| **ORM** | TypeORM 0.3.x |
| **Auth** | JWT + bcrypt + 2FA OTP |
| **Email** | Brevo (Sendinblue) API |
| **Frontend** | HTML / CSS / JavaScript + Bootstrap 5 |
| **Dev Tools** | Nodemon, Morgan, Helmet |

---

<p align="center">
  <strong>© 2026 PaySim Platform</strong><br/>
  Built for Advanced FinTech Simulation & Demonstration
</p>
