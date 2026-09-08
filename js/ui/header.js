// js/ui/header.js — Header + Brand Tabs + Mobile Menu + Bottom Nav

import { State } from '../state.js';
import { Router } from '../router.js';
import { ThemeEngine } from '../theme.js';
import { SVG } from '../icons.js';

const BRANDS = ['silverythm', 'devaramane', 'udugore'];

export const Header = {
    init() {
        this.render();

        let _lastW = window.innerWidth >= 768;
        window.addEventListener('resize', () => {
            const isDesktop = window.innerWidth >= 768;
            if (isDesktop !== _lastW) {
                _lastW = isDesktop;
                this.renderNav();
            }
        });

        const initBrand = State.get('brand');
        const initTheme = ThemeEngine.getTheme(initBrand);
        const initNavBg = initTheme.navBg ||
            initTheme.primary;
        const navEl = document.getElementById('main-nav');
        const barEl = document.getElementById('brand-bar');
        if (navEl) {
            navEl.classList.add('brand-bg-nav');
            navEl.style.setProperty('--nav-bg-color', initNavBg);
        }
        if (barEl) {
            barEl.classList.add('brand-bg-nav');
            barEl.style.setProperty('--nav-bg-color', initNavBg);
        }

        // 1. Apply brand-specific states immediately
        this.updateActiveBrand();
        this.updateMobileBrands();
        this.updateNavColors();

        // 2. Apply scroll state immediately
        this.setupScroll();

        // 3. Listen for future changes
        State.subscribe('brand', () => {
            this.updateActiveBrand();
            this.updateMobileBrands();
            this.updateNavColors();
        });
        State.subscribe('cart', () => this.updateCartBadge());
        State.subscribe('wishlist', () => this.updateWishBadge());
        State.subscribe('user', () => this.updateUserBtn());
        const user = State.get('user');
        if (user) {
            this.updateUserBtn();
        }
    },

    render() {
        this.renderBrandBar();
        this.renderNav();
        this.renderBottomNav();
        this.renderMobileMenu();
        this.updateActiveBrand();
        this.updateMobileBrands();
        this.updateNavColors();
        this.updateCartBadge();
    },

    renderBrandBar() {
        const bar = document.getElementById('brand-bar');
        if (!bar) return;
        bar.className = 'brand-bar';
        bar.innerHTML = `<div class="brand-bar-inner">
            <div class="brand-segmented" id="brandSegmented">
                ${BRANDS.map(b => {
                    const t = ThemeEngine.getTheme(b);
                    const isActive = b === State.get('brand');
                    const displayNames = { silverythm: '999.9 Silver Photoframes', devaramane: '92.5 Silver Jewellery', udugore: 'Gifts' };
                    return `<button class="brand-seg-btn ${isActive ? 'active' : ''}" data-brand="${b}">${displayNames[b] || t.name}</button>`;
                }).join('')}
            </div>
        </div>`;

        bar.onclick = (e) => {
            const btn = e.target.closest('[data-brand]');
            if (btn) Router.navigate(btn.dataset.brand);
        };
    },

    renderNav() {
        const wrap = document.getElementById('nav-content-wrap');
        const navContainer = document.getElementById('main-nav');
        if (!wrap || !navContainer) return;

        navContainer.className = 'main-nav';

        // Mobile-first structure by default, desktop replaces innerHTML
        if (window.innerWidth < 768) {
            wrap.innerHTML = `
  <div class="main-nav-inner mni-mobile">
    <button class="menu-btn" id="menuBtn" aria-label="Open menu">${SVG.menu}</button>
    <a href="#" class="nav-logo nav-logo-mobile" id="mobileLogoLink">
      <img src="${State.get('brand') === 'silverythm' ? 'assets/Logo.png' : 'assets/images/devaramane_logo.webp'}" alt="Logo" id="nav-logo-img">
    </a>
    <button class="mobile-nav-icon-btn nav-icon-wrap" id="mobileWishlistNavBtn" aria-label="Wishlist">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <span class="nav-badge nav-badge--wish hidden" id="mobileWishlistBadge">0</span>
    </button>
  </div>
`;

            document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleMobile(true));
            document.getElementById('mobileLogoLink')?.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            const mWishBtn = document.getElementById('mobileWishlistNavBtn');
            if (mWishBtn) mWishBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('open-wishlist'));
            });
        } else {
            // New Desktop Nav Structure
            wrap.innerHTML = `
                <nav class="main-nav-inner" id="main-nav-inner">
                  <!-- LEFT: Brand pill switcher -->
                  <div class="nav-brand-pills" id="navBrandPills">
                    <button class="nav-brand-pill ${State.get('brand') === 'silverythm' ? 'active' : ''}" data-brand="silverythm">999.9 Silver Photoframes</button>
                    <button class="nav-brand-pill ${State.get('brand') === 'devaramane' ? 'active' : ''}" data-brand="devaramane">92.5 Silver Jewellery</button>
                    <button class="nav-brand-pill ${State.get('brand') === 'udugore' ? 'active' : ''}" data-brand="udugore">Gifts</button>
                  </div>

                  <!-- CENTER: Logo -->
                  <a href="#" class="nav-logo-center" id="navLogoCenterDesktop">
                    <img src="${State.get('brand') === 'silverythm' ? 'assets/Logo.png' : 'assets/images/devaramane_logo.webp'}" alt="Logo">
                  </a>

                  <!-- RIGHT: Page links + icons -->
                  <div class="nav-right-group">
                    <a href="#products-section" class="nav-page-link">SHOP</a>
                    <a href="about.html" class="nav-page-link" id="navStoryLink">OUR STORY</a>
                    <div class="nav-icon-btns">
                      <button class="nav-icon-btn" id="desktopSearchBtn" aria-label="Search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </button>
                      <button class="nav-icon-btn nav-icon-wrap" id="desktopWishBtn" aria-label="Wishlist">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span class="nav-badge nav-badge--wish hidden" id="desktopWishBadge">0</span>
                      </button>
                      <button class="nav-icon-btn nav-icon-wrap" id="desktopCartBtn" aria-label="Cart">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        <span id="desktopCartBadge" class="nav-badge nav-badge--cart hidden">0</span>
                      </button>
                      <button class="nav-icon-btn" id="desktopAccountBtn" aria-label="Account">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      </button>
                    </div>
                  </div>
                </nav>
            `;

            // Wire up brand pills
            document.querySelectorAll('.nav-brand-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    Router.navigate(btn.dataset.brand);
                });
            });

            // Keep brand pills in sync when brand changes via other means
            State.subscribe('brand', (brand) => {
                document.querySelectorAll('.nav-brand-pill').forEach(b => {
                    b.classList.toggle('active', b.dataset.brand === brand);
                });
            });

            // Wire desktop search and cart
            const searchBtn = document.getElementById('desktopSearchBtn');
            const cartBtn = document.getElementById('desktopCartBtn');
            const wishBtn = document.getElementById('desktopWishBtn');
            if (searchBtn) searchBtn.addEventListener('click', () => {
                const sm = document.getElementById('search-modal');
                if (sm) {
                    sm.classList.add('open');
                    setTimeout(() => document.getElementById('searchInput')?.focus(), 350);
                }
            });
            if (wishBtn) wishBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('open-wishlist'));
            });
            if (cartBtn) cartBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('open-cart'));
            });
            const accountBtn = document.getElementById('desktopAccountBtn');
            if (accountBtn) {
                accountBtn.addEventListener('click', () => {
                    window.dispatchEvent(new CustomEvent('open-auth'));
                });
            }
        }
    },

    renderMobileMenu() {
        const el = document.getElementById('mobile-menu');
        const brand = State.get('brand');
        const theme = ThemeEngine.getTheme(brand);
        const waNumber = State.get('whatsappNumber') || '916364051237';

        el.className = 'mobile-overlay';
        el.setAttribute('data-brand', brand);
        el.innerHTML = `
            <div class="mobile-backdrop" id="mobileBackdrop"></div>
            <div class="mobile-panel">

                <div class="mobile-panel-header">
                    <img src="${brand === 'silverythm' ? 'assets/Logo.png' : 'assets/images/devaramane_logo.webp'}" alt="Logo">
                    <button id="mobileCloseBtn" aria-label="Close menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div class="mobile-nav-links">
                    <a href="#products-section" class="mobile-nav-link" data-mobile-link>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                        <span>Products</span>
                    </a>
                    <a href="about.html" class="mobile-nav-link" data-mobile-link id="mobileStoryLink">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m12 3-1.9 5.7a2 2 0 0 1-1.3 1.3L3 12l5.7 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.7a2 2 0 0 1 1.3-1.3L21 12l-5.7-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                        <span>Our Heritage</span>
                    </a>
                    <a href="https://wa.me/916364051237" target="_blank" rel="noopener" class="mobile-nav-link" data-mobile-link>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                        <span>Contact</span>
                    </a>
                </div>

                <div class="mobile-menu-divider"></div>

                <div class="mobile-brands">
                    <div class="mobile-brands-title">Switch Brand</div>
                    ${BRANDS.map(b => {
            const t = ThemeEngine.getTheme(b);
            const isActive = b === brand;
            const displayNames = { silverythm: '999.9 Silver Photoframes', devaramane: '92.5 Silver Jewellery', udugore: 'Gifts' };
            return `<button class="mobile-brand-btn ${isActive ? 'active' : ''}" data-mobile-brand="${b}">
                            <span class="mobile-brand-dot"></span>
                            <span>${displayNames[b] || t.name}</span>
                        </button>`;
        }).join('')}
                </div>

                <div class="mobile-menu-footer">
                    <div class="mobile-menu-socials">
                        <a href="https://wa.me/${waNumber}" target="_blank" rel="noopener" aria-label="WhatsApp" class="mobile-social-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                        <a href="https://www.instagram.com/silverhythm" target="_blank" rel="noopener" aria-label="Instagram" class="mobile-social-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        </a>
                        <a href="tel:+916364051237" aria-label="Call us" class="mobile-social-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.7 19.79 19.79 0 0 1 1.62 4.1 2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </a>
                    </div>
                    <p class="mobile-menu-copy">© 2026 Silverhythm</p>
                </div>

            </div>
        `;

        // Wire events
        document.getElementById('mobileBackdrop')?.addEventListener('click', () => this.toggleMobile(false));
        document.getElementById('mobileCloseBtn')?.addEventListener('click', () => this.toggleMobile(false));
        el.querySelectorAll('[data-mobile-link]').forEach(a => {
            a.addEventListener('click', () => this.toggleMobile(false));
        });
        el.querySelectorAll('[data-mobile-brand]').forEach(btn => {
            btn.addEventListener('click', () => {
                Router.navigate(btn.dataset.mobileBrand);
                this.toggleMobile(false);
            });
        });
    },

    toggleMobile(show) {
        const el = document.getElementById('mobile-menu');
        const bd = document.getElementById('mobileBackdrop');
        if (show) {
            el.classList.add('open');
            document.body.classList.add('no-scroll');
            if (bd) bd.classList.add('op-1');
            if (bd) bd.classList.remove('op-0');
        } else {
            el.classList.remove('open');
            document.body.classList.remove('no-scroll');
            if (bd) bd.classList.add('op-0');
            if (bd) bd.classList.remove('op-1');
        }
    },

    renderBottomNav() {
        const nav = document.getElementById('bottom-nav') || document.createElement('nav');
        nav.className = 'bottom-nav';
        nav.id = 'bottom-nav';
        nav.innerHTML = `
            <button class="bottom-nav-item" data-nav="search" aria-label="Search">
                <div class="bottom-nav-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                <span>Search</span>
            </button>
            <button class="bottom-nav-item" data-nav="cart" aria-label="Bag">
                <div class="bottom-nav-icon" id="cartIconWrapper">
                    ${SVG.bag}
                    <span class="cart-badge-bottom hidden" id="bottomCartBadge">0</span>
                </div>
                <span>Bag</span>
            </button>
            <button class="bottom-nav-item" data-nav="account" id="bnAccount" aria-label="Account">
                <div class="bottom-nav-icon">${SVG.user}</div>
                <span>Account</span>
            </button>
        `;
        if (!document.getElementById('bottom-nav')) {
            document.body.appendChild(nav);
        }

        nav.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-nav]');
            if (!btn) return;
            const action = btn.dataset.nav;

            switch (action) {
                case 'search':
                    const sm = document.getElementById('search-modal');
                    if (sm) {
                        sm.classList.add('open');
                        if (window.innerWidth < 768) document.body.classList.add('no-scroll');
                        setTimeout(() => document.getElementById('searchInput')?.focus(), 350);
                    }
                    break;
                case 'cart':
                    window.dispatchEvent(new CustomEvent('open-cart')); // Assume external cart logic handles opening drawer
                    break;
                case 'account':
                    window.dispatchEvent(new CustomEvent('open-auth'));
                    break;
            }
        });

        const dBtn = document.getElementById('closeSearchBtn');
        const sm = document.getElementById('search-modal');
        if (dBtn) dBtn.addEventListener('click', () => this.closeSearch());
        if (sm) {
            sm.addEventListener('click', (e) => {
                if (e.target === sm) this.closeSearch();
            });
        }
    },

    closeSearch() {
        const sm = document.getElementById('search-modal');
        const si = document.getElementById('searchInput');
        const sr = document.getElementById('searchResults');
        if (sm) {
            sm.classList.remove('open');
        }
        if (si) si.value = '';
        if (sr) sr.innerHTML = '';
        document.body.classList.remove('no-scroll');
    },

    setupScroll() {
        const nav = document.getElementById('main-nav');
        const heroEl = document.getElementById('hero-section');
        if (!nav) return;

        const updateNavState = () => {
            const heroEl = document.getElementById('hero-section');
            const isAtTop = window.scrollY < 10;

            // If NO hero section exists (e.g. collection page), nav should always be solid
            if (!heroEl) {
                nav.classList.add('nav-scrolled');
                return;
            }

            const heroBottom = heroEl.getBoundingClientRect().bottom;

            if (isAtTop) {
                nav.classList.remove('nav-scrolled');
                return;
            }

            if (heroBottom <= 60) {
                nav.classList.add('nav-scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
            }
        };

        window.removeEventListener('scroll', updateNavState);
        window.addEventListener('scroll', updateNavState, { passive: true });
        updateNavState(); // Apply immediately on init
    },

    updateActiveBrand() {
        const brand = State.get('brand');
        document.querySelectorAll('.brand-tab, .brand-seg-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.brand === brand);
        });
        // Animate the segmented fill
        const seg = document.getElementById('brandSegmented');
        if (seg) {
            const idx = BRANDS.indexOf(brand);
            seg.setAttribute('data-active-index', idx);
        }
    },

    updateMobileBrands() {
        const brand = State.get('brand');
        document.querySelectorAll('[data-mobile-brand]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mobileBrand === brand);
        });

        // Update Story Link based on brand
        const storyLink = document.getElementById('navStoryLink');
        const mobileStoryLink = document.getElementById('mobileStoryLink');
        if (brand === 'silverythm') {
            if (storyLink) storyLink.href = 'about.html';
            if (mobileStoryLink) {
                mobileStoryLink.href = 'about.html';
                mobileStoryLink.classList.add('hidden');
            }
        } else {
            if (storyLink) storyLink.href = '#story-section';
            if (mobileStoryLink) {
                mobileStoryLink.href = '#story-section';
                mobileStoryLink.classList.remove('hidden');
            }
        }
    },

    updateNavColors() {
        const brand = State.get('brand');
        const theme = ThemeEngine.getTheme(brand);
        const navBg = theme.navBg || theme.primary;

        const mainNav = document.getElementById('main-nav');
        const brandBar = document.getElementById('brand-bar');

        if (mainNav) {
            mainNav.classList.add('brand-bg-nav');
            mainNav.style.setProperty('--nav-bg-color', navBg);
        }
        if (brandBar) {
            brandBar.classList.add('brand-bg-nav');
            brandBar.style.setProperty('--nav-bg-color', navBg);
        }

        // Update brand tab text colors for contrast
        document.querySelectorAll('.brand-tab').forEach(tab => {
            if (tab.classList.contains('active')) {
                tab.classList.add('active-tab');
                tab.classList.remove('inactive-tab');
            } else {
                tab.classList.add('inactive-tab');
                tab.classList.remove('active-tab');
            }
        });

        // Update logo based on brand
        const logoImgs = document.querySelectorAll('#nav-logo-img, .nav-logo-center img, .mobile-panel-header img');
        const logoPath = brand === 'silverythm' ? 'assets/Logo.png' : 'assets/images/devaramane_logo.webp';
        logoImgs.forEach(img => {
            if (img) img.src = logoPath;
        });
    },

    updateCartBadge() {
        const count = State.getCartCount();
        // Bottom nav badge
        const bottomBadge = document.getElementById('bottomCartBadge');
        const wrapper = document.getElementById('cartIconWrapper');
        if (bottomBadge) {
            bottomBadge.textContent = count;
            if (count > 0) {
                bottomBadge.classList.remove('hidden');
                if (wrapper) {
                    wrapper.classList.remove('cart-bounce');
                    void wrapper.offsetWidth;
                    wrapper.classList.add('cart-bounce');
                }
            } else {
                bottomBadge.classList.add('hidden');
            }
        }


        // Desktop nav badge
        const desktopBadge = document.getElementById('desktopCartBadge');
        if (desktopBadge) {
            desktopBadge.textContent = count;
            desktopBadge.classList.toggle('hidden', count === 0);
        }
        this.updateWishBadge();
    },

    updateWishBadge() {
        const count = State.get('wishlist')?.length || 0;
        const mobileWishBadge = document.getElementById('mobileWishlistBadge');
        const desktopBadge = document.getElementById('desktopWishBadge');

        if (mobileWishBadge) {
            mobileWishBadge.textContent = count;
            mobileWishBadge.classList.toggle('hidden', count === 0);
        }
        if (desktopBadge) {
            desktopBadge.textContent = count;
            desktopBadge.classList.toggle('hidden', count === 0);
        }
    },

    updateUserBtn() {
        const btn = document.getElementById('desktopAccountBtn');
        const user = State.get('user');
        if (btn && user) {
            btn.innerHTML = `<div class="flex-center-circle">${user.name[0].toUpperCase()}</div>`;
            btn.title = user.name;
        } else if (btn) {
            btn.innerHTML = SVG.user;
            btn.title = 'Account';
        }
    },
};





