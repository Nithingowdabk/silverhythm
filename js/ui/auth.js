// js/ui/auth.js — Auth Bottom Sheet Modal

import { State } from '../state.js';
import { API } from '../api.js';
import { Toast } from './toast.js';
let _authInitialized = false;

const SVG_X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

function esc(str) { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }

let modalEl = null;
let currentView = 'login';

function ensureModal() {
    if (modalEl) return;
    modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay';
    modalEl.id = 'authModalOverlay';
    modalEl.setAttribute('data-brand', State.get('brand'));
    modalEl.innerHTML = `<div class="modal-content auth-modal" id="authModalContent"></div>`;
    document.getElementById('modal-root').appendChild(modalEl);
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) close(); });

}

function close() {
    if (modalEl) {
        modalEl.classList.remove('open');
        document.body.classList.remove('no-scroll');
    }
}

function openModal(view = 'login') {
    ensureModal();
    currentView = view;
    render();
    modalEl.classList.add('open');
    document.body.classList.add('no-scroll');
}

function render() {
    const content = document.getElementById('authModalContent');
    if (currentView === 'login') {
        content.innerHTML = `
            <div class="sheet-handle"></div>
            <button class="modal-close-btn" id="authCloseBtn">${SVG_X}</button>
            <h3>Welcome Back</h3>
            <p>Sign in to your shared portal account.</p>
            <form class="auth-form" id="loginForm">
                <input type="email" name="email" placeholder="Email address" required class="auth-input" autocomplete="email">
                <input type="password" name="password" placeholder="Password" required class="auth-input" autocomplete="current-password">
                <button type="submit" class="auth-submit" id="loginSubmit">Login</button>
            </form>
            <div class="auth-switch">
                Don't have an account? <button id="toRegisterBtn">Sign Up</button>
            </div>
        `;
        document.getElementById('authCloseBtn').addEventListener('click', close);
        document.getElementById('toRegisterBtn').addEventListener('click', () => { currentView = 'register'; render(); });
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    } else {
        content.innerHTML = `
            <div class="sheet-handle bg-gray-300"></div>
            <button class="modal-close auth-close-btn" id="authCloseBtn">${SVG_X}</button>
            <h3>Create Account</h3>
            <p>Register for a unified shopping experience.</p>
            <form class="auth-form" id="registerForm">
                <input type="text" name="name" placeholder="Full name" required class="auth-input" autocomplete="name">
                <input type="email" name="email" placeholder="Email address" required class="auth-input" autocomplete="email">
                <input type="tel" name="phone" placeholder="Phone (optional)" class="auth-input" autocomplete="tel">
                <input type="password" name="password" placeholder="Password (min 8 chars)" required class="auth-input" autocomplete="new-password" minlength="8">
                <button type="submit" class="auth-submit" id="registerSubmit">Create Account</button>
            </form>
            <div class="auth-switch">
                Already have an account? <button id="toLoginBtn">Login</button>
            </div>
        `;
        document.getElementById('authCloseBtn').addEventListener('click', close);
        document.getElementById('toLoginBtn').addEventListener('click', () => { currentView = 'login'; render(); });
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginSubmit');
    btn.textContent = 'Signing in...'; btn.disabled = true;
    const fd = new FormData(e.target);
    const res = await API.login(fd.get('email'), fd.get('password'));
    if (res.ok) {
        State.set('user', res.data.user);
        // Merge guest cart into server cart
        try {
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            if (guestCart.length > 0) {
                for (const item of guestCart) {
                    if (item.brand !== 'silverythm') {
                        await API.addToCart(item.id, item.quantity || 1);
                    }
                }
                localStorage.removeItem('guestCart');
                const cartRes = await API.getCart();
                if (cartRes.ok) State.set('cart', cartRes.data);
            }
        } catch (err) {
            console.warn('Guest cart merge failed:', err);
        }
        Toast.success('Welcome back, ' + esc(res.data.user.name));
        close();
    } else {
        Toast.error(res.message || 'Login failed');
        btn.textContent = 'Login'; btn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('registerSubmit');
    btn.textContent = 'Creating...'; btn.disabled = true;
    const fd = new FormData(e.target);
    const res = await API.register(fd.get('name'), fd.get('email'), fd.get('password'), fd.get('phone'));
    if (res.ok) {
        Toast.success('Account created! Please login.');
        currentView = 'login'; render();
    } else {
        Toast.error(res.message || 'Registration failed');
        btn.textContent = 'Create Account'; btn.disabled = false;
    }
}

async function openProfileModal(user) {
    ensureModal();
    const content = document.getElementById('authModalContent');
    const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
    const brand = State.get('brand') || 'silverythm';
    const THEME = {
        silverythm: { primary: '#1B4963', light: '#EEF4F8', accent: '#C0C0C0' },
        devaramane: { primary: '#B8860B', light: '#FEF9E7', accent: '#F5C842' },
        udugore:    { primary: '#0D1B4B', light: '#ECEEF5', accent: '#C9A84C' },
    };
    const t = THEME[brand] || THEME.silverythm;

    content.style.setProperty('--brand-primary', t.primary);
    content.style.setProperty('--brand-light', t.light);
    content.style.setProperty('--brand-accent', t.accent);
    content.style.setProperty('--brand-accent-alpha', t.accent + '33');

    content.innerHTML = `
        <div class="brand-top-bar"></div>

        <div class="profile-header-pad">
            <div class="flex-center-gap-16">
                <div class="profile-avatar">${initial}</div>
                <div class="profile-meta-wrap">
                    <div class="profile-name-text">${esc(user.name)}</div>
                    <div class="profile-email-text">${esc(user.email)}</div>
                    ${user.phone ? `<div class="profile-phone-text">${esc(user.phone)}</div>` : ''}
                </div>
                <button id="authCloseBtn" class="profile-close-round">${SVG_X}</button>
            </div>
        </div>

        <div class="profile-body-pad">
            <div class="profile-actions">
                <button id="profileShowOrders" class="profile-action-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2" stroke-linecap="round" class="mb-8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <span class="btn-title">Orders</span>
                    <span class="btn-sub">View history</span>
                </button>
                <button id="profileShowAddress" class="profile-action-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2" stroke-linecap="round" class="mb-8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span class="btn-title">Address</span>
                    <span class="btn-sub">Manage delivery</span>
                </button>
            </div>

            <div id="profileSection" class="profile-section-min"></div>

            <div class="divider-h-1-mb-14"></div>

            <button id="profileLogoutBtn" class="logout-btn-premium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
            </button>
        </div>
    `;


    modalEl.classList.add('open');
    document.body.classList.add('no-scroll');

    document.getElementById('authCloseBtn').addEventListener('click', () => {
        modalEl.classList.remove('open');
        document.body.classList.remove('no-scroll');
    });

    document.getElementById('profileLogoutBtn').addEventListener('click', async () => {
        await API.logout();
        State.set('user', null);
        localStorage.removeItem('guestCart');
        localStorage.removeItem('guestWishlist');
        Toast.info('Logged out');
        modalEl.classList.remove('open');
        document.body.classList.remove('no-scroll');
        location.reload();
    });

    // Wire up buttons
    document.getElementById('profileShowOrders').addEventListener('click', async () => {
        const sec = document.getElementById('profileSection');
        sec.innerHTML = '<p class="text-secondary-small">Loading...</p>';
        const orders = await API.getOrders();
        if (!orders || orders.length === 0) {
            sec.innerHTML = '<p class="text-secondary-small p-8-0">No orders placed yet.</p>';
            return;
        }
        const statusStyles = { delivered:{bg:'#f0fdf4',color:'#16a34a'}, pending:{bg:'#fffbeb',color:'#d97706'}, processing:{bg:'#eff6ff',color:'#2563eb'}, cancelled:{bg:'#fef2f2',color:'#dc2626'} };
        sec.innerHTML = `<div class="max-h-280 overflow-y-auto">` + orders.map(o => {
            const s = statusStyles[o.status] || {bg:'#f3f4f6',color:'#6b7280'};
            const date = new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
            return `<div class="order-card-compact">
                <div class="order-header-row">
                    <div>
                        <div class="order-id-text">Order #${esc(o.id)}</div>
                        <div class="order-meta-sub">${esc(date)} · ${esc((o.payment_method||'COD').toUpperCase())}</div>
                    </div>
                    <span class="status-pill" data-status="${o.status}">${esc(o.status)}</span>
                </div>
                <div class="order-footer-row">
                    <span class="order-meta-sub">${o.item_count ? o.item_count+' item'+(o.item_count>1?'s':'') : ''}</span>
                    <span class="order-total-text">₹${parseFloat(o.total_amount).toLocaleString('en-IN')}</span>
                </div>
            </div>`;
        }).join('') + `</div>`;
    });

    document.getElementById('profileShowAddress').addEventListener('click', async () => {
        const sec = document.getElementById('profileSection');
        const profileRes = await API.getProfile();
        const p = profileRes.ok ? profileRes.data : {};
        sec.innerHTML = `
            <div class="p-4-0">
                <input id="editName" class="auth-input mb-8" placeholder="Full name">
                <input id="editPhone" class="auth-input mb-8" placeholder="Phone">
                <textarea id="editAddress" class="auth-input resize-none-mb-8" rows="3" placeholder="Delivery address"></textarea>
                <button id="saveAddressBtn" class="auth-submit mt-4">Save</button>
            </div>
        `;
        document.getElementById('editName').value = p.name || '';
        document.getElementById('editPhone').value = p.phone || '';
        document.getElementById('editAddress').value = p.address || '';
        document.getElementById('saveAddressBtn').addEventListener('click', async () => {
            const name    = document.getElementById('editName').value.trim();
            const phone   = document.getElementById('editPhone').value.trim();
            const address = document.getElementById('editAddress').value.trim();
            const res = await API.updateProfile(name, phone, address);
            if (res.ok) {
                State.set('user', { ...State.get('user'), name, phone, address });
                Toast.success('Details saved');
            } else {
                Toast.error('Could not save');
            }
        });
    });

    // Auto-load orders by default
    document.getElementById('profileShowOrders').click();
}

export const Auth = {
    init() {
        if (_authInitialized) return;
        _authInitialized = true;
        const self = this;
        window.addEventListener('open-auth', () => {
            const user = State.get('user');
            if (user) {
                openProfileModal(user);
            } else {
                openModal('login');
            }
        });
        this.checkSession();
    },

    async checkSession() {
        const res = await API.getProfile();
        if (res.ok && res.data && res.data.id) State.set('user', res.data);
    },

    async logout() {
        await API.logout();
        State.set('user', null);
        localStorage.removeItem('guestCart');
        localStorage.removeItem('guestWishlist');
        Toast.info('Logged out');
        location.reload();
    },

    openLogin() { openModal('login'); },
    openRegister() { openModal('register'); },
    close,
};
