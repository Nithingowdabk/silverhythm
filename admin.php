<?php
session_start();
if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    header("Location: login.html");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal · Devaramane</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@200;300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/admin-portal.css">
    <link rel="icon" href="/assets/Logo.png" type="image/png">
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
<div class="admin-layout">

    <!-- SIDEBAR -->
    <aside class="sidebar" id="adminSidebar">
        <div class="sidebar-header">
            <div class="sidebar-brand">
                <img src="assets/Logo.png" alt="Devaramane" class="sidebar-logo">
                <span class="sidebar-badge">Admin</span>
            </div>
            <p class="sidebar-tagline">Management Suite</p>
        </div>
        <nav class="nav-menu">
            <span class="nav-section-label">Main</span>
            <a href="#" class="nav-link active" id="nav-overview">
                <iconify-icon icon="lucide:layout-dashboard"></iconify-icon> Overview
            </a>
            <a href="#" class="nav-link" id="nav-products">
                <iconify-icon icon="lucide:package"></iconify-icon> Products
            </a>
            <a href="#" class="nav-link" id="nav-orders">
                <iconify-icon icon="lucide:shopping-cart"></iconify-icon> Orders
                <span class="nav-badge hidden" id="pendingBadge">0</span>
            </a>
            <span class="nav-section-label">Customers</span>
            <a href="#" class="nav-link" id="nav-users">
                <iconify-icon icon="lucide:users"></iconify-icon> Users
            </a>
            <a href="#" class="nav-link" id="nav-wishlist">
                <iconify-icon icon="lucide:heart"></iconify-icon> Wishlist
            </a>
            <span class="nav-section-label">Content</span>
            <a href="#" class="nav-link" id="nav-banner">
                <iconify-icon icon="lucide:megaphone"></iconify-icon> Banner Strip
            </a>
            <a href="#" class="nav-link" id="nav-videos">
                <iconify-icon icon="lucide:video"></iconify-icon> Reels & Videos
            </a>
            <a href="#" class="nav-link" id="nav-exclusives">
                <iconify-icon icon="lucide:image"></iconify-icon> Exclusives Gallery
            </a>


        </nav>
        <div class="sidebar-footer">
            <div class="user-card">
                <div class="user-avatar"><?php echo strtoupper(substr($_SESSION['user_name'] ?? 'A', 0, 1)); ?></div>
                <div class="user-info-text">
                    <p class="user-name"><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'Admin'); ?></p>
                    <p class="user-role">Administrator</p>
                </div>
            </div>
            <button class="btn-logout" id="logoutBtn">
                <iconify-icon icon="lucide:log-out"></iconify-icon> Sign out
            </button>
        </div>
    </aside>

    <!-- MOBILE TOPBAR -->
    <div class="mobile-topbar" id="mobileTopbar">
        <button class="mobile-menu-btn" id="mobileMenuBtn">
            <iconify-icon icon="lucide:menu" width="20"></iconify-icon>
        </button>
        <img src="assets/Logo.png" alt="Devaramane" class="mobile-logo">
        <div class="empty-36"></div>
    </div>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- MAIN -->
    <main class="main-content">

        <!-- OVERVIEW -->
        <section id="section-overview">
            <header class="section-header">
                <div>
                    <h1 class="section-title">Overview</h1>
                    <p class="section-subtitle">Real-time performance analytics</p>
                </div>
                <div class="header-actions">
                    <div class="live-status">
                        <span class="live-dot"></span>
                        <span class="live-dot-label">Live</span>
                    </div>
                    <button class="btn btn-outline btn-sm" id="refreshOverviewBtn">
                        <iconify-icon icon="lucide:refresh-cw" width="13"></iconify-icon> Refresh
                    </button>
                </div>
            </header>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-top">
                        <div class="stat-icon-wrap icon-wrap-blue">
                            <iconify-icon icon="lucide:shopping-bag"></iconify-icon>
                        </div>
                        <span class="stat-trend trend-neutral" id="stat-orders-trend">—</span>
                    </div>
                    <span class="stat-label">Total Orders</span>
                    <p class="stat-value" id="stat-orders">—</p>
                </div>
                <div class="stat-card">
                    <div class="stat-top">
                        <div class="stat-icon-wrap icon-wrap-gold">
                            <iconify-icon icon="lucide:indian-rupee"></iconify-icon>
                        </div>
                        <span class="stat-trend trend-neutral" id="stat-revenue-trend">—</span>
                    </div>
                    <span class="stat-label">Total Revenue</span>
                    <p class="stat-value" id="stat-revenue">—</p>
                </div>
                <div class="stat-card">
                    <div class="stat-top">
                        <div class="stat-icon-wrap icon-wrap-teal">
                            <iconify-icon icon="lucide:package"></iconify-icon>
                        </div>
                        <span class="stat-trend trend-neutral" id="stat-products-trend">—</span>
                    </div>
                    <span class="stat-label">Products</span>
                    <p class="stat-value" id="stat-products">—</p>
                </div>
                <div class="stat-card">
                    <div class="stat-top">
                        <div class="stat-icon-wrap icon-wrap-amber">
                            <iconify-icon icon="lucide:clock"></iconify-icon>
                        </div>
                        <span class="stat-trend trend-neutral" id="stat-pending-trend">—</span>
                    </div>
                    <span class="stat-label">Pending Orders</span>
                    <p class="stat-value" id="stat-pending">—</p>
                </div>
            </div>

            <div class="overview-grid">
                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <p class="panel-title">Revenue Trajectory</p>
                            <p class="panel-subtitle" id="chartSubtitle">Last 7 days · All brands</p>
                        </div>
                        <div class="chart-tabs" id="chartRangeTabs">
                            <button class="chart-tab active" data-range="7">7D</button>
                            <button class="chart-tab" data-range="14">14D</button>
                            <button class="chart-tab" data-range="30">30D</button>
                        </div>
                    </div>
                    <div class="panel-body">
                        <div class="chart-wrap"><canvas id="revenueChart"></canvas></div>
                    </div>
                </div>
                <div class="panel">
                    <div class="panel-header">
                        <div>
                            <p class="panel-title">Order Status</p>
                            <p class="panel-subtitle">Distribution across all brands</p>
                        </div>
                    </div>
                    <div class="panel-body donut-body">
                        <div class="donut-canvas-wrap">
                            <canvas id="statusDonut" width="140" height="140"></canvas>
                        </div>
                        <div class="donut-legend-wrap">
                            <div class="mini-stat-list" id="statusLegend">
                                <div class="mini-stat"><span class="mini-stat-label"><iconify-icon icon="lucide:check-circle"></iconify-icon>Delivered</span><span class="mini-stat-value" id="qs-delivered">—</span></div>
                                <div class="mini-stat"><span class="mini-stat-label"><iconify-icon icon="lucide:truck"></iconify-icon>Shipped</span><span class="mini-stat-value" id="qs-shipped">—</span></div>
                                <div class="mini-stat"><span class="mini-stat-label"><iconify-icon icon="lucide:clock"></iconify-icon>Pending</span><span class="mini-stat-value" id="qs-pending">—</span></div>
                                <div class="mini-stat"><span class="mini-stat-label"><iconify-icon icon="lucide:x-circle"></iconify-icon>Cancelled</span><span class="mini-stat-value" id="qs-cancelled">—</span></div>
                                <div class="mini-stat">
                                    <span class="mini-stat-label"><iconify-icon icon="lucide:calendar"></iconify-icon>Today's Orders</span>
                                    <span class="mini-stat-value" id="qs-today">—</span>
                                </div>
                                <div class="mini-stat">
                                    <span class="mini-stat-label"><iconify-icon icon="lucide:indian-rupee"></iconify-icon>Today's Revenue</span>
                                    <span class="mini-stat-value" id="qs-today-rev">—</span>
                                </div>
                                <div class="mini-stat">
                                    <span class="mini-stat-label"><iconify-icon icon="lucide:trending-up"></iconify-icon>Avg. Order</span>
                                    <span class="mini-stat-value" id="qs-avg">—</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <div>
                        <p class="panel-title">Recent Transactions</p>
                        <p class="panel-subtitle">Latest orders across all brands</p>
                    </div>
                    <button class="btn btn-outline btn-sm" id="viewAllOrdersBtn">
                        View all <iconify-icon icon="lucide:arrow-right" width="13"></iconify-icon>
                    </button>
                </div>
                <div class="overflow-x-auto">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead><tr>
                             <th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th class="text-right">Amount</th>
                        </tr></thead>
                        <tbody id="overview-recent-orders">
                            <tr><td colspan="5" class="table-loading">Loading…</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="overview-footer">
                <div class="live-status">
                    <span class="live-dot"></span> All systems operational
                </div>
                <span>Devaramane · Admin Portal</span>
            </div>
        </section>

        <!-- PRODUCTS -->
        <section id="section-products" class="hidden">
            <header class="section-header">
                <div>
                    <h1 class="section-title">Products</h1>
                    <p class="section-subtitle">Manage your catalogue</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" id="openAddProductBtn">
                        <iconify-icon icon="lucide:plus" width="15"></iconify-icon> New Product
                    </button>
                </div>
            </header>
            <div class="brand-tabs" id="adminBrandTabs"></div>
            <div class="panel">
                <div class="toolbar">
                    <div class="search-input-wrap">
                        <iconify-icon icon="lucide:search"></iconify-icon>
                        <input type="text" id="productSearch" placeholder="Search products…">
                    </div>
                    <select class="filter-select" id="productSortSelect">
                        <option value="default">Sort: Default</option>
                        <option value="name-asc">Name A–Z</option>
                        <option value="name-desc">Name Z–A</option>
                        <option value="price-asc">Price Low–High</option>
                        <option value="price-desc">Price High–Low</option>
                    </select>
                </div>
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead><tr>
                            <th class="col-60">Image</th>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Brand</th>
                            <th class="text-right">Actions</th>
                        </tr></thead>
                        <tbody id="adminRecordList">
                            <tr><td colspan="6" class="table-loading">Loading…</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- ORDERS -->
        <section id="section-orders" class="hidden">
            <header class="section-header">
                <div>
                    <h1 class="section-title">Orders</h1>
                    <p class="section-subtitle">Track &amp; manage all customer orders</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-outline btn-sm" id="refreshOrdersBtn">
                        <iconify-icon icon="lucide:refresh-cw" width="13"></iconify-icon> Refresh
                    </button>
                </div>
            </header>
            <div class="filters-bar">
                <div class="form-group">
                    <label>Status</label>
                    <select id="orderStatusFilter">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                </div>
                <div class="form-group">
                    <label>Brand</label>
                    <select id="orderBrandFilter">
                        <option value="">All Brands</option>
                        <option value="silverythm">Silverhythm</option>
                        <option value="devaramane">Devaramane</option>
                        <option value="udugore">Udugore</option>
                    </select>
                </div>
                <div class="form-group wide">
                    <label>Search</label>
                    <input type="text" id="orderSearch" placeholder="Customer name or #ID…">
                </div>
                <button class="btn btn-primary btn-apply" id="applyOrderFilters">
                    <iconify-icon icon="lucide:filter" width="14"></iconify-icon> Apply
                </button>
                <button class="btn btn-outline btn-reset" id="resetOrderFilters" title="Reset">
                    <iconify-icon icon="lucide:x" width="14"></iconify-icon>
                </button>
            </div>
            <div class="panel">
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead><tr>
                            <th>Order ID</th><th>Customer</th><th>Items</th>
                            <th>Total</th><th>Status</th><th>Date</th><th class="text-right">Actions</th>
                        </tr></thead>
                        <tbody id="ordersTableBody">
                            <tr><td colspan="7" class="table-loading">Loading orders…</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Order Status Modal -->
            <div id="orderStatusModal" class="admin-modal-overlay hidden">
                <div class="admin-modal-panel">
                    <div class="modal-header flex-between" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.25rem;">
                        <div class="flex-center gap-2">
                            <iconify-icon icon="lucide:clipboard-list" style="font-size: 1.25rem; color: var(--gold);"></iconify-icon>
                            <h2 class="admin-modal-title" style="margin: 0; font-family: 'DM Sans', sans-serif; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">Update Order Status</h2>
                        </div>
                        <button class="close-round-btn" id="statusModalCloseBtn" title="Close">&times;</button>
                    </div>
                    
                    <div style="background: var(--surface-2); border-radius: 8px; padding: 0.875rem 1rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border: 1px solid var(--border);">
                        <div>
                            <span style="font-size: 0.68rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em; display: block; margin-bottom: 0.125rem;">Order Reference</span>
                            <span id="statusModalOrderId" style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">#—</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.68rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem;">Status Preview</span>
                            <span id="statusModalBadgePreview" class="badge badge-neutral">Pending</span>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 0.5rem;">Select Status</label>
                        <select id="statusModalSelect" class="filter-select" style="width: 100%; height: 42px; border-radius: var(--radius); border: 1.5px solid var(--border); background: var(--surface); padding: 0 1rem; font-weight: 500; font-size: 0.85rem; color: var(--text-primary); transition: border-color 0.2s;">
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div class="form-actions" style="margin-top: 1.5rem; display: flex; gap: 0.75rem; justify-content: flex-end;">
                        <button class="btn btn-outline" id="statusModalCancel" style="padding: 0.6rem 1.25rem; font-weight: 600;">Cancel</button>
                        <button class="btn btn-primary" id="statusModalConfirm" style="padding: 0.6rem 1.5rem; font-weight: 700;">Save Changes</button>
                    </div>
                </div>
            </div>

            <!-- Order Details Modal -->
            <div id="orderDetailsModal" class="admin-modal-overlay hidden">
                <div class="admin-modal-panel" style="max-width: 600px;">
                    <div class="modal-header flex-between" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.25rem;">
                        <div class="flex-center gap-2">
                            <iconify-icon icon="lucide:shopping-bag" style="font-size: 1.25rem; color: var(--gold);"></iconify-icon>
                            <h2 class="admin-modal-title" style="margin: 0; font-family: 'DM Sans', sans-serif; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">Order Details</h2>
                        </div>
                        <button class="close-round-btn" id="detailsModalCloseBtn" title="Close">&times;</button>
                    </div>
                    
                    <div id="orderDetailsContent" style="max-height: 70vh; overflow-y: auto;">
                        <!-- Dynamic Content Injected via JS -->
                    </div>
                </div>
            </div>
        </section>

        <!-- PLACEHOLDER SECTIONS -->
        <section id="section-users" class="hidden"><div id="usersPlaceholder"></div></section>
        <section id="section-wishlist" class="hidden"><div id="wishlistPlaceholder"></div></section>
        <section id="section-banner" class="hidden"><div id="bannerPlaceholder"></div></section>
        <section id="section-videos" class="hidden"><div id="videosPlaceholder"></div></section>

        <section id="section-exclusives" class="hidden">
            <header class="section-header">
                <div class="section-header-content">
                    <h1 class="section-title">Exclusives Gallery</h1>
                    <p class="section-subtitle">Manage Silverhythm exclusive frame images by collection</p>
                </div>
                <button class="btn btn-primary" id="addExclusiveBtn">
                    <iconify-icon icon="lucide:plus"></iconify-icon> Add Image
                </button>
            </header>

            <!-- Category Filter Tabs -->
            <div class="exc-admin-tabs" id="excAdminTabs">
                <button class="exc-adm-tab active" data-cat="OUR EXCLUSIVES">Our Exclusives</button>
                <button class="exc-adm-tab" data-cat="2 IN 1">2 in 1</button>
                <button class="exc-adm-tab" data-cat="3 IN 1">3 in 1</button>
                <button class="exc-adm-tab" data-cat="4 IN 1">4 in 1</button>
                <button class="exc-adm-tab" data-cat="5 IN 1">5 in 1</button>
            </div>

            <!-- Items Grid -->
            <div class="exc-admin-grid" id="excAdminGrid">
                <p class="loading-text">Loading...</p>
            </div>


        </section>



    </main>
</div>

<!-- PRODUCT MODAL -->
<div id="productFormContainer" class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header flex-between">
            <h2 class="section-title m-0" id="formTitle">Add Product</h2>
            <button id="closeProductFormBtn" class="close-round-btn" title="Close">&times;</button>
        </div>
        <div class="modal-body">
            <form id="addProductForm" autocomplete="off">
                <input type="hidden" name="id" id="productIdField">
                <div class="form-group">
                    <label>Product Name <span class="form-label-req">*</span></label>
                    <input type="text" name="name" required placeholder="e.g. Vintage Silver Chain">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Brand <span class="form-label-req">*</span></label>
                        <select name="brand" required>
                            <option value="silverythm">Silverhythm</option>
                            <option value="devaramane">Devaramane</option>
                            <option value="udugore">Udugore</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category" placeholder="e.g. Necklaces">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Size (Optional)</label>
                        <input type="text" name="size" id="productSizeField" placeholder="e.g. 18x22 inches">
                    </div>
                    <div class="form-group">
                        <label>Frame (Optional)</label>
                        <input type="text" name="frame" id="productFrameField" placeholder="e.g. Teakwood Frame">
                    </div>
                    <div class="form-group">
                        <label>Material (Optional)</label>
                        <input type="text" name="material" id="productMaterialField" placeholder="e.g. 999.9 Pure Silver">
                    </div>
                </div>
                <div class="form-group">
                    <label>Price (₹) <span id="priceOptionalNote" class="form-note hidden">Optional for Silverhythm — leave 0 for "By Consultation"</span></label>
                    <input type="number" name="price" id="priceInput" min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Description <span class="form-label-req">*</span></label>
                    <textarea name="description" required rows="4" placeholder="Craftsmanship details, materials, dimensions…"></textarea>
                </div>
                <div class="form-group">
                    <label>Product Image</label>
                    <div class="image-upload-zone" id="upload-zone">
                        <input type="file" name="image_file" id="image_file" accept="image/*" class="hidden">
                        <div id="upload-prompt" class="upload-zone-prompt">
                            <iconify-icon icon="lucide:upload-cloud" width="32" class="upload-zone-icon"></iconify-icon>
                            <p class="upload-zone-text-primary">Click to upload</p>
                            <p class="upload-zone-text-secondary">JPG, PNG, WEBP up to 5MB</p>
                        </div>
                        <img id="edit-image-preview" class="image-preview-full hidden">
                    </div>
                </div>
                <div class="form-group">
                    <label>Or paste image URL</label>
                    <input type="text" name="image_url" id="imageUrlInput" placeholder="https://example.com/image.jpg">
                    <img id="imagePreview" class="image-preview-card hidden">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <iconify-icon icon="lucide:save" width="15"></iconify-icon> Save Product
                    </button>
                    <button type="button" class="btn btn-outline" id="cancelFormBtn">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- EXCLUSIVES MODAL -->
<div id="excModal" class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header flex-between">
            <h2 class="section-title m-0" id="excModalTitle">Add Exclusive Image</h2>
            <button id="excModalCloseBtn" class="close-round-btn" title="Close">&times;</button>
        </div>
        <div class="modal-body">
            <input type="hidden" id="excEditId">
            
            <div class="form-group">
                <label>Category <span class="form-label-req">*</span></label>
                <select id="excCategory">
                    <option value="OUR EXCLUSIVES">Our Exclusives</option>
                    <option value="2 IN 1">2 in 1</option>
                    <option value="3 IN 1">3 in 1</option>
                    <option value="4 IN 1">4 in 1</option>
                    <option value="5 IN 1">5 in 1</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Title (Optional)</label>
                <input type="text" id="excTitle" placeholder="e.g. Lakshmi & Ganesha Frame">
            </div>
            
            <div class="form-group">
                <label>Image</label>
                <div class="image-upload-zone" id="excUploadZone">
                    <input type="file" id="excFileInput" accept="image/*" class="hidden">
                    <div id="excUploadPrompt" class="upload-zone-prompt">
                        <iconify-icon icon="lucide:upload-cloud" width="32" class="upload-zone-icon"></iconify-icon>
                        <p class="upload-zone-text-primary">Click to upload</p>
                        <p class="upload-zone-text-secondary">JPG, PNG, WEBP up to 5MB</p>
                    </div>
                    <img id="excPreviewImg" class="image-preview-full hidden">
                </div>
            </div>
            
            <div class="form-group">
                <label>Or paste image URL</label>
                <input type="text" id="excImageUrl" placeholder="https://example.com/image.jpg">
            </div>
            
            <div class="form-group">
                <label>Sort Order</label>
                <input type="number" id="excSortOrder" value="0" min="0">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-primary" id="excModalSave">
                    <iconify-icon icon="lucide:save" width="15"></iconify-icon> Save Image
                </button>
                <button type="button" class="btn btn-outline" id="excModalCancel">Cancel</button>
            </div>
        </div>
    </div>
</div>

<!-- LOGOUT CONFIRM -->
<div id="logoutConfirm" class="admin-modal-overlay hidden">
    <div class="logout-dialog">
        <div class="logout-icon"><iconify-icon icon="lucide:log-out"></iconify-icon></div>
        <h2 class="logout-title">Sign out?</h2>
        <p class="logout-sub">You'll be returned to the login page.</p>
        <div class="logout-actions">
            <button class="btn btn-primary btn-danger-confirm" id="logoutConfirmYes">Yes, sign out</button>
            <button class="btn btn-outline btn-outline-center" id="logoutConfirmNo">Stay logged in</button>
        </div>
    </div>
</div>

<script src="js/admin.js"></script>
</body>
</html>
