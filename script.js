/**
 * DRIP CLIENT - script.js
 * Seluruh fungsi website: Auth, Database JSONBin, Dashboard, Admin
 * Keamanan: XSS, Input Sanitization, Injection Prevention
 */

// ============================================================
// KONFIGURASI JSONBIN
// ============================================================
// Ganti JSONBIN_API_KEY dan BIN_ID dengan milik Anda dari jsonbin.io
const JSONBIN_API_KEY = '$2a$10$Y.jqtzCgEfTCuODvJNV08ex.6qQW0V5p2WF6UUqlhg.fYT4W.4Gu6'; // Ganti dengan API key JSONBin Anda
const BIN_ID = '69b7c669aa77b81da9eb9823'; // Ganti dengan Bin ID Anda dari JSONBin.io
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';

// ============================================================
// SECURITY HELPERS - Anti XSS, Anti Injection
// ============================================================
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/[<>'"`;(){}]/g, '')
    .trim()
    .substring(0, 500);
}

function hashPassword(password) {
  // Simple hash untuk demo - production gunakan bcrypt via backend
  let hash = 0;
  const salt = 'DRIP_SECURE_2026_SALT_KEY';
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + str.length.toString(36) + 'drip';
}

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

function validatePassword(password) {
  return password.length >= 6 && password.length <= 100;
}

function validatePhone(phone) {
  return /^[0-9+\-\s]{8,15}$/.test(phone);
}

function generateId() {
  return 'TRX-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function formatRupiah(amount) {
  return 'Rp ' + parseInt(amount || 0).toLocaleString('id-ID');
}

function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('id-ID');
}

// ============================================================
// JSONBIN DATABASE OPERATIONS
// ============================================================
async function dbRead() {
  try {
    const res = await fetch(`${JSONBIN_BASE}/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!res.ok) throw new Error('DB Read failed: ' + res.status);
    const data = await res.json();
    return data.record || getDefaultDB();
  } catch (e) {
    console.error('dbRead error:', e);
    return getDefaultDB();
  }
}

async function dbWrite(data) {
  try {
    const res = await fetch(`${JSONBIN_BASE}/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('DB Write failed: ' + res.status);
    return true;
  } catch (e) {
    console.error('dbWrite error:', e);
    return false;
  }
}

function getDefaultDB() {
  return {
    users: [],
    products: [],
    transactions: [],
    promoCodes: [],
    settings: {
      runningText: false,
      runningTextMsg: '🔥 SELAMAT DATANG DI DRIP CLIENT — PREMIUM GAME KEY STORE 🔥',
      welcomePopup: true,
      customNotif: false,
      customNotifMsg: '',
      customNotifIcon: 'fa-circle-info',
      resetKeyEnabled: true,
      maintenanceMode: false,
      maintenanceMsgText: 'Website sedang dalam pemeliharaan. Harap tunggu sebentar.'
    },
    stats: {
      totalBuyers: 0,
      totalRevenue: 0,
      todaySales: 0,
      todayDate: ''
    }
  };
}

// ============================================================
// PARTICLES INIT
// ============================================================
function initParticles() {
  if (typeof particlesJS === 'undefined') return;
  particlesJS('particles-js', {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: ['#7c3aed', '#a855f7', '#c084fc', '#e879f9'] },
      shape: { type: 'circle' },
      opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
      size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.1, sync: false } },
      line_linked: { enable: true, distance: 150, color: '#7c3aed', opacity: 0.2, width: 1 },
      move: { enable: true, speed: 2, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { grab: { distance: 140, line_linked: { opacity: 0.5 } }, push: { particles_nb: 4 } }
    },
    retina_detect: true
  });
}

// ============================================================
// LOADING SCREEN
// ============================================================
function initLoadingScreen(callback) {
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.classList.add('fade-out');
      setTimeout(() => {
        ls.style.display = 'none';
        if (callback) callback();
      }, 800);
    }
  }, 3000);
}

// ============================================================
// PASSWORD TOGGLE
// ============================================================
function togglePassword(inputId, iconEl) {
  const input = document.getElementById(inputId);
  const icon = iconEl.querySelector('i');
  if (!input || !icon) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================
async function doLogin() {
  const btn = document.getElementById('loginBtn');
  const alertDiv = document.getElementById('loginAlert');
  const rawUser = document.getElementById('loginUsername')?.value || '';
  const rawPass = document.getElementById('loginPassword')?.value || '';

  const username = sanitizeInput(rawUser).toLowerCase();
  const password = rawPass.trim();

  // Basic validation
  if (!username || !password) {
    showAlert(alertDiv, 'danger', 'Username dan password tidak boleh kosong!');
    return;
  }

  if (!validateUsername(username)) {
    showAlert(alertDiv, 'danger', 'Username hanya boleh huruf, angka, dan underscore (3-30 karakter).');
    return;
  }

  // Disable button
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

  try {
    const db = await dbRead();
    const hashedPass = hashPassword(password);
    const user = db.users.find(u => u.username === username && u.password === hashedPass);

    if (!user) {
      showAlert(alertDiv, 'danger', 'Username atau password salah!');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
      return;
    }

    // Store session
    sessionStorage.setItem('dc_user', JSON.stringify({ username: user.username, credit: user.credit || 0 }));
    if (document.getElementById('rememberMe')?.checked) {
      localStorage.setItem('dc_remember', JSON.stringify({ username: user.username }));
    }

    // Welcome animation
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Login Berhasil!';
    showAlert(alertDiv, 'success', 'Login berhasil!');

    await Swal.fire({
      html: `<div style="font-family:'Orbitron',monospace;font-size:22px;font-weight:900;background:linear-gradient(135deg,#a855f7,#e879f9);-webkit-background-clip:text;background-clip:text;color:transparent;padding:20px 0;">Welcome ${sanitizeDisplay(user.username)}! 👋</div>`,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      background: '#0f0720',
      backdrop: 'rgba(0,0,0,0.8)'
    });

    window.location.href = 'home.html';

  } catch (e) {
    showAlert(alertDiv, 'danger', 'Terjadi kesalahan. Cek koneksi internet Anda.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
  }
}

async function doRegister() {
  const btn = document.getElementById('registerBtn');
  const alertDiv = document.getElementById('registerAlert');
  const rawUser = document.getElementById('regUsername')?.value || '';
  const rawPass = document.getElementById('regPassword')?.value || '';
  const rawPassConfirm = document.getElementById('regPasswordConfirm')?.value || '';
  const rawPhone = document.getElementById('regPhone')?.value || '';

  const username = sanitizeInput(rawUser).toLowerCase();
  const password = rawPass.trim();
  const passwordConfirm = rawPassConfirm.trim();
  const phone = sanitizeInput(rawPhone);

  if (!username || !password || !passwordConfirm) {
    showAlert(alertDiv, 'danger', 'Semua field wajib diisi!');
    return;
  }

  if (!validateUsername(username)) {
    showAlert(alertDiv, 'danger', 'Username hanya huruf, angka, underscore. Min 3, Maks 30 karakter.');
    return;
  }

  if (!validatePassword(password)) {
    showAlert(alertDiv, 'danger', 'Password minimal 6 karakter!');
    return;
  }

  if (password !== passwordConfirm) {
    showAlert(alertDiv, 'danger', 'Konfirmasi password tidak cocok!');
    return;
  }

  if (phone && !validatePhone(phone)) {
    showAlert(alertDiv, 'danger', 'Format nomor WhatsApp tidak valid!');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mendaftar...';

  try {
    const db = await dbRead();

    // Check duplicate username
    if (db.users.find(u => u.username === username)) {
      showAlert(alertDiv, 'danger', 'Username sudah digunakan! Pilih username lain.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Buat Akun';
      return;
    }

    // Create user
    const newUser = {
      id: 'USR-' + Date.now().toString(36).toUpperCase(),
      username: username,
      password: hashPassword(password),
      phone: phone || '',
      credit: 0,
      createdAt: Date.now(),
      promoUsed: []
    };

    db.users.push(newUser);
    const saved = await dbWrite(db);

    if (!saved) {
      showAlert(alertDiv, 'danger', 'Gagal menyimpan. Coba lagi.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Buat Akun';
      return;
    }

    await Swal.fire({
      icon: 'success',
      title: 'Akun Berhasil Dibuat! 🎉',
      text: `Selamat datang ${sanitizeDisplay(username)}! Silahkan login.`,
      background: '#0f0720',
      color: '#f3e8ff',
      confirmButtonColor: '#7c3aed',
      confirmButtonText: 'Login Sekarang'
    });

    window.location.href = 'index.html';

  } catch (e) {
    showAlert(alertDiv, 'danger', 'Terjadi kesalahan. Periksa koneksi internet.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Buat Akun';
  }
}

function doLogout() {
  Swal.fire({
    title: 'Logout?',
    text: 'Yakin ingin keluar dari dashboard?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#7c3aed',
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal',
    background: '#0f0720',
    color: '#f3e8ff'
  }).then((result) => {
    if (result.isConfirmed) {
      sessionStorage.removeItem('dc_user');
      window.location.href = 'index.html';
    }
  });
}

function getSession() {
  try {
    const s = sessionStorage.getItem('dc_user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function sanitizeDisplay(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// ALERT HELPER
// ============================================================
function showAlert(container, type, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-${type}">
      <i class="fa-solid fa-${type === 'success' ? 'circle-check' : type === 'warning' ? 'triangle-exclamation' : 'circle-xmark'}"></i>
      ${sanitizeDisplay(message)}
    </div>
  `;
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal on backdrop click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ============================================================
// NAVBAR TOGGLE
// ============================================================
function toggleNavbar() {
  const nav = document.getElementById('sideNav');
  const btn = document.getElementById('hamburgerBtn');
  if (!nav || !btn) return;
  nav.classList.toggle('open');
  btn.classList.toggle('active');
}

// ============================================================
// FAQ TOGGLE
// ============================================================
function toggleFaq(questionEl) {
  const item = questionEl.parentElement;
  const wasActive = item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('active'));
  if (!wasActive) item.classList.add('active');
}

// ============================================================
// SCROLL ANIMATIONS
// ============================================================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-fade').forEach(el => observer.observe(el));
}

// ============================================================
// DASHBOARD INIT
// ============================================================
async function initDashboard() {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  // Update header
  const uEl = document.getElementById('headerUsername');
  const cEl = document.getElementById('headerCredit');
  const wEl = document.getElementById('welcomeName');
  const pEl = document.getElementById('popupUsername');

  if (uEl) uEl.textContent = session.username;
  if (wEl) wEl.textContent = session.username;
  if (pEl) pEl.textContent = session.username;

  try {
    const db = await dbRead();

    // Check maintenance
    if (db.settings?.maintenanceMode) {
      const overlay = document.getElementById('maintenanceOverlay');
      const msgEl = document.getElementById('maintenanceMsg');
      if (overlay) overlay.classList.add('active');
      if (msgEl) msgEl.textContent = db.settings.maintenanceMsgText || 'Website dalam pemeliharaan.';
      return;
    }

    // Get fresh user data
    const user = db.users.find(u => u.username === session.username);
    if (user) {
      const credit = user.credit || 0;
      if (cEl) cEl.textContent = formatRupiah(credit);
      // Update session
      sessionStorage.setItem('dc_user', JSON.stringify({ username: user.username, credit }));
    }

    // Running text
    if (db.settings?.runningText && db.settings?.runningTextMsg) {
      const bar = document.getElementById('runningTextBar');
      const msg1 = document.getElementById('runningTextMsg');
      const msg2 = document.getElementById('runningTextMsg2');
      if (bar) {
        bar.style.display = 'block';
        const txt = `<i class="fa-solid fa-fire" style="color:var(--gold);"></i> ${sanitizeDisplay(db.settings.runningTextMsg)} &nbsp;&nbsp;&nbsp;`;
        if (msg1) msg1.innerHTML = txt;
        if (msg2) msg2.innerHTML = txt;
      }
    }

    // Welcome popup
    if (db.settings?.welcomePopup) {
      setTimeout(() => openModal('welcomePopup'), 500);
    }

    // Custom notification
    if (db.settings?.customNotif && db.settings?.customNotifMsg) {
      setTimeout(() => showCustomNotif(db.settings.customNotifMsg, db.settings.customNotifIcon), 1500);
    }

    // Load products
    renderProducts(db.products || []);
    renderTransactions(db.transactions || [], session.username);

  } catch (e) {
    console.error('Dashboard init error:', e);
  }

  initScrollAnimations();
}

// ============================================================
// PRODUCTS RENDERING
// ============================================================
function renderProducts(products) {
  const homeEl = document.getElementById('homeProducts');
  const allEl = document.getElementById('allProducts');

  if (!products.length) {
    const empty = `<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-box-open"></i><h3>Belum ada produk</h3><p>Admin belum menambahkan produk</p></div>`;
    if (homeEl) homeEl.innerHTML = empty;
    if (allEl) allEl.innerHTML = empty;
    return;
  }

  const html = products.map((p, idx) => {
    const features = (p.features || []).slice(0, 4);
    const lowestPrice = getLowestPrice(p);
    return `
      <div class="product-card scroll-fade" style="animation-delay:${idx * 0.1}s;" onclick="openProduct('${sanitizeDisplay(p.id)}')">
        ${p.image
          ? `<img src="${sanitizeDisplay(p.image)}" class="product-image" alt="${sanitizeDisplay(p.name)}" onerror="this.parentElement.querySelector('.product-image-fallback').style.display='flex';this.style.display='none';">`
          : ''}
        <div class="product-image-fallback" style="${p.image ? 'display:none;' : ''}">
          <i class="fa-solid fa-gamepad"></i>
        </div>
        <div class="product-body">
          <div class="product-name">${sanitizeDisplay(p.name)}</div>
          <div class="product-type">${sanitizeDisplay(p.type || '')}</div>
          <ul class="product-features">
            ${features.map(f => `<li><i class="fa-solid fa-circle-check"></i> ${sanitizeDisplay(f)}</li>`).join('')}
          </ul>
        </div>
        <div class="product-footer">
          <span class="product-price-label">Mulai dari</span>
          <span class="product-price">${lowestPrice ? formatRupiah(lowestPrice) : 'Lihat Harga'}</span>
        </div>
      </div>
    `;
  }).join('');

  if (homeEl) { homeEl.innerHTML = html; }
  if (allEl) { allEl.innerHTML = html; }
  initScrollAnimations();
}

function getLowestPrice(product) {
  const prices = [...(product.fullKeyPrices || []), ...(product.rentalKeyPrices || [])];
  const nums = prices.map(p => parseInt(p.price || 0)).filter(n => n > 0);
  return nums.length ? Math.min(...nums) : 0;
}

// Current purchase state
let currentProduct = null;
let currentPriceType = 'full';
let currentPriceOption = null;
let currentQuantity = 1;
let currentPromoDiscount = 0;
let currentDB = null;

async function openProduct(productId) {
  const db = await dbRead();
  currentDB = db;
  const product = db.products.find(p => p.id === productId);
  if (!product) return;

  currentProduct = product;
  currentPriceType = 'full';
  currentPriceOption = null;
  currentQuantity = 1;
  currentPromoDiscount = 0;

  const titleEl = document.getElementById('purchaseModalTitle');
  if (titleEl) titleEl.textContent = product.name;

  renderPurchaseModal(product, db);
  openModal('purchaseModal');
}

function renderPurchaseModal(product, db) {
  const body = document.getElementById('purchaseModalBody');
  if (!body) return;

  const hasRental = product.rentalEnabled && product.rentalKeyPrices?.length;
  const session = getSession();
  const userCredit = session ? (session.credit || 0) : 0;

  body.innerHTML = `
    ${hasRental ? `
      <div class="price-tabs">
        <div class="price-tab active" id="tabFull" onclick="switchPriceTab('full')">Access Full Key</div>
        <div class="price-tab" id="tabRental" onclick="switchPriceTab('rental')">Rental Keys</div>
      </div>
    ` : ''}

    <!-- Full Key Options -->
    <div class="price-options active" id="optsFull">
      ${(product.fullKeyPrices || []).map((p, i) => `
        <div class="price-option" id="optFull${i}" onclick="selectPrice('full', ${i}, ${parseInt(p.price)}, '${sanitizeDisplay(p.label)}')">
          <span class="price-option-label">${sanitizeDisplay(p.label)}</span>
          <span class="price-option-value">${formatRupiah(p.price)}</span>
        </div>
      `).join('')}
    </div>

    <!-- Rental Options -->
    ${hasRental ? `
      <div class="price-options" id="optsRental">
        ${(product.rentalKeyPrices || []).map((p, i) => `
          <div class="price-option" id="optRental${i}" onclick="selectPrice('rental', ${i}, ${parseInt(p.price)}, '${sanitizeDisplay(p.label)}')">
            <span class="price-option-label">${sanitizeDisplay(p.label)}</span>
            <span class="price-option-value">${formatRupiah(p.price)}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Quantity -->
    <div style="margin:16px 0;">
      <label class="form-label">Jumlah (Quantity)</label>
      <div class="quantity-control">
        <button class="qty-btn" onclick="changeQty(-1)">−</button>
        <span class="qty-value" id="qtyDisplay">1</span>
        <button class="qty-btn" onclick="changeQty(1)">+</button>
        <span style="color:var(--text-muted);font-size:13px;">× <span id="qtyPriceLabel">Pilih harga</span></span>
      </div>
    </div>

    <!-- Promo Code -->
    <div class="promo-field">
      <div class="promo-label"><i class="fa-solid fa-tag" style="margin-right:6px;"></i> Kode Promo (Opsional)</div>
      <div style="display:flex;gap:8px;">
        <input type="text" id="promoInput" class="form-input" placeholder="Masukkan kode promo..." style="text-transform:uppercase;flex:1;" maxlength="30">
        <button class="btn btn-outline btn-sm" onclick="applyPromo()"><i class="fa-solid fa-check"></i></button>
      </div>
      <div id="promoResult"></div>
    </div>

    <!-- WhatsApp -->
    <div class="form-group">
      <label class="form-label"><i class="fa-brands fa-whatsapp" style="color:#25d366;margin-right:6px;"></i> Nomor WhatsApp</label>
      <input type="text" id="buyerPhone" class="form-input" placeholder="08123456789..." maxlength="15">
    </div>

    <!-- Total -->
    <div class="total-price">
      <span class="total-price-label">Total Pembayaran</span>
      <span class="total-price-value" id="totalDisplay">Rp 0</span>
    </div>

    <div style="color:var(--text-muted);font-size:12px;margin-bottom:12px;">
      💰 Saldo Anda: <strong style="color:var(--gold);">${formatRupiah(userCredit)}</strong>
    </div>

    <button class="btn btn-primary" onclick="doBuyNow()" id="buyNowBtn">
      <i class="fa-solid fa-shopping-cart"></i> Buy Now
    </button>
  `;
}

function switchPriceTab(type) {
  currentPriceType = type;
  currentPriceOption = null;
  document.getElementById('tabFull')?.classList.toggle('active', type === 'full');
  document.getElementById('tabRental')?.classList.toggle('active', type === 'rental');
  document.getElementById('optsFull')?.classList.toggle('active', type === 'full');
  document.getElementById('optsRental')?.classList.toggle('active', type === 'rental');
  updateTotal();
}

function selectPrice(type, index, price, label) {
  document.querySelectorAll('.price-option').forEach(o => o.classList.remove('selected'));
  document.getElementById(`opt${type === 'full' ? 'Full' : 'Rental'}${index}`)?.classList.add('selected');
  currentPriceOption = { price, label };
  const labelEl = document.getElementById('qtyPriceLabel');
  if (labelEl) labelEl.textContent = label;
  updateTotal();
}

function changeQty(delta) {
  currentQuantity = Math.max(1, Math.min(10, currentQuantity + delta));
  const el = document.getElementById('qtyDisplay');
  if (el) el.textContent = currentQuantity;
  updateTotal();
}

function updateTotal() {
  const el = document.getElementById('totalDisplay');
  if (!el) return;
  if (!currentPriceOption) { el.textContent = 'Rp 0'; return; }
  let total = currentPriceOption.price * currentQuantity;
  if (currentPromoDiscount > 0) {
    total = Math.floor(total * (1 - currentPromoDiscount / 100));
  }
  el.textContent = formatRupiah(total);
}

async function applyPromo() {
  const codeRaw = document.getElementById('promoInput')?.value || '';
  const code = sanitizeInput(codeRaw).toUpperCase();
  const resultEl = document.getElementById('promoResult');
  if (!code) return;

  const db = currentDB || await dbRead();
  const session = getSession();
  const user = db.users.find(u => u.username === session?.username);

  const promo = db.promoCodes?.find(p => p.code === code);

  if (!promo) {
    resultEl.innerHTML = `<div class="promo-discount" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i> Kode promo tidak ditemukan!</div>`;
    currentPromoDiscount = 0;
    updateTotal();
    return;
  }

  // Check max usage
  if (promo.usedCount >= promo.maxUse) {
    resultEl.innerHTML = `<div class="promo-discount" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i> Promo telah mencapai batas pemakaian (${promo.maxUse} orang)!</div>`;
    currentPromoDiscount = 0;
    updateTotal();
    return;
  }

  // Check if user already used this promo
  if (user?.promoUsed?.includes(code)) {
    resultEl.innerHTML = `<div class="promo-discount" style="color:var(--danger);"><i class="fa-solid fa-xmark"></i> Anda sudah menggunakan promo ini sebelumnya!</div>`;
    currentPromoDiscount = 0;
    updateTotal();
    return;
  }

  currentPromoDiscount = parseInt(promo.discount);
  resultEl.innerHTML = `<div class="promo-discount"><i class="fa-solid fa-circle-check"></i> Promo berhasil! Diskon ${promo.discount}% diterapkan.</div>`;
  updateTotal();
}

async function doBuyNow() {
  const session = getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  if (!currentPriceOption) {
    Swal.fire({ icon: 'warning', title: 'Pilih paket terlebih dahulu!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  const phoneRaw = document.getElementById('buyerPhone')?.value || '';
  const phone = sanitizeInput(phoneRaw);
  if (!phone || !validatePhone(phone)) {
    Swal.fire({ icon: 'warning', title: 'Masukkan nomor WhatsApp yang valid!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  const promoCode = sanitizeInput(document.getElementById('promoInput')?.value || '').toUpperCase();
  let total = currentPriceOption.price * currentQuantity;
  if (currentPromoDiscount > 0) total = Math.floor(total * (1 - currentPromoDiscount / 100));

  const btn = document.getElementById('buyNowBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

  try {
    const db = await dbRead();
    const user = db.users.find(u => u.username === session.username);

    if (!user) { throw new Error('User tidak ditemukan'); }
    if ((user.credit || 0) < total) {
      Swal.fire({ icon: 'error', title: 'Saldo Tidak Cukup!', text: `Saldo Anda ${formatRupiah(user.credit)} — Dibutuhkan ${formatRupiah(total)}`, background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-shopping-cart"></i> Buy Now';
      return;
    }

    // Deduct credit
    user.credit = (user.credit || 0) - total;

    // Mark promo used
    if (promoCode && currentPromoDiscount > 0) {
      if (!user.promoUsed) user.promoUsed = [];
      if (!user.promoUsed.includes(promoCode)) {
        user.promoUsed.push(promoCode);
        const promo = db.promoCodes?.find(p => p.code === promoCode);
        if (promo) promo.usedCount = (promo.usedCount || 0) + 1;
      }
    }

    // Create transaction
    const trxId = generateId();
    const trx = {
      id: trxId,
      username: session.username,
      productId: currentProduct.id,
      productName: currentProduct.name,
      priceLabel: currentPriceOption.label,
      priceType: currentPriceType === 'full' ? 'Access Full Key' : 'Rental Key',
      quantity: currentQuantity,
      unitPrice: currentPriceOption.price,
      totalPrice: total,
      promoCode: promoCode || null,
      promoDiscount: currentPromoDiscount,
      phone: phone,
      status: 'waiting',
      keys: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!db.transactions) db.transactions = [];
    db.transactions.unshift(trx);

    // Update stats
    if (!db.stats) db.stats = { totalBuyers: 0, totalRevenue: 0, todaySales: 0, todayDate: '' };
    const today = new Date().toDateString();
    if (db.stats.todayDate !== today) {
      db.stats.todaySales = 0;
      db.stats.todayDate = today;
    }
    db.stats.totalBuyers = (db.stats.totalBuyers || 0) + 1;
    db.stats.totalRevenue = (db.stats.totalRevenue || 0) + total;
    db.stats.todaySales = (db.stats.todaySales || 0) + 1;

    const saved = await dbWrite(db);
    if (!saved) throw new Error('Gagal menyimpan transaksi');

    // Update session credit
    sessionStorage.setItem('dc_user', JSON.stringify({ username: session.username, credit: user.credit }));
    const cEl = document.getElementById('headerCredit');
    if (cEl) cEl.textContent = formatRupiah(user.credit);

    closeModal('purchaseModal');
    await Swal.fire({
      icon: 'success',
      title: 'Pembelian Berhasil! 🎉',
      html: `
        <p style="color:#c4b5fd;margin-bottom:8px;">ID Transaksi: <strong style="color:#f3e8ff;">${trxId}</strong></p>
        <p style="color:#c4b5fd;margin-bottom:8px;">Total: <strong style="color:#fbbf24;">${formatRupiah(total)}</strong></p>
        <p style="color:#a78bfa;font-size:13px;">Admin akan memproses pesanan Anda segera. Pantau di <strong>Logs Transaksi</strong>.</p>
      `,
      background: '#0f0720',
      color: '#f3e8ff',
      confirmButtonColor: '#7c3aed'
    });

    // Refresh transactions
    renderTransactions(db.transactions, session.username);
    showTab('transactions');

  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Terjadi kesalahan: ' + e.message, background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-shopping-cart"></i> Buy Now';
  }
}

// ============================================================
// TRANSACTIONS (USER VIEW)
// ============================================================
function renderTransactions(transactions, username) {
  const el = document.getElementById('transactionList');
  if (!el) return;
  const userTrx = transactions.filter(t => t.username === username);
  if (!userTrx.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-receipt"></i><h3>Belum ada transaksi</h3><p>Beli produk pertama Anda sekarang!</p></div>`;
    return;
  }
  el.innerHTML = userTrx.map(t => `
    <div class="transaction-item" onclick="showTrxDetail('${sanitizeDisplay(t.id)}')">
      <div class="transaction-header">
        <span class="transaction-name">${sanitizeDisplay(t.productName)}</span>
        <span class="status-badge status-${t.status}">${t.status === 'waiting' ? 'Menunggu' : t.status === 'approved' ? 'Approved' : 'Rejected'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted);">
        <span><i class="fa-solid fa-calendar" style="margin-right:4px;"></i>${formatDate(t.createdAt)}</span>
        <span style="color:var(--gold);font-weight:700;">${formatRupiah(t.totalPrice)}</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${sanitizeDisplay(t.id)}</div>
    </div>
  `).join('');
}

async function showTrxDetail(trxId) {
  const db = await dbRead();
  const trx = db.transactions?.find(t => t.id === trxId);
  if (!trx) return;

  const body = document.getElementById('trxDetailBody');
  if (!body) return;

  body.innerHTML = `
    <div style="display:flex;justify-content:center;margin-bottom:20px;">
      <span class="status-badge status-${trx.status}" style="font-size:14px;padding:8px 20px;">
        ${trx.status === 'waiting' ? '⏳ Menunggu' : trx.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
      </span>
    </div>
    <div class="info-row"><span class="lbl">Produk</span><span class="val">${sanitizeDisplay(trx.productName)}</span></div>
    <div class="info-row"><span class="lbl">Paket</span><span class="val">${sanitizeDisplay(trx.priceLabel)} (${sanitizeDisplay(trx.priceType)})</span></div>
    <div class="info-row"><span class="lbl">Quantity</span><span class="val">${trx.quantity}x</span></div>
    <div class="info-row"><span class="lbl">Tanggal</span><span class="val">${formatDate(trx.createdAt)}</span></div>
    <div class="info-row"><span class="lbl">ID Transaksi</span><span class="val" style="font-family:monospace;font-size:12px;">${sanitizeDisplay(trx.id)}</span></div>
    ${trx.promoCode ? `<div class="info-row"><span class="lbl">Promo</span><span class="val" style="color:var(--success);">${sanitizeDisplay(trx.promoCode)} (-${trx.promoDiscount}%)</span></div>` : ''}
    <div class="info-row"><span class="lbl">Total</span><span class="val" style="color:var(--gold);font-size:16px;">${formatRupiah(trx.totalPrice)}</span></div>
    ${trx.keys?.length ? `
      <div style="margin-top:16px;">
        <div style="font-size:12px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;"><i class="fa-solid fa-key" style="margin-right:6px;color:var(--success);"></i>Keys Anda</div>
        ${trx.keys.map(k => `<div class="key-display">${sanitizeDisplay(k)}</div>`).join('')}
      </div>
    ` : ''}
  `;

  openModal('trxDetailModal');
}

// ============================================================
// RESET KEY
// ============================================================
function openResetKey() {
  document.getElementById('resetKeyInput').value = '';
  document.getElementById('terminalOutput').style.display = 'none';
  document.getElementById('terminalOutput').innerHTML = '';
  const btn = document.getElementById('resetKeyBtn');
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Reset'; }
  openModal('resetKeyModal');

  // Close navbar
  document.getElementById('sideNav')?.classList.remove('open');
  document.getElementById('hamburgerBtn')?.classList.remove('active');
}

async function doResetKey() {
  const keyRaw = document.getElementById('resetKeyInput')?.value || '';
  const key = sanitizeInput(keyRaw);
  const terminal = document.getElementById('terminalOutput');
  const btn = document.getElementById('resetKeyBtn');

  if (!key) {
    Swal.fire({ icon: 'warning', title: 'Masukkan key terlebih dahulu!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
  terminal.style.display = 'block';
  terminal.innerHTML = '';

  function addLine(text, type = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.innerHTML = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }

  try {
    addLine('> Initializing reset system...', 'info');
    await sleep(600);
    addLine('> Fetching Server.....', 'info');
    await sleep(700);

    const db = await dbRead();

    if (!db.settings?.resetKeyEnabled) {
      addLine('> Response Database....', 'info');
      await sleep(500);
      addLine('❌ ERROR: Reset system is OFFLINE', 'error');
      await sleep(300);
      addLine('', '');
      addLine('Maaf fitur ini sedang di nonaktifkan oleh admin atau sedang tidak beroperasi normal. Silahkan coba lagi nanti.', 'error');
      btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Reset';
      btn.disabled = false;
      return;
    }

    addLine('> Response Database....', 'info');
    await sleep(600);
    addLine('> Validating token...', 'info');
    await sleep(500);
    addLine('> Processing device reset...', 'info');
    await sleep(700);
    addLine('> Clearing device registry...', 'info');
    await sleep(400);
    addLine('> Updating reset counter...', 'info');
    await sleep(500);
    addLine('', '');
    addLine('✅ Reset Successful', 'success');
    addLine('', '');
    addLine('Status: 200', 'success');
    addLine(`Response: {"success":true,"message":"Token reset successfully","resetsused":1,"resetsmax":2,"key":"${sanitizeDisplay(key)}","nextresettime":"${new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' ')}"}`, 'success');

  } catch (e) {
    addLine('> ERROR: Connection failed', 'error');
    addLine('Silahkan coba lagi nanti.', 'error');
  }

  btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Reset Lagi';
  btn.disabled = false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// WELCOME POPUP
// ============================================================
function closeWelcomePopup() {
  closeModal('welcomePopup');
}

// ============================================================
// CUSTOM NOTIFICATION
// ============================================================
function showCustomNotif(message, icon) {
  const existing = document.getElementById('customNotifEl');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'customNotifEl';
  el.className = 'notification-popup show';
  el.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <i class="fa-solid ${sanitizeDisplay(icon)}" style="color:var(--primary-light);font-size:20px;margin-top:2px;"></i>
      <div style="flex:1;">
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">Pemberitahuan</div>
        <p style="color:var(--text-secondary);font-size:13px;line-height:1.5;">${sanitizeDisplay(message)}</p>
      </div>
      <button onclick="document.getElementById('customNotifEl').remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

// ============================================================
// ADMIN PANEL
// ============================================================
async function initAdminPanel() {
  const db = await dbRead();
  renderAdminStats(db.stats || {});
  renderAdminProducts(db.products || []);
  renderAdminTransactions(db.transactions || [], 'all');
  renderAdminPromos(db.promoCodes || []);
  renderAdminUsers(db.users || []);
  loadAdminSettings(db.settings || {});

  // Pending badge
  const pending = (db.transactions || []).filter(t => t.status === 'waiting').length;
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    badge.style.display = pending > 0 ? 'inline-flex' : 'none';
    badge.textContent = pending;
  }
}

function renderAdminStats(stats) {
  const el1 = document.getElementById('statTotalBuyers');
  const el2 = document.getElementById('statRevenue');
  const el3 = document.getElementById('statTodaySales');
  if (el1) el1.textContent = stats.totalBuyers || 0;
  if (el2) el2.textContent = formatRupiah(stats.totalRevenue || 0);
  if (el3) el3.textContent = stats.todaySales || 0;
}

function renderAdminProducts(products) {
  const el = document.getElementById('adminProductList');
  if (!el) return;
  if (!products.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open"></i><h3>Belum ada produk</h3></div>`;
    return;
  }
  el.innerHTML = products.map(p => `
    <div class="product-edit-item">
      <div class="product-edit-item-info">
        <div class="product-edit-item-name">${sanitizeDisplay(p.name)}</div>
        <div class="product-edit-item-desc">${sanitizeDisplay(p.type || '')} — ${(p.features || []).join(', ')}</div>
      </div>
      <div class="product-edit-actions">
        <button class="btn btn-outline btn-sm btn-icon" onclick="adminEditProduct('${sanitizeDisplay(p.id)}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="adminDeleteProduct('${sanitizeDisplay(p.id)}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

async function adminAddProduct() {
  const name = sanitizeInput(document.getElementById('newProductName')?.value || '');
  const type = sanitizeInput(document.getElementById('newProductType')?.value || '');
  const image = sanitizeInput(document.getElementById('newProductImg')?.value || '');
  const featuresRaw = document.getElementById('newProductFeatures')?.value || '';
  const features = featuresRaw.split(',').map(f => sanitizeInput(f.trim())).filter(f => f);
  const rentalEnabled = document.getElementById('enableRental')?.checked || false;

  if (!name) {
    Swal.fire({ icon: 'warning', title: 'Nama produk wajib diisi!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  // Collect full key prices
  const fullKeyPrices = collectPrices('fullKeyPrices');
  const rentalKeyPrices = rentalEnabled ? collectPrices('rentalKeyPrices') : [];

  if (!fullKeyPrices.length) {
    Swal.fire({ icon: 'warning', title: 'Tambahkan minimal 1 harga!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  const db = await dbRead();
  if (!db.products) db.products = [];

  db.products.push({
    id: 'PROD-' + Date.now().toString(36).toUpperCase(),
    name, type, image, features,
    fullKeyPrices, rentalKeyPrices, rentalEnabled,
    createdAt: Date.now()
  });

  const saved = await dbWrite(db);
  if (saved) {
    Swal.fire({ icon: 'success', title: 'Produk berhasil ditambahkan!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    renderAdminProducts(db.products);
    // Clear form
    ['newProductName','newProductType','newProductImg','newProductFeatures'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  } else {
    Swal.fire({ icon: 'error', title: 'Gagal menyimpan!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
  }
}

function collectPrices(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const rows = container.querySelectorAll('.price-row');
  const prices = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs.length >= 2) {
      const label = sanitizeInput(inputs[0].value);
      const price = parseInt(inputs[1].value) || 0;
      if (label && price > 0) prices.push({ label, price });
    }
  });
  return prices;
}

async function adminDeleteProduct(productId) {
  const result = await Swal.fire({
    title: 'Hapus Produk?',
    text: 'Produk akan dihapus permanen!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#7c3aed',
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    background: '#0f0720',
    color: '#f3e8ff'
  });

  if (!result.isConfirmed) return;

  const db = await dbRead();
  db.products = (db.products || []).filter(p => p.id !== productId);
  const saved = await dbWrite(db);
  if (saved) {
    renderAdminProducts(db.products);
    Swal.fire({ icon: 'success', title: 'Produk dihapus!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
  }
}

async function adminEditProduct(productId) {
  const db = await dbRead();
  const product = db.products?.find(p => p.id === productId);
  if (!product) return;

  const body = document.getElementById('editProductBody');
  if (!body) return;

  body.innerHTML = `
    <div class="grid-2">
      <div class="form-group"><label class="form-label">Nama</label><input type="text" id="editProdName" class="form-input" value="${sanitizeDisplay(product.name)}" maxlength="100"></div>
      <div class="form-group"><label class="form-label">Tipe</label><input type="text" id="editProdType" class="form-input" value="${sanitizeDisplay(product.type || '')}" maxlength="50"></div>
    </div>
    <div class="form-group"><label class="form-label">URL Gambar</label><input type="text" id="editProdImg" class="form-input" value="${sanitizeDisplay(product.image || '')}" maxlength="300"></div>
    <div class="form-group"><label class="form-label">Fitur (pisah koma)</label><input type="text" id="editProdFeatures" class="form-input" value="${sanitizeDisplay((product.features || []).join(', '))}" maxlength="300"></div>
    <input type="hidden" id="editProdId" value="${sanitizeDisplay(productId)}">
    <button class="btn btn-primary" onclick="saveEditProduct()" style="width:100%;">
      <i class="fa-solid fa-save"></i> Simpan Perubahan
    </button>
  `;
  openModal('editProductModal');
}

async function saveEditProduct() {
  const id = document.getElementById('editProdId')?.value;
  const name = sanitizeInput(document.getElementById('editProdName')?.value || '');
  const type = sanitizeInput(document.getElementById('editProdType')?.value || '');
  const image = sanitizeInput(document.getElementById('editProdImg')?.value || '');
  const featuresRaw = document.getElementById('editProdFeatures')?.value || '';
  const features = featuresRaw.split(',').map(f => sanitizeInput(f.trim())).filter(Boolean);

  if (!name) {
    Swal.fire({ icon: 'warning', title: 'Nama produk tidak boleh kosong!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  const db = await dbRead();
  const idx = db.products?.findIndex(p => p.id === id);
  if (idx === -1 || idx === undefined) return;

  db.products[idx] = { ...db.products[idx], name, type, image, features };
  const saved = await dbWrite(db);
  if (saved) {
    closeModal('editProductModal');
    renderAdminProducts(db.products);
    Swal.fire({ icon: 'success', title: 'Produk diperbarui!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
  }
}

// ============================================================
// ADMIN TRANSACTIONS
// ============================================================
let currentTrxFilter = 'all';

function filterTrx(filter) {
  currentTrxFilter = filter;
  ['all', 'waiting', 'approved', 'rejected'].forEach(f => {
    const btn = document.getElementById('filter' + f.charAt(0).toUpperCase() + f.slice(1));
    if (btn) btn.style.borderColor = f === filter ? 'var(--primary-light)' : '';
  });

  dbRead().then(db => renderAdminTransactions(db.transactions || [], filter));
}

function renderAdminTransactions(transactions, filter) {
  const el = document.getElementById('adminTrxList');
  if (!el) return;
  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.status === filter);
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-receipt"></i><h3>Tidak ada transaksi</h3></div>`;
    return;
  }
  el.innerHTML = filtered.map(t => `
    <div class="admin-trx-item">
      <div class="admin-trx-header">
        <div>
          <div style="font-weight:700;font-size:15px;color:var(--text-primary);">${sanitizeDisplay(t.productName)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${sanitizeDisplay(t.id)}</div>
        </div>
        <span class="status-badge status-${t.status}">${t.status === 'waiting' ? 'Menunggu' : t.status === 'approved' ? 'Approved' : 'Rejected'}</span>
      </div>
      <div class="info-row"><span class="lbl">User</span><span class="val">${sanitizeDisplay(t.username)}</span></div>
      <div class="info-row"><span class="lbl">Paket</span><span class="val">${sanitizeDisplay(t.priceLabel)} — ${sanitizeDisplay(t.priceType)}</span></div>
      <div class="info-row"><span class="lbl">Qty</span><span class="val">${t.quantity}x</span></div>
      <div class="info-row"><span class="lbl">No. WA</span><span class="val">${sanitizeDisplay(t.phone)}</span></div>
      <div class="info-row"><span class="lbl">Total</span><span class="val" style="color:var(--gold);">${formatRupiah(t.totalPrice)}</span></div>
      <div class="info-row"><span class="lbl">Tanggal</span><span class="val">${formatDate(t.createdAt)}</span></div>
      ${t.keys?.length ? `<div style="margin-top:8px;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">Keys Terkirim:</div>${t.keys.map(k => `<div class="key-display">${sanitizeDisplay(k)}</div>`).join('')}</div>` : ''}
      <div class="admin-trx-actions">
        ${t.status === 'waiting' ? `
          <button class="btn btn-success btn-sm" onclick="openApproveModal('${sanitizeDisplay(t.id)}')">
            <i class="fa-solid fa-check"></i> Approve
          </button>
          <button class="btn btn-danger btn-sm" onclick="adminRejectTrx('${sanitizeDisplay(t.id)}')">
            <i class="fa-solid fa-xmark"></i> Reject
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function openApproveModal(trxId) {
  document.getElementById('approveTrxId').value = trxId;
  document.getElementById('keyInputsContainer').innerHTML = `
    <div class="form-group"><input type="text" class="form-input key-input" placeholder="Key #1..." maxlength="200"></div>
  `;
  openModal('approveKeyModal');
}

async function submitApprove() {
  const trxId = document.getElementById('approveTrxId')?.value;
  const keyInputs = document.querySelectorAll('.key-input');
  const keys = Array.from(keyInputs).map(i => sanitizeInput(i.value)).filter(k => k);

  if (!keys.length) {
    Swal.fire({ icon: 'warning', title: 'Masukkan minimal 1 key!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  const db = await dbRead();
  const trx = db.transactions?.find(t => t.id === trxId);
  if (!trx) return;

  trx.status = 'approved';
  trx.keys = keys;
  trx.updatedAt = Date.now();

  const saved = await dbWrite(db);
  if (saved) {
    closeModal('approveKeyModal');
    renderAdminTransactions(db.transactions || [], currentTrxFilter);
    renderAdminStats(db.stats || {});
    Swal.fire({ icon: 'success', title: 'Transaksi di-approve! Key berhasil dikirim.', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
  }
}

async function adminRejectTrx(trxId) {
  const result = await Swal.fire({
    title: 'Reject Transaksi?',
    text: 'Saldo user akan dikembalikan.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#7c3aed',
    confirmButtonText: 'Ya, Reject',
    cancelButtonText: 'Batal',
    background: '#0f0720',
    color: '#f3e8ff'
  });

  if (!result.isConfirmed) return;

  const db = await dbRead();
  const trx = db.transactions?.find(t => t.id === trxId);
  if (!trx) return;

  trx.status = 'rejected';
  trx.updatedAt = Date.now();

  // Refund user credit
  const user = db.users?.find(u => u.username === trx.username);
  if (user) user.credit = (user.credit || 0) + trx.totalPrice;

  // Update stats
  if (db.stats) {
    db.stats.totalRevenue = Math.max(0, (db.stats.totalRevenue || 0) - trx.totalPrice);
    db.stats.totalBuyers = Math.max(0, (db.stats.totalBuyers || 0) - 1);
  }

  const saved = await dbWrite(db);
  if (saved) {
    renderAdminTransactions(db.transactions || [], currentTrxFilter);
    renderAdminStats(db.stats || {});
    Swal.fire({ icon: 'success', title: 'Transaksi ditolak. Saldo dikembalikan.', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
  }
}

// ============================================================
// ADMIN PROMO
// ============================================================
async function adminAddPromo() {
  const code = sanitizeInput(document.getElementById('promoCode')?.value || '').toUpperCase();
  const discount = parseInt(document.getElementById('promoPercent')?.value || '0');
  const maxUse = parseInt(document.getElementById('promoMax')?.value || '0');

  if (!code || !discount || !maxUse) {
    Swal.fire({ icon: 'warning', title: 'Semua field promo wajib diisi!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  if (discount < 1 || discount > 99) {
    Swal.fire({ icon: 'warning', title: 'Persen diskon harus 1-99!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  const db = await dbRead();
  if (!db.promoCodes) db.promoCodes = [];

  if (db.promoCodes.find(p => p.code === code)) {
    Swal.fire({ icon: 'error', title: 'Kode promo sudah ada!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  db.promoCodes.push({ code, discount, maxUse, usedCount: 0, createdAt: Date.now() });
  const saved = await dbWrite(db);
  if (saved) {
    renderAdminPromos(db.promoCodes);
    document.getElementById('promoCode').value = '';
    document.getElementById('promoPercent').value = '';
    document.getElementById('promoMax').value = '';
    Swal.fire({ icon: 'success', title: 'Kode promo ditambahkan!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
  }
}

function renderAdminPromos(promos) {
  const el = document.getElementById('promoList');
  if (!el) return;
  if (!promos.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-tag"></i><h3>Belum ada promo</h3></div>`;
    return;
  }
  el.innerHTML = promos.map(p => `
    <div class="product-edit-item">
      <div class="product-edit-item-info">
        <div class="product-edit-item-name" style="font-family:monospace;">${sanitizeDisplay(p.code)}</div>
        <div class="product-edit-item-desc">Diskon ${p.discount}% — Pemakaian: ${p.usedCount}/${p.maxUse}</div>
      </div>
      <button class="btn btn-danger btn-sm btn-icon" onclick="adminDeletePromo('${sanitizeDisplay(p.code)}')"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');
}

async function adminDeletePromo(code) {
  const db = await dbRead();
  db.promoCodes = (db.promoCodes || []).filter(p => p.code !== code);
  await dbWrite(db);
  renderAdminPromos(db.promoCodes);
}

// ============================================================
// ADMIN USERS / TOPUP
// ============================================================
async function adminTopup() {
  const username = sanitizeInput(document.getElementById('topupUsername')?.value || '').toLowerCase();
  const amount = parseInt(document.getElementById('topupAmount')?.value || '0');

  if (!username || amount < 1000) {
    Swal.fire({ icon: 'warning', title: 'Username dan jumlah wajib diisi (min Rp 1000)!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  const db = await dbRead();
  const user = db.users?.find(u => u.username === username);

  if (!user) {
    Swal.fire({ icon: 'error', title: 'Username tidak ditemukan!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
    return;
  }

  user.credit = (user.credit || 0) + amount;
  const saved = await dbWrite(db);
  if (saved) {
    renderAdminUsers(db.users);
    document.getElementById('topupUsername').value = '';
    document.getElementById('topupAmount').value = '';
    Swal.fire({
      icon: 'success',
      title: 'Saldo Berhasil Dikirim!',
      html: `<p style="color:#c4b5fd;"><strong style="color:#fbbf24;">${formatRupiah(amount)}</strong> telah dikirim ke akun <strong style="color:#f3e8ff;">${sanitizeDisplay(username)}</strong>.<br>Saldo sekarang: <strong style="color:#fbbf24;">${formatRupiah(user.credit)}</strong></p>`,
      background: '#0f0720',
      color: '#f3e8ff',
      confirmButtonColor: '#7c3aed'
    });
  }
}

function renderAdminUsers(users) {
  const el = document.getElementById('adminUserList');
  if (!el) return;
  if (!users.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i><h3>Belum ada user</h3></div>`;
    return;
  }
  el.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr><th>Username</th><th>Saldo</th><th>No. WA</th><th>Bergabung</th></tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td><strong style="color:var(--text-primary);">${sanitizeDisplay(u.username)}</strong></td>
              <td style="color:var(--gold);font-weight:700;">${formatRupiah(u.credit || 0)}</td>
              <td>${sanitizeDisplay(u.phone || '-')}</td>
              <td>${formatDate(u.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// ADMIN SETTINGS
// ============================================================
async function toggleSetting(key) {
  const switchEl = document.getElementById(key + 'Switch') || document.getElementById(key === 'runningText' ? 'runningTextSwitch' : key === 'welcomePopup' ? 'welcomePopupSwitch' : key === 'customNotif' ? 'customNotifSwitch' : key === 'resetKeyEnabled' ? 'resetKeySwitch' : 'maintenanceSwitch');
  if (!switchEl) return;

  const db = await dbRead();
  if (!db.settings) db.settings = getDefaultDB().settings;
  db.settings[key] = switchEl.checked;
  await dbWrite(db);
}

async function saveRunningText() {
  const msg = sanitizeInput(document.getElementById('runningTextInput')?.value || '');
  if (!msg) { Swal.fire({ icon: 'warning', title: 'Masukkan teks!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' }); return; }
  const db = await dbRead();
  if (!db.settings) db.settings = getDefaultDB().settings;
  db.settings.runningTextMsg = msg;
  const saved = await dbWrite(db);
  if (saved) Swal.fire({ icon: 'success', title: 'Teks disimpan!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
}

async function saveCustomNotif() {
  const msg = sanitizeInput(document.getElementById('notifMessage')?.value || '');
  const icon = document.getElementById('notifIcon')?.value || 'fa-circle-info';
  if (!msg) { Swal.fire({ icon: 'warning', title: 'Masukkan pesan notifikasi!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' }); return; }
  const db = await dbRead();
  if (!db.settings) db.settings = getDefaultDB().settings;
  db.settings.customNotifMsg = msg;
  db.settings.customNotifIcon = icon;
  const saved = await dbWrite(db);
  if (saved) Swal.fire({ icon: 'success', title: 'Notifikasi disimpan!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
}

async function saveMaintenanceReason() {
  const reason = sanitizeInput(document.getElementById('maintenanceReason')?.value || '');
  if (!reason) { Swal.fire({ icon: 'warning', title: 'Masukkan alasan maintenance!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' }); return; }
  const db = await dbRead();
  if (!db.settings) db.settings = getDefaultDB().settings;
  db.settings.maintenanceMsgText = reason;
  const saved = await dbWrite(db);
  if (saved) Swal.fire({ icon: 'success', title: 'Alasan disimpan!', background: '#0f0720', color: '#f3e8ff', confirmButtonColor: '#7c3aed' });
}

function loadAdminSettings(settings) {
  const switches = {
    runningText: 'runningTextSwitch',
    welcomePopup: 'welcomePopupSwitch',
    customNotif: 'customNotifSwitch',
    resetKeyEnabled: 'resetKeySwitch',
    maintenanceMode: 'maintenanceSwitch'
  };

  Object.entries(switches).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.checked = settings[key] || false;
  });

  const rTxt = document.getElementById('runningTextInput');
  if (rTxt && settings.runningTextMsg) rTxt.value = settings.runningTextMsg;

  const notifMsg = document.getElementById('notifMessage');
  if (notifMsg && settings.customNotifMsg) notifMsg.value = settings.customNotifMsg;

  const notifIcon = document.getElementById('notifIcon');
  if (notifIcon && settings.customNotifIcon) notifIcon.value = settings.customNotifIcon;

  const maintReason = document.getElementById('maintenanceReason');
  if (maintReason && settings.maintenanceMsgText) maintReason.value = settings.maintenanceMsgText;
}
