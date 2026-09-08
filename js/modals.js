// js/modals.js — Support modal and Legal modal logic

export function initSupportModal() {
    const THEMES_MAP = {
        silverythm: { primary: '#1B4963', accent: '#C0C0C0', bg: '#F5F7FA' },
        devaramane: { primary: '#B8860B', accent: '#F5C842', bg: '#FFFDF5' },
        udugore: { primary: '#0D1B4B', accent: '#C9A84C', bg: '#F4F6FB' },
    };
    const CONTENT = {
        shipping: {
            title: 'Shipping Policy',
            body: `<h3>Delivery Timeline</h3><p>Ships within 2 to 3 business days for ready available orders only, for custom orders, use enquiry. Standard delivery across India takes 5—7 business days. Express delivery (3—4 days) is available for select pincodes.</p><h3>Insurance & Packaging</h3><p>All products are insured during transit and packed in premium tamper-proof packaging. Report damage within 48 hours of delivery with photographs.</p><h3>Free Shipping</h3><p>Free shipping on all orders above ₹10,000 in India. Overseas Shipping available.</p><h3>International Shipping</h3><p>We ship worldwide. International shipping charges are calculated at checkout or via enquiry.</p>`
        },
        care: {
            title: 'Care Guide',
            body: `<h3>Silver Frames (Silverhythm)</h3><p>Clean with a soft dry microfibre cloth. Avoid moisture, perfumes, and chemicals.</p><h3>Gold & Silver Jewellery (Devaramane)</h3><p>Remove before bathing or swimming. Store pieces separately. Avoid extended contact with vibhuti or kumkum.</p><h3>Gift Hampers (Udugore)</h3><p>Store as per individual product instructions. Clean brass and copper items with tamarind or lemon to restore shine.</p>`
        },
        terms: {
            title: 'Terms & Conditions',
            body: `<h3>Acceptance</h3><p>By using silverhythm.com you agree to these terms, applicable to all three brands on this portal.</p><h3>Products & Pricing</h3><p>Prices are in INR inclusive of taxes. Minor colour/finish variations may occur due to the handcrafted nature of products.</p><h3>Orders</h3><p>Orders confirmed upon successful payment. Silverhythm products are processed via WhatsApp consultation.</p><h3>Returns</h3><p>Returns accepted within 7 days for unused items in original packaging. Custom orders are non-returnable. Refunds processed within 5—7 business days.</p>`
        }
    };

    let modal = document.getElementById('supportModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'supportModal';
        modal.className = 'support-modal-overlay';
        document.body.appendChild(modal);

        // Add close listeners ONLY ONCE
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('#closeSupportBtn')) {
                modal.classList.remove('open');
                document.body.classList.remove('no-scroll');
            }
        });
    }

    window.__openSupport = function (type, brand) {
        const c = CONTENT[type];
        if (!c) return;
        
        modal.dataset.brand = brand || 'silverythm';


        modal.innerHTML = `
            <div class="support-modal-panel">
                <div class="support-modal-header">
                    <div class="support-modal-header-left">
                        <span class="support-modal-accent-bar"></span>
                        <span class="support-modal-title">${c.title}</span>
                    </div>
                    <button id="closeSupportBtn" class="support-close-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="support-modal-body">
                    ${c.body}
                </div>
            </div>
        `;
        modal.classList.add('open');
        document.body.classList.add('no-scroll');
    };
}

export function renderLegalModal() {
    const existing = document.getElementById('legalModal');
    if (existing) return;

    const modal = document.createElement('div');
    modal.id = 'legalModal';
    modal.className = 'legal-modal-overlay';

    modal.innerHTML = `
        <div id="legalPanel" class="legal-modal-panel">
            <button id="closeLegalModalBtn" class="legal-close-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div id="legalModalBody"></div>
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLegalModal();
    });

    document.body.appendChild(modal);
    document.getElementById('closeLegalModalBtn').addEventListener('click', closeLegalModal);
}

window.openLegalModal = function (type) {
    renderLegalModal();
    const modal = document.getElementById('legalModal');
    const body = document.getElementById('legalModalBody');
    const LEGAL_CONTENT = {
        shipping: {
            title: 'Shipping Policy',
            content: `<h3>Delivery Timeline</h3><p>Ships within 2 to 3 business days for ready available orders only, for custom orders, use enquiry. Standard delivery across India takes 5—7 business days. Express delivery (3—4 days) is available for select pincodes.</p><h3>Insurance & Packaging</h3><p>All products are insured during transit and packed in premium tamper-proof packaging. Report damage within 48 hours of delivery with photographs.</p><h3>Free Shipping</h3><p>Free shipping on all orders above ₹10,000 in India. Overseas Shipping available.</p><h3>International Shipping</h3><p>We ship worldwide. International shipping charges are calculated at checkout or via enquiry.</p>`
        },
        care: {
            title: 'Care Instructions',
            content: `<h3>Silver Frames (Silverhythm)</h3><p>Clean with a soft dry microfibre cloth. Avoid moisture, perfumes, and chemicals. Use a silver polishing cloth for deep cleaning.</p><h3>Gold & Silver Jewellery (Devaramane)</h3><p>Remove before bathing or swimming. Store pieces separately. Clean with soft brush and mild soap, pat dry. Avoid extended contact with vibhuti or kumkum.</p><h3>Gift Hampers (Udugore)</h3><p>Store as per individual product instructions. Clean brass and copper items with tamarind or lemon to restore shine.</p><h3>General</h3><p>Minor variations in finish are a mark of authenticity, not a defect.</p>`
        },
        terms: {
            title: 'Terms & Conditions',
            content: `<h3>Acceptance</h3><p>By using silverhythm.com you agree to these terms, applicable to all three brands on this portal.</p><h3>Products & Pricing</h3><p>Prices are in INR inclusive of taxes. Minor colour/finish variations may occur due to the handcrafted nature of products.</p><h3>Orders</h3><p>Orders confirmed upon successful payment. Silverhythm products are processed via WhatsApp consultation.</p><h3>Returns</h3><p>Returns accepted within 7 days for unused items in original packaging. Custom orders are non-returnable. Refunds processed within 5—7 business days.</p><h3>Contact</h3><p>+91 63640 51237 · 70/5 Vani Vilas Road, Basavanagudi, Bengaluru 560004</p>`
        }
    };

    const data = LEGAL_CONTENT[type];
    if (!data) return;

    body.innerHTML = `
        <div class="legal-label-small">Legal</div>
        <h2 class="legal-title-premium">${data.title}</h2>
        <div class="legal-body-text legal-content">${data.content}</div>
    `;

    modal.classList.add('open');
    document.body.classList.add('no-scroll');
};

window.closeLegalModal = function () {
    const modal = document.getElementById('legalModal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('no-scroll');
};

export function initPromoModal() {
    if (sessionStorage.getItem('promo_modal_seen') === 'true') {
        return;
    }

    const modalId = 'promoModalOverlay';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'promo-modal-overlay';
        document.body.appendChild(modal);

        const closeModal = () => {
            modal.classList.remove('open');
            document.body.classList.remove('no-scroll');
            sessionStorage.setItem('promo_modal_seen', 'true');
        };

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('#closePromoBtn') || e.target.closest('.promo-modal-panel')) {
                closeModal();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('open')) {
                closeModal();
            }
        });
    }

    modal.innerHTML = `
        <div class="promo-modal-panel">
            <button id="closePromoBtn" class="promo-close-btn" aria-label="Close promotion">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <div class="promo-poster-container">
                <img src="assets/images/wall-preview-poster.webp" class="promo-poster-img" alt="See It In Your Space - Wall Preview Guide">
            </div>
        </div>
    `;

    setTimeout(() => {
        modal.classList.add('open');
        document.body.classList.add('no-scroll');
    }, 1500);
}


