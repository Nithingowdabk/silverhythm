// js/ui/collections.js — Shared logic for brand collection pages

import { State } from '../state.js';
import { API } from '../api.js?v=2';
import { Cart } from './cart.js?v=2';
import { Auth } from './auth.js';
import { Wishlist } from './wishlist.js';
import { initEnquiryBot } from './enquiry-bot.js';

const SUGGESTIONS_HTML = `
<div class="search-suggestions-container">
    <div class="search-suggest-section">
        <h4 class="search-suggest-title">Trending Searches</h4>
        <div class="search-suggest-tags">
            <span class="search-suggest-tag" data-query="Silver Photoframes">Silver Photoframes</span>
            <span class="search-suggest-tag" data-query="Pooja Essentials">Pooja Essentials</span>
            <span class="search-suggest-tag" data-query="Spiritual Coins">Spiritual Coins</span>
            <span class="search-suggest-tag" data-query="Ganesh">Ganesh Frame</span>
            <span class="search-suggest-tag" data-query="Jewellery">92.5 Jewellery</span>
            <span class="search-suggest-tag" data-query="Hampers">Gift Hampers</span>
        </div>
    </div>
</div>
`;

function renderSearchSuggestions(searchResults, searchInput, handleSearchCallback) {
    if (!searchResults) return;
    searchResults.innerHTML = SUGGESTIONS_HTML;
    searchResults.querySelectorAll('.search-suggest-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = tag.dataset.query;
                if (handleSearchCallback) {
                    handleSearchCallback(searchInput.value);
                } else {
                    searchInput.dispatchEvent(new Event('input'));
                }
                searchInput.focus();
            }
        });
    });
}

const CART_KEY = 'guestCart';

let allProducts = [];
let brand = 'silverythm';

// ── Apply theme IMMEDIATELY to prevent dark flash ────────────────────────────
// Light is the default unless user explicitly chose dark
(function applyThemeEarly() {
    // Add brand class so CSS selectors like body.brand-silverythm work too
    const detectedBrand = document.body.dataset.brand;
    if (detectedBrand) document.body.classList.add('brand-' + detectedBrand);

    const saved = localStorage.getItem('srTheme');
    if (saved !== 'dark') {
        document.body.classList.add('light');
        if (!['light', 'dark'].includes(saved)) {
            localStorage.removeItem('srTheme');
        }
    }
})();

export const Collections = {
    async init(currentBrand) {
        brand = currentBrand;
        
        // Init modular UI
        Cart.init();
        Auth.init();
        Wishlist.init();
        try {
            initEnquiryBot();
        } catch (e) {
            console.warn('Enquiry bot initialization failed:', e);
        }
        
        this.setupTheme();
        this.setupEventListeners();
        await this.loadData();
        
        // Subscribe to state changes
        State.subscribe('cart', () => this.syncBagCount());
        this.syncBagCount();
    },

    setupTheme() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        toggle.style.display = 'flex';
        
        toggle.addEventListener('click', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            document.documentElement.style.setProperty('--x', `${x}px`);
            document.documentElement.style.setProperty('--y', `${y}px`);

            const isLight = document.body.classList.contains('light');
            const orb = document.getElementById('orbSvg');
            if (orb) {
                orb.classList.remove('orb-to-light', 'orb-to-dark');
                void orb.offsetWidth;
                orb.classList.add(isLight ? 'orb-to-dark' : 'orb-to-light');
            }

            const toggleTheme = () => {
                document.body.classList.toggle('light', !isLight);
                localStorage.setItem('srTheme', isLight ? 'dark' : 'light');
            };

            if (!document.startViewTransition) {
                setTimeout(toggleTheme, 220);
                return;
            }

            document.startViewTransition(() => {
                toggleTheme();
            });
        });
    },

    setupEventListeners() {
        // Remove global window functions for CSP compliance
        // window.filter = (cat) => this.filter(cat);
        // window.toggleWish = (id) => this.toggleWish(id);
        // window.addCart = (id) => this.addCart(id);
        // window.go = (id) => window.location.href = 'product.html?id=' + id;

        const grid = document.getElementById('grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card');
                if (!card) return;

                const id = card.dataset.pid;
                
                // Wishlist button
                const wishBtn = e.target.closest('.wish-btn');
                if (wishBtn) {
                    e.stopPropagation();
                    const product = allProducts.find(p => String(p.id) === String(id));
                    if (product) window.dispatchEvent(new CustomEvent('wish-toggle', { detail: product }));
                    return;
                }

                // Add to cart button (skip for silverythm — it uses <a href> to WhatsApp instead)
                const addBtn = e.target.closest('button.btn-add');
                if (addBtn) {
                    e.stopPropagation();
                    this.addCart(id);
                    return;
                }

                // View button or card click
                const viewBtn = e.target.closest('.btn-view');
                const imgClick = e.target.closest('.card-img');
                const nameClick = e.target.closest('.card-name');
                if (viewBtn || imgClick || nameClick) {
                    window.location.href = `product.html?id=${id}`;
                }
            });
        }

        const filtersBar = document.getElementById('filtersBar');
        if (filtersBar) {
            filtersBar.addEventListener('click', (e) => {
                const chip = e.target.closest('.chip');
                if (chip) {
                    this.filter(chip.dataset.cat);
                }
            });
        }

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.applySort(sortSelect.value);
            });
        }

        const viewBtns = document.querySelectorAll('.vt-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const grid = document.getElementById('grid');
                if (grid) grid.classList.toggle('list-view', btn.dataset.view === 'list');
            });
        });

        // Bottom Nav Actions
        const bnSearch = document.getElementById('bnSearch');
        const bnCart = document.getElementById('bnCart');
        const bnWishlist = document.getElementById('bnWishlist');

        if (bnSearch) bnSearch.addEventListener('click', () => this.openSearch());
        if (bnCart) bnCart.addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-cart')));
        
        if (bnWishlist) bnWishlist.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('open-wishlist'));
        });

        // Top Nav Actions
        const collNavWishBtn = document.getElementById('collNavWishBtn');
        if (collNavWishBtn) collNavWishBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('open-wishlist'));
        });

        document.getElementById('collNavCartBtn')?.addEventListener('click', () =>
            window.dispatchEvent(new CustomEvent('open-cart')));
        document.getElementById('collNavAccountBtn')?.addEventListener('click', () =>
            window.dispatchEvent(new CustomEvent('open-auth')));

        // Search Modal events
        const closeSearchBtn = document.getElementById('closeSearchBtn');
        if (closeSearchBtn) {
            closeSearchBtn.addEventListener('click', () => this.closeSearch());
        }
        const sm = document.getElementById('search-modal');
        if (sm) {
            sm.addEventListener('click', (e) => {
                if (e.target === sm) this.closeSearch();
            });
        }
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        if (searchInput && searchResults) {
            searchInput.addEventListener('input', () => {
                if (!searchInput.value.trim()) {
                    renderSearchSuggestions(searchResults, searchInput, (v) => this.handleSearch(v));
                } else {
                    this.handleSearch(searchInput.value);
                }
            });
            searchInput.addEventListener('focus', () => {
                if (!searchInput.value.trim()) {
                    renderSearchSuggestions(searchResults, searchInput, (v) => this.handleSearch(v));
                }
            });
            renderSearchSuggestions(searchResults, searchInput, (v) => this.handleSearch(v));
        }
    },

    async loadData() {
        try {
            const settings = await API.getSettings();
            if (settings.whatsappNumber) {
                const waNum = settings.whatsappNumber.replace(/\D/g, '');
                this.waNumber = waNum;
                State.set('whatsappNumber', waNum);
                const waFab = document.getElementById('wa-fab');
                if (waFab) waFab.href = 'https://wa.me/' + waNum;
            }
          try {
            const { products } = await API.getProducts(brand);
            allProducts = products;
            this.renderCategoryChips(allProducts);
            this.render(allProducts);

            // Fix: Listen for wishlist updates to ensure hearts render correctly 
            // even if sort/filter is applied before initial load finishes
            State.subscribe('wishlist', () => {
                const sortVal = document.getElementById('sortSelect')?.value || 'default';
                this.applySort(sortVal);
            });
        } catch (e) {
            const grid = document.getElementById('grid');
            if (grid) grid.innerHTML = '<div class="grid-empty"><div class="ge-icon">✦</div><h3>Unable to load collection</h3><p>Please check your connection or try again shortly.</p></div>';
        }
    },

    renderCategoryChips(products) {
        const chipsRow = document.querySelector('.chips-row');
        if (!chipsRow) return;

        const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
        let html = `<button class="chip active" data-cat="all">All Pieces</button>`;
        categories.forEach(cat => {
            const formatted = cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            html += `<button class="chip" data-cat="${cat}">${formatted}</button>`;
        });
        chipsRow.innerHTML = html;
    },

    render(products) {
        const waNumber = this.waNumber || '916364051237';
        const isSilverythmPage = brand === 'silverythm';

        const heroCount = document.getElementById('heroCount');
        if (heroCount) heroCount.textContent = products.length;
        
        const grid = document.getElementById('grid');
        const cnt = document.getElementById('filterCount');
        if (cnt) cnt.textContent = `${products.length} Masterpiece${products.length === 1 ? '' : 's'}`;

        if (!grid) return;

        if (!products.length) {
            grid.innerHTML = `
              <div class="grid-empty">
                <div class="ge-icon">✦</div>
                <h3>No Sacred Offerings in this Category</h3>
                <p>Explore all available sanctum masterpieces or request a bespoke commission from our Bengaluru atelier.</p>
                <button class="btn-reset-filters" type="button" id="resetCatBtn">View All Pieces</button>
              </div>
            `;
            const resetBtn = document.getElementById('resetCatBtn');
            if (resetBtn) resetBtn.addEventListener('click', () => this.filter('all'));
            return;
        }

        grid.innerHTML = products.map((p, i) => {
            const isSilverythmProduct = p.brand === 'silverythm';
            const priceNum = p.price ? Number(String(p.price).replace(/,/g, '')) : 0;
            const price = priceNum
                ? '₹' + priceNum.toLocaleString('en-IN')
                : (isSilverythmProduct ? 'By Consultation' : 'Enquire');
            const wished = this.isWished(p.id);

            const currentUrl = `${window.location.origin}/product.html?id=${p.id}`;
            const waText = encodeURIComponent(
                `Namaste Silverhythm! 🙏\n\nI am interested in the ${p.name}${priceNum ? ` (${price})` : ''}.\nCould you please share customisation options, sanctum dimensions, and availability?\n\nProduct Link: ${currentUrl}`
            );
            const waHref = `https://wa.me/${waNumber}?text=${waText}`;

            const brandBadgeText = isSilverythmProduct
                ? '999.9 PURE SILVER'
                : (p.brand === 'devaramane' ? '92.5 TEMPLE SILVER' : '999.9 SILVER COATED');

            const actionBtn = isSilverythmProduct
                ? `<a href="${waHref}" target="_blank" rel="noopener noreferrer" class="btn-card-action btn-enquire">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    <span>Enquire</span>
                   </a>`
                : `<button class="btn-card-action btn-add" type="button">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <span>Add to Bag</span>
                   </button>`;

            const categoryFormatted = p.category
                ? p.category.replace(/-/g, ' ').toUpperCase()
                : 'SACRED SANCTUM';

            return `
<div class="product-card ${isSilverythmProduct ? 'card-silverythm' : ''}" data-pid="${p.id}" style="--delay: ${i * 0.04}s">
  <div class="card-media-wrap">
    <div class="card-img" role="button" tabindex="0" aria-label="View ${p.name}">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      
      <!-- Floating Purity / Brand Badge -->
      <div class="card-purity-badge">
        <span class="cpb-sparkle">✦</span>
        <span>${brandBadgeText}</span>
      </div>

      <!-- Floating Glass Wishlist Button -->
      <button class="wish-btn ${wished ? 'wishlisted' : ''}"
              data-wish-id="${p.id}"
              aria-label="Wishlist"
              type="button">
        <svg width="15" height="15" viewBox="0 0 24 24"
             fill="${wished ? 'currentColor' : 'none'}"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="card-body">
    <div class="card-meta">
      <span class="card-category">✦ ${categoryFormatted}</span>
      ${p.size ? `<span class="card-meta-dot">·</span><span class="card-size">${p.size}</span>` : ''}
    </div>

    <h3 class="card-name" title="${p.name}">${p.name}</h3>

    <div class="card-pricing-row">
      <div class="card-price">${price}</div>
      <span class="card-hallmark-tag">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>BIS 999.9</span>
      </span>
    </div>

    <div class="card-actions-row">
      ${actionBtn}
      <button class="btn-card-inspect btn-view" type="button" aria-label="View Details of ${p.name}">
        <span>Details</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  </div>
</div>`;
        }).join('');

        // Handle image errors programmatically
        const cards = grid.querySelectorAll('.product-card');
        cards.forEach((card, i) => {
            const img = card.querySelector('img');
            if (img) {
                img.addEventListener('error', function() {
                    card.querySelector('.card-img')?.classList.add('img-error');
                    this.classList.add('hidden');
                }, { once: true });
            }
        });
    },

    filter(cat) {
        document.querySelectorAll('.chip').forEach(b =>
            b.classList.toggle('active', b.dataset.cat === cat));
        this.render(cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat));
    },'all' ? allProducts : allProducts.filter(p => p.category === cat));
    },

    addCart(id) {
        // Use loose equality to match string IDs with number IDs
        const p = allProducts.find(x => x.id == id);
        if (!p) return;
        
        // Use window event to leverage modular Cart.js addToCart
        window.dispatchEvent(new CustomEvent('add-to-cart', { detail: p }));
    },

    openSearch() {
        const sm = document.getElementById('search-modal');
        if (sm) {
            sm.classList.add('open');
            document.body.classList.add('no-scroll');
            setTimeout(() => document.getElementById('searchInput')?.focus(), 350);
        }
    },

    closeSearch() {
        const sm = document.getElementById('search-modal');
        if (sm) {
            sm.classList.remove('open');
            document.body.classList.remove('no-scroll');
        }
    },

    async handleSearch(query) {
        const results = document.getElementById('searchResults');
        if (!results) return;
        
        const q = query.trim().toLowerCase();
        if (q.length < 2) {
            const searchInput = document.getElementById('searchInput');
            renderSearchSuggestions(results, searchInput, (v) => this.handleSearch(v));
            return;
        }

        let products = allProducts;
        if (!products.length) {
            const res = await API.getProducts(brand);
            products = res.products;
        }

        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.category && p.category.toLowerCase().includes(q))
        ).slice(0, 8);

        if (filtered.length === 0) {
            results.innerHTML = `<div class="search-empty">No results for "${query}"</div>`;
            return;
        }

        results.innerHTML = filtered.map(p => `
            <a href="product.html?id=${p.id}" class="search-item">
                <img src="${p.image}" alt="${p.name}">
                <div class="search-item-info">
                    <div class="search-item-name">${p.name}</div>
                    <div class="search-item-price">${p.price ? '₹'+p.price : 'Enquire'}</div>
                </div>
            </a>
        `).join('');
    },

    applySort(val) {
        const currentCat = document.querySelector('.chip.active')?.dataset.cat || 'all';
        let list = currentCat === 'all' ? [...allProducts] : allProducts.filter(p => p.category === currentCat);
        if (val === 'price-asc')  list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        if (val === 'price-desc') list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        if (val === 'newest')     list.sort((a, b) => b.id - a.id);
        this.render(list);
    },

    toast(msg) {
        const wrap = document.getElementById('toast-wrap');
        if (!wrap) return;
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        wrap.appendChild(t);
        setTimeout(() => t.classList.add('show'), 100);
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 500);
        }, 3000);
    },

    syncBagCount() {
        try {
            const count = State.getCartCount();
            [document.getElementById('bag-count'), document.getElementById('nav-bag-count')].forEach(badge => {
                if (!badge) return;
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            });
        } catch (e) { }
    },

    isWished(id) {
        return State.isWished(id);
    }
};

// Auto-initialize based on body data attribute
document.addEventListener('DOMContentLoaded', () => {
    const brand = document.body.dataset.brand;
    if (brand) {
        Collections.init(brand);
    }
});
