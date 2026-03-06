# PaySim — Payment Gateway Platform

A complete payment gateway simulator and merchant platform built with Node.js, Express, and **SQLite**.

## 🏗️ Project Structure

```text
├── config/             # Configuration (Prisma singleton, etc.)
├── controllers/        # Express route controllers & request handling
├── middleware/         # Custom auth, logging, and error middlewares
├── prisma/             # Schema definition and SQLite database (dev.db)
├── public/             # Frontend assets (HTML, CSS, JS)
├── routes/             # API route definitions
├── scripts/            # Database seeding and fintech verification scripts
├── services/           # CORE: Business logic, Escrow, Email (Brevo), Transactions
├── tests/              # Standalone verification and 2FA flow tests
├── utils/              # Shared helper functions (validations, responses)
├── .env                # Structured environment variables
├── run.sh              # One-click startup script
└── server.js           # Application entry point
```

## 🚀 Quick Start

Launch the entire system with zero external dependencies:

```bash
./run.sh
```

This script automates:
1. Environment loading.
2. Prisma schema synchronization (`prisma/dev.db`).
3. Dependency installation.
4. Starting the development server with live reload.

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
