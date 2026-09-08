/**
 * admin.js - Full Upgrade for Artisanal Management Suite
 * Modern, modular, and optimized for performance.
 */

// ── STATE ──
let cachedCsrfToken = null;
let revenueChartInstance = null;
let currentChartRange = '7';
let productBrands = ['all', 'silverythm', 'devaramane', 'udugore'];

// ── UTILITIES ──

async function getCsrfToken() {
    if (cachedCsrfToken) return cachedCsrfToken;
    try {
        const res = await fetch('api/auth.php?action=csrf', { credentials: 'same-origin' });
        const data = await res.json();
        cachedCsrfToken = data.token;
    } catch(e) { console.error('CSRF fetch failed'); }
    return cachedCsrfToken;
}

/**
 * Wraps fetch with CSRF handling and error toasts
 */
async function safeFetch(url, opts = {}) {
    const token = await getCsrfToken();
    opts.headers = { 
        ...opts.headers, 
        'X-CSRF-Token': token,
        'X-Requested-With': 'XMLHttpRequest'
    };
    opts.credentials = 'same-origin';

    try {
        const res = await fetch(url, opts);
        if (res.status === 403) {
            cachedCsrfToken = null; // Clear stale token
            showToast('Session expired. Please retry.', 'error');
            return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Connection error', 'error');
        return null;
    }
}

function showToast(message, type = 'success') {
    const existing = document.getElementById('admin-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = `admin-toast ${type}`;
    
    const icon = type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle';
    toast.innerHTML = `
        <iconify-icon icon="${icon}" width="18"></iconify-icon>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function formatRupees(val) {
    const num = parseFloat(val) || 0;
    return '₹' + Math.floor(num).toLocaleString('en-IN');
}

function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(str) {
    if (!str) return '—';
    const date = new Date(str.replace(/-/g, '/')); // Compatibility fix for some browsers
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function badgeHtml(status) {
    const s = status ? status.toLowerCase() : 'pending';
    return `<span class="badge badge-${s}">${s}</span>`;
}

function emptyState(icon, title, sub) {
    return `
        <tr>
            <td colspan="99">
                <div class="empty-state">
                    <iconify-icon icon="${icon}" width="40"></iconify-icon>
                    <h3>${title}</h3>
                    <p>${sub}</p>
                </div>
            </td>
        </tr>
    `;
}

function resolveImg(path) {
    if (!path) return 'assets/Logo.png';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return '/' + path;
}

// ── NAVIGATION ──

window.switchSection = function(sectionId) {
    const link = document.getElementById('nav-' + sectionId);
    if (link) {
        link.click();
    } else {
        // Fallback for sections without direct nav links (if any)
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById('section-' + sectionId);
        if (target) target.classList.remove('hidden');
    }
};

function handleNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.id.replace('nav-', '');
            
            // UI Updates
            sections.forEach(s => s.classList.add('hidden'));
            navLinks.forEach(l => l.classList.remove('active'));
            
            const target = document.getElementById(`section-${sectionId}`);
            if (target) {
                target.classList.remove('hidden');
                link.classList.add('active');
                
                // Mobile auto-close
                if (window.innerWidth <= 900) {
                    document.getElementById('adminSidebar').classList.remove('mobile-open');
                    const overlay = document.getElementById('sidebarOverlay');
                    if (overlay) overlay.classList.add('hidden');
                }

                // Load Data
                setTimeout(() => loadSectionData(sectionId), 50);
                window.scrollTo(0, 0);
            }
        });
    });
}


function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'overview': loadOverview(); break;
        case 'products': loadProducts(); break;
        case 'orders': loadOrders(); break;
        case 'users': loadUsers(); break;

        case 'wishlist': loadWishlist(); break;
        case 'banner': loadBanner(); break;
        case 'videos': loadVideos(); break;
        case 'exclusives': loadExclusivesAdmin('OUR EXCLUSIVES'); break;
    }
}

// ── OVERVIEW & CHART ──

window.loadOverview = async function() {
    const loader = `<iconify-icon icon="lucide:loader-2" class="animate-spin"></iconify-icon>`;
    const statsIds = ['stat-orders', 'stat-revenue', 'stat-products', 'stat-pending'];
    statsIds.forEach(id => document.getElementById(id).innerHTML = loader);

    try {
        const [oRes, pRes] = await Promise.all([
            fetch('api/orders.php?action=list_all', { credentials: 'same-origin' }),
            fetch('api/products.php', { credentials: 'same-origin' })
        ]);
        
        const orderData = await oRes.json();
        const productData = await pRes.json();
        
        const orders = orderData.orders || [];
        const products = Array.isArray(productData) ? productData : (productData.products || []);

        // Top Stats
        document.getElementById('stat-orders').textContent = orders.length;
        document.getElementById('stat-products').textContent = products.length;
        
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
        const processingCount = orders.filter(o => o.status === 'processing').length;
        const activeCount = pendingCount + confirmedCount + processingCount;

        document.getElementById('stat-pending').textContent = activeCount;
        const qsPending = document.getElementById('qs-pending');
        if (qsPending) qsPending.textContent = activeCount;
        
        // Update Nav Badge
        const pendingBadge = document.getElementById('pendingBadge');
        if (pendingBadge) {
            pendingBadge.textContent = activeCount;
            if (activeCount > 0) {
                pendingBadge.classList.remove('hidden');
                pendingBadge.classList.add('flex');
            } else {
                pendingBadge.classList.add('hidden');
                pendingBadge.classList.remove('flex');
            }
        }

        const revenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        document.getElementById('stat-revenue').textContent = formatRupees(revenue);

        // Trends (Simulated or from real delta logic if available)
        // For now we set placeholders as requested
        const trends = ['stat-orders-trend', 'stat-revenue-trend', 'stat-products-trend', 'stat-pending-trend'];
        trends.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = '—'; el.className = 'stat-trend trend-neutral'; }
        });

        // Quick Stats Panel
        const delivered = orders.filter(o => o.status === 'delivered').length;
        const shipped = orders.filter(o => o.status === 'shipped').length;
        const cancelled = orders.filter(o => o.status === 'cancelled').length;
        const avg = orders.length > 0 ? (revenue / orders.length) : 0;
        
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => (o.created_at || '').startsWith(today));

        const todayRev = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

        document.getElementById('qs-delivered').textContent = delivered;
        document.getElementById('qs-shipped').textContent = shipped;
        document.getElementById('qs-cancelled').textContent = cancelled;
        document.getElementById('qs-avg').textContent = formatRupees(avg);
        const qsToday = document.getElementById('qs-today');
        if (qsToday) qsToday.textContent = todayOrders.length;
        const qsTodayRev = document.getElementById('qs-today-rev');
        if (qsTodayRev) qsTodayRev.textContent = formatRupees(todayRev);

        renderRecentOrders(orders.slice(0, 8));
        renderRevenueChart(orders);
        renderStatusDonut(delivered, shipped, activeCount, cancelled);
        
    } catch (err) {
        console.error('Overview error:', err);
    }
};

function renderRecentOrders(orders) {
    const tbody = document.getElementById('overview-recent-orders');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = emptyState('lucide:shopping-bag', 'No Recent Orders', 'Transaction history will appear here.');
        return;
    }

    tbody.innerHTML = orders.map(o => `
        <tr>
            <td data-label="Order">
                <div class="text-bold">#${o.id}</div>
                <div class="text-xs text-muted-color mt-1">${formatDate(o.created_at)}</div>
            </td>
            <td data-label="Customer">
                <div class="text-semibold text-sm">${esc(o.name) || 'Guest'}</div>
                <div class="text-xs text-muted-color">${o.email || ''}</div>
            </td>
            <td data-label="Items" class="text-sm text-semibold">${o.item_count} items</td>
            <td data-label="Status">${badgeHtml(o.status)}</td>
            <td data-label="Amount" class="text-bold text-primary-color text-right">${formatRupees(o.total)}</td>
        </tr>
    `).join('');
}

function renderRevenueChart(orders) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const days = parseInt(currentChartRange);
    const labels = [];
    const revenueMap = {};

    // Prepare range
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
        revenueMap[dateStr] = 0;
    }

    orders.forEach(o => {
        const dateKey = (o.created_at || '').split(' ')[0];

        if (revenueMap.hasOwnProperty(dateKey)) {
            revenueMap[dateKey] += parseFloat(o.total) || 0;
        }
    });

    if (revenueChartInstance) revenueChartInstance.destroy();

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(201,168,76,0.15)');
    gradient.addColorStop(1, 'rgba(201,168,76,0.00)');

    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: Object.values(revenueMap),
                borderColor: '#C9A84C',
                backgroundColor: gradient,
                borderWidth: 2.5,
                pointBackgroundColor: '#C9A84C',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#141C2B',
                    titleColor: '#C9A84C',
                    bodyColor: 'rgba(255,255,255,0.75)',
                    borderColor: 'rgba(201,168,76,0.3)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: ctx => ' ₹' + ctx.parsed.y.toLocaleString('en-IN')
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#8A95A3', font: { size: 11 } },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    min: 0,
                    suggestedMax: 100,
                    grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                    ticks: {
                        color: '#8A95A3',
                        font: { size: 11 },
                        precision: 0,
                        callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v)
                    },
                    border: { display: false }
                }
            }
        }
    });
}

// Donut chart — build from overview data
function renderStatusDonut(delivered, shipped, pending, cancelled) {
    const ctx = document.getElementById('statusDonut');
    if (!ctx) return;
    const total = delivered + shipped + pending + cancelled;
    const isAllZero = total === 0;

    window._statusDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: isAllZero ? ['No Orders'] : ['Delivered','Shipped','Pending / Active','Cancelled'],
            datasets: [{
                data: isAllZero ? [1] : [delivered, shipped, pending, cancelled],
                backgroundColor: isAllZero ? ['rgba(138, 149, 163, 0.15)'] : ['#2A9D8F','#3B82F6','#D97706','#DC2626'],
                borderWidth: 0,
                hoverOffset: isAllZero ? 0 : 4
            }]
        },
        options: {
            cutout: '72%',
            responsive: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: !isAllZero,
                    backgroundColor: '#141C2B',
                    bodyColor: 'rgba(255,255,255,0.8)',
                    padding: 8,
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1
                }
            }
        }
    });
}

// ── PRODUCTS ──

window.loadProducts = async function(brand = 'all') {
    const list = document.getElementById('adminRecordList');
    if (!list) return;
    
    list.innerHTML = `<tr><td colspan="6" class="table-loading"><iconify-icon icon="lucide:loader-2" class="animate-spin" width="24"></iconify-icon></td></tr>`;

    try {
        const url = brand === 'all'
            ? 'api/products.php?limit=10000'
            : `api/products.php?brand=${brand}&limit=10000`;
        const res = await fetch(url);
        const data = await res.json();
        let products = Array.isArray(data) ? data : (data.products || []);

        // Update Tabs
        const tabsContainer = document.getElementById('adminBrandTabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = productBrands.map(b => `
                <button class="tab-btn ${brand === b ? 'active' : ''}" data-brand="${b}">
                    ${b === 'all' ? 'All Products' : b.charAt(0).toUpperCase() + b.slice(1)}
                </button>
            `).join('');
        }

        // Apply Local Search/Sort
        const searchVal = document.getElementById('productSearch')?.value.toLowerCase();
        if (searchVal) {
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchVal) || 
                p.category?.toLowerCase().includes(searchVal)
            );
        }

        const sortVal = document.getElementById('productSortSelect')?.value;
        if (sortVal && sortVal !== 'default') {
            products.sort((a, b) => {
                if (sortVal === 'name-asc') return a.name.localeCompare(b.name);
                if (sortVal === 'name-desc') return b.name.localeCompare(a.name);
                if (sortVal === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
                if (sortVal === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
                return 0;
            });
        }

        if (products.length === 0) {
            list.innerHTML = emptyState('lucide:package-search', 'No Products Found', 'Try adjusting your search or filters.');
            return;
        }

        list.innerHTML = products.map(p => `
            <tr>
                <td data-label="Image">
                    <img src="${resolveImg(p.image)}" 
                         class="product-thumb" 
                         data-fallback="assets/Logo.png">
                </td>
                <td data-label="Product">
                    <div class="text-bold">${esc(p.name)}</div>
                    <div class="text-xs text-muted-color text-bold text-uppercase letter-spacing-sm">ID: #${p.id}</div>
                </td>
                <td data-label="Category" class="text-sm text-muted-color">${p.category || '—'}</td>
                <td data-label="Price" class="text-bold text-primary-color">${formatRupees(p.price)}</td>
                <td data-label="Brand"><span class="badge badge-neutral">${p.brand}</span></td>
                <td data-label="Actions" class="text-right">
                    <div class="flex-end gap-1">
                        <button class="btn btn-outline btn-sm edit-product-btn" data-id="${p.id}" title="Edit">
                            <iconify-icon icon="lucide:edit-2"></iconify-icon> Edit
                        </button>
                        <button class="btn btn-outline btn-sm text-danger-color delete-product-btn" data-id="${p.id}" data-name="${esc(p.name)}" title="Delete">
                            <iconify-icon icon="lucide:trash-2"></iconify-icon> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Products error:', err);
        list.innerHTML = emptyState('lucide:alert-triangle', 'Error Loading Products', 'Check your connection.');
    }
};

window.editProduct = async function(id) {
    try {
        const res = await fetch(`api/products.php?id=${id}`);
        const p = await res.json();
        
        const form = document.getElementById('addProductForm');
        form.id.value = p.id;
        form.name.value = p.name;
        form.brand.value = p.brand;
        form.category.value = p.category || '';
        form.price.value = p.price;
        form.description.value = p.description || '';
        form.size.value = p.size || '';
        form.frame.value = p.frame || '';
        form.material.value = p.material || '';
        form.image_url.value = p.image || '';

        // Previews
        const p1 = document.getElementById('edit-image-preview');
        const p2 = document.getElementById('imagePreview');
        const prompt = document.getElementById('upload-prompt');
        
        if (p.image) {
            const src = resolveImg(p.image);
            if (p1) { p1.src = src; p1.classList.remove('hidden'); if(prompt) prompt.classList.add('hidden'); }
            if (p2) { p2.src = src; p2.classList.remove('hidden'); }
        }

        document.getElementById('formTitle').textContent = 'Edit Product';
        
        // Brand-specific logic (Price Note)
        const pNote = document.getElementById('priceOptionalNote');
        if (pNote) {
            if (p.brand === 'silverythm') pNote.classList.remove('hidden');
            else pNote.classList.add('hidden');
        }

        openProductModal();
    } catch (err) { console.error('Edit error:', err); }
};

window.deleteProduct = async function(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    
    const res = await safeFetch(`api/products.php?id=${id}`, { method: 'DELETE' });
    if (res && res.ok) {
        showToast('Product purged');
        loadProducts();
    }
};

// ── ORDERS ──

window.loadOrders = async function() {
    const list = document.getElementById('ordersTableBody');
    if (!list) return;
    
    list.innerHTML = `<tr><td colspan="7" class="table-loading"><iconify-icon icon="lucide:loader-2" class="animate-spin" width="24"></iconify-icon></td></tr>`;

    try {
        const status = document.getElementById('orderStatusFilter').value;
        const brand = document.getElementById('orderBrandFilter').value;
        const search = document.getElementById('orderSearch').value;
        
        let url = `api/orders.php?action=list_all&status=${encodeURIComponent(status)}&brand=${encodeURIComponent(brand)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const data = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            list.innerHTML = emptyState('lucide:shopping-cart', 'No Orders Found', 'Try adjusting your search or filters.');
            return;
        }

        list.innerHTML = orders.map(o => `
            <tr>
                <td data-label="Order ID" class="text-bold">#${o.id}</td>
                <td data-label="Customer">
                    <div class="text-semibold text-sm">${esc(o.name) || 'Guest'}</div>
                    <div class="text-xs text-muted-color">${o.email || ''}</div>
                </td>
                <td data-label="Items" class="text-sm text-semibold">${o.item_count} items</td>
                <td data-label="Total" class="text-bold text-primary-color">${formatRupees(o.total)}</td>
                <td data-label="Status">${badgeHtml(o.status)}</td>
                <td data-label="Date" class="text-sm text-muted-color">${formatDate(o.created_at)}</td>
                <td data-label="Actions" class="text-right" style="white-space: nowrap;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn btn-outline btn-sm view-order-details-btn" data-id="${o.id}">
                            <iconify-icon icon="lucide:eye"></iconify-icon> View
                        </button>
                        <button class="btn btn-outline btn-sm view-order-status-btn" data-id="${o.id}" data-status="${o.status}">
                            <iconify-icon icon="lucide:edit-3"></iconify-icon> Status
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach event listeners for View buttons
        list.querySelectorAll('.view-order-details-btn').forEach(btn => {
            btn.addEventListener('click', () => openOrderDetailsModal(btn.dataset.id));
        });

    } catch (err) {
        console.error('Orders error:', err);
        list.innerHTML = emptyState('lucide:alert-triangle', 'Error Loading Orders', 'Check connection.');
    }
};

// ── MODALS ──

window.openOrderDetailsModal = async function(id) {
    const el = document.getElementById('orderDetailsModal');
    if (!el) return;
    
    // Clear old data and show loader
    const content = document.getElementById('orderDetailsContent');
    content.innerHTML = `<div class="flex-center py-8"><iconify-icon icon="lucide:loader-2" class="animate-spin" width="32"></iconify-icon></div>`;
    el.classList.remove('hidden');
    
    try {
        const res = await fetch(`api/orders.php?action=get&id=${id}`);
        const data = await res.json();
        
        if (!data || !data.success && data.error) {
            content.innerHTML = `<p class="text-error">Error loading order: ${esc(data.error)}</p>`;
            return;
        }

        const o = data;
        
        let itemsHtml = (o.items || []).map(item => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border);">
                <img src="${item.product_image || 'assets/images/placeholder.webp'}" alt="${esc(item.product_name)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: var(--surface-2); flex-shrink: 0;">
                <div style="flex: 1; min-width: 0;">
                    <p class="text-semibold m-0 text-sm" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(item.product_name)}</p>
                    <p class="text-xs text-muted-color m-0 mt-1">Product ID: ${item.product_id}</p>
                </div>
                <div style="text-align: right; white-space: nowrap;">
                    <p class="text-semibold m-0 text-sm">Qty: ${item.quantity}</p>
                    <p class="text-xs text-muted-color m-0 mt-1">@ ${formatRupees(item.unit_price)}</p>
                </div>
                <div style="text-align: right; min-width: 70px; white-space: nowrap;">
                    <p class="text-bold text-primary-color m-0">${formatRupees(item.line_total)}</p>
                </div>
            </div>
        `).join('');

        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div class="panel" style="box-shadow: none; padding: 1rem; margin: 0; display: flex; flex-direction: column;">
                    <h4 class="text-xs text-muted-color uppercase tracking-wide m-0 mb-2">Customer</h4>
                    <p class="text-semibold m-0 text-sm">${esc(o.customer_name || 'Guest')}</p>
                    <p class="text-xs text-muted-color m-0 mt-1" style="word-break: break-all;">${esc(o.customer_email || '')}</p>
                </div>
                <div class="panel" style="box-shadow: none; padding: 1rem; margin: 0; display: flex; flex-direction: column;">
                    <h4 class="text-xs text-muted-color uppercase tracking-wide m-0 mb-2">Order Info</h4>
                    <div class="flex-between mb-1">
                        <span class="text-sm">Status:</span>
                        ${badgeHtml(o.status)}
                    </div>
                    <div class="flex-between mb-1">
                        <span class="text-sm">Date:</span>
                        <span class="text-sm text-semibold">${formatDate(o.created_at)}</span>
                    </div>
                    <div class="flex-between mb-1">
                        <span class="text-sm">Payment Method:</span>
                        <span class="text-sm uppercase text-semibold">${esc(o.payment_method)}</span>
                    </div>
                    <div class="flex-between mb-1">
                        <span class="text-sm">Payment Status:</span>
                        <span class="text-sm uppercase text-semibold">${esc(o.payment_status || 'pending')}</span>
                    </div>
                    ${o.razorpay_payment_id ? `
                    <div class="flex-between mb-1" style="font-size: 11px;">
                        <span class="text-muted-color">Rzp Pay ID:</span>
                        <span class="text-semibold" style="font-family: monospace; word-break: break-all;">${esc(o.razorpay_payment_id)}</span>
                    </div>
                    ` : ''}
                    ${o.razorpay_order_id ? `
                    <div class="flex-between" style="font-size: 11px;">
                        <span class="text-muted-color">Rzp Order ID:</span>
                        <span class="text-semibold" style="font-family: monospace; word-break: break-all;">${esc(o.razorpay_order_id)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="panel" style="box-shadow: none; padding: 1rem; margin: 0; grid-column: 1 / -1;">
                    <h4 class="text-xs text-muted-color uppercase tracking-wide m-0 mb-2">Delivery Address</h4>
                    <p class="text-sm m-0" style="white-space: pre-wrap; line-height: 1.5;">${esc(o.address || 'No address provided')}</p>
                </div>
            </div>
            
            <h4 class="text-sm text-semibold m-0 mb-3 uppercase tracking-wide text-muted-color">Order Items</h4>
            <div class="panel" style="box-shadow: none; padding: 0 1rem; margin: 0;">
                ${itemsHtml}
                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem; padding: 1.25rem 0;">
                    <p class="text-muted-color m-0 text-sm uppercase tracking-wide font-bold">Total Amount</p>
                    <p class="text-xl text-bold text-primary-color m-0">${formatRupees(o.total_amount)}</p>
                </div>
            </div>
        `;
        
    } catch(err) {
        content.innerHTML = `<p class="text-error">Failed to fetch details.</p>`;
    }
};

window.closeOrderDetailsModal = function() {
    const el = document.getElementById('orderDetailsModal');
    if (el) el.classList.add('hidden');
};

window.openProductModal = function() {
    const el = document.getElementById('productFormContainer');
    if (el) {
        el.classList.add('visible');
        // Sync price note on open
        const bs = document.querySelector('#addProductForm select[name="brand"]');
        const pn = document.getElementById('priceOptionalNote');
        if (bs && pn) {
            if (bs.value === 'silverythm') pn.classList.remove('hidden');
            else pn.classList.add('hidden');
        }
    }
};

window.closeProductModal = function() {
    const el = document.getElementById('productFormContainer');
    if (el) el.classList.remove('visible');
    const form = document.getElementById('addProductForm');
    if (form) form.reset();
    
    // Reset previews
    const p1 = document.getElementById('edit-image-preview');
    const p2 = document.getElementById('imagePreview');
    const prompt = document.getElementById('upload-prompt');
    if (p1) { p1.classList.add('hidden'); p1.src = ''; }
    if (p2) { p2.classList.add('hidden'); p2.src = ''; }
    if (prompt) prompt.classList.remove('hidden');
    
    document.getElementById('formTitle').textContent = 'Add Product';
};

window.openOrderStatusModal = function(id, currentStatus) {
    document.getElementById('statusModalOrderId').textContent = '#' + id;
    const select = document.getElementById('statusModalSelect');
    if (select) {
        select.value = currentStatus || 'pending';
        const badgePreview = document.getElementById('statusModalBadgePreview');
        if (badgePreview) {
            const val = select.value;
            badgePreview.className = `badge badge-${val}`;
            badgePreview.textContent = val;
        }
    }
    const modal = document.getElementById('orderStatusModal');
    if (modal) {
        modal.dataset.orderId = id;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.closeOrderStatusModal = function() {
    const modal = document.getElementById('orderStatusModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// ── EXTENSIONS ──

window.loadUsers = async function() {
    const container = document.getElementById('usersPlaceholder');
    if (!container) return;
    try {
        const res = await fetch('api/auth.php?action=list_users', { credentials: 'same-origin' });
        const data = await res.json();
        const users = data.users || [];
        container.innerHTML = `
            <header class="section-header">

                <div>
                    <h1 class="section-title">Users</h1>
                    <p class="section-subtitle">Manage registered users</p>
                </div>
            </header>
            <div class="panel">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Orders</th>
                            <th>Joined</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="adminUserList">
                        ${users.length === 0 
                            ? '<tr><td colspan="5" class="table-loading">No users found.</td></tr>' 
                            : users.map(u => `
                            <tr>
                                <td data-label="User">
                                    <div class="flex-center gap-3">
                                        <div class="avatar-small">${(esc(u.name)||'?').charAt(0).toUpperCase()}</div>
                                        <span class="text-semibold">${esc(u.name)}</span>
                                    </div>
                                </td>
                                <td data-label="Email" class="text-muted-color text-sm">${u.email}</td>
                                <td data-label="Orders"><span class="badge badge-neutral badge-lowercase">${u.order_count} orders</span></td>
                                <td data-label="Joined" class="text-xs text-muted-color">${formatDate(u.created_at)}</td>
                                <td data-label="Actions" class="text-right">
                                    <button class="btn btn-outline btn-sm text-danger-color delete-user-btn" 
                                            data-id="${u.id}" 
                                            data-name="${esc(u.name)}"
                                            title="Delete user">
                                        <iconify-icon icon="lucide:trash-2"></iconify-icon> Delete
                                    </button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;

        container.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteUser(parseInt(btn.dataset.id), btn.dataset.name));
        });

    } catch (err) { console.error('Users error:', err); }
};

window.deleteUser = async function(userId, userName) {
    if (!confirm(`Delete account for "${userName}"? This removes their cart and order history. Cannot be undone.`)) return;
    const res = await safeFetch('api/auth.php?action=delete_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    });
    if (res) {
        const data = await res.json();
        if (data.success) { showToast('User deleted'); loadUsers(); }
        else showToast(data.error || 'Failed to delete user', 'error');
    }
};


window.loadWishlist = async function() {
    const container = document.getElementById('wishlistPlaceholder');
    if (!container) return;
    try {
        const res = await fetch('api/wishlist.php?action=analytics', { credentials: 'same-origin' });
        const items = await res.json();
        container.innerHTML = `
            <header class="section-header">
                <div>
                    <h1 class="section-title">Wishlist</h1>
                    <p class="section-subtitle">Most saved products by customers</p>
                </div>
            </header>
            <div class="panel">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th class="col-60"></th>
                            <th>Product</th>
                            <th>Brand</th>
                            <th>Price</th>
                            <th class="text-right">Saves</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${!Array.isArray(items) || items.length === 0
                            ? '<tr><td colspan="5" class="table-loading">No wishlist data yet.</td></tr>'
                            : items.map(i => `
                            <tr>
                                <td data-label="Image" class="col-60">
                                    <img src="${resolveImg(i.image)}" class="img-wishlist">
                                </td>
                                <td data-label="Product">
                                    <p class="text-semibold">${esc(i.name)}</p>
                                    <p class="text-xs text-muted-color mt-1">${i.description ? i.description.substring(0,60)+'…' : ''}</p>
                                </td>
                                <td data-label="Brand"><span class="badge badge-neutral badge-capitalize">${i.brand}</span></td>
                                <td data-label="Price" class="text-semibold text-primary-color text-sm">${i.price > 0 ? formatRupees(i.price) : 'By Consultation'}</td>
                                <td data-label="Saves" class="text-right">
                                    <div class="wishlist-count">${i.wish_count}<span>saves</span></div>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;

    } catch(err) { console.error('Wishlist error:', err); }
};

window.loadBanner = async function() {
    const container = document.getElementById('bannerPlaceholder');
    if (!container) return;
    
    container.innerHTML = `
        <header class="section-header">
            <div>
                <h1 class="section-title">Banner Strip</h1>
                <p class="section-subtitle">Global Announcement & Hero Asset Management</p>
            </div>
        </header>

        <div class="banner-tabs-wrapper" id="bannerModeTabs">
            <button class="tab-btn active" data-mode="text">Text Message</button>
            <button class="tab-btn" data-mode="image">Hero Banners</button>
        </div>

        <div id="bannerContentArea"></div>`;

    const tabs = document.getElementById('bannerModeTabs');
    const contentArea = document.getElementById('bannerContentArea');

    async function switchMode(mode) {
        tabs.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        if (mode === 'text') {
            contentArea.innerHTML = `
                <div class="banner-config-grid">
                    <div class="panel panel-flush">
                        <div class="panel-header bg-surface-2">
                            <div class="flex-center gap-3">
                                <iconify-icon icon="lucide:type" class="text-gold"></iconify-icon>
                                <h3 class="panel-title">Marquee Configuration</h3>
                            </div>
                        </div>
                        <div class="banner-config-panel">
                            <div class="mb-8">
                                <label class="banner-config-label">Marquee Content</label>
                                <textarea id="bannerTextInput" rows="4" placeholder="Enter scrolling message..." class="banner-config-textarea"></textarea>
                                <div class="banner-info-box">
                                    <iconify-icon icon="lucide:info"></iconify-icon>
                                    <p>
                                        Use the <strong class="text-gold">·</strong> character to separate multiple items. They will scroll in a continuous loop across all brand pages.
                                    </p>
                                </div>
                            </div>

                            <div class="banner-action-row">
                                <div class="live-status">
                                    <div id="statusPulse" class="live-dot"></div>
                                    <div class="banner-status-info">
                                        <span id="bannerCurrentText" class="text-sm text-semibold">Active Announcement</span>
                                        <span class="text-xs text-muted-color">Synchronized globally</span>
                                    </div>
                                </div>
                                <button id="saveBannerTextBtn" class="btn btn-primary btn-wide">
                                    <iconify-icon icon="lucide:save"></iconify-icon> Update Strip
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex-column gap-3">
                        <div class="banner-preview-card">
                            <div class="banner-preview-header">
                                <span class="text-xs text-bold text-gold text-uppercase letter-spacing-md">Live Preview</span>
                            </div>
                            <div class="banner-preview-body">
                                <div class="banner-preview-sim">
                                    <div id="bannerLivePreview" class="banner-preview-text">
                                        Your announcement will appear here...
                                    </div>
                                </div>
                            </div>
                            <div class="banner-preview-footer">
                                <h4 class="tips-title">Helpful Tips</h4>
                                <ul class="tips-list">
                                    <li class="tips-item">
                                        <span class="text-gold">•</span> Keep messages concise for better readability.
                                    </li>
                                    <li class="tips-item">
                                        <span class="text-gold">•</span> Check for typos before committing changes.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>`;

            const input = document.getElementById('bannerTextInput');
            const preview = document.getElementById('bannerLivePreview');
            const pulse = document.getElementById('statusPulse');

            input.addEventListener('input', () => {
                preview.textContent = input.value || 'Your announcement will appear here...';
            });

            // Load current value
            fetch('api/settings.php').then(r => r.json()).then(s => {
                const cur = s.bannerText || '';
                if (cur) {
                    input.value = cur;
                    preview.textContent = cur;
                    document.getElementById('bannerCurrentText').textContent = 'Live Announcement';
                } else {
                    document.getElementById('bannerCurrentText').textContent = 'No Active Announcement';
                    pulse.classList.add('status-inactive');
                    preview.textContent = 'No message currently set';
                }
            }).catch(() => {});

            document.getElementById('saveBannerTextBtn')?.addEventListener('click', async () => {
                const val = input.value.trim();
                if (!val) { showToast('Please enter a message', 'error'); return; }
                const res = await safeFetch('api/media.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bannerText: val })
                });
                if (res) {
                    const d = await res.json();
                    if (d.success) {
                        showToast('Banner synchronized successfully');
                        pulse.classList.remove('status-inactive');
                        document.getElementById('bannerCurrentText').textContent = 'Live Announcement';
                    } else showToast('Could not save changes', 'error');
                }
            });
        } else {
            contentArea.innerHTML = `
                <div class="panel hero-register-panel">
                    <div class="hero-register-header">
                        <div class="hero-register-icon">
                            <iconify-icon icon="lucide:image-plus" class="icon-lg"></iconify-icon>
                        </div>
                        <div>
                            <h2 class="hero-register-title">Register Hero Asset</h2>
                            <p class="hero-register-subtitle">Add high-resolution banner URLs for the homepage slider</p>
                        </div>
                    </div>
                    <div class="flex gap-4">
                        <input type="text" id="bannerImgUrl" placeholder="Enter absolute image URL (https://...)" class="input-pill">
                        <button id="saveBannerImgBtn" class="btn btn-primary btn-pill-wide">
                            <iconify-icon icon="lucide:upload-cloud"></iconify-icon> Commit Asset
                        </button>
                    </div>
                </div>

                <div class="panel panel-flush">
                    <div class="panel-header hero-asset-table-header">
                        <h3 class="panel-title">Active Banner Assets</h3>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th class="col-180 pl-7">Preview</th>
                                <th>Source URL</th>
                                <th class="text-right pr-7">Manage</th>
                            </tr>
                        </thead>
                        <tbody id="bannerImageList"></tbody>
                    </table>
                </div>`;

            const bRes = await fetch('api/banner.php');
            const resData = await bRes.json();
            const bannerList = resData.banners || [];
            const list = document.getElementById('bannerImageList');
            
            if (bannerList.length === 0) {
                list.innerHTML = `<tr><td colspan="3" class="table-loading">No hero assets registered yet.</td></tr>`;
            } else {
                list.innerHTML = bannerList.map(b => `
                    <tr>
                        <td data-label="Preview" class="pl-7">
                            <div class="hero-asset-thumb-wrap">
                                <img src="${resolveImg(b.image_url)}" class="hero-asset-thumb">
                            </div>
                        </td>
                        <td data-label="URL" class="hero-asset-url">${b.image_url}</td>
                        <td data-label="Actions" class="text-right pr-7">
                            <button class="btn btn-ghost btn-sm delete-banner-btn hero-delete-btn" data-id="${b.id}">
                                <iconify-icon icon="lucide:trash-2" width="18"></iconify-icon>
                            </button>
                        </td>
                    </tr>`).join('');
            }

            list.onclick = async (e) => {
                const btn = e.target.closest('.delete-banner-btn');
                if (btn && confirm('Purge this hero banner asset from the database?')) {
                    const res = await safeFetch('api/banner.php', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: parseInt(btn.dataset.id) })
                    });
                    if (res) switchMode('image');
                }
            };

            document.getElementById('saveBannerImgBtn').onclick = async () => {
                const urlInput = document.getElementById('bannerImgUrl');
                const url = urlInput.value.trim();
                if (!url) { showToast('Please enter a URL', 'error'); return; }
                const res = await safeFetch('api/banner.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_url: url })
                });
                if (res) {
                    showToast('Asset registered successfully');
                    switchMode('image');
                }
            };
        }
    }
    tabs.onclick = (e) => { const b = e.target.closest('.tab-btn'); if (b) switchMode(b.dataset.mode); };
    switchMode('text');
};

window.loadVideos = async function() {
    const container = document.getElementById('videosPlaceholder');
    if (!container) return;

    container.innerHTML = `
        <header class="section-header">
            <div>
                <h1 class="section-title">Reels & Videos</h1>
                <p class="section-subtitle">Manage brand-specific video content</p>
            </div>
            <div class="header-actions">
                <button class="btn btn-primary" id="addVideoBtn">
                    <iconify-icon icon="lucide:plus" width="15"></iconify-icon> Add Video
                </button>
            </div>
        </header>

        <div class="filters-bar" style="margin-bottom:20px">
            <div class="form-group">
                <label>Brand Filter</label>
                <select id="videoBrandFilter" class="filter-select">
                    <option value="all">All Brands</option>
                    <option value="silverythm">Silverhythm</option>
                    <option value="devaramane">Devaramane</option>
                    <option value="udugore">Udugore</option>
                </select>
            </div>
        </div>

        <div class="panel">
            <div id="videosTableWrap"></div>
        </div>

        <div id="videoModal" class="admin-modal-overlay hidden">
            <div class="admin-modal-panel" style="max-width:500px">
                <h2 class="admin-modal-title" id="videoModalTitle">Add Video</h2>
                
                <div class="form-group">
                    <label>Brand <span class="form-label-req">*</span></label>
                    <select id="vBrand" class="filter-select" style="width:100%">
                        <option value="all">All Brands</option>
                        <option value="silverythm">Silverhythm</option>
                        <option value="devaramane">Devaramane</option>
                        <option value="udugore">Udugore</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Title (optional)</label>
                    <input id="vTitle" type="text" placeholder="e.g. Behind the scenes">
                </div>

                <div class="form-group">
                    <label>Video File (MP4/WebM) <span class="form-label-req">*</span></label>
                    <input id="vFile" type="file" accept="video/mp4,video/webm" style="padding:10px;border:1px dashed rgba(0,0,0,0.1);width:100%;border-radius:8px">
                </div>

                <div class="form-group">
                    <label>Thumbnail (optional)</label>
                    <input id="vThumbFile" type="file" accept="image/*" style="padding:10px;border:1px dashed rgba(0,0,0,0.1);width:100%;border-radius:8px">
                </div>

                <div class="form-group">
                    <label>Sort Order</label>
                    <input id="vOrder" type="number" value="0">
                </div>

                <div id="vUploadProgress" style="display:none;margin:12px 0;padding:10px;background:rgba(201,168,76,0.1);border-radius:8px;font-size:13px;color:var(--primary-color)">
                    <iconify-icon icon="lucide:loader-2" class="animate-spin"></iconify-icon> <span id="vUploadStatus">Uploading...</span>
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary" id="videoModalSave">Save Video</button>
                    <button class="btn btn-outline" id="videoModalCancel">Cancel</button>
                </div>
            </div>
        </div>
    `;

    async function refreshVideoTable() {
        const brand = document.getElementById('videoBrandFilter')?.value || 'all';
        const url = brand === 'all' ? 'api/videos.php' : `api/videos.php?brand=${brand}`;
        const res = await fetch(url, { credentials: 'same-origin' });
        const videos = await res.json();
        const wrap = document.getElementById('videosTableWrap');
        
        if (!videos.length) { 
            wrap.innerHTML = `<div style="padding:40px;text-align:center;color:#8A95A3">
                <iconify-icon icon="lucide:video-off" width="40" style="opacity:0.3"></iconify-icon>
                <p style="margin-top:12px">No videos yet. Add your first reel!</p>
            </div>`; 
            return; 
        }

        wrap.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Brand</th><th>Title</th><th>Preview</th><th>Status</th><th>Order</th><th class="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                ${videos.map(v => `
                    <tr>
                        <td class="text-bold">#${v.id}</td>
                        <td><span class="badge badge-neutral">${v.brand}</span></td>
                        <td class="text-sm text-semibold">${esc(v.title) || '—'}</td>
                        <td>
                            <div style="width:60px;height:100px;border-radius:6px;overflow:hidden;background:#000">
                                <video src="${v.video_url}" style="width:100%;height:100%;object-fit:cover"></video>
                            </div>
                        </td>
                        <td><span class="badge ${v.is_active == 1 ? 'badge-delivered' : 'badge-neutral'}">${v.is_active == 1 ? 'Active' : 'Hidden'}</span></td>
                        <td class="text-sm">${v.sort_order}</td>
                        <td class="text-right">
                            <div class="flex-end gap-1">
                                <button class="btn btn-outline btn-sm btn-toggle-video" data-id="${v.id}" data-active="${v.is_active}" title="${v.is_active == 1 ? 'Hide' : 'Show'}">
                                    <iconify-icon icon="lucide:${v.is_active == 1 ? 'eye-off' : 'eye'}"></iconify-icon> ${v.is_active == 1 ? 'Hide' : 'Show'}
                                </button>
                                <button class="btn btn-outline btn-sm text-danger-color btn-del-video" data-id="${v.id}" title="Delete">
                                    <iconify-icon icon="lucide:trash-2"></iconify-icon> Delete
                                </button>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
        wrap.querySelectorAll('.btn-toggle-video').forEach(btn => {
            btn.onclick = async () => {
                const newActive = btn.dataset.active == 1 ? 0 : 1;
                await safeFetch('api/videos.php', { 
                    method: 'PUT', 
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: +btn.dataset.id, is_active: newActive }) 
                });
                refreshVideoTable();
            };
        });

        wrap.querySelectorAll('.btn-del-video').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Delete this video?')) return;
                await safeFetch(`api/videos.php?id=${btn.dataset.id}`, { 
                    method: 'DELETE',
                    credentials: 'same-origin'
                });
                refreshVideoTable();
            };
        });
    }

    refreshVideoTable();
    document.getElementById('videoBrandFilter')?.addEventListener('change', refreshVideoTable);

    document.getElementById('addVideoBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('videoModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    document.getElementById('videoModalCancel')?.addEventListener('click', () => {
        const modal = document.getElementById('videoModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });

    document.getElementById('videoModalSave')?.addEventListener('click', async () => {
        const progress = document.getElementById('vUploadProgress');
        const status = document.getElementById('vUploadStatus');
        const videoFile = document.getElementById('vFile').files[0];
        const thumbFile = document.getElementById('vThumbFile').files[0];
        
        if (!videoFile) { showToast('Please select a video file', 'error'); return; }

        progress.style.display = 'block';
        status.textContent = 'Uploading video...';

        async function uploadFile(file) {
            const fd = new FormData();
            fd.append('image', file); // API expects 'image' key for all uploads
            const r = await safeFetch('api/upload.php', { method: 'POST', body: fd });
            if (!r) return null;
            const d = await r.json();
            return d.url || null;
        }

        try {
            const videoUrl = await uploadFile(videoFile);
            if (!videoUrl) throw new Error('Video upload failed');

            let thumbUrl = '';
            if (thumbFile) {
                status.textContent = 'Uploading thumbnail...';
                thumbUrl = await uploadFile(thumbFile) || '';
            }

            status.textContent = 'Saving metadata...';
            
            await safeFetch('api/videos.php', { 
                method: 'POST', 
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand: document.getElementById('vBrand').value,
                    title: document.getElementById('vTitle').value,
                    video_url: videoUrl,
                    thumbnail_url: thumbUrl,
                    sort_order: +document.getElementById('vOrder').value
                })
            });

            showToast('Reel added successfully');
            const modal = document.getElementById('videoModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            refreshVideoTable();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            progress.style.display = 'none';
        }
    });
};

// --- Exclusives Gallery ---
let currentExcCat = 'OUR EXCLUSIVES';

window.loadExclusivesAdmin = function(cat) {
    currentExcCat = cat;
    const grid = document.getElementById('excAdminGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-text">Loading...</p>';
    
    // Highlight active tab
    document.querySelectorAll('.exc-adm-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
    
    fetch(`api/exclusives.php?category=${encodeURIComponent(cat)}`)
        .then(r => r.json())
        .then(items => {
            if (!items || !items.length) {
                grid.innerHTML = '<p class="loading-text">No images in this category yet.</p>';
                return;
            }
            grid.innerHTML = items.map(item => `
                <div class="exc-adm-card" data-id="${item.id}">
                    <img src="${resolveImg(item.image_url)}" alt="${item.title || ''}" class="exc-adm-img">
                    <div class="exc-adm-card-info">
                        <span class="text-semibold">${esc(item.title) || '(no title)'}</span>
                        <span class="exc-adm-cat-badge">${item.category}</span>
                    </div>
                    <div class="exc-adm-actions">
                        <button class="btn btn-sm btn-secondary exc-edit-btn" data-id="${item.id}">Edit</button>
                        <button class="btn btn-sm btn-outline text-danger-color exc-del-btn" data-id="${item.id}">Delete</button>
                    </div>
                </div>
            `).join('');
            
            // Bind edit buttons
            grid.querySelectorAll('.exc-edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const item = items.find(i => i.id == btn.dataset.id);
                    openExcModal('edit', item);
                });
            });
            
            // Bind delete buttons
            grid.querySelectorAll('.exc-del-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteExclusive(btn.dataset.id));
            });
        })
        .catch(err => {
            console.error('Error loading exclusives:', err);
            grid.innerHTML = '<p class="loading-text">Error loading exclusives.</p>';
        });
};

window.openExcModal = function(mode, item = null) {
    const modal = document.getElementById('excModal');
    if (!modal) return;
    modal.classList.add('visible');
    
    document.getElementById('excModalTitle').textContent = mode === 'edit' ? 'Edit Image' : 'Add Exclusive Image';
    document.getElementById('excEditId').value = item ? item.id : '';
    document.getElementById('excCategory').value = item ? item.category : currentExcCat;
    document.getElementById('excTitle').value = item ? (item.title || '') : '';
    document.getElementById('excImageUrl').value = item ? item.image_url : '';
    document.getElementById('excSortOrder').value = item ? item.sort_order : 0;
    
    // Reset file input
    const fileInput = document.getElementById('excFileInput');
    if (fileInput) fileInput.value = '';
    
    const previewImg = document.getElementById('excPreviewImg');
    const uploadPrompt = document.getElementById('excUploadPrompt');
    if (item && item.image_url) {
        if (previewImg) {
            previewImg.src = resolveImg(item.image_url);
            previewImg.classList.remove('hidden');
        }
        if (uploadPrompt) uploadPrompt.classList.add('hidden');
    } else {
        if (previewImg) {
            previewImg.classList.add('hidden');
            previewImg.src = '';
        }
        if (uploadPrompt) uploadPrompt.classList.remove('hidden');
    }
};

window.closeExcModal = function() {
    const modal = document.getElementById('excModal');
    if (modal) {
        modal.classList.remove('visible');
    }
};

window.deleteExclusive = async function(id) {
    if (!confirm('Delete this image?')) return;
    safeFetch(`api/exclusives.php?id=${id}`, {
        method: 'DELETE'
    })
    .then(r => r ? r.json() : null)
    .then(data => {
        if (data && (data.success || data.status === 'success')) {
            showToast('Image removed successfully');
        } else if (data) {
            showToast(data.error || 'Failed to delete image');
        }
        loadExclusivesAdmin(currentExcCat);
    })
    .catch(() => {
        showToast('Error deleting image', 'error');
        loadExclusivesAdmin(currentExcCat);
    });
};


// ── BOOTSTRAP ──

document.addEventListener('DOMContentLoaded', () => {

    // 1. Animation classes are in admin-portal.css


    // 2. Navigation
    handleNavigation();

    // 3. Mobile Sidebar Toggle
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('mobileMenuBtn');

    menuBtn?.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        if (overlay) overlay.classList.remove('hidden');
    });

    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.add('hidden');
    });

    // 4. Product Tab Listeners
    document.getElementById('adminBrandTabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (btn) loadProducts(btn.dataset.brand);
    });

    // 5. Product Search/Sort
    const pSearch = document.getElementById('productSearch');
    const pSort = document.getElementById('productSortSelect');
    
    const triggerProductReload = () => {
        const activeTab = document.querySelector('#adminBrandTabs .tab-btn.active');
        loadProducts(activeTab ? activeTab.dataset.brand : 'all');
    };

    pSearch?.removeEventListener('input', triggerProductReload);
    pSearch?.addEventListener('input', triggerProductReload);
    
    pSort?.removeEventListener('change', triggerProductReload);
    pSort?.addEventListener('change', triggerProductReload);


    // 6. Order Filters
    document.getElementById('applyOrderFilters')?.addEventListener('click', loadOrders);
    document.getElementById('resetOrderFilters')?.addEventListener('click', () => {
        document.getElementById('orderStatusFilter').value = '';
        document.getElementById('orderBrandFilter').value = '';
        document.getElementById('orderSearch').value = '';
        loadOrders();
    });

    // 7. Order Status Modal Save
    document.getElementById('statusModalConfirm')?.addEventListener('click', async () => {
        const modal = document.getElementById('orderStatusModal');
        const id = modal.dataset.orderId;
        const status = document.getElementById('statusModalSelect').value;
        
        const res = await safeFetch('api/orders.php?action=update_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: id, status })
        });

        
        if (res && res.ok) {
            showToast('Order status updated');
            closeOrderStatusModal();
            loadOrders();
            // Refresh badge if needed
            const overview = document.getElementById('section-overview');
            if (status === 'pending' || (overview && !overview.classList.contains('hidden'))) {
                loadOverview();
            }
        }
    });

    document.getElementById('statusModalCancel')?.addEventListener('click', closeOrderStatusModal);
    document.getElementById('statusModalCloseBtn')?.addEventListener('click', closeOrderStatusModal);
    document.getElementById('detailsModalCloseBtn')?.addEventListener('click', closeOrderDetailsModal);

    document.getElementById('statusModalSelect')?.addEventListener('change', (e) => {
        const badgePreview = document.getElementById('statusModalBadgePreview');
        if (badgePreview) {
            const val = e.target.value;
            badgePreview.className = `badge badge-${val}`;
            badgePreview.textContent = val;
        }
    });

    // 8. Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        const m = document.getElementById('logoutConfirm');
        if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    });
    document.getElementById('logoutConfirmNo')?.addEventListener('click', () => {
        const m = document.getElementById('logoutConfirm');
        if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
    });

    document.getElementById('logoutConfirmYes')?.addEventListener('click', async () => {
        const res = await safeFetch('api/auth.php?action=logout', { method: 'POST' });
        window.location.href = 'login.html';
    });

    // 9. Product Modal Toggles
    document.getElementById('openAddProductBtn')?.addEventListener('click', openProductModal);
    document.getElementById('closeProductFormBtn')?.addEventListener('click', closeProductModal);
    document.getElementById('cancelFormBtn')?.addEventListener('click', closeProductModal);

    // 10. Product Form Brand Logic (Price Note)
    const brandSelect = document.querySelector('#addProductForm select[name="brand"]');
    const priceNote = document.getElementById('priceOptionalNote');
    if (brandSelect && priceNote) {
        brandSelect.addEventListener('change', () => {
            if (brandSelect.value === 'silverythm') priceNote.classList.remove('hidden');
            else priceNote.classList.add('hidden');
        });
    }

    // 11. Image Previews
    document.getElementById('imageUrlInput')?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const preview = document.getElementById('imagePreview');
        if (url && preview) {
            preview.src = resolveImg(url);
            preview.classList.remove('hidden');
        } else if (preview) {
            preview.classList.add('hidden');
        }
    });

    document.getElementById('image_file')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('edit-image-preview');
                const prompt = document.getElementById('upload-prompt');
                if (preview) {
                    preview.src = ev.target.result;
                    preview.classList.remove('hidden');
                    if (prompt) prompt.classList.add('hidden');
                }
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('refreshOverviewBtn')?.addEventListener('click', loadOverview);
    document.getElementById('viewAllOrdersBtn')?.addEventListener('click', () => window.switchSection('orders'));
    document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadOrders);
    document.getElementById('upload-zone')?.addEventListener('click', () => document.getElementById('image_file').click());

    // 12. Product Form Submit
    document.getElementById('addProductForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHtml = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<iconify-icon icon="lucide:loader-2" class="animate-spin"></iconify-icon> Saving…`;

        try {
            const formData = new FormData(form);
            const id = formData.get('id');
            const method = id ? 'PUT' : 'POST';
            
            let opts = { method };
            if (method === 'PUT') {
                const data = Object.fromEntries(formData.entries());
                data.image = data.image_url; // Map to PHP expected field
                delete data.image_file;
                opts.headers = { 'Content-Type': 'application/json' };
                opts.body = JSON.stringify(data);
            } else {
                opts.body = formData; // POST uses multipart for file upload
            }

            const res = await safeFetch('api/products.php', opts);
            if (res && res.ok) {
                showToast(id ? 'Product updated' : 'Product added');
                closeProductModal();
                loadProducts();
            }
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        }
    });

    // 13. Chart Range Tabs
    document.getElementById('chartRangeTabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.chart-tab');
        if (btn) {
            document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChartRange = btn.dataset.range;
            
            // Subtitle update
            const subtitle = document.getElementById('chartSubtitle');
            if (subtitle) subtitle.textContent = `Last ${currentChartRange} days · All brands`;
            
            // Reload overview to update chart (uses cached data if we want, but simple reload is safe)
            loadOverview();
        }
    });

    // 14. Action Button Delegation (CSP Safe)
    document.addEventListener('click', (e) => {
        // Products
        const editProductBtn = e.target.closest('.edit-product-btn');
        if (editProductBtn) {
            editProduct(parseInt(editProductBtn.dataset.id));
            return;
        }
        const deleteProductBtn = e.target.closest('.delete-product-btn');
        if (deleteProductBtn) {
            deleteProduct(parseInt(deleteProductBtn.dataset.id), deleteProductBtn.dataset.name);
            return;
        }

        // Orders
        const viewOrderStatusBtn = e.target.closest('.view-order-status-btn');
        if (viewOrderStatusBtn) {
            openOrderStatusModal(parseInt(viewOrderStatusBtn.dataset.id), viewOrderStatusBtn.dataset.status);
            return;
        }
    });

    // --- Exclusives Gallery Wiring ---
    const navExclusives = document.getElementById('nav-exclusives');
    if (navExclusives) {
        navExclusives.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection('exclusives');
            loadExclusivesAdmin('OUR EXCLUSIVES');
        });
    }

    // Modal close listeners
    document.getElementById('excModalCancel')?.addEventListener('click', () => {
        closeExcModal();
    });
    document.getElementById('excModalCloseBtn')?.addEventListener('click', () => {
        closeExcModal();
    });

    document.getElementById('addExclusiveBtn')?.addEventListener('click', () => openExcModal('add'));

    document.getElementById('excModalSave')?.addEventListener('click', async () => {
        const saveBtn = document.getElementById('excModalSave');
        const originalHtml = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<iconify-icon icon="lucide:loader-2" class="animate-spin"></iconify-icon> Saving...';

        try {
            const id = document.getElementById('excEditId').value;
            const imageUrl = document.getElementById('excImageUrl').value.trim();
            const fileInput = document.getElementById('excFileInput');
            let finalUrl = imageUrl;

            // If a file was selected, upload it first
            if (fileInput.files && fileInput.files[0]) {
                const fd = new FormData();
                fd.append('image', fileInput.files[0]);
                const res = await safeFetch('api/upload.php', { method: 'POST', body: fd });
                if (!res) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalHtml;
                    return;
                }
                const data = await res.json();
                if (data.status === 'success' || data.url) {
                    finalUrl = data.url;
                } else {
                    showToast(data.message || 'Image upload failed', 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalHtml;
                    return;
                }
            }

            if (!finalUrl) {
                showToast('Please provide an image URL or upload a file.', 'error');
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
                return;
            }

            const payload = {
                category: document.getElementById('excCategory').value,
                title: document.getElementById('excTitle').value,
                image_url: finalUrl,
                sort_order: parseInt(document.getElementById('excSortOrder').value) || 0,
            };

            const method = id ? 'PUT' : 'POST';
            if (id) payload.id = parseInt(id);

            const res = await safeFetch('api/exclusives.php', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
                return;
            }
            const data = await res.json();
            if (data.success || data.status === 'success' || data.id) {
                showToast(id ? 'Image updated' : 'Image added successfully');
                closeExcModal();
                loadExclusivesAdmin(currentExcCat);
            } else {
                showToast(data.error || 'Failed to save changes', 'error');
            }
        } catch (err) {
            console.error('Error saving exclusive:', err);
            showToast('Connection error', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;
        }
    });

    // Tab click handlers
    document.querySelectorAll('.exc-adm-tab').forEach(tab => {
        tab.addEventListener('click', () => loadExclusivesAdmin(tab.dataset.cat));
    });

    // File input triggers
    document.getElementById('excUploadZone')?.addEventListener('click', (e) => {
        if (e.target.id === 'excFileInput') return;
        document.getElementById('excFileInput').click();
    });

    document.getElementById('excFileInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = document.getElementById('excPreviewImg');
        const prompt = document.getElementById('excUploadPrompt');
        if (img) {
            img.src = url;
            img.classList.remove('hidden');
        }
        if (prompt) prompt.classList.add('hidden');
        document.getElementById('excImageUrl').value = '';
    });

    // Sync input URL changes to preview image
    document.getElementById('excImageUrl')?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const img = document.getElementById('excPreviewImg');
        const prompt = document.getElementById('excUploadPrompt');
        if (url && img) {
            img.src = resolveImg(url);
            img.classList.remove('hidden');
            if (prompt) prompt.classList.add('hidden');
        } else if (img) {
            img.classList.add('hidden');
            img.src = '';
            if (prompt) prompt.classList.remove('hidden');
        }
    });

    // Initial Load
    loadOverview();
});
