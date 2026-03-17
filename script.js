/* ============================================
   DRIP CLIENT - MAIN SCRIPT
   All Functions & Features
   ============================================ */

// ============ JSONBIN CONFIG ============
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';
const JSONBIN_KEY = '$2a$10$Y.jqtzCgEfTCuODvJNV08ex.6qQW0V5p2WF6UUqlhg.fYT4W.4Gu6';

// BIN IDs - Create these bins on jsonbin.io
const BINS = {
  users: '69b8b5b1aa77b81da9ef4ccf',
  products: '69b8b5d3aa77b81da9ef4d4b',
  transactions: '69b8b5e8b7ec241ddc75790a',
  settings: '69b8b61ab7ec241ddc7579ad',
  promoCodes: '69b8b638aa77b81da9ef4ec0'
};

const HEADERS = {
  'Content-Type': 'application/json',
  'X-Master-Key': JSONBIN_KEY,
  'X-Bin-Meta': 'false'
};

// ============ JSONBIN HELPERS ============
async function readBin(binId) {
  try {
    const res = await fetch(`${JSONBIN_BASE}/${binId}/latest`, {
      method: 'GET',
      headers: { 'X-Master-Key': JSONBIN_KEY, 'X-Bin-Meta': 'false' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('ReadBin error:', e);
    return null;
  }
}

async function writeBin(binId, data) {
  try {
    const res = await fetch(`${JSONBIN_BASE}/${binId}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('WriteBin error:', e);
    return null;
  }
}

// ============ SECURITY HELPERS ============
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function validatePassword(password) {
  return password.length >= 6 && password.length <= 50;
}

function hashPassword(password) {
  // Simple hash for demo - in production use bcrypt on server
  let hash = 0;
  const salt = 'DRIPCLIENT_SALT_2024';
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + str.length.toString(36);
}

function generateTxId() {
  return 'TRX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ============ SESSION MANAGEMENT ============
function setSession(user) {
  const sessionData = {
    username: user.username,
    id: user.id,
    credit: user.credit || 0,
    timestamp: Date.now()
  };
  sessionStorage.setItem('drip_session', JSON.stringify(sessionData));
  // Also handle remember me
  if (document.getElementById('remember-me') && document.getElementById('remember-me').checked) {
    localStorage.setItem('drip_remember', JSON.stringify(sessionData));
  }
}

function getSession() {
  let session = sessionStorage.getItem('drip_session');
  if (!session) session = localStorage.getItem('drip_remember');
  if (!session) return null;
  try {
    const data = JSON.parse(session);
    // Session expires after 7 days
    if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
      clearSession();
      return null;
    }
    return data;
  } catch { return null; }
}

function clearSession() {
  sessionStorage.removeItem('drip_session');
  localStorage.removeItem('drip_remember');
}

function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

// ============ NOTIFY SYSTEM ============
function notify(type, title, msg, duration = 4000) {
  let container = document.getElementById('notify-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notify-container';
    container.className = 'custom-notify';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const item = document.createElement('div');
  item.className = `notify-item ${type}`;
  item.innerHTML = `
    <span class="notify-icon">${icons[type] || 'ℹ️'}</span>
    <div class="notify-body">
      <div class="notify-title">${sanitizeInput(title)}</div>
      <div class="notify-msg">${sanitizeInput(msg)}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#999;cursor:pointer;font-size:16px;padding:0;margin-left:8px;">✕</button>
  `;
  container.appendChild(item);

  setTimeout(() => {
    item.classList.add('notify-exit');
    setTimeout(() => item.remove(), 300);
  }, duration);
}

// ============ LOADING SCREEN ============
function initLoadingScreen(callback, duration = 3000) {
  const screen = document.getElementById('loading-screen');
  if (!screen) { if (callback) callback(); return; }

  setTimeout(() => {
    screen.classList.add('loading-screen-exit');
    setTimeout(() => {
      screen.style.display = 'none';
      if (callback) callback();
    }, 800);
  }, duration);
}

// ============ PARTICLE BACKGROUND ============
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = Math.min(120, Math.floor(window.innerWidth / 12));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.6 + 0.2,
      hue: Math.floor(Math.random() * 60) + 260 // purple range
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
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(107, 0, 168, ${(1 - dist / 120) * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach(p => {
      ctx.beginPath();
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.alpha})`);
      grad.addColorStop(1, `hsla(${p.hue}, 100%, 70%, 0)`);
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });

    requestAnimationFrame(draw);
  }

  draw();
}

// ============ SCROLL ANIMATIONS ============
function initScrollReveal() {
  const els = document.querySelectorAll('.scroll-reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

// ============ HAMBURGER NAVBAR ============
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('quick-nav');
  const overlay = document.getElementById('nav-overlay');
  if (!btn || !nav) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    nav.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      nav.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
}

// ============ PASSWORD TOGGLE ============
function initPasswordToggles() {
  document.querySelectorAll('[data-toggle-pw]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-toggle-pw');
      const input = document.getElementById(targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
  });
}

// ============ FAQ ACCORDION ============
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ============ LOGIN PAGE ============
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const username = sanitizeInput(document.getElementById('login-username').value.trim());
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    notify('warning', 'Input Kosong', 'Username dan password wajib diisi');
    return;
  }

  if (!validateUsername(username)) {
    notify('error', 'Username Tidak Valid', 'Username hanya boleh huruf, angka, underscore (3-20 karakter)');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memvalidasi...';

  try {
    const data = await readBin(BINS.users);
    const users = data?.users || [];
    const hashed = hashPassword(password);
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === hashed);

    if (!user) {
      notify('error', 'Login Gagal', 'Username atau password salah');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
      return;
    }

    // Success - show welcome animation
    setSession(user);
    btn.innerHTML = '<i class="fas fa-check"></i> Berhasil!';

    // Show welcome overlay
    const wOverlay = document.createElement('div');
    wOverlay.className = 'welcome-anim-overlay';
    wOverlay.innerHTML = `
      <div class="welcome-particles-ring"></div>
      <div class="welcome-anim-text">
        Welcome Back!
        <span class="name-glow">${sanitizeInput(user.username)}!</span>
      </div>
      <div style="font-family:var(--font-body);font-size:14px;color:var(--purple-200);letter-spacing:3px;">REDIRECTING...</div>
    `;
    document.body.appendChild(wOverlay);

    setTimeout(() => {
      window.location.href = 'home.html';
    }, 3000);

  } catch (err) {
    notify('error', 'Error Server', 'Gagal terhubung ke database. Coba lagi.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
  }
}

// ============ REGISTER PAGE ============
async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const username = sanitizeInput(document.getElementById('reg-username').value.trim());
  const password = document.getElementById('reg-password').value;
  const confirmPw = document.getElementById('reg-confirm').value;

  if (!username || !password || !confirmPw) {
    notify('warning', 'Input Kosong', 'Semua field wajib diisi');
    return;
  }

  if (!validateUsername(username)) {
    notify('error', 'Username Tidak Valid', 'Username: 3-20 karakter, hanya huruf/angka/underscore');
    return;
  }

  if (!validatePassword(password)) {
    notify('error', 'Password Terlalu Pendek', 'Password minimal 6 karakter');
    return;
  }

  if (password !== confirmPw) {
    notify('error', 'Password Tidak Cocok', 'Konfirmasi password tidak sesuai');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membuat Akun...';

  try {
    const data = await readBin(BINS.users);
    const users = data?.users || [];

    const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      notify('error', 'Username Sudah Dipakai', 'Coba gunakan username lain');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
      return;
    }

    const newUser = {
      id: 'USR_' + Date.now(),
      username: username,
      password: hashPassword(password),
      credit: 0,
      usedPromos: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    const result = await writeBin(BINS.users, { users });

    if (!result) throw new Error('Write failed');

    notify('success', 'Akun Berhasil Dibuat!', `Selamat ${username}! Silakan login sekarang.`);
    btn.innerHTML = '<i class="fas fa-check"></i> Berhasil!';

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);

  } catch (err) {
    notify('error', 'Error Server', 'Gagal membuat akun. Coba lagi.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
  }
}

// ============ HOME PAGE ============
let homeData = { settings: null, products: [], transactions: [], currentUser: null };
let selectedProduct = null;
let selectedPlan = null;
let selectedPrice = 0;
let selectedPlanType = 'full';
let quantity = 1;

async function initHome() {
  const session = requireAuth();
  if (!session) return;
  homeData.currentUser = session;

  // Update header
  updateHeaderUser(session);

  // Load all data in parallel
  const [settingsData, productsData, txData, usersData] = await Promise.all([
    readBin(BINS.settings),
    readBin(BINS.products),
    readBin(BINS.transactions),
    readBin(BINS.users)
  ]);

  homeData.settings = settingsData || getDefaultSettings();
  homeData.products = productsData?.products || [];
  homeData.transactions = txData?.transactions || [];

  // Get fresh credit from users bin
  const users = usersData?.users || [];
  const freshUser = users.find(u => u.id === session.id);
  if (freshUser) {
    homeData.currentUser.credit = freshUser.credit || 0;
    updateCreditDisplay(freshUser.credit || 0);
    // Update session
    const s = JSON.parse(sessionStorage.getItem('drip_session') || localStorage.getItem('drip_remember') || '{}');
    s.credit = freshUser.credit || 0;
    sessionStorage.setItem('drip_session', JSON.stringify(s));
  }

  // Check maintenance
  if (homeData.settings.maintenance?.enabled) {
    showMaintenance(homeData.settings.maintenance.reason);
    return;
  }

  // Running text
  if (homeData.settings.runningText?.enabled && homeData.settings.runningText?.text) {
    showRunningText(homeData.settings.runningText.text);
  }

  // Welcome popup
  if (homeData.settings.welcomePopup?.enabled !== false) {
    setTimeout(() => showWelcomePopup(session.username), 800);
  }

  // Custom notification
  if (homeData.settings.customNotif?.enabled && homeData.settings.customNotif?.text) {
    setTimeout(() => showCustomNotif(homeData.settings.customNotif), 1500);
  }

  // Render products
  renderProducts(homeData.products);

  // Render transactions
  renderTransactions(homeData.transactions.filter(t => t.userId === session.id));

  // Init scroll
  initScrollReveal();
  initFAQ();
}

function updateHeaderUser(session) {
  const nameEl = document.getElementById('header-username');
  const creditEl = document.getElementById('header-credit');
  if (nameEl) nameEl.textContent = session.username;
  if (creditEl) creditEl.textContent = formatCurrency(session.credit || 0);
}

function updateCreditDisplay(amount) {
  const el = document.getElementById('header-credit');
  if (el) el.textContent = formatCurrency(amount);
}

function formatCurrency(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'Jt';
  if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
  return 'Rp' + amount.toLocaleString('id-ID');
}

function showMaintenance(reason) {
  const overlay = document.getElementById('maintenance-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  const reasonEl = document.getElementById('maintenance-reason');
  if (reasonEl) reasonEl.textContent = reason || 'Website sedang dalam perbaikan. Silakan coba beberapa saat lagi.';
}

function showRunningText(text) {
  const bar = document.getElementById('running-text-bar');
  if (!bar) return;
  bar.style.display = 'block';
  const wrap = document.getElementById('running-text-wrap');
  if (wrap) {
    const content = `<span class="running-text-item"><span class="dot-sep"></span>${sanitizeInput(text)}<span class="dot-sep"></span>${sanitizeInput(text)}<span class="dot-sep"></span>${sanitizeInput(text)}</span>`;
    wrap.innerHTML = content + content; // duplicate for seamless loop
  }
}

function showWelcomePopup(username) {
  const overlay = document.getElementById('welcome-popup');
  if (!overlay) return;
  const nameEl = document.getElementById('welcome-username');
  if (nameEl) nameEl.textContent = username;
  overlay.classList.remove('hidden');
}

function showCustomNotif(notif) {
  const overlay = document.getElementById('custom-notif-popup');
  if (!overlay) return;
  const iconEl = document.getElementById('custom-notif-icon');
  const textEl = document.getElementById('custom-notif-text');
  if (iconEl) iconEl.className = `fas fa-${notif.icon || 'bell'}`;
  if (textEl) textEl.textContent = notif.text;
  overlay.classList.remove('hidden');
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = '<div style="color:var(--gray-400);text-align:center;padding:40px;grid-column:1/-1;font-family:var(--font-body)">Belum ada produk tersedia.</div>';
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card scroll-reveal" onclick="openProductDetail('${p.id}')">
      <div class="product-img-wrap">
        ${p.image
          ? `<img src="${sanitizeInput(p.image)}" class="product-img" alt="${sanitizeInput(p.name)}" onerror="this.parentElement.classList.add('img-placeholder');this.parentElement.innerHTML='<i class=\\'fas fa-gamepad\\'></i>'">`
          : '<div class="product-img-wrap img-placeholder"><i class="fas fa-gamepad"></i></div>'
        }
        <div class="product-img-overlay"></div>
      </div>
      <div class="product-body">
        <div class="product-name">${sanitizeInput(p.name)}</div>
        <div class="product-desc">${sanitizeInput(p.desc || '')}</div>
        <ul class="product-features">
          ${(p.features || []).map(f => `<li>${sanitizeInput(f)}</li>`).join('')}
        </ul>
        <button class="product-btn"><i class="fas fa-shopping-cart"></i> Lihat Harga</button>
      </div>
    </div>
  `).join('');

  initScrollReveal();
}

function openProductDetail(productId) {
  const product = homeData.products.find(p => p.id === productId);
  if (!product) return;
  selectedProduct = product;
  selectedPlan = null;
  selectedPrice = 0;
  quantity = 1;
  selectedPlanType = 'full';

  const popup = document.getElementById('product-popup');
  if (!popup) return;

  document.getElementById('product-popup-name').textContent = product.name;
  document.getElementById('product-popup-img').src = product.image || '';
  document.getElementById('product-popup-img').onerror = function() { this.style.display='none'; };

  // Render full key plans
  const fullPlans = document.getElementById('full-key-plans');
  const rentalPlans = document.getElementById('rental-plans');
  const rentalTab = document.getElementById('rental-tab');

  if (fullPlans) {
    fullPlans.innerHTML = (product.fullPlans || []).map((plan, i) => `
      <div class="plan-option" onclick="selectPlan(this, '${plan.label}', ${plan.price}, 'full')">
        <span class="plan-option-name">${sanitizeInput(plan.label)}</span>
        <span class="plan-option-price">Rp ${parseInt(plan.price).toLocaleString('id-ID')}</span>
      </div>
    `).join('') || '<div style="color:var(--gray-400);padding:10px;font-size:13px;">Tidak ada plan tersedia.</div>';
  }

  if (rentalPlans) {
    if (product.hasRental && product.rentalPlans?.length) {
      rentalPlans.innerHTML = (product.rentalPlans || []).map((plan, i) => `
        <div class="plan-option" onclick="selectPlan(this, '${plan.label}', ${plan.price}, 'rental')">
          <span class="plan-option-name">${sanitizeInput(plan.label)}</span>
          <span class="plan-option-price">Rp ${parseInt(plan.price).toLocaleString('id-ID')}</span>
        </div>
      `).join('');
      if (rentalTab) rentalTab.style.display = '';
    } else {
      if (rentalTab) rentalTab.style.display = 'none';
    }
  }

  updateTotal();
  popup.classList.remove('hidden');
  document.getElementById('promo-result').textContent = '';
  document.getElementById('promo-input').value = '';
  document.getElementById('wa-input').value = '';
  document.getElementById('qty-display').textContent = '1';
}

function selectPlan(el, label, price, type) {
  document.querySelectorAll('.plan-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedPlan = label;
  selectedPrice = parseInt(price);
  selectedPlanType = type;
  quantity = 1;
  document.getElementById('qty-display').textContent = '1';
  updateTotal();
}

function switchPlanTab(type) {
  document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.plan-options').forEach(o => o.classList.remove('active'));
  document.getElementById(`tab-${type}`).classList.add('active');
  document.getElementById(`plans-${type}`).classList.add('active');
  selectedPlan = null;
  selectedPrice = 0;
  selectedPlanType = type;
  document.querySelectorAll('.plan-option').forEach(o => o.classList.remove('selected'));
  quantity = 1;
  document.getElementById('qty-display').textContent = '1';
  updateTotal();
}

let appliedPromo = null;
let discountPercent = 0;

function changeQty(delta) {
  quantity = Math.max(1, quantity + delta);
  document.getElementById('qty-display').textContent = quantity;
  updateTotal();
}

function updateTotal() {
  const base = selectedPrice * quantity;
  const discount = appliedPromo ? Math.floor(base * discountPercent / 100) : 0;
  const total = base - discount;
  const el = document.getElementById('total-price');
  if (el) el.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

async function applyPromo() {
  const code = document.getElementById('promo-input').value.trim().toUpperCase();
  const resultEl = document.getElementById('promo-result');
  if (!code) { resultEl.textContent = 'Masukan kode promo terlebih dahulu.'; resultEl.style.color = 'var(--gold)'; return; }

  resultEl.textContent = 'Memvalidasi promo...';
  resultEl.style.color = 'var(--purple-200)';

  try {
    const [promoData, usersData] = await Promise.all([readBin(BINS.promoCodes), readBin(BINS.users)]);
    const promos = promoData?.promos || [];
    const users = usersData?.users || [];
    const user = users.find(u => u.id === homeData.currentUser.id);

    const promo = promos.find(p => p.code === code && p.active !== false);
    if (!promo) {
      resultEl.textContent = '❌ Kode promo tidak ditemukan atau sudah tidak aktif.';
      resultEl.style.color = '#ff5555';
      appliedPromo = null;
      discountPercent = 0;
      updateTotal();
      return;
    }

    // Check if user already used this promo
    if (user?.usedPromos?.includes(code)) {
      resultEl.textContent = '❌ Kamu sudah pernah menggunakan promo ini.';
      resultEl.style.color = '#ff5555';
      appliedPromo = null;
      discountPercent = 0;
      updateTotal();
      return;
    }

    // Check max usage
    const usedCount = promo.usedCount || 0;
    const maxUsage = promo.maxUsage || 999999;
    if (usedCount >= maxUsage) {
      resultEl.textContent = `❌ Promo sudah mencapai batas pemakaian (${maxUsage} pengguna).`;
      resultEl.style.color = '#ff5555';
      appliedPromo = null;
      discountPercent = 0;
      updateTotal();
      return;
    }

    appliedPromo = promo;
    discountPercent = promo.percent || 0;
    resultEl.textContent = `✅ Promo berhasil! Diskon ${discountPercent}%`;
    resultEl.style.color = 'var(--accent-green)';
    updateTotal();

  } catch (err) {
    resultEl.textContent = '⚠️ Gagal validasi promo. Coba lagi.';
    resultEl.style.color = 'var(--gold)';
  }
}

async function processBuy() {
  if (!selectedPlan) {
    notify('warning', 'Pilih Paket', 'Silakan pilih paket terlebih dahulu');
    return;
  }

  const waNum = document.getElementById('wa-input').value.trim();
  if (!waNum) {
    notify('warning', 'Nomor WA Kosong', 'Masukan nomor WhatsApp untuk konfirmasi pesanan');
    return;
  }

  const base = selectedPrice * quantity;
  const discount = appliedPromo ? Math.floor(base * discountPercent / 100) : 0;
  const total = base - discount;

  if (homeData.currentUser.credit < total) {
    notify('error', 'Saldo Tidak Cukup', `Saldo kamu Rp${homeData.currentUser.credit.toLocaleString()} tidak cukup untuk membeli.`);
    return;
  }

  const buyBtn = document.getElementById('buy-btn');
  buyBtn.disabled = true;
  buyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

  try {
    // Deduct credit from user
    const usersData = await readBin(BINS.users);
    const users = usersData?.users || [];
    const userIdx = users.findIndex(u => u.id === homeData.currentUser.id);
    if (userIdx === -1) throw new Error('User not found');

    users[userIdx].credit -= total;
    if (appliedPromo) {
      users[userIdx].usedPromos = users[userIdx].usedPromos || [];
      users[userIdx].usedPromos.push(appliedPromo.code);
    }
    await writeBin(BINS.users, { users });

    // Update promo usage count
    if (appliedPromo) {
      const promoData = await readBin(BINS.promoCodes);
      const promos = promoData?.promos || [];
      const promoIdx = promos.findIndex(p => p.code === appliedPromo.code);
      if (promoIdx !== -1) {
        promos[promoIdx].usedCount = (promos[promoIdx].usedCount || 0) + 1;
        await writeBin(BINS.promoCodes, { promos });
      }
    }

    // Create transaction
    const txData = await readBin(BINS.transactions);
    const transactions = txData?.transactions || [];
    const newTx = {
      id: generateTxId(),
      userId: homeData.currentUser.id,
      username: homeData.currentUser.username,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      plan: selectedPlan,
      planType: selectedPlanType,
      quantity: quantity,
      basePrice: base,
      discount: discount,
      total: total,
      promoCode: appliedPromo?.code || null,
      whatsapp: sanitizeInput(waNum),
      status: 'waiting',
      keys: [],
      createdAt: new Date().toISOString()
    };
    transactions.push(newTx);
    await writeBin(BINS.transactions, { transactions });

    // Update local credit
    homeData.currentUser.credit -= total;
    updateCreditDisplay(homeData.currentUser.credit);

    notify('success', 'Pembelian Berhasil!', `Pesanan kamu sedang diproses. Cek "Logs Transaksi".`);
    closeProductPopup();
    appliedPromo = null;
    discountPercent = 0;

    // Refresh transactions
    homeData.transactions = transactions;
    renderTransactions(transactions.filter(t => t.userId === homeData.currentUser.id));

  } catch (err) {
    notify('error', 'Gagal Membeli', 'Terjadi kesalahan. Saldo tidak dipotong. Coba lagi.');
  }

  buyBtn.disabled = false;
  buyBtn.innerHTML = '<i class="fas fa-bolt"></i> BUY NOW';
}

function renderTransactions(txs) {
  const container = document.getElementById('trans-list');
  if (!container) return;

  if (!txs.length) {
    container.innerHTML = '<div style="color:var(--gray-400);text-align:center;padding:30px;font-family:var(--font-body);">Belum ada transaksi.</div>';
    return;
  }

  container.innerHTML = txs.slice().reverse().map(tx => `
    <div class="trans-item scroll-reveal" onclick="openTransDetail('${tx.id}')">
      <div class="trans-icon" style="color:${tx.status==='approved'?'var(--accent-green)':tx.status==='rejected'?'#ff5555':'var(--gold)'}">
        <i class="fas fa-${tx.status==='approved'?'check-circle':tx.status==='rejected'?'times-circle':'clock'}"></i>
      </div>
      <div class="trans-info">
        <div class="trans-name">${sanitizeInput(tx.productName)}</div>
        <div class="trans-id">${sanitizeInput(tx.id)}</div>
        <div class="trans-date">${new Date(tx.createdAt).toLocaleString('id-ID')}</div>
      </div>
      <div class="trans-status status-${tx.status}">${tx.status === 'waiting' ? 'MENUNGGU' : tx.status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}</div>
    </div>
  `).join('');

  initScrollReveal();
}

function openTransDetail(txId) {
  const tx = homeData.transactions.find(t => t.id === txId);
  if (!tx) return;
  const popup = document.getElementById('trans-popup');
  if (!popup) return;

  document.getElementById('trans-popup-product').textContent = tx.productName;
  document.getElementById('trans-popup-plan').textContent = `${tx.plan} (${tx.planType === 'rental' ? 'Rental' : 'Akses Penuh'}) x${tx.quantity}`;
  document.getElementById('trans-popup-date').textContent = new Date(tx.createdAt).toLocaleString('id-ID');
  document.getElementById('trans-popup-id').textContent = tx.id;
  document.getElementById('trans-popup-total').textContent = `Rp ${tx.total.toLocaleString('id-ID')}`;
  document.getElementById('trans-popup-status').className = `status-badge status-${tx.status}`;
  document.getElementById('trans-popup-status').textContent = tx.status === 'waiting' ? '⏳ MENUNGGU' : tx.status === 'approved' ? '✅ DISETUJUI' : '❌ DITOLAK';

  const keysEl = document.getElementById('trans-popup-keys');
  if (tx.keys && tx.keys.length) {
    keysEl.innerHTML = tx.keys.map(k => `<div style="font-family:monospace;background:rgba(0,0,0,0.3);border:1px solid var(--border-purple);border-radius:8px;padding:8px 12px;margin-bottom:6px;color:var(--accent-green);word-break:break-all;">${sanitizeInput(k)}</div>`).join('');
  } else {
    keysEl.innerHTML = '<div style="color:var(--gray-400);font-size:13px;">Key belum tersedia. Menunggu admin memproses.</div>';
  }

  popup.classList.remove('hidden');
}

// ============ RESET KEY ============
async function processResetKey() {
  const keyInput = document.getElementById('reset-key-input').value.trim();
  if (!keyInput) {
    notify('warning', 'Input Kosong', 'Masukan key terlebih dahulu');
    return;
  }

  const btn = document.getElementById('reset-btn');
  const terminal = document.getElementById('reset-terminal');
  const visualLoad = document.getElementById('reset-visual-load');
  btn.disabled = true;
  terminal.style.display = 'none';
  visualLoad.style.display = 'block';
  visualLoad.innerHTML = `
    <div class="loading-line">⟶ Connecting to server...</div>
    <div class="loading-line">⟶ Fetching database...</div>
    <div class="loading-line">⟶ Processing response...</div>
  `;

  try {
    const settings = await readBin(BINS.settings);
    const resetEnabled = settings?.resetKey?.enabled !== false;

    setTimeout(async () => {
      if (!resetEnabled) {
        visualLoad.style.display = 'none';
        terminal.style.display = 'block';
        terminal.innerHTML = `
          <span class="code-line error">❌ Error: Feature Disabled</span>
          <span class="code-line warn">Status: 403</span>
          <span class="code-line">Response: {"success":false,"message":"Maaf fitur ini sedang di nonaktifkan oleh admin atau sedang tidak beroperasi normal, Silahkan coba lagi nanti."}</span>
        `;
        btn.disabled = false;
        return;
      }

      // Check daily reset limit
      const today = new Date().toDateString();
      const resetLog = JSON.parse(localStorage.getItem('reset_log') || '{}');
      const userId = homeData.currentUser.id;
      
      if (resetLog[userId]?.date === today && resetLog[userId]?.count >= 1) {
        visualLoad.style.display = 'none';
        terminal.style.display = 'block';
        const nextReset = new Date();
        nextReset.setHours(24,0,0,0);
        terminal.innerHTML = `
          <span class="code-line warn">⚠️ Reset Limit Reached</span>
          <span class="code-line">Status: 429</span>
          <span class="code-line info">Response: {"success":false,"message":"Reset limit reached","resetsused":1,"resetsmax":1,"nextresettime":"${nextReset.toISOString().replace('T',' ').substring(0,19)}"}</span>
        `;
        btn.disabled = false;
        return;
      }

      // Process reset
      resetLog[userId] = { date: today, count: (resetLog[userId]?.count || 0) + 1 };
      localStorage.setItem('reset_log', JSON.stringify(resetLog));

      const usedResets = resetLog[userId].count;
      const now = new Date();
      const nextReset2 = new Date();
      nextReset2.setHours(24,0,0,0);

      visualLoad.style.display = 'none';
      terminal.style.display = 'block';
      terminal.innerHTML = `
        <span class="code-line success">✅ Reset Successful</span>
        <span class="code-line"></span>
        <span class="code-line info">Status: 200</span>
        <span class="code-line">Response: {</span>
        <span class="code-line">&nbsp;&nbsp;"success": true,</span>
        <span class="code-line">&nbsp;&nbsp;"message": "Token reset successfully",</span>
        <span class="code-line">&nbsp;&nbsp;"key": "${sanitizeInput(keyInput.substring(0,4))}****",</span>
        <span class="code-line">&nbsp;&nbsp;"resetsused": ${usedResets},</span>
        <span class="code-line">&nbsp;&nbsp;"resetsmax": 1,</span>
        <span class="code-line">&nbsp;&nbsp;"nextresettime": "${nextReset2.toISOString().replace('T',' ').substring(0,19)}"</span>
        <span class="code-line">}</span>
        <span class="code-line"></span>
        <span class="code-line success">✔ Device HWID cleared</span>
        <span class="code-line success">✔ Session token invalidated</span>
        <span class="code-line success">✔ Reset complete - Login ulang di aplikasi</span>
        <span class="code-cursor"></span>
      `;
      btn.disabled = false;

    }, 2000);

  } catch (err) {
    visualLoad.style.display = 'none';
    terminal.style.display = 'block';
    terminal.innerHTML = `<span class="code-line error">❌ Server Error: ${err.message}</span>`;
    btn.disabled = false;
  }
}

// ============ CLOSE POPUPS ============
function closeProductPopup() {
  document.getElementById('product-popup')?.classList.add('hidden');
}

function closeTransPopup() {
  document.getElementById('trans-popup')?.classList.add('hidden');
}

function closeWelcomePopup() {
  document.getElementById('welcome-popup')?.classList.add('hidden');
}

function closeResetPopup() {
  document.getElementById('reset-popup')?.classList.add('hidden');
}

function closeCustomNotif() {
  document.getElementById('custom-notif-popup')?.classList.add('hidden');
}

function openResetPopup() {
  document.getElementById('reset-key-input').value = '';
  document.getElementById('reset-terminal').style.display = 'none';
  document.getElementById('reset-visual-load').style.display = 'none';
  document.getElementById('reset-popup')?.classList.remove('hidden');
  // Close nav
  document.getElementById('quick-nav')?.classList.remove('open');
  document.getElementById('nav-overlay')?.classList.remove('show');
}

function openLogsSection() {
  document.getElementById('quick-nav')?.classList.remove('open');
  document.getElementById('nav-overlay')?.classList.remove('show');
  document.getElementById('logs-section')?.scrollIntoView({ behavior: 'smooth' });
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}

// ============ ADMIN PAGE ============
let adminData = { settings: null, products: [], transactions: [], users: [], promoCodes: [] };
let editingProductId = null;

async function initAdmin() {
  const [settingsData, productsData, txData, usersData, promoData] = await Promise.all([
    readBin(BINS.settings),
    readBin(BINS.products),
    readBin(BINS.transactions),
    readBin(BINS.users),
    readBin(BINS.promoCodes)
  ]);

  adminData.settings = settingsData || getDefaultSettings();
  adminData.products = productsData?.products || [];
  adminData.transactions = txData?.transactions || [];
  adminData.users = usersData?.users || [];
  adminData.promoCodes = promoData?.promos || [];

  // Stats
  updateAdminStats();

  // Load settings into toggles
  loadAdminSettings();

  // Render products
  renderAdminProducts();

  // Render promos
  renderAdminPromos();

  // Render logs
  renderAdminLogs();

  // Daily reset for terjual hari ini
  const today = new Date().toDateString();
  const lastReset = adminData.settings.lastSaleReset;
  if (lastReset !== today) {
    adminData.settings.todaySales = 0;
    adminData.settings.lastSaleReset = today;
    await writeBin(BINS.settings, adminData.settings);
  }

  // Scroll daily counter
  initScrollReveal();
}

function getDefaultSettings() {
  return {
    welcomePopup: { enabled: true },
    runningText: { enabled: false, text: '' },
    resetKey: { enabled: true },
    maintenance: { enabled: false, reason: '' },
    customNotif: { enabled: false, icon: 'bell', text: '' },
    totalSales: 0,
    totalRevenue: 0,
    todaySales: 0,
    lastSaleReset: new Date().toDateString()
  };
}

function updateAdminStats() {
  const approvedTx = adminData.transactions.filter(t => t.status === 'approved');
  const totalBuyers = new Set(approvedTx.map(t => t.userId)).size;
  const totalRevenue = approvedTx.reduce((sum, t) => sum + (t.total || 0), 0);

  const today = new Date().toDateString();
  const todayTx = approvedTx.filter(t => new Date(t.createdAt).toDateString() === today);

  document.getElementById('stat-buyers').textContent = totalBuyers;
  document.getElementById('stat-revenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('stat-today').textContent = todayTx.length;
}

function loadAdminSettings() {
  const s = adminData.settings;

  setToggle('toggle-popup', s.welcomePopup?.enabled !== false);
  setToggle('toggle-running', s.runningText?.enabled === true);
  setToggle('toggle-reset', s.resetKey?.enabled !== false);
  setToggle('toggle-maintenance', s.maintenance?.enabled === true);
  setToggle('toggle-custom-notif', s.customNotif?.enabled === true);

  const rtInput = document.getElementById('running-text-input');
  if (rtInput) rtInput.value = s.runningText?.text || '';

  const mReasonInput = document.getElementById('maintenance-reason-input');
  if (mReasonInput) mReasonInput.value = s.maintenance?.reason || '';

  const notifTextInput = document.getElementById('custom-notif-text-input');
  if (notifTextInput) notifTextInput.value = s.customNotif?.text || '';

  const notifIconInput = document.getElementById('custom-notif-icon-input');
  if (notifIconInput) notifIconInput.value = s.customNotif?.icon || 'bell';
}

function setToggle(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
}

function getToggle(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

async function saveSettings() {
  const settings = adminData.settings;

  settings.welcomePopup = { enabled: getToggle('toggle-popup') };
  settings.runningText = {
    enabled: getToggle('toggle-running'),
    text: sanitizeInput(document.getElementById('running-text-input')?.value || '')
  };
  settings.resetKey = { enabled: getToggle('toggle-reset') };
  settings.maintenance = {
    enabled: getToggle('toggle-maintenance'),
    reason: sanitizeInput(document.getElementById('maintenance-reason-input')?.value || '')
  };
  settings.customNotif = {
    enabled: getToggle('toggle-custom-notif'),
    icon: sanitizeInput(document.getElementById('custom-notif-icon-input')?.value || 'bell'),
    text: sanitizeInput(document.getElementById('custom-notif-text-input')?.value || '')
  };

  const btn = document.getElementById('save-settings-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

  const result = await writeBin(BINS.settings, settings);
  if (result) {
    notify('success', 'Pengaturan Tersimpan', 'Semua pengaturan berhasil disimpan');
  } else {
    notify('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan Pengaturan'; }
}

// ============ ADMIN: ADD PRODUCT ============
async function addProduct() {
  const name = sanitizeInput(document.getElementById('prod-name').value.trim());
  const image = document.getElementById('prod-image').value.trim();
  const desc = sanitizeInput(document.getElementById('prod-desc').value.trim());
  const features = sanitizeInput(document.getElementById('prod-features').value.trim()).split('\n').filter(f => f);
  const hasRental = getToggle('toggle-rental');

  if (!name) { notify('warning', 'Nama Kosong', 'Nama produk wajib diisi'); return; }

  // Collect full plans
  const fullPlans = [];
  for (let i = 1; i <= 5; i++) {
    const label = document.getElementById(`full-plan-label-${i}`)?.value.trim();
    const price = document.getElementById(`full-plan-price-${i}`)?.value;
    if (label && price) fullPlans.push({ label: sanitizeInput(label), price: parseInt(price) || 0 });
  }

  // Collect rental plans
  const rentalPlans = [];
  if (hasRental) {
    for (let i = 1; i <= 5; i++) {
      const label = document.getElementById(`rental-plan-label-${i}`)?.value.trim();
      const price = document.getElementById(`rental-plan-price-${i}`)?.value;
      if (label && price) rentalPlans.push({ label: sanitizeInput(label), price: parseInt(price) || 0 });
    }
  }

  const btn = document.getElementById('add-product-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

  try {
    if (editingProductId) {
      const idx = adminData.products.findIndex(p => p.id === editingProductId);
      if (idx !== -1) {
        adminData.products[idx] = { ...adminData.products[idx], name, image, desc, features, hasRental, fullPlans, rentalPlans };
      }
      editingProductId = null;
    } else {
      adminData.products.push({
        id: 'PROD_' + Date.now(),
        name, image, desc, features, hasRental, fullPlans, rentalPlans,
        createdAt: new Date().toISOString()
      });
    }

    await writeBin(BINS.products, { products: adminData.products });
    notify('success', 'Produk Tersimpan', `Produk "${name}" berhasil disimpan`);
    renderAdminProducts();
    clearProductForm();
  } catch (err) {
    notify('error', 'Gagal', 'Terjadi kesalahan');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Tambah Produk'; }
}

function clearProductForm() {
  ['prod-name','prod-image','prod-desc','prod-features'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  for (let i = 1; i <= 5; i++) {
    ['full-plan-label-','full-plan-price-','rental-plan-label-','rental-plan-price-'].forEach(prefix => {
      const el = document.getElementById(prefix + i);
      if (el) el.value = '';
    });
  }
  editingProductId = null;
  const btn = document.getElementById('add-product-btn');
  if (btn) btn.innerHTML = '<i class="fas fa-plus"></i> Tambah Produk';
}

function renderAdminProducts() {
  const container = document.getElementById('admin-products-list');
  if (!container) return;

  if (!adminData.products.length) {
    container.innerHTML = '<div style="color:var(--gray-400);font-family:var(--font-body);padding:20px;">Belum ada produk.</div>';
    return;
  }

  container.innerHTML = adminData.products.map(p => `
    <div class="product-list-item">
      ${p.image ? `<img src="${sanitizeInput(p.image)}" class="product-list-thumb" onerror="this.src=''"  alt="">` : '<div class="product-list-thumb img-placeholder" style="display:flex;align-items:center;justify-content:center;"><i class="fas fa-gamepad"></i></div>'}
      <div class="product-list-info">
        <div class="product-list-name">${sanitizeInput(p.name)}</div>
        <div class="product-list-desc">${p.fullPlans?.length || 0} plan full, ${p.hasRental ? (p.rentalPlans?.length || 0) : 0} plan rental</div>
      </div>
      <div class="product-list-actions">
        <button class="btn-edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-danger" style="padding:6px 12px;font-size:12px;" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function editProduct(productId) {
  const p = adminData.products.find(x => x.id === productId);
  if (!p) return;
  editingProductId = productId;

  document.getElementById('prod-name').value = p.name || '';
  document.getElementById('prod-image').value = p.image || '';
  document.getElementById('prod-desc').value = p.desc || '';
  document.getElementById('prod-features').value = (p.features || []).join('\n');
  setToggle('toggle-rental', p.hasRental);

  (p.fullPlans || []).forEach((plan, i) => {
    const labelEl = document.getElementById(`full-plan-label-${i+1}`);
    const priceEl = document.getElementById(`full-plan-price-${i+1}`);
    if (labelEl) labelEl.value = plan.label;
    if (priceEl) priceEl.value = plan.price;
  });

  (p.rentalPlans || []).forEach((plan, i) => {
    const labelEl = document.getElementById(`rental-plan-label-${i+1}`);
    const priceEl = document.getElementById(`rental-plan-price-${i+1}`);
    if (labelEl) labelEl.value = plan.label;
    if (priceEl) priceEl.value = plan.price;
  });

  const btn = document.getElementById('add-product-btn');
  if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Update Produk';

  // Scroll to form
  document.getElementById('product-form-section')?.scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(productId) {
  if (!confirm('Hapus produk ini?')) return;
  adminData.products = adminData.products.filter(p => p.id !== productId);
  await writeBin(BINS.products, { products: adminData.products });
  notify('success', 'Produk Dihapus', 'Produk berhasil dihapus');
  renderAdminProducts();
}

// ============ ADMIN: PROMO ============
async function addPromo() {
  const code = document.getElementById('promo-code-input').value.trim().toUpperCase();
  const percent = parseInt(document.getElementById('promo-percent-input').value);
  const maxUsage = parseInt(document.getElementById('promo-max-input').value) || 999;

  if (!code || !percent) { notify('warning', 'Data Kurang', 'Isi semua field promo'); return; }
  if (percent < 1 || percent > 90) { notify('warning', 'Persen Invalid', 'Diskon 1-90%'); return; }

  const existing = adminData.promoCodes.find(p => p.code === code);
  if (existing) { notify('warning', 'Kode Sudah Ada', 'Kode promo sudah terdaftar'); return; }

  const btn = document.getElementById('add-promo-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

  adminData.promoCodes.push({
    code,
    percent,
    maxUsage,
    usedCount: 0,
    active: true,
    createdAt: new Date().toISOString()
  });

  await writeBin(BINS.promoCodes, { promos: adminData.promoCodes });
  notify('success', 'Promo Ditambahkan', `Kode "${code}" dengan diskon ${percent}%`);
  renderAdminPromos();

  document.getElementById('promo-code-input').value = '';
  document.getElementById('promo-percent-input').value = '';
  document.getElementById('promo-max-input').value = '';

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Tambah Promo'; }
}

async function deletePromo(code) {
  adminData.promoCodes = adminData.promoCodes.filter(p => p.code !== code);
  await writeBin(BINS.promoCodes, { promos: adminData.promoCodes });
  notify('success', 'Promo Dihapus', '');
  renderAdminPromos();
}

function renderAdminPromos() {
  const container = document.getElementById('promo-list');
  if (!container) return;

  if (!adminData.promoCodes.length) {
    container.innerHTML = '<div style="color:var(--gray-400);font-size:13px;padding:15px;">Belum ada promo.</div>';
    return;
  }

  container.innerHTML = adminData.promoCodes.map(p => `
    <div class="promo-item">
      <span class="promo-code">${p.code}</span>
      <span class="promo-info">Diskon ${p.percent}% | ${p.usedCount || 0}/${p.maxUsage} pakai</span>
      <button class="btn-danger" style="padding:5px 10px;font-size:11px;" onclick="deletePromo('${p.code}')"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');
}

// ============ ADMIN: TOP UP SALDO ============
async function addSaldo() {
  const username = sanitizeInput(document.getElementById('topup-username').value.trim());
  const amount = parseInt(document.getElementById('topup-amount').value);

  if (!username || !amount) { notify('warning', 'Data Kurang', 'Isi semua field'); return; }
  if (amount <= 0) { notify('warning', 'Nominal Invalid', 'Masukan nominal valid'); return; }

  const btn = document.getElementById('topup-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'; }

  try {
    const usersData = await readBin(BINS.users);
    const users = usersData?.users || [];
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

    if (idx === -1) {
      notify('error', 'User Tidak Ditemukan', `Username "${username}" tidak ada di database`);
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Transfer Saldo'; }
      return;
    }

    users[idx].credit = (users[idx].credit || 0) + amount;
    await writeBin(BINS.users, { users });

    notify('success', 'Saldo Terkirim!', `Rp ${amount.toLocaleString('id-ID')} → ${username} (Total: Rp ${users[idx].credit.toLocaleString('id-ID')})`);
    document.getElementById('topup-username').value = '';
    document.getElementById('topup-amount').value = '';

  } catch (err) {
    notify('error', 'Error', 'Gagal kirim saldo');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Transfer Saldo'; }
}

// ============ ADMIN: LOGS & APPROVE ============
function renderAdminLogs() {
  const container = document.getElementById('admin-logs-list');
  if (!container) return;

  const allTx = adminData.transactions.slice().reverse();

  if (!allTx.length) {
    container.innerHTML = '<div style="color:var(--gray-400);font-family:var(--font-body);padding:30px;text-align:center;">Belum ada transaksi.</div>';
    return;
  }

  container.innerHTML = allTx.map(tx => `
    <div class="log-item ${tx.status}" id="log-${tx.id}">
      <div class="log-header">
        <div>
          <div class="log-product">${sanitizeInput(tx.productName)}</div>
          <div class="log-id">${sanitizeInput(tx.id)}</div>
        </div>
        <div class="log-date">${new Date(tx.createdAt).toLocaleString('id-ID')}</div>
      </div>
      <div class="log-details">
        <div class="log-detail-item">
          <div class="log-detail-label">User</div>
          <div class="log-detail-value">${sanitizeInput(tx.username)}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Paket</div>
          <div class="log-detail-value">${sanitizeInput(tx.plan)} (${tx.planType === 'rental' ? 'Rental' : 'Full'}) x${tx.quantity}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Total</div>
          <div class="log-detail-value">Rp ${(tx.total || 0).toLocaleString('id-ID')}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">WhatsApp</div>
          <div class="log-detail-value">${sanitizeInput(tx.whatsapp || '-')}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Promo</div>
          <div class="log-detail-value">${sanitizeInput(tx.promoCode || '-')} ${tx.discount > 0 ? `(-Rp ${tx.discount.toLocaleString()})` : ''}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Status</div>
          <div class="log-detail-value trans-status status-${tx.status}">${tx.status.toUpperCase()}</div>
        </div>
      </div>
      ${tx.status === 'waiting' ? `
        <div class="log-actions">
          <button class="btn-approve" onclick="approveTx('${tx.id}')"><i class="fas fa-check"></i> Approve</button>
          <button class="btn-reject" onclick="rejectTx('${tx.id}')"><i class="fas fa-times"></i> Reject</button>
        </div>
      ` : tx.status === 'approved' ? `
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
          <span style="color:var(--accent-green);font-size:13px;"><i class="fas fa-check-circle"></i> Approved</span>
          ${tx.keys?.length ? `<span style="color:var(--gray-400);font-size:12px;">Keys terkirim: ${tx.keys.length}</span>` : ''}
        </div>
      ` : `<div style="color:#ff5555;font-size:13px;margin-top:8px;"><i class="fas fa-times-circle"></i> Rejected</div>`}
      <div class="key-input-area" id="key-area-${tx.id}">
        <div style="font-family:var(--font-body);font-size:13px;color:var(--purple-200);margin-bottom:10px;">Masukan key untuk dikirim ke user:</div>
        ${[1,2,3,4,5].map(n => `<input type="text" class="form-input" id="key-${tx.id}-${n}" placeholder="Key ${n} (opsional)" style="margin-bottom:8px;">`).join('')}
        <button class="btn-approve" style="width:100%;margin-top:5px;" onclick="sendKeys('${tx.id}')"><i class="fas fa-paper-plane"></i> Kirim Key & Approve</button>
      </div>
    </div>
  `).join('');
}

function approveTx(txId) {
  const keyArea = document.getElementById(`key-area-${txId}`);
  if (keyArea) keyArea.classList.toggle('show');
}

async function sendKeys(txId) {
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const val = document.getElementById(`key-${txId}-${i}`)?.value.trim();
    if (val) keys.push(sanitizeInput(val));
  }

  const btn = document.querySelector(`#key-area-${txId} .btn-approve`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

  try {
    const txData = await readBin(BINS.transactions);
    const transactions = txData?.transactions || [];
    const idx = transactions.findIndex(t => t.id === txId);
    if (idx !== -1) {
      transactions[idx].status = 'approved';
      transactions[idx].keys = keys;
      transactions[idx].approvedAt = new Date().toISOString();
      await writeBin(BINS.transactions, { transactions });
      adminData.transactions = transactions;
      notify('success', 'Transaksi Disetujui', `Keys berhasil dikirim ke user`);
      renderAdminLogs();
      updateAdminStats();
    }
  } catch (err) {
    notify('error', 'Error', 'Gagal approve');
  }
}

async function rejectTx(txId) {
  if (!confirm('Yakin ingin menolak transaksi ini? Saldo akan dikembalikan.')) return;

  try {
    const [txData, usersData] = await Promise.all([readBin(BINS.transactions), readBin(BINS.users)]);
    const transactions = txData?.transactions || [];
    const users = usersData?.users || [];
    const idx = transactions.findIndex(t => t.id === txId);

    if (idx !== -1) {
      const tx = transactions[idx];
      transactions[idx].status = 'rejected';
      transactions[idx].rejectedAt = new Date().toISOString();

      // Refund credit
      const userIdx = users.findIndex(u => u.id === tx.userId);
      if (userIdx !== -1) users[userIdx].credit = (users[userIdx].credit || 0) + (tx.total || 0);

      await Promise.all([
        writeBin(BINS.transactions, { transactions }),
        writeBin(BINS.users, { users })
      ]);

      adminData.transactions = transactions;
      notify('success', 'Transaksi Ditolak', 'Saldo user dikembalikan otomatis');
      renderAdminLogs();
    }
  } catch (err) {
    notify('error', 'Error', 'Gagal reject transaksi');
  }
}

// ============ ADMIN TAB NAVIGATION ============
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tabName}`)?.classList.add('active');
  document.getElementById(`content-${tabName}`)?.classList.add('active');
}

// ============ INIT ON PAGE LOAD ============
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initPasswordToggles();
  initHamburger();

  const page = document.body.getAttribute('data-page');

  if (page === 'login') {
    initLoadingScreen(() => {
      document.getElementById('auth-content')?.classList.remove('hidden');
      document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    });
  }

  if (page === 'register') {
    initLoadingScreen(() => {
      document.getElementById('auth-content')?.classList.remove('hidden');
      document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    });
  }

  if (page === 'home') {
    initLoadingScreen(async () => {
      document.getElementById('home-content')?.classList.remove('hidden');
      await initHome();
    });
  }

  if (page === 'admin') {
    initLoadingScreen(async () => {
      document.getElementById('admin-content')?.classList.remove('hidden');
      await initAdmin();
      switchAdminTab('stats');
    });
  }
});
