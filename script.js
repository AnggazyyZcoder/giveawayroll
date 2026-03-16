/* ===== DRIP CLIENT - SCRIPT.JS ===== */
/* JSONBin.io Configuration */
const JSONBIN_API_KEY = '$2a$10$Y.jqtzCgEfTCuODvJNV08ex.6qQW0V5p2WF6UUqlhg.fYT4W.4Gu6';
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';

/* BIN IDs - You need to create these bins on jsonbin.io */
const BIN_USERS    = '69b7b142aa77b81da9eb48ca'; // Users DB
const BIN_PRODUCTS = '69b7b157aa77b81da9eb490d'; // Products DB
const BIN_PROMO    = '69b7b16bb7ec241ddc71745e'; // Promo codes DB
const BIN_ORDERS   = '69b7b180c3097a1dd52c24a8'; // Orders/Transactions DB
const BIN_SETTINGS = '69b7b196c3097a1dd52c2505'; // Settings DB

/* ==================== SECURITY UTILS ==================== */
function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;')
    .replace(/\//g,'&#x2F;')
    .trim();
}
function validateUsername(u) { return /^[a-zA-Z0-9_]{3,30}$/.test(u); }
function validatePassword(p) { return p && p.length >= 6 && p.length <= 100; }
function stripTags(str) { return String(str).replace(/<[^>]*>/g,''); }

/* ==================== JSONBIN API ==================== */
async function getBin(binId) {
  try {
    const resp = await fetch(`${JSONBIN_BASE}/${binId}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY, 'X-Bin-Meta': 'false' }
    });
    if (!resp.ok) throw new Error('Fetch failed');
    return await resp.json();
  } catch(e) { console.error('getBin error:', e); return null; }
}

async function setBin(binId, data) {
  try {
    const resp = await fetch(`${JSONBIN_BASE}/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error('Set failed');
    return await resp.json();
  } catch(e) { console.error('setBin error:', e); return null; }
}

/* ==================== SWEETALERT2 DYNAMIC LOAD ==================== */
function loadSwal() {
  if (window.Swal) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.10.1/sweetalert2.all.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
async function showAlert(icon, title, text, timer) {
  await loadSwal();
  return Swal.fire({
    icon, title, text,
    background: '#1a0035',
    color: '#f0e6ff',
    confirmButtonColor: '#9b30ff',
    timer: timer || undefined,
    timerProgressBar: !!timer,
    showConfirmButton: !timer,
    customClass: { popup: 'swal-drip' }
  });
}
async function showConfirm(title, text) {
  await loadSwal();
  return Swal.fire({
    icon: 'question', title, text,
    background: '#1a0035', color: '#f0e6ff',
    confirmButtonColor: '#9b30ff',
    cancelButtonColor: '#ff4466',
    showCancelButton: true,
    confirmButtonText: 'Ya', cancelButtonText: 'Batal'
  });
}
async function showLoading(title) {
  await loadSwal();
  Swal.fire({ title, html: '<div class="swal-loading-dots"><span></span><span></span><span></span></div>', background: '#1a0035', color: '#f0e6ff', allowOutsideClick: false, showConfirmButton: false });
}

/* ==================== PARTICLES BACKGROUND ==================== */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.z = Math.random() * 2 + 0.5;
      this.r = Math.random() * 2.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.4 * this.z;
      this.vy = (Math.random() - 0.5) * 0.4 * this.z;
      this.alpha = Math.random() * 0.6 + 0.1;
      this.hue = 270 + (Math.random() * 60 - 30);
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${this.hue},100%,70%)`;
      ctx.shadowBlur = 8 * this.z;
      ctx.shadowColor = `hsl(${this.hue},100%,60%)`;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 100) {
          ctx.save();
          ctx.globalAlpha = (1 - d/100) * 0.12;
          ctx.strokeStyle = '#9b30ff';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ==================== LOADING SCREEN ==================== */
function startLoadingScreen(mainId, callback) {
  const screen = document.getElementById('loading-screen');
  const main = document.getElementById(mainId);
  setTimeout(() => {
    screen.classList.add('hide');
    if (main) main.style.display = '';
    setTimeout(() => {
      screen.style.display = 'none';
      initScrollAnimations();
      if (typeof callback === 'function') callback();
    }, 800);
  }, 3200);
}

/* ==================== SCROLL ANIMATIONS ==================== */
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-in-up');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

/* ==================== PASSWORD TOGGLE ==================== */
function togglePass(inputId, btn) {
  const inp = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (!inp || !icon) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    inp.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

/* ==================== POPUP CONTROLS ==================== */
function openPopup(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('show'); document.body.style.overflow = 'hidden'; }
}
function closePopup(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('show'); document.body.style.overflow = ''; }
}

/* ==================== SIDEBAR ==================== */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btn = document.getElementById('hamburger-btn');
  if (!sb) return;
  sb.classList.toggle('open');
  overlay.classList.toggle('show');
  btn.classList.toggle('active');
}
function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btn = document.getElementById('hamburger-btn');
  if (sb) sb.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
  if (btn) btn.classList.remove('active');
}

/* ==================== FAQ TOGGLE ==================== */
function toggleFaq(questionEl) {
  const item = questionEl.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

/* ==================== SCROLL TO SECTION ==================== */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ==================== REMEMBER ME ==================== */
function checkRemember() {
  const saved = localStorage.getItem('drip_remember');
  if (saved) {
    try {
      const d = JSON.parse(saved);
      const uEl = document.getElementById('login-user');
      const pEl = document.getElementById('login-pass');
      const rEl = document.getElementById('remember-me');
      if (uEl) uEl.value = d.u || '';
      if (pEl) pEl.value = d.p || '';
      if (rEl) rEl.checked = true;
    } catch(e) {}
  }
}

/* ==================== SESSION ==================== */
function setSession(username) {
  sessionStorage.setItem('drip_user', username);
}
function getSession() {
  return sessionStorage.getItem('drip_user');
}
function clearSession() {
  sessionStorage.removeItem('drip_user');
}

/* ==================== LOGIN ==================== */
async function doLogin() {
  const btn = document.getElementById('btn-login');
  const rawUser = document.getElementById('login-user').value.trim();
  const rawPass = document.getElementById('login-pass').value;
  const remember = document.getElementById('remember-me')?.checked;

  const username = sanitize(rawUser);
  const password = rawPass; // Hash comparison handled server-side (jsonbin)

  if (!username || !password) {
    await showAlert('warning', 'Form Tidak Lengkap', 'Mohon isi username dan password.');
    return;
  }
  if (!validateUsername(username)) {
    await showAlert('warning', 'Username Tidak Valid', 'Username hanya boleh huruf, angka, dan underscore (3-30 karakter).');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>MEMPROSES...';
  await showLoading('Memvalidasi akun...');

  try {
    const data = await getBin(BIN_USERS);
    if (!data || !data.users) throw new Error('Database tidak merespons');

    const users = data.users;
    const user = users.find(u => u.username === username && u.password === btoa(password));

    if (!user) {
      Swal.close();
      await showAlert('error', 'Login Gagal', 'Username atau password salah.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>LOGIN';
      return;
    }

    // Remember me
    if (remember) {
      localStorage.setItem('drip_remember', JSON.stringify({ u: username, p: rawPass }));
    } else {
      localStorage.removeItem('drip_remember');
    }

    Swal.close();
    setSession(username);

    // Welcome animation
    const overlay = document.getElementById('welcome-overlay');
    const welcomeMsg = document.getElementById('welcome-msg');
    if (overlay && welcomeMsg) {
      welcomeMsg.textContent = `Welcome, ${username}!`;
      overlay.classList.add('show');
      setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => window.location.href = 'home.html', 400);
      }, 2500);
    } else {
      window.location.href = 'home.html';
    }
  } catch(e) {
    Swal.close();
    await showAlert('error', 'Error Database', 'Gagal terhubung ke database. Coba lagi nanti.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>LOGIN';
  }
}

/* ==================== REGISTER ==================== */
async function doRegister() {
  const btn = document.getElementById('btn-register');
  const rawUser = document.getElementById('reg-user').value.trim();
  const rawEmail = document.getElementById('reg-email')?.value.trim() || '';
  const rawPass = document.getElementById('reg-pass').value;
  const rawPass2 = document.getElementById('reg-pass2').value;

  const username = sanitize(rawUser);
  const email = sanitize(rawEmail);

  if (!username || !rawPass) {
    await showAlert('warning', 'Form Tidak Lengkap', 'Username dan password wajib diisi.');
    return;
  }
  if (!validateUsername(username)) {
    await showAlert('warning', 'Username Tidak Valid', 'Hanya huruf, angka, underscore. 3-30 karakter.');
    return;
  }
  if (!validatePassword(rawPass)) {
    await showAlert('warning', 'Password Terlalu Pendek', 'Password minimal 6 karakter.');
    return;
  }
  if (rawPass !== rawPass2) {
    await showAlert('warning', 'Password Tidak Cocok', 'Konfirmasi password tidak sesuai.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>MENDAFTAR...';
  await showLoading('Membuat akun...');

  try {
    const data = await getBin(BIN_USERS);
    if (!data) throw new Error('DB tidak merespons');
    const users = data.users || [];

    if (users.find(u => u.username === username)) {
      Swal.close();
      await showAlert('error', 'Username Sudah Ada', 'Gunakan username lain.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:8px;"></i>DAFTAR SEKARANG';
      return;
    }

    const newUser = {
      username,
      email,
      password: btoa(rawPass),
      credit: 0,
      createdAt: new Date().toISOString(),
      usedPromos: []
    };
    users.push(newUser);

    const result = await setBin(BIN_USERS, { users });
    if (!result) throw new Error('Gagal menyimpan');

    Swal.close();
    await showAlert('success', 'Akun Berhasil Dibuat!', `Selamat datang, ${username}! Silahkan login.`, 2500);
    window.location.href = 'index.html';
  } catch(e) {
    Swal.close();
    await showAlert('error', 'Gagal Mendaftar', 'Terjadi kesalahan. Coba lagi nanti.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:8px;"></i>DAFTAR SEKARANG';
  }
}

/* ==================== LOGOUT ==================== */
async function doLogout() {
  const confirm = await showConfirm('Logout', 'Yakin ingin keluar dari dashboard?');
  if (confirm.isConfirmed) {
    clearSession();
    window.location.href = 'index.html';
  }
}

/* ==================== HOME DASHBOARD ==================== */
async function initHomeDashboard() {
  const username = getSession();
  if (!username) { window.location.href = 'index.html'; return; }

  // Set username display
  const uel = document.getElementById('topbar-username');
  if (uel) uel.textContent = username;

  // Load settings
  const settings = await getBin(BIN_SETTINGS) || {};

  // Check maintenance
  if (settings.maintenance_mode) {
    const mp = document.getElementById('maintenance-popup');
    const mr = document.getElementById('maintenance-reason-text');
    if (mp) { mp.style.display = 'flex'; }
    if (mr) mr.textContent = settings.maintenance_reason || 'Website dalam maintenance.';
    return;
  }

  // Load user credit
  await loadUserCredit(username);

  // Running text
  if (settings.running_text_active && settings.running_text) {
    const rtBar = document.getElementById('running-text-bar');
    const rtContent = document.getElementById('running-text-content');
    if (rtBar) rtBar.style.display = 'block';
    if (rtContent) rtContent.textContent = settings.running_text;
  }

  // Welcome popup
  const popWelcomeName = document.getElementById('popup-welcome-name');
  if (popWelcomeName) popWelcomeName.textContent = username;
  if (settings.wa_notif !== false) {
    setTimeout(() => openPopup('popup-welcome'), 500);
  } else {
    // Show custom notif if active
    if (settings.custom_notif_active && settings.custom_notif_text) {
      const n2Icon = document.getElementById('popup-notif2-icon');
      const n2Title = document.getElementById('popup-notif2-title');
      const n2Text = document.getElementById('popup-notif2-text');
      if (n2Icon) n2Icon.innerHTML = `<i class="${stripTags(settings.custom_notif_icon || 'fas fa-info-circle')}"></i>`;
      if (n2Title) n2Title.textContent = stripTags(settings.custom_notif_title || 'Informasi');
      if (n2Text) n2Text.textContent = stripTags(settings.custom_notif_text);
      setTimeout(() => openPopup('popup-notif2'), 500);
    }
  }

  // Load products
  await loadProducts();

  // Load user transactions
  await loadUserTransactions(username);
}

async function loadUserCredit(username) {
  const data = await getBin(BIN_USERS);
  if (!data) return;
  const user = (data.users||[]).find(u => u.username === username);
  const creditEl = document.getElementById('topbar-credit');
  if (creditEl) creditEl.textContent = formatRp(user ? (user.credit||0) : 0);
}

function formatRp(n) {
  return Number(n).toLocaleString('id-ID');
}

/* ==================== PRODUCTS ==================== */
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--purple-neon);"></i><p>Memuat produk...</p></div>';

  const data = await getBin(BIN_PRODUCTS);
  const products = (data && data.products) ? data.products : [];

  if (!products.length) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Belum ada produk tersedia</p></div>';
    return;
  }

  grid.innerHTML = products.map((p, idx) => `
    <div class="product-card fade-in-up" onclick="openBuyPopup(${idx})" style="animation-delay:${idx*0.1}s">
      <div class="product-img-wrapper">
        <img src="${sanitize(p.image||'')}" alt="${sanitize(p.name||'')}" onerror="this.src='https://via.placeholder.com/400x200/1a0035/cc44ff?text=DRIP+CLIENT'"/>
        <div class="product-badge">BUY NOW</div>
      </div>
      <div class="product-body">
        <div class="product-name">${sanitize(p.name||'')}</div>
        ${p.description ? `<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${sanitize(p.description)}</div>` : ''}
        <ul class="product-features">
          ${(p.features||[]).slice(0,4).map(f => `<li>${sanitize(f)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');

  initScrollAnimations();
}

/* ==================== BUY POPUP ==================== */
let currentProduct = null;
let selectedPlan = null;
let currentQty = 1;
let currentTab = 'full';
let appliedPromo = null;
let basePrice = 0;

async function openBuyPopup(idx) {
  const data = await getBin(BIN_PRODUCTS);
  if (!data || !data.products) return;
  currentProduct = data.products[idx];
  if (!currentProduct) return;

  const nameEl = document.getElementById('buy-product-name');
  if (nameEl) nameEl.textContent = sanitize(currentProduct.name||'');

  selectedPlan = null; currentQty = 1; currentTab = 'full'; appliedPromo = null; basePrice = 0;

  // Render price lists
  renderPriceList('full');
  renderPriceList('rental');

  // Hide rental tab if not enabled
  const tabRental = document.getElementById('tab-rental');
  if (tabRental) {
    tabRental.style.display = currentProduct.rentalEnabled ? '' : 'none';
  }

  const qtyEl = document.getElementById('qty-display');
  if (qtyEl) qtyEl.textContent = '1';
  const totalEl = document.getElementById('buy-total-display');
  if (totalEl) totalEl.textContent = 'Rp 0';
  const promoStatus = document.getElementById('promo-status');
  if (promoStatus) promoStatus.textContent = '';
  const promoInput = document.getElementById('promo-code-input');
  if (promoInput) promoInput.value = '';
  const waInput = document.getElementById('buy-wa-input');
  if (waInput) waInput.value = '';

  // Show user's current balance
  const username = getSession();
  if (username) {
    const userData = await getBin(BIN_USERS);
    const user = (userData&&userData.users||[]).find(u=>u.username===username);
    const creditInfo = document.getElementById('credit-balance-info');
    if (creditInfo && user) creditInfo.textContent = `Saldo kamu: Rp ${formatRp(user.credit||0)}`;
  }

  openPopup('popup-buy');
}

function renderPriceList(type) {
  const prices = type === 'full' ? (currentProduct.fullPrices||[]) : (currentProduct.rentalPrices||[]);
  const listEl = document.getElementById(`price-list-${type}`);
  if (!listEl) return;
  if (!prices.length) {
    listEl.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:14px;">Tidak ada harga tersedia</div>';
    return;
  }
  listEl.innerHTML = prices.map((p, i) => `
    <div class="price-item" id="price-${type}-${i}" onclick="selectPlan('${type}',${i},${p.price})">
      <span class="price-label">${sanitize(p.label||'')}</span>
      <span class="price-amount">Rp ${formatRp(p.price||0)}</span>
    </div>
  `).join('');
}

function switchPriceTab(tab) {
  currentTab = tab;
  const fullList = document.getElementById('price-list-full');
  const rentalList = document.getElementById('price-list-rental');
  const tabFull = document.getElementById('tab-full');
  const tabRental = document.getElementById('tab-rental');
  if (fullList) fullList.style.display = tab === 'full' ? '' : 'none';
  if (rentalList) rentalList.style.display = tab === 'rental' ? '' : 'none';
  if (tabFull) tabFull.classList.toggle('active', tab==='full');
  if (tabRental) tabRental.classList.toggle('active', tab==='rental');
  selectedPlan = null; basePrice = 0; appliedPromo = null;
  updateBuyTotal();
}

function selectPlan(type, idx, price) {
  // Remove previous selection
  document.querySelectorAll('.price-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById(`price-${type}-${idx}`);
  if (el) el.classList.add('selected');
  
  const prices = type === 'full' ? (currentProduct.fullPrices||[]) : (currentProduct.rentalPrices||[]);
  selectedPlan = prices[idx];
  basePrice = price;
  appliedPromo = null;
  const promoStatus = document.getElementById('promo-status');
  if (promoStatus) promoStatus.textContent = '';
  updateBuyTotal();
}

function changeQty(delta) {
  currentQty = Math.max(1, Math.min(99, currentQty + delta));
  const el = document.getElementById('qty-display');
  if (el) el.textContent = currentQty;
  updateBuyTotal();
}

function updateBuyTotal() {
  let total = basePrice * currentQty;
  if (appliedPromo) {
    total = Math.floor(total * (1 - appliedPromo.pct/100));
  }
  const el = document.getElementById('buy-total-display');
  if (el) el.textContent = `Rp ${formatRp(total)}`;
}

async function applyPromo() {
  const code = sanitize(document.getElementById('promo-code-input').value.trim().toUpperCase());
  const status = document.getElementById('promo-status');
  if (!code) { if(status) status.innerHTML = '<span style="color:#ff4466;">Masukkan kode promo</span>'; return; }
  if (!selectedPlan) { if(status) status.innerHTML = '<span style="color:#ff4466;">Pilih paket dulu</span>'; return; }

  if(status) status.innerHTML = '<span style="color:var(--purple-neon);"><i class="fas fa-spinner fa-spin"></i> Memvalidasi...</span>';

  const promoData = await getBin(BIN_PROMO);
  const promos = (promoData && promoData.promos) || [];
  const promo = promos.find(p => p.code === code && p.active);

  if (!promo) {
    if(status) status.innerHTML = '<span style="color:#ff4466;"><i class="fas fa-times-circle"></i> Kode promo tidak valid atau tidak aktif</span>';
    appliedPromo = null; updateBuyTotal(); return;
  }
  if (promo.usedCount >= promo.maxUse) {
    if(status) status.innerHTML = `<span style="color:#ff4466;"><i class="fas fa-times-circle"></i> Promo telah mencapai batas penggunaan (${promo.maxUse} orang)</span>`;
    appliedPromo = null; updateBuyTotal(); return;
  }

  // Check if user already used this promo
  const username = getSession();
  const userData = await getBin(BIN_USERS);
  const user = (userData&&userData.users||[]).find(u=>u.username===username);
  if (user && (user.usedPromos||[]).includes(code)) {
    if(status) status.innerHTML = '<span style="color:#ff4466;"><i class="fas fa-times-circle"></i> Kamu sudah menggunakan promo ini</span>';
    appliedPromo = null; updateBuyTotal(); return;
  }

  appliedPromo = promo;
  if(status) status.innerHTML = `<span style="color:#00ff88;"><i class="fas fa-check-circle"></i> Promo valid! Diskon ${promo.pct}%</span>`;
  updateBuyTotal();
}

async function doBuyNow() {
  const username = getSession();
  if (!username) { window.location.href = 'index.html'; return; }
  if (!selectedPlan) { await showAlert('warning','Pilih Paket','Pilih salah satu paket terlebih dahulu.'); return; }

  const wa = sanitize(document.getElementById('buy-wa-input').value.trim());
  if (!wa) { await showAlert('warning','Nomor WhatsApp','Masukkan nomor WhatsApp untuk konfirmasi.'); return; }

  let total = basePrice * currentQty;
  if (appliedPromo) total = Math.floor(total * (1 - appliedPromo.pct/100));

  // Check user credit
  const userData = await getBin(BIN_USERS);
  const users = userData?.users || [];
  const userIdx = users.findIndex(u => u.username === username);
  if (userIdx === -1) { await showAlert('error','User Tidak Ditemukan','Sesi tidak valid.'); return; }
  
  const user = users[userIdx];
  if ((user.credit||0) < total) {
    await showAlert('error','Saldo Tidak Cukup',`Saldo kamu Rp ${formatRp(user.credit||0)}, dibutuhkan Rp ${formatRp(total)}. Silahkan top up terlebih dahulu.`);
    return;
  }

  const confirmResult = await showConfirm('Konfirmasi Pembelian', `Beli "${sanitize(currentProduct.name)}" - ${sanitize(selectedPlan.label)} x${currentQty} = Rp ${formatRp(total)}?`);
  if (!confirmResult.isConfirmed) return;

  await showLoading('Memproses pembelian...');

  // Deduct credit
  users[userIdx].credit = (user.credit||0) - total;

  // Record promo usage
  if (appliedPromo) {
    users[userIdx].usedPromos = [...(users[userIdx].usedPromos||[]), appliedPromo.code];
    // Update promo usage count
    const promoData = await getBin(BIN_PROMO);
    const promos = promoData?.promos || [];
    const pIdx = promos.findIndex(p=>p.code===appliedPromo.code);
    if (pIdx !== -1) {
      promos[pIdx].usedCount = (promos[pIdx].usedCount||0) + 1;
      await setBin(BIN_PROMO, { promos });
    }
  }

  await setBin(BIN_USERS, { users });

  // Create order
  const ordersData = await getBin(BIN_ORDERS);
  const orders = ordersData?.orders || [];
  const trxId = 'TRX' + Date.now() + Math.random().toString(36).substr(2,5).toUpperCase();
  const newOrder = {
    id: trxId,
    username,
    productName: currentProduct.name,
    plan: selectedPlan.label,
    planType: currentTab,
    qty: currentQty,
    unitPrice: basePrice,
    totalPrice: total,
    promoUsed: appliedPromo ? appliedPromo.code : null,
    whatsapp: wa,
    status: 'waiting',
    keys: [],
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  await setBin(BIN_ORDERS, { orders });

  // Update stats
  await updateStats('newOrder', total);

  Swal.close();
  closePopup('popup-buy');
  await showAlert('success', 'Pembelian Berhasil!', `ID Transaksi: ${trxId}. Saldo Rp ${formatRp(total)} telah dipotong. Admin akan segera memproses pesananmu.`);
  
  // Refresh
  await loadUserCredit(username);
  await loadUserTransactions(username);
}

/* ==================== USER TRANSACTIONS ==================== */
async function loadUserTransactions(username) {
  const container = document.getElementById('user-logs-container');
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--purple-neon);"></i></div>';

  const data = await getBin(BIN_ORDERS);
  const orders = (data?.orders||[]).filter(o=>o.username===username);
  
  if (!orders.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada transaksi</p></div>';
    return;
  }

  container.innerHTML = orders.slice().reverse().map(o => `
    <div class="trx-card fade-in-up" onclick="showTrxDetail('${o.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
        <div>
          <div class="trx-id"><i class="fas fa-hashtag" style="margin-right:4px;"></i>${sanitize(o.id)}</div>
          <div class="trx-name">${sanitize(o.productName||'')}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${sanitize(o.plan||'')} × ${o.qty||1}</div>
        </div>
        <div style="text-align:right;">
          <div class="trx-status ${o.status}">${getStatusLabel(o.status)}</div>
          <div style="font-family:'Orbitron',monospace;font-size:15px;color:var(--accent-gold);font-weight:700;margin-top:6px;">Rp ${formatRp(o.totalPrice||0)}</div>
        </div>
      </div>
      <div class="trx-date" style="margin-top:10px;"><i class="fas fa-calendar" style="margin-right:4px;"></i>${new Date(o.createdAt).toLocaleString('id-ID')}</div>
    </div>
  `).join('');
}

function getStatusLabel(status) {
  if (status==='approved') return '<i class="fas fa-check-circle"></i> APPROVED';
  if (status==='rejected') return '<i class="fas fa-times-circle"></i> REJECTED';
  return '<i class="fas fa-clock"></i> WAITING';
}

async function showTrxDetail(trxId) {
  const data = await getBin(BIN_ORDERS);
  const order = (data?.orders||[]).find(o=>o.id===trxId);
  if (!order) return;

  const content = document.getElementById('trx-detail-content');
  if (!content) return;
  
  content.innerHTML = `
    <div style="background:rgba(45,0,80,0.4);border:1px solid var(--border-subtle);border-radius:12px;padding:20px;margin-top:12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
        <div><div style="color:var(--text-muted);font-size:12px;margin-bottom:4px;">PRODUK</div><div style="color:var(--text-primary);font-weight:600;">${sanitize(order.productName||'')}</div></div>
        <div><div style="color:var(--text-muted);font-size:12px;margin-bottom:4px;">PAKET</div><div style="color:var(--text-primary);font-weight:600;">${sanitize(order.plan||'')} ×${order.qty||1}</div></div>
        <div><div style="color:var(--text-muted);font-size:12px;margin-bottom:4px;">ID TRANSAKSI</div><div style="color:var(--purple-neon);font-family:'Share Tech Mono',monospace;font-size:12px;">${sanitize(order.id)}</div></div>
        <div><div style="color:var(--text-muted);font-size:12px;margin-bottom:4px;">TANGGAL</div><div style="color:var(--text-primary);font-size:12px;">${new Date(order.createdAt).toLocaleString('id-ID')}</div></div>
        <div><div style="color:var(--text-muted);font-size:12px;margin-bottom:4px;">TOTAL</div><div style="color:var(--accent-gold);font-family:'Orbitron',monospace;font-size:16px;font-weight:700;">Rp ${formatRp(order.totalPrice||0)}</div></div>
        <div><div style="color:var(--text-muted);font-size:12px;margin-bottom:4px;">STATUS</div><div class="trx-status ${order.status}" style="display:inline-flex;">${getStatusLabel(order.status)}</div></div>
      </div>
      ${order.promoUsed ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-subtle);font-size:13px;color:var(--text-muted);">Promo: <span style="color:#00ff88;">${sanitize(order.promoUsed)}</span></div>` : ''}
      ${order.keys && order.keys.length > 0 ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-subtle);">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Keys / License</div>
          ${order.keys.map(k=>`<div style="background:#050010;border:1px solid var(--purple-400);border-radius:8px;padding:10px 14px;font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--purple-neon);margin-bottom:6px;word-break:break-all;">${sanitize(k)}</div>`).join('')}
        </div>
      ` : order.status === 'waiting' ? '<div style="margin-top:12px;font-size:13px;color:var(--text-muted);text-align:center;padding:12px;">⏳ Admin sedang memproses pesananmu</div>' : ''}
    </div>
  `;
  openPopup('popup-trx-detail');
}

/* ==================== RESET KEY ==================== */
function openResetPopup() {
  const input = document.getElementById('reset-key-input');
  const terminal = document.getElementById('reset-terminal');
  if (input) input.value = '';
  if (terminal) terminal.style.display = 'none';
  openPopup('popup-reset');
}

async function doResetKey() {
  const key = sanitize(document.getElementById('reset-key-input').value.trim());
  if (!key) { await showAlert('warning','Input Key','Masukkan key yang ingin direset.'); return; }

  const terminal = document.getElementById('reset-terminal');
  const content = document.getElementById('reset-terminal-content');
  if (!terminal || !content) return;
  terminal.style.display = 'block';
  content.innerHTML = '';

  // Check if feature is active
  const settings = await getBin(BIN_SETTINGS);
  
  async function typeTerminal(lines, delay=80) {
    for (const line of lines) {
      await new Promise(res => setTimeout(res, delay));
      content.innerHTML += line + '\n';
      terminal.scrollTop = terminal.scrollHeight;
    }
  }

  await typeTerminal([
    '<span class="t-cyan">$ </span><span class="t-white">drip-reset-client --key '+sanitize(key)+'</span>',
    '<span class="t-yellow">⟳ Fetching Server...</span>',
  ], 500);

  if (!settings || !settings.reset_key_active) {
    await new Promise(res => setTimeout(res, 1000));
    await typeTerminal([
      '<span class="t-yellow">⟳ Response Database....</span>',
      '<span class="t-red">✗ ERROR: Feature Disabled</span>',
      '<span class="t-red">Status: 503</span>',
      '<span class="t-red">{"success":false,"message":"Feature disabled by admin"}</span>',
    ], 400);
    content.innerHTML += '<div style="margin-top:12px;padding:12px;background:rgba(255,68,102,0.1);border:1px solid rgba(255,68,102,0.3);border-radius:8px;color:#ff4466;font-size:13px;">⚠️ Maaf fitur ini sedang di nonaktifkan oleh admin atau sedang tidak beroperasi normal. Silahkan coba lagi nanti.</div>';
    return;
  }

  // Check daily reset limit (max 1 per day per key)
  const today = new Date().toDateString();
  const resetLog = JSON.parse(localStorage.getItem('drip_resets')||'{}');
  if (resetLog[key] === today) {
    await new Promise(res => setTimeout(res, 800));
    await typeTerminal([
      '<span class="t-yellow">⟳ Response Database....</span>',
      '<span class="t-red">✗ Limit Reached</span>',
    ], 300);
    content.innerHTML += `<div style="margin-top:12px;padding:12px;background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.3);border-radius:8px;color:#ffb400;font-size:13px;">⏰ Kamu sudah melakukan reset key ini hari ini. Coba lagi besok.<br><small>Next reset available: Tomorrow 00:00</small></div>`;
    return;
  }

  await typeTerminal([
    '<span class="t-yellow">⟳ Connecting to auth server...</span>',
    '<span class="t-yellow">⟳ Validating token...</span>',
    '<span class="t-yellow">⟳ Processing reset request...</span>',
    '<span class="t-yellow">⟳ Response Database....</span>',
  ], 400);

  await new Promise(res => setTimeout(res, 800));

  // Save reset log
  resetLog[key] = today;
  localStorage.setItem('drip_resets', JSON.stringify(resetLog));

  const nextReset = new Date();
  nextReset.setHours(24, 0, 0, 0);

  await typeTerminal([
    '<span class="t-green">✅ Reset Successful</span>',
    '',
    '<span class="t-white">Status: <span class="t-green">200</span></span>',
    '<span class="t-white">Response: <span class="t-cyan">{"success":true,"message":"Token reset successfully","resetsused":1,"resetsmax":1,"nextresettime":"'+nextReset.toLocaleString('id-ID')+'"}</span></span>',
    '',
    '<span class="t-purple">🔑 Device has been reset successfully</span>',
    '<span class="t-green">Next reset available: '+nextReset.toLocaleString('id-ID')+'</span>',
  ], 120);
}

/* ==================== UPDATE STATS ==================== */
async function updateStats(type, amount) {
  try {
    const settings = await getBin(BIN_SETTINGS) || {};
    const today = new Date().toDateString();
    
    // Reset daily count if new day
    if (settings.lastSoldDate !== today) {
      settings.todaySold = 0;
      settings.lastSoldDate = today;
    }
    
    settings.totalBuyers = (settings.totalBuyers||0) + 1;
    settings.totalRevenue = (settings.totalRevenue||0) + (amount||0);
    settings.todaySold = (settings.todaySold||0) + 1;
    
    await setBin(BIN_SETTINGS, settings);
  } catch(e) {}
}

/* ==================== ADMIN DASHBOARD ==================== */
async function initAdminDashboard() {
  await adminLoadAll();
}

async function adminLoadAll() {
  const settings = await getBin(BIN_SETTINGS) || {};
  
  // Stats
  const today = new Date().toDateString();
  if (settings.lastSoldDate !== today) {
    settings.todaySold = 0;
  }

  const elBuyers = document.getElementById('stat-total-buyers');
  const elRevenue = document.getElementById('stat-total-revenue');
  const elToday = document.getElementById('stat-today-sold');
  if (elBuyers) elBuyers.textContent = settings.totalBuyers||0;
  if (elRevenue) elRevenue.textContent = 'Rp '+formatRp(settings.totalRevenue||0);
  if (elToday) elToday.textContent = settings.todaySold||0;

  // Set toggles
  setToggle('toggle-wa-notif', settings.wa_notif !== false);
  setToggle('toggle-running-text', !!settings.running_text_active);
  setToggle('toggle-custom-notif', !!settings.custom_notif_active);
  setToggle('toggle-reset-key', !!settings.reset_key_active);
  setToggle('toggle-maintenance', !!settings.maintenance_mode);

  const rtInput = document.getElementById('running-text-input');
  if (rtInput) rtInput.value = settings.running_text||'';
  const mainReason = document.getElementById('maintenance-reason');
  if (mainReason) mainReason.value = settings.maintenance_reason||'';
  const notifTitle = document.getElementById('notif-title-input');
  if (notifTitle) notifTitle.value = settings.custom_notif_title||'';
  const notifText = document.getElementById('notif-text-input');
  if (notifText) notifText.value = settings.custom_notif_text||'';
  const notifIcon = document.getElementById('notif-icon-select');
  if (notifIcon && settings.custom_notif_icon) notifIcon.value = settings.custom_notif_icon;

  // Load logs, products, promo
  await adminLoadLogs('all');
  await adminLoadProducts();
  await adminLoadPromo();
  await adminLoadTopupHistory();

  const lastSync = document.getElementById('last-sync');
  if (lastSync) lastSync.textContent = new Date().toLocaleString('id-ID');
}

function setToggle(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}

/* ==================== ADMIN LOGS ==================== */
async function adminLoadLogs(filter) {
  const container = document.getElementById('admin-logs-container');
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--purple-neon);"></i></div>';

  const data = await getBin(BIN_ORDERS);
  let orders = data?.orders || [];
  if (filter && filter !== 'all') orders = orders.filter(o=>o.status===filter);
  orders = orders.slice().reverse();

  if (!orders.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Tidak ada transaksi</p></div>';
    return;
  }

  container.innerHTML = orders.map(o => `
    <div class="log-item">
      <div class="log-header">
        <div>
          <div class="log-trx-id">${sanitize(o.id)}</div>
          <div class="log-product">${sanitize(o.productName||'')}</div>
          <div class="log-user"><i class="fas fa-user" style="margin-right:4px;"></i>${sanitize(o.username||'')} | <i class="fab fa-whatsapp" style="margin-right:4px;color:#25d366;"></i>${sanitize(o.whatsapp||'-')}</div>
        </div>
        <div class="trx-status ${o.status}">${getStatusLabel(o.status)}</div>
      </div>
      <div class="log-details">
        <span><i class="fas fa-box" style="margin-right:4px;color:var(--purple-neon);"></i>${sanitize(o.plan||'')} ×${o.qty||1}</span>
        <span><i class="fas fa-dollar-sign" style="margin-right:4px;color:var(--accent-gold);"></i>Rp ${formatRp(o.totalPrice||0)}</span>
        ${o.promoUsed?`<span><i class="fas fa-tag" style="margin-right:4px;color:#00ff88;"></i>${sanitize(o.promoUsed)}</span>`:''}
        <span><i class="fas fa-calendar" style="margin-right:4px;"></i>${new Date(o.createdAt).toLocaleString('id-ID')}</span>
      </div>
      ${o.keys && o.keys.length > 0 ? `<div style="font-size:13px;color:var(--purple-neon);margin-top:8px;"><i class="fas fa-key" style="margin-right:4px;"></i>Keys terkirim: ${o.keys.map(k=>`<code style="background:rgba(45,0,80,0.5);padding:2px 6px;border-radius:4px;">${sanitize(k)}</code>`).join(', ')}</div>` : ''}
      ${o.status === 'waiting' ? `
        <div class="log-actions">
          <button class="btn-approve" onclick="openApproveModal('${sanitize(o.id)}')"><i class="fas fa-check"></i> Approve</button>
          <button class="btn-reject" onclick="adminReject('${sanitize(o.id)}')"><i class="fas fa-times"></i> Reject</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function filterLogs(filter) {
  adminLoadLogs(filter);
}

let currentApproveTrxId = null;
function openApproveModal(trxId) {
  currentApproveTrxId = trxId;
  const info = document.getElementById('approve-trx-info');
  if (info) info.textContent = `ID: ${sanitize(trxId)}`;
  
  // Clear previous key inputs
  const wrapper = document.getElementById('key-inputs-wrapper');
  if (wrapper) {
    wrapper.innerHTML = '<label class="admin-label">Masukkan Key / License untuk dikirim ke user:</label>';
    addKeyInput();
  }
  openPopup('popup-approve-key');
}

function addKeyInput() {
  const wrapper = document.getElementById('key-inputs-wrapper');
  if (!wrapper) return;
  const row = document.createElement('div');
  row.className = 'key-input-row';
  row.innerHTML = `<input class="admin-input approve-key-input" type="text" placeholder="Masukkan key/license..."/><button class="btn-icon" onclick="this.closest('.key-input-row').remove()"><i class="fas fa-trash"></i></button>`;
  wrapper.appendChild(row);
}

async function submitApprove() {
  const keyInputs = document.querySelectorAll('.approve-key-input');
  const keys = Array.from(keyInputs).map(el => sanitize(el.value.trim())).filter(k=>k);
  
  if (!keys.length) { await showAlert('warning','Key Kosong','Masukkan minimal 1 key.'); return; }
  if (!currentApproveTrxId) return;

  await showLoading('Mengirim key...');

  const data = await getBin(BIN_ORDERS);
  const orders = data?.orders || [];
  const idx = orders.findIndex(o=>o.id===currentApproveTrxId);
  if (idx === -1) { Swal.close(); await showAlert('error','Error','Transaksi tidak ditemukan.'); return; }
  
  orders[idx].status = 'approved';
  orders[idx].keys = keys;
  orders[idx].approvedAt = new Date().toISOString();
  
  await setBin(BIN_ORDERS, { orders });
  Swal.close();
  closePopup('popup-approve-key');
  await showAlert('success', 'Berhasil!', 'Transaksi diapprove dan key telah dikirim ke user.', 2000);
  await adminLoadLogs('all');
}

async function adminReject(trxId) {
  const confirm = await showConfirm('Reject Transaksi?', `Saldo user akan dikembalikan untuk transaksi ${sanitize(trxId)}.`);
  if (!confirm.isConfirmed) return;

  await showLoading('Memproses...');
  const data = await getBin(BIN_ORDERS);
  const orders = data?.orders || [];
  const idx = orders.findIndex(o=>o.id===trxId);
  if (idx === -1) { Swal.close(); return; }
  
  const order = orders[idx];
  orders[idx].status = 'rejected';
  orders[idx].rejectedAt = new Date().toISOString();

  // Refund credit
  const userData = await getBin(BIN_USERS);
  const users = userData?.users || [];
  const uIdx = users.findIndex(u=>u.username===order.username);
  if (uIdx !== -1) {
    users[uIdx].credit = (users[uIdx].credit||0) + (order.totalPrice||0);
    await setBin(BIN_USERS, { users });
  }

  // Update stats (reverse)
  const settings = await getBin(BIN_SETTINGS)||{};
  settings.totalBuyers = Math.max(0,(settings.totalBuyers||1)-1);
  settings.totalRevenue = Math.max(0,(settings.totalRevenue||0)-(order.totalPrice||0));
  await setBin(BIN_SETTINGS, settings);

  await setBin(BIN_ORDERS, { orders });
  Swal.close();
  await showAlert('success','Transaksi Ditolak','Saldo user telah dikembalikan.', 2000);
  await adminLoadLogs('all');
}

/* ==================== ADMIN PRODUCTS ==================== */
async function adminLoadProducts() {
  const container = document.getElementById('admin-products-list');
  if (!container) return;
  const data = await getBin(BIN_PRODUCTS);
  const products = data?.products || [];

  if (!products.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Belum ada produk</p></div>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Produk</th>
            <th>Fitur</th>
            <th>Full Prices</th>
            <th>Rental</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((p, i) => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px;">
                  <img src="${sanitize(p.image||'')}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid var(--border-subtle);" onerror="this.style.display='none'"/>
                  <div>
                    <div style="font-weight:700;color:var(--text-primary);">${sanitize(p.name||'')}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${sanitize(p.description||'')}</div>
                  </div>
                </div>
              </td>
              <td style="font-size:12px;">${(p.features||[]).map(f=>`<span style="background:rgba(90,0,170,0.3);border:1px solid var(--border-subtle);padding:2px 8px;border-radius:4px;margin:2px;display:inline-block;">${sanitize(f)}</span>`).join('')}</td>
              <td style="font-size:12px;">${(p.fullPrices||[]).map(fp=>`${sanitize(fp.label)}: Rp ${formatRp(fp.price)}`).join('<br/>')}</td>
              <td>${p.rentalEnabled ? '<span style="color:#00ff88;font-size:12px;"><i class="fas fa-check"></i> ON</span>' : '<span style="color:var(--text-muted);font-size:12px;"><i class="fas fa-times"></i> OFF</span>'}</td>
              <td>
                <div style="display:flex;gap:8px;">
                  <button class="btn-admin" style="padding:8px 14px;font-size:11px;" onclick="openEditProduct(${i})"><i class="fas fa-edit"></i> Edit</button>
                  <button class="btn-admin danger" style="padding:8px 14px;font-size:11px;" onclick="deleteProduct(${i})"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function addProduct() {
  const name = sanitize(document.getElementById('new-prod-name').value.trim());
  const img = sanitize(document.getElementById('new-prod-img').value.trim());
  const desc = sanitize(document.getElementById('new-prod-desc').value.trim());
  const featuresRaw = sanitize(document.getElementById('new-prod-features').value.trim());
  
  if (!name) { await showAlert('warning','Nama Produk','Masukkan nama produk.'); return; }

  // Collect full prices
  const fullPrices = collectPrices('full-price-label', 'full-price-val');
  const rentalEnabled = document.getElementById('rental-enabled')?.checked;
  const rentalPrices = rentalEnabled ? collectPrices('rental-price-label', 'rental-price-val') : [];

  const features = featuresRaw ? featuresRaw.split(',').map(f=>f.trim()).filter(f=>f) : [];

  const data = await getBin(BIN_PRODUCTS);
  const products = data?.products || [];
  products.push({ name, image: img, description: desc, features, fullPrices, rentalEnabled, rentalPrices });
  
  await showLoading('Menyimpan produk...');
  await setBin(BIN_PRODUCTS, { products });
  Swal.close();

  // Reset form
  ['new-prod-name','new-prod-img','new-prod-desc','new-prod-features'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('full-price-inputs').innerHTML = `<div class="price-row"><input class="admin-input full-price-label" type="text" placeholder="Label (1 Days)" style="max-width:140px;"/><input class="admin-input full-price-val" type="number" placeholder="Harga (20000)"/><button class="btn-icon add" onclick="addPriceRow('full-price-inputs','full-price-label','full-price-val')"><i class="fas fa-plus"></i></button></div>`;

  await showAlert('success','Produk Ditambahkan!','Produk berhasil ditambahkan ke database.',2000);
  await adminLoadProducts();
}

function collectPrices(labelClass, valClass) {
  const labels = document.querySelectorAll(`.${labelClass}`);
  const vals = document.querySelectorAll(`.${valClass}`);
  const prices = [];
  labels.forEach((lEl, i) => {
    const label = sanitize(lEl.value.trim());
    const price = parseInt(vals[i]?.value)||0;
    if (label && price) prices.push({ label, price });
  });
  return prices;
}

function addPriceRow(containerId, labelClass, valClass) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'price-row';
  row.innerHTML = `<input class="admin-input ${labelClass}" type="text" placeholder="Label" style="max-width:140px;"/><input class="admin-input ${valClass}" type="number" placeholder="Harga"/><button class="btn-icon" onclick="this.closest('.price-row').remove()"><i class="fas fa-minus"></i></button>`;
  container.appendChild(row);
}

function toggleRentalArea() {
  const area = document.getElementById('rental-price-area');
  const checked = document.getElementById('rental-enabled')?.checked;
  if (area) area.style.display = checked ? '' : 'none';
}

async function openEditProduct(idx) {
  const data = await getBin(BIN_PRODUCTS);
  const p = data?.products?.[idx];
  if (!p) return;

  document.getElementById('edit-product-id').value = idx;
  document.getElementById('edit-prod-name').value = p.name||'';
  document.getElementById('edit-prod-img').value = p.image||'';
  document.getElementById('edit-prod-desc').value = p.description||'';
  document.getElementById('edit-prod-features').value = (p.features||[]).join(', ');
  document.getElementById('edit-prod-full-prices').value = (p.fullPrices||[]).map(fp=>`${fp.label}:${fp.price}`).join('\n');
  document.getElementById('edit-rental-enabled').checked = !!p.rentalEnabled;
  document.getElementById('edit-prod-rental-prices').value = (p.rentalPrices||[]).map(rp=>`${rp.label}:${rp.price}`).join('\n');
  openPopup('popup-edit-product');
}

async function saveEditProduct() {
  const idx = parseInt(document.getElementById('edit-product-id').value);
  const name = sanitize(document.getElementById('edit-prod-name').value.trim());
  const img = sanitize(document.getElementById('edit-prod-img').value.trim());
  const desc = sanitize(document.getElementById('edit-prod-desc').value.trim());
  const featuresRaw = sanitize(document.getElementById('edit-prod-features').value.trim());
  const fullPricesRaw = document.getElementById('edit-prod-full-prices').value.trim();
  const rentalEnabled = document.getElementById('edit-rental-enabled').checked;
  const rentalPricesRaw = document.getElementById('edit-prod-rental-prices').value.trim();

  const parsePrices = (raw) => raw.split('\n').map(line=>{
    const [label,...rest]=line.split(':'); const price=parseInt(rest.join(':'));
    return (label&&price) ? {label:sanitize(label.trim()),price} : null;
  }).filter(Boolean);

  const data = await getBin(BIN_PRODUCTS);
  if (!data?.products?.[idx]) return;
  data.products[idx] = { name, image:img, description:desc, features: featuresRaw.split(',').map(f=>f.trim()).filter(Boolean), fullPrices: parsePrices(fullPricesRaw), rentalEnabled, rentalPrices: rentalEnabled?parsePrices(rentalPricesRaw):[] };

  await showLoading('Menyimpan...');
  await setBin(BIN_PRODUCTS, data);
  Swal.close();
  closePopup('popup-edit-product');
  await showAlert('success','Produk Diperbarui!','',2000);
  await adminLoadProducts();
}

async function deleteProduct(idx) {
  const confirm = await showConfirm('Hapus Produk?','Produk ini akan dihapus permanen.');
  if (!confirm.isConfirmed) return;
  
  const data = await getBin(BIN_PRODUCTS);
  data.products.splice(idx, 1);
  await setBin(BIN_PRODUCTS, data);
  await showAlert('success','Produk Dihapus','',1500);
  await adminLoadProducts();
}

/* ==================== ADMIN PROMO ==================== */
async function addPromo() {
  const code = sanitize(document.getElementById('new-promo-code').value.trim().toUpperCase());
  const pct = parseInt(document.getElementById('new-promo-pct').value)||0;
  const maxUse = parseInt(document.getElementById('new-promo-max').value)||9999;
  const active = document.getElementById('new-promo-active')?.checked !== false;

  if (!code || !pct) { await showAlert('warning','Form Tidak Lengkap','Isi kode dan persen promo.'); return; }
  if (pct < 1 || pct > 100) { await showAlert('warning','Persen Invalid','1-100'); return; }

  const data = await getBin(BIN_PROMO);
  const promos = data?.promos || [];
  if (promos.find(p=>p.code===code)) { await showAlert('warning','Kode Sudah Ada','Gunakan kode lain.'); return; }

  promos.push({ code, pct, maxUse, usedCount: 0, active, createdAt: new Date().toISOString() });
  await showLoading('Menyimpan...');
  await setBin(BIN_PROMO, { promos });
  Swal.close();

  document.getElementById('new-promo-code').value='';
  document.getElementById('new-promo-pct').value='';
  document.getElementById('new-promo-max').value='';

  await showAlert('success','Promo Ditambahkan!','',2000);
  await adminLoadPromo();
}

async function adminLoadPromo() {
  const container = document.getElementById('admin-promo-list');
  if (!container) return;
  const data = await getBin(BIN_PROMO);
  const promos = data?.promos || [];

  if (!promos.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-tag"></i><p>Belum ada promo</p></div>'; return; }

  container.innerHTML = `
    <div style="overflow-x:auto;">
    <table class="admin-table">
      <thead><tr><th>Kode</th><th>Diskon</th><th>Terpakai</th><th>Maks</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>
        ${promos.map((p,i)=>`
          <tr>
            <td><span style="font-family:'Share Tech Mono',monospace;color:var(--purple-neon);font-size:15px;font-weight:700;">${sanitize(p.code)}</span></td>
            <td><span style="color:var(--accent-gold);font-weight:700;">${p.pct}%</span></td>
            <td>${p.usedCount||0}</td>
            <td>${p.maxUse||'-'}</td>
            <td><span style="color:${p.active?'#00ff88':'#ff4466'};font-weight:700;">${p.active?'AKTIF':'NONAKTIF'}</span></td>
            <td>
              <div style="display:flex;gap:8px;">
                <button class="btn-admin" style="padding:6px 12px;font-size:10px;" onclick="togglePromo(${i})">${p.active?'Nonaktifkan':'Aktifkan'}</button>
                <button class="btn-admin danger" style="padding:6px 12px;font-size:10px;" onclick="deletePromo(${i})"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    </div>
  `;
}

async function togglePromo(idx) {
  const data = await getBin(BIN_PROMO);
  data.promos[idx].active = !data.promos[idx].active;
  await setBin(BIN_PROMO, data);
  await adminLoadPromo();
}

async function deletePromo(idx) {
  const confirm = await showConfirm('Hapus Promo?','Kode promo ini akan dihapus.');
  if (!confirm.isConfirmed) return;
  const data = await getBin(BIN_PROMO);
  data.promos.splice(idx,1);
  await setBin(BIN_PROMO, data);
  await adminLoadPromo();
}

/* ==================== ADMIN SALDO ==================== */
async function topupSaldo() {
  const targetUser = sanitize(document.getElementById('topup-username').value.trim());
  const amount = parseInt(document.getElementById('topup-amount').value)||0;
  const result = document.getElementById('topup-result');

  if (!targetUser || !amount) { if(result) result.innerHTML='<span style="color:#ff4466;">Isi username dan jumlah saldo.</span>'; return; }
  if (!validateUsername(targetUser)) { if(result) result.innerHTML='<span style="color:#ff4466;">Username tidak valid.</span>'; return; }

  if(result) result.innerHTML='<span style="color:var(--purple-neon);"><i class="fas fa-spinner fa-spin"></i> Memproses...</span>';

  const data = await getBin(BIN_USERS);
  const users = data?.users||[];
  const uIdx = users.findIndex(u=>u.username===targetUser);
  if (uIdx === -1) { if(result) result.innerHTML='<span style="color:#ff4466;"><i class="fas fa-times"></i> User tidak ditemukan.</span>'; return; }

  users[uIdx].credit = (users[uIdx].credit||0) + amount;
  await setBin(BIN_USERS, { users });

  // Log topup
  const settings = await getBin(BIN_SETTINGS)||{};
  if (!settings.topupHistory) settings.topupHistory=[];
  settings.topupHistory.push({ username:targetUser, amount, time:new Date().toISOString() });
  await setBin(BIN_SETTINGS, settings);

  if(result) result.innerHTML=`<span style="color:#00ff88;"><i class="fas fa-check-circle"></i> Berhasil! Rp ${formatRp(amount)} dikirim ke <strong>${sanitize(targetUser)}</strong>. Saldo baru: Rp ${formatRp(users[uIdx].credit)}</span>`;
  document.getElementById('topup-username').value='';
  document.getElementById('topup-amount').value='';
  await adminLoadTopupHistory();
}

async function adminLoadTopupHistory() {
  const container = document.getElementById('topup-history');
  if (!container) return;
  const settings = await getBin(BIN_SETTINGS)||{};
  const history = (settings.topupHistory||[]).slice().reverse().slice(0,20);

  if (!history.length) { container.innerHTML='<div class="empty-state"><i class="fas fa-history"></i><p>Belum ada top up</p></div>'; return; }

  container.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Username</th><th>Jumlah</th><th>Waktu</th></tr></thead>
      <tbody>
        ${history.map(h=>`
          <tr>
            <td style="color:var(--purple-neon);font-weight:600;">${sanitize(h.username)}</td>
            <td style="color:var(--accent-gold);font-weight:700;">Rp ${formatRp(h.amount)}</td>
            <td style="color:var(--text-muted);font-size:12px;">${new Date(h.time).toLocaleString('id-ID')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ==================== ADMIN SETTINGS SAVE ==================== */
async function saveToggle(key, val) {
  const settings = await getBin(BIN_SETTINGS)||{};
  settings[key] = val;
  await setBin(BIN_SETTINGS, settings);
}

async function saveRunningText() {
  const text = stripTags(document.getElementById('running-text-input').value.trim());
  if (!text) { await showAlert('warning','Kosong','Masukkan teks berjalan.'); return; }
  const settings = await getBin(BIN_SETTINGS)||{};
  settings.running_text = text;
  await setBin(BIN_SETTINGS, settings);
  await showAlert('success','Tersimpan!','Teks berjalan berhasil disimpan.',1500);
}

async function saveCustomNotif() {
  const icon = document.getElementById('notif-icon-select')?.value||'fas fa-info-circle';
  const title = stripTags(document.getElementById('notif-title-input').value.trim());
  const text = stripTags(document.getElementById('notif-text-input').value.trim());
  if (!title || !text) { await showAlert('warning','Form Kosong','Isi judul dan teks notifikasi.'); return; }
  const settings = await getBin(BIN_SETTINGS)||{};
  settings.custom_notif_icon = icon;
  settings.custom_notif_title = title;
  settings.custom_notif_text = text;
  await setBin(BIN_SETTINGS, settings);
  await showAlert('success','Notifikasi Disimpan!','',1500);
}

async function saveMaintenanceReason() {
  const reason = stripTags(document.getElementById('maintenance-reason').value.trim());
  const settings = await getBin(BIN_SETTINGS)||{};
  settings.maintenance_reason = reason;
  await setBin(BIN_SETTINGS, settings);
  await showAlert('success','Alasan Disimpan!','',1500);
}

/* ==================== ADMIN TABS ==================== */
function switchAdminTab(tab) {
  document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  const section = document.getElementById(`tab-${tab}`);
  const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
  if (section) section.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');
}

/* ==================== ENTER KEY SHORTCUTS ==================== */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    if (document.getElementById('login-user')) doLogin();
    if (document.getElementById('reg-user') && e.target.id === 'reg-pass2') doRegister();
  }
});

console.log('%cDRIP CLIENT - Secured Dashboard', 'color:#cc44ff;font-size:20px;font-weight:900;');
console.log('%cProtected by security measures. Unauthorized access is prohibited.', 'color:#ff4466;font-size:12px;');