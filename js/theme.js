// js/theme.js — Brand Theme Engine

import { State } from './state.js';

const THEMES = {
    silverythm: {
        name: 'Silverhythm',
        primary: '#1B4963',
        primaryDark: '#0F2D3F',
        primaryLight: '#2A6A8F',
        secondary: '#C0C0C0',
        accent: '#4DA3FF',
        bgHero: 'linear-gradient(135deg, #0F2D3F 0%, #1B4963 100%)',
        bgDark: '#0C0A09',
        bgBody: '#F5F7FA',
        bgSectionAlt: '#F0F4F8',
        bgCard: '#FFFFFF',
        gradientText: 'linear-gradient(135deg, #D9D9D9, #fff, #BFBFBF)',
        hero: {
            badge: 'The Essence of Purity',
            title: 'Divine <span class="gradient-text hero-title-span">Grace</span><br>In Pure Silver.',
            desc: 'Elevate your altar with meticulously handcrafted 999 silver deity frames. A timeless confluence of devotion, art, and heritage.',
            img: 'https://images.unsplash.com/photo-1602526212974-d400e6a1d2f5?q=80&w=1200&auto=format&fit=crop',
            cta1: { text: 'Explore Collection', href: '#products-section', icon: 'arrow-right' },
            cta2: { text: 'Custom Order', href: 'https://wa.me/916364051237', icon: 'message-circle', external: true },
            floatTitle: 'Vinayagar', floatSub: 'Antique Finish',
        },
        marquee: ['999 Pure Silver', 'BIS Hallmarked', 'Pan-India Shipping', 'Lifetime Authenticity', 'Secure Packaging'],
        storyLabel: 'Our Heritage', storyTitle: 'Crafted in Faith,<br>Cast in Purity.',
        storyImg: 'assets/images/story-silverythm.webp',
        ctaStyle: { primary: 'btn-primary-brand', outline: 'btn-outline-brand' }
    },
    devaramane: {
        name: 'Devaramane',
        primary: '#B8860B',
        primaryDark: '#7A5800',
        primaryLight: '#D4A017',
        secondary: '#FDF6EC',
        accent: '#B8860B',
        bgHero: 'linear-gradient(135deg, #1C1200 0%, #3D2800 40%, #7A5800 80%, #B8860B 100%)',
        bgDark: '#1C1200',
        bgBody: '#FDF6EC',
        bgSectionAlt: '#FFFBF3',
        bgCard: '#FFFFFF',
        gradientText: 'linear-gradient(135deg, #B8860B, #D4A017, #7A5800)',
        hero: {
            badge: 'Sacred Traditions',
            title: 'Sacred <span class="gradient-text hero-title-span-gold">Abode</span><br>For Your Home.',
            desc: 'Handpicked spiritual essentials and traditional artifacts to transform your living space into a sanctuary of peace.',
            img: 'https://images.unsplash.com/photo-1618015362903-47f2d3d98ba7?q=80&w=1200&auto=format&fit=crop',
            cta1: { text: 'Shop Now', href: '#products-section', icon: 'shopping-bag' },
            cta2: { text: 'View Catalogue', href: '#products-section', icon: 'grid-2x2' },
            floatTitle: 'Brass Deepa', floatSub: 'Temple Collection',
        },
        marquee: ['Traditional Artifacts', 'Temple Quality', 'All-India Delivery', 'Authentic Craftsmanship', 'Premium Packaging'],
        storyLabel: 'Our Legacy', storyTitle: 'Rooted in Tradition,<br>Crafted with Devotion.',
        storyImg: 'assets/images/story-devaramane.webp',
        ctaStyle: { primary: 'btn-primary-brand', outline: 'btn-outline-brand' }
    },
    udugore: {
        name: 'Udugore',
        primary: '#0D1B4B',
        primaryDark: '#070E2B',
        primaryLight: '#1A2E6E',
        secondary: '#C9A84C',
        accent: '#C9A84C',
        bgHero: 'linear-gradient(135deg, #020818 0%, #070E2B 40%, #0D1B4B 80%, #142260 100%)',
        bgDark: '#020818',
        bgBody: '#F4F6FB',
        bgSectionAlt: '#EDF0F8',
        bgCard: '#FFFFFF',
        gradientText: 'linear-gradient(135deg, #C9A84C, #FFFFFF, #B8860B)',
        hero: {
            badge: 'Curated Gifting',
            purityTag: 'Pure 999.9 Silver Coated',
            title: 'Thoughtful <span class="gradient-text hero-title-span-accent">Gifts</span><br>For Every Joy.',
            desc: 'Curated hampers & bespoke collections in <span class="hero-highlight-span">Pure 999.9 Silver Coated</span> finish, designed to celebrate life\'s milestones with elegance and warmth.',
            img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop',
            cta1: { text: 'Explore Gifts', href: '#products-section', icon: 'gift' },
            cta2: { text: 'Corporate Enquiry', href: 'https://wa.me/916364051237', icon: 'briefcase', external: true },
            floatTitle: 'Festive Hamper', floatSub: 'Premium Collection',
        },
        marquee: ['Handcrafted Gifts', 'Corporate Hampers', 'Pan-India Shipping', 'Premium Packaging', 'Custom Collections'],
        storyLabel: 'Our Philosophy', storyTitle: 'Gifting as an Art,<br>Curated with Care.',
        storyImg: 'assets/images/story-udugore.webp',
        ctaStyle: { primary: 'btn-primary-brand', outline: 'btn-outline-brand' }
    },
};

export const ThemeEngine = {
    themes: THEMES,

    apply(brandId) {
        const t = THEMES[brandId];
        if (!t) return;

        const root = document.documentElement;
        root.style.setProperty('--primary', t.primary);
        root.style.setProperty('--primary-dark', t.primaryDark);
        root.style.setProperty('--primary-light', t.primaryLight);
        root.style.setProperty('--secondary', t.secondary);
        root.style.setProperty('--accent', t.accent);
        root.style.setProperty('--bg-hero', t.bgHero);
        root.style.setProperty('--bg-dark', t.bgDark);
        root.style.setProperty('--bg-body', t.bgBody);
        root.style.setProperty('--bg-section-alt', t.bgSectionAlt);
        root.style.setProperty('--bg-card', t.bgCard);
        root.style.setProperty('--gradient-text', t.gradientText);

        // Dynamic Meta Updates
        const metaMap = {
            silverythm: {
                title: 'Silverhythm | Sacred Silver Deity Frames',
                desc: 'Meticulously handcrafted 999 silver deity frames. Premium gifting and devotional art.',
                image: 'https://silverhythm.com/assets/images/hero-silverhythm.webp'
            },
            devaramane: {
                title: 'Devaramane | Traditional Temple Jewellery',
                desc: 'BIS hallmarked gold and silver jewellery crafted by temple artisans.',
                image: 'https://silverhythm.com/assets/images/hero-devaramane.webp'
            },
            udugore: {
                title: 'Udugore | Curated Gift Hampers',
                desc: 'Premium curated hampers for weddings, festivals, and corporate gifting.',
                image: 'https://silverhythm.com/assets/images/mobile3_hero.webp'
            }
        };

        const m = metaMap[brandId] || metaMap.silverythm;
        document.title = m.title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', m.desc);
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', m.title);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', m.desc);
        document.querySelector('meta[property="og:image"]')?.setAttribute('content', m.image);
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', m.title);
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', m.desc);
        document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', m.image);
    },

    getTheme(brandId) {
        return THEMES[brandId] || THEMES.silverythm;
    },

    init() {
        // Apply on brand change
        State.subscribe('brand', (brand) => this.apply(brand));
        // Apply initial
        this.apply(State.get('brand'));
    },
};



