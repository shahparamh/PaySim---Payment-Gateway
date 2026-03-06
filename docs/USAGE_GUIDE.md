# PaySim — User & Integration Guide

Welcome to the PaySim Payment Gateway Platform. This guide explains how to use the platform in its two primary modes: **Simulator Mode** and **Platform/Gateway Mode**.

---

## 1. Getting Started (Credentials)

The database comes pre-seeded with the following test accounts. Use these to log in to the dashboard at `http://localhost:3000/login.html`.

| Role | Email | Password | PIN | Description |
|---|---|---|---|---|
| **Customer** | `john@doe.com` | `customer123` | `1234` | Standard user for making payments |
| **Merchant** | `store@main.com` | `merchant123` | N/A | Business owner to view analytics & manage keys |
| **Admin** | `admin@paysim.com` | `admin123` | N/A | System admin to view fraud alerts |

> [!IMPORTANT]
> **2FA Security**: All logins now require Email OTP verification. Ensure you have access to the pre-seeded account emails if using local SMTP, or check the terminal logs if the email service is mocked.

---

## 2. Simulator Mode (Dashboard)

Simulator mode allows you to experience the payment flow within the PaySim ecosystem.

### Customer Flow
1. **Login** as a Customer.
2. **Dashboard**: View your wallet balance and recent transactions.
3. **Add Method**: Under "My Instruments", you can add Wallets, Cards, or Bank Accounts. (Note: Only one wallet per user).
4. **Make Payment**: Go to "Simulator" or the "Pay" section.
    - Select a merchant.
    - Choose a payment method.
    - **PIN & OTP Verification**: 
        - Enter `1234` when prompted.
        - High-value payments (over ₹100,000) will trigger an **Email OTP**.
5. **History**: View detailed transaction status. Use the **Status** and **Mode** filters to narrow down your history.

### Merchant Flow
1. **Login** as a Merchant.
2. **Dashboard**: View total revenue, successful payment counts, and active apps.
3. **API Keys**: Generate and manage Secret Keys for external integration.
4. **Transactions**: View payments received and initiate refunds.

---

## 3. Platform Mode (API Gateway)

Platform mode is used when you want to integrate PaySim into an external website.

### Integration Workflow
1. **Create Session**: Your backend calls the `/api/v1/platform/sessions` API using your `Secret Key`.
2. **Redirect**: Redirect your customer to the `checkout_url` provided in the session response.
3. **Checkout UI**: The customer logs in to PaySim, selects a payment method, and enters their **PIN** (`1234`).
4. **Completion**: PaySim redirects the customer back to your `callback_url` with the status.

### Example: Creating a Session
```bash
curl -X POST http://localhost:3000/api/v1/platform/create-payment-session \
  -H "x-api-key: sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "INR",
    "description": "Order #12345",
    "callback_url": "https://yourstore.com/callback"
  }'
```

---

## 4. Advanced Features

| Feature | How to Use / Verify |
|---|---|
| **Escrow** | Create a transaction with `held` status. Funds will be deducted from the customer but not yet settled to the merchant. |
| **Splits** | Provide a `splits` array during session creation to distribute funds among multiple merchants. |
| **Smart Routing** | If your primary payment method fails (e.g., card timeout), the system will automatically attempt a fallback to your wallet if it has sufficient balance. |
| **Risk Score** | View a customer's risk level (Low/Medium/High) in the Admin Dashboard based on their payment behavior. |
