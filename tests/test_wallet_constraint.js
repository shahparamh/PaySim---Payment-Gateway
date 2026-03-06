const prisma = require('../config/prisma');
const instrumentService = require('../services/instrument.service');

async function testWalletConstraint() {
    console.log('--- Testing Wallet Constraint ---');

    // 1. Find a customer
    const customer = await prisma.customers.findFirst();
    if (!customer) {
        console.error('No customer found in DB to test.');
        return;
    }
    console.log(`Testing with customer: ${customer.email} (ID: ${customer.id})`);

    // 2. Ensure customer has at least one wallet
    let wallet;
    try {
        wallet = await instrumentService.createWallet(customer.id, 'INR', 100);
        console.log('First wallet created successfully.');
    } catch (err) {
        if (err.message === 'User already has an active wallet') {
            console.log('Customer already had a wallet. Proceeding to test constraint.');
        } else {
            console.error('Failed to ensure first wallet exists:', err.message);
            return;
        }
    }

    // 3. Try to add a second wallet
    try {
        console.log('Attempting to create a second wallet...');
        await instrumentService.createWallet(customer.id, 'INR', 500);
        console.error('FAIL: Second wallet was created erroneously!');
    } catch (err) {
        if (err.message === 'User already has an active wallet' && err.statusCode === 400) {
            console.log('SUCCESS: Wallet constraint correctly blocked second wallet creation.');
        } else {
            console.error('FAIL: Unexpected error message or status code:', err.message, err.statusCode);
        }
    }
}

testWalletConstraint()
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());
