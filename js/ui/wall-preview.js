let stream = null;

export function initWallPreview(product) {
  if (window.innerWidth > 768) return;
  const ctaStack = document.querySelector('.cta-stack');
  if (ctaStack && !document.getElementById('wp-trigger-btn')) {
    const btn = document.createElement('button');
    btn.id = 'wp-trigger-btn';
    btn.className = 'btn-secondary';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8
                 a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
      Preview In Your Space
    `;
    ctaStack.appendChild(btn);
    btn.addEventListener('click', () => openOverlay(product));
  }

  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav && !document.getElementById('wp-trigger-btn-mobile')) {
    const mobileBtn = document.createElement('button');
    mobileBtn.id = 'wp-trigger-btn-mobile';
    mobileBtn.className = 'bn';
    mobileBtn.setAttribute('aria-label', 'Preview');
    mobileBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8
                 a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
      <span>Preview</span>
    `;
    
    const bagBtn = document.getElementById('bagBtn');
    if (bagBtn) {
      bottomNav.insertBefore(mobileBtn, bagBtn);
    } else {
      bottomNav.appendChild(mobileBtn);
    }
    
    mobileBtn.addEventListener('click', () => openOverlay(product));
  }
}

export async function openOverlay(product) {
  // Build overlay DOM
  const overlay = document.createElement('div');
  overlay.id = 'wp-overlay';
  overlay.innerHTML = `
    <video id="wp-video" autoplay muted playsinline></video>
    <img id="wp-frame" alt="">
    <div id="wp-hint">Drag · Pinch to resize</div>
    <button id="wp-close">✕</button>
    <button id="wp-lock" title="Lock Position">
      <svg id="wp-lock-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
      </svg>
    </button>
    <button id="wp-flip">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
    </button>
    <button id="wp-save">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" 
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Save Photo
    </button>
    <div id="wp-denied">
      <p>Camera access denied or unavailable. Please enable camera permission to use this feature.</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const video = document.getElementById('wp-video');

  // Request camera with high quality resolution ideal constraints
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    video.srcObject = stream;
  } catch (err) {
    // Show denied state — do NOT crash, do NOT console.error in production
    const deniedEl = document.getElementById('wp-denied');
    if (deniedEl) deniedEl.style.display = 'flex';
    if (video) video.style.display = 'none';
  }

  let currentFacingMode = 'environment';

  document.getElementById('wp-flip').addEventListener('click', async () => {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    // Stop existing stream
    if (stream) stream.getTracks().forEach(t => t.stop());
    
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: currentFacingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      video.srcObject = stream;
    } catch (err) {
      // If flip fails, silently revert — do not crash
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    }
  });

  // Frame image setup
  const frame = document.getElementById('wp-frame');
  let naturalRatio = 1; // will be set once image loads

  frame.onload = () => {
    naturalRatio = frame.naturalWidth / frame.naturalHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    frame.style.width = '220px';
    frame.style.height = (220 / naturalRatio) + 'px';
    frame.style.left = ((vw - frame.offsetWidth) / 2) + 'px';
    frame.style.top = ((vh - frame.offsetHeight) / 2) + 'px';
  };
  frame.src = product.image;

  // Lock feature state and event handling
  let isLocked = false;
  const lockBtn = document.getElementById('wp-lock');
  const lockIcon = document.getElementById('wp-lock-icon');

  function showFeedbackHint(text) {
    let feed = document.getElementById('wp-feedback-hint');
    if (!feed) {
      feed = document.createElement('div');
      feed.id = 'wp-feedback-hint';
      feed.style.cssText = `
        position: absolute;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 12;
        background: rgba(0, 0, 0, 0.75);
        color: #fff;
        font-family: var(--sans);
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 8px 16px;
        border-radius: 20px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.25s ease;
      `;
      overlay.appendChild(feed);
    }
    feed.textContent = text;
    feed.style.opacity = '1';
    
    if (feed._timeout) clearTimeout(feed._timeout);
    feed._timeout = setTimeout(() => {
      feed.style.opacity = '0';
    }, 1500);
  }

  lockBtn.addEventListener('click', () => {
    isLocked = !isLocked;
    if (isLocked) {
      lockBtn.classList.add('locked');
      frame.classList.add('locked');
      lockIcon.innerHTML = `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      `;
      showFeedbackHint('Position Locked');
    } else {
      lockBtn.classList.remove('locked');
      frame.classList.remove('locked');
      lockIcon.innerHTML = `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
      `;
      showFeedbackHint('Position Unlocked');
    }
  });

  // Drag gesture (pointer events — works on both mouse and touch)
  let isDragging = false;
  let dragStartX, dragStartY, frameStartX, frameStartY;

  frame.addEventListener('pointerdown', (e) => {
    if (isLocked) return;
    if (e.touches && e.touches.length > 1) return; // let pinch handle
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    frameStartX = frame.offsetLeft;
    frameStartY = frame.offsetTop;
    frame.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  frame.addEventListener('pointermove', (e) => {
    if (isLocked || !isDragging) return;
    frame.style.left = (frameStartX + e.clientX - dragStartX) + 'px';
    frame.style.top = (frameStartY + e.clientY - dragStartY) + 'px';
  });

  frame.addEventListener('pointerup', () => { isDragging = false; });
  frame.addEventListener('pointercancel', () => { isDragging = false; });

  // Pinch-to-resize (touch events)
  let lastPinchDist = null;

  overlay.addEventListener('touchmove', (e) => {
    if (isLocked) return;
    if (e.touches.length !== 2) return;
    e.preventDefault();

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);

    if (lastPinchDist !== null) {
      const delta = dist - lastPinchDist;
      const currentW = frame.offsetWidth;
      const newW = Math.min(Math.max(currentW + delta, 80), window.innerWidth * 0.9);
      frame.style.width = newW + 'px';
      frame.style.height = (newW / naturalRatio) + 'px'; // proportional
    }
    lastPinchDist = dist;
  }, { passive: false });

  overlay.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) lastPinchDist = null;
  });

  // Double-tap to reset
  let lastTapTime = 0;

  overlay.addEventListener('touchend', (e) => {
    if (isLocked) return;
    if (e.touches.length > 0) return; // only fire when all fingers lifted
    const now = Date.now();
    if (now - lastTapTime < 300) {
      // Double tap detected — reset frame
      frame.style.width = '220px';
      frame.style.height = (220 / naturalRatio) + 'px';
      frame.style.left = ((window.innerWidth - frame.offsetWidth) / 2) + 'px';
      frame.style.top = ((window.innerHeight - frame.offsetHeight) / 2) + 'px';
    }
    lastTapTime = now;
  });

  // Save / screenshot
  document.getElementById('wp-save').addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    // Save at high resolution (min 2x, or devicePixelRatio)
    const scale = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    const ctx = canvas.getContext('2d');

    // Draw camera frame with object-fit: cover calculation
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;

    if (vWidth && vHeight) {
      const videoRatio = vWidth / vHeight;
      const screenRatio = canvas.width / canvas.height;
      let sx = 0, sy = 0, sw = vWidth, sh = vHeight;

      if (videoRatio > screenRatio) {
        // Video is wider than screen, crop sides
        sw = vHeight * screenRatio;
        sx = (vWidth - sw) / 2;
      } else {
        // Video is taller than screen, crop top/bottom
        sh = vWidth / screenRatio;
        sy = (vHeight - sh) / 2;
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Draw product overlay at its current position/size scaled
    const frameEl = document.getElementById('wp-frame');
    ctx.drawImage(
      frameEl,
      frameEl.offsetLeft * scale,
      frameEl.offsetTop * scale,
      frameEl.offsetWidth * scale,
      frameEl.offsetHeight * scale
    );

    // Trigger download
    const link = document.createElement('a');
    link.download = 'silverhythm-preview.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  });

  // Close / cleanup
  document.getElementById('wp-close').addEventListener('click', closeOverlay);

  // Hint auto-fade
  const hint = document.getElementById('wp-hint');
  if (hint) {
    setTimeout(() => { hint.style.opacity = '0'; }, 3000);
  }

  // One-time brightness tip per session
  if (!sessionStorage.getItem('wp-tip-seen')) {
    const tip = document.createElement('div');
    tip.id = 'wp-tip';
    tip.textContent = 'Point at a well-lit wall for best results';
    overlay.appendChild(tip);
    setTimeout(() => { tip.style.opacity = '0'; }, 4000);
    setTimeout(() => { tip.remove(); }, 5000);
    sessionStorage.setItem('wp-tip-seen', '1');
  }
}

function closeOverlay() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  const overlay = document.getElementById('wp-overlay');
  if (overlay) overlay.remove();
}

// Safety: stop camera if user navigates away
window.addEventListener('beforeunload', closeOverlay, { once: true });
