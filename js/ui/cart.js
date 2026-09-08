// js/ui/cart.js — Cart Bottom Sheet (Mobile) / Right Drawer (Desktop)

import { State } from '../state.js';
import { API } from '../api.js?v=2';
import { Toast } from './toast.js';
import { SVG } from '../icons.js';

const GUEST_KEY = 'guestCart';
let _cartInitialized = false;
const SVG_X = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const SVG_EMPTY = '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
const SVG_TRASH = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

function esc(str) { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }

let drawerEl = null;

function ensureDrawer() {
    if (drawerEl) return;
    drawerEl = document.createElement('div');
    drawerEl.className = 'cart-overlay';
    drawerEl.id = 'cartDrawer';
    drawerEl.innerHTML = `
        <div class="cart-backdrop" id="cartBackdrop"></div>
        <div class="cart-panel">
            <div class="cart-handle"></div>
            <div class="cart-header">
                <h3>Your Bag</h3>
                <button id="cartCloseBtn">${SVG_X}</button>
            </div>
            <div class="cart-items" id="cartItemsContainer"></div>
            <div class="cart-footer">
                <div class="cart-total-row">
                    <span class="cart-total-label">Total</span>
                    <span class="cart-total-value" id="cartTotalDisplay">₹0</span>
                </div>
                <button class="cart-checkout-btn" id="checkoutBtn">Proceed to Checkout</button>
            </div>
        </div>
    `;
    document.body.appendChild(drawerEl);
    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
}

function openDrawer() {
    ensureDrawer();
    drawerEl = document.getElementById('cartDrawer');
    if (!drawerEl) return;
    // Measure scrollbar width before locking scroll so desktop doesn't shift
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-compensation', scrollbarW + 'px');
    drawerEl.classList.add('open');
    document.body.classList.add('no-scroll');
    renderCart();
}

function closeDrawer() {
    if (drawerEl) {
        drawerEl.classList.remove('open');
        document.body.classList.remove('no-scroll');
        document.documentElement.style.setProperty('--scrollbar-compensation', '0px');
    }
}

function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotalDisplay');
    const cart = State.get('cart');

    if (!container) return;

    if (!cart || cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                ${SVG_EMPTY}
                <p class="cart-empty-text">Your bag is empty</p>
                <p class="cart-empty-sub">Add items to get started</p>
            </div>
        `;
        totalEl.textContent = '₹0';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, idx) => {
        const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
        total += price * (item.quantity || 1);
        const removeAttr = item.cart_id ? `data-cart-id="${item.cart_id}"` : `data-guest-idx="${idx}"`;
        return `
            <div class="cart-item">
                <div class="cart-item-img"><img src="${item.image}" alt="${esc(item.name)}"></div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${esc(item.name)}</div>
                    <div class="cart-item-brand">${esc(item.brand || '')}</div>
                    <div class="cart-item-row">
                        <span class="cart-item-price">₹${esc(item.price)}</span>
                        <div class="cart-item-qty-controls">
                            <button class="qty-btn" data-action="dec" ${removeAttr}>−</button>
                            <span class="qty-val">${item.quantity || 1}</span>
                            <button class="qty-btn" data-action="inc" data-product-id="${item.product_id || ''}" ${removeAttr}>+</button>
                            <button class="cart-item-remove" ${removeAttr} aria-label="Remove">${SVG_TRASH}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

    container.querySelectorAll('.cart-item-remove[data-cart-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
            await API.removeFromCart(parseInt(btn.dataset.cartId));
            await loadServerCart();
            Toast.info('Item removed');
        });
    });
    container.querySelectorAll('.cart-item-remove[data-guest-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
            const gCart = getGuestCart();
            gCart.splice(parseInt(btn.dataset.guestIdx), 1);
            saveGuestCart(gCart);
            State.set('cart', gCart);
            renderCart();
            Toast.info('Item removed');
        });
    });

    container.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const action = btn.dataset.action;
            const cartId = btn.dataset.cartId ? parseInt(btn.dataset.cartId) : null;
            const guestIdx = btn.dataset.guestIdx !== undefined ? parseInt(btn.dataset.guestIdx) : null;
            const productId = btn.dataset.productId ? parseInt(btn.dataset.productId) : null;

            if (cartId) {
                const cart = State.get('cart');
                const item = cart.find(i => i.cart_id === cartId);
                const currentQty = item ? (item.quantity || 1) : 1;
                if (action === 'inc') {
                    await API.updateCartQuantity(cartId, currentQty + 1);
                } else {
                    await API.updateCartQuantity(cartId, currentQty - 1);
                    if (currentQty === 1) Toast.info('Item removed');
                }
                await loadServerCart();
            } else if (guestIdx !== null) {
                const gCart = getGuestCart();
                if (action === 'inc') {
                    gCart[guestIdx].quantity = (gCart[guestIdx].quantity || 1) + 1;
                } else {
                    if ((gCart[guestIdx].quantity || 1) > 1) {
                        gCart[guestIdx].quantity -= 1;
                    } else {
                        gCart.splice(guestIdx, 1);
                    }
                }
                saveGuestCart(gCart);
                State.set('cart', gCart);
            }
            renderCart();
        });
    });
}

function showOrderConfirmation(orderId, totalPaid, cartSnapshot, checkoutEl) {
    // 1. Close the checkout overlay and cart drawer
    if (checkoutEl) checkoutEl.classList.remove('open');
    closeDrawer();
    document.body.classList.remove('no-scroll');

    // 2. Create and append the confirmation overlay
    let confirmEl = document.getElementById('orderConfirmOverlay');
    if (!confirmEl) {
        confirmEl = document.createElement('div');
        confirmEl.id = 'orderConfirmOverlay';
        confirmEl.className = 'cart-overlay';
        document.body.appendChild(confirmEl);
    }

    const checkSVG = `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto-mb-16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

    confirmEl.innerHTML = `
        <div class="cart-backdrop" id="confirmBackdrop"></div>
        <div class="cart-panel max-h-85vh-flex-col">
            <div class="cart-handle"></div>
            <div class="cart-header">
                <h3>Confirmation</h3>
                <button id="confirmCloseBtn">${SVG_X}</button>
            </div>
            <div class="cart-items cart-confirm-body">
                ${checkSVG}
                <h2 class="confirm-title">Order Placed!</h2>
                <p class="text-secondary-mb-24">Order #${orderId}</p>
                
                <div class="confirm-card">
                    <div class="confirm-summary-label">Order Summary</div>
                    ${cartSnapshot.map(item => `
                        <div class="confirm-item-row">
                            <span class="flex-1-mr-12">${esc(item.name)} <span class="op-06-fs-11">× ${item.quantity || 1}</span></span>
                            <span class="fw-500">₹${(parseFloat(item.price) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                        </div>
                    `).join('')}
                    <div class="confirm-total-row">
                        <span>Total Paid</span>
                        <span>₹${parseFloat(totalPaid || 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <p class="confirm-thanks-msg">
                    Thank you for shopping with us! We'll contact you on WhatsApp shortly to confirm delivery details.
                </p>
            </div>
            <div class="cart-footer p-24-32" style="display: flex; flex-direction: column; gap: 10px;">
                <a href="api/orders.php?action=invoice&id=${orderId}" target="_blank" class="cart-checkout-btn" style="text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; background: #374151; color: #fff;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Bill / Invoice
                </a>
                <button id="confirmFinalBtn" class="cart-checkout-btn">Continue Shopping</button>
            </div>
        </div>
    `;

    confirmEl.classList.add('open');
    document.body.classList.add('no-scroll');

    const closeConfirm = () => {
        confirmEl.classList.remove('open');
        document.body.classList.remove('no-scroll');
    };

    document.getElementById('confirmBackdrop').addEventListener('click', closeConfirm);
    document.getElementById('confirmCloseBtn').addEventListener('click', closeConfirm);
    document.getElementById('confirmFinalBtn').addEventListener('click', closeConfirm);

    // 4. Clear the cart in State
    const currentUser = State.get('user');
    if (currentUser) API.clearCart();
    State.set('cart', []);
    if (!State.get('user')) {
        saveGuestCart([]);
    }
}

async function openCheckout() {
    const user = State.get('user');
    if (!user) {
        window.dispatchEvent(new CustomEvent('open-auth'));
        return;
    }
    const cart = State.get('cart');
    if (!cart || cart.length === 0) return;

    // Fetch latest profile to pre-fill address
    const profileRes = await API.getProfile();
    const profile = profileRes.ok ? profileRes.data : user;

    const total = cart.reduce((sum, item) => {
        return sum + (parseFloat(item.price) || 0) * (item.quantity || 1);
    }, 0);

    // Build checkout overlay
    let checkoutEl = document.getElementById('checkoutOverlay');
    if (!checkoutEl) {
        checkoutEl = document.createElement('div');
        checkoutEl.id = 'checkoutOverlay';
        checkoutEl.className = 'cart-overlay';
        document.body.appendChild(checkoutEl);
    }

    checkoutEl.innerHTML = `
        <div class="cart-backdrop" id="checkoutBackdrop"></div>
        <div class="cart-panel max-h-92vh">
            <div class="cart-handle"></div>
            <div class="cart-header">
                <h3>Checkout</h3>
                <button id="checkoutCloseBtn">${SVG_X}</button>
            </div>
            <div class="cart-items p-16">

                <!-- Order summary -->
                <div class="mb-20">
                    <div class="cart-label-sec">Order Summary</div>
                    ${cart.map(item => `
                        <div class="cart-summary-row">
                            <span class="text-ellipsis-flex">${esc(item.name)} × ${item.quantity || 1}</span>
                            <span class="flex-shrink-0">₹${(parseFloat(item.price) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                        </div>
                    `).join('')}
                    <div class="cart-total-row-summary">
                        <span>Total</span>
                        <span>₹${total.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div class="divider-h-1-mb-20"></div>

                <!-- Delivery details form -->
                <div class="cart-label-sec">Delivery Details</div>

                <input id="coName" class="auth-input mb-10" placeholder="Full name *" autocomplete="name">
                <input id="coPhone" class="auth-input mb-10" placeholder="Phone number *" autocomplete="tel" inputmode="numeric" maxlength="10">
                <input id="coFlat" class="auth-input mb-10" placeholder="Flat / House no. / Building *" autocomplete="address-line1">
                <input id="coStreet" class="auth-input mb-10" placeholder="Street / Area / Locality *" autocomplete="address-line2">
                <input id="coLandmark" class="auth-input mb-10" placeholder="Landmark (optional)">
                <div style="display:flex;gap:8px;margin-bottom:10px;">
                    <input id="coCity" class="auth-input" style="flex:1;" placeholder="City *" autocomplete="address-level2">
                    <input id="coState" class="auth-input" style="flex:1;" placeholder="State *" autocomplete="address-level1">
                </div>
                <input id="coPincode" class="auth-input mb-10" placeholder="PIN code *" autocomplete="postal-code" inputmode="numeric" maxlength="6">
                <div id="addressError" class="hidden text-error-small mt-4 mb-8"></div>


                <div class="divider-h-1-mb-20"></div>

                <!-- Payment method -->
                <div class="cart-label-sec">Payment</div>
                <div class="flex-gap-10 mb-20" id="payMethodGroup">
                    <label class="payment-option selected" id="payOpt_cod">
                        <input type="radio" name="payMethod" value="cod" checked class="accent-radio"> Cash on Delivery
                    </label>
                    <label id="razorpayOption" class="payment-option" id="payOpt_razorpay">
                        <input type="radio" name="payMethod" value="razorpay" class="accent-radio"> Pay Online
                    </label>
                </div>

                <button id="placeOrderBtn" class="cart-checkout-btn">Place Order — ₹${total.toLocaleString('en-IN')}</button>
                <p class="text-secondary-center-small mt-10">🔒 Secure checkout. Your data is safe.</p>
            </div>
        </div>
    `;

    checkoutEl.classList.remove('open');
    void checkoutEl.offsetWidth; // force reflow to restart any CSS transitions
    checkoutEl.classList.add('open');
    document.body.classList.add('no-scroll');

    document.getElementById('coName').value = profile.name || '';
    document.getElementById('coPhone').value = profile.phone || '';
    
    // Pre-fill address fields by splitting the stored address string
    const storedAddr = profile.address || '';
    const addrParts = storedAddr.split(',').map(s => s.trim());
    document.getElementById('coFlat').value    = addrParts[0] || '';
    document.getElementById('coStreet').value  = addrParts[1] || '';
    document.getElementById('coLandmark').value = addrParts[2] || '';
    document.getElementById('coCity').value    = addrParts[3] || '';
    document.getElementById('coState').value   = addrParts[4] || '';
    document.getElementById('coPincode').value = addrParts[5] || '';


    // JS fallback for CSS :has() — toggle .selected class on payment option labels
    document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.payment-option').forEach(lbl => lbl.classList.remove('selected'));
            if (radio.checked) radio.closest('.payment-option').classList.add('selected');
        });
    });

    document.getElementById('checkoutBackdrop').addEventListener('click', () => {
        checkoutEl.classList.remove('open');
        document.body.classList.remove('no-scroll');
    });
    document.getElementById('checkoutCloseBtn').addEventListener('click', () => {
        checkoutEl.classList.remove('open');
        document.body.classList.remove('no-scroll');
    });

    document.getElementById('placeOrderBtn').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = 'Placing order...';

        const name    = document.getElementById('coName').value.trim();
        const phone   = document.getElementById('coPhone').value.trim();
        
        const flat     = document.getElementById('coFlat').value.trim();
        const street   = document.getElementById('coStreet').value.trim();
        const landmark = document.getElementById('coLandmark').value.trim();
        const city     = document.getElementById('coCity').value.trim();
        const state    = document.getElementById('coState').value.trim();
        const pincode  = document.getElementById('coPincode').value.trim();
        const address  = [flat, street, landmark, city, state, pincode].filter(Boolean).join(', ');

        const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'cod';

        const addressErr = document.getElementById('addressError');
        if (!flat || !street || !city || !state || !pincode) {
            if (addressErr) {
                addressErr.textContent = 'Please fill in all required address fields.';
                addressErr.classList.remove('hidden');
            }
            btn.disabled = false;
            btn.textContent = `Place Order — ₹${total.toLocaleString('en-IN')}`;
            return;
        }
        if (!/^\d{6}$/.test(pincode)) {
            if (addressErr) {
                addressErr.textContent = 'Please enter a valid 6-digit PIN code.';
                addressErr.classList.remove('hidden');
            }
            btn.disabled = false;
            btn.textContent = `Place Order — ₹${total.toLocaleString('en-IN')}`;
            return;
        }
        if (addressErr) addressErr.classList.add('hidden');


        if (!name || !phone) {
            Toast.error('Please fill in your name and phone number');
            btn.disabled = false;
            btn.textContent = `Place Order — ₹${total.toLocaleString('en-IN')}`;
            return;
        }

        // Save address back to profile
        // Only save back if the address differs from what's stored, and name/phone changed
        const currentUser = State.get('user');
        if (name !== (currentUser.name || '') || phone !== (currentUser.phone || '') || address !== (currentUser.address || '')) {
            await API.updateProfile(name, phone, address);
            State.set('user', { ...currentUser, name, phone, address });
        }

        const safeAddress = address;
        const cartSnapshot = [...State.get('cart')];
        const res = await API.createOrder(safeAddress, payMethod);
        if (res.ok) {
            if (payMethod === 'razorpay') {
                btn.textContent = 'Opening Payment Gateway...';
                
                // Load Razorpay SDK if not present
                if (!window.Razorpay) {
                    try {
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                            script.onload = resolve;
                            script.onerror = reject;
                            document.head.appendChild(script);
                        });
                    } catch (err) {
                        Toast.error('Failed to load payment gateway. Please check your network connection.');
                        btn.disabled = false;
                        btn.textContent = `Place Order — ₹${total.toLocaleString('en-IN')}`;
                        return;
                    }
                }

                // Initialize Razorpay checkout options
                const options = {
                    key: res.data.razorpay_key_id,
                    amount: Math.round(parseFloat(res.data.total) * 100),
                    currency: "INR",
                    name: "Silverhythm",
                    description: `Order #${res.data.order_id}`,
                    image: "https://silverhythm.com/assets/images/logo.png",
                    order_id: res.data.razorpay_order_id,
                    handler: async function (response) {
                        btn.textContent = 'Verifying payment...';
                        btn.disabled = true;
                        const verifyRes = await API.verifyRazorpayPayment(
                            res.data.order_id,
                            response.razorpay_payment_id,
                            response.razorpay_order_id,
                            response.razorpay_signature
                        );
                        if (verifyRes.ok) {
                            showOrderConfirmation(res.data.order_id, res.data.total, cartSnapshot, checkoutEl);
                        } else {
                            // Verification failed — let user retry on same Razorpay order (no new order created)
                            Toast.error(verifyRes.message || 'Payment verification failed. Please try again.');
                            btn.disabled = false;
                            btn.textContent = `Place Order — ₹${total.toLocaleString('en-IN')}`;
                            // Re-open the same Razorpay modal for retry
                            rzp.open();
                        }
                    },
                    prefill: {
                        name: name,
                        email: currentUser.email || '',
                        contact: `+91${phone.replace(/^\+91/, '')}`
                    },
                    theme: {
                        color: "#1F2937"
                    },
                    modal: {
                        ondismiss: function() {
                            Toast.info('Payment cancelled. You can try again.');
                            btn.disabled = false;
                            btn.textContent = `Place Order — ₹${total.toLocaleString('en-IN')}`;
                        }
                    }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                showOrderConfirmation(res.data.order_id, res.data.total, cartSnapshot, checkoutEl);
            }
        } else {
            Toast.error(res.message || 'Could not place order');
            btn.disabled = false;
            btn.textContent = `Place Order — ₹${total.toLocaleString('en-IN')}`;
        }
    });
}

function getGuestCart() {
    try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; }
    catch { return []; }
}
function saveGuestCart(cart) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(cart));
}

async function loadServerCart() {
    const res = await API.getCart();
    if (res.ok) State.set('cart', res.data);
}

async function addToCart(product) {
    if (product.brand === 'silverythm') {
        Toast.error('Silverhythm products are consultation-only. Please use WhatsApp.');
        return;
    }

    const user = State.get('user');
    if (user) {
        const res = await API.addToCart(product.id);
        if (res.ok) {
            await loadServerCart();
            Toast.success(`${product.name} added to bag`);
        } else {
            Toast.error(res.message || 'Could not add to cart');
        }
    } else {
        const gCart = getGuestCart();
        const existing = gCart.findIndex(i => i.id === product.id);
        if (existing > -1) {
            gCart[existing].quantity = (gCart[existing].quantity || 1) + 1;
        } else {
            gCart.push({ ...product, quantity: 1 });
        }
        saveGuestCart(gCart);
        State.set('cart', gCart);
        Toast.success(`${product.name} added to bag`);
    }
}

async function syncGuestCart() {
    const gCart = getGuestCart();
    if (gCart.length === 0) return;
    for (const item of gCart) {
        if (item.brand !== 'silverythm') {
            await API.addToCart(item.id, item.quantity || 1);
        }
    }
    localStorage.removeItem(GUEST_KEY);
    await loadServerCart();
}



const handleOpenCart = () => openDrawer();
const handleAddToCart = (e) => addToCart(e.detail);
const handleBodyClick = (e) => {
    if (e.target.closest('#cartCloseBtn') || e.target.closest('#cartBackdrop')) {
        closeDrawer();
    }
};

export const Cart = {
    init() {
        if (_cartInitialized) return;
        _cartInitialized = true;

        // Attach global listeners
        window.addEventListener('open-cart', handleOpenCart);
        window.addEventListener('add-to-cart', handleAddToCart);
        document.body.addEventListener('click', handleBodyClick);

        State.subscribe('cart', () => renderCart());

        const user = State.get('user');
        if (user) { 
            loadServerCart(); 
        } else { 
            State.set('cart', getGuestCart()); 
        }

        State.subscribe('user', async (user) => {
            if (user) { 
                await syncGuestCart(); 
            } else { 
                State.set('cart', []); 
            }
        });

        // Re-sync guest cart whenever brand changes
        // so cart persists across Devaramane ↔ Udugore switches
        State.subscribe('brand', () => {
            const currentUser = State.get('user');
            if (!currentUser) {
                State.set('cart', getGuestCart());
            }
        });
    },
    // For SPA cleanup:
    destroy() {
        window.removeEventListener('open-cart', handleOpenCart);
        window.removeEventListener('add-to-cart', handleAddToCart);
        document.body.removeEventListener('click', handleBodyClick);
        _cartInitialized = false;
    },
    open: openDrawer,
    close: closeDrawer,
};
