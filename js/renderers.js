// js/renderers.js — All brand render functions

import { State } from './state.js';
import { ThemeEngine } from './theme.js';
import { SVG } from './icons.js';
import { STORY_CONTENT, FEATURES_CONTENT, TESTIMONIALS_CONTENT, FOOTER_CONTENT, HERO_CONTENT, COLLECTIONS_CONTENT, FOOTER_QUOTES, FOOTER_TAGLINES } from './content.js';

export function renderHero() {
    const el = document.getElementById('hero-section');
    if (!el) return;
    const brand = State.get('brand');

    const h = HERO_CONTENT[brand] || HERO_CONTENT.silverythm;
    const cta2Href = `https://wa.me/${State.get('whatsappNumber') || '916364051237'}`;

    el.className = `hero-section hero-fullbleed hero-brand-${brand}`;
    el.setAttribute('data-brand', brand);

    const isMobile = window.innerWidth < 768;
    const isSilverythm = brand === 'silverythm';

    // Clear any existing slideshow interval
    if (window.heroSlideshowInterval) {
        clearInterval(window.heroSlideshowInterval);
        window.heroSlideshowInterval = null;
    }

    if (isSilverythm) {
        const slides = isMobile 
            ? ['assets/hero/m1.webp?v=1', 'assets/hero/m2.webp?v=1', 'assets/hero/m3.webp?v=1', 'assets/hero/m4.webp?v=1']
            : ['assets/hero/1.webp?v=1', 'assets/hero/2.webp?v=1', 'assets/hero/3.webp?v=1', 'assets/hero/4.webp?v=1'];

        const scrimStyle = isMobile
            ? 'background: linear-gradient(to bottom, transparent 0%, rgba(6, 18, 28, 0.15) 30%, rgba(6, 18, 28, 0.50) 65%, rgba(6, 18, 28, 0.75) 100%);'
            : 'background: linear-gradient(98deg, rgba(6, 18, 28, 0.50) 0%, rgba(6, 18, 28, 0.35) 24%, rgba(6, 18, 28, 0.12) 44%, transparent 60%);';

        el.innerHTML = `
            <div class="hero-slideshow-bg">
                ${slides.map((src, index) => {
                    const bgPos = (!isMobile && (index === 2 || index === 3)) ? 'background-position: center top;' : '';
                    return `<div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${src}'); ${bgPos}"></div>`;
                }).join('')}
            </div>
            <div class="hero-scrim-overlay" style="position: absolute; inset: 0; ${scrimStyle} z-index: 2; pointer-events: none;"></div>
            <div class="hero-fullbleed-content" style="position: relative; z-index: 5;">
                <div class="hero-fb-inner">
                    <div class="hero-badge-group">
                        <span class="hero-badge">✦ ${h.badge}</span>
                        ${h.purityTag ? `<span class="hero-purity-tag">✦ ${h.purityTag}</span>` : ''}
                    </div>
                    <h1 class="hero-fb-title">${h.title}<br>${h.title2}</h1>
                    <p class="hero-fb-desc">${h.desc}</p>
                    <div class="hero-fb-btns">
                        <a href="${h.cta1Href}" class="hero-fb-btn-primary">
                            <span class="hero-btn-text">${h.cta1}</span>
                            <svg class="hero-cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </a>
                        <a href="${cta2Href}" class="hero-fb-btn-secondary" target="_blank" rel="noopener noreferrer">
                            <span class="hero-btn-text">${h.cta2}</span>
                            <svg class="hero-cta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
        el.style.removeProperty('--hero-bg-image');
        el.style.setProperty('--hero-bg-color', 'transparent');

        // Start the slideshow loop
        let currentSlide = 0;
        const slideElements = el.querySelectorAll('.hero-slide');
        if (slideElements.length > 1) {
            window.heroSlideshowInterval = setInterval(() => {
                if (slideElements[currentSlide]) {
                    slideElements[currentSlide].classList.remove('active');
                }
                currentSlide = (currentSlide + 1) % slideElements.length;
                if (slideElements[currentSlide]) {
                    slideElements[currentSlide].classList.add('active');
                }
            }, 5000); // changes every 5 seconds
        }
    } else {
        el.innerHTML = `
            <div class="hero-fullbleed-content">
                <div class="hero-fb-inner">
                    <div class="hero-badge-group">
                        <span class="hero-badge">✦ ${h.badge}</span>
                        ${h.purityTag ? `<span class="hero-purity-tag">✦ ${h.purityTag}</span>` : ''}
                    </div>
                    <h1 class="hero-fb-title">${h.title}<br>${h.title2}</h1>
                    <p class="hero-fb-desc">${h.desc}</p>
                    <div class="hero-fb-btns">
                        <a href="${h.cta1Href}" class="hero-fb-btn-primary">
                            <span class="hero-btn-text">${h.cta1}</span>
                            <svg class="hero-cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </a>
                        <a href="${cta2Href}" class="hero-fb-btn-secondary" target="_blank" rel="noopener noreferrer">
                            <span class="hero-btn-text">${h.cta2}</span>
                            <svg class="hero-cta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
        const heroImg = (isMobile && h.imgs[1]) ? h.imgs[1] : h.imgs[0];
        if (h.gradient && h.gradient !== 'none') {
            el.style.setProperty('--hero-bg-image', `${h.gradient}, url('${heroImg}')`);
        } else {
            el.style.setProperty('--hero-bg-image', `url('${heroImg}')`);
        }
        el.style.setProperty('--hero-bg-color', h.overlayColor || 'transparent');
    }
}

export async function renderMarquee() {
    const section = document.getElementById('marquee-section');
    if (!section) return;

    try {
        const brand = State.get('brand') || 'all';
        const res = await fetch(`api/banner.php?brand=${brand}`);
        const data = await res.json();

        if (!data.settings || data.settings.is_enabled === "0" || !data.banners || data.banners.length === 0) {
            section.classList.add('hidden-section');
            return;
        }

        section.classList.remove('hidden-section');
        section.className = 'banner-strip-section';

        const items = [...data.banners, ...data.banners, ...data.banners];
        const scrollSpeed = parseInt(data.settings.scroll_speed) || 40;

        section.innerHTML = `
            <div class="banner-strip-track banner-animating" id="marqueeTrack">
                ${items.map(b => `
                    <a href="${b.link_url || '#'}" class="banner-item" ${b.link_url ? 'target="_blank"' : ''}>
                        <img src="${b.image_url}" alt="Promotion" loading="lazy">
                    </a>
                `).join('')}
            </div>
        `;
        const track = document.getElementById('marqueeTrack');
        if (track) track.style.setProperty('--marquee-speed', `${scrollSpeed}s`);
    } catch (e) {
        console.error("Banner fetch failed", e);
        section.classList.add('hidden-section');
    }
}

export function renderBrandSpecificSection(initDepthCarousel) {
    const el = document.getElementById('brand-specific-section');
    const brand = State.get('brand');
    el.innerHTML = '';
    el.className = '';

    if (brand === 'silverythm') {
        el.className = 'exclusives-section';
        el.setAttribute('data-brand', 'silverythm');
        el.innerHTML = `
            <div class="exclusives-inner">
                <div class="section-header-row">
                    <h2 class="section-title exclusives-title">Our Exclusive's Gallery</h2>
                </div>
                <div class="exclusives-grid" id="exclusivesGrid">
                    <div class="exclusives-loading">Loading...</div>
                </div>
                <div class="exclusives-cta-row">
                    <a href="silverythm-exclusives.html" class="exclusives-view-more-btn">
                        View Gallery
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                </div>
            </div>
        `;

        // Load top 3 featured exclusives from API
        fetch('api/exclusives.php?limit=3')
            .then(r => r.json())
            .then(items => {
                const grid = document.getElementById('exclusivesGrid');
                if (!grid) return;
                if (!items || items.length === 0) {
                    grid.innerHTML = '<p class="exclusives-empty">No exclusives yet.</p>';
                    return;
                }
                grid.innerHTML = items.map(item => `
                    <div class="exclusive-card">
                        <div class="exclusive-img-wrap">
                            <img src="${item.image_url}" alt="${item.title || 'Exclusive'}" loading="lazy" class="exclusive-img">
                        </div>
                        ${item.title ? `<p class="exclusive-card-title">${item.title}</p>` : ''}
                    </div>
                `).join('');
            })
            .catch(() => {
                const grid = document.getElementById('exclusivesGrid');
                if (grid) grid.innerHTML = '<p class="exclusives-empty">Unable to load.</p>';
            });

        return;
    }

    if (brand === 'devaramane') {
        const isMobile = window.innerWidth < 768;
        const COLLS = COLLECTIONS_CONTENT.devaramane;

        if (isMobile) {
            el.className = 'dc-scroll-root';
            const cardsHTML = COLLS.map((c, i) => `
              <div class="dc-card" data-index="${i}" role="group" aria-label="${c.title}">
                <div class="dc-card-inner">
                  <span class="dc-num">${c.num}</span>
                  <span class="dc-tag">${c.tag}</span>
                  <h3 class="dc-title">${c.title}</h3>
                  <p class="dc-sub">${c.sub}</p>
                  <p class="dc-desc">${c.desc}</p>
                  <a class="dc-link" href="devaramane-collections.html">Explore Collection →</a>
                </div>
              </div>
            `).join('');

            const dotsHTML = COLLS.map((_, i) =>
                `<button class="dc-dot${i === 0 ? ' active' : ''}" aria-label="Collection ${i + 1}"></button>`
            ).join('');

            el.innerHTML = `
              <div class="dc-sticky-wrap">
                <div class="dc-sticky-panel" id="dcPanel">
                  <div class="dc-header">
                    <span class="section-label">OUR COLLECTIONS</span>
                    <h2 class="dc-heading">Crafted for Every Tradition</h2>
                  </div>
                  <div class="dc-stage" id="dcStage">
                    <div class="dc-track" id="dcTrack">${cardsHTML}</div>
                  </div>
                  <div class="dc-dots" id="dcDots">${dotsHTML}</div>
                  <p class="dc-scroll-hint">↓ Keep scrolling to explore</p>
                </div>
              </div>
              <div class="dc-spacer" id="dcSpacer"></div>
            `;

            requestAnimationFrame(() => initDepthCarousel());
        } else {
            el.className = 'devaramane-collections-desktop';
            el.setAttribute('data-brand', 'devaramane');
            el.innerHTML = `
                <div class="container py-40">
                    <div class="section-header text-center mb-48">
                        <span class="section-label">OUR COLLECTIONS</span>
                        <h2 class="section-title">Crafted for Every Tradition</h2>
                    </div>
                    <div class="product-grid grid-4 mt-60">
                        ${COLLS.map(c => `
                            <div class="product-card-deva">
                                <span class="deva-num-large">${c.num}</span>
                                <span class="dc-tag">${c.tag}</span>
                                <h3 class="product-card-name">${c.title}</h3>
                                <p class="product-card-desc">${c.desc}</p>
                                <a class="dc-link" href="devaramane-collections.html">Explore Collection →</a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } else if (brand === 'udugore') {
        el.className = 'occasions-section';
        el.setAttribute('data-brand', 'udugore');

        const isMobile = window.innerWidth < 768;
        const COLLS = COLLECTIONS_CONTENT.udugore;

        if (isMobile) {
            el.innerHTML = `
    <div class="occ-mobile-wrap">
      <div class="occ-mobile-header">
        <h2 class="occ-mobile-heading">Occasions</h2>
      </div>
      <div class="occ-mobile-track" id="occTrack">
        ${COLLS.map(c => `
          <div class="occ-mobile-card">
            <span class="occ-mobile-num">${c.num}</span>
            <h3 class="occ-mobile-title">${c.title}</h3>
            <p class="occ-mobile-desc">${c.desc}</p>
            <a href="#products-section" class="occ-mobile-link">View Collection →</a>
          </div>
        `).join('')}
      </div>
      <div class="occ-mobile-dots" id="occDots">
        ${COLLS.map((_, i) => `<button class="occ-dot${i === 0 ? ' active' : ''}" data-occ-dot="${i}"></button>`).join('')}
      </div>
    </div>
  `;

            const track = document.getElementById('occTrack');
            const dots = document.querySelectorAll('.occ-dot');
            if (track) {
                track.addEventListener('scroll', () => {
                    const cardWidth = track.scrollWidth / 4;
                    const index = Math.round(track.scrollLeft / cardWidth);
                    dots.forEach((d, i) => d.classList.toggle('active', i === index));
                }, { passive: true });
                dots.forEach(dot => {
                    dot.addEventListener('click', () => {
                        const idx = parseInt(dot.dataset.occDot);
                        track.scrollTo({ left: track.scrollWidth / 4 * idx, behavior: 'smooth' });
                    });
                });
            }
        } else {
            el.innerHTML = `
          <div class="container">
            <div class="occasions-header">
              <span class="section-label accent-text">SHOP BY OCCASION</span>
              <h2 class="section-title white-text">Every Moment Deserves a Perfect Gift</h2>
            </div>
            <div class="occasions-scroll mt-60">
              ${COLLS.map(c => `
                <div class="occasion-card">
                  <span class="occasion-num">${c.num}</span>
                  <h3 class="occasion-title">${c.title}</h3>
                  <p class="occasion-desc">${c.desc}</p>
                  <a href="#products-section" class="occasion-link">View Collection →</a>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        }
    }
}

export function renderStory() {
    const el = document.getElementById('story-section');
    const brand = State.get('brand');
    if (brand === 'silverythm') {
        el.innerHTML = '';
        el.className = '';
        el.style.display = 'none';
        return;
    }
    el.style.display = ''; // Reset display style if brand is not silverythm
    const theme = ThemeEngine.getTheme(brand);
    const s = STORY_CONTENT[brand] || STORY_CONTENT.silverythm;
    const isReverse = brand === 'devaramane' || brand === 'udugore';
    el.className = 'story-section';
    el.innerHTML = `
        <div class="story-grid ${isReverse ? 'story-grid--reverse' : ''}">
            <div class="story-img">
                <img src="${theme.storyImg}" alt="${theme.name} Story" loading="lazy">
                <div class="story-img-overlay"></div>
                <div class="story-img-card">
                    <h4 class="story-card-info">${s.cardTitle}</h4>
                    <p class="story-card-sub">${s.cardDesc}</p>
                </div>
            </div>
            <div class="story-content">
                <span class="section-label">${theme.storyLabel}</span>
                <h2 class="story-title-large">
                    ${theme.storyTitle}
                </h2>
                <div class="story-steps">
                    ${s.steps.map(step => `
                        <div class="story-step">
                            <div class="story-dot"></div>
                            <div>
                                <h3>${step.title}</h3>
                                <p>${step.desc}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

export function renderFeatures() {
    const el = document.getElementById('features-section');
    const brand = State.get('brand');

    if (brand === 'silverythm') {
        el.className = 'features-section features-silverythm';
        el.innerHTML = `
            <div class="container">
                <div class="features-grid-premium">
                    <div class="feature-premium-card">
                        <div class="fpc-number">01</div>
                        <div class="fpc-icon">${SVG.gem}</div>
                        <h3 class="fpc-title">Certified Purity</h3>
                        <p class="fpc-desc">999.9 silver purity certificate with every frame.</p>
                        <div class="fpc-line"></div>
                    </div>
                    <div class="feature-premium-card">
                        <div class="fpc-number">02</div>
                        <div class="fpc-icon">${SVG.gift}</div>
                        <h3 class="fpc-title">Heirloom Packaging</h3>
                        <p class="fpc-desc">Premium packaging available with every order.</p>
                        <div class="fpc-line"></div>
                    </div>
                    <div class="feature-premium-card">
                        <div class="fpc-number">03</div>
                        <div class="fpc-icon">${SVG.shield}</div>
                        <h3 class="fpc-title">Insured Shipping</h3>
                        <p class="fpc-desc">Safe transit guaranteed to your doorstep.</p>
                        <div class="fpc-line"></div>
                    </div>
                </div>
            </div>
        `;
    } else {
        const features = FEATURES_CONTENT[brand] || FEATURES_CONTENT.silverythm;
        el.className = 'features-section';
        el.innerHTML = `
            <div class="container">
                <div class="features-grid">
                    ${features.map(f => `
                        <div class="feature-item">
                            <div class="feature-icon">${SVG[f.icon] || SVG.gem}</div>
                            <div class="feature-text">
                                <h3 class="feature-title">${f.title}</h3>
                                <p class="feature-desc">${f.desc}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    setTimeout(() => {
        const featureCards = document.querySelectorAll('.feature-premium-card, .feature-item');

        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('animate-in');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

        featureCards.forEach(c => io.observe(c));
    }, 150);
}

export function renderTestimonials() {
    const el = document.getElementById('testimonials-section');
    if (!el) return;
    const brand = State.get('brand');
    const testimonials = TESTIMONIALS_CONTENT[brand] || TESTIMONIALS_CONTENT.silverythm;

    el.className = 'testimonials-section';
    el.setAttribute('data-brand', brand);
    
    // Set custom avatar colors according to the brand
    let avatarGrads = [];
    if (brand === 'silverythm') {
        avatarGrads = [
            'linear-gradient(135deg, #032836, #0a7090)',
            'linear-gradient(135deg, #053d52, #008080)',
            'linear-gradient(135deg, #064b61, #4682b4)',
            'linear-gradient(135deg, #02202b, #0c566e)',
            'linear-gradient(135deg, #043142, #1f7a8c)',
            'linear-gradient(135deg, #011620, #007799)'
        ];
    } else if (brand === 'devaramane') {
        avatarGrads = [
            'linear-gradient(135deg, #1C1200, #b8860b)',
            'linear-gradient(135deg, #251800, #cd7f32)',
            'linear-gradient(135deg, #2E1F00, #d4af37)',
            'linear-gradient(135deg, #190f00, #a0522d)',
            'linear-gradient(135deg, #221400, #8b4513)',
            'linear-gradient(135deg, #1b0e00, #d2691e)'
        ];
    } else { // udugore
        avatarGrads = [
            'linear-gradient(135deg, #020818, #c9a84c)',
            'linear-gradient(135deg, #080f28, #b8860b)',
            'linear-gradient(135deg, #0d1b4b, #d4af37)',
            'linear-gradient(135deg, #01040d, #b89742)',
            'linear-gradient(135deg, #04091a, #daa520)',
            'linear-gradient(135deg, #050d26, #b2933d)'
        ];
    }

    el.innerHTML = `
        <div class="testimonials-container">
            <h2 class="testimonials-carousel-title">Our Clients Say</h2>
            <div class="testimonials-carousel-wrapper">
                <!-- Prev Button -->
                <button class="t-carousel-btn t-btn-prev" aria-label="Previous Review">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </button>

                <!-- Slides Window -->
                <div class="t-slides-window">
                    <div class="t-slides-track">
                        ${testimonials.map((t, i) => `
                            <div class="t-slide ${i === 0 ? 'active' : ''}" data-slide-index="${i}">
                                <div class="t-avatar-wrapper">
                                    <div class="t-avatar-inner" style="background: ${avatarGrads[i] || avatarGrads[0]};">
                                        ${t.avatar ? `<img src="${t.avatar}" alt="${t.name}" loading="lazy">` : (t.initials || t.name[0])}
                                    </div>
                                </div>
                                <div class="t-quote-container">
                                    <p class="t-quote-text">“${t.text}”</p>
                                </div>
                                <div class="t-author-name">${t.name}</div>
                                <div class="t-author-role">${t.role}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Next Button -->
                <button class="t-carousel-btn t-btn-next" aria-label="Next Review">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </button>
            </div>

            <!-- Dots -->
            <div class="t-dots-container">
                ${testimonials.map((_, i) => `
                    <button class="t-dot ${i === 0 ? 'active' : ''}" data-dot-index="${i}" aria-label="Go to slide ${i + 1}"></button>
                `).join('')}
            </div>
        </div>
    `;

    // Setup interactive carousel sliding/swiping logic
    setTimeout(() => {
        const slides = el.querySelectorAll('.t-slide');
        const dots = el.querySelectorAll('.t-dot');
        const prevBtn = el.querySelector('.t-btn-prev');
        const nextBtn = el.querySelector('.t-btn-next');
        if (!slides.length) return;

        let currentIndex = 0;
        let autoplayTimer = null;

        function showSlide(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;

            currentIndex = index;

            slides.forEach((slide, idx) => {
                if (idx === currentIndex) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });

            dots.forEach((dot, idx) => {
                if (idx === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        function nextSlide() {
            showSlide(currentIndex + 1);
        }

        function prevSlide() {
            showSlide(currentIndex - 1);
        }

        function startAutoplay() {
            stopAutoplay();
            autoplayTimer = setInterval(nextSlide, 6000);
        }

        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                startAutoplay();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                startAutoplay();
            });
        }

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.getAttribute('data-dot-index'), 10);
                showSlide(idx);
                startAutoplay();
            });
        });

        // Swipe support for touch devices
        const windowEl = el.querySelector('.t-slides-window');
        if (windowEl) {
            let startX = 0;
            let currentX = 0;
            let isSwiping = false;

            windowEl.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isSwiping = true;
                stopAutoplay();
            }, { passive: true });

            windowEl.addEventListener('touchmove', (e) => {
                if (!isSwiping) return;
                currentX = e.touches[0].clientX;
            }, { passive: true });

            windowEl.addEventListener('touchend', () => {
                if (!isSwiping) return;
                isSwiping = false;
                const diffX = startX - currentX;
                if (Math.abs(diffX) > 40) {
                    if (diffX > 0) {
                        nextSlide();
                    } else {
                        prevSlide();
                    }
                }
                startAutoplay();
            });
        }

        startAutoplay();
    }, 50);
}

export function renderContact() {
    const el = document.getElementById('contact-section');
    if (!el) return;
    el.innerHTML = '';
    el.classList.add('hidden-section');
}

export function renderAboutTeaser() {
    const el = document.getElementById('about-teaser-section');
    if (!el) return;
    const brand = State.get('brand');

    if (brand !== 'silverythm') {
        el.innerHTML = '';
        el.className = '';
        el.removeAttribute('style');
        el.classList.add('hidden-section');
        // Cancel any running particle animation
        if (window.__teaserRafId) {
            cancelAnimationFrame(window.__teaserRafId);
            window.__teaserRafId = null;
        }
        if (window.__teaserResizeFn) {
            window.removeEventListener('resize', window.__teaserResizeFn);
            window.__teaserResizeFn = null;
        }
        return;
    }
    el.classList.remove('hidden-section');
    el.classList.add('visible-section');

    // Cancel any previous animation loop and resize listener before re-init
    if (window.__teaserRafId) cancelAnimationFrame(window.__teaserRafId);
    if (window.__teaserResizeFn) window.removeEventListener('resize', window.__teaserResizeFn);

    el.innerHTML = `
        <canvas class="teaser-particles" id="teaserCanvas"></canvas>

        <div class="teaser-content">
            <div class="teaser-overline">THE STORY OF SILVERHYTHM</div>
            <h2 class="teaser-headline" id="teaserHeadline">"A Quiet Legacy of Silver."</h2>
            <svg class="ornament-svg" viewBox="0 0 240 20">
                <line x1="0" y1="10" x2="100" y2="10" class="ornament-line" id="ornamentLeft" />
                <path d="M115 10 L120 5 L125 10 L120 15 Z" fill="rgba(255,255,255,0.2)" />
                <line x1="140" y1="10" x2="240" y2="10" class="ornament-line" id="ornamentRight" />
            </svg>
            <div class="teaser-pull-quote" id="teaserQuote">
                "Founded by an architect. Rooted in a legacy of craft. Every piece a quiet conversation between devotion and design."
            </div>

            <div class="teaser-steps">
                ${STORY_CONTENT.silverythm.steps.map((s, i) => `
                    <div class="teaser-step-box">
                        <span class="tsb-num">0${i + 1}</span>
                        <h4>${s.title}</h4>
                        <p>${s.desc}</p>
                    </div>
                `).join('')}
            </div>

            <div class="teaser-owner-note" id="teaserOwnerNote">
                <p class="owner-quote">"For me, silver is more than a metal—it's a medium to express devotion through design."</p>
                <p class="owner-name">- vandana priya</p>
            </div>

            <a href="about.html" class="glass-cta mt-40">
                DISCOVER OUR FULL STORY →
            </a>
        </div>

        <div class="top-fade"></div>
        <div class="bottom-fade"></div>
    `;

    const canvas = document.getElementById('teaserCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = el.offsetWidth;
        canvas.height = el.offsetHeight;
    }
    window.__teaserResizeFn = resize;
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 55; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 0.8 + Math.random() * 0.8,
            vx: -0.2 + Math.random() * 0.4,
            vy: -0.2 - Math.random() * 0.6,
            o: 0.15 + Math.random() * 0.2
        });
    }

    let _rafId; window.__teaserRafId = null;
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < 0) p.y = canvas.height;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${p.o})`;
            ctx.fill();
        });
        _rafId = requestAnimationFrame(animateParticles);
        window.__teaserRafId = _rafId;
    }
    animateParticles();

    // Pause when tab is hidden, resume when visible — saves battery on mobile
    function handleVisibility() {
        if (document.hidden) {
            cancelAnimationFrame(_rafId);
            window.__teaserRafId = null;
        } else {
            if (!window.__teaserRafId) {
                animateParticles();
            }
        }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    // Clean up visibility listener when brand switches
    State.subscribe('brand', () => {
        document.removeEventListener('visibilitychange', handleVisibility);
    });

    State.subscribe('brand', () => {
        cancelAnimationFrame(_rafId);
        window.removeEventListener('resize', resize);
    });

    const headline = document.getElementById('teaserHeadline');
    if (headline) headline.classList.add('animate-in');

    const totalHeadlineTime = 1200;
    setTimeout(() => {
        const left = document.getElementById('ornamentLeft');
        const right = document.getElementById('ornamentRight');
        if (left) left.classList.add('animate');
        if (right) right.classList.add('animate');
    }, totalHeadlineTime);

    setTimeout(() => {
        const quote = document.getElementById('teaserQuote');
        const ownerNote = document.getElementById('teaserOwnerNote');
        const steps = document.querySelector('.teaser-steps');
        if (quote) quote.classList.add('animate-in');
        if (ownerNote) ownerNote.classList.add('animate-in');
        if (steps) steps.classList.add('animate-in');
    }, totalHeadlineTime + 400);
}

export function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    const brand = State.get('brand');
    el.className = 'site-footer';

    const waNumber = State.get('whatsappNumber') || '916364051237';
    const tag = FOOTER_TAGLINES[brand] || FOOTER_TAGLINES.silverythm;
    const quote = FOOTER_QUOTES[brand] || FOOTER_QUOTES.silverythm;

    const logoSrc = brand === 'silverythm' ? 'assets/Logo.png' : 'assets/images/devaramane_logo.webp';
    const instaHref = brand === 'silverythm' ? 'https://www.instagram.com/silverhythm' : '#';
    const year = new Date().getFullYear();

    el.innerHTML = `
        <div class="footer-luxury">

            <!-- Top rule -->
            <div class="footer-rule">
                <span class="footer-rule-line"></span>
                <span class="footer-rule-diamond"></span>
                <span class="footer-rule-line"></span>
            </div>

            <!-- Logo -->
            <div class="footer-logo-wrap">
                <img src="${logoSrc}" alt="${brand}" class="footer-logo-img" loading="lazy">
            </div>

            <!-- Italic quote -->
            <p class="footer-quote">${quote}</p>

            <!-- Tagline -->
            <p class="footer-tagline-text">${tag}</p>

            <!-- Legal Links -->
            <nav class="footer-legal-links" id="footerLinks">
                <button class="footer-legal-btn" data-action="shipping">Shipping Policy</button>
                <span class="footer-legal-sep">&middot;</span>
                <button class="footer-legal-btn" data-action="terms">Terms &amp; Conditions</button>
                <span class="footer-legal-sep">&middot;</span>
                <button class="footer-legal-btn" data-action="care">Care Guide</button>
            </nav>

            <!-- Bottom rule -->
            <div class="footer-rule footer-rule-wrap">
                <span class="footer-rule-line"></span>
                <span class="footer-rule-diamond"></span>
                <span class="footer-rule-line"></span>
            </div>

            <!-- Copyright -->
            <p class="footer-copy-text">&copy; ${year} ${brand.charAt(0).toUpperCase() + brand.slice(1)} &middot; Handcrafted in India</p>

        </div>
    `;

    // Footer Event Delegation
    const footerNav = document.getElementById('footerLinks');
    if (footerNav) {
        footerNav.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (btn && window.__openSupport) {
                window.__openSupport(btn.dataset.action, brand);
            }
        });
    }
}

export function renderWhatsAppFab() {
    let el = document.getElementById('wa-fab');
    if (!el) {
        el = document.createElement('a');
        el.id = 'wa-fab';
        document.body.appendChild(el);
    }
    el.className = 'wa-fab';
    el.href = `https://wa.me/${State.get('whatsappNumber') || '916364051237'}`;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    el.setAttribute('aria-label', 'WhatsApp');
    el.innerHTML = SVG.whatsappFab.replace('width="28" height="28"', 'width="22" height="22"');
}

export function renderInstagramFab() {
    let el = document.getElementById('instagram-fab');
    if (!el) {
        el = document.createElement('a');
        el.id = 'instagram-fab';
        el.href = 'https://www.instagram.com/silverhythm';
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.setAttribute('aria-label', 'Instagram');
        el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
        document.body.appendChild(el);
    }
    el.classList.add('flex-section');
}

export function applyBrandClosingTheme() {
    const brand = State.get('brand');
    const wrap = document.getElementById('brand-closing-wrap');
    if (!wrap) return;

    if (brand === 'silverythm') {
        wrap.classList.add('peacock-texture');
        const footer = document.getElementById('site-footer');
        if (footer) {
            footer.classList.add('no-bg');
        }
    } else {
        wrap.classList.remove('peacock-texture');
        const footer = document.getElementById('site-footer');
        if (footer) {
            footer.classList.remove('no-bg');
            if (brand !== 'devaramane' && brand !== 'udugore') {
                footer.classList.add('brand-bg');
            } else {
                footer.classList.remove('brand-bg');
            }
        }
    }
}

export async function renderReels() {
    const el = document.getElementById('reels-section');
    if (!el) return;
    const brand = State.get('brand');

    try {
        const res = await fetch(`api/videos.php?brand=${brand}`);
        const videos = await res.json();
        if (!videos || videos.length === 0) {
            el.innerHTML = '';
            el.className = 'hidden-section';
            return;
        }
        el.className = 'reels-section';
        el.setAttribute('data-brand', brand);
        el.innerHTML = `
            <div class="container reels-header">
                <span class="section-label">From Our Studio</span>
                <h2 class="section-title">Watch &amp; Explore</h2>
            </div>
            <div class="reels-track-wrap" id="reelsTrackWrap">
                <div class="reels-track" id="reelsTrack">
                    ${videos.map((v, i) => `
                        <div class="reel-card" data-index="${i}" data-src="${v.video_url}" data-title="${v.title || ''}" data-sub="${v.description || ''}">
                            <div class="reel-thumb-wrap">
                                ${v.thumbnail_url
                                    ? `<img src="${v.thumbnail_url}" class="reel-thumb" loading="lazy" alt="${v.title || 'Video'}">`
                                    : `<div class="reel-thumb reel-thumb-blank"></div>`
                                }
                                <!-- Gradient overlay -->
                                <div class="reel-gradient"></div>
                                <!-- Circular play button -->
                                <div class="reel-play-btn" aria-label="Play">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>
                                </div>
                                <!-- Title and subtitle at bottom -->
                                ${(v.title || v.description) ? `
                                <div class="reel-card-info">
                                    ${v.title ? `<p class="reel-card-title">${v.title}</p>` : ''}
                                    ${v.description ? `<p class="reel-card-sub">${v.description}</p>` : ''}
                                </div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="reels-dots" id="reelsDots">
                ${videos.map((_, i) => `<button class="reel-dot${i === 0 ? ' active' : ''}" data-reel-dot="${i}"></button>`).join('')}
            </div>
        `;

        // Swipe / scroll dots sync
        const track = document.getElementById('reelsTrack');
        const dots = document.querySelectorAll('.reel-dot');
        if (track) {
            track.addEventListener('scroll', () => {
                const cardW = track.querySelector('.reel-card')?.offsetWidth + 16 || 200;
                const idx = Math.round(track.scrollLeft / cardW);
                dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            }, { passive: true });
            dots.forEach(dot => {
                dot.addEventListener('click', () => {
                    const idx = parseInt(dot.dataset.reelDot);
                    const cardW = track.querySelector('.reel-card')?.offsetWidth + 16 || 200;
                    track.scrollTo({ left: cardW * idx, behavior: 'smooth' });
                });
            });
        }

        // ── Video player overlay appended to BODY so it's never clipped ──
        // Remove any existing player first
        document.getElementById('reelPlayerOverlay')?.remove();

        const overlayEl = document.createElement('div');
        overlayEl.className = 'reel-player-overlay';
        overlayEl.id = 'reelPlayerOverlay';
        overlayEl.innerHTML = `
            <button class="reel-player-close" id="reelPlayerClose" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div class="reel-player-inner">
                <video class="reel-player-video" id="reelPlayerVideo" playsinline controls loop></video>
            </div>
        `;
        document.body.appendChild(overlayEl);

        const overlay = document.getElementById('reelPlayerOverlay');
        const playerVideo = document.getElementById('reelPlayerVideo');
        const closeBtn = document.getElementById('reelPlayerClose');

        const closePlayer = () => {
            overlay.classList.remove('open');
            document.body.classList.remove('no-scroll');
            playerVideo.pause();
            playerVideo.src = '';
        };

        el.querySelectorAll('.reel-card').forEach(card => {
            card.addEventListener('click', () => {
                const src = card.dataset.src;
                playerVideo.src = src;
                overlay.classList.add('open');
                document.body.classList.add('no-scroll');
                playerVideo.play().catch(() => {});
            });
        });

        closeBtn?.addEventListener('click', closePlayer);

        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.reel-player-inner') === null) {
                // Clicked backdrop
                if (e.target === overlay) closePlayer();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay?.classList.contains('open')) closePlayer();
        });

    } catch(e) {
        el.innerHTML = '';
        el.className = 'hidden-section';
    }
}

export function renderSizesCarousel() {
    const el = document.getElementById('sizes-carousel-section');
    if (!el) return;
    const brand = State.get('brand');

    if (brand !== 'silverythm') {
        el.innerHTML = '';
        el.style.display = 'none';
        return;
    }

    el.style.display = 'block';

    el.innerHTML = `
<div class="sizes-ambient-glow"></div>
<div class="sizes-ambient-glow-secondary"></div>

<div class="container py-48">
  <div class="section-header text-center mb-40">
    <div class="luxury-eyebrow-wrap">
      <span class="luxury-eyebrow-line"></span>
      <span class="section-label">CUSTOM DESIGN STUDIO</span>
      <span class="luxury-eyebrow-line"></span>
    </div>
    <h2 class="section-title">Our Standard Sizes &amp; Customisation</h2>
    <p class="sizes-section-subtitle">Visualise handcrafted pure 999.9 silver deity frames tailored for your sacred home mandir.</p>
  </div>

  <div class="sizes-customisation-layout">
    
    <!-- Left Column: Steps 01 & 02 -->
    <div class="sizes-layout-col sizes-col-left">
      <!-- Step 01 -->
      <div class="luxury-step-card" data-step="1">
        <div class="step-card-header">
          <div class="step-icon-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 3H3v18h18V3z"/>
              <path d="M9 3v18"/>
              <path d="M15 3v18"/>
              <path d="M3 9h18"/>
              <path d="M3 15h18"/>
            </svg>
          </div>
          <span class="step-num-pill">STEP 01</span>
        </div>
        <div class="step-card-body">
          <h3 class="step-card-title">Share Sanctum Dimensions</h3>
          <p class="step-card-text">Provide your pooja room wall or niche measurements. Our temple architects custom-scale proportions for ideal Vastu alignment.</p>
          <div class="step-feature-tag">✦ Tailored to Exact Inch</div>
        </div>
      </div>

      <!-- Step 02 -->
      <div class="luxury-step-card" data-step="2">
        <div class="step-card-header">
          <div class="step-icon-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <span class="step-num-pill">STEP 02</span>
        </div>
        <div class="step-card-body">
          <h3 class="step-card-title">Choose Sacred Deities</h3>
          <p class="step-card-text">Select your revered deities from our divine collection — Lord Balaji, Goddess Laxmi, Ganesha or bespoke Divine Trios.</p>
          <div class="step-feature-tag">✦ 999.9 Pure Silver Idols</div>
        </div>
      </div>
    </div>

    <!-- Center Column: Photorealistic Mandir Interactive Showcase -->
    <div class="sizes-layout-col sizes-col-center">
      <div class="god-room-showcase">
        
        <!-- Floating Glassmorphic Mandir Badge -->
        <div class="god-room-badge-banner">
          <span class="god-room-pill">
            <span class="pill-sparkle">✦</span>
            LUXURY HOME MANDIR · REAL SPACE PREVIEW
            <span class="pill-sparkle">✦</span>
          </span>
        </div>

        <!-- Carousel Window Displaying Frame Sizes Fitted on Mandir Wall -->
        <div class="sizes-carousel-wrap">
          <div class="sizes-carousel-track" id="sizesTrack">
            
            <!-- Slide 1: Standard Sizes (4 Pure Silver Frames Fitted) -->
            <div class="sizes-slide" data-slide="0">
              <div class="mandir-view-wrap">
                <img
                  src="assets/images/4photoframes.png"
                  alt="Standard Pure Silver 4 Frames fitted originally in Luxury Home Mandir"
                  class="mandir-view-photo"
                  loading="lazy"
                >
                <div class="mandir-view-gradient"></div>
              </div>
            </div>

            <!-- Slide 2: Customise 18x36 Landscape Frame Fitted -->
            <div class="sizes-slide" data-slide="1">
              <div class="mandir-view-wrap">
                <img
                  src="assets/images/home-god-room-36x18.jpg"
                  alt="18x36 inch Landscape Pure Silver Frame fitted in Luxury Home Mandir"
                  class="mandir-view-photo"
                  loading="lazy"
                >
                <div class="mandir-view-gradient"></div>
              </div>
            </div>

            <!-- Slide 3: Customise 22x50 Grand Mandir Frame Fitted -->
            <div class="sizes-slide" data-slide="2">
              <div class="mandir-view-wrap">
                <img
                  src="assets/images/home-god-room-50x22.jpg"
                  alt="22x50 inch Grand Panoramic Pure Silver Frame fitted in Luxury Home Mandir"
                  class="mandir-view-photo"
                  loading="lazy"
                >
                <div class="mandir-view-gradient"></div>
              </div>
            </div>

            <!-- Slide 4: Customise 18x22 Devotional Portrait Frame Fitted -->
            <div class="sizes-slide" data-slide="3">
              <div class="mandir-view-wrap">
                <img
                  src="assets/images/home-god-room-22x18.jpg"
                  alt="18x22 inch Devotional Portrait Pure Silver Frame fitted in Luxury Home Mandir"
                  class="mandir-view-photo"
                  loading="lazy"
                >
                <div class="mandir-view-gradient"></div>
              </div>
            </div>

          </div>
        </div>

        <!-- Controls: Floating Glassmorphic Tabs & Nav Arrows -->
        <div class="god-room-controls">
          <button class="sizes-arrow-btn sizes-prev-btn" id="sizesPrevBtn" aria-label="Previous Frame">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div class="sizes-pill-tabs" id="sizesPillTabs">
            <button class="size-pill-tab active" data-index="0">Standard (4 Frames)</button>
            <button class="size-pill-tab" data-index="1">18" × 36"</button>
            <button class="size-pill-tab" data-index="2">22" × 50"</button>
            <button class="size-pill-tab" data-index="3">18" × 22"</button>
          </div>

          <button class="sizes-arrow-btn sizes-next-btn" id="sizesNextBtn" aria-label="Next Frame">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

      </div>
    </div>

    <!-- Right Column: Steps 03 & 04 -->
    <div class="sizes-layout-col sizes-col-right">
      <!-- Step 03 -->
      <div class="luxury-step-card" data-step="3">
        <div class="step-card-header">
          <div class="step-icon-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a7 7 0 1 0 7 7"/>
            </svg>
          </div>
          <span class="step-num-pill">STEP 03</span>
        </div>
        <div class="step-card-body">
          <h3 class="step-card-title">Select Artisan Polish</h3>
          <p class="step-card-text">Choose your preferred sacred finish to harmonize with your pooja room decor and lighting.</p>
          
          <div class="polish-chips-grid">
            <div class="polish-chip" title="Pure 24K Gold Finish">
              <span class="polish-swatch swatch-gold"></span>
              <span class="polish-label">Gold</span>
            </div>
            <div class="polish-chip" title="Pure Silver Finish">
              <span class="polish-swatch swatch-silver"></span>
              <span class="polish-label">Silver</span>
            </div>
            <div class="polish-chip" title="Antique Royal Gold">
              <span class="polish-swatch swatch-antique-gold"></span>
              <span class="polish-label">Antique Gold</span>
            </div>
            <div class="polish-chip" title="Antique Sterling Silver">
              <span class="polish-swatch swatch-antique-silver"></span>
              <span class="polish-label">Antique Silver</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 04 -->
      <div class="luxury-step-card" data-step="4">
        <div class="step-card-header">
          <div class="step-icon-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <rect x="7" y="7" width="10" height="10" rx="1"/>
            </svg>
          </div>
          <span class="step-num-pill">STEP 04</span>
        </div>
        <div class="step-card-body">
          <h3 class="step-card-title">Select Preferred Frame</h3>
          <p class="step-card-text">Premium handcrafted enclosures crafted by traditional wood and metal artisans.</p>
          
          <div class="frames-chips-wrap">
            <span class="frame-tag">Rosewood Inlay</span>
            <span class="frame-tag">Rosewood Plain</span>
            <span class="frame-tag">Rosewood Flat</span>
            <span class="frame-tag">Silver Frame</span>
            <span class="frame-tag">Brass Frame</span>
            <span class="frame-tag">Fibre Frame</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
    `;

    const track = document.getElementById('sizesTrack');
    const nextBtn = document.getElementById('sizesNextBtn');
    const prevBtn = document.getElementById('sizesPrevBtn');
    const pillTabs = el.querySelectorAll('.size-pill-tab');

    if (track) {
        const updateActiveTab = (index) => {
            pillTabs.forEach((tab, i) => {
                const isActive = i === index;
                tab.classList.toggle('active', isActive);
                if (isActive) {
                    try {
                        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    } catch(e) {}
                }
            });
        };

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const current = Math.round(track.scrollLeft / track.offsetWidth);
                const next = (current + 1) % 4;
                track.scrollTo({ left: track.offsetWidth * next, behavior: 'smooth' });
                updateActiveTab(next);
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const current = Math.round(track.scrollLeft / track.offsetWidth);
                const prev = (current - 1 + 4) % 4;
                track.scrollTo({ left: track.offsetWidth * prev, behavior: 'smooth' });
                updateActiveTab(prev);
            });
        }

        pillTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const idx = parseInt(tab.dataset.index, 10);
                track.scrollTo({ left: track.offsetWidth * idx, behavior: 'smooth' });
                updateActiveTab(idx);
            });
        });

        // Update active tab on scroll
        let scrollTimeout;
        track.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const current = Math.round(track.scrollLeft / track.offsetWidth);
                updateActiveTab(current);
            }, 50);
        }, { passive: true });

        // Touch swipe support
        let touchStartX = 0;
        track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                const current = Math.round(track.scrollLeft / track.offsetWidth);
                const next = diff > 0 ? Math.min(current + 1, 3) : Math.max(current - 1, 0);
                track.scrollTo({ left: track.offsetWidth * next, behavior: 'smooth' });
                updateActiveTab(next);
            }
        }, { passive: true });
    }
}

export function renderWallPreviewSection() {
    const el = document.getElementById('wall-preview-section');
    if (!el) return;
    const brand = State.get('brand');

    // Only render on Silverhythm brand and only on mobile viewports
    if (brand !== 'silverythm' || window.innerWidth >= 768) {
        el.innerHTML = '';
        el.style.display = 'none';
        return;
    }
    el.style.display = 'block';

    el.innerHTML = `
        <div class="wall-preview-intro-container">
            <div class="wp-intro-left">
                <span class="wp-intro-badge">NEW MOBILE FEATURE</span>
                <h2 class="wp-intro-title">See It in Your Space Before You Buy</h2>
                <p class="wp-intro-text">
                    We have introduced a <strong>Wall Preview</strong> feature. You can now visualize exactly how our sacred silver deity frames look on your walls before ordering.
                </p>
                <div class="wp-intro-steps">
                    <div class="wp-intro-step">
                        <span class="wp-intro-step-num">1</span>
                        <div class="wp-intro-step-content">
                            <strong>Select a Frame</strong>
                            <span>Go to any Silverhythm product page.</span>
                        </div>
                    </div>
                    <div class="wp-intro-step">
                        <span class="wp-intro-step-num">2</span>
                        <div class="wp-intro-step-content">
                            <strong>Tap "Preview"</strong>
                            <span>Look for the camera icon in the bottom navigation.</span>
                        </div>
                    </div>
                    <div class="wp-intro-step">
                        <span class="wp-intro-step-num">3</span>
                        <div class="wp-intro-step-content">
                            <strong>Position & Fit</strong>
                            <span>Point your camera at your wall or upload a photo to visualize it live.</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="wp-intro-right">
                <div class="wp-phone-mockup">
                    <div class="wp-phone-notch"></div>
                    <div class="wp-phone-screen">
                        <!-- Crop the exact product page UI mockup from wall-preview-poster.webp -->
                        <img src="assets/images/wall-preview-poster.webp" class="wp-phone-poster-crop" alt="Wall Preview Product Page UI Screenshot">
                    </div>
                </div>
            </div>
        </div>
    `;
}


