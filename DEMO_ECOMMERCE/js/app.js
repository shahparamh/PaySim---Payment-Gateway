// Product Data
const PRODUCTS = [
    { id: 1, name: "Titan Pro Smartphone", price: 89999, img: "assets/phone.png" },
    { id: 2, name: "Lunar Headphones", price: 24500, img: "assets/headphones.png" },
    { id: 3, name: "Vector Smartwatch", price: 12900, img: "assets/watch.png" }
];

let cart = [];

// DOM Elements
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartTrigger = document.getElementById('cartTrigger');
const closeCart = document.getElementById('closeCart');
const cartItemsContainer = document.getElementById('cartItems');
const cartBadge = document.getElementById('cartBadge');
const cartTotalVal = document.getElementById('cartTotalVal');
const checkoutBtn = document.getElementById('checkoutBtn');

// Initialize
function init() {
    // Event Listeners
    cartTrigger.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    checkoutBtn.addEventListener('click', handleCheckout);

    updateCartUI();
}

function toggleCart() {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('open');
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartUI();
        // Show cart after adding
        if (!cartSidebar.classList.contains('open')) {
            toggleCart();
        }
    }
}

function updateCartUI() {
    // Update Badge
    cartBadge.innerText = cart.length;

    // Render Items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
        cartTotalVal.innerText = '₹0';
        checkoutBtn.disabled = true;
    } else {
        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.img}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="price">₹${item.price.toLocaleString()}</p>
                    <button class="remove-item" onclick="removeFromCart(${index})">Remove</button>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotalVal.innerText = `₹${total.toLocaleString()}`;
        checkoutBtn.disabled = false;
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

async function handleCheckout() {
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    checkoutBtn.innerHTML = '<span class="loader"></span> Redirecting...';
    checkoutBtn.disabled = true;

    try {
        // 1. Create Payment Session via Platform API
        const response = await fetch(`${NEXSTORE_CONFIG.API_BASE_URL}/platform/create-payment-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': NEXSTORE_CONFIG.API_KEY
            },
            body: JSON.stringify({
                amount: total,
                currency: 'INR',
                description: `Order for ${cart.length} items from NexStore`,
                success_redirect_url: window.location.origin + '/demo/success.html',
                failure_redirect_url: window.location.origin + '/demo/failure.html',
                metadata: {
                    order_id: 'NS-' + Date.now(),
                    items: cart.map(i => i.name).join(', ')
                }
            })
        });

        const result = await response.json();

        if (result.success) {
            // 2. Redirect to PaySim Checkout
            window.location.href = result.data.checkout_url;
        } else {
            alert('Payment Session Creation Failed: ' + result.error.message);
            checkoutBtn.innerHTML = 'Secure Checkout with PaySim';
            checkoutBtn.disabled = false;
        }
    } catch (err) {
        console.error('Checkout error:', err);
        alert('Checkout failed. Is the PaySim server running?');
        checkoutBtn.innerHTML = 'Secure Checkout with PaySim';
        checkoutBtn.disabled = false;
    }
}

// Global scope for onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

// Start
document.addEventListener('DOMContentLoaded', init);
