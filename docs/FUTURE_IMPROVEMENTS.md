# PaySim — Future Improvements

## 🔧 Technical Debt

### Security
- [ ] Replace all inline `onclick`/`onsubmit` handlers with `addEventListener` in external JS — removes the need for `script-src-attr 'unsafe-inline'` in CSP
- [ ] Add CSRF token protection on all forms
- [x] Implement rate limiting on `/auth/login` and `/auth/register` (e.g. `express-rate-limit`)
- [x] Add input sanitization middleware (e.g. `express-validator` or `xss-clean`)
- [ ] Store JWT in `httpOnly` cookies instead of `localStorage` to prevent XSS token theft
- [ ] Add password complexity requirements (uppercase, number, special character)
- [ ] Implement account lockout after 5 failed login attempts
- [x] Add audit logging for sensitive profile changes (e.g. PIN update)

### Database
- [x] Add database migration system (Migrated to **Prisma ORM**)
- [x] Add database indexes on `transactions.customer_id`, `transactions.merchant_id`, `transactions.created_at` (Prisma automated)
- [ ] Implement soft deletes instead of hard deletes for payment methods and accounts
- [x] Add database connection retry logic (Prisma handles connection pooling)

### Backend
- [x] Add request validation middleware using `joi` or `express-validator` for all endpoints
- [ ] Implement proper logging with `winston` or `pino` (structured JSON logs)
- [ ] Add API versioning strategy for breaking changes
- [ ] Implement webhook retry logic with exponential backoff for failed deliveries
- [x] Add health check endpoint (`/health`) that validates database connectivity
- [x] Secure sensitive customer data (Password/PIN hashed with bcrypt)

---

## 🚀 Feature Enhancements

### Customer Features
- [x] Wallet top-up from linked bank account (Implemented via Simulator)
- [ ] Transaction receipts (downloadable PDF)
- [x] Transaction filtering by status, mode, and pagination (Implemented)
- [x] UPI payment method support (Simulated via Bank Account bridge)
- [x] Auto-pay / recurring payment support (**Subscription Service** implemented)
- [x] Multi-factor Authentication (**2FA Login via Email OTP** implemented)
- [x] High-Value Transaction Security (**Payment OTP** for amounts > ₹100,000)
- [x] Profile Management (Update details and secure PIN change)
- [ ] Multi-currency support with exchange rate conversion
- [ ] QR code payment generation
- [ ] UI for managing active subscriptions and escrow releases

### Merchant Features
- [ ] Real-time webhook delivery dashboard
- [ ] Settlement reports with CSV/Excel export
- [ ] Customizable checkout page branding (logo, colors)
- [x] Refund processing API (Implemented in **Payment Controller**)
- [x] Split Payment support (**Multi-merchant splits** implemented in Backend)
- [x] Escrow Payment System (**Hold & Release** logic implemented)
- [ ] Multi-app environment management (sandbox vs production toggle)
- [x] Revenue analytics with charts (Daily and 7-day trends implemented)

### Admin Features
- [ ] User management panel (suspend/activate accounts)
- [ ] System-wide analytics dashboard with charts
- [ ] Manual transaction review and override
- [ ] Configurable fraud detection thresholds via admin UI
- [x] Dynamic Risk Scoring system (**RiskService** implemented)
- [x] Smart Payment Routing (**Automated Failover** implemented)
- [ ] Audit log viewer
- [ ] Export fraud alerts to CSV
- [ ] Automated settlement engine (cron-based funds transfer to bank)
- [x] Force OTP on specific applications (NexStore Demo integration)

---

## 🏗️ Architecture Improvements

### Testing
- [ ] Add unit tests with `jest` for all services and controllers
- [ ] Add integration tests for API endpoints with `supertest`
- [ ] Add end-to-end tests with Playwright or Cypress
- [ ] Set up CI/CD pipeline (GitHub Actions)

### Deployment
- [ ] Dockerize the application (`Dockerfile` + `docker-compose.yml`)
- [ ] Add environment-specific configs (dev, staging, production)
- [ ] Set up HTTPS with SSL certificates
- [ ] Add reverse proxy config (nginx)
- [ ] Implement graceful shutdown handling in `server.js`

### Frontend
- [ ] Migrate to a component framework (React/Vue) for better state management
- [x] Add loading skeletons instead of "Loading..." text
- [ ] Implement real-time updates via WebSocket for transaction status
- [x] Add dark mode toggle
- [x] Improve mobile responsiveness with a hamburger menu for sidebar
- [x] Add Chart.js for analytics visualization (Implemented in Customer Dashboard)

---

## 📋 Known Limitations

| Area | Limitation | Workaround |
|------|-----------|------------|
| Payments | Simulator mode only — no real payment processor integration | Use for demo/testing purposes |
| Webhooks | Webhooks are logged but not actually sent via HTTP | Implement real HTTP calls in production |
| Auth | Admin accounts can be registered by anyone | Restrict admin registration to seed scripts |
| Frontend | No SSR — all pages are static HTML with client-side rendering | Migrate to Next.js for SSR |
