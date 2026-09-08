/* —— ABOUT PAGE LOGIC —— */

// —— CURSOR ——
function initCursor() {
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursor-ring');
    if (!cursor || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.setProperty('left', (mx - 4) + 'px');
        cursor.style.setProperty('top', (my - 4) + 'px');
    });

    (function animRing() {
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.setProperty('left', (rx - 16) + 'px');
        ring.style.setProperty('top', (ry - 16) + 'px');
        requestAnimationFrame(animRing);
    })();

    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => {
            ring.style.setProperty('width', '48px');
            ring.style.setProperty('height', '48px');
            ring.style.setProperty('border-color', 'rgba(255,255,255,0.55)');
        });
        el.addEventListener('mouseleave', () => {
            ring.style.setProperty('width', '32px');
            ring.style.setProperty('height', '32px');
            ring.style.setProperty('border-color', 'rgba(255,255,255,0.35)');
        });
    });
}

// —— PROGRESS BAR ——
function initProgress() {
    const prog = document.getElementById('progress');
    if (!prog) return;
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100);
        prog.style.setProperty('width', scrollPercent + '%');
    }, { passive: true });
}

// —— NAV ——
function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.classList.toggle('solid', window.scrollY > 80);
    }, { passive: true });
}

// —— HERO TITLE ——
function initHero() {
    const el = document.getElementById('hero-title');
    if (!el) return;
    const words = ['A', 'Quiet', 'Legacy', 'of', 'Silver.'];
    el.innerHTML = words.map((w, i) =>
        `<span class="word"><span class="animate-delay-item">${w}&nbsp;</span></span>`
    ).join('');

    el.querySelectorAll('.animate-delay-item').forEach((span, i) => {
        span.style.setProperty('--delay', `${0.5 + i * 0.15}s`);
    });

    setTimeout(() => {
        const rule = document.getElementById('hero-rule');
        if (rule) rule.classList.add('drawn');
    }, 2000);
}

// —— CANVAS ANIMATIONS ——
function initCanvases() {
    // Silver Dust (CH1)
    const dc = document.getElementById('ch1-dust');
    if (dc) {
        const dctx = dc.getContext('2d');
        let dpts = [];
        const resz = () => {
            dc.width = dc.offsetWidth || window.innerWidth;
            dc.height = dc.offsetHeight || window.innerHeight;
        };
        window.addEventListener('resize', resz, { passive: true });
        resz();

        for (let i = 0; i < 55; i++) {
            dpts.push({
                x: Math.random() * dc.width,
                y: Math.random() * dc.height,
                r: 0.3 + Math.random() * 1.1,
                vx: (Math.random() - 0.5) * 0.18,
                vy: -0.08 - Math.random() * 0.22,
                o: 0.04 + Math.random() * 0.16
            });
        }

        (function dtick() {
            dctx.clearRect(0, 0, dc.width, dc.height);
            dpts.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y < 0) p.y = dc.height;
                if (p.x < 0) p.x = dc.width;
                if (p.x > dc.width) p.x = 0;
                dctx.beginPath();
                dctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                dctx.fillStyle = `rgba(200,216,232,${p.o})`;
                dctx.fill();
            });
            requestAnimationFrame(dtick);
        })();
    }

    // Golden Dust (CH2)
    const canvas = document.getElementById('ch2-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let pts = [];
        const resz = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', resz, { passive: true });
        resz();

        for (let i = 0; i < 60; i++) {
            pts.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: 0.5 + Math.random() * 1.2,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -0.1 - Math.random() * 0.3,
                o: 0.06 + Math.random() * 0.18,
                c: Math.random() > 0.5 ? '139,111,71' : '201,168,124'
            });
        }

        (function tick() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pts.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y < 0) p.y = canvas.height;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.c},${p.o})`;
                ctx.fill();
            });
            requestAnimationFrame(tick);
        })();
    }

    // Vision Starfield (CH6)
    const vc = document.getElementById('vision-canvas');
    if (vc) {
        const vctx = vc.getContext('2d');
        let stars = [];
        const resz = () => {
            vc.width = vc.offsetWidth || window.innerWidth;
            vc.height = vc.offsetHeight || window.innerHeight;
        };
        window.addEventListener('resize', resz, { passive: true });
        resz();

        for (let i = 0; i < 120; i++) {
            stars.push({
                x: Math.random() * vc.width,
                y: Math.random() * vc.height,
                r: 0.2 + Math.random() * 0.8,
                o: 0.02 + Math.random() * 0.12,
                pulse: Math.random() * Math.PI * 2,
                speed: 0.01 + Math.random() * 0.02
            });
        }

        (function vtick() {
            vctx.clearRect(0, 0, vc.width, vc.height);
            stars.forEach(s => {
                s.pulse += s.speed;
                const ao = s.o * (0.5 + 0.5 * Math.sin(s.pulse));
                vctx.beginPath();
                vctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                vctx.fillStyle = `rgba(200,216,232,${ao})`;
                vctx.fill();
            });
            requestAnimationFrame(vtick);
        })();
    }
}

// —— SVG SCROLL LINKED (CH4) ——
function initScrollSVG() {
    const svgEl = document.getElementById('ch4-svg-stage');
    const section = document.getElementById('ch4');
    if (!svgEl || !section) return;

    const paths = Array.from(svgEl.querySelectorAll('.svg-draw'));
    const lengths = [];
    paths.forEach((p, i) => {
        let len = 200;
        try { if (p.getTotalLength) len = p.getTotalLength(); } catch (e) { }
        lengths[i] = len;
        p.style.setProperty('stroke-dasharray', len);
        p.style.setProperty('stroke-dashoffset', len);
    });

    const STAGGER = 0.06;
    function onScroll() {
        const rect = section.getBoundingClientRect();
        if (rect.top > window.innerHeight * 2 || rect.bottom < -window.innerHeight) return;

        const secH = section.offsetHeight;
        const winH = window.innerHeight;
        const progress = Math.min(1, Math.max(0, (-rect.top + winH * 0.6) / (secH + winH * 0.4)));

        paths.forEach((p, i) => {
            const start = i * STAGGER;
            const end = start + 0.5;
            const local = Math.min(1, Math.max(0, (progress - start) / (end - start)));
            p.style.setProperty('stroke-dashoffset', lengths[i] * (1 - local));
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// —— GSAP ANIMATIONS ——
function initAnimations() {
    if (typeof gsap === 'undefined') {
        document.querySelectorAll('.reveal-item').forEach(el => {
            el.style.setProperty('opacity', '1');
            el.style.setProperty('transform', 'none');
        });
        const gapRule = document.getElementById('gap-rule');
        if (gapRule) gapRule.style.setProperty('transform', 'scaleX(1)');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Hero Parallax
    ScrollTrigger.create({
        trigger: '#ch1', start: 'top top', end: 'bottom top', scrub: true,
        onUpdate: self => {
            const p = self.progress;
            const sy = p * window.innerHeight;
            const bg = document.getElementById('ch1-bg');
            const mid = document.getElementById('ch1-mid');
            const content = document.getElementById('ch1-content');

            if (bg) bg.style.setProperty('transform', `translateY(${sy * 0.18}px) scale(1.08)`);
            if (mid) mid.style.setProperty('transform', `translateY(${sy * 0.38}px) rotate(${sy * 0.006}deg)`);
            if (content) {
                content.style.setProperty('transform', `translateY(${sy * 0.55}px) scale(${Math.max(0.88, 1 - sy * 0.00018)})`);
                content.style.setProperty('opacity', p < 0.5 ? '1' : Math.max(0, 1 - (p - 0.5) * 2.8));
            }
        }
    });

    // Ch2 gap words
    const gapTl = gsap.timeline({ scrollTrigger: { trigger: '#ch2', start: 'top 80%', once: true } });
    gapTl
        .fromTo('#gw1', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out' })
        .fromTo('#gw2', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out' }, '-=0.6')
        .fromTo('#gw3', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out' }, '-=0.6')
        .fromTo('#gap-rule', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.out' }, '-=0.4')
        .fromTo('#gap-tagline', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '-=0.4');

    // SVG drawing helper
    function drawSVG(id, triggerEl, delayPerPath) {
        const el = document.getElementById(id);
        if (!el) return;
        const paths = el.querySelectorAll('.svg-draw');
        paths.forEach(p => {
            try {
                const l = p.getTotalLength ? p.getTotalLength() : 100;
                p.style.setProperty('stroke-dasharray', l);
                p.style.setProperty('stroke-dashoffset', l);
            } catch (e) { }
        });
        ScrollTrigger.create({
            trigger: triggerEl || ('#' + id),
            start: 'top 80%',
            once: true,
            onEnter: () => paths.forEach((p, i) =>
                gsap.to(p, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', delay: i * delayPerPath })
            )
        });
    }

    drawSVG('ch2-diya', '#ch2', 0.14);
    drawSVG('ch3-compass', '#ch3', 0.10);
    drawSVG('ch5-compass', '#ch5', 0.12);
    drawSVG('ch6-mandala', '#ch6', 0.07);
    drawSVG('ch7-ornament', '#ch7', 0.12);

    // Letter divider
    ScrollTrigger.create({
        trigger: '#letter-div', start: 'top 88%', once: true,
        onEnter: () => gsap.to('#letter-div', { width: '100px', duration: 1, ease: 'power2.out' })
    });

    // Signature
    const sigPath = document.getElementById('sig-path');
    if (sigPath) {
        try {
            const len = sigPath.getTotalLength();
            sigPath.style.setProperty('stroke-dasharray', len);
            sigPath.style.setProperty('stroke-dashoffset', len);
            ScrollTrigger.create({
                trigger: '.sig-wrap', start: 'top 88%', once: true,
                onEnter: () => gsap.to(sigPath, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', delay: 0.4 })
            });
        } catch (e) { }
    }

    // Para reveal
    document.querySelectorAll('.letter-para').forEach(el => {
        ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => el.classList.add('in') });
    });

    // Reveal items
    gsap.utils.toArray('.reveal-item').forEach(el => {
        let fromX = 0, fromY = 30;
        if (el.classList.contains('story-pullquote')) { fromX = -20; fromY = 0; }
        else if (el.classList.contains('pillar-item')) { fromX = 20; fromY = 0; }
        else if (el.classList.contains('founder-card')) { fromY = 40; }

        gsap.fromTo(el,
            { opacity: 0, x: fromX, y: fromY },
            {
                opacity: 1, x: 0, y: 0, duration: 1.2, ease: 'power2.out',
                immediateRender: false,
                scrollTrigger: { trigger: el, start: 'top 82%', once: true }
            }
        );
    });

    ScrollTrigger.refresh();
}

// —— MOBILE OPTIMIZATION ——
function handleMobile() {
    if (window.innerWidth < 768) {
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.getAll().forEach(t => {
                if (t.vars && t.vars.scrub) t.kill();
            });
        }
        const c = document.getElementById('ch1-content');
        if (c) {
            c.style.setProperty('opacity', '1');
            c.style.setProperty('transform', 'none');
        }
    }
}

// —— INIT ——
function init() {
    initCursor();
    initProgress();
    initNav();
    initHero();
    initCanvases();
    initScrollSVG();
    initAnimations();
    handleMobile();
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', handleMobile);
