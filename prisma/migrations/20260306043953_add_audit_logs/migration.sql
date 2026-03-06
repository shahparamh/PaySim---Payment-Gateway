-- CreateTable
CREATE TABLE "admins" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "merchant_app_id" INTEGER NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" DATETIME,
    "last_used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_keys_merchant_app_id_fkey" FOREIGN KEY ("merchant_app_id") REFERENCES "merchant_apps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "merchant_app_id" INTEGER,
    "request_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "ip_address" TEXT NOT NULL,
    "request_body" TEXT,
    "response_body" TEXT,
    "response_time_ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_logs_merchant_app_id_fkey" FOREIGN KEY ("merchant_app_id") REFERENCES "merchant_apps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "account_number_hash" TEXT NOT NULL,
    "account_last_four" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "ifsc_code" TEXT,
    "account_holder_name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL DEFAULT 'savings',
    "balance" REAL NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bank_accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "card_number_hash" TEXT NOT NULL,
    "card_last_four" TEXT NOT NULL,
    "card_brand" TEXT NOT NULL,
    "cardholder_name" TEXT NOT NULL,
    "expiry_month" TEXT NOT NULL,
    "expiry_year" TEXT NOT NULL,
    "credit_limit" REAL NOT NULL DEFAULT 0.00,
    "used_credit" REAL NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "pin_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transaction_id" INTEGER,
    "customer_id" INTEGER,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolved_by" INTEGER,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fraud_alerts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fraud_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "admins" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fraud_alerts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "merchant_apps" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "merchant_id" INTEGER NOT NULL,
    "app_name" TEXT NOT NULL,
    "app_uuid" TEXT NOT NULL,
    "website_url" TEXT,
    "callback_url" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "merchant_apps_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "business_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "method_type" TEXT NOT NULL,
    "instrument_id" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_methods_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "merchant_app_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "callback_url" TEXT NOT NULL,
    "metadata" TEXT,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_sessions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_sessions_merchant_app_id_fkey" FOREIGN KEY ("merchant_app_id") REFERENCES "merchant_apps" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "refund_id" TEXT NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "reason" TEXT,
    "initiated_by" INTEGER NOT NULL,
    "initiated_by_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refunds_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "settlement_id" TEXT NOT NULL,
    "merchant_id" INTEGER NOT NULL,
    "total_amount" REAL NOT NULL,
    "fee_amount" REAL NOT NULL DEFAULT 0.00,
    "net_amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "settlement_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "settlements_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "txn_id" TEXT NOT NULL,
    "session_id" INTEGER,
    "customer_id" INTEGER NOT NULL,
    "merchant_id" INTEGER,
    "receiver_id" INTEGER,
    "receiver_type" TEXT,
    "payment_method_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "txn_type" TEXT NOT NULL DEFAULT 'payment',
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "verified_at" DATETIME,
    "mode" TEXT NOT NULL,
    "failure_reason" TEXT,
    "gateway_ref" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "payment_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_splits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transaction_id" INTEGER NOT NULL,
    "merchant_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_splits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_splits_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "escrow_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "merchant_id" INTEGER,
    "customer_id" INTEGER,
    "balance" REAL NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "escrow_accounts_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "escrow_accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "escrow_account_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'held',
    "release_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "escrow_transactions_escrow_account_id_fkey" FOREIGN KEY ("escrow_account_id") REFERENCES "escrow_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "escrow_transactions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscription_id" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "merchant_id" INTEGER NOT NULL,
    "plan_name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billing_interval" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "next_billing_date" DATETIME NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscription_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "billing_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscription_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER,
    "transaction_id" INTEGER,
    "customer_id" INTEGER NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "attempt_sequence" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "payment_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_attempts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_attempts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_attempts_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risk_scores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "risk_level" TEXT NOT NULL DEFAULT 'low',
    "factors" TEXT,
    "last_evaluated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_scores_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_admins_uuid" ON "admins"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_admins_email" ON "admins"("email");

-- CreateIndex
CREATE INDEX "idx_admins_role" ON "admins"("role");

-- CreateIndex
CREATE INDEX "idx_ak_active" ON "api_keys"("is_active");

-- CreateIndex
CREATE INDEX "idx_ak_merchant_app" ON "api_keys"("merchant_app_id");

-- CreateIndex
CREATE INDEX "idx_ak_prefix" ON "api_keys"("key_prefix");

-- CreateIndex
CREATE UNIQUE INDEX "uq_al_request_id" ON "api_logs"("request_id");

-- CreateIndex
CREATE INDEX "idx_al_created" ON "api_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_al_endpoint" ON "api_logs"("endpoint");

-- CreateIndex
CREATE INDEX "idx_al_ip" ON "api_logs"("ip_address");

-- CreateIndex
CREATE INDEX "idx_al_merchant_app" ON "api_logs"("merchant_app_id");

-- CreateIndex
CREATE INDEX "idx_al_status_code" ON "api_logs"("status_code");

-- CreateIndex
CREATE INDEX "idx_ba_customer" ON "bank_accounts"("customer_id");

-- CreateIndex
CREATE INDEX "idx_ba_ifsc" ON "bank_accounts"("ifsc_code");

-- CreateIndex
CREATE INDEX "idx_ba_status" ON "bank_accounts"("status");

-- CreateIndex
CREATE INDEX "idx_cc_customer" ON "credit_cards"("customer_id");

-- CreateIndex
CREATE INDEX "idx_cc_last_four" ON "credit_cards"("card_last_four");

-- CreateIndex
CREATE INDEX "idx_cc_status" ON "credit_cards"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_customers_uuid" ON "customers"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_customers_email" ON "customers"("email");

-- CreateIndex
CREATE INDEX "idx_customers_phone" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "idx_customers_status" ON "customers"("status");

-- CreateIndex
CREATE INDEX "fraud_alerts_resolved_by_idx" ON "fraud_alerts"("resolved_by");

-- CreateIndex
CREATE INDEX "idx_fa_customer" ON "fraud_alerts"("customer_id");

-- CreateIndex
CREATE INDEX "idx_fa_severity" ON "fraud_alerts"("severity");

-- CreateIndex
CREATE INDEX "idx_fa_status" ON "fraud_alerts"("status");

-- CreateIndex
CREATE INDEX "idx_fa_transaction" ON "fraud_alerts"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_fa_type" ON "fraud_alerts"("alert_type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ma_app_uuid" ON "merchant_apps"("app_uuid");

-- CreateIndex
CREATE INDEX "idx_ma_environment" ON "merchant_apps"("environment");

-- CreateIndex
CREATE INDEX "idx_ma_merchant" ON "merchant_apps"("merchant_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_merchants_uuid" ON "merchants"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_merchants_business_email" ON "merchants"("business_email");

-- CreateIndex
CREATE INDEX "idx_merchants_status" ON "merchants"("status");

-- CreateIndex
CREATE INDEX "idx_pm_customer" ON "payment_methods"("customer_id");

-- CreateIndex
CREATE INDEX "idx_pm_status" ON "payment_methods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pm_type_instrument" ON "payment_methods"("method_type", "instrument_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ps_session_id" ON "payment_sessions"("session_id");

-- CreateIndex
CREATE INDEX "idx_ps_customer" ON "payment_sessions"("customer_id");

-- CreateIndex
CREATE INDEX "idx_ps_expires" ON "payment_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_ps_merchant_app" ON "payment_sessions"("merchant_app_id");

-- CreateIndex
CREATE INDEX "idx_ps_status" ON "payment_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_refunds_refund_id" ON "refunds"("refund_id");

-- CreateIndex
CREATE INDEX "idx_refunds_initiator" ON "refunds"("initiated_by_type", "initiated_by");

-- CreateIndex
CREATE INDEX "idx_refunds_status" ON "refunds"("status");

-- CreateIndex
CREATE INDEX "idx_refunds_txn" ON "refunds"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_settlements_id" ON "settlements"("settlement_id");

-- CreateIndex
CREATE INDEX "idx_settlements_date" ON "settlements"("settlement_date");

-- CreateIndex
CREATE INDEX "idx_settlements_merchant" ON "settlements"("merchant_id");

-- CreateIndex
CREATE INDEX "idx_settlements_status" ON "settlements"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_txn_txn_id" ON "transactions"("txn_id");

-- CreateIndex
CREATE INDEX "idx_txn_created" ON "transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_txn_customer" ON "transactions"("customer_id");

-- CreateIndex
CREATE INDEX "idx_txn_merchant" ON "transactions"("merchant_id");

-- CreateIndex
CREATE INDEX "idx_txn_mode" ON "transactions"("mode");

-- CreateIndex
CREATE INDEX "idx_txn_pm" ON "transactions"("payment_method_id");

-- CreateIndex
CREATE INDEX "idx_txn_session" ON "transactions"("session_id");

-- CreateIndex
CREATE INDEX "idx_txn_status" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "idx_txn_type_status" ON "transactions"("txn_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_wallets_wallet_id" ON "wallets"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_wallets_customer" ON "wallets"("customer_id");

-- CreateIndex
CREATE INDEX "idx_wallets_status" ON "wallets"("status");

-- CreateIndex
CREATE INDEX "idx_split_txn" ON "payment_splits"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_split_merchant" ON "payment_splits"("merchant_id");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_accounts_merchant_id_key" ON "escrow_accounts"("merchant_id");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_accounts_customer_id_key" ON "escrow_accounts"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_transaction_id_key" ON "escrow_transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_escrow_txn_account" ON "escrow_transactions"("escrow_account_id");

-- CreateIndex
CREATE INDEX "idx_escrow_txn_status" ON "escrow_transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscription_id_key" ON "subscriptions"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_sub_customer" ON "subscriptions"("customer_id");

-- CreateIndex
CREATE INDEX "idx_sub_merchant" ON "subscriptions"("merchant_id");

-- CreateIndex
CREATE INDEX "idx_sub_billing" ON "subscriptions"("next_billing_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_transaction_id_key" ON "subscription_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_sub_pay_sub" ON "subscription_payments"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_attempt_session" ON "payment_attempts"("session_id");

-- CreateIndex
CREATE INDEX "idx_attempt_customer" ON "payment_attempts"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "risk_scores_customer_id_key" ON "risk_scores"("customer_id");

-- CreateIndex
CREATE INDEX "verification_codes_email_code_idx" ON "verification_codes"("email", "code");
