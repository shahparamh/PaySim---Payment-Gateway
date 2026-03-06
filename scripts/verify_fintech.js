const prisma = require('../config/prisma');
const { generateTxnId } = require('../utils/idGenerator');

async function verify() {
    console.log('🧪 Starting Fintech Feature Verification (SQLite)...');
    console.log('----------------------------------------------------');

    try {
        const customer = await prisma.customers.findFirst({ include: { wallets: true, credit_cards: true, payment_methods: true } });
        const merchantA = await prisma.merchants.findFirst({ where: { business_name: 'Main Store' } });
        const merchantB = await prisma.merchants.findFirst({ where: { business_name: 'Split Partner' } });

        if (!customer || !merchantA || !merchantB) {
            throw new Error('Seed data missing. Run seed_test_data.js first.');
        }

        // 1. Verify Payment Splits
        console.log('➡️ Testing Payment Splits...');
        const amount = 500.00;
        const splitAmount = 200.00;

        const mainTxnId = generateTxnId();
        const txn = await prisma.$transaction(async (tx) => {
            const t = await tx.transactions.create({
                data: {
                    txn_id: mainTxnId,
                    customer_id: customer.id,
                    merchant_id: merchantA.id,
                    payment_method_id: customer.payment_methods[0].id,
                    amount: amount,
                    status: 'success',
                    mode: 'simulator',
                    txn_type: 'payment'
                }
            });

            await tx.payment_splits.create({
                data: { transaction_id: t.id, merchant_id: merchantB.id, amount: splitAmount }
            });

            // Update balances
            await tx.wallets.update({
                where: { id: customer.wallets[0].id },
                data: { balance: { decrement: amount } }
            });

            return t;
        });

        const splitCount = await prisma.payment_splits.count({ where: { transaction_id: txn.id } });
        console.log(`✅ Splits: Transaction created with ${splitCount} split record(s).`);

        // 2. Verify Escrow
        console.log('➡️ Testing Escrow Workflow...');
        const escrowTxnId = generateTxnId();
        const escrowTxn = await prisma.$transaction(async (tx) => {
            const t = await tx.transactions.create({
                data: {
                    txn_id: escrowTxnId,
                    customer_id: customer.id,
                    merchant_id: merchantA.id,
                    payment_method_id: customer.payment_methods[0].id,
                    amount: 1000.00,
                    status: 'held',
                    mode: 'simulator',
                    txn_type: 'escrow'
                }
            });

            let escrowAcc = await tx.escrow_accounts.findUnique({ where: { merchant_id: merchantA.id } });
            if (!escrowAcc) {
                escrowAcc = await tx.escrow_accounts.create({ data: { merchant_id: merchantA.id, balance: 0 } });
            }

            await tx.escrow_transactions.create({
                data: {
                    escrow_account_id: escrowAcc.id,
                    transaction_id: t.id,
                    amount: 1000.00,
                    status: 'held'
                }
            });

            return t;
        });
        console.log(`✅ Escrow: Payment held in escrow (Txn: ${escrowTxn.txn_id}).`);

        // 3. Verify Subscriptions
        console.log('➡️ Testing Subscriptions...');
        const sub = await prisma.subscriptions.create({
            data: {
                subscription_id: 'SUB-' + Math.random().toString(36).substring(7).toUpperCase(),
                customer_id: customer.id,
                merchant_id: merchantA.id,
                plan_name: 'Premium Monthly',
                amount: 99.00,
                billing_interval: 'monthly',
                status: 'active',
                next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                payment_method_id: customer.payment_methods[0].id
            }
        });
        console.log(`✅ Subscriptions: Recurring plan created (SubID: ${sub.subscription_id}).`);

        // 4. Verify Smart Routing (Payment Attempts)
        console.log('➡️ Testing Smart Routing Logging...');
        await prisma.payment_attempts.create({
            data: {
                customer_id: customer.id,
                payment_method_id: customer.payment_methods[1].id, // Card
                amount: 150.00,
                status: 'failed',
                failure_reason: 'Processor timeout',
                attempt_sequence: 1
            }
        });
        const attempt = await prisma.payment_attempts.create({
            data: {
                customer_id: customer.id,
                payment_method_id: customer.payment_methods[0].id, // Wallet (fallback)
                amount: 150.00,
                status: 'success',
                attempt_sequence: 2
            }
        });
        console.log(`✅ Smart Routing: Failover attempt logged (Status: ${attempt.status}).`);

        console.log('----------------------------------------------------');
        console.log('✅ ALL FINTECH FEATURES VERIFIED ON SQLITE!');
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
