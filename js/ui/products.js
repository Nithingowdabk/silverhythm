// js/ui/products.js — Product Grid + Cards with Brand-Aware Behavior

import { State } from '../state.js';
import { API } from '../api.js';
import { ThemeEngine } from '../theme.js';

const SVG_PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const SVG_WA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';

function createSkeletons(count = 4) {
    return Array.from({ length: count }, () =>
        `<div class="skeleton-card">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton skeleton-line skeleton-line-med"></div>
                <div class="skeleton skeleton-line skeleton-line-short"></div>
                <div class="skeleton skeleton-line skeleton-line-price"></div>
            </div>
        </div>`
    ).join('');
}

/**
 * Brand-aware badge, price, and CTA rendering.
 * 
 * SILVERHYTHM: No price shown, CTA = "Enquire", quick-add opens WhatsApp.
 * DEVARAMANE: Price shown, CTA = "Add", quick-add adds to cart.
 * UDUGORE: Price shown, CTA = "Add", quick-add adds to cart.
 */
function createCard(product, index = 1) {
    const isSilverythm = product.brand === 'silverythm';
    const isDevaramane = product.brand === 'devaramane';

    // Brand-specific badge
    const badge = isSilverythm ? 'Pure Silver' : (isDevaramane ? 'Jewellery' : 'Gifting');

    // Silverythm: never show price on card. Others: show ₹ price.
    const priceText = isSilverythm ? 'By Consultation' : (product.price ? `₹${product.price}` : 'Enquire');

    // Silverythm: "Enquire". Others: "Add".
    const ctaLabel = isSilverythm ? 'Enquire' : 'Add';

    const wishlist = State.get('wishlist') || [];
    const wishlisted = wishlist.some(i => String(i.id) === String(product.id) || String(i.product_id) === String(product.id));

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-card-img">
            <img src="${product.image}" alt="${product.name}" loading="${index === 0 ? 'eager' : 'lazy'}">
            <button class="wish-btn ${wishlisted ? 'wishlisted' : ''}" 
                    data-wish-id="${product.id}"
                    aria-label="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
            <div class="product-card-overlay"></div>
            ${isSilverythm ? '' : `
            <button class="product-card-quick visible" data-quick-add aria-label="Add to cart">
                ${SVG_PLUS}
            </button>
            `}
        </div>
        <div class="product-card-body">
            <span class="product-badge">${badge}</span>
            <h3 class="product-card-name line-clamp-2">${product.name}</h3>
            <div class="product-card-footer">
                <span class="product-card-price">${priceText}</span>
                <span class="product-card-cta">${ctaLabel}</span>
            </div>
        </div>
    `;

    // Quick add button
    const quickAddBtn = card.querySelector('[data-quick-add]');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isSilverythm) {
                const productURL = window.location.href;
                const waText = `Hi, I'm interested in "${product.name}".\nProduct link: ${productURL}\nPlease share details and pricing.`;
                const waLink = `https://wa.me/${State.get('whatsappNumber') || '916364051237'}?text=${encodeURIComponent(waText)}`;
                window.open(waLink, '_blank');
            } else {
                window.dispatchEvent(new CustomEvent('add-to-cart', { detail: product }));
            }
        });
    }

    // Wishlist button — direct listener (not delegation) to avoid JSON parse issues
    card.querySelector('.wish-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('wish-toggle', { detail: product }));
    });

    // Open modal on card click
    card.addEventListener('click', (e) => {
        if (e.target.closest('[data-quick-add]')) return;
        if (e.target.closest('[data-wish-id]')) return;
        window.location.href = 'product.html?id=' + product.id;
    });
    return card;
}

/**
 * Brand-specific section labels per brand.
 */
const SECTION_COPY = {
    silverythm: { label: 'Pure Silver Frames', title: 'The Silverhythm Collection' },
    devaramane: { label: 'Gold & Silver Jewellery', title: 'Devaramane Jewellery' },
    udugore:    { label: 'Curated Gifts & Hampers', title: 'Udugore Gift Collection' },
};

export const Products = {
    init() {
        this.load();
        
        State.subscribe('wishlist', () => {
            const wishlist = State.get('wishlist') || [];
            document.querySelectorAll('.products-section .wish-btn').forEach(btn => {
                const id = btn.getAttribute('data-wish-id');
                if (!id) return;
                const isWished = wishlist.some(i => String(i.id) === String(id) || String(i.product_id) === String(id));
                btn.classList.toggle('wishlisted', isWished);
                btn.setAttribute('aria-label', isWished ? 'Remove from wishlist' : 'Add to wishlist');
                const svg = btn.querySelector('svg');
                if (svg) svg.setAttribute('fill', isWished ? 'currentColor' : 'none');
            });
        });
    },

    async load() {
        const section = document.getElementById('products-section');
        const brand = State.get('brand');
        const copy = SECTION_COPY[brand] || SECTION_COPY.silverythm;

        section.className = 'products-section';
        section.setAttribute('data-brand', brand);
        section.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <span class="section-label">${copy.label}</span>
                    <h2 class="section-title">${copy.title}</h2>
                </div>
                <div class="product-grid" id="product-grid">${createSkeletons(4)}</div>
            </div>
        `;

        const { products } = await API.getProducts(brand);
        const displayed = products.slice(0, 10);
        State.set('products', products);
        const grid = document.getElementById('product-grid');

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="full-span-grid-center">
                    <p class="fs-14">No products found in this collection yet.</p>
                    <p class="fs-12 op-06-mt-4">Check back soon or explore other brands.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        displayed.forEach((p, i) => {
            const card = createCard(p, i);
            card.style.setProperty('--card-anim', `fadeInUp 0.4s ${i * 0.06}s both`);
            card.classList.add('animate-card');
            grid.appendChild(card);
        });

        grid.addEventListener('click', (e) => {
            const wishBtn = e.target.closest('[data-action="wish-toggle"]');
            if (wishBtn) {
                e.stopPropagation();
                const product = JSON.parse(wishBtn.dataset.product);
                window.dispatchEvent(new CustomEvent('wish-toggle', { detail: product }));
            }
        });

        // Add View All section
        const container = grid.parentElement;
        const existingViewAll = container.querySelector('.view-all-container');
        if (existingViewAll) existingViewAll.remove();

        const viewAllContainer = document.createElement('div');
        viewAllContainer.className = 'view-all-container flex flex-col items-center mt-12 pb-8';
        
        const count = products.length;
        const brandPages = {
            silverythm: 'silverythm-collections.html',
            devaramane: 'devaramane-collections.html',
            udugore: 'udugore-collections.html'
        };
        const page = brandPages[brand] || 'silverythm-collections.html';

        const btnLabel = count > 10 ? `Explore All ${count} Pieces` : `View Full Collection`;
        const subText = count > 10 ? `Showing ${Math.min(count,10)} of ${count}` : `Complete Collection`;
        viewAllContainer.innerHTML = `
            <div class="view-all-box">
                <p class="view-all-sub">${subText}</p>
                <a href="${page}" class="view-all-btn">
                    ${btnLabel}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
            </div>`;
        container.appendChild(viewAllContainer);
    },
};
