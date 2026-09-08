// js/state.js — Reactive State Manager

const _state = {
    brand: 'silverythm',
    user: null,
    cart: [],
    wishlist: [],
    products: [],
};

const _listeners = new Map();

export const State = {
    get(key) {
        return _state[key];
    },

    set(key, value) {
        const old = _state[key];
        _state[key] = value;
        if (_listeners.has(key)) {
            _listeners.get(key).forEach(fn => fn(value, old));
        }
    },

    subscribe(key, callback) {
        if (!_listeners.has(key)) _listeners.set(key, []);
        _listeners.get(key).push(callback);
        // Return unsubscribe function
        return () => {
            const arr = _listeners.get(key);
            const idx = arr.indexOf(callback);
            if (idx > -1) arr.splice(idx, 1);
        };
    },

    // Cart helpers
    getCartCount() {
        return _state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    },

    getCartTotal() {
        return _state.cart.reduce((sum, item) => {
            const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
            return sum + price * (item.quantity || 1);
        }, 0);
    },

    isWished(id) {
        const wishlist = _state.wishlist || [];
        return wishlist.some(i => String(i.id) === String(id) || String(i.product_id) === String(id));
    },
};
