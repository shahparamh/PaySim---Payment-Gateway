# PaySim — API Documentation

**Base URL:** `http://localhost:5001/api/v1`

---

## Authentication

All protected endpoints require one of:

| Method | Header | Used By |
|---|---|---|
| JWT Token | `Authorization: Bearer <token>` | Customers, Merchants, Admins |
| API Key | `x-api-key: sk_test_xxx...` | External merchant apps |

---

## 1. Auth APIs

### POST `/auth/register`

Register a new user (customer, merchant, or admin).

**Body (Customer):**
```json
{
  "type": "customer",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "securepass123"
}
```

**Body (Merchant):**
```json
{
  "type": "merchant",
  "business_name": "Acme Inc.",
  "business_email": "pay@acme.com",
  "phone": "9876543210",
  "password": "securepass123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 1, "email": "john@example.com", "type": "customer" }
  }
}
```

---

### POST `/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepass123",
  "type": "customer"
}
```

**Response `200` (Success):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 1, "first_name": "John", "type": "customer" }
  }
}
```

**Response `200` (2FA Required):**
```json
{
  "success": true,
  "data": {
    "2fa_required": true,
    "email": "john@example.com",
    "message": "OTP sent to your email"
  }
}
```

---

### POST `/auth/login/verify`

**Body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

---

### POST `/auth/register/verify`

**Body:**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "pending_data": { ... }
}
```

---

### GET `/auth/profile`
🔒 **Auth:** JWT

Returns the current user's profile.

---

### PUT `/auth/change-password`
🔒 **Auth:** JWT

**Body:**
```json
{ "current_password": "oldpass", "new_password": "newpass123" }
```

---

## 2. Instrument APIs

🔒 **Auth:** JWT (Customer)

### POST `/instrument/wallets`

**Body:**
```json
{ "initial_balance": 5000, "currency": "INR" }
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "id": 1, "wallet_id": "uuid", "balance": 5000, "currency": "INR" }
}
```

> [!NOTE]
> Customers are restricted to **exactly one wallet**. Subsequent creation attempts will return a `VALIDATION` error.

---

### GET `/instrument/wallets`

Returns all wallets for the authenticated customer.

---

### PUT `/instrument/wallets/:id/topup`

**Body:**
```json
{ "amount": 2000 }
```

---

### POST `/instrument/cards`

**Body:**
```json
{
  "card_number": "4111111111111111",
  "cardholder_name": "JOHN DOE",
  "expiry_month": "12",
  "expiry_year": "2028",
  "card_brand": "visa",
  "credit_limit": 100000
}
```

---

### GET `/instrument/cards`

Returns all credit cards (masked).

---

### DELETE `/instrument/cards/:id`

Removes a credit card.

---

### POST `/instrument/bank-accounts`

**Body:**
```json
{
  "account_number": "1234567890",
  "account_holder_name": "John Doe",
  "bank_name": "State Bank of India",
  "ifsc_code": "SBIN0001234",
  "account_type": "savings",
  "balance": 50000
}
```

---

### GET `/instrument/bank-accounts`

Returns all bank accounts (masked).

---

### DELETE `/instrument/bank-accounts/:id`

Removes a bank account.

---

### POST `/instrument/net-banking`

Link a bank account for net banking.

**Body:**
```json
{ "bank_account_id": 1 }
```

---

### GET `/instrument/payment-methods`

Returns all payment methods (unified view across instruments).

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "method_type": "wallet", "instrument_id": 1, "is_default": true, "status": "active" },
    { "id": 2, "method_type": "credit_card", "instrument_id": 1, "is_default": false, "status": "active" }
  ]
}
```

---

### PUT `/instrument/payment-methods/:id/default`

Set a payment method as default.

---

## 3. Simulator APIs

🔒 **Auth:** JWT (Customer)

### POST `/simulator/pay`

Process a simulated payment.

**Body:**
```json
{
  "payment_method_id": 1,
  "amount": 1500.00
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "txn_id": "a1b2c3d4-...",
    "amount": 1500.00,
    "payment_method": "wallet",
    "status": "success"
  }
}
```

**Failure Response `400`:**
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Insufficient wallet balance",
    "details": { "txn_id": "a1b2c3d4-...", "status": "failed" }
  }
}
```

**Payment Rules:**

| Method | Validation |
|---|---|
| Wallet | `balance >= amount` → deduct balance |
| Credit Card | `credit_limit - used_credit >= amount` → increase used_credit |
| Bank Account | `balance >= amount` → deduct balance |
| Net Banking | Linked bank account → same as Bank Account |

---

### GET `/simulator/history?page=1&limit=20`

Paginated transaction history for the customer.

---

### GET `/simulator/instrument`

Returns customer instruments grouped by type.

---

## 4. Platform / Gateway APIs

### POST `/platform/register-app`
🔒 **Auth:** JWT (Merchant)

Register a new merchant application. Auto-generates a secret API key.

**Body:**
```json
{
  "app_name": "My Store",
  "website_url": "https://mystore.com",
  "callback_url": "https://mystore.com/webhooks/payment",
  "environment": "sandbox"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "app_id": 1,
    "app_uuid": "uuid",
    "app_name": "My Store",
    "environment": "sandbox",
    "api_key": "sk_test_a1b2c3...",
    "note": "Store your API key securely — it will not be shown again."
  }
}
```

---

### POST `/platform/api-keys`
🔒 **Auth:** JWT (Merchant)

Generate additional API keys for an app.

**Body:**
```json
{ "merchant_app_id": 1, "key_type": "publishable" }
```

---

### GET `/platform/api-keys`
🔒 **Auth:** JWT (Merchant)

List all API keys for the merchant.

---

### POST `/platform/create-payment-session`
🔒 **Auth:** API Key (`x-api-key`)

Create a new payment session.

**Body:**
```json
{
  "amount": 999.00,
  "currency": "INR",
  "description": "Order #12345",
  "callback_url": "https://mystore.com/webhooks/payment",
  "success_redirect_url": "https://mystore.com/success",
  "failure_redirect_url": "https://mystore.com/failure",
  "metadata": { "order_id": "12345" }
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "checkout_url": "http://localhost:5001/checkout?session=uuid",
    "amount": 999.00,
    "currency": "INR",
    "status": "pending",
    "expires_at": "2026-03-05T10:30:00.000Z"
  }
}
```

---

### GET `/platform/payment/:session_id`
🔒 **Auth:** API Key

Retrieve payment session details + associated transaction.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "amount": 999.00,
    "currency": "INR",
    "description": "Order #12345",
    "status": "completed",
    "merchant": "Acme Inc.",
    "app_name": "My Store",
    "transaction": {
      "txn_id": "uuid",
      "amount": 999.00,
      "status": "success",
      "created_at": "2026-03-05T10:25:00.000Z"
    }
  }
}
```

---

### POST `/platform/process-payment`
🔒 **Auth:** JWT (Customer) or Guest (Email)

Process payment for an existing session. Fires webhook to callback_url.

**Body:**
```json
{
  "session_id": "uuid",
  "payment_method_id": 1,
  "pin": "1234",
  "otp_code": "123456"
}
```

> [!NOTE]
> High-value transactions or demo sessions require `otp_code`. Invalid/expired codes return `PAYMENT_FAILED`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "txn_id": "uuid",
    "amount": 999.00,
    "status": "success",
    "redirect_url": "https://mystore.com/success?session_id=uuid&txn_id=uuid&status=success"
  }
}
```

**Webhook payload sent to `callback_url`:**
```json
{
  "event": "payment.success",
  "session_id": "uuid",
  "txn_id": "uuid",
  "amount": 999.00,
  "currency": "INR",
  "status": "success",
  "timestamp": "2026-03-05T10:25:00.000Z"
}
```

---

### GET `/platform/payment-status?session_id=uuid`
### GET `/platform/payment-status?txn_id=uuid`
🔒 **Auth:** API Key

Check payment status by session ID or transaction ID.

---

### GET `/platform/dashboard`
🔒 **Auth:** JWT (Merchant)

Merchant analytics: stats, recent transactions, recent sessions.

---

## 5. Dashboard APIs

🔒 **Auth:** JWT

### GET `/dashboard/stats`

Returns transaction stats scoped to the user's role:
- **Admin** → platform-wide
- **Merchant** → their transactions
- **Customer** → their transactions

**Response `200`:**
```json
{
  "data": {
    "total_transactions": 150,
    "successful": 120,
    "failed": 30,
    "total_volume": 450000.00
  }
}
```

---

### GET `/dashboard/transactions?page=1&limit=20&status=success&mode=platform`

Paginated transactions (role-scoped).

**Filters:**
- `status`: `success`, `failed`, `pending`
- `mode`: `platform`, `simulator`
- `page`: Page number (default: 1)
- `limit`: Number of items (default: 20)

---

### GET `/dashboard/settlements`

Settlement history (merchant/admin).

---

## 6. Fraud Alert APIs

🔒 **Auth:** JWT (Admin only)

### GET `/dashboard/fraud-alerts/stats`

**Response `200`:**
```json
{
  "data": {
    "by_status": [{ "status": "open", "count": 5 }],
    "open_by_severity": [{ "severity": "critical", "count": 2 }],
    "open_by_type": [{ "alert_type": "amount_spike", "count": 3 }],
    "last_24h": 4
  }
}
```

---

### GET `/dashboard/fraud-alerts?status=open&severity=high&type=amount_spike&page=1&limit=20`

Paginated fraud alerts with optional filters.

**Response `200`:**
```json
{
  "data": {
    "alerts": [
      {
        "id": 1,
        "alert_type": "amount_spike",
        "severity": "high",
        "description": "High-value transaction: ₹75,000.00 exceeds ₹50,000 threshold",
        "status": "open",
        "txn_id": "uuid",
        "amount": 75000.00,
        "first_name": "John",
        "last_name": "Doe",
        "created_at": "2026-03-05T10:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5 }
  }
}
```

---

### GET `/dashboard/fraud-alerts/:id`

Full alert detail with customer's recent transaction history.

---

### PUT `/dashboard/fraud-alerts/:id/resolve`

**Body:**
```json
{ "resolution": "resolved" }
```

Options: `resolved`, `false_positive`, `investigating`

---

### GET `/dashboard/customer-risk/:customerId`

**Response `200`:**
```json
{
  "data": {
    "customer_id": 1,
    "risk_level": "medium",
    "total_alerts": 3,
    "open_alerts": 1,
    "high_severity_alerts": 1
  }
}
```

---

## 7. User APIs (Profile Management)

🔒 **Auth:** JWT

### GET `/users/profile`
Returns extended profile details.

### PATCH `/users/profile`
Update first name, last name, or phone.
**Body:** `{ "first_name": "Jane", "phone": "9999999999" }`

### PATCH `/users/profile/pin`
Securely update payment PIN.
**Body:** `{ "old_pin": "1234", "new_pin": "5678" }`

---

## Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

| Code | Meaning |
|---|---|
| `VALIDATION` | Invalid request body |
| `UNAUTHORIZED` | Missing or invalid auth |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `PAYMENT_FAILED` | Payment processing failed |

---

## Integration Flow

```
1. Merchant registers        → POST /auth/register { type: "merchant" }
2. Register app              → POST /platform/register-app
                                ↳ Returns API key (sk_test_xxx)
3. Create payment session    → POST /platform/create-payment-session
                                ↳ Returns checkout_url + session_id
4. Redirect customer         → checkout_url
5. Customer logs in & pays   → POST /platform/process-payment
                                ↳ 🔔 Webhook fires to callback_url
                                ↳ Returns redirect_url
6. Verify payment            → GET /platform/payment-status?txn_id=xxx
```

---

## 8. Security Business Logic (Fraud Detection)

The system implements core security rules within the `TransactionService` and `FraudService`.

| Rule Type | Logic | Action |
|---|---|---|
| **Amount Spike** | `amount > 50,000` | Generate `fraud_alert` & require High-Value OTP |
| **Velocity Breach** | `> 5 txns in 10 min` | Flag customer as `suspended` & generate alert |
| **Retry Exhaustion** | `3+ failures in 5 min` | Temporarily block payment instrument |

---
© 2026 PaySim Platform. Built for Advanced Fintech Simulation.
