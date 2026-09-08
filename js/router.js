// js/router.js — Lightweight URL Query Router

import { State } from './state.js';

const VALID_BRANDS = ['silverythm', 'devaramane', 'udugore'];

export const Router = {
    init() {
        // Parse initial URL
        const params = new URLSearchParams(window.location.search);
        const urlBrand = params.get('brand');
        const savedBrand = localStorage.getItem('activeBrand');
        
        let brand = 'silverythm';
        if (urlBrand && VALID_BRANDS.includes(urlBrand)) {
            brand = urlBrand;
        } else if (savedBrand && VALID_BRANDS.includes(savedBrand)) {
            brand = savedBrand;
        }

        State.set('brand', brand);
        localStorage.setItem('activeBrand', brand);
        this._updateURL(brand);

        // Handle back/forward
        window.addEventListener('popstate', () => {
            const p = new URLSearchParams(window.location.search);
            const b = p.get('brand');
            if (b && VALID_BRANDS.includes(b)) {
                State.set('brand', b);
                localStorage.setItem('activeBrand', b);
            }
        });
    },

    navigate(brand) {
        if (!VALID_BRANDS.includes(brand)) return;
        if (brand === State.get('brand')) return;
        
        State.set('brand', brand);
        localStorage.setItem('activeBrand', brand);
        this._updateURL(brand);
    },

    _updateURL(brand) {
        const url = new URL(window.location);
        url.searchParams.set('brand', brand);
        window.history.pushState({ brand }, '', url);
    },
};
