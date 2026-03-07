# PaySim — Payment Gateway Platform

A complete payment gateway simulator and merchant platform built with Node.js, Express, and **Oracle Database**.

## 🏗️ Project Structure

```text
├── config/             # Configuration (Database connection, etc.)
├── controllers/        # Express route controllers & request handling
├── middleware/         # Custom auth, logging, and error middlewares
├── public/             # Frontend assets (HTML, CSS, JS)
├── routes/             # API route definitions
├── scripts/            # Admin and utility scripts
├── services/           # CORE: Business logic, Escrow, Email (Brevo), Transactions
├── src/                # TypeORM entities and Core logic
├── tests/              # Standalone verification and 2FA flow tests
├── utils/              # Shared helper functions (validations, responses)
├── .env                # Structured environment variables
├── run.sh              # One-click startup script
└── server.js           # Application entry point
```

## 🚀 Quick Start

Launch the entire system with zero external dependencies (assuming Oracle DB is running):

```bash
./run.sh
```

This script automates:
1. Environment loading.
2. Dependency installation.
3. Starting the development server with live reload.

**Dashboard URL:** http://localhost:3000

## 📖 Key Documentation
For detailed guides, refer to the `docs/` directory:
- [🚀 User & Usage Guide](./docs/USAGE_GUIDE.md) — *Recommended for first-time users*
- [🏛️ Architecture Overview](./docs/ARCHITECTURE.md)
- [🔌 API Documentation](./docs/API_DOCUMENTATION.md)
- [💾 Database Schema](./docs/DATABASE_SCHEMA.md)

## 🔐 Security Features
- **2FA Login**: Email OTP verification via Brevo integration.
- **High-Value Protection**: Mandatory OTP for transactions > ₹100,000.
- **Smart Routing**: Autonomous payment retry and fallback logic.
- **Encryption**: Industry-standard bcrypt hashing for passwords and PINs.

---
© 2026 PaySim Platform. Built for Advanced Fintech Simulation.
