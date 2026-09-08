// js/app.js — Application Entry Point

import { State } from './state.js';
import { Router } from './router.js';
import { ThemeEngine } from './theme.js';
import { Header } from './ui/header.js';
import { Products } from './ui/products.js';
import { ProductModal } from './ui/product-modal.js';
import { Cart } from './ui/cart.js?v=2';
import { Auth } from './ui/auth.js';
import { Wishlist } from './ui/wishlist.js';
import { initEnquiryBot } from './ui/enquiry-bot.js';
import { API } from './api.js?v=2';
import { initSupportModal, renderLegalModal } from './modals.js';
import {
    renderHero,
    renderMarquee,
    renderSizesCarousel,
    renderWallPreviewSection,
    renderBrandSpecificSection,
    renderStory,
    renderFeatures,
    renderTestimonials,
    renderReels,
    renderContact,
    renderAboutTeaser,
    renderFooter,
    renderWhatsAppFab,
    renderInstagramFab,
    applyBrandClosingTheme,
} from './renderers.js?v=10';

let _scrollObserver = null;

async function boot() {
    initSupportModal();

    const settings = await API.getSettings();
    State.set('whatsappNumber', settings.whatsappNumber || '916364051237');

    function updateCanonical(brand) {
        const canon = document.getElementById('canonical-url');
        if (!canon) return;
        canon.href = brand && brand !== 'silverythm'
            ? 'https://silverhythm.com/?brand=' + brand
            : 'https://silverhythm.com/';
    }

    State.subscribe('brand', (brand) => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.body.setAttribute('data-brand', brand);

        updateCanonical(brand);

        Header.render();
        renderHero();
        renderMarquee();
        renderSizesCarousel();
        renderWallPreviewSection();
        renderBrandSpecificSection(initDepthCarousel);
        Products.init();
        renderStory();
        renderAboutTeaser();
        renderFeatures();
        renderReels();
        renderTestimonials();
        renderContact();
        renderFooter();
        renderLegalModal();
        renderWhatsAppFab();
        renderInstagramFab();

        setTimeout(applyBrandClosingTheme, 100);
        setTimeout(initScrollAnimations, 300);
    });

    Router.init();
    updateCanonical(State.get('brand'));

    document.body.setAttribute('data-brand', State.get('brand'));

    ThemeEngine.init();
    Header.init();

    ProductModal.init();
    Cart.init();
    Auth.init();
    Wishlist.init();
    initEnquiryBot();

    renderReels();
    renderWhatsAppFab();
    renderInstagramFab();
    initScrollAnimations();

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (searchInput && searchResults) {
        const esc = (str) => {
            const d = document.createElement('div');
            d.textContent = str ?? '';
            return d.innerHTML;
        };

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

        const renderSuggestions = () => {
            searchResults.innerHTML = SUGGESTIONS_HTML;
            searchResults.querySelectorAll('.search-suggest-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    searchInput.value = tag.dataset.query;
                    searchInput.dispatchEvent(new Event('input'));
                    searchInput.focus();
                });
            });
        };

        let _searchTimer = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(_searchTimer);
            if (!searchInput.value.trim()) {
                renderSuggestions();
                return;
            }
            _searchTimer = setTimeout(() => {
                const q = searchInput.value.trim().toLowerCase();
                const products = State.get('products') || [];
                const matches = products.filter(p =>
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q) ||
                    (p.brand || '').toLowerCase().includes(q)
                ).slice(0, 8);
                if (matches.length === 0) {
                    searchResults.innerHTML = `<div class="search-empty-container">
                        <p class="search-empty-title">No results for "<strong>${esc(searchInput.value)}</strong>"</p>
                        <p class="search-empty-sub">Try a different name or browse by brand below</p>
                    </div>`;
                    return;
                }
                searchResults.innerHTML = matches.map(p => `
                    <div class="search-result-item" data-id="${p.id}">
                        <div class="search-result-item-wrap">
                            <img src="${p.image}" alt="${p.name}" loading="lazy" class="search-result-img">
                            <div class="search-result-info-box">
                                <div class="search-result-name-text">${p.name}</div>
                                <div class="search-result-meta-text">${p.brand} ${p.price ? '· ₹' + p.price : '· By Consultation'}</div>
                            </div>
                        </div>
                    </div>
                `).join('');
                searchResults.querySelectorAll('.search-result-item').forEach(row => {
                    row.addEventListener('click', () => {
                        const product = matches.find(p => String(p.id) === row.dataset.id);
                        if (product) {
                            Header.closeSearch();
                            window.location.href = 'product.html?id=' + product.id;
                        }
                    });
                });
            }, 220);
        });

        searchInput.addEventListener('focus', () => {
            if (!searchInput.value.trim()) {
                renderSuggestions();
            }
        });

        // Initialize immediately
        renderSuggestions();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sm = document.getElementById('search-modal');
            const pm = document.getElementById('productModalOverlay');
            const am = document.getElementById('authModalOverlay');
            const co = document.getElementById('cartDrawer');
            const wd = document.getElementById('wishlistDrawer');
            const sup = document.getElementById('supportModal');
            const leg = document.getElementById('legalModal');
            const pmo = document.getElementById('promoModalOverlay');

            if (sm && sm.classList.contains('open')) { Header.closeSearch(); return; }
            if (pm && pm.classList.contains('open')) { ProductModal.close(); return; }
            if (am && am.classList.contains('open')) { Auth.close(); return; }
            if (co && co.classList.contains('open')) { Cart.close(); return; }
            if (wd && wd.classList.contains('open')) { Wishlist.close(); return; }
            if (sup && sup.classList.contains('open')) { 
                sup.classList.remove('open'); 
                document.body.classList.remove('no-scroll');
                return; 
            }
            if (leg && leg.classList.contains('open')) { window.closeLegalModal(); return; }
            if (pmo && pmo.classList.contains('open')) {
                pmo.classList.remove('open');
                document.body.classList.remove('no-scroll');
                sessionStorage.setItem('promo_modal_seen', 'true');
                return;
            }
        }
    });
}

function initScrollAnimations() {
    if (_scrollObserver) {
        _scrollObserver.disconnect();
        _scrollObserver = null;
    }

    const targets = [
        '.section-header', '.section-label', '.product-card', '.dc-card',
        '.story-img', '.story-step', '.feature-item', '.feature-premium-card',
        '.footer-col-title',
    ];

    targets.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, i) => {
            el.classList.add('anim-hidden');
            if (i < 6) el.style.transitionDelay = `${i * 0.08}s`;
        });
    });

    _scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                _scrollObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.anim-hidden').forEach(el => _scrollObserver.observe(el));
}

function initDepthCarousel() {
    const root = document.querySelector('.dc-scroll-root');
    const panel = document.getElementById('dcPanel');
    const track = document.getElementById('dcTrack');
    const spacer = document.getElementById('dcSpacer');
    if (!root || !panel || !track || !spacer) return;

    const cards = Array.from(track.querySelectorAll('.dc-card'));
    const dots = Array.from(document.querySelectorAll('.dc-dot'));
    const TOTAL = cards.length;
    const PER_CARD = window.innerHeight * 0.85;
    spacer.style.height = (PER_CARD * TOTAL) + 'px';

    let current = -1;

    function getConfig(offset) {
        if (offset === 0) return { tx: '0%', ry: 0, scale: 1, opacity: 1, z: 10 };
        if (offset === -1) return { tx: '-72%', ry: 28, scale: 0.82, opacity: 0.45, z: 5 };
        if (offset === 1) return { tx: '72%', ry: -28, scale: 0.82, opacity: 0.45, z: 5 };
        const sign = offset < 0 ? -1 : 1;
        return { tx: (sign * 130) + '%', ry: sign * -45, scale: 0.65, opacity: 0, z: 1 };
    }

    function applyCard(card, cfg, animate) {
        card.style.transition = animate
            ? 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.5s ease'
            : 'none';
        card.style.transform = `translateX(${cfg.tx}) rotateY(${cfg.ry}deg) scale(${cfg.scale}) translateZ(0)`;
        card.style.opacity = cfg.opacity;
        card.style.zIndex = cfg.z;
        card.style.pointerEvents = cfg.opacity > 0.1 ? 'auto' : 'none';
    }

    function showCard(index, animate) {
        if (index === current) return;
        current = index;
        cards.forEach((card, i) => {
            const offset = i - index;
            applyCard(card, getConfig(offset), animate);
            card.classList.toggle('dc-card--active', offset === 0);
        });
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function onScroll() {
        const scrolled = -root.getBoundingClientRect().top;
        const index = Math.max(0, Math.min(TOTAL - 1, Math.floor(scrolled / PER_CARD)));
        showCard(index, true);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    const unsubBrand = State.subscribe('brand', () => {
        window.removeEventListener('scroll', onScroll);
        unsubBrand();
    });

    root.style.opacity = '0';
    root.style.transition = 'opacity 0.6s ease';
    const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { root.style.opacity = '1'; io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(root);

    showCard(0, false);
}

// Global error boundary
window.addEventListener('unhandledrejection', (e) => {
    console.error('[Silverhythm] Unhandled promise rejection:', e.reason);
    // Suppress noisy third-party errors
    if (e.reason && String(e.reason).includes('ChunkLoadError')) return;
});

window.onerror = (msg, src, line, col, err) => {
    console.error(`[Silverhythm] JS Error: ${msg} @ ${src}:${line}:${col}`, err);
    return false; // Don't suppress browser's own error UI
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
