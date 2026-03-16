/* ===== DRIP CLIENT - SCRIPT.JS ===== */
'use strict';

// ===== CONFIG =====
const JSONBIN_BIN_ID = '69b7c04aaa77b81da9eb8021';
const JSONBIN_API_KEY = '$2a$10$Y.jqtzCgEfTCuODvJNV08ex.6qQW0V5p2WF6UUqlhg.fYT4W.4Gu6';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
const WA_CHANNEL = 'https://whatsapp.com/channel/0029Vb7uxdI0AgW8JYtSdH0E';
const LOGO_URL = 'https://cdn-uploads.huggingface.co/production/uploads/noauth/8W2qfrJxJ0G0EplunCycM.jpeg';

// ===== DEFAULT DATA STRUCTURE =====
const DEFAULT_DATA = {
  users: [
    { username: 'admin', password: 'admin123', credit: 999999, usedPromos: [] },
    { username: 'demo', password: 'demo123', credit: 50000, usedPromos: [] }
  ],
  products: [
    {
      id: 'prod_001',
      name: 'DRIP CLIENT',
      type: 'Cheat Android',
      image: LOGO_URL,
      description: 'Cheat android terbaik dengan fitur lengkap',
      features: ['Anti Ban', 'Silent Aim', 'ESP Wallhack', 'Aimbot Pro'],
      fullkeyPlans: [
        { label: '1 Days', price: 20000 },
        { label: '3 Days', price: 30000 },
        { label: '7 Days', price: 65000 },
        { label: '15 Days', price: 110000 },
        { label: '1 Bulan', price: 230000 }
      ],
      rentalPlans: [
        { label: '1 Jam', price: 5000 },
        { label: '2 Jam', price: 7000 },
        { label: '10 Jam', price: 11000 },
        { label: '15 Jam', price: 16000 },
        { label: '24 Jam', price: 25000 }
      ],
      hasRental: true,
      active: true
    }
  ],
  transactions: [],
  promoCodes: [],
  runningText: { active: false, text: 'KODE PROMO TERBARU : DISKON70%  🔥  WELCOME TO DRIP CLIENT  🎮  BUY KEY NOW!' },
  resetKeyStatus: true,
  notifPopup1: { active: true },
  notifPopup2: { active: false, type: 'info', text: 'Jika anda mengalami kesulitan hubungi admin' },
  maintenance: { active: false, reason: 'Sedang dalam perbaikan sistem, mohon tunggu sebentar.' },
  stats: { totalBuyers: 0, totalRevenue: 0, todaySales: 0, lastResetDate: '' },
  dailyResets: {}
};

// ===== DATABASE LAYER =====
let _dbCache = null;

async function dbGet() {
  try {
    const res = await fetch(JSONBIN_URL + '/latest', {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!res.ok) throw new Error('Fetch failed');
    const json = await res.json();
    _dbCache = json.record;
    // Ensure all default keys exist
    let updated = false;
    for (const key of Object.keys(DEFAULT_DATA)) {
      if (_dbCache[key] === undefined) { _dbCache[key] = DEFAULT_DATA[key]; updated = true; }
    }
    if (updated) await dbSet(_dbCache);
    return _dbCache;
  } catch (e) {
    console.warn('DB Get failed, using cache or default', e);
    return _dbCache || DEFAULT_DATA;
  }
}

async function dbSet(data) {
  try {
    const res = await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Set failed');
    const json = await res.json();
    _dbCache = json.record;
    return true;
  } catch (e) {
    console.error('DB Set failed:', e);
    return false;
  }
}

// ===== PARTICLE BACKGROUND =====
function initParticles(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const count = window.innerWidth < 768 ? 40 : 80;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.6 + 0.2,
      color: ['#8b00e0', '#a855f7', '#d946ef', '#7c3aed'][Math.floor(Math.random() * 4)]
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(139, 0, 224, ${0.15 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      // Glow
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grd.addColorStop(0, p.color + 'aa');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;

      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });

    requestAnimationFrame(draw);
  }
  draw();
}

// ===== LOADING SCREEN =====
function initLoadingScreen(onComplete) {
  const screen = document.getElementById('loading-screen');
  if (!screen) { onComplete && onComplete(); return; }

  // Animate letters
  const title = screen.querySelector('.loading-title');
  if (title) {
    const text = 'DRIPCLIENT';
    const letters = text.split('').map((c, i) => {
      const span = document.createElement('span');
      span.textContent = c === ' ' ? '\u00a0' : c;
      span.style.animationDelay = `${0.3 + i * 0.08}s`;
      return span;
    });
    title.innerHTML = '';
    letters.forEach(s => title.appendChild(s));
  }

  setTimeout(() => {
    screen.classList.add('loading-exit');
    setTimeout(() => {
      screen.style.display = 'none';
      onComplete && onComplete();
    }, 600);
  }, 3000);
}

// ===== SECURITY: SANITIZE INPUT =====
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .slice(0, 200);
}

function validateInput(str) {
  // Block XSS/injection patterns
  const dangerous = /<script|javascript:|on\w+\s*=|<\/?\s*(iframe|object|embed|form|input|button)/i;
  return !dangerous.test(str);
}

// ===== SESSION =====
function setSession(username) {
  sessionStorage.setItem('dc_user', sanitize(username));
  sessionStorage.setItem('dc_auth', '1');
}

function getSession() {
  return sessionStorage.getItem('dc_user');
}

function clearSession() {
  sessionStorage.clear();
}

function requireAuth() {
  if (!getSession()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ===== TOGGLE PASSWORD =====
function initPasswordToggle() {
  document.querySelectorAll('.input-eye').forEach(eye => {
    eye.addEventListener('click', () => {
      const input = eye.parentElement.querySelector('input');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        eye.className = eye.className.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        eye.className = eye.className.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });
}

// ===== SWEETALERT HELPERS =====
function showSuccess(title, text) {
  Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true
  });
}

function showError(title, text) {
  Swal.fire({ icon: 'error', title: title, text: text, confirmButtonText: 'OK' });
}

function showInfo(title, text) {
  Swal.fire({ icon: 'info', title: title, text: text, confirmButtonText: 'OK' });
}

// ===== SCROLL FADE-IN =====
function initScrollFade() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// =========================================================
// ===== INDEX.HTML - LOGIN =====
// =========================================================
async function initLogin() {
  initParticles('particles-canvas');
  initLoadingScreen(() => {
    document.getElementById('main-content').style.display = 'flex';
    initPasswordToggle();

    // Remember me
    const savedUser = localStorage.getItem('dc_remember_user');
    if (savedUser) {
      const ui = document.getElementById('login-username');
      if (ui) ui.value = savedUser;
      const rm = document.getElementById('remember-me');
      if (rm) rm.checked = true;
    }

    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', handleLogin);
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const usernameRaw = document.getElementById('login-username').value;
  const passwordRaw = document.getElementById('login-password').value;
  const remember = document.getElementById('remember-me')?.checked;

  if (!usernameRaw || !passwordRaw) { showError('Input Kosong', 'Username dan password wajib diisi!'); return; }
  if (!validateInput(usernameRaw) || !validateInput(passwordRaw)) { showError('Input Tidak Valid', 'Karakter tidak diizinkan!'); return; }

  const username = sanitize(usernameRaw);
  const password = sanitize(passwordRaw);

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memvalidasi...';

  try {
    const db = await dbGet();

    // Maintenance check
    if (db.maintenance && db.maintenance.active) {
      showError('Maintenance', db.maintenance.reason || 'Website sedang maintenance.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      return;
    }

    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) {
      showError('Login Gagal', 'Username atau password salah!');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      return;
    }

    if (remember) { localStorage.setItem('dc_remember_user', username); }
    else { localStorage.removeItem('dc_remember_user'); }

    setSession(username);

    // Welcome screen
    btn.innerHTML = '<i class="fas fa-check"></i> Berhasil!';
    showWelcomeTransition(username);
  } catch (err) {
    showError('Error', 'Gagal menghubungi server. Coba lagi.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
  }
}

function showWelcomeTransition(username) {
  const ws = document.createElement('div');
  ws.id = 'welcome-screen';
  ws.innerHTML = `
    <img src="${LOGO_URL}" style="width:80px;height:80px;border-radius:50%;border:3px solid #8b00e0;box-shadow:0 0 30px rgba(139,0,224,0.6);object-fit:cover;animation:logoPulse 1s ease-in-out infinite;">
    <div class="welcome-text">Welcome, ${sanitize(username)}! 👋</div>
    <div style="font-size:0.9rem;color:#b39ddb;font-family:var(--font-mono)">Mengalihkan ke dashboard...</div>
  `;
  document.body.appendChild(ws);
  setTimeout(() => { window.location.href = 'home.html'; }, 2800);
}

// =========================================================
// ===== REGISTER.HTML =====
// =========================================================
async function initRegister() {
  initParticles('particles-canvas');
  initLoadingScreen(() => {
    document.getElementById('main-content').style.display = 'flex';
    initPasswordToggle();
    const form = document.getElementById('register-form');
    if (form) form.addEventListener('submit', handleRegister);
  });
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const usernameRaw = document.getElementById('reg-username').value;
  const passwordRaw = document.getElementById('reg-password').value;
  const confirmRaw = document.getElementById('reg-confirm').value;

  if (!usernameRaw || !passwordRaw || !confirmRaw) { showError('Input Kosong', 'Semua field wajib diisi!'); return; }
  if (!validateInput(usernameRaw) || !validateInput(passwordRaw)) { showError('Input Tidak Valid', 'Karakter tidak diizinkan!'); return; }
  if (passwordRaw.length < 6) { showError('Password Terlalu Pendek', 'Password minimal 6 karakter!'); return; }
  if (passwordRaw !== confirmRaw) { showError('Password Tidak Cocok', 'Konfirmasi password tidak sesuai!'); return; }
  if (usernameRaw.length < 3) { showError('Username Terlalu Pendek', 'Username minimal 3 karakter!'); return; }

  const username = sanitize(usernameRaw);
  const password = sanitize(passwordRaw);

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mendaftar...';

  try {
    const db = await dbGet();
    if (db.users.find(u => u.username === username)) {
      showError('Username Sudah Ada', 'Username ini sudah digunakan, pilih yang lain!');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
      return;
    }

    db.users.push({ username, password, credit: 0, usedPromos: [], createdAt: new Date().toISOString() });
    const ok = await dbSet(db);
    if (!ok) throw new Error('Save failed');

    Swal.fire({
      icon: 'success',
      title: 'Akun Berhasil Dibuat!',
      html: `<b style="color:#a855f7">${username}</b> telah terdaftar. Silahkan login sekarang!`,
      confirmButtonText: 'Login Sekarang'
    }).then(() => { window.location.href = 'index.html'; });

  } catch (err) {
    showError('Registrasi Gagal', 'Gagal menyimpan data. Coba lagi.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
  }
}

// =========================================================
// ===== HOME.HTML - USER DASHBOARD =====
// =========================================================
let homeDB = null;
let currentUsername = '';

async function initHome() {
  if (!requireAuth()) return;
  currentUsername = getSession();

  initParticles('particles-canvas');
  initLoadingScreen(async () => {
    document.getElementById('main-content').style.display = 'block';

    homeDB = await dbGet();

    // Maintenance check
    if (homeDB.maintenance && homeDB.maintenance.active) {
      showMaintenancePopup(homeDB.maintenance.reason);
      return;
    }

    // Update UI
    document.querySelectorAll('.username-display').forEach(el => el.textContent = currentUsername);

    // Credit
    updateUserCredit();

    // Running text
    setupRunningText();

    // Load products
    renderProducts();

    // FAQ
    initFAQ();

    // Popups
    setupNotifPopups();

    // Hamburger
    initHamburger();

    // Navbar items
    initNavItems();

    // Scroll fade
    initScrollFade();

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      Swal.fire({
        title: 'Logout?', text: 'Yakin ingin keluar?',
        icon: 'question', showCancelButton: true,
        confirmButtonText: 'Ya, Logout', cancelButtonText: 'Batal'
      }).then(r => { if (r.isConfirmed) { clearSession(); window.location.href = 'index.html'; } });
    });
  });
}

function updateUserCredit() {
  const user = homeDB.users.find(u => u.username === currentUsername);
  const credit = user ? user.credit : 0;
  document.querySelectorAll('.credit-display').forEach(el => el.textContent = 'Rp ' + credit.toLocaleString('id-ID'));
}

function setupRunningText() {
  const rt = homeDB.runningText;
  const wrap = document.getElementById('running-text-wrap');
  if (!wrap) return;
  if (rt && rt.active && rt.text) {
    const inner = wrap.querySelector('.running-text-inner');
    if (inner) {
      inner.innerHTML = `<span>📢 ${sanitize(rt.text)}</span><span>📢 ${sanitize(rt.text)}</span>`;
    }
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
  }
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const products = (homeDB.products || []).filter(p => p.active);
  if (products.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">Belum ada produk tersedia.</p>';
    return;
  }
  products.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.style.animationDelay = `${i * 0.1}s`;
    const imgHTML = p.image
      ? `<img src="${p.image}" class="product-img" onerror="this.outerHTML='<div class=\\'product-img-placeholder\\'><i class=\\'fas fa-gamepad\\'></i></div>'">`
      : `<div class="product-img-placeholder"><i class="fas fa-gamepad"></i></div>`;
    const features = (p.features || []).map(f => `<li><i class="fas fa-check-circle"></i>${sanitize(f)}</li>`).join('');
    card.innerHTML = `
      ${imgHTML}
      <div class="product-body">
        <div class="product-name">${sanitize(p.name)}</div>
        <div class="product-type">${sanitize(p.type)}</div>
        <ul class="product-features">${features}</ul>
      </div>
    `;
    card.addEventListener('click', () => openProductPopup(p));
    grid.appendChild(card);
  });
  initScrollFade();
}

function openProductPopup(product) {
  let selectedPlan = null;
  let qty = 1;
  let viewMode = 'fullkey';
  let promoApplied = null;
  let discountedPrice = 0;

  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';

  function getBasePrice() {
    if (!selectedPlan) return 0;
    return selectedPlan.price * qty;
  }

  function getFinalPrice() {
    if (!selectedPlan) return 0;
    if (promoApplied) {
      const disc = Math.floor(selectedPlan.price * (promoApplied.percent / 100));
      return Math.max(0, (selectedPlan.price - disc)) * qty;
    }
    return selectedPlan.price * qty;
  }

  function renderPriceList() {
    const plans = viewMode === 'fullkey' ? (product.fullkeyPlans || []) : (product.rentalPlans || []);
    return plans.map((pl, i) => `
      <div class="price-item ${selectedPlan && selectedPlan.label === pl.label ? 'selected' : ''}" data-idx="${i}">
        <span class="price-item-label">${sanitize(pl.label)}</span>
        <span class="price-item-value">Rp ${pl.price.toLocaleString('id-ID')}</span>
      </div>
    `).join('');
  }

  function render() {
    const finalP = getFinalPrice();
    const baseP = getBasePrice();
    overlay.innerHTML = `
      <div class="popup-card" style="max-width:520px">
        <div class="popup-header">
          <div class="popup-title"><i class="fas fa-shopping-bag"></i>${sanitize(product.name)}</div>
          <div class="popup-close" id="pp-close"><i class="fas fa-times"></i></div>
        </div>
        <div class="price-switcher">
          <button class="price-switch-btn ${viewMode === 'fullkey' ? 'active' : ''}" id="sw-full">Access Full Key</button>
          ${product.hasRental ? `<button class="price-switch-btn ${viewMode === 'rental' ? 'active' : ''}" id="sw-rental">Rental Keys</button>` : ''}
        </div>
        <div class="price-list" id="price-list">${renderPriceList()}</div>
        <div class="qty-row">
          <div class="qty-label">Quantity:</div>
          <div class="qty-controls">
            <div class="qty-btn" id="qty-minus">−</div>
            <div class="qty-num" id="qty-num">${qty}</div>
            <div class="qty-btn" id="qty-plus">+</div>
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label"><i class="fas fa-tag"></i> Kode Promo (Opsional)</label>
          <div style="display:flex;gap:8px">
            <input id="promo-input" class="form-control" placeholder="Masukkan kode promo..." style="flex:1;font-size:0.85rem;padding:10px 14px">
            <button id="apply-promo" class="btn-admin" style="padding:10px 16px;font-size:0.8rem"><i class="fas fa-check"></i> Pakai</button>
          </div>
          <div id="promo-msg" style="font-size:0.78rem;margin-top:6px;height:16px"></div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label"><i class="fab fa-whatsapp"></i> Nomor WhatsApp</label>
          <input id="wa-input" class="form-control" placeholder="Contoh: 08123456789" style="font-size:0.85rem;padding:10px 14px">
        </div>
        <div class="total-price-row">
          <span class="total-price-label">Total Harga:</span>
          <span class="total-price-value" id="total-display">
            ${promoApplied && finalP < baseP ? `<span style="text-decoration:line-through;color:var(--text-muted);font-size:0.85rem;margin-right:8px">Rp ${baseP.toLocaleString('id-ID')}</span>` : ''}
            Rp ${finalP.toLocaleString('id-ID')}
            ${promoApplied ? `<span style="color:#10b981;font-size:0.75rem;margin-left:6px">(-${promoApplied.percent}%)</span>` : ''}
          </span>
        </div>
        <button id="buy-now-btn" class="btn-primary" ${!selectedPlan ? 'disabled' : ''}>
          <i class="fas fa-bolt"></i> Buy Now
        </button>
      </div>
    `;

    overlay.querySelector('#pp-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#sw-full')?.addEventListener('click', () => { viewMode = 'fullkey'; selectedPlan = null; render(); });
    overlay.querySelector('#sw-rental')?.addEventListener('click', () => { viewMode = 'rental'; selectedPlan = null; render(); });

    overlay.querySelectorAll('.price-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.idx);
        const plans = viewMode === 'fullkey' ? product.fullkeyPlans : product.rentalPlans;
        selectedPlan = plans[idx];
        render();
      });
    });

    overlay.querySelector('#qty-minus').addEventListener('click', () => { if (qty > 1) { qty--; render(); } });
    overlay.querySelector('#qty-plus').addEventListener('click', () => { if (qty < 99) { qty++; render(); } });

    overlay.querySelector('#apply-promo').addEventListener('click', () => applyPromo());

    overlay.querySelector('#buy-now-btn').addEventListener('click', () => processBuy());

    // Keep promo text
    const promoInp = overlay.querySelector('#promo-input');
    if (promoApplied) promoInp.value = promoApplied.code;
  }

  async function applyPromo() {
    const code = sanitize(overlay.querySelector('#promo-input').value.trim().toUpperCase());
    const msgEl = overlay.querySelector('#promo-msg');
    if (!code) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'Masukkan kode promo terlebih dahulu!'; return; }

    msgEl.style.color = '#a855f7'; msgEl.textContent = 'Mengecek kode promo...';

    const db = await dbGet();
    const promo = (db.promoCodes || []).find(p => p.code === code);
    if (!promo) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'Kode promo tidak ditemukan!'; promoApplied = null; render(); return; }
    if (!promo.active) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'Kode promo tidak aktif!'; return; }

    const usageCount = promo.usedBy ? promo.usedBy.length : 0;
    if (usageCount >= promo.maxUsage) { msgEl.style.color = '#ef4444'; msgEl.textContent = `Kode promo sudah mencapai batas ${promo.maxUsage} pengguna!`; return; }

    const user = db.users.find(u => u.username === currentUsername);
    if (user && user.usedPromos && user.usedPromos.includes(code)) {
      msgEl.style.color = '#ef4444'; msgEl.textContent = 'Anda sudah pernah menggunakan promo ini!'; return;
    }

    promoApplied = { code, percent: promo.percent };
    msgEl.style.color = '#10b981'; msgEl.textContent = `✅ Promo aktif! Diskon ${promo.percent}%`;
    render();
  }

  async function processBuy() {
    if (!selectedPlan) { showError('Pilih Paket', 'Silahkan pilih paket terlebih dahulu!'); return; }
    const waInput = overlay.querySelector('#wa-input').value.trim();
    if (!waInput) { showError('WhatsApp Kosong', 'Masukkan nomor WhatsApp Anda!'); return; }

    const db = await dbGet();
    const user = db.users.find(u => u.username === currentUsername);
    if (!user) { showError('Error', 'Session expired, silahkan login ulang.'); clearSession(); window.location.href='index.html'; return; }

    const finalPrice = getFinalPrice();
    if (user.credit < finalPrice) {
      showError('Saldo Tidak Cukup', `Saldo Anda Rp ${user.credit.toLocaleString('id-ID')}, dibutuhkan Rp ${finalPrice.toLocaleString('id-ID')}. Hubungi admin untuk top up.`);
      return;
    }

    Swal.fire({
      title: 'Konfirmasi Pembelian',
      html: `<b>${sanitize(product.name)}</b><br>Paket: ${sanitize(selectedPlan.label)}<br>Qty: ${qty}<br>Total: <b style="color:#f59e0b">Rp ${finalPrice.toLocaleString('id-ID')}</b>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Beli Sekarang', cancelButtonText: 'Batal'
    }).then(async r => {
      if (!r.isConfirmed) return;

      // Deduct credit
      user.credit -= finalPrice;

      // Save promo usage
      if (promoApplied) {
        const promo = db.promoCodes.find(p => p.code === promoApplied.code);
        if (promo) {
          if (!promo.usedBy) promo.usedBy = [];
          promo.usedBy.push(currentUsername);
        }
        if (!user.usedPromos) user.usedPromos = [];
        user.usedPromos.push(promoApplied.code);
      }

      // Create transaction
      const trxId = 'TRX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      const trx = {
        id: trxId,
        username: currentUsername,
        productId: product.id,
        productName: product.name,
        plan: selectedPlan.label,
        planType: viewMode,
        qty,
        basePrice: getBasePrice(),
        finalPrice,
        promoCode: promoApplied ? promoApplied.code : null,
        waNumber: sanitize(waInput),
        status: 'waiting',
        keys: [],
        createdAt: new Date().toISOString()
      };
      if (!db.transactions) db.transactions = [];
      db.transactions.unshift(trx);

      await dbSet(db);
      homeDB = db;
      updateUserCredit();

      overlay.remove();
      showSuccess('Pembelian Berhasil!', `ID Transaksi: ${trxId}\nAdmin akan segera memproses pesanan Anda.`);
    });
  }

  render();
  document.body.appendChild(overlay);
}

function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!isOpen) item.classList.add('active');
    });
  });
}

function setupNotifPopups() {
  // Popup 1 - WA Channel
  if (homeDB.notifPopup1 && homeDB.notifPopup1.active) {
    showWAPopup();
  }
  // Popup 2 - Custom notification
  if (homeDB.notifPopup2 && homeDB.notifPopup2.active) {
    setTimeout(() => showCustomNotif(homeDB.notifPopup2), 1000);
  }
}

function showWAPopup() {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.innerHTML = `
    <div class="popup-card" style="max-width:400px;text-align:center">
      <div style="position:absolute;top:14px;right:14px" class="popup-close" id="wa-popup-close"><i class="fas fa-times"></i></div>
      <div class="welcome-popup-logo"><img src="${LOGO_URL}" alt="Drip Logo"></div>
      <div class="welcome-popup-name">Welcome! ${sanitize(currentUsername)}! 👋</div>
      <p class="welcome-popup-desc">Untuk mengetahui perkembangan harga atau mendapatkan update silahkan join saluran WhatsApp kami sekarang.</p>
      <a href="${WA_CHANNEL}" target="_blank" class="btn-wa"><i class="fab fa-whatsapp"></i> Join Now</a>
    </div>
  `;
  overlay.querySelector('#wa-popup-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function showCustomNotif(cfg) {
  const icons = { info: 'fa-info-circle', warning: 'fa-exclamation-triangle', attention: 'fa-bell' };
  const icon = icons[cfg.type] || 'fa-bell';
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.innerHTML = `
    <div class="popup-card" style="max-width:380px;text-align:center">
      <div style="position:absolute;top:14px;right:14px" class="popup-close" id="cnotif-close"><i class="fas fa-times"></i></div>
      <i class="fas ${icon}" style="font-size:3rem;color:var(--purple-300);margin-bottom:16px;display:block"></i>
      <p style="font-size:0.95rem;color:var(--text-secondary);line-height:1.6">${sanitize(cfg.text || '')}</p>
    </div>
  `;
  overlay.querySelector('#cnotif-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function showMaintenancePopup(reason) {
  document.getElementById('main-content').style.display = 'block';
  const overlay = document.createElement('div');
  overlay.className = 'maintenance-popup-overlay';
  overlay.innerHTML = `
    <div class="maintenance-popup">
      <span class="maintenance-icon">⚙️</span>
      <div class="maintenance-title">MAINTENANCE MODE</div>
      <p class="maintenance-desc">${sanitize(reason)}</p>
      <div style="margin-top:30px;font-size:0.8rem;color:var(--text-muted);font-family:var(--font-mono)">Silahkan coba lagi nanti...</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ===== HAMBURGER / NAVBAR =====
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('quick-nav');
  const overlay = document.getElementById('nav-overlay');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
    overlay?.classList.toggle('show');
  });

  overlay?.addEventListener('click', () => {
    nav.classList.remove('open');
    overlay.classList.remove('show');
  });
}

function initNavItems() {
  // Reset Key
  document.getElementById('nav-reset-key')?.addEventListener('click', () => {
    document.getElementById('quick-nav')?.classList.remove('open');
    document.getElementById('nav-overlay')?.classList.remove('show');
    openResetKeyPopup();
  });

  // Transaction Log
  document.getElementById('nav-trx-log')?.addEventListener('click', () => {
    document.getElementById('quick-nav')?.classList.remove('open');
    document.getElementById('nav-overlay')?.classList.remove('show');
    openTrxLogPopup();
  });

  // Home
  document.getElementById('nav-home')?.addEventListener('click', () => {
    document.getElementById('quick-nav')?.classList.remove('open');
    document.getElementById('nav-overlay')?.classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function openResetKeyPopup() {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.innerHTML = `
    <div class="popup-card" style="max-width:420px">
      <div class="popup-header">
        <div class="popup-title"><img src="${LOGO_URL}" style="width:28px;height:28px;border-radius:50%;border:1px solid #8b00e0"> Reset Key System</div>
        <div class="popup-close" id="rk-close"><i class="fas fa-times"></i></div>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">Masukkan Key / Token</label>
        <input id="rk-input" class="form-control" placeholder="Contoh: 8279290197">
      </div>
      <button id="rk-btn" class="btn-primary"><i class="fas fa-sync-alt"></i> Reset</button>
      <div class="terminal-output" id="rk-terminal" style="display:none"></div>
    </div>
  `;
  overlay.querySelector('#rk-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#rk-btn').addEventListener('click', () => processResetKey(overlay));
  document.body.appendChild(overlay);
}

async function processResetKey(overlay) {
  const keyVal = sanitize(overlay.querySelector('#rk-input').value.trim());
  if (!keyVal) { showError('Input Kosong', 'Masukkan key terlebih dahulu!'); return; }

  const btn = overlay.querySelector('#rk-btn');
  const terminal = overlay.querySelector('#rk-terminal');
  terminal.style.display = 'block';
  terminal.innerHTML = '';
  btn.disabled = true;

  const db = await dbGet();

  function addLine(text, type = 'info', delay = 0) {
    setTimeout(() => {
      const line = document.createElement('span');
      line.className = `terminal-line ${type}`;
      line.textContent = `> ${text}`;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;
    }, delay);
  }

  if (!db.resetKeyStatus) {
    addLine('Menghubungi server...', 'info', 0);
    addLine('Mengecek status sistem...', 'info', 400);
    addLine('ERROR: Fitur reset sedang dinonaktifkan oleh admin.', 'error', 800);
    addLine('Silahkan coba lagi nanti.', 'warning', 1200);
    btn.disabled = false;
    return;
  }

  // Daily reset check
  const today = new Date().toISOString().split('T')[0];
  if (!db.dailyResets) db.dailyResets = {};
  const userResets = db.dailyResets[currentUsername] || {};
  const todayCount = userResets[today] || 0;

  addLine('Connecting to server...', 'info', 0);
  addLine('Validating token: ' + keyVal.substring(0, 4) + '****', 'info', 400);
  addLine('Fetching server response...', 'info', 800);

  if (todayCount >= 2) {
    setTimeout(() => {
      addLine('ERROR: Batas reset harian tercapai (2x/hari).', 'error', 0);
      const nextReset = new Date(); nextReset.setDate(nextReset.getDate() + 1); nextReset.setHours(0, 0, 0, 0);
      addLine(`Next reset: ${nextReset.toLocaleString('id-ID')}`, 'warning', 300);
      btn.disabled = false;
    }, 1200);
    return;
  }

  setTimeout(async () => {
    // Count reset
    if (!userResets[today]) userResets[today] = 0;
    userResets[today]++;
    db.dailyResets[currentUsername] = userResets;
    await dbSet(db);

    const usedCount = userResets[today];
    const nextReset = new Date(); nextReset.setDate(nextReset.getDate() + 1); nextReset.setHours(0, 0, 0, 0);
    const nextResetStr = nextReset.toISOString().replace('T', ' ').substring(0, 19);

    addLine('Connection established!', 'success', 0);
    addLine('Processing device reset...', 'info', 300);
    addLine('Revoking old session...', 'info', 600);
    addLine('Generating new device binding...', 'info', 900);
    addLine('', 'info', 1200);
    addLine('✅ Reset Successful', 'success', 1300);
    addLine('', 'info', 1400);
    addLine('Status: 200', 'success', 1500);
    addLine(`Response: {"success":true,"message":"Token reset successfully","resetsused":${usedCount},"resetsmax":2,"nextresettime":"${nextResetStr}"}`, 'success', 1600);
    btn.disabled = false;
  }, 1200);
}

function openTrxLogPopup() {
  const userTrx = (homeDB.transactions || []).filter(t => t.username === currentUsername);
  const trxHTML = userTrx.length === 0
    ? '<p style="text-align:center;color:var(--text-muted);padding:30px">Belum ada transaksi.</p>'
    : userTrx.map(t => `
      <div class="trx-item" data-id="${t.id}">
        <div class="trx-header">
          <div class="trx-name">${sanitize(t.productName)}</div>
          <span class="status-badge status-${t.status}">${t.status === 'waiting' ? 'Menunggu' : t.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span>
        </div>
        <div class="trx-id">ID: ${t.id}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:6px">${new Date(t.createdAt).toLocaleString('id-ID')}</div>
      </div>
    `).join('');

  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.innerHTML = `
    <div class="popup-card" style="max-width:480px">
      <div class="popup-header">
        <div class="popup-title"><i class="fas fa-receipt"></i> Logs Transaksi</div>
        <div class="popup-close" id="trx-close"><i class="fas fa-times"></i></div>
      </div>
      <div style="max-height:65vh;overflow-y:auto">${trxHTML}</div>
    </div>
  `;
  overlay.querySelector('#trx-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // Click trx for detail
  overlay.querySelectorAll('.trx-item').forEach(item => {
    item.addEventListener('click', () => {
      const trx = userTrx.find(t => t.id === item.dataset.id);
      if (trx) showTrxDetail(trx);
    });
  });
  document.body.appendChild(overlay);
}

function showTrxDetail(trx) {
  const keysHTML = trx.keys && trx.keys.length > 0
    ? trx.keys.map(k => `<div style="font-family:var(--font-mono);font-size:0.85rem;background:rgba(139,0,224,0.1);border:1px solid var(--border-purple);padding:8px 12px;border-radius:8px;color:#a855f7;word-break:break-all">${sanitize(k)}</div>`).join('')
    : trx.status === 'approved' ? '<p style="color:var(--text-muted);font-size:0.85rem">Key akan segera dikirim.</p>' : '<p style="color:var(--text-muted);font-size:0.85rem">Menunggu admin memproses.</p>';

  Swal.fire({
    title: `<span style="font-family:var(--font-display);font-size:1rem">${sanitize(trx.productName)}</span>`,
    html: `
      <div style="text-align:left;font-family:var(--font-body)">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(139,0,224,0.2)"><span style="color:#7c6a94">Paket</span><b>${sanitize(trx.plan)} (${trx.planType})</b></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(139,0,224,0.2)"><span style="color:#7c6a94">Qty</span><b>${trx.qty}</b></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(139,0,224,0.2)"><span style="color:#7c6a94">ID Transaksi</span><b style="font-size:0.75rem">${trx.id}</b></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(139,0,224,0.2)"><span style="color:#7c6a94">Tanggal</span><b style="font-size:0.78rem">${new Date(trx.createdAt).toLocaleString('id-ID')}</b></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(139,0,224,0.2)"><span style="color:#7c6a94">Total</span><b style="color:#f59e0b">Rp ${trx.finalPrice.toLocaleString('id-ID')}</b></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(139,0,224,0.2)"><span style="color:#7c6a94">Status</span>
          <b style="color:${trx.status==='approved'?'#10b981':trx.status==='rejected'?'#ef4444':'#f59e0b'}">${trx.status==='approved'?'✅ Disetujui':trx.status==='rejected'?'❌ Ditolak':'⏳ Menunggu'}</b>
        </div>
        ${trx.status === 'approved' ? `<div style="padding-top:12px"><div style="color:#7c6a94;margin-bottom:8px;font-weight:600">Keys:</div>${keysHTML}</div>` : ''}
      </div>
    `,
    confirmButtonText: 'Tutup'
  });
}

// =========================================================
// ===== ADMIN.HTML =====
// =========================================================
let adminDB = null;

async function initAdmin() {
  initParticles('particles-canvas');
  initLoadingScreen(async () => {
    document.getElementById('main-content').style.display = 'flex';
    adminDB = await dbGet();

    renderAdminStats();
    renderAdminProducts();
    renderAdminPromos();
    renderAdminTransactions();
    loadAdminSettings();

    initAdminSidebar();
    initAdminForms();

    // Reset today sales counter
    checkDailySalesReset();
  });
}

function checkDailySalesReset() {
  const today = new Date().toISOString().split('T')[0];
  if (adminDB.stats && adminDB.stats.lastResetDate !== today) {
    adminDB.stats.lastResetDate = today;
    adminDB.stats.todaySales = 0;
    dbSet(adminDB);
  }
}

function renderAdminStats() {
  const st = adminDB.stats || {};
  document.getElementById('stat-total-buyers').textContent = st.totalBuyers || 0;
  document.getElementById('stat-revenue').textContent = 'Rp ' + (st.totalRevenue || 0).toLocaleString('id-ID');
  document.getElementById('stat-today').textContent = st.todaySales || 0;
  document.getElementById('stat-users').textContent = (adminDB.users || []).length;
}

function renderAdminProducts() {
  const list = document.getElementById('admin-product-list');
  if (!list) return;
  const products = adminDB.products || [];
  if (products.length === 0) { list.innerHTML = '<p style="color:var(--text-muted)">Belum ada produk.</p>'; return; }
  list.innerHTML = products.map(p => `
    <div class="product-admin-item">
      <img src="${p.image || LOGO_URL}" class="product-admin-thumb" onerror="this.src='${LOGO_URL}'">
      <div class="product-admin-info">
        <div class="product-admin-name">${sanitize(p.name)}</div>
        <div class="product-admin-type">${sanitize(p.type)} · ${p.active ? '🟢 Aktif' : '🔴 Nonaktif'}</div>
      </div>
      <div class="product-admin-actions">
        <button class="btn-icon edit" onclick="adminEditProduct('${p.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" onclick="adminDeleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function renderAdminPromos() {
  const list = document.getElementById('admin-promo-list');
  if (!list) return;
  const promos = adminDB.promoCodes || [];
  if (promos.length === 0) { list.innerHTML = '<p style="color:var(--text-muted)">Belum ada kode promo.</p>'; return; }
  list.innerHTML = promos.map((p, i) => `
    <div class="promo-item">
      <div>
        <div class="promo-code">${sanitize(p.code)}</div>
        <div class="promo-info">Diskon ${p.percent}% · Max ${p.maxUsage} · Dipakai ${(p.usedBy||[]).length}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="status-badge ${p.active ? 'status-approved' : 'status-rejected'}">${p.active ? 'Aktif' : 'Nonaktif'}</span>
        <button class="btn-icon delete" onclick="adminDeletePromo(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function renderAdminTransactions() {
  const tbody = document.getElementById('admin-trx-tbody');
  if (!tbody) return;
  const trxs = adminDB.transactions || [];
  if (trxs.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">Belum ada transaksi.</td></tr>'; return; }
  tbody.innerHTML = trxs.map(t => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:0.72rem">${t.id}</td>
      <td>${sanitize(t.username)}</td>
      <td>${sanitize(t.productName)}</td>
      <td>${sanitize(t.plan)}</td>
      <td style="color:#f59e0b;font-weight:700">Rp ${t.finalPrice.toLocaleString('id-ID')}</td>
      <td><span class="status-badge status-${t.status}">${t.status==='waiting'?'Menunggu':t.status==='approved'?'Approved':'Rejected'}</span></td>
      <td>
        ${t.status === 'waiting' ? `
          <button class="btn-icon edit" onclick="adminApproveTrx('${t.id}')" title="Approve"><i class="fas fa-check"></i></button>
          <button class="btn-icon delete" onclick="adminRejectTrx('${t.id}')" title="Reject"><i class="fas fa-times"></i></button>
        ` : `<span style="color:var(--text-muted);font-size:0.78rem">${t.status}</span>`}
      </td>
    </tr>
  `).join('');
}

async function adminApproveTrx(trxId) {
  const trx = adminDB.transactions.find(t => t.id === trxId);
  if (!trx) return;

  const { value: keysInput } = await Swal.fire({
    title: 'Kirim Key ke User',
    html: `
      <p style="color:#b39ddb;margin-bottom:12px">Transaksi: <b>${trx.id}</b><br>User: <b>${sanitize(trx.username)}</b></p>
      <textarea id="swal-keys" class="swal2-textarea" placeholder="Masukkan key, pisahkan dengan baris baru..." style="font-family:var(--font-mono);font-size:0.85rem;background:rgba(13,0,21,0.8);border:1px solid rgba(139,0,224,0.4);color:#f0e6ff;min-height:120px"></textarea>
    `,
    confirmButtonText: 'Approve & Kirim Key',
    cancelButtonText: 'Batal',
    showCancelButton: true,
    preConfirm: () => document.getElementById('swal-keys').value
  });

  if (!keysInput) return;
  const keys = keysInput.split('\n').map(k => sanitize(k.trim())).filter(Boolean);

  trx.status = 'approved';
  trx.keys = keys;

  // Update stats
  if (!adminDB.stats) adminDB.stats = {};
  adminDB.stats.totalBuyers = (adminDB.stats.totalBuyers || 0) + 1;
  adminDB.stats.totalRevenue = (adminDB.stats.totalRevenue || 0) + trx.finalPrice;
  adminDB.stats.todaySales = (adminDB.stats.todaySales || 0) + 1;

  await dbSet(adminDB);
  renderAdminTransactions();
  renderAdminStats();
  showSuccess('Approved!', `Key berhasil dikirim ke ${sanitize(trx.username)}`);
}

async function adminRejectTrx(trxId) {
  const trx = adminDB.transactions.find(t => t.id === trxId);
  if (!trx) return;

  Swal.fire({
    title: 'Tolak Transaksi?',
    text: `Yakin menolak transaksi ${trxId}? Saldo user akan dikembalikan.`,
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, Tolak', cancelButtonText: 'Batal'
  }).then(async r => {
    if (!r.isConfirmed) return;
    trx.status = 'rejected';

    // Refund
    const user = adminDB.users.find(u => u.username === trx.username);
    if (user) user.credit = (user.credit || 0) + trx.finalPrice;

    await dbSet(adminDB);
    renderAdminTransactions();
    showSuccess('Ditolak', 'Transaksi ditolak dan saldo dikembalikan.');
  });
}

async function adminDeleteProduct(productId) {
  Swal.fire({
    title: 'Hapus Produk?', icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Hapus', cancelButtonText: 'Batal'
  }).then(async r => {
    if (!r.isConfirmed) return;
    adminDB.products = adminDB.products.filter(p => p.id !== productId);
    await dbSet(adminDB);
    renderAdminProducts();
    showSuccess('Dihapus', 'Produk berhasil dihapus.');
  });
}

function adminEditProduct(productId) {
  const p = adminDB.products.find(pr => pr.id === productId);
  if (!p) return;
  showAdminPanel('panel-product');
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-type').value = p.type;
  document.getElementById('prod-image').value = p.image || '';
  document.getElementById('prod-desc').value = p.description || '';
  document.getElementById('prod-features').value = (p.features || []).join('\n');
  document.getElementById('prod-has-rental').checked = !!p.hasRental;

  // Fill plans
  const fillPlans = (plans, prefix) => {
    (plans || []).forEach((pl, i) => {
      const li = document.getElementById(`${prefix}-label-${i+1}`);
      const pi = document.getElementById(`${prefix}-price-${i+1}`);
      if (li) li.value = pl.label;
      if (pi) pi.value = pl.price;
    });
  };
  fillPlans(p.fullkeyPlans, 'fk');
  fillPlans(p.rentalPlans, 'rk');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function adminDeletePromo(index) {
  Swal.fire({
    title: 'Hapus Promo?', icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Hapus', cancelButtonText: 'Batal'
  }).then(async r => {
    if (!r.isConfirmed) return;
    adminDB.promoCodes.splice(index, 1);
    await dbSet(adminDB);
    renderAdminPromos();
    showSuccess('Dihapus', 'Kode promo dihapus.');
  });
}

function loadAdminSettings() {
  const rt = adminDB.runningText || {};
  const el = document.getElementById('rt-toggle');
  if (el) el.checked = !!rt.active;
  const rtText = document.getElementById('rt-text');
  if (rtText) rtText.value = rt.text || '';

  const n1 = document.getElementById('notif1-toggle');
  if (n1) n1.checked = !!(adminDB.notifPopup1 && adminDB.notifPopup1.active);

  const n2 = document.getElementById('notif2-toggle');
  if (n2) n2.checked = !!(adminDB.notifPopup2 && adminDB.notifPopup2.active);
  const n2text = document.getElementById('notif2-text');
  if (n2text) n2text.value = adminDB.notifPopup2?.text || '';
  const n2type = document.getElementById('notif2-type');
  if (n2type) n2type.value = adminDB.notifPopup2?.type || 'info';

  const rks = document.getElementById('reset-key-toggle');
  if (rks) rks.checked = !!adminDB.resetKeyStatus;

  const mt = document.getElementById('maintenance-toggle');
  if (mt) mt.checked = !!(adminDB.maintenance && adminDB.maintenance.active);
  const mr = document.getElementById('maintenance-reason');
  if (mr) mr.value = adminDB.maintenance?.reason || '';
}

function initAdminForms() {
  // Add Product
  document.getElementById('add-product-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    const id = document.getElementById('prod-id').value || ('prod_' + Date.now());
    const name = sanitize(document.getElementById('prod-name').value);
    const type = sanitize(document.getElementById('prod-type').value);
    const image = sanitize(document.getElementById('prod-image').value);
    const desc = sanitize(document.getElementById('prod-desc').value);
    const features = document.getElementById('prod-features').value.split('\n').map(f => sanitize(f.trim())).filter(Boolean);
    const hasRental = document.getElementById('prod-has-rental').checked;

    const fullkeyPlans = [];
    const rentalPlans = [];
    for (let i = 1; i <= 5; i++) {
      const l = document.getElementById(`fk-label-${i}`)?.value;
      const p = document.getElementById(`fk-price-${i}`)?.value;
      if (l && p) fullkeyPlans.push({ label: sanitize(l), price: parseInt(p) });
    }
    for (let i = 1; i <= 5; i++) {
      const l = document.getElementById(`rk-label-${i}`)?.value;
      const p = document.getElementById(`rk-price-${i}`)?.value;
      if (l && p) rentalPlans.push({ label: sanitize(l), price: parseInt(p) });
    }

    const existIdx = adminDB.products.findIndex(p => p.id === id);
    const product = { id, name, type, image, description: desc, features, fullkeyPlans, rentalPlans, hasRental, active: true };

    if (existIdx >= 0) adminDB.products[existIdx] = product;
    else adminDB.products.push(product);

    const ok = await dbSet(adminDB);
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Simpan Produk';
    if (ok) { renderAdminProducts(); showSuccess('Berhasil!', existIdx >= 0 ? 'Produk diperbarui.' : 'Produk ditambahkan.'); e.target.reset(); document.getElementById('prod-id').value = ''; }
    else showError('Gagal', 'Gagal menyimpan ke database.');
  });

  // Add Promo
  document.getElementById('add-promo-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const code = sanitize(document.getElementById('promo-code').value.trim().toUpperCase());
    const percent = parseInt(document.getElementById('promo-percent').value);
    const maxUsage = parseInt(document.getElementById('promo-max').value);
    if (!code || !percent || !maxUsage || percent > 100 || percent < 1) { showError('Input Tidak Valid', 'Periksa semua field.'); btn.disabled = false; return; }
    if ((adminDB.promoCodes || []).find(p => p.code === code)) { showError('Kode Sudah Ada', 'Kode promo ini sudah ada.'); btn.disabled = false; return; }
    if (!adminDB.promoCodes) adminDB.promoCodes = [];
    adminDB.promoCodes.push({ code, percent, maxUsage, usedBy: [], active: true, createdAt: new Date().toISOString() });
    const ok = await dbSet(adminDB);
    btn.disabled = false;
    if (ok) { renderAdminPromos(); showSuccess('Berhasil!', `Kode promo ${code} ditambahkan.`); e.target.reset(); }
    else showError('Gagal', 'Gagal menyimpan.');
  });

  // Running Text
  document.getElementById('save-rt-btn')?.addEventListener('click', async () => {
    const text = sanitize(document.getElementById('rt-text').value);
    const active = document.getElementById('rt-toggle').checked;
    adminDB.runningText = { text, active };
    const ok = await dbSet(adminDB);
    ok ? showSuccess('Disimpan!', 'Running text diperbarui.') : showError('Gagal', 'Gagal menyimpan.');
  });

  // Add Credit
  document.getElementById('add-credit-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const uname = sanitize(document.getElementById('credit-username').value.trim());
    const amount = parseInt(document.getElementById('credit-amount').value);
    if (!uname || !amount || amount < 1) { showError('Input Tidak Valid', 'Periksa semua field.'); btn.disabled = false; return; }
    const db = await dbGet();
    const user = db.users.find(u => u.username === uname);
    if (!user) { showError('User Tidak Ditemukan', `Username "${uname}" tidak ada di database.`); btn.disabled = false; return; }
    user.credit = (user.credit || 0) + amount;
    const ok = await dbSet(db);
    adminDB = db;
    btn.disabled = false;
    if (ok) { showSuccess('Berhasil!', `Rp ${amount.toLocaleString('id-ID')} dikirim ke ${uname}. Saldo baru: Rp ${user.credit.toLocaleString('id-ID')}`); e.target.reset(); }
    else showError('Gagal', 'Gagal menyimpan.');
  });

  // Settings saves
  document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
    adminDB.resetKeyStatus = document.getElementById('reset-key-toggle').checked;
    adminDB.maintenance = {
      active: document.getElementById('maintenance-toggle').checked,
      reason: sanitize(document.getElementById('maintenance-reason').value)
    };
    adminDB.notifPopup1 = { active: document.getElementById('notif1-toggle').checked };
    adminDB.notifPopup2 = {
      active: document.getElementById('notif2-toggle').checked,
      type: document.getElementById('notif2-type').value,
      text: sanitize(document.getElementById('notif2-text').value)
    };
    const ok = await dbSet(adminDB);
    ok ? showSuccess('Disimpan!', 'Pengaturan berhasil disimpan.') : showError('Gagal', 'Gagal menyimpan.');
  });
}

function initAdminSidebar() {
  // Mobile toggle
  const mobileBtn = document.getElementById('admin-mobile-menu');
  const sidebar = document.querySelector('.admin-sidebar');
  mobileBtn?.addEventListener('click', () => sidebar?.classList.toggle('open'));

  // Nav items
  document.querySelectorAll('.sidebar-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.dataset.panel;
      document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      showAdminPanel(panel);
      sidebar?.classList.remove('open');
      document.getElementById('admin-topbar-title').textContent = item.querySelector('.nav-item-text')?.textContent || 'Dashboard';
    });
  });
}

function showAdminPanel(panelId) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId)?.classList.add('active');
}

// ===== EXPORT for HTML calls =====
window.initLogin = initLogin;
window.initRegister = initRegister;
window.initHome = initHome;
window.initAdmin = initAdmin;
window.adminEditProduct = adminEditProduct;
window.adminDeleteProduct = adminDeleteProduct;
window.adminApproveTrx = adminApproveTrx;
window.adminRejectTrx = adminRejectTrx;
window.adminDeletePromo = adminDeletePromo;
window.showAdminPanel = showAdminPanel;