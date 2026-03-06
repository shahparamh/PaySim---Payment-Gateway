// ============================================================
// Shared JavaScript Utilities — public/js/app.js
//
// Common functions used across all frontend pages:
//   API helper, auth token management, toast notifications,
//   sidebar navigation, formatting utilities.
// ============================================================

const API_BASE = '/api/v1';

// ── Auth Token Management ───────────────────────────────

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function logout() {
    clearAuth();
    window.location.href = '/login.html';
}

// ── API Helper ──────────────────────────────────────────

async function api(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();

    if (res.status === 401) {
        clearAuth();
        window.location.href = '/login.html';
        return;
    }

    return { ok: res.ok, status: res.status, data };
}

// ── Toast Notifications ─────────────────────────────────

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const colors = {
        success: '#10b981', danger: '#ef4444',
        warning: '#f59e0b', info: '#3b82f6'
    };

    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
        min-width: 300px; margin-bottom: 0.5rem;
        background: white; border-left: 4px solid ${colors[type] || colors.info};
        border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.5rem;
    `;

    const icons = { success: '✓', danger: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `
        <span style="color: ${colors[type]}; font-weight: 700;">${icons[type] || 'ℹ'}</span>
        <span style="flex: 1; font-size: 0.875rem;">${message}</span>
        <button type="button" class="btn-close" style="font-size: 0.7rem;" onclick="this.parentElement.remove()"></button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ── Formatting Utilities ────────────────────────────────

function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function statusBadge(status) {
    const map = {
        success: 'badge-success', completed: 'badge-success',
        failed: 'badge-failed', expired: 'badge-failed',
        pending: 'badge-pending', processing: 'badge-pending',
        open: 'badge-pending', investigating: 'badge-pending',
        resolved: 'badge-success', false_positive: 'badge-low',
        critical: 'badge-critical', high: 'badge-high',
        medium: 'badge-medium', low: 'badge-low'
    };
    return `<span class="badge-status ${map[status] || 'badge-pending'}">${status}</span>`;
}

function methodIcon(type) {
    const icons = {
        wallet: 'bi-wallet2',
        credit_card: 'bi-credit-card',
        bank_account: 'bi-bank',
        net_banking: 'bi-globe'
    };
    return icons[type] || 'bi-credit-card';
}

// ── Theme Management ───────────────────────────────────

function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    // Set initial icon
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);

    // Update toggle icon if it exists
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = target === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

// ── Sidebar Active Link ─────────────────────────────────

function initSidebar() {
    const current = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        if (link.getAttribute('href') === current) {
            link.classList.add('active');
        }
    });

    // Mobile toggle
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('show'));
    }
}

// ── User Info in Topbar ─────────────────────────────────

function initTopbar() {
    const user = getUser();
    if (!user) return;

    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl) {
        nameEl.textContent = user.first_name || user.business_name || user.name || 'User';
    }
    if (avatarEl) {
        const name = user.first_name || user.business_name || user.name || 'U';
        avatarEl.textContent = name.charAt(0).toUpperCase();
    }
}

// ── PIN Screen Overlay ──────────────────────────────────

/**
 * Shows a full-screen PIN entry screen.
 * @param {string} amount - Formatted amount to display.
 * @returns {Promise<string>} - Resolves with the 4-digit PIN or rejects if cancelled.
 */
function showPinScreen(amount) {
    return new Promise((resolve, reject) => {
        const overlay = document.createElement('div');
        overlay.className = 'pin-overlay';
        overlay.innerHTML = `
            <div class="pin-container-card">
                <i class="bi bi-shield-check text-primary mb-3" style="font-size: 3rem;"></i>
                <h3>Authorize Payment</h3>
                <p class="text-white-50 mb-1">Payment to Merchant</p>
                <div class="amount-display">${amount}</div>
                
                <!-- dummy password field to distract browser autofill -->
                <input type="password" name="password" style="display:none;" autocomplete="new-password">

                <div class="pin-input-container">
                    <input type="tel" class="pin-box" maxlength="1" inputmode="numeric" autocomplete="off" 
                        style="-webkit-text-security: disc;" onfocus="this.value=''">
                    <input type="tel" class="pin-box" maxlength="1" inputmode="numeric" autocomplete="off" 
                        style="-webkit-text-security: disc;" onfocus="this.value=''">
                    <input type="tel" class="pin-box" maxlength="1" inputmode="numeric" autocomplete="off" 
                        style="-webkit-text-security: disc;" onfocus="this.value=''">
                    <input type="tel" class="pin-box" maxlength="1" inputmode="numeric" autocomplete="off" 
                        style="-webkit-text-security: disc;" onfocus="this.value=''">
                </div>
                
                <a href="#" class="cancel-btn">Cancel Transaction</a>
            </div>
        `;

        document.body.appendChild(overlay);

        const boxes = overlay.querySelectorAll('.pin-box');
        boxes[0].focus();

        const updatePinValue = () => {
            const pin = Array.from(boxes).map(b => b.value).join('');
            if (pin.length === 4) {
                setTimeout(() => {
                    overlay.remove();
                    resolve(pin);
                }, 300);
            }
        };

        boxes.forEach((box, idx) => {
            box.addEventListener('input', (e) => {
                if (e.target.value && idx < 3) boxes[idx + 1].focus();
                updatePinValue();
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && idx > 0) boxes[idx - 1].focus();
            });

            // Premium focus effect
            box.addEventListener('focus', () => box.select());
        });

        overlay.querySelector('.cancel-btn').addEventListener('click', (e) => {
            e.preventDefault();
            overlay.remove();
            reject(new Error('Transaction cancelled'));
        });

        // Handle Paste
        boxes[0].addEventListener('paste', (e) => {
            e.preventDefault();
            const data = e.clipboardData.getData('text').slice(0, 4);
            if (!/^\d+$/.test(data)) return;
            [...data].forEach((char, i) => { if (boxes[i]) boxes[i].value = char; });
            updatePinValue();
        });
    });
}

// ── Page Init ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initTopbar();
});
