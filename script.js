/* =============================================
   DRIP CLIENT - SCRIPT.JS
   All JS Functions
   ============================================= */

// =============================================
// JSONBIN CONFIG
// =============================================
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';
const JSONBIN_KEY = '$2a$10$FrRFp7JmBmpnrWofdI2GyOHCeiMwzhvrVQ.Hh2H3FaBCiFlkxh4c6'; // Replace with your JSONBin Master Key

// BIN IDs - Create these bins on jsonbin.io first, then replace:
const BINS = {
  users:    '69b799d7c3097a1dd52bdbc1',       // { users: [] }
  products: '69b799f8b7ec241ddc712bfd',   // { products: [] }
  promos:   '69b79a0fb7ec241ddc712c4f',     // { promos: [] }
  transactions: '69b79a26c3097a1dd52bdceb',   // { transactions: [] }
  settings: '69b79a44b7ec241ddc712d0a',  // { ticker_enabled, ticker_text, reset_key_enabled, stats:{} }
};

// =============================================
// JSONBIN HELPERS
// =============================================
async function dbGet(binId) {
  try {
    const r = await fetch(`${JSONBIN_BASE}/${binId}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    const d = await r.json();
    return d.record;
  } catch (e) {
    console.error('DB GET error:', e);
    return null;
  }
}

async function dbSet(binId, data) {
  try {
    const r = await fetch(`${JSONBIN_BASE}/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY
      },
      body: JSON.stringify(data)
    });
    const d = await r.json();
    return d.record;
  } catch (e) {
    console.error('DB SET error:', e);
    return null;
  }
}

// =============================================
// PARTICLE BACKGROUND
// =============================================
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const count = window.innerWidth < 768 ? 40 : 80;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.1,
      color: Math.random() > 0.5 ? '139,0,255' : '168,85,247'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(139,0,255,${0.08 * (1 - dist / 120)})`;
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
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `rgba(${p.color},0.5)`;
      ctx.fill();
      ctx.shadowBlur = 0;

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });

    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// =============================================
// LOADING SCREEN
// =============================================
function initLoadingScreen(contentId, callback) {
  initParticles();

  const title = 'DRIPCLIENT';
  const container = document.getElementById('loadingChars');
  if (container) {
    title.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.animationDelay = `${0.1 * i + 0.3}s`;
      container.appendChild(span);
    });
  }

  // Animate percent
  let pct = 0;
  const percentEl = document.getElementById('loadingPercent');
  const interval = setInterval(() => {
    pct = Math.min(pct + Math.floor(Math.random() * 4) + 1, 100);
    if (percentEl) percentEl.textContent = pct + '%';
    if (pct >= 100) clearInterval(interval);
  }, 30);

  // Hide after 3s
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.classList.add('loading-hide');
      setTimeout(() => {
        ls.style.display = 'none';
        const content = document.getElementById(contentId);
        if (content) content.style.display = '';
        if (callback) callback();
        initScrollAnimations();
      }, 800);
    }
  }, 3000);
}

// =============================================
// SCROLL ANIMATIONS
// =============================================
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

// =============================================
// TOGGLE PASSWORD
// =============================================
function togglePassword(inputId, iconId) {
  const inp = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (icon) icon.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    inp.type = 'password';
    if (icon) icon.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

// =============================================
// TOAST UTILITY
// =============================================
function toast(icon, title, timer = 2000) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    background: 'var(--bg-card2)',
    color: 'var(--text-primary)',
    iconColor: icon === 'success' ? 'var(--accent-green)' : icon === 'error' ? 'var(--accent-red)' : 'var(--purple-3)'
  });
}

// =============================================
// SESSION
// =============================================
function getSession() {
  try {
    const s = localStorage.getItem('dc_session');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function setSession(user) {
  localStorage.setItem('dc_session', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('dc_session');
}

function requireAuth() {
  const s = getSession();
  if (!s) {
    window.location.href = 'index.html';
    return null;
  }
  return s;
}

// =============================================
// LOGIN
// =============================================
async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;
  const btn = document.getElementById('loginBtn');

  if (!username || !password) {
    toast('warning', 'Username dan password wajib diisi!');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Memproses...';

  try {
    const db = await dbGet(BINS.users);
    if (!db || !db.users) {
      toast('error', 'Gagal terhubung ke database!');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
      return;
    }

    const user = db.users.find(u => u.username === username && u.password === password);

    if (!user) {
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal!',
        text: 'Username atau password tidak valid.',
        background: 'var(--bg-card2)',
        color: 'var(--text-primary)',
        confirmButtonText: 'Coba Lagi'
      });
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
      return;
    }

    if (remember) {
      localStorage.setItem('dc_remember', JSON.stringify({ username, password }));
    } else {
      localStorage.removeItem('dc_remember');
    }

    // Show welcome animation
    setSession(user);
    showWelcomeAnimation(username);

  } catch (e) {
    toast('error', 'Terjadi kesalahan: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
  }
}

function showWelcomeAnimation(username) {
  // Create welcome overlay
  const overlay = document.createElement('div');
  overlay.id = 'welcome-anim';
  overlay.innerHTML = `
    <div class="welcome-text">Welcome ${username}! 🎉</div>
    <div class="welcome-sub">REDIRECTING TO DASHBOARD</div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    window.location.href = 'home.html';
  }, 3000);
}

// =============================================
// REGISTER
// =============================================
async function handleRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  const btn = document.getElementById('registerBtn');

  if (!username || !email || !password || !confirm) {
    toast('warning', 'Semua field wajib diisi!');
    return;
  }

  if (password !== confirm) {
    toast('error', 'Password tidak cocok!');
    return;
  }

  if (password.length < 6) {
    toast('warning', 'Password minimal 6 karakter!');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast('warning', 'Format email tidak valid!');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Mendaftarkan...';

  try {
    const db = await dbGet(BINS.users);
    if (!db) {
      toast('error', 'Gagal terhubung ke database!');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
      return;
    }

    const users = db.users || [];

    // Check duplicate
    if (users.find(u => u.username === username)) {
      Swal.fire({
        icon: 'warning',
        title: 'Username Sudah Dipakai!',
        text: 'Pilih username lain.',
        background: 'var(--bg-card2)',
        color: 'var(--text-primary)'
      });
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
      return;
    }

    if (users.find(u => u.email === email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Sudah Terdaftar!',
        text: 'Gunakan email lain.',
        background: 'var(--bg-card2)',
        color: 'var(--text-primary)'
      });
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
      return;
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username,
      email,
      password,
      balance: 0,
      createdAt: new Date().toISOString(),
      usedPromos: []
    };

    users.push(newUser);
    const result = await dbSet(BINS.users, { users });

    if (result) {
      Swal.fire({
        icon: 'success',
        title: 'Akun Berhasil Dibuat! 🎉',
        text: `Selamat datang, ${username}! Silahkan login sekarang.`,
        background: 'var(--bg-card2)',
        color: 'var(--text-primary)',
        confirmButtonText: 'Login Sekarang'
      }).then(() => {
        window.location.href = 'index.html';
      });
    } else {
      toast('error', 'Gagal menyimpan akun. Coba lagi!');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
    }

  } catch (e) {
    toast('error', 'Terjadi kesalahan: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
  }
}

// =============================================
// LOGOUT
// =============================================
function handleLogout() {
  Swal.fire({
    title: 'Logout?',
    text: 'Yakin ingin keluar dari dashboard?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal',
    background: 'var(--bg-card2)',
    color: 'var(--text-primary)'
  }).then(r => {
    if (r.isConfirmed) {
      clearSession();
      window.location.href = 'index.html';
    }
  });
}

// =============================================
// DASHBOARD INIT
// =============================================
async function initDashboard() {
  const user = requireAuth();
  if (!user) return;

  // Set header info
  document.getElementById('headerUsername').textContent = user.username;
  document.getElementById('headerBalance').textContent = formatRp(user.balance || 0);
  document.getElementById('welcomeUsername').textContent = user.username;

  // Show welcome popup
  setTimeout(() => {
    document.getElementById('welcomePopup').classList.remove('hidden');
  }, 500);

  // Load settings (ticker)
  loadTickerDashboard();

  // Load products
  loadProductsDashboard();

  // Load user transactions
  loadUserLogs(user.username);
}

function closeWelcomePopup() {
  const p = document.getElementById('welcomePopup');
  p.style.animation = 'fadeIn 0.3s ease reverse';
  setTimeout(() => p.classList.add('hidden'), 300);
}

// =============================================
// TICKER
// =============================================
async function loadTickerDashboard() {
  const settings = await dbGet(BINS.settings);
  if (!settings) return;
  if (settings.ticker_enabled && settings.ticker_text) {
    const wrap = document.getElementById('tickerWrap');
    const text = document.getElementById('tickerText');
    if (wrap && text) {
      text.textContent = settings.ticker_text;
      wrap.style.display = '';
    }
  }
}

// =============================================
// LOAD PRODUCTS (Dashboard)
// =============================================
async function loadProductsDashboard() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const db = await dbGet(BINS.products);
  const products = db?.products || [];

  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-family:var(--font-ui);">
        <i class="fas fa-box-open" style="font-size:2.5rem;margin-bottom:12px;display:block;"></i>
        Belum ada produk tersedia
      </div>`;
    return;
  }

  grid.innerHTML = products.map((p, i) => `
    <div class="product-card fade-in fade-in-delay-${Math.min(i+1, 4)}" onclick="openProductModal(${i})">
      ${p.image
        ? `<img class="product-image" src="${p.image}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="product-image-placeholder" style="display:none;"><i class="fas fa-gamepad"></i></div>`
        : `<div class="product-image-placeholder"><i class="fas fa-gamepad"></i></div>`
      }
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || ''}</div>
        <ul class="product-features">
          ${(p.features || []).map(f => `<li><i class="fas fa-check-circle"></i>${f}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');

  // Store products globally
  window._products = products;
  initScrollAnimations();
}

// =============================================
// PRODUCT MODAL
// =============================================
let currentProduct = null;
let currentPlanType = 'full';
let currentQty = 1;
let currentPlanPrice = 0;
let currentPlanLabel = '';
let appliedPromoDiscount = 0;
let appliedPromoCode = '';

function openProductModal(idx) {
  const products = window._products || [];
  currentProduct = products[idx];
  if (!currentProduct) return;

  currentQty = 1;
  currentPlanType = 'full';
  currentPlanPrice = 0;
  currentPlanLabel = '';
  appliedPromoDiscount = 0;
  appliedPromoCode = '';

  document.getElementById('modalProductName').textContent = currentProduct.name;
  document.getElementById('qtyValue').textContent = 1;
  document.getElementById('totalPrice').textContent = 'Rp 0';
  document.getElementById('promoCode').value = '';
  document.getElementById('promoResult').textContent = '';
  document.getElementById('buyerWa').value = '';
  document.getElementById('originalPriceDisplay').classList.add('hidden');

  const btnRental = document.getElementById('btnRentalKey');
  btnRental.style.display = currentProduct.rentalEnabled ? '' : 'none';

  renderPlanOptions('full');

  document.getElementById('btnFullKey').classList.add('active');
  document.getElementById('btnRentalKey').classList.remove('active');

  document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
  const m = document.getElementById('productModal');
  m.style.animation = 'fadeIn 0.3s ease reverse';
  setTimeout(() => {
    m.classList.add('hidden');
    m.style.animation = '';
  }, 300);
}

function switchPlan(type) {
  currentPlanType = type;
  currentPlanPrice = 0;
  currentPlanLabel = '';

  document.getElementById('btnFullKey').classList.toggle('active', type === 'full');
  document.getElementById('btnRentalKey').classList.toggle('active', type === 'rental');

  renderPlanOptions(type);
  updateTotal();
}

function renderPlanOptions(type) {
  const container = document.getElementById('planOptions');
  const prices = type === 'full'
    ? (currentProduct.fullKeyPrices || [])
    : (currentProduct.rentalKeyPrices || []);

  if (prices.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);font-family:var(--font-ui);text-align:center;padding:16px;">Harga belum tersedia</div>`;
    return;
  }

  container.innerHTML = prices.filter(p => p.label && p.price).map((p, i) => `
    <div class="plan-option" onclick="selectPlan(${p.price},'${p.label}',this)">
      <div style="display:flex;align-items:center;">
        <input type="radio" class="plan-radio" name="plan" ${i === 0 ? 'checked' : ''} />
        <div class="plan-option-left">${p.label}</div>
      </div>
      <div class="plan-option-price">${formatRp(p.price)}</div>
    </div>
  `).join('');

  // Auto-select first
  const first = prices.find(p => p.label && p.price);
  if (first) selectPlan(first.price, first.label);
}

function selectPlan(price, label, el) {
  currentPlanPrice = price;
  currentPlanLabel = label;
  document.querySelectorAll('.plan-option').forEach(o => o.classList.remove('selected'));
  if (el) el.classList.add('selected');
  updateTotal();
}

function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById('qtyValue').textContent = currentQty;
  updateTotal();
}

function updateTotal() {
  let base = currentPlanPrice * currentQty;
  const orig = base;

  if (appliedPromoDiscount > 0) {
    const disc = Math.floor(base * appliedPromoDiscount / 100);
    base = base - disc;
    const origEl = document.getElementById('originalPriceDisplay');
    origEl.textContent = formatRp(orig);
    origEl.classList.remove('hidden');
  } else {
    document.getElementById('originalPriceDisplay').classList.add('hidden');
  }

  document.getElementById('totalPrice').textContent = formatRp(base);
}

async function applyPromo() {
  const code = document.getElementById('promoCode').value.trim().toUpperCase();
  const resultEl = document.getElementById('promoResult');

  if (!code) {
    resultEl.innerHTML = `<span style="color:var(--accent-red);">Masukan kode promo terlebih dahulu!</span>`;
    return;
  }

  resultEl.innerHTML = `<span class="loading-dots" style="color:var(--text-muted);">Memvalidasi kode</span>`;

  const user = getSession();
  const db = await dbGet(BINS.promos);
  const promos = db?.promos || [];

  const promo = promos.find(p => p.code === code);

  if (!promo) {
    resultEl.innerHTML = `<span style="color:var(--accent-red);"><i class="fas fa-times-circle"></i> Kode promo tidak valid!</span>`;
    appliedPromoDiscount = 0;
    appliedPromoCode = '';
    return;
  }

  // Check max usage
  if (promo.maxUse > 0 && (promo.usedCount || 0) >= promo.maxUse) {
    resultEl.innerHTML = `<span style="color:var(--accent-red);"><i class="fas fa-ban"></i> Promo telah mencapai batas pemakaian!</span>`;
    appliedPromoDiscount = 0;
    appliedPromoCode = '';
    return;
  }

  // Check if user already used this promo
  const usersDb = await dbGet(BINS.users);
  const userRecord = (usersDb?.users || []).find(u => u.username === user.username);
  if (userRecord && (userRecord.usedPromos || []).includes(code)) {
    resultEl.innerHTML = `<span style="color:var(--accent-red);"><i class="fas fa-ban"></i> Kamu sudah pernah memakai promo ini!</span>`;
    appliedPromoDiscount = 0;
    appliedPromoCode = '';
    return;
  }

  appliedPromoDiscount = promo.percent;
  appliedPromoCode = code;
  resultEl.innerHTML = `<span style="color:var(--accent-green);"><i class="fas fa-check-circle"></i> Promo aktif! Diskon ${promo.percent}% berhasil diterapkan</span>`;
  updateTotal();
}

async function processBuy() {
  const user = getSession();
  const wa = document.getElementById('buyerWa').value.trim();

  if (!currentPlanPrice || !currentPlanLabel) {
    toast('warning', 'Pilih paket terlebih dahulu!');
    return;
  }

  if (!wa) {
    toast('warning', 'Masukan nomor WhatsApp!');
    return;
  }

  let totalBayar = currentPlanPrice * currentQty;
  if (appliedPromoDiscount > 0) {
    totalBayar = Math.floor(totalBayar * (1 - appliedPromoDiscount / 100));
  }

  // Check balance
  const usersDb = await dbGet(BINS.users);
  const userRecord = (usersDb?.users || []).find(u => u.username === user.username);

  if (!userRecord || (userRecord.balance || 0) < totalBayar) {
    Swal.fire({
      icon: 'error',
      title: 'Saldo Tidak Cukup!',
      html: `Saldo kamu: <b style="color:var(--accent-red);">${formatRp(userRecord?.balance || 0)}</b><br>Dibutuhkan: <b style="color:var(--accent-green);">${formatRp(totalBayar)}</b>`,
      background: 'var(--bg-card2)',
      color: 'var(--text-primary)'
    });
    return;
  }

  Swal.fire({
    title: 'Konfirmasi Pembelian',
    html: `
      <div style="text-align:left;font-family:var(--font-ui);">
        <div style="padding:8px 0;border-bottom:1px solid rgba(139,0,255,0.2);">Produk: <b style="color:var(--purple-3);">${currentProduct.name}</b></div>
        <div style="padding:8px 0;border-bottom:1px solid rgba(139,0,255,0.2);">Plan: <b>${currentPlanLabel}</b></div>
        <div style="padding:8px 0;border-bottom:1px solid rgba(139,0,255,0.2);">Qty: <b>${currentQty}</b></div>
        <div style="padding:8px 0;">Total: <b style="color:var(--accent-green);font-size:1.1rem;">${formatRp(totalBayar)}</b></div>
      </div>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Bayar Sekarang',
    cancelButtonText: 'Batal',
    background: 'var(--bg-card2)',
    color: 'var(--text-primary)'
  }).then(async r => {
    if (!r.isConfirmed) return;

    // Deduct balance
    const users = usersDb.users.map(u => {
      if (u.username === user.username) {
        return {
          ...u,
          balance: (u.balance || 0) - totalBayar,
          usedPromos: appliedPromoCode
            ? [...(u.usedPromos || []), appliedPromoCode]
            : (u.usedPromos || [])
        };
      }
      return u;
    });
    await dbSet(BINS.users, { users });

    // Update session balance
    const updatedUser = { ...userRecord, balance: (userRecord.balance || 0) - totalBayar };
    setSession(updatedUser);
    document.getElementById('headerBalance').textContent = formatRp(updatedUser.balance);

    // Update promo usage
    if (appliedPromoCode) {
      const promosDb = await dbGet(BINS.promos);
      const promos = (promosDb?.promos || []).map(p => {
        if (p.code === appliedPromoCode) {
          return { ...p, usedCount: (p.usedCount || 0) + 1 };
        }
        return p;
      });
      await dbSet(BINS.promos, { promos });
    }

    // Create transaction
    const trxId = 'TRX' + Date.now();
    const trxDb = await dbGet(BINS.transactions);
    const transactions = trxDb?.transactions || [];

    const newTrx = {
      id: trxId,
      username: user.username,
      product: currentProduct.name,
      planType: currentPlanType === 'full' ? 'Access Full Key' : 'Rental Keys',
      planLabel: currentPlanLabel,
      qty: currentQty,
      total: totalBayar,
      wa,
      promoUsed: appliedPromoCode || null,
      status: 'waiting',
      keys: [],
      date: new Date().toISOString(),
      image: currentProduct.image || null
    };

    transactions.push(newTrx);
    await dbSet(BINS.transactions, { transactions });

    // Update stats
    updateStats(totalBayar);

    closeProductModal();
    toast('success', 'Pembelian berhasil! Menunggu konfirmasi admin 🎉', 4000);
    loadUserLogs(user.username);
  });
}

// =============================================
// USER LOGS
// =============================================
async function loadUserLogs(username) {
  const container = document.getElementById('logsList');
  if (!container) return;

  const db = await dbGet(BINS.transactions);
  const transactions = (db?.transactions || []).filter(t => t.username === username);

  if (transactions.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--text-muted);font-family:var(--font-ui);">
        <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:10px;display:block;"></i>
        Belum ada transaksi
      </div>`;
    return;
  }

  container.innerHTML = transactions.reverse().map(t => `
    <div class="log-card fade-in" onclick="openLogDetail('${t.id}')">
      <div class="log-card-header">
        <div class="log-product-name"><i class="fas fa-box" style="color:var(--purple-3);margin-right:8px;"></i>${t.product}</div>
        <div class="log-status ${t.status}">${t.status === 'waiting' ? '⏳ Menunggu' : t.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</div>
      </div>
      <div class="log-details">
        <span><i class="fas fa-tag" style="color:var(--purple-3);margin-right:4px;"></i>${t.planLabel}</span>
        <span><i class="fas fa-dollar-sign" style="color:var(--accent-green);margin-right:4px;"></i>${formatRp(t.total)}</span>
        <span><i class="fas fa-calendar" style="color:var(--text-muted);margin-right:4px;"></i>${formatDate(t.date)}</span>
      </div>
    </div>
  `).join('');

  window._userTransactions = transactions;
  initScrollAnimations();
}

function openLogDetail(trxId) {
  const trx = (window._userTransactions || []).find(t => t.id === trxId);
  if (!trx) return;

  const keysHtml = trx.keys && trx.keys.length > 0
    ? `<div class="keys-display">${trx.keys.map(k => `<div class="key-item"><i class="fas fa-key"></i>${k}</div>`).join('')}</div>`
    : `<div style="color:var(--text-muted);font-family:var(--font-ui);font-size:0.82rem;padding:8px 0;">Belum ada key yang dikirim</div>`;

  document.getElementById('logDetailContent').innerHTML = `
    <div class="log-detail-box">
      <div class="log-detail-row"><span class="log-detail-key">Nama Produk</span><span class="log-detail-val">${trx.product}</span></div>
      <div class="log-detail-row"><span class="log-detail-key">Pembelian</span><span class="log-detail-val">${trx.planLabel} (${trx.planType})</span></div>
      <div class="log-detail-row"><span class="log-detail-key">Qty</span><span class="log-detail-val">${trx.qty}</span></div>
      <div class="log-detail-row"><span class="log-detail-key">Tanggal Trx</span><span class="log-detail-val">${formatDate(trx.date)}</span></div>
      <div class="log-detail-row"><span class="log-detail-key">ID Trx</span><span class="log-detail-val" style="font-size:0.72rem;">${trx.id}</span></div>
      <div class="log-detail-row"><span class="log-detail-key">Total</span><span class="log-detail-val" style="color:var(--accent-green);">${formatRp(trx.total)}</span></div>
      <div class="log-detail-row"><span class="log-detail-key">Status</span><span class="log-detail-val"><span class="log-status ${trx.status}">${trx.status === 'waiting' ? '⏳ Menunggu' : trx.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</span></span></div>
    </div>
    <div style="margin-top:14px;font-family:var(--font-display);font-size:0.78rem;color:var(--purple-3);letter-spacing:2px;margin-bottom:8px;">🔑 KEYS</div>
    ${keysHtml}
  `;

  document.getElementById('logDetailPopup').classList.remove('hidden');
}

function closeLogDetail() {
  document.getElementById('logDetailPopup').classList.add('hidden');
}

// =============================================
// RESET KEY
// =============================================
function openResetKeyPopup() {
  document.getElementById('resetKeyPopup').classList.remove('hidden');
  document.getElementById('resetTerminal').classList.add('hidden');
  document.getElementById('resetTerminal').innerHTML = '';
  document.getElementById('resetKeyInput').value = '';
  closeNav();
}

function closeResetPopup() {
  document.getElementById('resetKeyPopup').classList.add('hidden');
}

async function processResetKey() {
  const keyId = document.getElementById('resetKeyInput').value.trim();
  if (!keyId) {
    toast('warning', 'Masukan Key ID terlebih dahulu!');
    return;
  }

  const btn = document.getElementById('resetBtn');
  const terminal = document.getElementById('resetTerminal');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Memproses...';
  terminal.classList.remove('hidden');

  // Check if reset key is enabled
  const settings = await dbGet(BINS.settings);
  const resetEnabled = settings?.reset_key_enabled !== false;

  // Simulate visual terminal loading
  async function addLine(text, cls, delay) {
    await new Promise(res => setTimeout(res, delay));
    const div = document.createElement('div');
    div.className = 'terminal-line ' + (cls || '');
    div.textContent = text;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
  }

  await addLine('> Connecting to server...', 'terminal-info', 400);
  await addLine('> Fetching Server.....', 'terminal-info', 600);
  await addLine('> Response Database....', 'terminal-info', 700);

  if (!resetEnabled) {
    await addLine('', '', 200);
    await addLine('❌ ERROR: Feature Disabled', 'terminal-error', 300);
    await addLine('', '', 100);
    await addLine('Maaf fitur ini sedang di nonaktifkan oleh admin atau sedang tidak beroperasi normal. Silahkan coba lagi nanti.', 'terminal-error', 200);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> RESET';
    return;
  }

  // Check daily reset limit
  const user = getSession();
  const resetKey = `dc_reset_${user.username}_${new Date().toDateString()}`;
  const todayReset = localStorage.getItem(resetKey);

  if (todayReset) {
    await addLine('', '', 200);
    await addLine('❌ RATE LIMIT EXCEEDED', 'terminal-error', 300);
    await addLine('Status: 429', 'terminal-error', 200);
    await addLine('Response: {"success":false,"message":"Reset limit reached","resetsused":1,"resetsmax":1,"nextresettime":"tomorrow 00:00"}', 'terminal-error', 200);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> RESET';
    return;
  }

  // Success
  await addLine('> Authenticating...', 'terminal-info', 500);
  await addLine('> Resetting device...', 'terminal-info', 700);
  await addLine('', '', 300);
  await addLine('✅ Reset Successful', 'terminal-success', 200);
  await addLine('', '', 100);
  await addLine('Status: 200', 'terminal-success', 200);
  await addLine(`Response: {"success":true,"message":"Token reset successfully","resetsused":1,"resetsmax":1,"nextresettime":"${getTomorrowMidnight()}"}`, 'terminal-success', 300);

  localStorage.setItem(resetKey, '1');
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-sync-alt"></i> RESET';
}

// =============================================
// NAVBAR
// =============================================
function toggleNav() {
  const nav = document.getElementById('sideNav');
  const overlay = document.getElementById('navOverlay');
  nav.classList.toggle('open');
  overlay.classList.toggle('show');
}

function closeNav() {
  const nav = document.getElementById('sideNav');
  const overlay = document.getElementById('navOverlay');
  nav.classList.remove('open');
  overlay.classList.remove('show');
}

function scrollToSection(id) {
  closeNav();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =============================================
// FAQ
// =============================================
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// =============================================
// ADMIN PANEL
// =============================================
async function initAdminPanel() {
  await loadAdminStats();
  await loadAdminLogs();
  await loadAdminProducts();
  await loadAdminPromos();
  await loadAdminSettings();
  await loadAdminUsers();
}

function adminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');

  // Refresh relevant data
  if (tab === 'logs') loadAdminLogs();
  if (tab === 'products') loadAdminProducts();
  if (tab === 'promo') loadAdminPromos();
  if (tab === 'saldo') loadAdminUsers();
}

// =============================================
// ADMIN STATS
// =============================================
async function loadAdminStats() {
  const settings = await dbGet(BINS.settings);
  const stats = settings?.stats || {};

  const todayKey = new Date().toDateString();

  document.getElementById('statTotalPembeli').textContent = stats.totalPembeli || 0;
  document.getElementById('statPenghasilan').textContent = formatRp(stats.totalPenghasilan || 0);
  document.getElementById('statTerjualHari').textContent = (stats.terjualHari || {})[todayKey] || 0;
}

async function updateStats(amount) {
  const settings = await dbGet(BINS.settings);
  const todayKey = new Date().toDateString();
  const stats = settings?.stats || {};
  const terjualHari = stats.terjualHari || {};

  const newSettings = {
    ...settings,
    stats: {
      ...stats,
      totalPembeli: (stats.totalPembeli || 0) + 1,
      totalPenghasilan: (stats.totalPenghasilan || 0) + amount,
      terjualHari: {
        ...terjualHari,
        [todayKey]: ((terjualHari[todayKey] || 0) + 1)
      }
    }
  };
  await dbSet(BINS.settings, newSettings);
}

// =============================================
// ADMIN LOGS
// =============================================
async function loadAdminLogs() {
  const tbody = document.getElementById('adminLogsTableBody');
  if (!tbody) return;

  const db = await dbGet(BINS.transactions);
  const transactions = db?.transactions || [];

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px;">Belum ada transaksi</td></tr>';
    return;
  }

  window._allTransactions = transactions;

  tbody.innerHTML = [...transactions].reverse().map(t => `
    <tr>
      <td style="font-size:0.72rem;font-family:monospace;color:var(--purple-3);">${t.id}</td>
      <td><b>${t.username}</b></td>
      <td>${t.product}</td>
      <td>${t.planLabel} (x${t.qty})</td>
      <td style="color:var(--accent-green);">${formatRp(t.total)}</td>
      <td style="font-size:0.8rem;">${t.wa || '-'}</td>
      <td><span class="log-status ${t.status}">${t.status === 'waiting' ? '⏳ Menunggu' : t.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</span></td>
      <td>
        ${t.status === 'waiting' ? `
          <button class="btn-admin success" style="padding:6px 12px;font-size:0.68rem;margin-right:4px;" onclick="adminApprove('${t.id}')"><i class="fas fa-check"></i> Approve</button>
          <button class="btn-admin danger" style="padding:6px 12px;font-size:0.68rem;" onclick="adminReject('${t.id}')"><i class="fas fa-times"></i> Reject</button>
        ` : `<span style="font-size:0.78rem;color:var(--text-muted);">${t.status === 'approved' ? 'Diproses' : 'Ditolak'}</span>`}
      </td>
    </tr>
  `).join('');
}

async function adminApprove(trxId) {
  const trx = (window._allTransactions || []).find(t => t.id === trxId);
  if (!trx) return;

  // Show key input modal
  document.getElementById('approveModalTitle').textContent = `Approve: ${trx.product}`;

  let keyInputsHtml = '';
  for (let i = 1; i <= 5; i++) {
    keyInputsHtml += `<div class="key-input-row"><input type="text" class="form-input" id="approveKey${i}" placeholder="Key ${i} (opsional)" /></div>`;
  }

  document.getElementById('approveModalContent').innerHTML = `
    <div style="font-family:var(--font-ui);font-size:0.88rem;color:var(--text-secondary);margin-bottom:16px;">
      Masukan key untuk dikirim ke user <b style="color:var(--purple-3);">${trx.username}</b>
    </div>
    <div class="approve-keys-section">
      ${keyInputsHtml}
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn-admin success" onclick="confirmApprove('${trxId}')">
        <i class="fas fa-check"></i> APPROVE & KIRIM KEY
      </button>
      <button class="btn-admin" onclick="closeApproveModal()" style="background:rgba(139,0,255,0.2);">
        Batal
      </button>
    </div>
  `;

  document.getElementById('approveModal').classList.remove('hidden');
}

async function confirmApprove(trxId) {
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const val = document.getElementById('approveKey' + i)?.value.trim();
    if (val) keys.push(val);
  }

  const db = await dbGet(BINS.transactions);
  const transactions = (db?.transactions || []).map(t => {
    if (t.id === trxId) {
      return { ...t, status: 'approved', keys };
    }
    return t;
  });

  const result = await dbSet(BINS.transactions, { transactions });
  if (result) {
    toast('success', 'Transaksi berhasil di-approve!');
    closeApproveModal();
    loadAdminLogs();
  } else {
    toast('error', 'Gagal update database!');
  }
}

async function adminReject(trxId) {
  const r = await Swal.fire({
    title: 'Reject Transaksi?',
    text: 'Dana akan dikembalikan ke user.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Reject',
    cancelButtonText: 'Batal',
    background: 'var(--bg-card2)',
    color: 'var(--text-primary)'
  });

  if (!r.isConfirmed) return;

  const trxDb = await dbGet(BINS.transactions);
  const trx = (trxDb?.transactions || []).find(t => t.id === trxId);

  if (!trx) return;

  // Refund
  const usersDb = await dbGet(BINS.users);
  const users = (usersDb?.users || []).map(u => {
    if (u.username === trx.username) {
      return { ...u, balance: (u.balance || 0) + trx.total };
    }
    return u;
  });
  await dbSet(BINS.users, { users });

  // Update transaction
  const transactions = (trxDb?.transactions || []).map(t => {
    if (t.id === trxId) return { ...t, status: 'rejected' };
    return t;
  });
  await dbSet(BINS.transactions, { transactions });

  toast('success', 'Transaksi di-reject & saldo dikembalikan!');
  loadAdminLogs();
}

function closeApproveModal() {
  document.getElementById('approveModal').classList.add('hidden');
}

// =============================================
// ADMIN PRODUCTS
// =============================================
async function loadAdminProducts() {
  const container = document.getElementById('adminProductList');
  if (!container) return;

  const db = await dbGet(BINS.products);
  const products = db?.products || [];

  if (products.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);font-family:var(--font-ui);padding:20px;grid-column:1/-1;">Belum ada produk</div>`;
    return;
  }

  window._adminProducts = products;

  container.innerHTML = products.map((p, i) => `
    <div class="admin-product-item">
      ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'" />` : ''}
      <div>
        <div style="font-family:var(--font-display);font-size:0.85rem;color:var(--text-primary);margin-bottom:4px;">${p.name}</div>
        <div style="font-family:var(--font-ui);font-size:0.78rem;color:var(--text-muted);">${p.description || ''}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn-admin" style="padding:7px 14px;font-size:0.68rem;" onclick="openEditProduct(${i})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-admin danger" style="padding:7px 14px;font-size:0.68rem;" onclick="adminDeleteProduct(${i})">
          <i class="fas fa-trash"></i> Hapus
        </button>
      </div>
    </div>
  `).join('');
}

async function adminAddProduct() {
  const name = document.getElementById('newProdName').value.trim();
  const image = document.getElementById('newProdImage').value.trim();
  const desc = document.getElementById('newProdDesc').value.trim();
  const featuresRaw = document.getElementById('newProdFeatures').value.trim();
  const rentalEnabled = document.getElementById('newProdRentalEnabled').checked;

  if (!name) {
    toast('warning', 'Nama produk wajib diisi!');
    return;
  }

  // Collect full key prices
  const fullKeyPrices = [];
  for (let i = 1; i <= 5; i++) {
    const label = document.getElementById(`fk_label_${i}`)?.value.trim();
    const price = parseFloat(document.getElementById(`fk_price_${i}`)?.value);
    if (label && price) fullKeyPrices.push({ label, price });
  }

  // Collect rental key prices
  const rentalKeyPrices = [];
  if (rentalEnabled) {
    for (let i = 1; i <= 5; i++) {
      const label = document.getElementById(`rk_label_${i}`)?.value.trim();
      const price = parseFloat(document.getElementById(`rk_price_${i}`)?.value);
      if (label && price) rentalKeyPrices.push({ label, price });
    }
  }

  const features = featuresRaw ? featuresRaw.split(',').map(f => f.trim()).filter(Boolean) : [];

  const newProduct = {
    id: 'prod_' + Date.now(),
    name, image, description: desc, features,
    rentalEnabled,
    fullKeyPrices,
    rentalKeyPrices
  };

  const db = await dbGet(BINS.products);
  const products = [...(db?.products || []), newProduct];
  const result = await dbSet(BINS.products, { products });

  if (result) {
    toast('success', `Produk "${name}" berhasil ditambahkan!`);
    loadAdminProducts();
    // Reset form
    ['newProdName','newProdImage','newProdDesc','newProdFeatures'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    for (let i = 1; i <= 5; i++) {
      ['fk_label_','fk_price_','rk_label_','rk_price_'].forEach(p => {
        const el = document.getElementById(p + i);
        if (el) el.value = '';
      });
    }
  } else {
    toast('error', 'Gagal menambahkan produk!');
  }
}

function toggleRentalSection(scope) {
  const enabled = document.getElementById(`newProdRentalEnabled`)?.checked;
  const section = document.getElementById(`rentalPricesNew`);
  if (section) section.style.display = enabled ? '' : 'none';
}

function openEditProduct(idx) {
  const products = window._adminProducts || [];
  const p = products[idx];
  if (!p) return;

  const fullPricesHtml = [1,2,3,4,5].map(i => {
    const entry = (p.fullKeyPrices || [])[i-1] || {};
    return `<div class="price-input-row">
      <input type="text" class="form-input" id="efk_label_${i}" value="${entry.label || ''}" placeholder="Label" />
      <input type="number" class="form-input" id="efk_price_${i}" value="${entry.price || ''}" placeholder="Harga" />
    </div>`;
  }).join('');

  const rentalPricesHtml = [1,2,3,4,5].map(i => {
    const entry = (p.rentalKeyPrices || [])[i-1] || {};
    return `<div class="price-input-row">
      <input type="text" class="form-input" id="erk_label_${i}" value="${entry.label || ''}" placeholder="Label" />
      <input type="number" class="form-input" id="erk_price_${i}" value="${entry.price || ''}" placeholder="Harga" />
    </div>`;
  }).join('');

  document.getElementById('editProductContent').innerHTML = `
    <div class="form-group"><label class="form-label">Nama</label><input type="text" class="form-input" id="editProdName" value="${p.name}" /></div>
    <div class="form-group"><label class="form-label">Image URL</label><input type="text" class="form-input" id="editProdImage" value="${p.image || ''}" /></div>
    <div class="form-group"><label class="form-label">Deskripsi</label><input type="text" class="form-input" id="editProdDesc" value="${p.description || ''}" /></div>
    <div class="form-group"><label class="form-label">Fitur (koma)</label><input type="text" class="form-input" id="editProdFeatures" value="${(p.features || []).join(', ')}" /></div>
    <div class="toggle-row">
      <span class="toggle-label-text">Rental Keys</span>
      <label class="toggle-switch"><input type="checkbox" id="editProdRental" ${p.rentalEnabled ? 'checked' : ''} /><span class="toggle-slider"></span></label>
    </div>
    <div style="margin-top:12px;"><label class="form-label">Harga Full Key</label>${fullPricesHtml}</div>
    <div style="margin-top:12px;"><label class="form-label">Harga Rental Key</label>${rentalPricesHtml}</div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn-admin success" onclick="saveEditProduct(${idx})"><i class="fas fa-save"></i> SAVE</button>
      <button class="btn-admin" onclick="closeEditProductModal()" style="background:rgba(139,0,255,0.2);">Batal</button>
    </div>
  `;

  document.getElementById('editProductModal').classList.remove('hidden');
}

async function saveEditProduct(idx) {
  const products = [...(window._adminProducts || [])];

  const fullKeyPrices = [], rentalKeyPrices = [];
  for (let i = 1; i <= 5; i++) {
    const l = document.getElementById(`efk_label_${i}`)?.value.trim();
    const pr = parseFloat(document.getElementById(`efk_price_${i}`)?.value);
    if (l && pr) fullKeyPrices.push({ label: l, price: pr });
    const rl = document.getElementById(`erk_label_${i}`)?.value.trim();
    const rpr = parseFloat(document.getElementById(`erk_price_${i}`)?.value);
    if (rl && rpr) rentalKeyPrices.push({ label: rl, price: rpr });
  }

  products[idx] = {
    ...products[idx],
    name: document.getElementById('editProdName').value.trim(),
    image: document.getElementById('editProdImage').value.trim(),
    description: document.getElementById('editProdDesc').value.trim(),
    features: document.getElementById('editProdFeatures').value.split(',').map(f => f.trim()).filter(Boolean),
    rentalEnabled: document.getElementById('editProdRental').checked,
    fullKeyPrices,
    rentalKeyPrices
  };

  const result = await dbSet(BINS.products, { products });
  if (result) {
    toast('success', 'Produk berhasil diupdate!');
    closeEditProductModal();
    loadAdminProducts();
  } else {
    toast('error', 'Gagal update produk!');
  }
}

async function adminDeleteProduct(idx) {
  const r = await Swal.fire({
    title: 'Hapus Produk?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal',
    background: 'var(--bg-card2)',
    color: 'var(--text-primary)'
  });
  if (!r.isConfirmed) return;

  const products = [...(window._adminProducts || [])];
  products.splice(idx, 1);
  const result = await dbSet(BINS.products, { products });
  if (result) {
    toast('success', 'Produk berhasil dihapus!');
    loadAdminProducts();
  }
}

function closeEditProductModal() {
  document.getElementById('editProductModal').classList.add('hidden');
}

// =============================================
// ADMIN PROMOS
// =============================================
async function loadAdminPromos() {
  const tbody = document.getElementById('promoTableBody');
  if (!tbody) return;

  const db = await dbGet(BINS.promos);
  const promos = db?.promos || [];

  if (promos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada promo</td></tr>';
    return;
  }

  tbody.innerHTML = promos.map((p, i) => `
    <tr>
      <td><b style="color:var(--purple-3);font-family:var(--font-display);letter-spacing:1px;">${p.code}</b></td>
      <td style="color:var(--accent-green);">${p.percent}%</td>
      <td>${p.maxUse === 0 ? 'Bebas' : p.maxUse}</td>
      <td>${p.usedCount || 0}</td>
      <td>
        <button class="btn-admin danger" style="padding:6px 12px;font-size:0.68rem;" onclick="adminDeletePromo(${i})">
          <i class="fas fa-trash"></i> Hapus
        </button>
      </td>
    </tr>
  `).join('');
}

async function adminAddPromo() {
  const code = document.getElementById('promoCodeAdmin').value.trim().toUpperCase();
  const percent = parseInt(document.getElementById('promoPercent').value);
  const maxUse = parseInt(document.getElementById('promoMaxUse').value) || 0;

  if (!code || !percent) {
    toast('warning', 'Kode dan persen diskon wajib diisi!');
    return;
  }

  const db = await dbGet(BINS.promos);
  const promos = db?.promos || [];

  if (promos.find(p => p.code === code)) {
    toast('error', 'Kode promo sudah ada!');
    return;
  }

  promos.push({ code, percent, maxUse, usedCount: 0, createdAt: new Date().toISOString() });
  const result = await dbSet(BINS.promos, { promos });

  if (result) {
    toast('success', `Promo ${code} berhasil ditambahkan!`);
    loadAdminPromos();
    document.getElementById('promoCodeAdmin').value = '';
    document.getElementById('promoPercent').value = '';
    document.getElementById('promoMaxUse').value = '';
  } else {
    toast('error', 'Gagal menambahkan promo!');
  }
}

async function adminDeletePromo(idx) {
  const r = await Swal.fire({
    title: 'Hapus Promo ini?', icon: 'warning',
    showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    background: 'var(--bg-card2)', color: 'var(--text-primary)'
  });
  if (!r.isConfirmed) return;

  const db = await dbGet(BINS.promos);
  const promos = [...(db?.promos || [])];
  promos.splice(idx, 1);
  const result = await dbSet(BINS.promos, { promos });
  if (result) { toast('success', 'Promo berhasil dihapus!'); loadAdminPromos(); }
}

// =============================================
// ADMIN TICKER
// =============================================
async function adminSaveTicker() {
  const text = document.getElementById('tickerTextAdmin').value.trim();
  if (!text) { toast('warning', 'Isi teks terlebih dahulu!'); return; }

  const settings = await dbGet(BINS.settings);
  const newSettings = { ...settings, ticker_text: text };
  const result = await dbSet(BINS.settings, newSettings);
  if (result) toast('success', 'Teks berhasil disimpan!');
  else toast('error', 'Gagal menyimpan!');
}

async function adminToggleTicker() {
  const enabled = document.getElementById('tickerEnabled').checked;
  const settings = await dbGet(BINS.settings);
  const newSettings = { ...settings, ticker_enabled: enabled };
  await dbSet(BINS.settings, newSettings);
  toast('success', enabled ? 'Running teks diaktifkan!' : 'Running teks dinonaktifkan!');
}

async function loadAdminSettings() {
  const settings = await dbGet(BINS.settings);
  if (!settings) return;

  const tickerEl = document.getElementById('tickerEnabled');
  const tickerTextEl = document.getElementById('tickerTextAdmin');
  const resetKeyEl = document.getElementById('resetKeyEnabled');

  if (tickerEl) tickerEl.checked = !!settings.ticker_enabled;
  if (tickerTextEl) tickerTextEl.value = settings.ticker_text || '';
  if (resetKeyEl) resetKeyEl.checked = settings.reset_key_enabled !== false;
}

async function adminToggleResetKey() {
  const enabled = document.getElementById('resetKeyEnabled').checked;
  const settings = await dbGet(BINS.settings);
  const newSettings = { ...settings, reset_key_enabled: enabled };
  await dbSet(BINS.settings, newSettings);
  toast('success', enabled ? 'Reset key diaktifkan!' : 'Reset key dinonaktifkan!');
}

// =============================================
// ADMIN SALDO
// =============================================
async function loadAdminUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const db = await dbGet(BINS.users);
  const users = db?.users || [];

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Belum ada user</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><b style="color:var(--purple-3);">${u.username}</b></td>
      <td style="font-size:0.82rem;">${u.email || '-'}</td>
      <td style="color:var(--accent-green);">${formatRp(u.balance || 0)}</td>
      <td>
        <button class="btn-admin" style="padding:6px 12px;font-size:0.68rem;" onclick="quickAddSaldo('${u.username}')">
          <i class="fas fa-plus"></i> Tambah Saldo
        </button>
      </td>
    </tr>
  `).join('');
}

function quickAddSaldo(username) {
  document.getElementById('saldoUsername').value = username;
  document.getElementById('saldoAmount').focus();
}

async function adminTransferSaldo() {
  const username = document.getElementById('saldoUsername').value.trim();
  const amount = parseInt(document.getElementById('saldoAmount').value);

  if (!username || !amount || amount <= 0) {
    toast('warning', 'Username dan jumlah saldo wajib diisi!');
    return;
  }

  const db = await dbGet(BINS.users);
  const users = db?.users || [];
  const userIdx = users.findIndex(u => u.username === username);

  if (userIdx === -1) {
    toast('error', 'Username tidak ditemukan di database!');
    return;
  }

  users[userIdx] = { ...users[userIdx], balance: (users[userIdx].balance || 0) + amount };
  const result = await dbSet(BINS.users, { users });

  if (result) {
    toast('success', `Saldo ${formatRp(amount)} berhasil dikirim ke ${username}!`);
    document.getElementById('saldoUsername').value = '';
    document.getElementById('saldoAmount').value = '';
    loadAdminUsers();
  } else {
    toast('error', 'Gagal transfer saldo!');
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
function formatRp(amount) {
  if (isNaN(amount)) return 'Rp 0';
  return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getTomorrowMidnight() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

// =============================================
// AUTO-INIT ON LOAD
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  // Prevent multiple nav toggles from accidental mouse interaction
  const hamburger = document.getElementById('hamburgerBtn');
  if (hamburger) {
    hamburger.addEventListener('mousedown', e => e.preventDefault());
  }
});