// ============================================================
// DRIP CLIENT - SCRIPT.JS
// Full functionality: Auth, DB, Dashboard, Admin Panel
// ============================================================

// ============================================================
// JSONBIN CONFIG - Replace with your own if needed
// ============================================================
const JSONBIN_API_KEY = '$2a$10$uzdLhr/GM.l1rf7rJ11x3ey4eWi0Kj7V5eMtEE6o.RfixGw5qAsXG';
const BIN_IDS = {
  users:        '69b7e200c3097a1dd52ce8ce',
  products:     '69b7e222b7ec241ddc723a4f',
  transactions: '69b7e244c3097a1dd52ce9a0',
  settings:     '69b7e280aa77b81da9ec1092',
  promo:        '69b7e261c3097a1dd52ce9fd',
};
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';

// Demo mode: use localStorage as fallback if no real JSONBin keys
const DEMO_MODE = BIN_IDS.users.startsWith('REPLACE');

// ============================================================
// SECURITY HELPERS
// ============================================================
function sanitizeInput(val) {
  return val.replace(/[<>"'`;&|\\\/\x00-\x1f]/g, '').trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function hashPassword(pw) {
  // Simple deterministic hash for demo (in production use bcrypt server-side)
  let hash = 0;
  const salted = 'dripClient_salt_' + pw + '_secure';
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hashed_' + Math.abs(hash).toString(36) + '_' + salted.length;
}

function generateId(prefix = 'TRX') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// ============================================================
// DEMO STORAGE (localStorage fallback)
// ============================================================
function demoGet(key) {
  try { return JSON.parse(localStorage.getItem('dc_' + key)) || null; } catch { return null; }
}
function demoSet(key, val) {
  try { localStorage.setItem('dc_' + key, JSON.stringify(val)); return true; } catch { return false; }
}

function initDemoData() {
  if (!demoGet('users')) {
    demoSet('users', [
      { username: 'admin', password: hashPassword('admin123'), credit: 999999, isAdmin: true, createdAt: new Date().toISOString() },
      { username: 'demo', password: hashPassword('demo123'), credit: 50000, isAdmin: false, createdAt: new Date().toISOString() }
    ]);
  }
  if (!demoGet('products')) {
    demoSet('products', [
      {
        id: 'PROD_001', nama: 'DRIP CLIENT - Android Pro',
        image: 'https://via.placeholder.com/400x200/1a1535/a78bfa?text=DRIP+CLIENT',
        desc: 'Cheat Android premium dengan fitur lengkap dan aman.',
        fitur: ['Antiban Advanced', 'Silent Aim', 'No Recoil', 'Wallhack'],
        hargaFull: [
          { label: '1 Day', harga: 20000 }, { label: '3 Days', harga: 30000 },
          { label: '7 Days', harga: 65000 }, { label: '15 Days', harga: 110000 }, { label: '1 Bulan', harga: 230000 }
        ],
        hargaRental: [
          { label: '1 Jam', harga: 5000 }, { label: '2 Jam', harga: 7000 },
          { label: '10 Jam', harga: 11000 }, { label: '15 Jam', harga: 16000 }, { label: '24 Jam', harga: 25000 }
        ],
        rentalEnabled: true, createdAt: new Date().toISOString()
      }
    ]);
  }
  if (!demoGet('transactions')) demoSet('transactions', []);
  if (!demoGet('settings')) {
    demoSet('settings', {
      runningText: false, runningTextContent: 'KODE PROMO TERBARU : DISKON70%',
      welcomePopup: true, notif2: false, notif2Icon: 'fas fa-info-circle',
      notif2Text: '', resetKey: true, maintenance: false, maintenanceReason: 'Website sedang dalam pemeliharaan.',
      totalPembeli: 0, totalPenghasilan: 0, terjualHariIni: 0, lastReset: new Date().toDateString()
    });
  }
  if (!demoGet('promo')) demoSet('promo', []);
}

// ============================================================
// JSONBIN API WRAPPERS
// ============================================================
async function jsonbinGet(binId) {
  if (DEMO_MODE) return demoGet(getBinKey(binId));
  try {
    const r = await fetch(`${JSONBIN_BASE}/${binId}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    const d = await r.json();
    return d.record;
  } catch (e) { console.error('JSONBin GET error', e); return null; }
}

async function jsonbinSet(binId, data) {
  if (DEMO_MODE) { demoSet(getBinKey(binId), data); return true; }
  try {
    await fetch(`${JSONBIN_BASE}/${binId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_API_KEY },
      body: JSON.stringify(data)
    });
    return true;
  } catch (e) { console.error('JSONBin SET error', e); return false; }
}

function getBinKey(binId) {
  for (const [k, v] of Object.entries(BIN_IDS)) { if (v === binId) return k; }
  return binId;
}

// Convenience wrappers
async function getUsers() { return await jsonbinGet(BIN_IDS.users) || []; }
async function setUsers(d) { return await jsonbinSet(BIN_IDS.users, d); }
async function getProducts() { return await jsonbinGet(BIN_IDS.products) || []; }
async function setProducts(d) { return await jsonbinSet(BIN_IDS.products, d); }
async function getTransactions() { return await jsonbinGet(BIN_IDS.transactions) || []; }
async function setTransactions(d) { return await jsonbinSet(BIN_IDS.transactions, d); }
async function getSettings() { return await jsonbinGet(BIN_IDS.settings) || {}; }
async function setSettings(d) { return await jsonbinSet(BIN_IDS.settings, d); }
async function getPromo() { return await jsonbinGet(BIN_IDS.promo) || []; }
async function setPromo(d) { return await jsonbinSet(BIN_IDS.promo, d); }

// ============================================================
// SESSION
// ============================================================
function getSession() {
  try { return JSON.parse(sessionStorage.getItem('dc_session')) || null; } catch { return null; }
}
function setSession(user) {
  sessionStorage.setItem('dc_session', JSON.stringify(user));
  // remember me
  const remCb = document.getElementById('rememberMe');
  if (remCb && remCb.checked) {
    try { localStorage.setItem('dc_remember', JSON.stringify(user)); } catch {}
  }
}
function clearSession() {
  sessionStorage.removeItem('dc_session');
  try { localStorage.removeItem('dc_remember'); } catch {}
}

function checkRememberMe() {
  try {
    const r = localStorage.getItem('dc_remember');
    if (r) { const u = JSON.parse(r); sessionStorage.setItem('dc_session', JSON.stringify(u)); return u; }
  } catch {}
  return null;
}

// ============================================================
// LOADING SCREEN
// ============================================================
function initLoadingScreen(pageType) {
  initDemoData();
  initParticles();
  buildLoadingLetters();
  buildLoadParticles();

  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.classList.add('hide');
      setTimeout(() => { ls.style.display = 'none'; }, 800);
    }
    // After loading, init page
    if (pageType === 'home') initHomePage();
    else if (pageType === 'admin') initAdminPage();
    else if (pageType === 'login') initLoginPage();
    else if (pageType === 'register') {}
  }, 3000);
}

function buildLoadingLetters() {
  const text = 'DRIPCLIENT';
  const cont = document.getElementById('loadingLetters');
  if (!cont) return;
  text.split('').forEach((l, i) => {
    const s = document.createElement('span');
    s.textContent = l === 'C' && i === 4 ? ' ' : l;
    if (l === ' ') { s.style.width = '12px'; }
    s.style.animationDelay = (i * 0.12) + 's';
    cont.appendChild(s);
  });
  // Rebuild with space
  cont.innerHTML = '';
  ['D','R','I','P',' ','C','L','I','E','N','T'].forEach((l, i) => {
    if (l === ' ') {
      const sp = document.createElement('span');
      sp.style.width = '15px'; sp.style.display = 'inline-block';
      cont.appendChild(sp); return;
    }
    const s = document.createElement('span');
    s.textContent = l;
    s.style.animationDelay = (i * 0.1) + 's';
    cont.appendChild(s);
  });
}

function buildLoadParticles() {
  const c = document.getElementById('loadParticles');
  if (!c) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'load-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (3 + Math.random() * 5) + 's';
    p.style.animationDelay = (Math.random() * 5) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
    p.style.opacity = Math.random() * 0.7;
    c.appendChild(p);
  }
}

// ============================================================
// PARTICLES CANVAS
// ============================================================
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const particles = [];
  const count = Math.min(80, Math.floor(W * H / 15000));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '124,58,237' : '167,139,250'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(124,58,237,${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
}

// ============================================================
// SCROLL FADE-IN
// ============================================================
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-in-scroll');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// ============================================================
// UI HELPERS
// ============================================================
function togglePw(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;
  if (input.type === 'password') {
    input.type = 'text'; icon.className = 'fas fa-eye';
  } else {
    input.type = 'password'; icon.className = 'fas fa-eye-slash';
  }
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; setTimeout(() => m.classList.add('show'), 10); }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('show'); setTimeout(() => { m.style.display = 'none'; }, 300); }
}

function toggleDrawer() {
  const d = document.getElementById('sideDrawer');
  const o = document.getElementById('drawerOverlay');
  if (d && o) { d.classList.toggle('open'); o.classList.toggle('show'); }
}

function closeDrawer() {
  const d = document.getElementById('sideDrawer');
  const o = document.getElementById('drawerOverlay');
  if (d) d.classList.remove('open');
  if (o) o.classList.remove('show');
}

function setLoading(btnId, loading, text = 'Loading...') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ${escapeHtml(text)}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.origText || text;
  }
}

function formatRupiah(n) {
  if (!n && n !== 0) return 'Rp 0';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function checkPasswordStrength(pw) {
  const bar = document.getElementById('pwStrengthBar');
  const label = document.getElementById('pwStrengthLabel');
  if (!bar || !label) return;
  let strength = 0;
  if (pw.length >= 6) strength++;
  if (pw.length >= 10) strength++;
  if (/[A-Z]/.test(pw)) strength++;
  if (/[0-9]/.test(pw)) strength++;
  if (/[^A-Za-z0-9]/.test(pw)) strength++;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
  const labels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
  bar.style.width = (strength * 20) + '%';
  bar.style.background = colors[strength - 1] || '#ef4444';
  label.textContent = strength > 0 ? labels[strength - 1] : '';
  label.style.color = colors[strength - 1] || 'var(--text-muted)';
}

// ============================================================
// LOGIN PAGE INIT
// ============================================================
function initLoginPage() {
  // Check if already logged in
  const sess = getSession() || checkRememberMe();
  if (sess) { window.location.href = 'home.html'; return; }
  // Allow enter key
  ['loginUsername', 'loginPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  });
}

// ============================================================
// AUTH: LOGIN
// ============================================================
async function handleLogin() {
  const username = sanitizeInput(document.getElementById('loginUsername')?.value || '');
  const password = document.getElementById('loginPassword')?.value || '';

  if (!username || !password) {
    showAlert('warning', 'Oops!', 'Username dan password wajib diisi!'); return;
  }
  if (username.length < 3) {
    showAlert('warning', 'Username Terlalu Pendek', 'Min. 3 karakter.'); return;
  }

  setLoading('loginBtn', true, 'Memproses...');

  try {
    const users = await getUsers();
    const hashedPw = hashPassword(password);
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === hashedPw);

    if (!user) {
      setLoading('loginBtn', false);
      showAlert('error', 'Login Gagal', 'Username atau password salah!'); return;
    }

    setSession(user);

    // Show welcome overlay
    const overlay = document.getElementById('welcome-overlay');
    const wMsg = document.getElementById('welcomeMsg');
    if (overlay) {
      if (wMsg) wMsg.textContent = `Welcome ${escapeHtml(user.username)}!`;
      overlay.classList.add('show');
    }

    setTimeout(() => { window.location.href = 'home.html'; }, 2800);
  } catch (e) {
    setLoading('loginBtn', false);
    showAlert('error', 'Error', 'Terjadi kesalahan. Coba lagi.');
  }
}

// ============================================================
// AUTH: REGISTER
// ============================================================
async function handleRegister() {
  const username = sanitizeInput(document.getElementById('regUsername')?.value || '');
  const password = document.getElementById('regPassword')?.value || '';
  const passwordConfirm = document.getElementById('regPasswordConfirm')?.value || '';

  // Validations
  if (!username || !password || !passwordConfirm) {
    showAlert('warning', 'Data Tidak Lengkap', 'Semua field wajib diisi!'); return;
  }
  if (username.length < 3) {
    showAlert('warning', 'Username Pendek', 'Username minimal 3 karakter!'); return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showAlert('warning', 'Username Tidak Valid', 'Gunakan huruf, angka, atau underscore saja!'); return;
  }
  if (password.length < 6) {
    showAlert('warning', 'Password Lemah', 'Password minimal 6 karakter!'); return;
  }
  if (password !== passwordConfirm) {
    showAlert('warning', 'Password Tidak Cocok', 'Konfirmasi password tidak sesuai!'); return;
  }

  setLoading('registerBtn', true, 'Mendaftarkan...');

  try {
    const users = await getUsers();
    const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      setLoading('registerBtn', false);
      showAlert('error', 'Username Sudah Dipakai', 'Pilih username lain!'); return;
    }

    const newUser = {
      username,
      password: hashPassword(password),
      credit: 0,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    await setUsers(users);

    setLoading('registerBtn', false);
    await showAlert('success', 'Akun Berhasil Dibuat!', `Akun <b>${escapeHtml(username)}</b> sudah terdaftar. Silahkan login sekarang!`);
    window.location.href = 'index.html';
  } catch (e) {
    setLoading('registerBtn', false);
    showAlert('error', 'Registrasi Gagal', 'Terjadi kesalahan server. Coba lagi.');
  }
}

// ============================================================
// HOME PAGE INIT
// ============================================================
async function initHomePage() {
  const sess = getSession() || checkRememberMe();
  if (!sess) { window.location.href = 'index.html'; return; }

  setSession(sess); // refresh session

  // Update nav
  const navUser = document.getElementById('navUsername');
  const navCredit = document.getElementById('navCredit');
  if (navUser) navUser.textContent = escapeHtml(sess.username);

  // Fetch fresh user data
  const users = await getUsers();
  const currentUser = users.find(u => u.username.toLowerCase() === sess.username.toLowerCase());
  if (currentUser) {
    setSession(currentUser);
    if (navCredit) navCredit.textContent = formatRupiah(currentUser.credit || 0);
  }

  // Load settings
  const settings = await getSettings();

  // Check maintenance mode
  if (settings.maintenance) {
    const mo = document.getElementById('maintenanceOverlay');
    const mt = document.getElementById('maintenanceText');
    if (mo) mo.style.display = 'flex';
    if (mt) mt.textContent = settings.maintenanceReason || 'Website sedang dalam pemeliharaan.';
    return; // Block dashboard
  }

  // Running text
  if (settings.runningText && settings.runningTextContent) {
    const bar = document.getElementById('runningTextBar');
    const t1 = document.getElementById('tickerText1');
    const t2 = document.getElementById('tickerText2');
    if (bar) bar.style.display = 'block';
    if (t1) t1.textContent = settings.runningTextContent;
    if (t2) t2.textContent = settings.runningTextContent;
  }

  // Welcome popup
  if (settings.welcomePopup) {
    const wpUser = document.getElementById('welcomeUsername');
    if (wpUser) wpUser.textContent = `👋 ${escapeHtml(sess.username)}`;
    setTimeout(() => openModal('welcomePopup'), 500);
  }

  // Notif 2
  if (settings.notif2 && settings.notif2Text) {
    const n2Icon = document.getElementById('notif2Icon');
    const n2Title = document.getElementById('notif2Title');
    const n2Text = document.getElementById('notif2Text');
    if (n2Icon) n2Icon.innerHTML = `<i class="${escapeHtml(settings.notif2Icon || 'fas fa-info-circle')}"></i>`;
    if (n2Title) {
      const iconNames = {
        'fas fa-exclamation-circle': 'Attention', 'fas fa-exclamation-triangle': 'Warning',
        'fas fa-info-circle': 'Information', 'fas fa-bullhorn': 'Announcement', 'fas fa-shield-alt': 'Security Alert'
      };
      n2Title.textContent = iconNames[settings.notif2Icon] || 'Notification';
    }
    if (n2Text) n2Text.textContent = settings.notif2Text;
    setTimeout(() => openModal('notif2Popup'), settings.welcomePopup ? 1000 : 500);
  }

  // Load products
  loadProducts();
  showSection('products');
  initScrollAnimations();
}

// ============================================================
// SHOW SECTION
// ============================================================
function showSection(name) {
  ['products', 'transactions', 'faq'].forEach(s => {
    const el = document.getElementById(`section${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (el) el.style.display = s === name ? 'block' : 'none';
  });

  // Update bottom nav active state
  ['products', 'transactions', 'faq'].forEach(s => {
    const btn = document.getElementById(`navBtn${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (btn) btn.style.color = s === name ? 'var(--primary-light)' : 'var(--text-muted)';
  });

  if (name === 'transactions') loadUserTransactions();
  if (name === 'faq') loadFAQ();
}

// ============================================================
// PRODUCTS
// ============================================================
async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p class="empty-state-title">Memuat produk...</p></div>';

  const products = await getProducts();
  const count = document.getElementById('productCount');
  if (count) count.textContent = `${products.length} produk tersedia`;

  if (products.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p class="empty-state-title">Belum ada produk tersedia</p><p style="font-size:0.8rem;color:var(--text-muted);">Hubungi admin untuk menambahkan produk</p></div>';
    return;
  }

  grid.innerHTML = '';
  products.forEach((prod, i) => {
    const card = document.createElement('div');
    card.className = 'product-card fade-in-scroll';
    card.style.animationDelay = (i * 0.1) + 's';

    const startPrice = prod.hargaFull?.[0]?.harga || 0;
    const featureList = (prod.fitur || []).slice(0, 4).map(f => `<li>${escapeHtml(f)}</li>`).join('');

    card.innerHTML = `
      <div class="product-image-wrap">
        ${prod.image
          ? `<img src="${escapeHtml(prod.image)}" alt="${escapeHtml(prod.nama)}" class="product-image" onerror="this.parentElement.innerHTML='<div class=&quot;product-image-placeholder&quot;><i class=&quot;fas fa-gem&quot;></i></div>'">`
          : '<div class="product-image-placeholder"><i class="fas fa-gem"></i></div>'
        }
        <span class="product-badge">HOT</span>
      </div>
      <div class="product-body">
        <div class="product-name">${escapeHtml(prod.nama)}</div>
        <div class="product-desc">${escapeHtml(prod.desc || '')}</div>
        <ul class="product-features">${featureList}</ul>
        <div class="product-price-tag">
          <i class="fas fa-tag"></i> Mulai dari ${formatRupiah(startPrice)}
        </div>
      </div>`;

    card.addEventListener('click', () => openBuyModal(prod));
    grid.appendChild(card);
  });
  initScrollAnimations();
}

// ============================================================
// BUY MODAL
// ============================================================
function openBuyModal(prod) {
  const title = document.getElementById('buyModalTitle');
  if (title) title.textContent = escapeHtml(prod.nama);

  const body = document.getElementById('buyModalBody');
  if (!body) return;

  const hasRental = prod.rentalEnabled && prod.hargaRental && prod.hargaRental.length > 0;

  let fullOptions = (prod.hargaFull || []).map((h, i) => `
    <label class="price-option" onclick="selectPriceOption(this, ${h.harga}, 'full')">
      <input type="radio" name="priceSelect" value="${h.harga}" data-type="full" data-label="${escapeHtml(h.label)}">
      <span class="price-label">${escapeHtml(h.label)}</span>
      <span class="price-amount">${formatRupiah(h.harga)}</span>
    </label>`).join('');

  let rentalOptions = hasRental ? (prod.hargaRental || []).map((h, i) => `
    <label class="price-option" onclick="selectPriceOption(this, ${h.harga}, 'rental')">
      <input type="radio" name="priceSelect" value="${h.harga}" data-type="rental" data-label="${escapeHtml(h.label)}">
      <span class="price-label">${escapeHtml(h.label)}</span>
      <span class="price-amount">${formatRupiah(h.harga)}</span>
    </label>`).join('') : '';

  body.innerHTML = `
    <div style="margin-bottom:15px;">
      ${hasRental ? `
      <div class="plan-tabs">
        <button class="plan-tab active" onclick="switchPlanTab('full',this)"><i class="fas fa-key"></i> Access Full Key</button>
        <button class="plan-tab" onclick="switchPlanTab('rental',this)"><i class="fas fa-clock"></i> Rental Keys</button>
      </div>` : ''}
      <div class="price-options active" id="optFull">${fullOptions}</div>
      ${hasRental ? `<div class="price-options" id="optRental">${rentalOptions}</div>` : ''}
    </div>

    <div class="quantity-row">
      <span class="quantity-label"><i class="fas fa-layer-group" style="margin-right:6px;color:var(--primary);"></i> Quantity:</span>
      <button class="qty-btn" onclick="changeQty(-1)"><i class="fas fa-minus"></i></button>
      <span class="qty-display" id="qtyDisplay">1</span>
      <button class="qty-btn" onclick="changeQty(1)"><i class="fas fa-plus"></i></button>
    </div>

    <div class="total-price-display">
      <div class="total-label">Total Pembayaran</div>
      <div class="total-amount" id="totalAmount">Pilih opsi terlebih dahulu</div>
    </div>

    <div class="form-group">
      <label class="form-label"><i class="fas fa-ticket-alt" style="margin-right:5px;color:var(--primary);"></i> Kode Promo (Opsional)</label>
      <div style="display:flex;gap:10px;">
        <div class="input-wrapper" style="flex:1;">
          <i class="fas fa-hashtag input-icon"></i>
          <input type="text" class="form-input" id="promoInput" placeholder="Masukan kode promo..." style="text-transform:uppercase" maxlength="20">
        </div>
        <button class="btn btn-secondary btn-sm" onclick="applyPromo()"><i class="fas fa-check"></i> Apply</button>
      </div>
      <div id="promoStatus" style="font-family:'Rajdhani',sans-serif;font-size:0.82rem;margin-top:5px;"></div>
    </div>

    <div class="form-group">
      <label class="form-label"><i class="fab fa-whatsapp" style="margin-right:5px;color:#25d366;"></i> Nomor WhatsApp</label>
      <div class="input-wrapper">
        <i class="fab fa-whatsapp input-icon"></i>
        <input type="text" class="form-input" id="waNumber" placeholder="Contoh: 08123456789" maxlength="15">
      </div>
    </div>

    <button class="btn btn-primary" id="buyNowBtn" onclick="processBuy('${escapeHtml(prod.id)}', '${escapeHtml(prod.nama)}')">
      <i class="fas fa-shopping-cart"></i> Buy Now
    </button>`;

  // Store current product in modal
  body.dataset.prodId = prod.id;
  body.dataset.basePrice = 0;
  body.dataset.qty = 1;
  body.dataset.discountPct = 0;

  openModal('buyModal');
}

function switchPlanTab(type, btn) {
  document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.price-options').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('opt' + type.charAt(0).toUpperCase() + type.slice(1));
  if (target) target.classList.add('active');
  // Reset selection
  document.querySelectorAll('.price-option').forEach(p => p.classList.remove('selected'));
  document.querySelectorAll('input[name="priceSelect"]').forEach(r => r.checked = false);
  updateTotal(0);
}

function selectPriceOption(label, price, type) {
  document.querySelectorAll('.price-option').forEach(p => p.classList.remove('selected'));
  label.classList.add('selected');
  const body = document.getElementById('buyModalBody');
  if (body) body.dataset.basePrice = price;
  updateTotal(price);
}

function changeQty(delta) {
  const display = document.getElementById('qtyDisplay');
  const body = document.getElementById('buyModalBody');
  if (!display || !body) return;
  let qty = parseInt(display.textContent) + delta;
  if (qty < 1) qty = 1;
  if (qty > 99) qty = 99;
  display.textContent = qty;
  body.dataset.qty = qty;
  const base = parseInt(body.dataset.basePrice) || 0;
  const disc = parseInt(body.dataset.discountPct) || 0;
  const afterDisc = Math.round(base * (1 - disc / 100));
  updateTotal(afterDisc);
}

function updateTotal(basePrice) {
  const display = document.getElementById('totalAmount');
  const body = document.getElementById('buyModalBody');
  const qty = parseInt(body?.dataset?.qty || 1);
  if (!display) return;
  if (!basePrice || basePrice === 0) { display.textContent = 'Pilih opsi terlebih dahulu'; return; }
  display.textContent = formatRupiah(basePrice * qty);
}

async function applyPromo() {
  const code = sanitizeInput(document.getElementById('promoInput')?.value || '').toUpperCase();
  const statusEl = document.getElementById('promoStatus');
  const body = document.getElementById('buyModalBody');
  if (!code) { if (statusEl) statusEl.innerHTML = '<span style="color:var(--warning);">Masukan kode promo.</span>'; return; }

  const promos = await getPromo();
  const promo = promos.find(p => p.code === code);
  const sess = getSession();

  if (!promo) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-times"></i> Kode promo tidak ditemukan.</span>';
    return;
  }

  if ((promo.usedCount || 0) >= promo.maxUse) {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);"><i class="fas fa-ban"></i> Promo sudah mencapai batas ${promo.maxUse} pengguna.</span>`;
    return;
  }

  // Check if user already used this promo
  if (promo.usedBy && promo.usedBy.includes(sess.username)) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--danger);"><i class="fas fa-ban"></i> Anda sudah pernah menggunakan promo ini.</span>';
    return;
  }

  if (statusEl) statusEl.innerHTML = `<span style="color:var(--success);"><i class="fas fa-check"></i> Promo valid! Diskon ${promo.percent}% berhasil diterapkan.</span>`;
  if (body) {
    body.dataset.discountPct = promo.percent;
    body.dataset.promoCode = code;
    const base = parseInt(body.dataset.basePrice) || 0;
    const qty = parseInt(body.dataset.qty) || 1;
    const afterDisc = Math.round(base * (1 - promo.percent / 100));
    updateTotal(afterDisc);
  }
}

async function processBuy(prodId, prodNama) {
  const sess = getSession();
  if (!sess) { window.location.href = 'index.html'; return; }

  const body = document.getElementById('buyModalBody');
  const selectedRadio = document.querySelector('input[name="priceSelect"]:checked');
  const wa = sanitizeInput(document.getElementById('waNumber')?.value || '');

  if (!selectedRadio) { showAlert('warning', 'Pilih Opsi', 'Silahkan pilih paket terlebih dahulu!'); return; }
  if (!wa) { showAlert('warning', 'No. WhatsApp', 'Masukan nomor WhatsApp Anda!'); return; }
  if (!/^[0-9]{10,15}$/.test(wa.replace(/\s/g, ''))) { showAlert('warning', 'Format WA Salah', 'Masukan nomor WA yang valid (10-15 digit)!'); return; }

  const basePrice = parseInt(selectedRadio.value);
  const discPct = parseInt(body.dataset.discountPct) || 0;
  const qty = parseInt(body.dataset.qty) || 1;
  const finalPrice = Math.round(basePrice * (1 - discPct / 100)) * qty;
  const planType = selectedRadio.dataset.type === 'rental' ? 'Rental Keys' : 'Access Full Key';
  const planLabel = selectedRadio.dataset.label;
  const promoCode = body.dataset.promoCode || '';

  // Check credit
  const users = await getUsers();
  const userIdx = users.findIndex(u => u.username.toLowerCase() === sess.username.toLowerCase());
  if (userIdx === -1) { showAlert('error', 'Error', 'User tidak ditemukan!'); return; }

  const user = users[userIdx];
  if ((user.credit || 0) < finalPrice) {
    showAlert('error', 'Saldo Tidak Cukup', `Saldo Anda: ${formatRupiah(user.credit || 0)}<br>Harga: ${formatRupiah(finalPrice)}<br><br>Hubungi admin untuk top up saldo.`);
    return;
  }

  const result = await Swal.fire({
    title: 'Konfirmasi Pembelian',
    html: `
      <div style="text-align:left;padding:10px 0;font-family:'Exo 2',sans-serif;">
        <p style="margin-bottom:8px;"><b>Produk:</b> ${escapeHtml(prodNama)}</p>
        <p style="margin-bottom:8px;"><b>Paket:</b> ${escapeHtml(planType)} - ${escapeHtml(planLabel)}</p>
        <p style="margin-bottom:8px;"><b>Quantity:</b> ${qty}x</p>
        ${discPct > 0 ? `<p style="margin-bottom:8px;color:#10b981;"><b>Diskon:</b> ${discPct}%</p>` : ''}
        <p style="margin-bottom:8px;"><b>Total:</b> <span style="color:var(--primary-light);font-weight:700;">${formatRupiah(finalPrice)}</span></p>
      </div>`,
    icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Beli!', cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  setLoading('buyNowBtn', true, 'Memproses...');

  try {
    // Deduct credit
    users[userIdx].credit = (user.credit || 0) - finalPrice;
    await setUsers(users);
    setSession(users[userIdx]);

    // Update nav credit
    const navCredit = document.getElementById('navCredit');
    if (navCredit) navCredit.textContent = formatRupiah(users[userIdx].credit);

    // If promo used, mark it
    if (promoCode) {
      const promos = await getPromo();
      const pIdx = promos.findIndex(p => p.code === promoCode);
      if (pIdx !== -1) {
        promos[pIdx].usedCount = (promos[pIdx].usedCount || 0) + 1;
        if (!promos[pIdx].usedBy) promos[pIdx].usedBy = [];
        promos[pIdx].usedBy.push(sess.username);
        await setPromo(promos);
      }
    }

    // Create transaction
    const trxId = generateId('TRX');
    const transactions = await getTransactions();
    const newTrx = {
      id: trxId, username: sess.username, prodId, prodNama,
      planType, planLabel, qty, basePrice, discPct, totalPrice: finalPrice,
      promoCode, waNumber: wa, status: 'waiting', keys: [],
      createdAt: new Date().toISOString()
    };
    transactions.push(newTrx);
    await setTransactions(transactions);

    // Update stats
    const settings = await getSettings();
    const today = new Date().toDateString();
    if (settings.lastReset !== today) {
      settings.terjualHariIni = 0; settings.lastReset = today;
    }
    settings.totalPenghasilan = (settings.totalPenghasilan || 0) + finalPrice;
    settings.terjualHariIni = (settings.terjualHariIni || 0) + qty;
    await setSettings(settings);

    setLoading('buyNowBtn', false);
    closeModal('buyModal');

    await showAlert('success', 'Pembelian Berhasil! 🎉',
      `Transaksi <b>${trxId}</b> berhasil dibuat.<br><br>Saldo dipotong: <b>${formatRupiah(finalPrice)}</b><br>Kami akan memproses pesanan Anda segera. Cek <b>Logs Transaksi</b> untuk status.`);

  } catch (e) {
    setLoading('buyNowBtn', false);
    showAlert('error', 'Error', 'Terjadi kesalahan. Coba lagi.');
  }
}

// ============================================================
// USER TRANSACTIONS
// ============================================================
async function loadUserTransactions() {
  const sess = getSession();
  const list = document.getElementById('transactionList');
  if (!list || !sess) return;
  list.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p class="empty-state-title">Memuat...</p></div>';

  const transactions = await getTransactions();
  const myTrx = transactions.filter(t => t.username.toLowerCase() === sess.username.toLowerCase())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (myTrx.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p class="empty-state-title">Belum ada transaksi</p><p style="font-size:0.8rem;color:var(--text-muted);">Beli produk untuk memulai</p></div>';
    return;
  }

  list.innerHTML = '';
  myTrx.forEach(trx => {
    const item = document.createElement('div');
    item.className = 'transaction-item';
    const statusClass = `status-${trx.status}`;
    const statusLabel = trx.status === 'waiting' ? 'Menunggu' : trx.status === 'approved' ? 'Approved' : 'Rejected';
    item.innerHTML = `
      <div class="trx-info">
        <div class="trx-product">${escapeHtml(trx.prodNama)}</div>
        <div class="trx-date">${escapeHtml(trx.planType)} • ${escapeHtml(trx.planLabel)} • ${formatDate(trx.createdAt)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <div class="trx-amount">${formatRupiah(trx.totalPrice)}</div>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>`;
    item.addEventListener('click', () => showTrxDetail(trx));
    list.appendChild(item);
  });
}

function showTrxDetail(trx) {
  const body = document.getElementById('trxDetailBody');
  if (!body) return;
  const statusClass = `status-${trx.status}`;
  const statusLabel = trx.status === 'waiting' ? 'Menunggu' : trx.status === 'approved' ? '✅ Approved' : '❌ Rejected';
  const keysHtml = trx.keys && trx.keys.length > 0
    ? trx.keys.map(k => `<div style="background:rgba(124,58,237,0.1);border:1px solid var(--border-glow);border-radius:8px;padding:10px 14px;font-family:'Courier New',monospace;font-size:0.9rem;color:var(--accent);margin-bottom:6px;word-break:break-all;">${escapeHtml(k)}</div>`).join('')
    : '<p style="color:var(--text-muted);font-family:\'Rajdhani\',sans-serif;font-size:0.85rem;">Key belum dikirim. Tunggu konfirmasi admin.</p>';

  body.innerHTML = `
    <div style="font-family:'Exo 2',sans-serif;">
      <div style="background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(232,121,249,0.05));border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid var(--border);">
        <p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">ID Transaksi</p>
        <p style="font-family:'Orbitron',sans-serif;font-size:0.85rem;color:var(--primary-light);">${escapeHtml(trx.id)}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
        <div><p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;">PRODUK</p><p style="font-weight:600;">${escapeHtml(trx.prodNama)}</p></div>
        <div><p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;">PAKET</p><p style="font-weight:600;">${escapeHtml(trx.planType)}</p></div>
        <div><p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;">PILIHAN</p><p style="font-weight:600;">${escapeHtml(trx.planLabel)}</p></div>
        <div><p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;">QTY</p><p style="font-weight:600;">${trx.qty}x</p></div>
        <div><p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;">TANGGAL</p><p style="font-weight:600;font-size:0.82rem;">${formatDate(trx.createdAt)}</p></div>
        <div><p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;">TOTAL</p><p style="font-weight:700;color:var(--primary-light);">${formatRupiah(trx.totalPrice)}</p></div>
      </div>
      <div style="margin-bottom:15px;display:flex;align-items:center;justify-content:space-between;">
        <p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;">STATUS</p>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
      <div>
        <p style="font-size:0.75rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
          <i class="fas fa-key" style="color:var(--primary);margin-right:5px;"></i> Keys
        </p>
        ${keysHtml}
      </div>
    </div>`;
  openModal('trxDetailModal');
}

// ============================================================
// RESET KEY
// ============================================================
function openResetKey() {
  document.getElementById('resetKeyInput').value = '';
  const term = document.getElementById('terminalOutput');
  const lines = document.getElementById('terminalLines');
  if (term) term.style.display = 'none';
  if (lines) lines.innerHTML = '';
  openModal('resetKeyModal');
}

async function processResetKey() {
  const input = sanitizeInput(document.getElementById('resetKeyInput')?.value || '');
  if (!input) { showAlert('warning', 'Input Kosong', 'Masukan nomor key terlebih dahulu!'); return; }

  const settings = await getSettings();
  const term = document.getElementById('terminalOutput');
  const lines = document.getElementById('terminalLines');
  if (term) term.style.display = 'block';
  if (lines) lines.innerHTML = '';

  const addLine = (text, delay) => {
    setTimeout(() => {
      if (!lines) return;
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = text;
      line.style.animationDelay = '0s';
      lines.appendChild(line);
    }, delay);
  };

  addLine('$ Connecting to server...', 100);
  addLine('$ Fetching Server.....', 400);
  addLine('$ Response Database....', 900);

  setTimeout(async () => {
    if (!settings.resetKey) {
      addLine('<span style="color:#ef4444;">✗ ERROR: Service unavailable</span>', 0);
      setTimeout(() => {
        addLine(`<br><span style="color:#ef4444;">❌ Reset Gagal</span><br><span style="color:#f87171;">Maaf fitur ini sedang di nonaktifkan oleh admin atau sedang tidak beroperasi normal. Silahkan coba lagi nanti.</span>`, 0);
      }, 400);
      return;
    }

    // Check daily limit
    const sess = getSession();
    const users = await getUsers();
    const userIdx = users.findIndex(u => u.username === sess.username);
    const today = new Date().toDateString();

    if (userIdx !== -1) {
      const user = users[userIdx];
      if (user.lastResetDate === today && user.resetCount >= 1) {
        addLine('<span style="color:#f97316;">⚠ Daily limit reached</span>', 0);
        setTimeout(() => {
          addLine(`<br><span style="color:#f97316;">❌ Reset Gagal - Batas Reset</span><br><span>Anda sudah melakukan reset hari ini. Coba lagi besok.</span>`, 0);
        }, 400);
        return;
      }

      // Success
      addLine('<span style="color:#22c55e;">✓ Connection established</span>', 0);
      setTimeout(() => addLine('<span style="color:#22c55e;">✓ Key found in database</span>', 0), 300);
      setTimeout(() => addLine('<span style="color:#22c55e;">✓ Resetting device binding...</span>', 0), 700);
      setTimeout(() => {
        const resetCount = (user.resetCount || 0) + 1;
        const timestamp = new Date().toLocaleString('id-ID');
        const nextReset = new Date(Date.now() + 86400000).toLocaleString('id-ID');

        users[userIdx].lastResetDate = today;
        users[userIdx].resetCount = resetCount;
        setUsers(users);

        addLine(`<br><span style="color:#22c55e;font-size:1rem;">✅ Reset Successful</span><br><br><span>Status: 200</span><br><span>Response: {</span><br><span>&nbsp;&nbsp;"success": true,</span><br><span>&nbsp;&nbsp;"message": "Token reset successfully",</span><br><span>&nbsp;&nbsp;"key": "${escapeHtml(input)}",</span><br><span>&nbsp;&nbsp;"resetsUsed": ${resetCount},</span><br><span>&nbsp;&nbsp;"resetsMax": 1,</span><br><span>&nbsp;&nbsp;"resetTime": "${timestamp}",</span><br><span>&nbsp;&nbsp;"nextReset": "${nextReset}"</span><br><span>}</span>`, 0);
      }, 1200);
    }
  }, 1400);
}

// ============================================================
// FAQ
// ============================================================
function loadFAQ() {
  const list = document.getElementById('faqList');
  if (!list) return;
  const faqs = [
    { q: 'Bagaimana cara membeli key di Drip Client?', a: 'Pilih produk yang diinginkan, klik pada card produk, pilih paket yang sesuai (Access Full Key atau Rental), masukan jumlah dan nomor WhatsApp Anda, lalu klik Buy Now. Pastikan saldo Anda mencukupi.' },
    { q: 'Berapa lama proses pengiriman key setelah pembayaran?', a: 'Key akan dikirim setelah admin memverifikasi dan menyetujui transaksi Anda. Biasanya proses ini memakan waktu 5-30 menit pada jam aktif.' },
    { q: 'Bagaimana cara top up saldo / credit?', a: 'Hubungi admin melalui WhatsApp atau platform yang tersedia. Admin akan memproses top up saldo Anda sesuai nominal yang diminta.' },
    { q: 'Apakah key yang saya beli aman dari ban?', a: 'Kami menyediakan fitur antiban advanced pada produk kami. Namun penggunaan tetap menjadi tanggung jawab pengguna. Selalu gunakan dengan bijak.' },
    { q: 'Apa itu fitur Reset Key?', a: 'Fitur Reset Key memungkinkan Anda untuk mereset binding device pada key Anda. Berguna jika Anda berganti perangkat. Dibatasi 1x per hari per akun.' },
    { q: 'Bagaimana cara menggunakan kode promo?', a: 'Saat membeli produk, masukan kode promo pada field "Kode Promo" dan klik Apply. Diskon akan otomatis teraplikasi pada total harga. Setiap kode promo hanya bisa digunakan 1x per akun.' },
    { q: 'Apakah ada refund jika key tidak berfungsi?', a: 'Jika key tidak berfungsi dan sudah dikonfirmasi oleh admin, kami akan mengirim ulang key yang valid atau mengembalikan saldo Anda. Hubungi admin segera.' },
    { q: 'Bagaimana cara mengecek status transaksi saya?', a: 'Klik menu "Transaksi" atau "Logs Transaksi" di dashboard Anda. Setiap transaksi menampilkan status real-time: Menunggu, Approved, atau Rejected.' },
  ];

  list.innerHTML = '';
  faqs.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'faq-item fade-in-scroll';
    item.innerHTML = `
      <div class="faq-question" onclick="toggleFaq(this)">
        <span>${escapeHtml(f.q)}</span>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-answer">${escapeHtml(f.a)}</div>`;
    list.appendChild(item);
  });
  initScrollAnimations();
}

function toggleFaq(questionEl) {
  const item = questionEl.parentElement;
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// ============================================================
// LOGOUT
// ============================================================
function handleLogout() {
  Swal.fire({
    title: 'Logout?', text: 'Apakah Anda yakin ingin keluar?',
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Ya, Logout', cancelButtonText: 'Batal'
  }).then(r => {
    if (r.isConfirmed) {
      clearSession();
      window.location.href = 'index.html';
    }
  });
}

// ============================================================
// ADMIN PAGE INIT
// ============================================================
async function initAdminPage() {
  loadAdminStats();
  loadAdminProducts();
  loadAdminTransactions();
  loadAdminPromos();
  loadAdminUsers();
  loadAdminSettings();
}

function switchAdminTab(name) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById(`panel${name.charAt(0).toUpperCase() + name.slice(1)}`);
  const tab = document.getElementById(`tab${name.charAt(0).toUpperCase() + name.slice(1)}`);
  if (panel) panel.classList.add('active');
  if (tab) tab.classList.add('active');
}

// ============================================================
// ADMIN STATS
// ============================================================
async function loadAdminStats() {
  const settings = await getSettings();
  const today = new Date().toDateString();
  // Reset daily if needed
  if (settings.lastReset !== today) {
    settings.terjualHariIni = 0; settings.lastReset = today;
    await setSettings(settings);
  }

  const users = await getUsers();
  const transactions = await getTransactions();
  const approvedTrx = transactions.filter(t => t.status === 'approved');

  const statTot = document.getElementById('statTotalPembeli');
  const statPeng = document.getElementById('statPenghasilan');
  const statHari = document.getElementById('statHariIni');

  if (statTot) statTot.textContent = new Set(approvedTrx.map(t => t.username)).size;
  if (statPeng) statPeng.textContent = formatRupiah(settings.totalPenghasilan || 0);
  if (statHari) statHari.textContent = settings.terjualHariIni || 0;

  // Animate stat cards
  document.querySelectorAll('.stat-card').forEach((card, i) => {
    setTimeout(() => card.style.opacity = '1', i * 100 + 100);
  });
}

// ============================================================
// ADMIN PRODUCTS
// ============================================================
async function loadAdminProducts() {
  const listEl = document.getElementById('adminProductList');
  if (!listEl) return;
  const products = await getProducts();

  if (products.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p class="empty-state-title">Belum ada produk</p></div>';
    return;
  }

  listEl.innerHTML = '';
  products.forEach(prod => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:15px;padding:14px;border:1px solid var(--border);border-radius:12px;margin-bottom:10px;background:rgba(255,255,255,0.02);';
    item.innerHTML = `
      <div style="width:50px;height:50px;border-radius:10px;overflow:hidden;flex-shrink:0;background:rgba(124,58,237,0.1);">
        ${prod.image ? `<img src="${escapeHtml(prod.image)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--primary);"><i class="fas fa-gem"></i></div>'}
      </div>
      <div style="flex:1;">
        <p style="font-family:\'Rajdhani\',sans-serif;font-weight:700;font-size:0.95rem;">${escapeHtml(prod.nama)}</p>
        <p style="font-size:0.78rem;color:var(--text-muted);font-family:\'Rajdhani\',sans-serif;">${(prod.hargaFull || []).length} opsi harga${prod.rentalEnabled ? ' + Rental' : ''}</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm" onclick="editProduct('${escapeHtml(prod.id)}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${escapeHtml(prod.id)}')"><i class="fas fa-trash"></i></button>
      </div>`;
    listEl.appendChild(item);
  });
}

function addHargaRow(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rows = container.querySelectorAll('.harga-row');
  if (rows.length >= 5) { showAlert('warning', 'Batas Maksimal', 'Maksimal 5 opsi harga!'); return; }
  const row = document.createElement('div');
  row.className = 'harga-row';
  row.innerHTML = `
    <div class="input-wrapper" style="flex:1;">
      <i class="fas fa-tag input-icon"></i>
      <input type="text" class="form-input" placeholder="Label" style="padding-left:42px;">
    </div>
    <div class="input-wrapper" style="flex:1;">
      <i class="fas fa-dollar-sign input-icon"></i>
      <input type="number" class="form-input" placeholder="Harga (Rp)" style="padding-left:42px;">
    </div>
    <button onclick="this.parentElement.remove()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:8px;color:#ef4444;width:34px;height:34px;cursor:pointer;flex-shrink:0;">
      <i class="fas fa-times"></i>
    </button>`;
  container.appendChild(row);
}

async function addProduct() {
  const nama = sanitizeInput(document.getElementById('prodNama')?.value || '');
  const image = document.getElementById('prodImage')?.value || '';
  const desc = sanitizeInput(document.getElementById('prodDesc')?.value || '');
  const fiturStr = sanitizeInput(document.getElementById('prodFitur')?.value || '');

  if (!nama) { showAlert('warning', 'Nama Kosong', 'Masukan nama produk!'); return; }

  const hargaFull = getHargaFromContainer('hargaFullKeyContainer');
  if (hargaFull.length === 0) { showAlert('warning', 'Harga Diperlukan', 'Masukan minimal 1 opsi harga!'); return; }

  const rentalEnabled = document.getElementById('rentalKeySwitch')?.checked || false;
  const hargaRental = rentalEnabled ? getHargaFromContainer('hargaRentalContainer') : [];

  const products = await getProducts();
  const newProd = {
    id: generateId('PROD'), nama, image, desc,
    fitur: fiturStr ? fiturStr.split(',').map(f => f.trim()).filter(Boolean) : [],
    hargaFull, hargaRental, rentalEnabled,
    createdAt: new Date().toISOString()
  };
  products.push(newProd);
  await setProducts(products);

  // Reset form
  ['prodNama', 'prodImage', 'prodDesc', 'prodFitur'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  resetHargaContainer('hargaFullKeyContainer');
  resetHargaContainer('hargaRentalContainer');

  await loadAdminProducts();
  showAlert('success', 'Produk Ditambahkan!', `Produk "${escapeHtml(nama)}" berhasil ditambahkan.`);
}

function getHargaFromContainer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const rows = container.querySelectorAll('.harga-row');
  const result = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs.length >= 2) {
      const label = sanitizeInput(inputs[0].value);
      const harga = parseInt(inputs[1].value) || 0;
      if (label && harga > 0) result.push({ label, harga });
    }
  });
  return result;
}

function resetHargaContainer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rows = container.querySelectorAll('.harga-row');
  rows.forEach((row, i) => {
    if (i === 0) { row.querySelectorAll('input').forEach(inp => inp.value = ''); }
    else row.remove();
  });
}

async function deleteProduct(prodId) {
  const result = await Swal.fire({
    title: 'Hapus Produk?', text: 'Produk akan dihapus permanen!',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
  });
  if (!result.isConfirmed) return;
  let products = await getProducts();
  products = products.filter(p => p.id !== prodId);
  await setProducts(products);
  await loadAdminProducts();
  showAlert('success', 'Dihapus', 'Produk berhasil dihapus.');
}

async function editProduct(prodId) {
  const products = await getProducts();
  const prod = products.find(p => p.id === prodId);
  if (!prod) return;

  const { value: formValues } = await Swal.fire({
    title: 'Edit Produk',
    html: `
      <div style="text-align:left;">
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:5px;font-family:\'Rajdhani\',sans-serif;">NAMA PRODUK</p>
        <input id="editNama" class="swal2-input" value="${escapeHtml(prod.nama)}" placeholder="Nama produk" style="font-family:\'Exo 2\',sans-serif;">
        <p style="font-size:0.8rem;color:var(--text-muted);margin:10px 0 5px;font-family:\'Rajdhani\',sans-serif;">URL GAMBAR</p>
        <input id="editImage" class="swal2-input" value="${escapeHtml(prod.image || '')}" placeholder="URL gambar" style="font-family:\'Exo 2\',sans-serif;">
        <p style="font-size:0.8rem;color:var(--text-muted);margin:10px 0 5px;font-family:\'Rajdhani\',sans-serif;">DESKRIPSI</p>
        <input id="editDesc" class="swal2-input" value="${escapeHtml(prod.desc || '')}" placeholder="Deskripsi" style="font-family:\'Exo 2\',sans-serif;">
        <p style="font-size:0.8rem;color:var(--text-muted);margin:10px 0 5px;font-family:\'Rajdhani\',sans-serif;">FITUR (pisah koma)</p>
        <input id="editFitur" class="swal2-input" value="${escapeHtml((prod.fitur || []).join(', '))}" placeholder="Fitur" style="font-family:\'Exo 2\',sans-serif;">
      </div>`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Simpan', cancelButtonText: 'Batal',
    preConfirm: () => ({
      nama: sanitizeInput(document.getElementById('editNama').value),
      image: document.getElementById('editImage').value,
      desc: sanitizeInput(document.getElementById('editDesc').value),
      fitur: document.getElementById('editFitur').value.split(',').map(f => sanitizeInput(f.trim())).filter(Boolean)
    })
  });

  if (formValues) {
    const idx = products.findIndex(p => p.id === prodId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...formValues };
      await setProducts(products);
      await loadAdminProducts();
      showAlert('success', 'Disimpan', 'Produk berhasil diupdate!');
    }
  }
}

// ============================================================
// ADMIN TRANSACTIONS
// ============================================================
async function loadAdminTransactions() {
  const tbody = document.getElementById('adminTrxBody');
  if (!tbody) return;
  const transactions = await getTransactions();
  const sorted = [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">Belum ada transaksi</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  sorted.forEach(trx => {
    const statusClass = `status-${trx.status}`;
    const statusLabel = trx.status === 'waiting' ? 'Menunggu' : trx.status === 'approved' ? 'Approved' : 'Rejected';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'Courier New',monospace;font-size:0.78rem;color:var(--primary-light);">${escapeHtml(trx.id.substr(0, 14))}...</td>
      <td><b>${escapeHtml(trx.username)}</b></td>
      <td>${escapeHtml(trx.prodNama)}</td>
      <td style="font-size:0.8rem;">${escapeHtml(trx.planType)}<br><span style="color:var(--text-muted);">${escapeHtml(trx.planLabel)}</span></td>
      <td style="color:var(--primary-light);font-weight:700;">${formatRupiah(trx.totalPrice)}</td>
      <td>${escapeHtml(trx.waNumber || '-')}</td>
      <td style="font-size:0.78rem;">${formatDate(trx.createdAt)}</td>
      <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
      <td>
        ${trx.status === 'waiting' ? `
          <div style="display:flex;gap:5px;">
            <button class="btn btn-success btn-sm" onclick="adminApprove('${escapeHtml(trx.id)}')"><i class="fas fa-check"></i></button>
            <button class="btn btn-danger btn-sm" onclick="adminReject('${escapeHtml(trx.id)}')"><i class="fas fa-times"></i></button>
          </div>` : `<span style="color:var(--text-muted);font-size:0.8rem;">${trx.status === 'approved' ? '✅' : '❌'}</span>`}
      </td>`;
    tbody.appendChild(tr);
  });
}

async function adminApprove(trxId) {
  // Show key input form
  const transactions = await getTransactions();
  const trx = transactions.find(t => t.id === trxId);
  if (!trx) return;

  const body = document.getElementById('approveModalBody');
  if (!body) return;

  body.innerHTML = `
    <div style="margin-bottom:15px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border);">
      <p style="font-family:'Rajdhani',sans-serif;font-size:0.85rem;color:var(--text-secondary);"><b>User:</b> ${escapeHtml(trx.username)} | <b>Produk:</b> ${escapeHtml(trx.prodNama)}</p>
    </div>
    <p style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--text-secondary);margin-bottom:12px;">Masukan key/kode untuk dikirim ke user (min 1, maks 5):</p>
    <div id="keyInputsContainer">
      <div class="key-input-row">
        <div class="input-wrapper" style="flex:1;"><i class="fas fa-key input-icon"></i><input type="text" class="form-input key-input" placeholder="Masukan key 1..." style="padding-left:42px;"></div>
      </div>
    </div>
    <button class="btn btn-secondary btn-sm" style="margin:10px 0;" onclick="addKeyInput()"><i class="fas fa-plus"></i> Tambah Key</button>
    <button class="btn btn-success" onclick="submitApprove('${escapeHtml(trxId)}')">
      <i class="fas fa-paper-plane"></i> Kirim & Approve
    </button>`;
  openModal('approveModal');
}

function addKeyInput() {
  const c = document.getElementById('keyInputsContainer');
  if (!c) return;
  if (c.querySelectorAll('.key-input-row').length >= 5) { showAlert('warning', 'Maks 5 key', ''); return; }
  const row = document.createElement('div');
  row.className = 'key-input-row';
  const count = c.querySelectorAll('.key-input-row').length + 1;
  row.innerHTML = `
    <div class="input-wrapper" style="flex:1;"><i class="fas fa-key input-icon"></i><input type="text" class="form-input key-input" placeholder="Masukan key ${count}..." style="padding-left:42px;"></div>
    <button onclick="this.parentElement.remove()" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:8px;color:#ef4444;width:34px;height:34px;cursor:pointer;flex-shrink:0;"><i class="fas fa-times"></i></button>`;
  c.appendChild(row);
}

async function submitApprove(trxId) {
  const inputs = document.querySelectorAll('.key-input');
  const keys = Array.from(inputs).map(i => sanitizeInput(i.value)).filter(Boolean);
  if (keys.length === 0) { showAlert('warning', 'Key Kosong', 'Masukan minimal 1 key!'); return; }

  const transactions = await getTransactions();
  const idx = transactions.findIndex(t => t.id === trxId);
  if (idx === -1) return;

  transactions[idx].status = 'approved';
  transactions[idx].keys = keys;
  transactions[idx].approvedAt = new Date().toISOString();
  await setTransactions(transactions);

  // Update stats
  const settings = await getSettings();
  settings.totalPembeli = (settings.totalPembeli || 0) + 1;
  await setSettings(settings);

  closeModal('approveModal');
  await loadAdminTransactions();
  await loadAdminStats();
  showAlert('success', 'Approved! ✅', `Transaksi berhasil di-approve dan ${keys.length} key terkirim ke user.`);
}

async function adminReject(trxId) {
  const result = await Swal.fire({
    title: 'Reject Transaksi?', text: 'Saldo user akan dikembalikan.',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, Reject', cancelButtonText: 'Batal'
  });
  if (!result.isConfirmed) return;

  const transactions = await getTransactions();
  const idx = transactions.findIndex(t => t.id === trxId);
  if (idx === -1) return;

  const trx = transactions[idx];
  transactions[idx].status = 'rejected';
  transactions[idx].rejectedAt = new Date().toISOString();
  await setTransactions(transactions);

  // Refund credit
  const users = await getUsers();
  const uIdx = users.findIndex(u => u.username.toLowerCase() === trx.username.toLowerCase());
  if (uIdx !== -1) {
    users[uIdx].credit = (users[uIdx].credit || 0) + trx.totalPrice;
    await setUsers(users);
  }

  await loadAdminTransactions();
  showAlert('success', 'Rejected', 'Transaksi di-reject dan saldo user dikembalikan.');
}

// ============================================================
// ADMIN PROMO
// ============================================================
async function loadAdminPromos() {
  const listEl = document.getElementById('adminPromoList');
  if (!listEl) return;
  const promos = await getPromo();
  if (promos.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><i class="fas fa-tag"></i><p class="empty-state-title">Belum ada kode promo</p></div>';
    return;
  }
  listEl.innerHTML = '';
  promos.forEach(p => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;background:rgba(255,255,255,0.02);';
    item.innerHTML = `
      <div>
        <p style="font-family:'Orbitron',sans-serif;font-size:0.9rem;color:var(--primary-light);">${escapeHtml(p.code)}</p>
        <p style="font-family:'Rajdhani',sans-serif;font-size:0.82rem;color:var(--text-muted);">Diskon: ${p.percent}% | Terpakai: ${p.usedCount || 0}/${p.maxUse}</p>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deletePromo('${escapeHtml(p.code)}')"><i class="fas fa-trash"></i></button>`;
    listEl.appendChild(item);
  });
}

async function addPromoCode() {
  const code = sanitizeInput(document.getElementById('promoCode')?.value || '').toUpperCase();
  const percent = parseInt(document.getElementById('promoPercent')?.value || 0);
  const maxUse = parseInt(document.getElementById('promoMaxUse')?.value || 0);

  if (!code) { showAlert('warning', 'Kode Kosong', 'Masukan kode promo!'); return; }
  if (!percent || percent < 1 || percent > 100) { showAlert('warning', 'Persen Invalid', 'Persen diskon antara 1-100!'); return; }
  if (!maxUse || maxUse < 1) { showAlert('warning', 'Maks. Invalid', 'Masukan batas penggunaan!'); return; }

  const promos = await getPromo();
  if (promos.find(p => p.code === code)) { showAlert('error', 'Kode Duplikat', 'Kode promo sudah ada!'); return; }

  promos.push({ code, percent, maxUse, usedCount: 0, usedBy: [], createdAt: new Date().toISOString() });
  await setPromo(promos);

  ['promoCode', 'promoPercent', 'promoMaxUse'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  await loadAdminPromos();
  showAlert('success', 'Promo Ditambahkan!', `Kode ${code} berhasil ditambahkan.`);
}

async function deletePromo(code) {
  const result = await Swal.fire({ title: 'Hapus Promo?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus' });
  if (!result.isConfirmed) return;
  let promos = await getPromo();
  promos = promos.filter(p => p.code !== code);
  await setPromo(promos);
  await loadAdminPromos();
  showAlert('success', 'Dihapus', 'Kode promo dihapus.');
}

// ============================================================
// ADMIN SALDO
// ============================================================
async function loadAdminUsers() {
  const listEl = document.getElementById('userListAdmin');
  if (!listEl) return;
  const users = await getUsers();
  if (users.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p class="empty-state-title">Belum ada user</p></div>';
    return;
  }
  listEl.innerHTML = '';
  users.forEach(u => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:rgba(255,255,255,0.02);';
    item.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:white;font-weight:700;font-family:'Orbitron',sans-serif;">${escapeHtml(u.username.charAt(0).toUpperCase())}</div>
        <div>
          <p style="font-family:'Rajdhani',sans-serif;font-weight:700;">${escapeHtml(u.username)} ${u.isAdmin ? '<span style="font-size:0.7rem;background:rgba(124,58,237,0.2);border:1px solid var(--border-glow);border-radius:4px;padding:1px 6px;color:var(--primary-light);">ADMIN</span>' : ''}</p>
          <p style="font-size:0.78rem;color:var(--text-muted);font-family:'Rajdhani',sans-serif;">Credit: ${formatRupiah(u.credit || 0)}</p>
        </div>
      </div>`;
    listEl.appendChild(item);
  });
}

async function transferSaldo() {
  const username = sanitizeInput(document.getElementById('saldoUsername')?.value || '');
  const amount = parseInt(document.getElementById('saldoAmount')?.value || 0);

  if (!username) { showAlert('warning', 'Username Kosong', 'Masukan username user!'); return; }
  if (!amount || amount < 1) { showAlert('warning', 'Jumlah Invalid', 'Masukan jumlah credit yang valid!'); return; }

  const users = await getUsers();
  const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) { showAlert('error', 'User Tidak Ditemukan', `User "${escapeHtml(username)}" tidak ada di database!`); return; }

  users[idx].credit = (users[idx].credit || 0) + amount;
  await setUsers(users);
  await loadAdminUsers();

  document.getElementById('saldoUsername').value = '';
  document.getElementById('saldoAmount').value = '';
  showAlert('success', 'Saldo Terkirim! 💰', `${formatRupiah(amount)} berhasil ditransfer ke <b>${escapeHtml(username)}</b>.<br>Saldo baru: <b>${formatRupiah(users[idx].credit)}</b>`);
}

// ============================================================
// ADMIN SETTINGS
// ============================================================
async function loadAdminSettings() {
  const settings = await getSettings();

  const runToggle = document.getElementById('runningTextToggle');
  const runInput = document.getElementById('runningTextInput');
  const wpToggle = document.getElementById('welcomePopupToggle');
  const n2Toggle = document.getElementById('notif2Toggle');
  const n2Icon = document.getElementById('notif2Icon');
  const n2Text = document.getElementById('notif2TextInput');
  const rkToggle = document.getElementById('resetKeyToggle');
  const maintToggle = document.getElementById('maintenanceToggle');
  const maintReason = document.getElementById('maintenanceReason');

  if (runToggle) runToggle.checked = settings.runningText || false;
  if (runInput) runInput.value = settings.runningTextContent || '';
  if (wpToggle) wpToggle.checked = settings.welcomePopup !== false;
  if (n2Toggle) n2Toggle.checked = settings.notif2 || false;
  if (n2Icon) n2Icon.value = settings.notif2Icon || 'fas fa-info-circle';
  if (n2Text) n2Text.value = settings.notif2Text || '';
  if (rkToggle) rkToggle.checked = settings.resetKey !== false;
  if (maintToggle) maintToggle.checked = settings.maintenance || false;
  if (maintReason) maintReason.value = settings.maintenanceReason || '';
}

async function saveSettingToggle(key, value) {
  const settings = await getSettings();
  settings[key] = value;
  await setSettings(settings);
  const labels = { runningText: 'Running Text', welcomePopup: 'Welcome Popup', notif2: 'Notifikasi ke-2', resetKey: 'Reset Key System', maintenance: 'Maintenance Mode' };
  showToast(`${labels[key] || key}: ${value ? 'Aktif' : 'Nonaktif'}`, value ? 'success' : 'warning');
}

async function saveRunningText() {
  const text = sanitizeInput(document.getElementById('runningTextInput')?.value || '');
  if (!text) { showAlert('warning', 'Teks Kosong', 'Masukan teks berjalan!'); return; }
  const settings = await getSettings();
  settings.runningTextContent = text;
  await setSettings(settings);
  showAlert('success', 'Disimpan', 'Teks berjalan berhasil disimpan!');
}

async function saveNotif2() {
  const icon = document.getElementById('notif2Icon')?.value || 'fas fa-info-circle';
  const text = sanitizeInput(document.getElementById('notif2TextInput')?.value || '');
  if (!text) { showAlert('warning', 'Teks Kosong', 'Masukan teks notifikasi!'); return; }
  const settings = await getSettings();
  settings.notif2Icon = icon;
  settings.notif2Text = text;
  await setSettings(settings);
  showAlert('success', 'Disimpan', 'Notifikasi ke-2 berhasil disimpan!');
}

async function saveMaintenanceMode(isOn) {
  const settings = await getSettings();
  settings.maintenance = isOn;
  await setSettings(settings);
  showToast(`Maintenance Mode: ${isOn ? 'AKTIF ⚠️' : 'Nonaktif'}`, isOn ? 'warning' : 'success');
}

async function saveMaintenanceText() {
  const text = sanitizeInput(document.getElementById('maintenanceReason')?.value || '');
  const settings = await getSettings();
  settings.maintenanceReason = text;
  await setSettings(settings);
  showAlert('success', 'Disimpan', 'Alasan maintenance berhasil disimpan!');
}

// ============================================================
// RENTAL SWITCH IN ADMIN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const rsw = document.getElementById('rentalKeySwitch');
  if (rsw) {
    rsw.addEventListener('change', function() {
      const container = document.getElementById('hargaRentalContainer');
      if (container) container.style.display = this.checked ? 'block' : 'none';
    });
  }
});

// ============================================================
// SWEETALERT HELPERS
// ============================================================
function showAlert(type, title, text) {
  return Swal.fire({ icon: type, title, html: text, confirmButtonText: 'OK' });
}

function showToast(msg, icon = 'success') {
  Swal.fire({ toast: true, position: 'top-end', icon, title: msg, showConfirmButton: false, timer: 2500, timerProgressBar: true });
}
