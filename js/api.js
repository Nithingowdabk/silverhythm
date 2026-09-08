// js/api.js — API Abstraction Layer

const BASE = 'api';

async function getCsrfToken() {
    const r = await fetch('api/auth.php?action=csrf', { credentials: 'same-origin' });
    const d = await r.json();
    return d.token;
}

async function request(url, options = {}) {
    try {
        const res = await fetch(url, { credentials: 'same-origin', ...options });
        const data = await res.json();
        if (!res.ok) {
            return { ok: false, status: res.status, message: data.message || 'Request failed', data: null };
        }
        return { ok: true, status: res.status, data, message: null };
    } catch (err) {
        return { ok: false, status: 0, message: 'Network error', data: null };
    }
}

export const API = {
    // Products
    async getProducts(brand, limit = 24, offset = 0) {
        // In-memory cache: key by brand+limit+offset, TTL 5 minutes
        if (!this._productCache) this._productCache = new Map();
        const cacheKey = `${brand}|${limit}|${offset}`;
        const cached = this._productCache.get(cacheKey);
        if (cached && (Date.now() - cached.ts < 5 * 60 * 1000)) {
            return cached.data;
        }

        let url = brand ? `${BASE}/products.php?brand=${brand}` : `${BASE}/products.php`;
        url += `${brand ? '&' : '?'}limit=${limit}&offset=${offset}`;
        const result = await request(url);
        if (!result.ok) return { products: [], total: 0, has_more: false };
        const data = result.data;
        const out = Array.isArray(data)
            ? { products: data, total: data.length, has_more: false }
            : { products: data.products || [], total: data.total || 0, has_more: data.has_more || false };

        this._productCache.set(cacheKey, { data: out, ts: Date.now() });
        return out;
    },

    async getProduct(id) {
        const result = await request(`${BASE}/products.php?id=${id}`);
        if (!result.ok) return null;
        const data = result.data;
        return Array.isArray(data) ? data[0] : (data.product || data);
    },

    // Auth
    async login(email, password) {
        return request(`${BASE}/auth.php?action=login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
            },
            body: JSON.stringify({ email, password }),
        });
    },

    async register(name, email, password, phone) {
        return request(`${BASE}/auth.php?action=register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
            },
            body: JSON.stringify({ name, email, password, phone }),
        });
    },

    async getProfile() {
        return request(`${BASE}/auth.php?action=profile`);
    },

    async logout() {
        return request(`${BASE}/auth.php?action=logout`, { 
            method: 'POST',
            headers: { 'X-CSRF-Token': await getCsrfToken() }
        });
    },

    async updateProfile(name, phone, address) {
        return request(`${BASE}/auth.php`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
            },
            body: JSON.stringify({ name, phone, address }),
        });
    },

    // Cart (server-side, auth required)
    async getCart() {
        return request(`${BASE}/cart.php`);
    },

    async addToCart(productId, quantity = 1) {
        return request(`${BASE}/cart.php`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
            },
            body: JSON.stringify({ product_id: productId, quantity }),
        });
    },

    async removeFromCart(cartId) {
        return request(`${BASE}/cart.php?id=${cartId}`, { 
            method: 'DELETE',
            headers: { 'X-CSRF-Token': await getCsrfToken() }
        });
    },

    async updateCartQuantity(cartId, quantity) {
        return request(`${BASE}/cart.php`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
            },
            body: JSON.stringify({ cart_id: cartId, quantity }),
        });
    },

    async clearCart() {
        return request(`${BASE}/cart.php`, { 
            method: 'DELETE',
            headers: { 'X-CSRF-Token': await getCsrfToken() }
        });
    },

    // Orders
    async createOrder(address, paymentMethod = 'cod') {
        return request(`${BASE}/orders.php?action=create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
            },
            body: JSON.stringify({ address, payment_method: paymentMethod }),
        });
    },

    async verifyRazorpayPayment(orderId, paymentId, razorpayOrderId, signature) {
        return request(`${BASE}/orders.php?action=verify_payment`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
            },
            body: JSON.stringify({ 
                order_id: orderId, 
                razorpay_payment_id: paymentId,
                razorpay_order_id: razorpayOrderId,
                razorpay_signature: signature
            }),
        });
    },

    async getOrders() {
        const result = await request(`${BASE}/orders.php?action=list`);
        return result.ok ? result.data : [];
    },

    async getOrder(id) {
        return request(`${BASE}/orders.php?action=get&id=${id}`);
    },

    // Admin Orders
    async updateOrderStatus(orderId, status, paymentStatus) {
        return request(`${BASE}/orders.php?action=update_status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': await getCsrfToken()
            },
            body: JSON.stringify({ order_id: orderId, status, payment_status: paymentStatus }),
        });
    },

    // Settings
    async getSettings() {
        const result = await request(`${BASE}/settings.php`);
        return result.ok ? result.data : {};
    },
};
