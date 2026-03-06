# Payment Gateway Platform with Integrated Payment Simulator — System Architecture

## 1. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        SIM_UI["Simulator UI<br/>(HTML/CSS/Bootstrap)"]
        PLAT_UI["Platform Dashboard UI<br/>(HTML/CSS/Bootstrap)"]
        EXT_APP["External Applications<br/>(Third-Party Clients)"]
    end

    subgraph "API Gateway Layer"
        ROUTER["Express Router<br/>/api/v1/*"]
        AUTH_MW["Auth Middleware<br/>(API Key / Session)"]
        MODE_MW["Mode Resolver<br/>(Simulator | Platform)"]
    end

    subgraph "Core Services Layer"
        SIM_ENG["Simulator Engine"]
        PAY_SESS["Payment Session Manager"]
        TXN_PROC["Transaction Processor"]
        INSTRUMENT["Instrument Manager<br/>(Wallet, Card, Bank, NetBanking)"]
    end

    subgraph "Payment Instruments"
        WALLET["Wallet Module"]
        CREDIT["Credit Card Module<br/>(credit_limit + used_credit)"]
        BANK["Bank Account Module"]
        NETBANK["Net Banking Module"]
    end

    subgraph "Data Layer"
        SQLITE[("SQLite Database")]
        PRISMA["Prisma ORM"]
    end

    SIM_UI -->|"Simulated Payments"| ROUTER
    PLAT_UI -->|"Dashboard API"| ROUTER
    EXT_APP -->|"REST API + API Key"| ROUTER

    ROUTER --> AUTH_MW --> MODE_MW

    MODE_MW -->|"mode=simulator"| SIM_ENG
    MODE_MW -->|"mode=platform"| PAY_SESS

    SIM_ENG --> TXN_PROC
    PAY_SESS --> TXN_PROC

    TXN_PROC --> INSTRUMENT

    INSTRUMENT --> WALLET
    INSTRUMENT --> CREDIT
    INSTRUMENT --> BANK
    INSTRUMENT --> NETBANK

    WALLET --> PRISMA --> SQLITE
    CREDIT --> PRISMA --> SQLITE
    BANK --> PRISMA --> SQLITE
    NETBANK --> PRISMA --> SQLITE

    PAY_SESS --> PRISMA --> SQLITE
    TXN_PROC --> PRISMA --> SQLITE
    SIM_ENG --> PRISMA --> SQLITE
```

---

## 2. Module Breakdown

### 2.1 Directory Structure

```
project/
├── server.js                    # Entry point
├── package.json
├── .env                         # Environment config
├── config/
│   └── db.js                    # MySQL connection pool
├── middleware/
│   ├── auth.js                  # API key & session auth
│   └── modeResolver.js          # Simulator vs Platform routing
├── routes/
│   ├── simulator.routes.js      # Simulator-mode endpoints
│   ├── platform.routes.js       # Platform-mode endpoints (sessions, checkout)
│   ├── payment.routes.js        # Shared payment processing
│   ├── instrument.routes.js     # Manage wallets, cards, accounts
│   └── dashboard.routes.js      # Dashboard / analytics
├── controllers/
│   ├── simulator.controller.js
│   ├── platform.controller.js
│   ├── payment.controller.js
│   ├── instrument.controller.js
│   └── dashboard.controller.js
├── services/
│   ├── simulator.service.js     # Simulation logic & mock responses
│   ├── session.service.js       # Payment session lifecycle
│   ├── transaction.service.js   # Core transaction orchestration
│   └── instrument.service.js    # Balance, credit limit checks
├── models/
│   ├── User.js
│   ├── Merchant.js
│   ├── Wallet.js
│   ├── CreditCard.js
│   ├── BankAccount.js
│   ├── PaymentSession.js
│   └── Transaction.js
├── db/
│   └── schema.sql               # DDL for all tables
├── public/                      # Frontend (HTML/CSS/Bootstrap)
│   ├── index.html               # Landing page
│   ├── simulator/
│   │   ├── index.html           # Simulator dashboard
│   │   ├── pay.html             # Make a payment
│   │   └── history.html         # Transaction history
│   ├── platform/
│   │   ├── dashboard.html       # Merchant dashboard
│   │   ├── sessions.html        # View payment sessions
│   │   └── integrate.html       # API keys & docs
│   ├── checkout/
│   │   └── index.html           # Hosted checkout page
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── simulator.js
│       ├── platform.js
│       └── checkout.js
└── utils/
    ├── idGenerator.js           # UUID / txn-ID generation
    ├── validators.js            # Input validation
    └── responseHelper.js        # Standardised API responses
```

### 2.2 Module Summary Table

| Module | Purpose |
|---|---|
| **Config** | Prisma client singleton, environment variables |
| **Middleware** | JWT Authentication, API key validation, 2FA/OTP enforcement |
| **Routes** | Express route definitions grouped by domain |
| **Controllers** | Request handling and data transformation |
| **Services** | CORE business logic (Transactions, Sessions, Email, Fraud, Risk) |
| **Prisma** | Database modelling and automated SQL generation for SQLite |
| **Public** | Modern HTML/CSS/JS frontend with Bootstrap 5 |
| **Utils** | Shared helper functions (validations, responses, logging) |

---

## 3. Payment Workflow

### 3.1 Simulator Mode Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Simulator UI
    participant API as Express API
    participant SimEng as Simulator Engine
    participant InstrMgr as Instrument Manager
    participant DB as MySQL

    User->>UI: Select instrument & enter amount
    UI->>API: POST /api/v1/simulator/pay
    API->>SimEng: processSimulatedPayment(payload)
    SimEng->>InstrMgr: validateInstrument(type, id)
    InstrMgr->>DB: SELECT balance / credit_limit
    DB-->>InstrMgr: instrument record
    InstrMgr-->>SimEng: validation result

    alt Sufficient Funds
        SimEng->>InstrMgr: deductFunds(type, id, amount)
        InstrMgr->>DB: UPDATE balance / used_credit
        SimEng->>DB: INSERT transaction (status=SUCCESS)
        SimEng-->>API: { status: "success", txnId }
        API-->>UI: 200 OK — Payment Successful
    else Insufficient Funds
        SimEng->>DB: INSERT transaction (status=FAILED)
        SimEng-->>API: { status: "failed", reason }
        API-->>UI: 400 — Payment Failed
    end

    UI-->>User: Display result
```

**Instrument-Specific Rules:**

| Instrument | Validation Rule |
|---|---|
| **Wallet** | `balance >= amount` → deduct from `balance` |
| **Credit Card** | `(credit_limit - used_credit) >= amount` → increase `used_credit` |
| **Bank Account** | `balance >= amount` → deduct from `balance` |
| **Net Banking** | Linked bank account check → same rules as Bank Account |

### 3.2 Platform Mode Flow (with OTP Security)

```mermaid
sequenceDiagram
    actor ExtApp as External App
    participant API as Express API
    participant SessMgr as Session Manager
    participant DB as SQLite
    actor Customer
    participant Checkout as Hosted Checkout Page
    participant TxnProc as Transaction Processor
    participant Brevo as Email Service (Brevo)

    ExtApp->>API: POST /api/v1/platform/create-payment-session
    API->>SessMgr: createSession()
    SessMgr->>DB: INSERT payment_session (status=PENDING)
    SessMgr-->>API: { session_id, checkout_url }
    API-->>ExtApp: 201 — Session Created

    ExtApp->>Customer: Redirect to checkout_url
    Customer->>Checkout: Opens hosted checkout
    
    Customer->>Checkout: Select instrument & confirm
    Checkout->>API: POST /api/v1/platform/process-payment
    
    API->>TxnProc: executePaymentTransaction()
    
    Note over TxnProc: 1. Security Check (High-Value?)
    TxnProc->>DB: INSERT verification_code (OTP)
    TxnProc->>Brevo: sendOTP(email, code)
    TxnProc-->>API: 200 { requires_otp: true }
    API-->>Checkout: Prompt for OTP
    
    Customer->>Checkout: Enter OTP
    Checkout->>API: POST /api/v1/platform/process-payment (with otp_code)
    
    API->>TxnProc: executePaymentTransaction(with otp_code)
    Note over TxnProc: 2. Atomic Balance Step
    TxnProc->>DB: BEGIN TRANSACTION
    TxnProc->>DB: UPDATE Instrument Balance
    TxnProc->>DB: INSERT Transaction (status=SUCCESS)
    TxnProc->>DB: UPDATE payment_session (status=COMPLETED)
    TxnProc->>DB: COMMIT
    
    TxnProc-->>API: { status: "success", txnId }
    API-->>Checkout: Successful result
    Checkout-->>Customer: Payment complete
```

---

## 4. Component Responsibilities

### 4.1 Backend Components

| Component | Responsibilities |
|---|---|
| **server.js** | Bootstrap Express, register middleware, mount routes, start listening |
| **Prisma** | Type-safe database access for SQLite; handles migrations and seeding |
| **Auth Middleware** | JWT & API Key validation; user session management |
| **Email Service** (`services/email.service.js`) | Handles all transactional emails (Registration, 2FA, Payment OTP) via Brevo |
| **Transaction Processor** (`services/transaction.service.js`) | **Smart Routing**: Retries failed attempts; **Security**: Enforces OTP for high-value transctions |
| **Session Manager** (`services/session.service.js`) | Orchestrates the payment checkout lifecycle |
| **Fraud Service** (`services/fraud.service.js`) | Real-time velocity and amount spike detection |

### 4.2 Frontend Components

| Page | Responsibilities |
|---|---|
| **Simulator Dashboard** | List user instruments, initiate payments, view history |
| **Platform Dashboard** | Merchant view: API keys, session list, analytics |
| **Hosted Checkout** | Customer-facing payment form generated per session; selects instrument and confirms payment |

### 4.3 Database Schema (ER Diagram)

```mermaid
erDiagram
    users {
        INT id PK
        VARCHAR name
        VARCHAR email
        VARCHAR password_hash
        ENUM role "customer | merchant"
        TIMESTAMP created_at
    }
    merchants {
        INT id PK
        INT user_id FK
        VARCHAR business_name
        VARCHAR api_key
        VARCHAR callback_url
        TIMESTAMP created_at
    }
    wallets {
        INT id PK
        INT user_id FK
        DECIMAL balance
        TIMESTAMP updated_at
    }
    credit_cards {
        INT id PK
        INT user_id FK
        VARCHAR card_number
        DECIMAL credit_limit
        DECIMAL used_credit
        TIMESTAMP updated_at
    }
    bank_accounts {
        INT id PK
        INT user_id FK
        VARCHAR account_number
        VARCHAR ifsc_code
        DECIMAL balance
        TIMESTAMP updated_at
    }
    payment_sessions {
        INT id PK
        VARCHAR session_id
        INT merchant_id FK
        DECIMAL amount
        VARCHAR currency
        ENUM status "PENDING | COMPLETED | EXPIRED | FAILED"
        VARCHAR callback_url
        TIMESTAMP expires_at
        TIMESTAMP created_at
    }
    transactions {
        INT id PK
        VARCHAR txn_id
        INT user_id FK
        INT session_id FK "nullable"
        ENUM instrument_type "wallet | credit_card | bank_account | net_banking"
        INT instrument_id
        DECIMAL amount
        ENUM status "SUCCESS | FAILED | REFUNDED"
        ENUM mode "simulator | platform"
        VARCHAR failure_reason "nullable"
        TIMESTAMP created_at
    }

    users ||--o{ wallets : owns
    users ||--o{ credit_cards : owns
    users ||--o{ bank_accounts : owns
    users ||--o| merchants : "registers as"
    merchants ||--o{ payment_sessions : creates
    users ||--o{ transactions : initiates
    payment_sessions ||--o| transactions : "results in"
```

---

## 5. Simulator ↔ Platform Mode Interaction

### 5.1 Shared vs. Separate Concerns

```mermaid
graph LR
    subgraph "Simulator-Only"
        S1["Simulator UI"]
        S2["Simulator Routes"]
        S3["Simulator Engine<br/>(mock delays, random failures)"]
    end

    subgraph "Shared Core"
        C1["Transaction Processor"]
        C2["Instrument Manager"]
        C3["MySQL Database"]
    end

    subgraph "Platform-Only"
        P1["Platform Dashboard"]
        P2["Platform Routes"]
        P3["Session Manager"]
        P4["Hosted Checkout"]
        P5["API Key Auth"]
    end

    S3 --> C1
    P3 --> C1
    C1 --> C2
    C2 --> C3
    C1 --> C3

    style C1 fill:#2d6a4f,color:#fff
    style C2 fill:#2d6a4f,color:#fff
    style C3 fill:#2d6a4f,color:#fff
```

### 5.2 Mode Comparison Matrix

| Aspect | Simulator Mode | Platform Mode | Shared? |
|---|---|---|---|
| **Entry Point** | Simulator UI → `/api/v1/simulator/*` | External App → `/api/v1/platform/*` | ✗ |
| **Authentication** | Session/cookie-based user login | API key header (`x-api-key`) | ✗ |
| **Payment Initiation** | User picks instrument + amount directly | Merchant creates session → customer uses checkout | ✗ |
| **Transaction Processing** | `transaction.service.js` | `transaction.service.js` | ✓ |
| **Instrument Validation** | `instrument.service.js` | `instrument.service.js` | ✓ |
| **Fund Deduction** | `instrument.service.js` | `instrument.service.js` | ✓ |
| **Transaction Table** | Same `transactions` table (`mode = 'simulator'`) | Same `transactions` table (`mode = 'platform'`) | ✓ |
| **Sessions** | Not used | Required (payment_sessions table) | ✗ |
| **Result Delivery** | Direct JSON response to UI | Callback redirect to external app | ✗ |

### 5.3 Mode Determination Logic

```
Request arrives at Express Router
    │
    ├── /api/v1/simulator/*  →  mode = "simulator"
    │       Auth: session cookie
    │       Flow: Direct instrument → pay
    │
    └── /api/v1/platform/*   →  mode = "platform"
            Auth: API key
            Flow: Session → Checkout → Pay → Callback
```

Both modes converge at the **Transaction Processor**, which:
1. Validates the payment instrument
2. Checks sufficient balance / credit
3. Executes the debit atomically (MySQL transaction)
4. Records the result in the `transactions` table with `mode` flag

> **Note:** The `mode` column in the `transactions` table is critical — it allows unified analytics and reporting while keeping the audit trail clear for each mode.

---

## 6. Key API Endpoints

| Method | Endpoint | Mode | Description |
|---|---|---|---|
| `POST` | `/api/v1/simulator/pay` | Simulator | Process a simulated payment |
| `GET` | `/api/v1/simulator/history` | Simulator | List transaction history |
| `GET` | `/api/v1/simulator/instruments` | Simulator | List user's instruments |
| `POST` | `/api/v1/platform/sessions` | Platform | Create a payment session |
| `GET` | `/api/v1/platform/sessions/:id` | Platform | Get session details |
| `POST` | `/api/v1/platform/sessions/:id/pay` | Platform | Process payment on a session |
| `GET` | `/api/v1/platform/dashboard` | Platform | Merchant analytics |
| `POST` | `/api/v1/auth/register` | Both | Register user/merchant |
| `POST` | `/api/v1/auth/login` | Both | Login |
| `POST` | `/api/v1/instruments/wallet` | Both | Create/top-up wallet |
| `POST` | `/api/v1/instruments/card` | Both | Add credit card |
| `POST` | `/api/v1/instruments/bank` | Both | Add bank account |
