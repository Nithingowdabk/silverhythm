// js/ui/product-modal.js — Product Detail Bottom Sheet (Brand-Aware)

import { State } from '../state.js';
import { Toast } from './toast.js';
import { SVG } from '../icons.js';

const SVG_X = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const SVG_WA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
const SVG_BAG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';

let overlay = null;

function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'productModalOverlay';
    overlay.innerHTML = '<div class="modal-content" id="productModalContent"></div>';
    document.getElementById('modal-root').appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

}

function close() {
    if (overlay) {
        overlay.classList.remove('open');
        document.body.classList.remove('no-scroll');
        // After transition, fully hide it so it doesn't block clicks
        setTimeout(() => {
            if (overlay && !overlay.classList.contains('open')) {
                overlay.classList.add('hidden-section');
            }
        }, 400);
    }
}

/**
 * BRAND-SPECIFIC MODAL CONTENT:
 * 
 * SILVERHYTHM:
 *   - Badge: "Pure Silver"
 *   - Subtitle: "999 Pure Silver Frame"
 *   - Price: HIDDEN (show "Price on Consultation")
 *   - CTA: "Buy on WhatsApp" (opens prefilled WhatsApp with product name + URL)
 *   - NO "Add to Cart" button ever
 * 
 * DEVARAMANE:
 *   - Badge: "Jewellery"
 *   - Subtitle: "Traditional Gold & Silver"
 *   - Price: VISIBLE
 *   - CTA: "Add to Cart"
 * 
 * UDUGORE:
 *   - Badge: "Gifting"
 *   - Subtitle: "Curated Gift Collection"
 *   - Price: VISIBLE
 *   - CTA: "Add to Cart"
 */
function open(product) {
    ensureOverlay();
    if (overlay) overlay.classList.remove('hidden-section');
    const content = document.getElementById('productModalContent');
    const brand = product.brand;
    const isSilverythm = brand === 'silverythm';
    const isDevaramane = brand === 'devaramane';

    // Build the WhatsApp link with product name AND current page URL
    const productURL = `${window.location.origin}${window.location.pathname}?brand=${product.brand || 'silverythm'}`;
    const waText = `Hi, I'm interested in "${product.name}".\nProduct link: ${productURL}\nPlease share details and pricing.`;
    const waLink = `https://wa.me/${State.get('whatsappNumber') || '916364051237'}?text=${encodeURIComponent(waText)}`;

    // Brand-specific metadata
    const badgeText = isSilverythm ? 'Pure Silver' : (isDevaramane ? 'Jewellery' : 'Gifting');
    const subtitle = isSilverythm ? '999 Pure Silver Frame' 
                   : isDevaramane ? 'Traditional Gold & Silver' 
                   : 'Curated Gift Collection';

    // SILVERHYTHM: never show numeric price
    const priceHTML = isSilverythm ? 'Price on Consultation' 
                    : (product.price ? `₹${product.price}` : 'Price on Request');

    const defaultDesc = isSilverythm 
        ? 'A divine masterpiece meticulously handcrafted by master artisans in 999 pure silver. Consult with our experts for bespoke orders.'
        : isDevaramane 
        ? 'A beautifully crafted piece from our traditional jewellery collection, made with precision and devotion.'
        : 'A thoughtfully curated gift, perfect for any occasion. Handcrafted with care and delivered with premium packaging.';

    let modalDesc = product.description || defaultDesc;
    if (modalDesc) {
        modalDesc = String(modalDesc)
            .replace(/\b(\d+(?:\.\d+)?)\s*(?:cms?|centimeters?)\b/gi, '$1 inches')
            .replace(/\b(?:cms?|centimeters?)\b/gi, 'inches');
    }
    if (brand === 'udugore' && !modalDesc.toLowerCase().includes('pure 999.9 silver coated')) {
        modalDesc += '<br><br>Pure 999.9 silver coated';
    }

    content.innerHTML = `
        <div class="sheet-handle"></div>
        <button class="modal-close" id="modalCloseBtn">${SVG_X}</button>

        <div class="modal-img-wrap">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <div class="pos-abs-tl-12">
                <span class="product-badge badge-blur-9">${badgeText}</span>
            </div>
        </div>

        <div class="modal-info">
            <h2>${product.name}</h2>
            <div class="modal-subtitle">${subtitle}</div>
            <div class="modal-price">${priceHTML}</div>
            <div class="modal-desc">${modalDesc}</div>
        </div>

        <div class="modal-actions" id="modalActions"></div>
    `;

    // SILVERHYTHM: WhatsApp CTA only. NEVER show Add to Cart.
    const actions = document.getElementById('modalActions');
    if (isSilverythm) {
        actions.innerHTML = `
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-full wa-btn-premium">
                ${SVG_WA} Buy on WhatsApp
            </a>
            <p class="text-center-small-muted mt-10">Our expert will respond within 30 minutes</p>
        `;
    } else {
        actions.innerHTML = `
            <button class="btn btn-cart btn-full cart-btn-premium" id="modalAddToCart">
                ${SVG_BAG} Add to Cart — ${priceHTML}
            </button>
        `;
        document.getElementById('modalAddToCart').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('add-to-cart', { detail: product }));
            close();
        });
    }

    document.getElementById('modalCloseBtn').addEventListener('click', close);
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
}

export const ProductModal = {
    init() {
        return; // Modal disabled — product clicks navigate to product.html instead
    },
    close,
};
