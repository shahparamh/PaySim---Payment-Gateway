// ============================================================
// Instrument Service — services/instrument.service.js
// Manages wallets, credit cards, bank accounts, and the
// polymorphic payment_methods bridge table.
// ============================================================

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const AppDataSource = require('../config/database');
const { wallets, payment_methods, credit_cards, bank_accounts, transactions, customers } = require('../entities/entities');
const { encrypt, decrypt } = require('../utils/crypto');

// ── Wallets ─────────────────────────────────────────────

async function createWallet(customerId, currency = 'INR', initialBalance = 0) {
    // Enforce Single Wallet Constraint
    const walletRepo = AppDataSource.getRepository(wallets);
    const existingWallet = await walletRepo.findOne({
        where: { customer_id: customerId, status: 'active' }
    });

    if (existingWallet) {
        throw Object.assign(new Error('User already has an active wallet'), { statusCode: 400 });
    }

    const walletId = uuidv4();

    const wallet = await walletRepo.save({
        customer_id: customerId,
        wallet_id: walletId,
        balance: initialBalance,
        currency
    });

    // Auto-register as payment method
    const pmRepo = AppDataSource.getRepository(payment_methods);
    await pmRepo.save({
        customer_id: customerId,
        method_type: 'wallet',
        instrument_id: wallet.id
    });

    return { id: wallet.id, wallet_id: walletId, balance: initialBalance, currency };
}

async function getWallets(customerId) {
    const walletRepo = AppDataSource.getRepository(wallets);
    return await walletRepo.find({
        where: { customer_id: customerId, status: 'active' }
    });
}

async function topUpWallet(walletId, customerId, amount) {
    const walletRepo = AppDataSource.getRepository(wallets);
    await walletRepo.increment({ id: parseInt(walletId), customer_id: customerId, status: 'active' }, 'balance', amount);
    const wallet = await walletRepo.findOneBy({ id: parseInt(walletId) });
    return { id: walletId, new_balance: wallet.balance };
}

// ── Credit Cards ────────────────────────────────────────

async function addCreditCard(customerId, data) {
    const cleanCardNumber = data.card_number.replace(/\s+/g, '');
    const cardHash = crypto.createHash('sha256').update(cleanCardNumber).digest('hex');
    const lastFour = cleanCardNumber.slice(-4);

    // Prevent duplicate active cards (globally)
    const ccRepo = AppDataSource.getRepository(credit_cards);
    const existingCard = await ccRepo.findOne({
        where: {
            card_number_hash: cardHash,
            status: 'active'
        }
    });

    if (existingCard) {
        throw Object.assign(new Error('This credit card is already linked to an account'), { statusCode: 400 });
    }

    const encryptedCard = encrypt(cleanCardNumber);

    const card = await ccRepo.save({
        customer_id: customerId,
        card_number_hash: cardHash,
        card_number_encrypted: encryptedCard,
        card_last_four: lastFour,
        card_brand: data.card_brand,
        cardholder_name: data.cardholder_name,
        expiry_month: data.expiry_month,
        expiry_year: data.expiry_year,
        credit_limit: data.credit_limit
    });

    const pmRepo = AppDataSource.getRepository(payment_methods);
    await pmRepo.save({
        customer_id: customerId,
        method_type: 'credit_card',
        instrument_id: card.id
    });

    return { id: card.id, last_four: lastFour, brand: data.card_brand };
}

async function getCreditCards(customerId) {
    const ccRepo = AppDataSource.getRepository(credit_cards);
    return await ccRepo.find({
        where: { customer_id: customerId, status: 'active' },
        select: ['id', 'customer_id', 'card_last_four', 'card_brand', 'cardholder_name', 'expiry_month', 'expiry_year', 'credit_limit', 'used_credit', 'status', 'created_at']
    });
}

async function getFullCardNumber(cardId, customerId) {
    const ccRepo = AppDataSource.getRepository(credit_cards);
    const card = await ccRepo.findOne({
        where: { id: cardId, customer_id: customerId, status: 'active' }
    });

    if (!card) {
        throw Object.assign(new Error('Credit card not found'), { statusCode: 404 });
    }

    if (!card.card_number_encrypted) {
        throw Object.assign(new Error('Full card number not available for this card'), { statusCode: 400 });
    }

    const fullNumber = decrypt(card.card_number_encrypted);
    return { card_number: fullNumber };
}

async function removeCreditCard(cardId, customerId) {
    const ccRepo = AppDataSource.getRepository(credit_cards);
    await ccRepo.update({ id: cardId, customer_id: customerId }, { status: 'blocked' });

    const pmRepo = AppDataSource.getRepository(payment_methods);
    await pmRepo.update({ instrument_id: cardId, method_type: 'credit_card', customer_id: customerId }, { status: 'disabled' });
}

// ── Bank Accounts ───────────────────────────────────────

async function addBankAccount(userId, data, role = 'customer') {
    const accountHash = crypto.createHash('sha256').update(data.account_number).digest('hex');
    const lastFour = data.account_number.slice(-4);

    const bankRepo = AppDataSource.getRepository(bank_accounts);
    const account = await bankRepo.save({
        customer_id: role === 'customer' ? userId : null,
        merchant_id: role === 'merchant' ? userId : null,
        account_number_hash: accountHash,
        account_last_four: lastFour,
        bank_name: data.bank_name,
        ifsc_code: data.ifsc_code,
        account_holder_name: data.account_holder_name,
        account_type: data.account_type,
        balance: data.balance
    });

    const pmRepo = AppDataSource.getRepository(payment_methods);
    await pmRepo.save({
        customer_id: role === 'customer' ? userId : null,
        merchant_id: role === 'merchant' ? userId : null,
        method_type: 'bank_account',
        instrument_id: account.id
    });

    return { id: account.id, last_four: lastFour, bank_name: data.bank_name };
}

async function getBankAccounts(userId, role = 'customer') {
    const bankRepo = AppDataSource.getRepository(bank_accounts);
    const where = role === 'customer' ? { customer_id: userId } : { merchant_id: userId };
    return await bankRepo.find({
        where: { ...where, status: 'active' }
    });
}

async function removeBankAccount(accountId, userId, role = 'customer') {
    const bankRepo = AppDataSource.getRepository(bank_accounts);
    const where = role === 'customer' ? { customer_id: userId } : { merchant_id: userId };
    
    await bankRepo.update({ id: accountId, ...where }, { status: 'closed' });

    const pmRepo = AppDataSource.getRepository(payment_methods);
    await pmRepo.update({ instrument_id: accountId, method_type: 'bank_account', ...where }, { status: 'disabled' });
}

// ── Payment Methods (unified view) ─────────────────────

async function getPaymentMethods(userId, role = 'customer') {
    const pmRepo = AppDataSource.getRepository(payment_methods);
    const where = role === 'customer' ? { customer_id: userId } : { merchant_id: userId };
    const methods = await pmRepo.find({
        where: { ...where, status: 'active' }
    });

    // Enrich with instrument details
    return await Promise.all(methods.map(async (m) => {
        let details = null;
        if (m.method_type === 'wallet') {
            details = await AppDataSource.getRepository(wallets).findOneBy({ id: m.instrument_id });
        } else if (m.method_type === 'credit_card') {
            details = await AppDataSource.getRepository(credit_cards).findOne({
                where: { id: m.instrument_id },
                select: ['id', 'card_last_four', 'card_brand', 'cardholder_name', 'expiry_month', 'expiry_year', 'credit_limit', 'used_credit']
            });
        } else if (m.method_type === 'bank_account' || m.method_type === 'net_banking') {
            details = await AppDataSource.getRepository(bank_accounts).findOneBy({ id: m.instrument_id });
        }
        return { ...m, details };
    }));
}

async function setDefaultMethod(methodId, customerId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.manager.update(payment_methods, { customer_id: customerId }, { is_default: false });
        await queryRunner.manager.update(payment_methods, { id: methodId, customer_id: customerId }, { is_default: true });
        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
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
    const bankRepo = AppDataSource.getRepository(bank_accounts);
    const account = await bankRepo.findOne({
        where: { id: bankAccountId, customer_id: customerId, status: 'active' }
    });
    if (!account) throw Object.assign(new Error('Bank account not found'), { statusCode: 404 });

    const pmRepo = AppDataSource.getRepository(payment_methods);
    const pm = await pmRepo.save({
        customer_id: customerId,
        method_type: 'net_banking',
        instrument_id: bankAccountId
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
    const manager = tx || AppDataSource.manager;
    const normalizedType = methodType === 'card' ? 'credit_card' : methodType;

    switch (normalizedType) {
        case 'wallet': {
            const wallet = await manager.findOne(wallets, { where: { id: instrumentId } });
            if (!wallet || wallet.status !== 'active') return { success: false, reason: 'Wallet not found or inactive' };
            if (parseFloat(wallet.balance) < amount) return { success: false, reason: 'Insufficient wallet balance' };

            await manager.decrement(wallets, { id: instrumentId }, 'balance', amount);
            return { success: true };
        }

        case 'credit_card': {
            const card = await manager.findOne(credit_cards, { where: { id: instrumentId } });
            if (!card || card.status !== 'active') return { success: false, reason: 'Card not found or inactive' };

            const available = parseFloat(card.credit_limit) - parseFloat(card.used_credit);
            if (available < amount) return { success: false, reason: 'Insufficient credit limit' };

            await manager.increment(credit_cards, { id: instrumentId }, 'used_credit', amount);
            return { success: true };
        }

        case 'bank_account':
        case 'net_banking': {
            const bank = await manager.findOne(bank_accounts, { where: { id: instrumentId } });
            if (!bank || bank.status !== 'active') return { success: false, reason: 'Bank account not found or inactive' };
            if (parseFloat(bank.balance) < amount) return { success: false, reason: 'Insufficient bank balance' };

            await manager.decrement(bank_accounts, { id: instrumentId }, 'balance', amount);
            return { success: true };
        }

        default:
            return { success: false, reason: `Unknown instrument type: ${methodType}` };
    }
}

async function payCreditCardBill(customerId, cardId, sourceMethodId, amount, pin) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 0. Verify PIN
        const customer = await queryRunner.manager.findOne(customers, {
            where: { id: customerId },
            select: ['pin_hash']
        });
        if (!customer || !customer.pin_hash) throw Object.assign(new Error('Payment PIN not set'), { statusCode: 400 });
        
        const pinMatch = await bcrypt.compare(pin, customer.pin_hash);
        if (!pinMatch) throw Object.assign(new Error('Invalid payment PIN'), { statusCode: 401 });

        // 1. Validate Card
        const card = await queryRunner.manager.findOne(credit_cards, {
            where: { id: parseInt(cardId), customer_id: customerId, status: 'active' }
        });
        if (!card) throw Object.assign(new Error('Active credit card not found'), { statusCode: 404 });

        // 2. Validate Source Method
        const sourceMethod = await queryRunner.manager.findOne(payment_methods, {
            where: { id: parseInt(sourceMethodId), customer_id: customerId, status: 'active' }
        });
        if (!sourceMethod) throw Object.assign(new Error('Payment source not found'), { statusCode: 404 });

        // 3. Deduct from source
        const deduction = await validateAndDeduct(sourceMethod.method_type, sourceMethod.instrument_id, amount, queryRunner.manager);
        if (!deduction.success) throw Object.assign(new Error(deduction.reason), { statusCode: 400 });

        // 4. Reduce credit card usage
        await queryRunner.manager.decrement(credit_cards, { id: card.id }, 'used_credit', amount);
        const updatedCard = await queryRunner.manager.findOne(credit_cards, { where: { id: card.id } });

        // 5. Record Transaction
        const txnId = uuidv4();
        await queryRunner.manager.save(transactions, {
            txn_id: txnId,
            customer_id: customerId,
            payment_method_id: sourceMethod.id,
            amount: amount,
            currency: 'INR',
            status: 'success',
            txn_type: 'bill_payment',
            mode: 'simulator',
            verified_at: new Date()
        });

        await queryRunner.commitTransaction();

        return {
            success: true,
            txn_id: txnId,
            new_used_credit: updatedCard.used_credit
        };
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
}

async function removePaymentMethod(methodId, customerId) {
    const pmRepo = AppDataSource.getRepository(payment_methods);
    const method = await pmRepo.findOne({
        where: { id: parseInt(methodId), customer_id: customerId, status: 'active' }
    });

    if (!method) {
        throw Object.assign(new Error('Payment method not found'), { statusCode: 404 });
    }

    if (method.method_type === 'credit_card') {
        await removeCreditCard(method.instrument_id, customerId);
    } else if (method.method_type === 'bank_account' || method.method_type === 'net_banking') {
        await removeBankAccount(method.instrument_id, customerId);
    } else if (method.method_type === 'wallet') {
        throw Object.assign(new Error('Cannot remove primary wallet'), { statusCode: 400 });
    } else {
        // Generic fallback
        await pmRepo.update({ id: method.id }, { status: 'disabled' });
    }

    return { success: true };
}

module.exports = {
    createWallet, getWallets, topUpWallet,
    addCreditCard, getCreditCards, removeCreditCard, getFullCardNumber,
    addBankAccount, getBankAccounts, removeBankAccount,
    addNetBanking,
    getPaymentMethods, setDefaultMethod, getCustomerInstruments,
    validateAndDeduct,
    payCreditCardBill,
    removePaymentMethod
};
