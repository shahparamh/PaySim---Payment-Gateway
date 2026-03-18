const { EntitySchema } = require('typeorm');

exports.admins = new EntitySchema({
    "name": "admins",
    "tableName": "admins",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "uuid": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "name": {
            "type": "varchar",
            "nullable": false
        },
        "email": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "password_hash": {
            "type": "varchar",
            "nullable": false
        },
        "role": {
            "type": "varchar",
            "nullable": false,
            "default": "admin"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "fraud_alerts": {
            "target": "fraud_alerts",
            "type": "one-to-many",
            "inverseSide": "admins"
        }
    }
});

exports.api_keys = new EntitySchema({
    "name": "api_keys",
    "tableName": "api_keys",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "merchant_app_id": {
            "type": "int",
            "nullable": false
        },
        "key_prefix": {
            "type": "varchar",
            "nullable": false
        },
        "key_hash": {
            "type": "varchar",
            "nullable": false
        },
        "key_type": {
            "type": "varchar",
            "nullable": false
        },
        "is_active": {
            "type": "int",
            "nullable": false,
            "default": 1
        },
        "expires_at": {
            "type": "timestamp",
            "nullable": true
        },
        "last_used_at": {
            "type": "timestamp",
            "nullable": true
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "merchant_apps": {
            "target": "merchant_apps",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_app_id"
            }
        }
    }
});

exports.api_logs = new EntitySchema({
    "name": "api_logs",
    "tableName": "api_logs",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "merchant_app_id": {
            "type": "int",
            "nullable": true
        },
        "request_id": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "method": {
            "type": "varchar",
            "nullable": false
        },
        "endpoint": {
            "type": "varchar",
            "nullable": false
        },
        "status_code": {
            "type": "int",
            "nullable": false
        },
        "ip_address": {
            "type": "varchar",
            "nullable": false
        },
        "request_body": {
            "type": "clob",
            "nullable": true
        },
        "response_body": {
            "type": "clob",
            "nullable": true
        },

        "response_time_ms": {
            "type": "int",
            "nullable": false,
            "default": 0
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "merchant_apps": {
            "target": "merchant_apps",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_app_id"
            }
        }
    }
});

exports.bank_accounts = new EntitySchema({
    "name": "bank_accounts",
    "tableName": "bank_accounts",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "customer_id": {
            "type": "int",
            "nullable": true
        },
        "merchant_id": {
            "type": "int",
            "nullable": true
        },
        "account_number_hash": {
            "type": "varchar",
            "nullable": false
        },
        "account_last_four": {
            "type": "varchar",
            "nullable": false
        },
        "bank_name": {
            "type": "varchar",
            "nullable": false
        },
        "ifsc_code": {
            "type": "varchar",
            "nullable": true
        },
        "account_holder_name": {
            "type": "varchar",
            "nullable": false
        },
        "account_type": {
            "type": "varchar",
            "nullable": false,
            "default": "savings"
        },
        "balance": {
            "type": "decimal",
            "nullable": false,
            "default": 0
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        }
        ,
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        }
    }
});

exports.credit_cards = new EntitySchema({
    "name": "credit_cards",
    "tableName": "credit_cards",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "customer_id": {
            "type": "int",
            "nullable": false
        },
        "card_number_hash": {
            "type": "varchar",
            "nullable": false
        },
        "card_number_encrypted": {
            "type": "varchar",
            "nullable": true
        },
        "card_last_four": {
            "type": "varchar",
            "nullable": false
        },
        "card_brand": {
            "type": "varchar",
            "nullable": false
        },
        "cardholder_name": {
            "type": "varchar",
            "nullable": false
        },
        "expiry_month": {
            "type": "varchar",
            "nullable": false
        },
        "expiry_year": {
            "type": "varchar",
            "nullable": false
        },
        "credit_limit": {
            "type": "decimal",
            "nullable": false,
            "default": 0
        },
        "used_credit": {
            "type": "decimal",
            "nullable": false,
            "default": 0
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        }
    }
});

exports.customers = new EntitySchema({
    "name": "customers",
    "tableName": "customers",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "uuid": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "first_name": {
            "type": "varchar",
            "nullable": false
        },
        "last_name": {
            "type": "varchar",
            "nullable": false
        },
        "email": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "phone": {
            "type": "varchar",
            "nullable": true
        },
        "password_hash": {
            "type": "varchar",
            "nullable": false
        },
        "pin_hash": {
            "type": "varchar",
            "nullable": true
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "bank_accounts": {
            "target": "bank_accounts",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "credit_cards": {
            "target": "credit_cards",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "fraud_alerts": {
            "target": "fraud_alerts",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "payment_methods": {
            "target": "payment_methods",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "payment_sessions": {
            "target": "payment_sessions",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "transactions": {
            "target": "transactions",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "wallets": {
            "target": "wallets",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "subscriptions": {
            "target": "subscriptions",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "paymentAttempts": {
            "target": "payment_attempts",
            "type": "one-to-many",
            "inverseSide": "customers"
        },
        "auditLogs": {
            "target": "audit_logs",
            "type": "one-to-many",
            "inverseSide": "customers"
        }
    }
});

exports.fraud_alerts = new EntitySchema({
    "name": "fraud_alerts",
    "tableName": "fraud_alerts",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "transaction_id": {
            "type": "int",
            "nullable": true
        },
        "customer_id": {
            "type": "int",
            "nullable": true
        },
        "alert_type": {
            "type": "varchar",
            "nullable": false
        },
        "severity": {
            "type": "varchar",
            "nullable": false,
            "default": "medium"
        },
        "description": {
            "type": "varchar",
            "nullable": false
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "open"
        },
        "resolved_by": {
            "type": "int",
            "nullable": true
        },
        "resolved_at": {
            "type": "timestamp",
            "nullable": true
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        },
        "admins": {
            "target": "admins",
            "type": "many-to-one",
            "joinColumn": {
                "name": "resolved_by"
            }
        },
        "transactions": {
            "target": "transactions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "transaction_id"
            }
        }
    }
});

exports.merchant_apps = new EntitySchema({
    "name": "merchant_apps",
    "tableName": "merchant_apps",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "merchant_id": {
            "type": "int",
            "nullable": false
        },
        "app_name": {
            "type": "varchar",
            "nullable": false
        },
        "app_uuid": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "website_url": {
            "type": "varchar",
            "nullable": true
        },
        "callback_url": {
            "type": "varchar",
            "nullable": false
        },
        "environment": {
            "type": "varchar",
            "nullable": false,
            "default": "sandbox"
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "api_keys": {
            "target": "api_keys",
            "type": "one-to-many",
            "inverseSide": "merchant_apps"
        },
        "api_logs": {
            "target": "api_logs",
            "type": "one-to-many",
            "inverseSide": "merchant_apps"
        },
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        },
        "payment_sessions": {
            "target": "payment_sessions",
            "type": "one-to-many",
            "inverseSide": "merchant_apps"
        }
    }
});

exports.merchants = new EntitySchema({
    "name": "merchants",
    "tableName": "merchants",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "uuid": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "business_name": {
            "type": "varchar",
            "nullable": false
        },
        "business_email": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "phone": {
            "type": "varchar",
            "nullable": true
        },
        "password_hash": {
            "type": "varchar",
            "nullable": false
        },
        "business_type": {
            "type": "varchar",
            "nullable": true
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "merchant_apps": {
            "target": "merchant_apps",
            "type": "one-to-many",
            "inverseSide": "merchants"
        },
        "settlements": {
            "target": "settlements",
            "type": "one-to-many",
            "inverseSide": "merchants"
        },
        "transactions": {
            "target": "transactions",
            "type": "one-to-many",
            "inverseSide": "merchants"
        },
        "paymentSplits": {
            "target": "payment_splits",
            "type": "one-to-many",
            "inverseSide": "merchants"
        },
        "subscriptions": {
            "target": "subscriptions",
            "type": "one-to-many",
            "inverseSide": "merchants"
        }
    }
});

exports.payment_methods = new EntitySchema({
    "name": "payment_methods",
    "tableName": "payment_methods",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "customer_id": {
            "type": "int",
            "nullable": true
        },
        "merchant_id": {
            "type": "int",
            "nullable": true
        },
        "method_type": {
            "type": "varchar",
            "nullable": false
        },
        "instrument_id": {
            "type": "int",
            "nullable": false
        },
        "is_default": {
            "type": "int",
            "nullable": false,
            "default": 0
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "indices": [
        { "name": "IDX_PM_CUSTOMER", "columns": ["customer_id"] }
    ],
    "relations": {
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        },
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        },
        "transactions": {
            "target": "transactions",
            "type": "one-to-many",
            "inverseSide": "payment_methods"
        },
        "subscriptions": {
            "target": "subscriptions",
            "type": "one-to-many",
            "inverseSide": "payment_methods"
        },
        "paymentAttempts": {
            "target": "payment_attempts",
            "type": "one-to-many",
            "inverseSide": "payment_methods"
        }
    }
});

exports.payment_sessions = new EntitySchema({
    "name": "payment_sessions",
    "tableName": "payment_sessions",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "session_id": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "merchant_app_id": {
            "type": "int",
            "nullable": true
        },
        "merchant_id": {
            "type": "int",
            "nullable": true
        },
        "customer_id": {
            "type": "int",
            "nullable": true
        },
        "amount": {
            "type": "decimal",
            "nullable": false
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "description": {
            "type": "varchar",
            "nullable": true
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "pending"
        },
        "callback_url": {
            "type": "varchar",
            "nullable": true
        },
        "metadata": {
            "type": "varchar",
            "nullable": true
        },
        "expires_at": {
            "type": "timestamp",
            "nullable": false
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        },
        "merchant_apps": {
            "target": "merchant_apps",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_app_id"
            }
        },
        "transactions": {
            "target": "transactions",
            "type": "one-to-many",
            "inverseSide": "payment_sessions"
        },
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        },
        "paymentAttempts": {
            "target": "payment_attempts",
            "type": "one-to-many",
            "inverseSide": "payment_sessions"
        }
    }
});

exports.refunds = new EntitySchema({
    "name": "refunds",
    "tableName": "refunds",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "refund_id": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "transaction_id": {
            "type": "int",
            "nullable": false
        },
        "amount": {
            "type": "decimal",
            "nullable": false
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "initiated"
        },
        "reason": {
            "type": "varchar",
            "nullable": true
        },
        "initiated_by": {
            "type": "int",
            "nullable": false
        },
        "initiated_by_type": {
            "type": "varchar",
            "nullable": false
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "transactions": {
            "target": "transactions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "transaction_id"
            }
        }
    }
});

exports.settlements = new EntitySchema({
    "name": "settlements",
    "tableName": "settlements",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "settlement_id": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "merchant_id": {
            "type": "int",
            "nullable": false
        },
        "bank_account_id": {
            "type": "int",
            "nullable": true
        },
        "total_amount": {
            "type": "decimal",
            "nullable": false
        },
        "fee_amount": {
            "type": "decimal",
            "nullable": false,
            "default": 0
        },
        "net_amount": {
            "type": "decimal",
            "nullable": false
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "pending"
        },
        "settlement_date": {
            "type": "timestamp",
            "nullable": false
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        },
        "bank_accounts": {
            "target": "bank_accounts",
            "type": "many-to-one",
            "joinColumn": {
                "name": "bank_account_id"
            }
        }
    }
});

exports.transactions = new EntitySchema({
    "name": "transactions",
    "tableName": "transactions",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "txn_id": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "session_id": {
            "type": "int",
            "nullable": true
        },
        "customer_id": {
            "type": "int",
            "nullable": false
        },
        "merchant_id": {
            "type": "int",
            "nullable": true
        },
        "receiver_id": {
            "type": "int",
            "nullable": true
        },
        "receiver_type": {
            "type": "varchar",
            "nullable": true
        },
        "payment_method_id": {
            "type": "int",
            "nullable": false
        },
        "amount": {
            "type": "decimal",
            "nullable": false
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "txn_type": {
            "type": "varchar",
            "nullable": false,
            "default": "payment"
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "initiated"
        },
        "verified_at": {
            "type": "timestamp",
            "nullable": true
        },
        "mode": {
            "type": "varchar",
            "nullable": false
        },
        "failure_reason": {
            "type": "varchar",
            "nullable": true
        },
        "gateway_ref": {
            "type": "varchar",
            "nullable": true
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "fraud_alerts": {
            "target": "fraud_alerts",
            "type": "one-to-many",
            "inverseSide": "transactions"
        },
        "refunds": {
            "target": "refunds",
            "type": "one-to-many",
            "inverseSide": "transactions"
        },
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        },
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        },
        "payment_methods": {
            "target": "payment_methods",
            "type": "many-to-one",
            "joinColumn": {
                "name": "payment_method_id"
            }
        },
        "payment_sessions": {
            "target": "payment_sessions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "session_id"
            }
        },
        "paymentSplits": {
            "target": "payment_splits",
            "type": "one-to-many",
            "inverseSide": "transactions"
        },
        "paymentAttempts": {
            "target": "payment_attempts",
            "type": "one-to-many",
            "inverseSide": "transactions"
        }
    }
});

exports.wallets = new EntitySchema({
    "name": "wallets",
    "tableName": "wallets",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "customer_id": {
            "type": "int",
            "nullable": false
        },
        "wallet_id": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "balance": {
            "type": "decimal",
            "nullable": false,
            "default": 0
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        }
    }
});

exports.payment_splits = new EntitySchema({
    "name": "payment_splits",
    "tableName": "payment_splits",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "transaction_id": {
            "type": "int",
            "nullable": false
        },
        "merchant_id": {
            "type": "int",
            "nullable": false
        },
        "amount": {
            "type": "decimal",
            "nullable": false
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "transactions": {
            "target": "transactions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "transaction_id"
            }
        },
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        }
    }
});

exports.escrow_accounts = new EntitySchema({
    "name": "escrow_accounts",
    "tableName": "escrow_accounts",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "merchant_id": {
            "type": "int",
            "nullable": true,
            "unique": true
        },
        "customer_id": {
            "type": "int",
            "nullable": true,
            "unique": true
        },
        "balance": {
            "type": "decimal",
            "nullable": false,
            "default": 0
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        },
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        },
        "escrow_transactions": {
            "target": "escrow_transactions",
            "type": "one-to-many",
            "inverseSide": "escrow_accounts"
        }
    }
});

exports.escrow_transactions = new EntitySchema({
    "name": "escrow_transactions",
    "tableName": "escrow_transactions",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "escrow_account_id": {
            "type": "int",
            "nullable": false
        },
        "transaction_id": {
            "type": "int",
            "nullable": false,
            "unique": true
        },
        "amount": {
            "type": "decimal",
            "nullable": false
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "held"
        },
        "release_date": {
            "type": "timestamp",
            "nullable": true
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "escrow_account": {
            "target": "escrow_accounts",
            "type": "many-to-one",
            "joinColumn": {
                "name": "escrow_account_id"
            }
        },
        "transactions": {
            "target": "transactions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "transaction_id"
            }
        }
    }
});

exports.subscription_plans = new EntitySchema({
    "name": "subscription_plans",
    "tableName": "subscription_plans",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "merchant_id": {
            "type": "int",
            "nullable": false
        },
        "name": {
            "type": "varchar",
            "nullable": false
        },
        "description": {
            "type": "varchar",
            "nullable": true
        },
        "amount": {
            "type": "decimal",
            "nullable": false
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "billing_interval": {
            "type": "varchar",
            "nullable": false // monthly, yearly, etc.
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        },
        "subscriptions": {
            "target": "subscriptions",
            "type": "one-to-many",
            "inverseSide": "subscription_plans"
        }
    }
});

exports.subscriptions = new EntitySchema({
    "name": "subscriptions",
    "tableName": "subscriptions",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "subscription_id": {
            "type": "varchar",
            "nullable": false,
            "unique": true
        },
        "customer_id": {
            "type": "int",
            "nullable": false
        },
        "merchant_id": {
            "type": "int",
            "nullable": false
        },
        "plan_id": {
            "type": "int",
            "nullable": false
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "active"
        },
        "next_billing_date": {
            "type": "timestamp",
            "nullable": false
        },
        "payment_method_id": {
            "type": "int",
            "nullable": false
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        },
        "merchants": {
            "target": "merchants",
            "type": "many-to-one",
            "joinColumn": {
                "name": "merchant_id"
            }
        },
        "subscription_plans": {
            "target": "subscription_plans",
            "type": "many-to-one",
            "joinColumn": {
                "name": "plan_id"
            }
        },
        "payment_methods": {
            "target": "payment_methods",
            "type": "many-to-one",
            "joinColumn": {
                "name": "payment_method_id"
            }
        },
        "subscription_payments": {
            "target": "subscription_payments",
            "type": "one-to-many",
            "inverseSide": "subscriptions"
        }
    }
});

exports.subscription_payments = new EntitySchema({
    "name": "subscription_payments",
    "tableName": "subscription_payments",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "subscription_id": {
            "type": "int",
            "nullable": false
        },
        "transaction_id": {
            "type": "int",
            "nullable": false,
            "unique": true
        },
        "billing_date": {
            "type": "timestamp",
            "nullable": false
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "pending"
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "subscriptions": {
            "target": "subscriptions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "subscription_id"
            }
        },
        "transactions": {
            "target": "transactions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "transaction_id"
            }
        }
    }
});

exports.payment_attempts = new EntitySchema({
    "name": "payment_attempts",
    "tableName": "payment_attempts",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "session_id": {
            "type": "int",
            "nullable": true
        },
        "transaction_id": {
            "type": "int",
            "nullable": true
        },
        "customer_id": {
            "type": "int",
            "nullable": false
        },
        "payment_method_id": {
            "type": "int",
            "nullable": false
        },
        "amount": {
            "type": "decimal",
            "nullable": false
        },
        "currency": {
            "type": "varchar",
            "nullable": false,
            "default": "INR"
        },
        "status": {
            "type": "varchar",
            "nullable": false,
            "default": "pending"
        },
        "failure_reason": {
            "type": "varchar",
            "nullable": true
        },
        "attempt_sequence": {
            "type": "int",
            "nullable": false,
            "default": 1
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "payment_sessions": {
            "target": "payment_sessions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "session_id"
            }
        },
        "transactions": {
            "target": "transactions",
            "type": "many-to-one",
            "joinColumn": {
                "name": "transaction_id"
            }
        },
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        },
        "payment_methods": {
            "target": "payment_methods",
            "type": "many-to-one",
            "joinColumn": {
                "name": "payment_method_id"
            }
        }
    }
});

exports.risk_scores = new EntitySchema({
    "name": "risk_scores",
    "tableName": "risk_scores",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "customer_id": {
            "type": "int",
            "nullable": false,
            "unique": true
        },
        "risk_score": {
            "type": "int",
            "nullable": false,
            "default": 0
        },
        "risk_level": {
            "type": "varchar",
            "nullable": false,
            "default": "low"
        },
        "factors": {
            "type": "varchar",
            "nullable": true
        },
        "last_evaluated": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        },
        "updated_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "customers": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        }
    }
});

exports.verification_codes = new EntitySchema({
    "name": "verification_codes",
    "tableName": "verification_codes",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "email": {
            "type": "varchar",
            "nullable": false
        },
        "code": {
            "type": "varchar",
            "nullable": false
        },
        "type": {
            "type": "varchar",
            "nullable": false
        },
        "expires_at": {
            "type": "timestamp",
            "nullable": false
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {}
});

exports.notifications = new EntitySchema({
    "name": "notifications",
    "tableName": "notifications",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "user_id": {
            "type": "int",
            "nullable": false
        },
        "user_type": {
            "type": "varchar",
            "nullable": false
        },
        "title": {
            "type": "varchar",
            "nullable": false
        },
        "message": {
            "type": "varchar",
            "nullable": false
        },
        "type": {
            "type": "varchar",
            "nullable": false,
            "default": "info"
        },
        "is_read": {
            "type": "int",
            "nullable": false,
            "default": 0
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    }
});

exports.audit_logs = new EntitySchema({
    "name": "audit_logs",
    "tableName": "audit_logs",
    "columns": {
        "id": {
            "type": "int",
            "nullable": false,
            "primary": true,
            "generated": true,
            "default": null
        },
        "customer_id": {
            "type": "int",
            "nullable": false
        },
        "action": {
            "type": "varchar",
            "nullable": false
        },
        "details": {
            "type": "varchar",
            "nullable": true
        },
        "ip_address": {
            "type": "varchar",
            "nullable": true
        },
        "created_at": {
            "type": "timestamp",
            "nullable": false,
            "createDate": true
        }
    },
    "relations": {
        "customer": {
            "target": "customers",
            "type": "many-to-one",
            "joinColumn": {
                "name": "customer_id"
            }
        }
    }
});

exports.Session = new EntitySchema({
    "name": "Session",
    "tableName": "sessions",
    "columns": {
        "id": {
            "type": "varchar",
            "length": 255,
            "primary": true
        },
        "expiredAt": {
            "type": "int"
        },
        "data": {
            "type": "clob",
            "transformer": {
                "to": (value) => value || "{}",
                "from": (value) => value
            }
        }
    }
});
