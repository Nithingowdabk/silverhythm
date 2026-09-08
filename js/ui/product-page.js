import { API } from '../api.js?v=2';
import { PRODUCT_BRAND_CONFIG } from '../content.js';
import { Wishlist } from './wishlist.js';
import { Cart } from './cart.js?v=2';
import { Auth } from './auth.js';
import { State } from '../state.js';
import { initWallPreview, openOverlay } from './wall-preview.js?v=3';
import { initEnquiryBot, openEnquiryBotForProduct } from './enquiry-bot.js';

const SUGGESTIONS_HTML = `
<div class="search-suggestions-container">
    <div class="search-suggest-section">
        <h4 class="search-suggest-title">Trending Searches</h4>
        <div class="search-suggest-tags">
            <span class="search-suggest-tag" data-query="Balaji">Lord Balaji Frame</span>
            <span class="search-suggest-tag" data-query="Ganesh">Ganesha Pure Silver</span>
            <span class="search-suggest-tag" data-query="Lakshmi">Goddess Lakshmi</span>
            <span class="search-suggest-tag" data-query="Silver Photoframes">Silver Photoframes</span>
            <span class="search-suggest-tag" data-query="Temple Jewellery">92.5 Jewellery</span>
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

// —— STATE ——
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');
let waNumber = '916364051237';
let currentProduct = null;

function showToast(msg) {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => el.classList.remove('show'), 2400);
    setTimeout(() => el.remove(), 2900);
}

// —— IMAGE SWITCHER & HOVER ZOOM ——
function setupImageSwitcher() {
    const productWrap = document.getElementById('productWrap');
    if (!productWrap) return;

    productWrap.addEventListener('click', (e) => {
        const thumb = e.target.closest('.thumb');
        if (thumb) {
            const src = thumb.querySelector('img').src;
            const mainImg = document.getElementById('mainImg');
            if (mainImg) {
                mainImg.src = src;
                mainImg.style.transform = 'scale(1)';
            }

            document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        }
    });
}

function setupImageZoom() {
    const container = document.getElementById('mainImgContainer');
    const img = document.getElementById('mainImg');
    if (!container || !img) return;

    container.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) return;
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = 'scale(1.85)';
    });

    container.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
        img.style.transformOrigin = 'center center';
    });
}

function formatDimensions(str) {
    if (!str) return str;
    return String(str)
        .replace(/\b(\d+(?:\.\d+)?)\s*(?:cms?|centimeters?)\b/gi, '$1 inches')
        .replace(/\b(?:cms?|centimeters?)\b/gi, 'inches');
}

// —— RENDER PRODUCT ——
function renderProduct(p) {
    const cfg = PRODUCT_BRAND_CONFIG[p.brand] || PRODUCT_BRAND_CONFIG.silverythm;

    // Apply brand class + logo
    if (cfg.bodyClass) document.body.classList.add(cfg.bodyClass);
    document.body.setAttribute('data-brand', p.brand);
    const navLogo = document.getElementById('navLogo');
    if (navLogo) navLogo.src = cfg.logo;
    const footerLogo = document.getElementById('footerLogo');
    if (footerLogo) footerLogo.src = cfg.logo;
    const footerWaLink = document.getElementById('footerWaLink');
    if (footerWaLink) footerWaLink.href = `https://wa.me/${waNumber}`;

    document.title = `${p.name} | ${p.brand === 'silverythm' ? 'Silverhythm · Pure 999.9 Silver' : (p.brand === 'devaramane' ? 'Devaramane · Temple Craft' : 'Udugore · Luxury Gifting')}`;

    // Breadcrumb
    const bcCollection = document.getElementById('bcCollection');
    if (bcCollection) {
        bcCollection.innerHTML = `<a href="${cfg.collectionHref}">${cfg.collectionName}</a>`;
    }
    const bcProduct = document.getElementById('bcProduct');
    if (bcProduct) bcProduct.textContent = p.name;

    // Images
    let images = [p.image];
    try {
        if (p.images) {
            const parsed = JSON.parse(p.images);
            images = Array.isArray(parsed) ? parsed : [p.image];
            if (!images.includes(p.image)) images.unshift(p.image);
        }
    } catch (e) { }
    images = images.filter(Boolean);

    const thumbsHTML = images.length > 1
        ? `<div class="img-thumbs">
        ${images.map((img, i) =>
            `<button class="thumb${i === 0 ? ' active' : ''}" type="button" aria-label="View photo ${i + 1}">
            <img src="${img}" alt="${p.name} view ${i + 1}" loading="lazy">
          </button>`
        ).join('')}
       </div>`
        : '';

    // Price
    const priceNum = p.price ? Number(String(p.price).replace(/,/g, '')) : 0;
    const priceDisplay = priceNum
        ? '₹' + priceNum.toLocaleString('en-IN')
        : (p.brand === 'silverythm' ? 'By Consultation' : 'Price on Request');
    
    const priceSubText = priceNum
        ? '✦ Inclusive of all taxes · Free insured express delivery across India · Worldwide shipping available'
        : '✦ Custom-crafted to sanctum proportions · Worldwide shipping available';

    // Direct WhatsApp Consultation Link
    const currentUrl = window.location.href;
    const waText = encodeURIComponent(
        `Namaste Silverhythm! 🙏\n\nI am interested in the ${p.name}${priceNum ? ` (${priceDisplay})` : ''}.\nCould you please share customisation details, sanctum dimensions, and availability?\n\nProduct Link: ${currentUrl}`
    );
    const waHref = `https://wa.me/${waNumber}?text=${waText}`;

    // CTAs
    let ctaHTML = '';
    if (p.brand === 'silverythm') {
        ctaHTML = `
      <a href="${waHref}" target="_blank" rel="noopener" class="btn-primary btn-whatsapp" id="waEnquireBtn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <span>Enquire on WhatsApp &amp; Customise</span>
      </a>`;
    } else {
        ctaHTML = `
      <button class="btn-primary" id="addBtn" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span>Add to Sacred Bag</span>
      </button>
      <a href="${waHref}" target="_blank" rel="noopener" class="btn-whatsapp-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        <span>WhatsApp Quick Consultation</span>
      </a>`;
    }

    const isSilverhythm = p.brand === 'silverythm';

    const productWrap = document.getElementById('productWrap');
    if (productWrap) {
        productWrap.innerHTML = `
      <!-- LEFT: Media Showcase & Highlighted Actions -->
      <div class="img-panel">
        <div class="img-main-wrap">
          <div class="img-main" id="mainImgContainer">
            <div class="img-zoom-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              <span>Hover to Zoom</span>
            </div>
            
            <div class="purity-badge-floating">
              <span class="purity-sparkle">✦</span>
              <span>${p.brand === 'silverythm' ? 'PURE 999.9 SILVER · BIS HALLMARKED' : (p.brand === 'devaramane' ? '92.5 TEMPLE SILVER' : '999.9 SILVER COATED')}</span>
            </div>

            <button class="wish-btn" id="productWishBtn" data-wish-id="${p.id}" aria-label="Toggle Wishlist">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>

            <img src="${p.image}" alt="${p.name}" id="mainImg">
          </div>
        </div>

        ${thumbsHTML}

        <!-- Actions Directly Below Photo Section -->
        <div class="gallery-bottom-actions">
          ${isSilverhythm ? `
          <button class="gallery-ar-btn" id="galleryArTriggerBtn" type="button">
            <div class="ar-btn-left">
              <span class="ar-btn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </span>
              <div class="ar-btn-text">
                <strong>✦ Visualise in Your Sacred Mandir (AR Simulator)</strong>
                <small>Simulate exact frame proportions and placement on your pooja wall</small>
              </div>
            </div>
            <span class="ar-btn-arrow">→</span>
          </button>` : ''}

          <div class="gallery-highlight-row">
            <button class="gallery-action-btn btn-highlight-architect" id="openChatbotBtn" type="button">
              <div class="gah-left">
                <span class="gah-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <circle cx="9" cy="10" r="1" fill="currentColor"/>
                    <circle cx="15" cy="10" r="1" fill="currentColor"/>
                    <path d="M10 13c.6.6 1.4 1 2 1s1.4-.4 2-1"/>
                  </svg>
                </span>
                <div class="gah-text">
                  <strong>Ask Temple Architect</strong>
                  <small>AI Vastu &amp; Bespoke Sizing</small>
                </div>
              </div>
              <span class="gah-badge">✦ AI LIVE</span>
            </button>

            <a href="${cfg.collectionHref}" class="gallery-action-btn btn-highlight-collection">
              <div class="gah-left">
                <span class="gah-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                  </svg>
                </span>
                <div class="gah-text">
                  <strong>View Full Collection</strong>
                  <small>Explore All Sacred Offerings</small>
                </div>
              </div>
              <span class="gah-arrow">→</span>
            </a>
          </div>
        </div>
      </div>

      <!-- RIGHT: Editorial Details & Purchasing Panel -->
      <div class="detail-panel">
        <div class="detail-header-group">
          <div class="detail-eyebrow-wrap">
            <span class="eyebrow-gem">✦</span>
            <span class="detail-eyebrow">${cfg.eyebrow}</span>
          </div>

          <h1 class="detail-name">${p.name}</h1>
          
          <p class="detail-tagline">
            ${p.brand === 'silverythm' ? 'Sacred Deity Sanctum Frame · Hand-Chased Pure 999.9 Silver with 24K Gold Accents' : (p.brand === 'devaramane' ? 'Traditional Temple Craft Heritage' : 'Curated Luxury Gift Collection')}
          </p>
        </div>

        <!-- Pricing Row -->
        <div class="detail-pricing-section">
          <div class="price-main-row">
            <div class="detail-price">${priceDisplay}</div>
            <span class="price-hallmark-pill">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              ${p.brand === 'silverythm' ? 'BIS Hallmarked 999.9' : 'Authentic Certified'}
            </span>
          </div>
          <div class="detail-price-note">${priceSubText}</div>
        </div>

        <!-- 4 Key Highlights Ribbon -->
        <div class="atelier-features-strip">
          <div class="af-item">
            <span class="af-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
                <path d="M11 3L8 9l4 12 4-12-3-6"/>
                <path d="M2 9h20"/>
              </svg>
            </span>
            <div class="af-text">
              <strong>999.9 Pure Silver</strong>
              <span>Tarnish-proof luster</span>
            </div>
          </div>
          <div class="af-item">
            <span class="af-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </span>
            <div class="af-text">
              <strong>Master Hand-Chased</strong>
              <span>Intricate 3D relief</span>
            </div>
          </div>
          <div class="af-item">
            <span class="af-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 21H3V3"/>
                <path d="M21 9l-6 6-4-4-6 6"/>
                <rect x="7" y="7" width="10" height="10" rx="1"/>
              </svg>
            </span>
            <div class="af-text">
              <strong>Vastu Scalable</strong>
              <span>Custom dimensions</span>
            </div>
          </div>
          <div class="af-item">
            <span class="af-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                <circle cx="12" cy="12" r="3.5"/>
              </svg>
            </span>
            <div class="af-text">
              <strong>Silver Exchange</strong>
              <span>Lifetime upgrade</span>
            </div>
          </div>
        </div>

        <!-- CTA Action Buttons -->
        <div class="cta-stack">
          ${ctaHTML}
        </div>

        <!-- Compact Royal Assurance 4-Badge Strip -->
        <div class="sanctum-assurance-strip">
          <div class="sa-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
            <span>100% Insured Transit</span>
          </div>
          <div class="sa-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M7 7h10M7 12h10M7 17h6"/>
            </svg>
            <span>BIS Hallmark Card</span>
          </div>
          <div class="sa-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
            <span>Silver Exchange</span>
          </div>
          <div class="sa-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Express Dispatch</span>
          </div>
        </div>

        <!-- Master Artisan Direct Helpline -->
        <div class="artisan-direct-strip">
          <div class="artisan-avatar-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"/>
              <path d="M5 21V10l7-7 7 7v11"/>
              <path d="M9 21v-6a3 3 0 0 1 6 0v6"/>
              <circle cx="12" cy="7" r="1"/>
            </svg>
          </div>
          <div class="artisan-text">
            <span>Bespoke sizing / temple architect consultation: <a href="tel:+916364051237">+91 63640 51237</a></span>
          </div>
        </div>

      </div>`;
    }

    setupImageZoom();

    // —— CONTINUOUS STORY & MASTERCRAFT SHOWCASE CONTENT ——
    const storyText = document.getElementById('storyText');
    if (storyText) {
        const rawDesc = p.description ? p.description.trim() : '';
        let descLead = '';
        let descBody = '';

        if (rawDesc.length > 50) {
            descLead = formatDimensions(rawDesc);
            descBody = 'Crafted to immortalise divine serenity in pure 999.9 hallmarked silver, every micro-detail of this sacred deity frame is shaped in strict resonance with traditional canonical Agamic art and Shilpa Shastra principles.';
        } else {
            const deityName = p.name || 'Sacred Deity Murti';
            if (p.brand === 'silverythm') {
                descLead = `The ${deityName} stands as an eternal conduit of peace and spiritual grace, sculpted in certified 999.9 hallmarked pure silver with radiant 24K gold electroplated accents.`;
                descBody = `From the sacred crown to the lotus pedestal, our master silversmiths dedicate hours of meditative hand-chasing to achieve astonishing dimensional 3D relief that glows warmly beneath pooja deepam flames.`;
            } else if (p.brand === 'devaramane') {
                descLead = `Rooted in authentic temple goldsmithing lineage, the ${deityName} reflects centuries of sacred devotion and auspicious craftsmanship in pure silver.`;
                descBody = `Created for daily spiritual wear and sacred ceremonies, balancing pure metallurgical integrity with timeless heirloom elegance.`;
            } else {
                descLead = `A luxurious symbol of auspicious beginnings and joyous milestones, curated in lustrous pure 999.9 silver coated finish.`;
                descBody = `Elegantly designed for premium gifting, wedding celebrations, and sacred pooja offerings with bespoke luxury packaging.`;
            }
        }

        storyText.innerHTML = `
          <p class="story-lead">${descLead}</p>
          <p class="story-body">${descBody}</p>
        `;
    }

    const specsGrid = document.getElementById('specsGrid');
    if (specsGrid) {
        const specRows = [...cfg.specs];
        if (p.size) specRows.push(['Frame Size', formatDimensions(p.size)]);
        if (p.frame) specRows.push(['Frame Enclosure', formatDimensions(p.frame)]);
        if (p.material) specRows.push(['Silver Material', formatDimensions(p.material)]);
        if (p.weight) specRows.push(['Pure Silver Weight', formatDimensions(p.weight)]);
        if (p.dimensions) specRows.push(['Sanctum Dimensions', formatDimensions(p.dimensions)]);
        if (p.category) specRows.push(['Sanctum Deity', p.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())]);
        if (p.stock !== undefined) specRows.push(['Sanctum Availability', p.stock > 0 ? 'Ready for Dispatch' : 'Custom Crafted to Order']);

        specsGrid.innerHTML = specRows
            .map(([k, v]) => `
              <div class="spec-luxury-card">
                <span class="spec-luxury-label">${k}</span>
                <strong class="spec-luxury-value">${v}</strong>
              </div>
            `).join('');
    }

    const careGrid = document.getElementById('careGrid');
    if (careGrid) {
        const careCards = [
            {
                title: 'Microfibre Dry Buffing',
                desc: 'Gently wipe with a soft, clean microfibre or silver-polishing cloth after handling to preserve original shine.',
                icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="7"/></svg>'
            },
            {
                title: 'Pooja Kumkum & Moisture',
                desc: 'Avoid prolonged direct contact with wet kumkum, sandalwood paste, or sacred water; pat dry immediately with soft cotton.',
                icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'
            },
            {
                title: 'No Chemical Detergents',
                desc: 'Never use abrasive scrubbers, chemical solvents, or acidic washes; the protective archival lacquer remains self-sustaining.',
                icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>'
            },
            {
                title: 'Complimentary Atelier Service',
                desc: 'Silverhythm provides lifetime professional rejuvenation and exchange consultation at our Bengaluru atelier.',
                icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8"/><path d="M21 3v5h-5"/></svg>'
            }
        ];

        careGrid.innerHTML = careCards.map(c => `
          <div class="care-luxury-card">
            <div class="care-icon">${c.icon}</div>
            <div class="care-content">
              <h4>${c.title}</h4>
              <p>${c.desc}</p>
            </div>
          </div>
        `).join('');
    }

    const relatedAllLink = document.getElementById('relatedAllLink');
    if (relatedAllLink) relatedAllLink.href = cfg.collectionHref;

    const storyShowcase = document.getElementById('storyShowcase');
    if (storyShowcase) {
        storyShowcase.classList.remove('hidden');
        storyShowcase.classList.add('visible-section');
    }

    // Update SEO Schema
    updateSchema(p, cfg, priceNum);

    // Update bottom sticky bar CTA
    const bagBtn = document.getElementById('bagBtn');
    if (bagBtn) {
        if (p.brand === 'silverythm') {
            bagBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span>Enquire on WhatsApp</span>
            `;
        } else {
            const count = State.getCartCount();
            bagBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span>Add to Bag</span>
              <span id="bag-count">${count > 0 ? count : ''}</span>
            `;
            const badge = document.getElementById('bag-count');
            if (badge) badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    if (p.brand === 'silverythm') {
        initWallPreview(p);
    }

    window.dispatchEvent(new CustomEvent('product-rendered'));
}

function updateSchema(p, cfg, priceNum) {
    const schema = document.getElementById('product-schema');
    if (schema && p) {
        try {
            const s = JSON.parse(schema.textContent);
            s.name = p.name;
            s.description = p.description || (p.name + ' from the ' + cfg.collectionName);
            s.image = window.location.origin + '/' + p.image;
            s.offers.price = priceNum || 0;
            s.brand.name = { silverythm: 'Silverhythm', devaramane: 'Devaramane', udugore: 'Udugore' }[p.brand] || 'Silverhythm';
            schema.textContent = JSON.stringify(s);
        } catch (e) { console.error('Schema error:', e); }
    }
}

// —— ADD CART HANDLER ——
function handleAddCart() {
    if (!currentProduct) return;
    const btn = document.getElementById('addBtn');
    if (btn && btn.disabled) return;
    window.dispatchEvent(new CustomEvent('add-to-cart', { detail: currentProduct }));
    if (btn) {
        btn.disabled = true;
        const oldHTML = btn.innerHTML;
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Added to Bag`;
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = oldHTML;
        }, 2000);
    }
}

// —— RELATED PRODUCTS ——
async function loadRelated(p) {
    try {
        const { products } = await API.getProducts(p.brand);
        const related = (products || []).filter(x => String(x.id) !== String(productId)).slice(0, 8);
        if (!related.length) return;
        const relatedGrid = document.getElementById('relatedGrid');
        if (relatedGrid) {
            relatedGrid.innerHTML = related.map(r => {
                const rPrice = r.price
                    ? '₹' + Number(String(r.price).replace(/,/g, '')).toLocaleString('en-IN')
                    : (r.brand === 'silverythm' ? 'By Consultation' : 'Enquire');
                
                const metaItems = [];
                if (r.size) metaItems.push(`<span class="rc-meta-item">✦ ${r.size}</span>`);
                if (r.frame) metaItems.push(`<span class="rc-meta-item">✦ ${r.frame}</span>`);

                const metaHTML = metaItems.length > 0
                    ? `<div class="rc-meta">${metaItems.join('')}</div>`
                    : '';

                return `
                <a href="product.html?id=${r.id}" class="rc">
                  <div class="rc-img">
                    <img src="${r.image}" alt="${r.name}" loading="lazy">
                    <span class="rc-badge">✦ Pure Silver</span>
                  </div>
                  <div class="rc-body">
                    <h4 class="rc-name">${r.name}</h4>
                    <div class="rc-price">${rPrice}</div>
                    ${metaHTML}
                  </div>
                </a>`;
            }).join('');
            
            const relatedSection = document.getElementById('relatedSection');
            if (relatedSection) {
                relatedSection.classList.remove('hidden');
                relatedSection.classList.add('visible-section');
            }
        }
    } catch (e) {
        console.warn('Failed to load related products:', e);
    }
}

// —— ERROR STATE ——
function showError(message = "Product not found") {
    const productWrap = document.getElementById('productWrap');
    if (productWrap) {
        productWrap.innerHTML = `
            <div class="error-container full-span-center">
                <p class="error-title italic-title">
                    ${message} (ID: ${productId || 'None'})
                </p>
                <a href="index.html" class="back-link">
                    ← Back to Home Collection
                </a>
                <div id="debug-info" class="debug-overlay">
                    <strong>Diagnostic Data:</strong>
                    <pre id="debug-pre" class="debug-pre"></pre>
                </div>
            </div>`;
    }
}

// —— INIT ——
async function init() {
    Cart.init();
    Auth.init();
    const savedTheme = localStorage.getItem('srTheme');
    document.body.classList.toggle('light', savedTheme !== 'dark');
    setupImageSwitcher();
    Wishlist.init();

    try {
        initEnquiryBot();
    } catch (e) {
        console.warn('Enquiry bot initialization failed:', e);
    }

    // Top nav sticky state
    const topNav = document.getElementById('topNav');
    topNav?.classList.add('nav-scrolled');

    // Sync bag count
    const updateBagCount = () => {
        const count = State.getCartCount();
        ['bag-count', 'bag-count-desktop', 'bag-count-mobile'].forEach(id => {
            const b = document.getElementById(id);
            if (!b) return;
            b.textContent = count > 0 ? count : '';
            b.style.display = count > 0 ? 'flex' : 'none';
        });
    };
    State.subscribe('cart', updateBagCount);
    updateBagCount();

    // Event delegation for actions
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('#addBtn');
        if (addBtn && currentProduct) {
            handleAddCart();
            return;
        }

        const bagBtn = e.target.closest('#bagBtn');
        if (bagBtn && currentProduct) {
            if (currentProduct.brand === 'silverythm') {
                const currentUrl = window.location.href;
                const priceNum = currentProduct.price ? Number(String(currentProduct.price).replace(/,/g, '')) : 0;
                const priceDisplay = priceNum ? '₹' + priceNum.toLocaleString('en-IN') : '';
                const waText = encodeURIComponent(
                    `Namaste Silverhythm! 🙏\n\nI am interested in ${currentProduct.name}${priceDisplay ? ` (${priceDisplay})` : ''}.\nCould you please share details on customising it for my home mandir?\n\nLink: ${currentUrl}`
                );
                window.open(`https://wa.me/${waNumber}?text=${waText}`, '_blank');
            } else {
                handleAddCart();
            }
            return;
        }

        const arBtn = e.target.closest('#galleryArTriggerBtn');
        if (arBtn && currentProduct) {
            openOverlay(currentProduct);
            return;
        }

        const botBtn = e.target.closest('#openChatbotBtn');
        if (botBtn && currentProduct) {
            openEnquiryBotForProduct(currentProduct);
            return;
        }
    });

    ['bagBtnDesktop', 'bagBtnMobile'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('open-cart'));
        });
    });

    document.getElementById('wishBtnMobile')?.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-wishlist'));
    });

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    const syncWishBtn = () => {
        if (!currentProduct) return;
        const wishlisted = State.isWished(currentProduct.id);

        const bnWishBtn = document.getElementById('bnWishBtn');
        if (bnWishBtn) {
            const svg = bnWishBtn.querySelector('svg');
            if (svg) svg.setAttribute('fill', wishlisted ? 'currentColor' : 'none');
            bnWishBtn.style.color = wishlisted ? 'var(--accent)' : '';
        }

        const pBtn = document.getElementById('productWishBtn');
        if (pBtn) {
            pBtn.classList.toggle('wishlisted', wishlisted);
            const pSvg = pBtn.querySelector('svg');
            if (pSvg) pSvg.setAttribute('fill', wishlisted ? 'currentColor' : 'none');
        }
    };

    const bnWishBtn = document.getElementById('bnWishBtn');
    if (bnWishBtn) {
        bnWishBtn.addEventListener('click', () => {
            if (currentProduct) {
                window.dispatchEvent(new CustomEvent('wish-toggle', { detail: currentProduct }));
                setTimeout(syncWishBtn, 100);
            }
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#productWishBtn');
        if (btn && currentProduct) {
            window.dispatchEvent(new CustomEvent('wish-toggle', { detail: currentProduct }));
            setTimeout(syncWishBtn, 100);
        }
    });

    window.addEventListener('product-rendered', syncWishBtn);
    State.subscribe('wishlist', syncWishBtn);

    document.getElementById('wishBtnDesktop')?.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-wishlist'));
    });

    // Desktop Search Input
    const desktopSearchBtn = document.getElementById('desktopSearchBtn');
    const desktopSearchInput = document.getElementById('desktopSearchInput');
    const searchModal = document.getElementById('search-modal');

    const openSearch = () => {
        if (searchModal) {
            searchModal.classList.add('open');
            setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
        }
    };

    desktopSearchBtn?.addEventListener('click', openSearch);
    desktopSearchInput?.addEventListener('focus', (e) => {
        e.preventDefault();
        openSearch();
        desktopSearchInput.blur();
    });

    // Global keyboard shortcut (⌘K or Ctrl+K)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
        if (e.key === 'Escape' && searchModal?.classList.contains('open')) {
            searchModal.classList.remove('open');
        }
    });

    // Share button
    const bnShareBtn = document.getElementById('bnShareBtn');
    if (bnShareBtn) {
        bnShareBtn.addEventListener('click', async () => {
            if (navigator.share && currentProduct) {
                try {
                    await navigator.share({ 
                        title: currentProduct.name, 
                        url: window.location.href 
                    });
                } catch(e) {}
            } else {
                await navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard');
            }
        });
    }

    document.getElementById('bnSearchBtn')?.addEventListener('click', openSearch);

    document.getElementById('closeSearchBtn')?.addEventListener('click', () => {
        searchModal?.classList.remove('open');
        const si = document.getElementById('searchInput');
        if (si) si.value = '';
        const sr = document.getElementById('searchResults');
        if (sr) renderSearchSuggestions(sr, si);
    });

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    if (searchInput && searchResults) {
        let _searchTimer = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(_searchTimer);
            if (!searchInput.value.trim()) {
                renderSearchSuggestions(searchResults, searchInput);
                return;
            }
            _searchTimer = setTimeout(async () => {
                const q = searchInput.value.trim().toLowerCase();
                try {
                    const brand = State.get('brand') || 'silverythm';
                    const res = await API.getProducts(brand);
                    const list = res.products || [];
                    const matches = list.filter(p =>
                        (p.name || '').toLowerCase().includes(q) ||
                        (p.category || '').toLowerCase().includes(q)
                    ).slice(0, 8);
                    
                    if (matches.length === 0) {
                        searchResults.innerHTML = `<div class="search-empty-container">
                            <p class="search-empty-title">No results for "<strong>${searchInput.value}</strong>"</p>
                            <p class="search-empty-sub">Try searching for Balaji, Ganesha, or Lakshmi frames</p>
                        </div>`;
                        return;
                    }
                    searchResults.innerHTML = matches.map(p => `
                        <a href="product.html?id=${p.id}" class="search-item">
                            <img src="${p.image}" alt="${p.name}">
                            <div class="search-item-info">
                                <div class="search-item-name">${p.name}</div>
                                <div class="search-item-price">${p.price ? '₹'+p.price : 'By Consultation'}</div>
                            </div>
                        </a>
                    `).join('');
                } catch(e) {
                    console.error(e);
                }
            }, 200);
        });

        searchInput.addEventListener('focus', () => {
            if (!searchInput.value.trim()) {
                renderSearchSuggestions(searchResults, searchInput);
            }
        });

        renderSearchSuggestions(searchResults, searchInput);
    }

    const pid = productId || '1';

    try {
        const [settings, product] = await Promise.all([
            API.getSettings().catch(() => ({ whatsappNumber: '916364051237' })),
            API.getProduct(pid).catch(() => null)
        ]);

        if (settings?.whatsappNumber) {
            waNumber = settings.whatsappNumber.replace(/\D/g, '');
            State.set('whatsappNumber', waNumber);
        }

        if (!product || !product.id) {
            // Fallback product data if offline/mock
            const fallbackProduct = {
                id: pid,
                name: "Lord Balaji Handcrafted Pure Silver Frame",
                description: "Handcrafted pure 999.9 silver sanctum frame featuring Lord Venkateshwara (Balaji) in intricate traditional detail. 24K electroplated gold highlights over pure silver relief, encased in a bespoke hand-polished rosewood frame.",
                price: 25000,
                image: "assets/images/4photoframes.png",
                images: "[\"assets/images/4photoframes.png\"]",
                brand: "silverythm",
                category: "balaji",
                weight: "250g Pure Silver",
                dimensions: "18 x 22 inches",
                stock: 3,
                size: "Standard Mandir Scale",
                frame: "Rosewood Inlay",
                material: "999.9 Pure Silver Hallmark"
            };
            currentProduct = fallbackProduct;
            renderProduct(fallbackProduct);
            loadRelated(fallbackProduct);
            return;
        }

        currentProduct = product;
        renderProduct(product);
        loadRelated(product);
    } catch (e) {
        console.error("Fetch failed:", e);
        showError("Unable to load product");
    }
}

document.addEventListener('DOMContentLoaded', init);
