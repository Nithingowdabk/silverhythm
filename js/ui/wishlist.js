// js/ui/wishlist.js — Wishlist system with guest (localStorage) + auth (API) support

import { State } from '../state.js';
import { Toast } from './toast.js';
import { SVG } from '../icons.js';
let _wishlistInitialized = false;

const GUEST_KEY = 'guestWishlist';

function getGuestWishlist() {
    try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; }
    catch { return []; }
}

function saveGuestWishlist(list) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(list));
}

async function toggleWishlist(product) {
    const user = State.get('user');

    if (user) {
        // Authenticated — use API
        try {
            const csrfRes = await fetch('api/auth.php?action=csrf');
            const { token } = await csrfRes.json();
            const res = await fetch(`api/wishlist.php`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token
                },
                body: JSON.stringify({ product_id: product.id })
            });
            const data = await res.json();
            if (data.success) {
                updateHeartIcons(product.id, data.wishlisted);
                State.set('wishlist', await fetchServerWishlist());
                Toast.success(data.wishlisted ? `Added to wishlist` : `Removed from wishlist`);
                return data.wishlisted;
            }
        } catch(e) {
            Toast.error('Could not update wishlist');
        }
    } else {
        // Guest — use localStorage
        const list = getGuestWishlist();
        const idx = list.findIndex(i => i.id === product.id);
        if (idx > -1) {
            list.splice(idx, 1);
            saveGuestWishlist(list);
            updateHeartIcons(product.id, false);
            State.set('wishlist', list);
            Toast.info('Removed from wishlist');
            return false;
        } else {
            list.push({ ...product });
            saveGuestWishlist(list);
            updateHeartIcons(product.id, true);
            State.set('wishlist', list);
            Toast.success('Added to wishlist');
            return true;
        }
    }
}

function updateHeartIcons(productId, wishlisted) {
    document.querySelectorAll(`[data-wish-id="${productId}"]`).forEach(btn => {
        btn.classList.toggle('wishlisted', wishlisted);
        btn.setAttribute('aria-label', wishlisted ? 'Remove from wishlist' : 'Add to wishlist');
        const svg = btn.querySelector('svg');
        if (svg) {
            svg.setAttribute('fill', wishlisted ? 'currentColor' : 'none');
            svg.classList.toggle('active', wishlisted);
        }
    });
}

async function fetchServerWishlist() {
    try {
        const res = await fetch('api/wishlist.php', { credentials: 'same-origin' });
        return await res.json();
    } catch { return []; }
}

async function isWishlisted(productId) {
    return State.isWished(productId);
}

async function syncGuestWishlistToServer() {
    const gList = getGuestWishlist();
    if (gList.length > 0) {
        const csrfRes = await fetch('api/auth.php?action=csrf');
        const { token } = await csrfRes.json();
        for (const item of gList) {
            await fetch('api/wishlist.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token
                },
                body: JSON.stringify({ product_id: item.id })
            });
        }
        localStorage.removeItem(GUEST_KEY);
    }
    const serverList = await fetchServerWishlist();
    State.set('wishlist', serverList);
}

function createHeartButton(product, extraClasses = '') {
    const isActive = State.isWished(product.id);
    const btn = document.createElement('button');
    btn.className = `wish-btn ${extraClasses} ${isActive ? 'wishlisted' : ''}`;
    btn.dataset.wishId = product.id;
    btn.setAttribute('aria-label', isActive ? 'Remove from wishlist' : 'Add to wishlist');
    btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isActive ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    `;
    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleWishlist(product);
    });
    return btn;
}



function openWishlistDrawer() {
    try {
        let drawer = document.getElementById('wishlistDrawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'wishlistDrawer';
            drawer.className = 'wishlist-drawer';
            drawer.innerHTML = `
                <div id="wishlistBackdrop" class="wishlist-backdrop"></div>
                <div id="wishlistPanel" class="wishlist-panel">
                    <div class="wishlist-header">
                        <h3>Wishlist</h3>
                        <button id="wishlistCloseBtn" class="wishlist-close-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <div id="wishlistItems" class="wishlist-items"></div>
                </div>
            `;
            document.body.appendChild(drawer);
            
            // Close listeners
            drawer.addEventListener('click', (e) => {
                if (e.target.id === 'wishlistBackdrop' || e.target.closest('#wishlistCloseBtn')) {
                    closeWishlistDrawer();
                }
            });
        }
        
        renderWishlistDrawer();
        
        // Add classes ONLY AFTER successful render
        drawer.classList.add('open');
        document.body.classList.add('no-scroll');
    } catch (err) {
        console.error("Failed to open wishlist drawer", err);
        Toast.error("Could not open wishlist. Please try again.");
    }
}

function closeWishlistDrawer() {
    const drawer = document.getElementById('wishlistDrawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    document.body.classList.remove('no-scroll');
}

function renderWishlistDrawer() {
    try {
        const list = State.get('wishlist') || [];
        const container = document.getElementById('wishlistItems');
        if (!container) return;

        if (!list.length) {
            container.innerHTML = `
                <div class="wishlist-empty">
                    <div class="wishlist-empty-icon">${SVG.wishlist || ''}</div>
                    <div class="wishlist-empty-title">Nothing saved yet</div>
                    <div class="wishlist-empty-sub">Tap ♡ on any product to save it here</div>
                </div>`;
            return;
        }
    container.innerHTML = list.map((item, idx) => `
        <div class="wishlist-item">
            <div class="wishlist-item-img">
                <img src="${item.image}" alt="${item.name || 'Product'}" loading="lazy">
            </div>
            <div class="wishlist-item-info">
                <div class="wishlist-item-name">${item.name || 'Untitled Product'}</div>
                <div class="wishlist-item-price">${item.price ? '₹' + item.price : 'Enquire'}</div>
                <div class="wishlist-item-actions">
                    ${(item.brand === 'silverythm') 
                        ? `<a href="https://wa.me/${State.get('whatsappNumber') || '916364051237'}?text=${encodeURIComponent('Hi, I am interested in ' + (item.name || 'this product') + '. Could you share more details and pricing?')}" 
                              target="_blank" 
                              rel="noopener"
                              class="wish-whatsapp-btn">
                               Enquire
                           </a>`
                        : `<button class="wish-add-cart" data-id="${item.id}">Add to Cart</button>`
                    }
                    <button data-wish-remove="${item.id}" class="wish-remove-btn">Remove</button>
                </div>
            </div>
        </div>
    `).join('');

        // Use event delegation instead of loop
        if (!container.dataset.listener) {
            container.addEventListener('click', async (e) => {
                const addBtn = e.target.closest('.wish-add-cart');
                const removeBtn = e.target.closest('[data-wish-remove]');
                
                if (addBtn) {
                    const id = addBtn.dataset.id;
                    const products = State.get('wishlist') || [];
                    const p = products.find(x => String(x.id) === String(id));
                    if (p) window.dispatchEvent(new CustomEvent('add-to-cart', { detail: p }));
                }
                
                if (removeBtn) {
                    const id = removeBtn.dataset.wishRemove;
                    const products = State.get('wishlist') || [];
                    const p = products.find(x => String(x.id) === String(id) || String(x.product_id) === String(id));
                    if (p) await toggleWishlist(p);
                }
            });
            container.dataset.listener = "true";
        }
    } catch (err) {
        console.error("Critical error in renderWishlistDrawer", err);
    }
}

export const Wishlist = {
    init() {
        if (_wishlistInitialized) return;
        _wishlistInitialized = true;
        window.addEventListener('open-wishlist', openWishlistDrawer);
        window.addEventListener('wish-toggle', (e) => toggleWishlist(e.detail));
        State.subscribe('wishlist', () => renderWishlistDrawer());

        document.body.addEventListener('click', (e) => {
            if (e.target.closest('#wishlistCloseBtn') || e.target.closest('#wishlistBackdrop')) {
                closeWishlistDrawer();
            }
        });

        State.subscribe('user', async (user) => {
            if (user) {
                await syncGuestWishlistToServer();
            } else {
                localStorage.removeItem(GUEST_KEY);
                State.set('wishlist', []);
            }
        });
        const user = State.get('user');
        if (user) {
            fetchServerWishlist().then(list => State.set('wishlist', list));
        } else {
            State.set('wishlist', getGuestWishlist());
        }
    },
    toggle: toggleWishlist,
    createHeartButton,
    open: openWishlistDrawer,
    close: closeWishlistDrawer,
    isWishlisted,
};
