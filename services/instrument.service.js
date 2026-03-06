// ============================================================
// Instrument Service — services/instrument.service.js
// Manages wallets, credit cards, bank accounts, and the
// polymorphic payment_methods bridge table.
// ============================================================

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const prisma = require('../config/prisma');

// ── Wallets ─────────────────────────────────────────────

async function createWallet(customerId, currency = 'INR', initialBalance = 0) {
    // Enforce Single Wallet Constraint
    const existingWallet = await prisma.wallets.findFirst({
        where: { customer_id: customerId, status: 'active' }
    });

    if (existingWallet) {
        throw Object.assign(new Error('User already has an active wallet'), { statusCode: 400 });
    }

    const walletId = uuidv4();

    const wallet = await prisma.wallets.create({
        data: {
            customer_id: customerId,
            wallet_id: walletId,
            balance: initialBalance,
            currency
        }
    });

    // Auto-register as payment method
    await prisma.payment_methods.create({
        data: {
            customer_id: customerId,
            method_type: 'wallet',
            instrument_id: wallet.id
        }
    });

    return { id: wallet.id, wallet_id: walletId, balance: initialBalance, currency };
}

async function getWallets(customerId) {
    return await prisma.wallets.findMany({
        where: { customer_id: customerId, status: 'active' }
    });
}

async function topUpWallet(walletId, customerId, amount) {
    const wallet = await prisma.wallets.update({
        where: { id: parseInt(walletId), customer_id: customerId, status: 'active' },
        data: { balance: { increment: amount } }
    });
    return { id: walletId, new_balance: wallet.balance };
}

// ── Credit Cards ────────────────────────────────────────

async function addCreditCard(customerId, data) {
    const cardHash = crypto.createHash('sha256').update(data.card_number).digest('hex');
    const lastFour = data.card_number.slice(-4);

    const card = await prisma.credit_cards.create({
        data: {
            customer_id: customerId,
            card_number_hash: cardHash,
            card_last_four: lastFour,
            card_brand: data.card_brand,
            cardholder_name: data.cardholder_name,
            expiry_month: data.expiry_month,
            expiry_year: data.expiry_year,
            credit_limit: data.credit_limit
        }
    });

    await prisma.payment_methods.create({
        data: {
            customer_id: customerId,
            method_type: 'credit_card',
            instrument_id: card.id
        }
    });

    return { id: card.id, last_four: lastFour, brand: data.card_brand };
}

async function getCreditCards(customerId) {
    return await prisma.credit_cards.findMany({
        where: { customer_id: customerId, status: 'active' }
    });
}

async function removeCreditCard(cardId, customerId) {
    await prisma.credit_cards.update({
        where: { id: cardId, customer_id: customerId },
        data: { status: 'blocked' }
    });
    await prisma.payment_methods.updateMany({
        where: { instrument_id: cardId, method_type: 'credit_card', customer_id: customerId },
        data: { status: 'disabled' }
    });
}

// ── Bank Accounts ───────────────────────────────────────

async function addBankAccount(customerId, data) {
    const accountHash = crypto.createHash('sha256').update(data.account_number).digest('hex');
    const lastFour = data.account_number.slice(-4);

    const account = await prisma.bank_accounts.create({
        data: {
            customer_id: customerId,
            account_number_hash: accountHash,
            account_last_four: lastFour,
            bank_name: data.bank_name,
            ifsc_code: data.ifsc_code,
            account_holder_name: data.account_holder_name,
            account_type: data.account_type,
            balance: data.balance
        }
    });

    await prisma.payment_methods.create({
        data: {
            customer_id: customerId,
            method_type: 'bank_account',
            instrument_id: account.id
        }
    });

    return { id: account.id, last_four: lastFour, bank_name: data.bank_name };
}

async function getBankAccounts(customerId) {
    return await prisma.bank_accounts.findMany({
        where: { customer_id: customerId, status: 'active' }
    });
}

async function removeBankAccount(accountId, customerId) {
    await prisma.bank_accounts.update({
        where: { id: accountId, customer_id: customerId },
        data: { status: 'closed' }
    });
    await prisma.payment_methods.updateMany({
        where: { instrument_id: accountId, method_type: 'bank_account', customer_id: customerId },
        data: { status: 'disabled' }
    });
}

// ── Payment Methods (unified view) ─────────────────────

async function getPaymentMethods(customerId) {
    return await prisma.payment_methods.findMany({
        where: { customer_id: customerId, status: 'active' }
    });
}

async function setDefaultMethod(methodId, customerId) {
    await prisma.$transaction([
        prisma.payment_methods.updateMany({
            where: { customer_id: customerId },
            data: { is_default: false }
        }),
        prisma.payment_methods.update({
            where: { id: methodId, customer_id: customerId },
            data: { is_default: true }
        })
    ]);
}

async function getCustomerInstruments(customerId) {
    const [wallets, cards, accounts] = await Promise.all([
        getWallets(customerId),
        getCreditCards(customerId),
        getBankAccounts(customerId)
    ]);
    return { wallets, credit_cards: cards, bank_accounts: accounts };
}

// ── Net Banking ─────────────────────────────────────────
// Net Banking links to an existing bank account record.
// instrument_id points to a bank_accounts row.

async function addNetBanking(customerId, bankAccountId) {
    const account = await prisma.bank_accounts.findFirst({
        where: { id: bankAccountId, customer_id: customerId, status: 'active' }
    });
    if (!account) throw Object.assign(new Error('Bank account not found'), { statusCode: 404 });

    const pm = await prisma.payment_methods.create({
        data: {
            customer_id: customerId,
            method_type: 'net_banking',
            instrument_id: bankAccountId
        }
    });

    return { id: pm.id, method_type: 'net_banking', linked_bank_account_id: bankAccountId };
}

// ── Validate & Deduct (used during transaction processing) ──

/**
 * Validate sufficient balance/credit and deduct atomically.
 * @param {string} methodType — 'wallet' | 'credit_card' | 'bank_account' | 'net_banking'
 * @param {number} instrumentId — PK of the instrument table
 * @param {number} amount
 * @param {PoolConnection} conn — MySQL connection (within transaction)
 * @returns {{ success: boolean, reason?: string }}
 */
async function validateAndDeduct(methodType, instrumentId, amount, tx) {
    // This is now redundant with simulator.service.js implementation but keeping for reference or generic usage
    const prismaTx = tx || prisma;
    const normalizedType = methodType === 'card' ? 'credit_card' : methodType;

    switch (normalizedType) {
        case 'wallet': {
            const wallet = await prismaTx.wallets.findUnique({ where: { id: instrumentId } });
            if (!wallet || wallet.status !== 'active') return { success: false, reason: 'Wallet not found or inactive' };
            if (parseFloat(wallet.balance) < amount) return { success: false, reason: 'Insufficient wallet balance' };

            await prismaTx.wallets.update({
                where: { id: instrumentId },
                data: { balance: { decrement: amount } }
            });
            return { success: true };
        }

        case 'credit_card': {
            const card = await prismaTx.credit_cards.findUnique({ where: { id: instrumentId } });
            if (!card || card.status !== 'active') return { success: false, reason: 'Card not found or inactive' };

            const available = parseFloat(card.credit_limit) - parseFloat(card.used_credit);
            if (available < amount) return { success: false, reason: 'Insufficient credit limit' };

            await prismaTx.credit_cards.update({
                where: { id: instrumentId },
                data: { used_credit: { increment: amount } }
            });
            return { success: true };
        }

        case 'bank_account':
        case 'net_banking': {
            const bank = await prismaTx.bank_accounts.findUnique({ where: { id: instrumentId } });
            if (!bank || bank.status !== 'active') return { success: false, reason: 'Bank account not found or inactive' };
            if (parseFloat(bank.balance) < amount) return { success: false, reason: 'Insufficient bank balance' };

            await prismaTx.bank_accounts.update({
                where: { id: instrumentId },
                data: { balance: { decrement: amount } }
            });
            return { success: true };
        }

        default:
            return { success: false, reason: `Unknown instrument type: ${methodType}` };
    }
}

async function payCreditCardBill(customerId, cardId, sourceMethodId, amount) {
    return await prisma.$transaction(async (tx) => {
        // 1. Validate Card
        const card = await tx.credit_cards.findUnique({
            where: { id: parseInt(cardId), customer_id: customerId, status: 'active' }
        });
        if (!card) throw Object.assign(new Error('Active credit card not found'), { statusCode: 404 });

        // 2. Validate Source Method
        const sourceMethod = await tx.payment_methods.findUnique({
            where: { id: parseInt(sourceMethodId), customer_id: customerId, status: 'active' }
        });
        if (!sourceMethod) throw Object.assign(new Error('Payment source not found'), { statusCode: 404 });

        // 3. Deduct from source
        const deduction = await validateAndDeduct(sourceMethod.method_type, sourceMethod.instrument_id, amount, tx);
        if (!deduction.success) throw Object.assign(new Error(deduction.reason), { statusCode: 400 });

        // 4. Reduce credit card usage
        const updatedCard = await tx.credit_cards.update({
            where: { id: card.id },
            data: { used_credit: { decrement: amount } }
        });

        // 5. Record Transaction
        const txnId = uuidv4();
        await tx.transactions.create({
            data: {
                txn_id: txnId,
                customer_id: customerId,
                payment_method_id: sourceMethod.id,
                amount: amount,
                currency: 'INR',
                status: 'success',
                txn_type: 'bill_payment',
                mode: 'simulator',
                verified_at: new Date()
            }
        });

        return {
            success: true,
            txn_id: txnId,
            new_used_credit: updatedCard.used_credit
        };
    });
}

module.exports = {
    createWallet, getWallets, topUpWallet,
    addCreditCard, getCreditCards, removeCreditCard,
    addBankAccount, getBankAccounts, removeBankAccount,
    addNetBanking,
    getPaymentMethods, setDefaultMethod, getCustomerInstruments,
    validateAndDeduct,
    payCreditCardBill
};
