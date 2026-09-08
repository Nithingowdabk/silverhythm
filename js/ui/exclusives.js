// js/ui/exclusives.js — Shared logic for brand exclusives page

import { State } from '../state.js';
import { API } from '../api.js?v=2';
import { Cart } from './cart.js?v=2';
import { Auth } from './auth.js';
import { Wishlist } from './wishlist.js';

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

// Set brand to silverythm and initialize components
State.set('brand', 'silverythm');
document.body.setAttribute('data-brand', 'silverythm');
document.body.classList.add('brand-silverythm');

// ── Apply theme IMMEDIATELY to prevent dark flash ────────────────────────────
// Light is the default unless user explicitly chose dark
(function applyThemeEarly() {
    const saved = localStorage.getItem('srTheme');
    // Treat invalid / missing values as light
    if (saved !== 'dark') {
        document.body.classList.add('light');
        if (!['light', 'dark'].includes(saved)) {
            localStorage.removeItem('srTheme'); // clean up any stale value
        }
    }
})();

export const Exclusives = {
    async init() {
        // Init modular UI
        Cart.init();
        Auth.init();
        Wishlist.init();

        this.setupTheme();
        this.setupEventListeners();
        await this.loadGallery();

        // Sync Bag Count
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
                void orb.offsetWidth; // reflow to restart animation
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
        // Load WhatsApp settings
        this.loadSettings();

        // Bottom Nav Actions
        document.getElementById('bnSearch')?.addEventListener('click', () => this.openSearch());
        document.getElementById('bnCart')?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-cart')));
        document.getElementById('bnWishlist')?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-wishlist')));

        document.getElementById('collNavWishBtn')?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-wishlist')));
        document.getElementById('collNavCartBtn')?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-cart')));
        document.getElementById('collNavAccountBtn')?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-auth')));

        // Search Modal events
        document.getElementById('closeSearchBtn')?.addEventListener('click', () => this.closeSearch());
        const smModal = document.getElementById('search-modal');
        if (smModal) {
            smModal.addEventListener('click', (e) => {
                if (e.target === smModal) this.closeSearch();
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

        // Lightbox handling
        const galleryContainer = document.getElementById('exclusivesGalleryContainer');
        const lightbox = document.getElementById('ep-lightbox');
        const lightboxImg = document.getElementById('ep-lightbox-img');
        const lightboxCaption = document.getElementById('ep-lightbox-caption');

        if (galleryContainer && lightbox && lightboxImg && lightboxCaption) {
            galleryContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.ep-card');
                if (!card) return;

                const img = card.querySelector('.ep-card-img');
                const title = card.querySelector('.ep-card-title');
                if (img) {
                    lightboxImg.src = img.src;
                    lightboxImg.alt = img.alt;
                    lightboxCaption.textContent = title ? title.textContent : '';
                    lightbox.classList.add('open');
                    document.body.classList.add('no-scroll');
                }
            });

            const closeLightbox = () => {
                lightbox.classList.remove('open');
                document.body.classList.remove('no-scroll');
                setTimeout(() => {
                    lightboxImg.src = '';
                    lightboxCaption.textContent = '';
                }, 300);
            };

            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox || e.target.closest('.ep-lightbox-close')) {
                    closeLightbox();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('open')) {
                    closeLightbox();
                }
            });
        }
    },

    async loadSettings() {
        let whatsappNumber = '916364051237';
        try {
            const settings = await API.getSettings();
            if (settings.whatsappNumber) {
                whatsappNumber = settings.whatsappNumber.replace(/\D/g, '');
                const waFab = document.getElementById('wa-fab');
                if (waFab) waFab.href = 'https://wa.me/' + whatsappNumber;
                const waFtr = document.querySelector('a.coll-social-btn[aria-label="WhatsApp"]');
                if (waFtr) waFtr.href = 'https://wa.me/' + whatsappNumber;
            }
        } catch (e) { console.warn('Failed to load settings'); }
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
        try {
            const { products } = await API.getProducts('silverythm');
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
        } catch (e) {
            console.error('Search failed', e);
        }
    },

    async loadGallery() {
        const container = document.getElementById('exclusivesGalleryContainer');
        if (!container) return;
        container.innerHTML = '<div class="ep-loading">Loading exclusives gallery...</div>';

        try {
            const response = await fetch('api/exclusives.php');
            const items = await response.json();

            if (!items || items.length === 0) {
                container.innerHTML = '<div class="ep-empty">No exclusive frames uploaded yet.</div>';
                return;
            }

            const CATEGORIES = [
                "OUR EXCLUSIVES",
                "2 IN 1",
                "3 IN 1",
                "4 IN 1",
                "5 IN 1"
            ];

            const grouped = {};
            CATEGORIES.forEach(cat => grouped[cat] = []);

            items.forEach(item => {
                const cat = (item.category || 'OUR EXCLUSIVES').toUpperCase();
                if (grouped[cat]) {
                    grouped[cat].push(item);
                } else {
                    grouped['OUR EXCLUSIVES'].push(item);
                }
            });

            let html = '';
            let hasAnyItems = false;

            CATEGORIES.forEach(cat => {
                const categoryItems = grouped[cat];
                if (categoryItems.length > 0) {
                    hasAnyItems = true;
                    // Format category name for display (e.g., "OUR EXCLUSIVES" -> "Our Exclusive's Gallery", "2 IN 1" -> "2 In 1")
                    const displayName = cat === 'OUR EXCLUSIVES' ? "Our Exclusive's Gallery" : cat.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
                    
                    html += `
                        <section class="ep-category-section">
                            <div class="ep-category-header">
                                <h2 class="ep-category-title">${displayName}</h2>
                                <div class="ep-category-divider">
                                    <span class="cfr-line"></span>
                                    <span class="cfr-diamond">◆</span>
                                    <span class="cfr-line"></span>
                                </div>
                            </div>
                            <div class="ep-grid">
                                ${categoryItems.map(item => {
                                    // Safe URL resolution from root
                                    const imgUrl = item.image_url.startsWith('http') || item.image_url.startsWith('/') 
                                        ? item.image_url 
                                        : '/' + item.image_url;
                                    return `
                                    <div class="ep-card">
                                        <div class="ep-card-img-wrap">
                                            <img src="${imgUrl}" alt="${item.title || 'Exclusive Frame'}" class="ep-card-img" loading="lazy">
                                        </div>
                                        ${item.title ? `<p class="ep-card-title">${item.title}</p>` : ''}
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </section>
                    `;
                }
            });

            if (!hasAnyItems) {
                container.innerHTML = '<div class="ep-empty">No active exclusive frames found.</div>';
            } else {
                container.innerHTML = html;
            }

        } catch (error) {
            console.error('Failed to load exclusives', error);
            container.innerHTML = '<div class="ep-empty">Unable to load exclusives. Please try again.</div>';
        }
    }
};

// Auto-initialize based on body data attribute
document.addEventListener('DOMContentLoaded', () => {
    Exclusives.init();
});
