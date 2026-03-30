/* ============================================
   DRIP CLIENT - script.js
   All functions and features
   
   SETUP: Replace these with your JSONBin.io credentials
============================================ */

const CONFIG = {
  JSONBIN_KEY: '$2a$10$Y.jqtzCgEfTCuODvJNV08ex.6qQW0V5p2WF6UUqlhg.fYT4W.4Gu6',
  BIN_ID: '69ca66c036566621a8607f3c',
  BASE_URL: 'https://api.jsonbin.io/v3/b',
  WA_CHANNEL: 'https://whatsapp.com/channel/0029Vb5PSnZF1YlOrxEO4n23',
  LOGO: 'https://cdn-uploads.huggingface.co/production/uploads/noauth/8W2qfrJxJ0G0EplunCycM.jpeg'
};

/* ---- INITIAL DB STRUCTURE ---- */
const INITIAL_DB = {
  users: [
    { username: 'admin', password: 'admin123', credits: 999, createdAt: new Date().toISOString() }
  ],
  products: [],
  promoCodes: [],
  transactions: [],
  settings: {
    resetKeyEnabled: true,
    runningTextEnabled: false,
    runningText: 'KODE PROMO TERBARU : DISKON70% | JOIN SEKARANG DAN DAPATKAN PENAWARAN TERBAIK!'
  }
};

/* ============================================
   JSONBIN.IO API LAYER
============================================ */
async function dbRead() {
  try {
    const res = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CONFIG.JSONBIN_KEY }
    });
    if (!res.ok) throw new Error('DB Read failed');
    const data = await res.json();
    return data.record;
  } catch (e) {
    console.error('dbRead error:', e);
    // Fallback: return local backup
    const local = localStorage.getItem('drip_db_backup');
    if (local) return JSON.parse(local);
    return INITIAL_DB;
  }
}

async function dbWrite(data) {
  try {
    const res = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CONFIG.JSONBIN_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('DB Write failed');
    const result = await res.json();
    // Backup locally
    localStorage.setItem('drip_db_backup', JSON.stringify(data));
    return result;
  } catch (e) {
    console.error('dbWrite error:', e);
    // Save locally as fallback
    localStorage.setItem('drip_db_backup', JSON.stringify(data));
    throw e;
  }
}

/* ============================================
   LOADING SCREEN
============================================ */
function initLoadingScreen(targetPage) {
  const ls = document.getElementById('loading-screen');
  if (!ls) return;

  // Animate chars
  const title = ls.querySelector('.loading-title');
  if (title) {
    const text = 'DRIPCLIENT';
    const spaces = [4]; // after index 3 (DRIP)
    let html = '';
    let delay = 0.2;
    let charIdx = 0;
    for (let i = 0; i < text.length; i++) {
      if (spaces.includes(i)) {
        html += `<span class="lt-space"></span>`;
      }
      html += `<span class="lt-char" style="animation-delay:${delay}s">${text[i]}</span>`;
      delay += 0.08;
      charIdx++;
    }
    title.innerHTML = html;
  }

  setTimeout(() => {
    ls.classList.add('hide');
    setTimeout(() => {
      ls.style.display = 'none';
    }, 800);
  }, 3000);
}

/* ============================================
   SESSION MANAGEMENT
============================================ */
function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('drip_user') || 'null');
}

function setCurrentUser(user) {
  sessionStorage.setItem('drip_user', JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem('drip_user');
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

/* ============================================
   INDEX.HTML - LOGIN LOGIC
============================================ */
function initLoginPage() {
  initLoadingScreen('index');

  const loginForm = document.getElementById('login-form');
  const rememberMe = document.getElementById('remember-me');

  // Check remembered user
  const remembered = localStorage.getItem('drip_remember');
  if (remembered && loginForm) {
    const { username } = JSON.parse(remembered);
    const userInput = document.getElementById('login-username');
    if (userInput) userInput.value = username;
    if (rememberMe) rememberMe.checked = true;
  }

  // Check if already logged in
  const existingUser = getCurrentUser();
  if (existingUser) {
    window.location.href = 'home.html';
    return;
  }

  // Toggle password
  setupPasswordToggle('login-password', 'toggle-login-pass');

  // Login button
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  // Enter key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
}

async function handleLogin() {
  const username = document.getElementById('login-username')?.value?.trim();
  const password = document.getElementById('login-password')?.value?.trim();
  const rememberMe = document.getElementById('remember-me')?.checked;
  const loginBtn = document.getElementById('login-btn');

  if (!username || !password) {
    showNotify('error', 'Oops!', 'Username dan password wajib diisi!');
    return;
  }

  // Disable button
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memvalidasi...';
  }

  try {
    const db = await dbRead();
    const users = db.users || [];
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      showNotify('error', 'Login Gagal', 'Username atau password tidak valid!');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
      }
      return;
    }

    // Remember me
    if (rememberMe) {
      localStorage.setItem('drip_remember', JSON.stringify({ username }));
    } else {
      localStorage.removeItem('drip_remember');
    }

    // Save session
    setCurrentUser({ username: user.username, credits: user.credits });

    // Show welcome animation
    showWelcomeAnim(user.username, () => {
      window.location.href = 'home.html';
    });

  } catch (err) {
    showNotify('error', 'Error', 'Gagal terhubung ke server. Coba lagi.');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
    }
  }
}

function showWelcomeAnim(username, callback) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'welcome-overlay';
  overlay.innerHTML = `
    <img src="${CONFIG.LOGO}" style="width:80px;height:80px;border-radius:50%;border:3px solid #9933ff;box-shadow:0 0 40px rgba(153,51,255,0.8);object-fit:cover;margin-bottom:24px;animation:logoPulse 1.5s ease-in-out infinite alternate;">
    <div class="welcome-text">Welcome, ${username}! 👋</div>
    <p style="margin-top:14px;color:#b388ff;font-family:'Rajdhani',sans-serif;font-size:16px;letter-spacing:2px;">Mengarahkan ke Dashboard...</p>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => overlay.classList.add('show'), 50);
  setTimeout(() => {
    overlay.classList.add('hide');
    setTimeout(callback, 600);
  }, 2500);
}

/* ============================================
   REGISTER.HTML - REGISTER LOGIC
============================================ */
function initRegisterPage() {
  initLoadingScreen('register');

  setupPasswordToggle('reg-password', 'toggle-reg-pass');
  setupPasswordToggle('reg-confirm-password', 'toggle-reg-confirm');

  const regBtn = document.getElementById('register-btn');
  if (regBtn) {
    regBtn.addEventListener('click', handleRegister);
  }
}

async function handleRegister() {
  const username = document.getElementById('reg-username')?.value?.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirmPw = document.getElementById('reg-confirm-password')?.value;
  const regBtn = document.getElementById('register-btn');

  if (!username || !password || !confirmPw) {
    showNotify('error', 'Error', 'Semua field wajib diisi!');
    return;
  }

  if (username.length < 3) {
    showNotify('error', 'Error', 'Username minimal 3 karakter!');
    return;
  }

  if (password.length < 6) {
    showNotify('error', 'Error', 'Password minimal 6 karakter!');
    return;
  }

  if (password !== confirmPw) {
    showNotify('error', 'Error', 'Konfirmasi password tidak sama!');
    return;
  }

  if (regBtn) {
    regBtn.disabled = true;
    regBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mendaftar...';
  }

  try {
    const db = await dbRead();
    const users = db.users || [];

    if (users.find(u => u.username === username)) {
      showNotify('error', 'Gagal', 'Username sudah digunakan! Pilih username lain.');
      if (regBtn) {
        regBtn.disabled = false;
        regBtn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
      }
      return;
    }

    const newUser = {
      username,
      password,
      credits: 0,
      createdAt: new Date().toISOString()
    };

    db.users = [...users, newUser];
    await dbWrite(db);

    await Swal.fire({
      title: '<span style="font-family:Orbitron">Berhasil! 🎉</span>',
      html: `<p>Akun <strong style="color:#9933ff">${username}</strong> berhasil dibuat!<br>Silahkan login sekarang.</p>`,
      icon: 'success',
      confirmButtonText: 'LOGIN SEKARANG',
      allowOutsideClick: false
    });

    window.location.href = 'index.html';

  } catch (err) {
    showNotify('error', 'Error', 'Gagal membuat akun. Coba lagi.');
    if (regBtn) {
      regBtn.disabled = false;
      regBtn.innerHTML = '<i class="fas fa-user-plus"></i> DAFTAR SEKARANG';
    }
  }
}

/* ============================================
   HOME.HTML - DASHBOARD LOGIC
============================================ */
async function initHomePage() {
  initLoadingScreen('home');

  // Auth check
  const user = requireAuth();
  if (!user) return;

  // Wait for loading screen
  setTimeout(async () => {
    try {
      // Load fresh data
      const db = await dbRead();
      const userData = db.users?.find(u => u.username === user.username) || user;

      // Update session with fresh credits
      setCurrentUser({ username: userData.username, credits: userData.credits || 0 });

      // Update UI
      updateUserUI(userData);

      // Load products
      renderProducts(db.products || []);

      // Load settings (marquee)
      loadMarqueeSettings(db.settings || {});

      // Show welcome popup
      setTimeout(() => showWelcomePopup(userData.username), 500);

      // Setup FAQ
      initFAQ();

      // Load transaction logs
      loadUserLogs(user.username, db.transactions || []);

      // Init scroll animations
      initScrollAnimations();

    } catch (err) {
      console.error('Init home error:', err);
    }
  }, 3200);

  // Setup navbar
  setupNavbar();
}

function updateUserUI(user) {
  const greetEl = document.getElementById('user-greeting');
  const creditEl = document.getElementById('user-credit');
  if (greetEl) greetEl.textContent = `👋 Hello, ${user.username}`;
  if (creditEl) creditEl.textContent = `$${(user.credits || 0).toFixed(2)}`;
}

function loadMarqueeSettings(settings) {
  const bar = document.getElementById('running-text-bar');
  const content = document.getElementById('running-text-content');
  const mainContent = document.querySelector('.main-content');

  if (settings.runningTextEnabled && bar) {
    bar.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('with-marquee');
    const text = settings.runningText || '';
    if (content) {
      content.innerHTML = `<span>${text}&nbsp;&nbsp;•&nbsp;&nbsp;${text}&nbsp;&nbsp;•&nbsp;&nbsp;${text}&nbsp;&nbsp;•&nbsp;&nbsp;${text}</span>`.repeat(2);
    }
  } else if (bar) {
    bar.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('with-marquee');
  }
}

/* ---- WELCOME POPUP ---- */
function showWelcomePopup(username) {
  const overlay = document.getElementById('welcome-popup-overlay');
  if (overlay) overlay.classList.add('show');
}

function closeWelcomePopup() {
  const overlay = document.getElementById('welcome-popup-overlay');
  if (overlay) overlay.classList.remove('show');
}

/* ---- NAVBAR ---- */
function setupNavbar() {
  const hamburger = document.getElementById('hamburger-btn');
  const navbar = document.getElementById('slide-navbar');
  const overlay = document.getElementById('navbar-overlay');
  const closeBtn = document.getElementById('close-navbar');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navbar?.classList.add('open');
      overlay?.classList.add('show');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeNavbar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeNavbar);
  }
}

function closeNavbar() {
  const navbar = document.getElementById('slide-navbar');
  const overlay = document.getElementById('navbar-overlay');
  navbar?.classList.remove('open');
  overlay?.classList.remove('show');
}

function handleLogout() {
  Swal.fire({
    title: 'Logout?',
    text: 'Apakah kamu yakin ingin keluar?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal'
  }).then(result => {
    if (result.isConfirmed) {
      clearSession();
      window.location.href = 'index.html';
    }
  });
}

/* ---- PRODUCTS ---- */
function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-box-open"></i>
        <p>Belum ada produk tersedia.<br>Admin akan segera menambahkan produk.</p>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  products.forEach((product, idx) => {
    const card = document.createElement('div');
    card.className = 'product-card scroll-fade';
    card.style.animationDelay = `${idx * 0.1}s`;

    const featuresHTML = (product.features || []).map(f =>
      `<div class="product-feature"><i class="fas fa-check-circle"></i>${f}</div>`
    ).join('');

    const imgHTML = product.image
      ? `<img src="${product.image}" class="product-img" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\'product-img-placeholder\'><i class=\'fas fa-gamepad\'></i></div>'">`
      : `<div class="product-img-placeholder"><i class="fas fa-gamepad"></i></div>`;

    card.innerHTML = `
      ${imgHTML}
      <div class="product-body">
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.description || ''}</div>
        <div class="product-features">${featuresHTML}</div>
      </div>`;

    card.addEventListener('click', () => openProductOptions(product));
    grid.appendChild(card);
  });

  initScrollAnimations();
}

/* ---- PRODUCT OPTIONS POPUP ---- */
function openProductOptions(product) {
  const overlay = document.getElementById('product-popup-overlay');
  const content = document.getElementById('product-popup-content');
  if (!overlay || !content) return;

  let selectedPlan = null;
  let quantity = 1;

  const plansHTML = (product.plans || []).map((plan, i) =>
    `<div class="option-plan" data-idx="${i}" data-price="${plan.price}" data-duration="${plan.duration}">
      <div class="plan-duration">${plan.duration}</div>
      <div class="plan-price">$${plan.price}</div>
    </div>`
  ).join('');

  content.innerHTML = `
    <button class="popup-close" onclick="closeProductPopup()"><i class="fas fa-times"></i></button>
    <img src="${CONFIG.LOGO}" class="popup-logo" alt="Drip">
    <div class="popup-title">${product.name}</div>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">${product.description || ''}</p>

    <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:2px;">Pilih Plan</div>
    <div class="option-plans" id="option-plans">${plansHTML}</div>

    <div class="qty-row">
      <span class="qty-label">Quantity:</span>
      <button class="qty-btn" id="qty-minus"><i class="fas fa-minus"></i></button>
      <span class="qty-num" id="qty-num">1</span>
      <button class="qty-btn" id="qty-plus"><i class="fas fa-plus"></i></button>
    </div>

    <div class="total-price-row">
      <span class="total-label">Total Harga:</span>
      <span class="total-amount" id="total-price">$0.00</span>
    </div>

    <div class="form-group">
      <label class="form-label">Kode Promo (Opsional)</label>
      <div style="display:flex;gap:8px;">
        <input type="text" class="form-input" id="promo-input" placeholder="Masukan kode promo...">
        <button onclick="validatePromo('${product.id}')" style="white-space:nowrap;" class="btn-admin btn-sm">Cek</button>
      </div>
      <div id="promo-info" style="font-size:12px;margin-top:6px;"></div>
    </div>

    <div class="form-group">
      <label class="form-label">Nomor WhatsApp</label>
      <input type="text" class="form-input" id="wa-number" placeholder="Contoh: 08123456789">
    </div>

    <button class="btn-primary" id="buy-now-btn" style="margin-top:8px;" onclick="processPurchase('${product.id}')">
      <i class="fas fa-shopping-cart"></i> BUY NOW
    </button>`;

  overlay.classList.add('show');

  // Plan click handler
  document.querySelectorAll('.option-plan').forEach(planEl => {
    planEl.addEventListener('click', () => {
      document.querySelectorAll('.option-plan').forEach(p => p.classList.remove('selected'));
      planEl.classList.add('selected');
      selectedPlan = {
        duration: planEl.dataset.duration,
        price: parseFloat(planEl.dataset.price)
      };
      window._selectedPlan = selectedPlan;
      updateTotalPrice();
    });
  });

  // Qty handlers
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    quantity = Math.min(quantity + 1, 99);
    document.getElementById('qty-num').textContent = quantity;
    window._qty = quantity;
    updateTotalPrice();
  });

  document.getElementById('qty-minus')?.addEventListener('click', () => {
    quantity = Math.max(quantity - 1, 1);
    document.getElementById('qty-num').textContent = quantity;
    window._qty = quantity;
    updateTotalPrice();
  });

  window._selectedPlan = null;
  window._qty = 1;
  window._promoDiscount = 0;
  window._promoCode = null;
  window._currentProduct = product;
}

function updateTotalPrice() {
  const plan = window._selectedPlan;
  const qty = window._qty || 1;
  const discount = window._promoDiscount || 0;
  const totalEl = document.getElementById('total-price');

  if (!totalEl) return;

  if (!plan) {
    totalEl.textContent = '$0.00';
    return;
  }

  let base = plan.price * qty;
  let final = base - (base * discount / 100);
  totalEl.textContent = `$${final.toFixed(2)}`;
  if (discount > 0) {
    totalEl.innerHTML = `<span style="text-decoration:line-through;opacity:0.5;font-size:14px;">$${base.toFixed(2)}</span> <span style="color:var(--accent-green)">$${final.toFixed(2)}</span>`;
  }
}

function closeProductPopup() {
  document.getElementById('product-popup-overlay')?.classList.remove('show');
}

async function validatePromo(productId) {
  const code = document.getElementById('promo-input')?.value?.trim().toUpperCase();
  const infoEl = document.getElementById('promo-info');
  if (!code) return;

  try {
    const db = await dbRead();
    const promos = db.promoCodes || [];
    const promo = promos.find(p => p.code === code);

    if (!promo) {
      if (infoEl) infoEl.innerHTML = `<span style="color:var(--accent-red)"><i class="fas fa-times-circle"></i> Kode promo tidak ditemukan!</span>`;
      window._promoDiscount = 0;
      window._promoCode = null;
      updateTotalPrice();
      return;
    }

    // Check max usage
    const user = getCurrentUser();
    const used = (db.transactions || []).filter(t => t.promoCode === code).length;

    if (promo.maxUsage && used >= promo.maxUsage) {
      if (infoEl) infoEl.innerHTML = `<span style="color:var(--accent-red)"><i class="fas fa-ban"></i> Promo sudah mencapai batas pemakaian!</span>`;
      window._promoDiscount = 0;
      window._promoCode = null;
      updateTotalPrice();
      return;
    }

    // Check if user already used this promo
    const userUsed = (db.transactions || []).filter(t => t.promoCode === code && t.username === user.username).length;
    if (userUsed > 0) {
      if (infoEl) infoEl.innerHTML = `<span style="color:var(--accent-red)"><i class="fas fa-ban"></i> Kamu sudah menggunakan promo ini!</span>`;
      window._promoDiscount = 0;
      window._promoCode = null;
      updateTotalPrice();
      return;
    }

    window._promoDiscount = promo.percent;
    window._promoCode = code;
    if (infoEl) infoEl.innerHTML = `<span style="color:var(--accent-green)"><i class="fas fa-check-circle"></i> Promo valid! Diskon ${promo.percent}% 🎉</span>`;
    updateTotalPrice();

  } catch (err) {
    if (infoEl) infoEl.innerHTML = `<span style="color:var(--accent-red)">Gagal memvalidasi promo.</span>`;
  }
}

async function processPurchase(productId) {
  const plan = window._selectedPlan;
  const qty = window._qty || 1;
  const waNumber = document.getElementById('wa-number')?.value?.trim();
  const promoCode = window._promoCode;
  const discount = window._promoDiscount || 0;
  const user = getCurrentUser();

  if (!plan) {
    showNotify('warning', 'Pilih Plan', 'Silahkan pilih plan terlebih dahulu!');
    return;
  }

  if (!waNumber) {
    showNotify('warning', 'WhatsApp', 'Nomor WhatsApp wajib diisi!');
    return;
  }

  const product = window._currentProduct;
  let baseTotal = plan.price * qty;
  let finalTotal = baseTotal - (baseTotal * discount / 100);

  // Check credits
  if ((user.credits || 0) < finalTotal) {
    showNotify('error', 'Saldo Tidak Cukup', `Saldo kamu tidak mencukupi. Saldo: $${(user.credits || 0).toFixed(2)}, Dibutuhkan: $${finalTotal.toFixed(2)}`);
    return;
  }

  const confirmed = await Swal.fire({
    title: 'Konfirmasi Pembelian',
    html: `
      <div style="text-align:left;font-size:14px;">
        <p><b>Produk:</b> ${product.name}</p>
        <p><b>Plan:</b> ${plan.duration}</p>
        <p><b>Qty:</b> ${qty}</p>
        ${discount > 0 ? `<p><b>Diskon:</b> ${discount}%</p>` : ''}
        <p><b>Total:</b> <span style="color:#ffd700;font-weight:bold;">$${finalTotal.toFixed(2)}</span></p>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Ya, Beli!',
    cancelButtonText: 'Batal'
  });

  if (!confirmed.isConfirmed) return;

  const buyBtn = document.getElementById('buy-now-btn');
  if (buyBtn) {
    buyBtn.disabled = true;
    buyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
  }

  try {
    const db = await dbRead();
    const users = db.users || [];
    const userIdx = users.findIndex(u => u.username === user.username);

    if (userIdx === -1) throw new Error('User not found');

    // Deduct credits
    users[userIdx].credits = (users[userIdx].credits || 0) - finalTotal;

    const trxId = 'TRX' + Date.now();
    const newTrx = {
      id: trxId,
      username: user.username,
      productId: product.id,
      productName: product.name,
      plan: plan.duration,
      quantity: qty,
      totalPrice: finalTotal,
      waNumber,
      promoCode: promoCode || null,
      status: 'waiting',
      keys: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users = users;
    db.transactions = [...(db.transactions || []), newTrx];
    await dbWrite(db);

    // Update session
    setCurrentUser({ username: user.username, credits: users[userIdx].credits });
    updateUserUI(users[userIdx]);

    closeProductPopup();

    await Swal.fire({
      title: '✅ Pembelian Berhasil!',
      html: `
        <p>Transaksi ID: <b style="color:#9933ff">${trxId}</b></p>
        <p>Saldo berkurang: <b style="color:#ff4444">-$${finalTotal.toFixed(2)}</b></p>
        <p>Status: <b style="color:#ffc107">Menunggu Proses Admin</b></p>
        <p style="margin-top:12px;font-size:12px;color:#7c4daa">Cek Logs Transaksi untuk update status.</p>`,
      icon: 'success'
    });

    // Refresh logs
    loadUserLogs(user.username, db.transactions);

  } catch (err) {
    showNotify('error', 'Error', 'Gagal memproses pembelian. Coba lagi.');
    if (buyBtn) {
      buyBtn.disabled = false;
      buyBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> BUY NOW';
    }
  }
}

/* ---- TRANSACTION LOGS (USER) ---- */
async function loadUserLogs(username, transactions) {
  const logsContainer = document.getElementById('user-logs-container');
  if (!logsContainer) return;

  const userTrx = (transactions || []).filter(t => t.username === username).reverse();

  if (userTrx.length === 0) {
    logsContainer.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>Belum ada transaksi.</p></div>`;
    return;
  }

  logsContainer.innerHTML = userTrx.map(trx => {
    const statusClass = trx.status === 'approved' ? 'approved' : trx.status === 'rejected' ? 'rejected' : 'waiting';
    const statusText = trx.status === 'approved' ? 'Approved' : trx.status === 'rejected' ? 'Rejected' : 'Waiting';
    return `
      <div class="log-item scroll-fade" onclick="showTrxDetail('${trx.id}')">
        <div class="log-info">
          <h4>${trx.productName}</h4>
          <p>${trx.plan} · Qty: ${trx.quantity} · $${trx.totalPrice?.toFixed(2)} · ${formatDate(trx.createdAt)}</p>
        </div>
        <div class="log-status ${statusClass}">${statusText}</div>
      </div>`;
  }).join('');

  window._userTrxCache = userTrx;
  initScrollAnimations();
}

async function showTrxDetail(trxId) {
  const db = await dbRead();
  const trx = (db.transactions || []).find(t => t.id === trxId);
  if (!trx) return;

  const keysHTML = trx.keys && trx.keys.length > 0
    ? trx.keys.map(k => `<div style="background:rgba(0,229,255,0.1);border:1px solid rgba(0,229,255,0.3);border-radius:6px;padding:8px 12px;font-family:'Space Mono',monospace;font-size:13px;color:var(--accent-cyan);margin-bottom:6px;">${k}</div>`).join('')
    : '<p style="color:var(--text-muted);font-size:13px;">Belum ada key dikirim.</p>';

  const statusColor = trx.status === 'approved' ? 'var(--accent-green)' : trx.status === 'rejected' ? 'var(--accent-red)' : '#ffc107';
  const statusText = trx.status === 'approved' ? 'Approved ✓' : trx.status === 'rejected' ? 'Rejected ✗' : 'Waiting ⏳';

  Swal.fire({
    title: `<span style="font-family:Orbitron;font-size:16px">${trx.productName}</span>`,
    html: `
      <div style="text-align:left;font-size:14px;">
        <div style="background:rgba(45,0,96,0.4);border:1px solid rgba(153,51,255,0.3);border-radius:10px;padding:14px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:var(--text-muted)">Produk</span>
            <span style="font-weight:600">${trx.productName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:var(--text-muted)">Plan</span>
            <span style="font-weight:600">${trx.plan}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:var(--text-muted)">Qty</span>
            <span style="font-weight:600">${trx.quantity}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:var(--text-muted)">Total</span>
            <span style="color:#ffd700;font-weight:700">$${trx.totalPrice?.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:var(--text-muted)">Tanggal</span>
            <span>${formatDate(trx.createdAt)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:var(--text-muted)">ID Trx</span>
            <span style="font-family:'Space Mono',monospace;font-size:12px;color:var(--purple-bright)">${trx.id}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted)">Status</span>
            <span style="color:${statusColor};font-weight:700">${statusText}</span>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:2px;">Keys</div>
        ${keysHTML}
      </div>`,
    confirmButtonText: 'Tutup'
  });
}

/* ---- RESET KEY ---- */
function openResetKey() {
  closeNavbar();
  const overlay = document.getElementById('reset-popup-overlay');
  if (overlay) overlay.classList.add('show');
  document.getElementById('reset-key-input').value = '';
  document.getElementById('terminal-output').innerHTML = '';
}

function closeResetPopup() {
  document.getElementById('reset-popup-overlay')?.classList.remove('show');
}

async function processResetKey() {
  const keyInput = document.getElementById('reset-key-input')?.value?.trim();
  const terminal = document.getElementById('terminal-output');
  const user = getCurrentUser();

  if (!keyInput) {
    showNotify('warning', 'Input', 'Masukan ID/Key yang ingin direset!');
    return;
  }

  terminal.innerHTML = '';
  const addLine = (prompt, text, cls, delay) => {
    setTimeout(() => {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = `<span class="prompt">${prompt}</span><span class="${cls || 'cmd'}">${text}</span>`;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;
    }, delay);
  };

  addLine('>', 'Connecting to server...', 'cmd', 200);
  addLine('>', 'Fetching Server.....', 'cmd', 700);
  addLine('>', 'Response Database....', 'cmd', 1400);

  try {
    const db = await dbRead();
    const settings = db.settings || {};

    if (!settings.resetKeyEnabled) {
      setTimeout(() => {
        addLine('✗', 'OPERATION FAILED', 'err', 0);
        const errLine = document.createElement('div');
        errLine.className = 'terminal-line';
        errLine.style.color = 'var(--accent-red)';
        errLine.style.fontSize = '12px';
        errLine.style.marginTop = '8px';
        errLine.textContent = 'Maaf fitur ini sedang di nonaktifkan oleh admin atau sedang tidak beroperasi normal, Silahkan coba lagi nanti.';
        terminal.appendChild(errLine);
      }, 2000);
      return;
    }

    // Check daily limit
    const today = new Date().toDateString();
    const resets = JSON.parse(localStorage.getItem('drip_resets') || '{}');
    const todayResets = resets[user.username]?.[today] || 0;

    if (todayResets >= 1) {
      setTimeout(() => {
        addLine('✗', 'DAILY LIMIT REACHED', 'err', 0);
        const errLine = document.createElement('div');
        errLine.className = 'terminal-line';
        errLine.style.color = '#ffc107';
        errLine.style.fontSize = '12px';
        errLine.style.marginTop = '8px';
        errLine.textContent = 'Reset hanya bisa dilakukan 1x per hari. Silahkan coba besok.';
        terminal.appendChild(errLine);
      }, 2000);
      return;
    }

    setTimeout(() => {
      // Success
      addLine('✓', 'SUCCESS - Status: 200', 'ok', 0);

      const newKey = generateKey();
      setTimeout(() => {
        addLine('>', `{"success":true,"message":"Token reset successfully","resetsused":${todayResets + 1},"resetsmax":1,"nextresettime":"${getNextDayStr()}"}`, 'val', 300);
        setTimeout(() => {
          addLine('✅', `NEW KEY: ${newKey}`, 'ok', 0);
          const keyDisplay = document.createElement('div');
          keyDisplay.style.cssText = 'margin-top:12px;padding:10px;background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.4);border-radius:6px;font-family:Space Mono,monospace;font-size:14px;color:var(--accent-green);word-break:break-all;';
          keyDisplay.textContent = newKey;
          terminal.appendChild(keyDisplay);

          // Save reset count
          if (!resets[user.username]) resets[user.username] = {};
          resets[user.username][today] = (resets[user.username][today] || 0) + 1;
          localStorage.setItem('drip_resets', JSON.stringify(resets));
        }, 500);
      }, 300);
    }, 2200);

  } catch (err) {
    setTimeout(() => {
      addLine('✗', 'SERVER ERROR', 'err', 0);
    }, 2000);
  }
}

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part(5)}-${part(5)}-${part(5)}-${part(5)}`;
}

function getNextDayStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

/* ---- FAQ ---- */
function initFAQ() {
  const faqs = document.querySelectorAll('.faq-item');
  faqs.forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqs.forEach(f => f.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ---- SCROLL ANIMATIONS ---- */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-fade, .scroll-fade-left').forEach(el => {
    observer.observe(el);
  });
}

/* ============================================
   ADMIN.HTML - ADMIN PANEL LOGIC
============================================ */
async function initAdminPage() {
  initLoadingScreen('admin');

  setTimeout(async () => {
    try {
      const db = await dbRead();
      loadAdminStats(db);
      loadAdminProducts(db.products || []);
      loadAdminPromos(db.promoCodes || []);
      loadAdminLogs(db.transactions || []);
      loadAdminUsers(db.users || []);
      loadAdminSettings(db.settings || {});
    } catch (err) {
      console.error('Admin init error:', err);
      showNotify('error', 'Error', 'Gagal memuat data admin.');
    }
  }, 3200);

  setupAdminNavigation();
}

function setupAdminNavigation() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const target = item.dataset.target;
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${target}`)?.classList.add('active');
    });
  });

  // Mobile sidebar
  const sidebarToggle = document.getElementById('admin-sidebar-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

function loadAdminStats(db) {
  const users = db.users || [];
  const products = db.products || [];
  const transactions = db.transactions || [];

  const totalRevenue = transactions.filter(t => t.status === 'approved').reduce((sum, t) => sum + (t.totalPrice || 0), 0);

  setEl('stat-users', users.length);
  setEl('stat-products', products.length);
  setEl('stat-transactions', transactions.length);
  setEl('stat-revenue', `$${totalRevenue.toFixed(2)}`);
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ---- ADD PRODUCT ---- */
function addPriceRow() {
  const container = document.getElementById('price-rows-container');
  const idx = container.querySelectorAll('.price-row-admin').length;
  const row = document.createElement('div');
  row.className = 'price-row-admin';
  row.innerHTML = `
    <input type="text" class="admin-input" placeholder="Durasi (contoh: 7 Days)" style="flex:1.5">
    <input type="number" class="admin-input" placeholder="Harga ($)" style="flex:1" min="0" step="0.01">
    <button class="remove-price-row" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
  container.appendChild(row);
}

async function submitAddProduct() {
  const name = document.getElementById('prod-name')?.value?.trim();
  const image = document.getElementById('prod-image')?.value?.trim();
  const desc = document.getElementById('prod-desc')?.value?.trim();
  const featuresRaw = document.getElementById('prod-features')?.value?.trim();
  const btn = document.getElementById('add-product-btn');

  const priceRows = document.querySelectorAll('.price-row-admin');
  const plans = [];
  priceRows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const duration = inputs[0]?.value?.trim();
    const price = parseFloat(inputs[1]?.value);
    if (duration && !isNaN(price)) plans.push({ duration, price });
  });

  if (!name) { showNotify('error', 'Error', 'Nama produk wajib diisi!'); return; }
  if (plans.length === 0) { showNotify('error', 'Error', 'Minimal 1 plan harga!'); return; }

  const features = featuresRaw ? featuresRaw.split('\n').map(f => f.trim()).filter(f => f) : [];

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

  try {
    const db = await dbRead();
    const product = {
      id: 'prod_' + Date.now(),
      name,
      image: image || '',
      description: desc || '',
      features,
      plans,
      createdAt: new Date().toISOString()
    };

    db.products = [...(db.products || []), product];
    await dbWrite(db);

    showNotify('success', 'Berhasil!', `Produk "${name}" berhasil ditambahkan!`);
    loadAdminProducts(db.products);
    loadAdminStats(db);

    // Reset form
    ['prod-name', 'prod-image', 'prod-desc', 'prod-features'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('price-rows-container').innerHTML = '';
    addPriceRow();

  } catch (err) {
    showNotify('error', 'Error', 'Gagal menyimpan produk.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> ADD PRODUCT'; }
  }
}

function loadAdminProducts(products) {
  const container = document.getElementById('admin-product-list');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-box-open"></i><p>Belum ada produk.</p></div>`;
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="admin-product-card">
      <img src="${p.image || CONFIG.LOGO}" alt="${p.name}" onerror="this.src='${CONFIG.LOGO}'">
      <div class="admin-product-info">
        <h4>${p.name}</h4>
        <p>${p.description || 'No description'}</p>
        <div class="admin-product-actions">
          <button class="btn-admin btn-sm" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-admin btn-danger btn-sm" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('');
}

async function deleteProduct(productId) {
  const confirmed = await Swal.fire({
    title: 'Hapus Produk?',
    text: 'Produk ini akan dihapus permanen!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal'
  });

  if (!confirmed.isConfirmed) return;

  try {
    const db = await dbRead();
    db.products = (db.products || []).filter(p => p.id !== productId);
    await dbWrite(db);
    showNotify('success', 'Berhasil!', 'Produk berhasil dihapus.');
    loadAdminProducts(db.products);
    loadAdminStats(db);
  } catch (err) {
    showNotify('error', 'Error', 'Gagal menghapus produk.');
  }
}

async function editProduct(productId) {
  const db = await dbRead();
  const product = (db.products || []).find(p => p.id === productId);
  if (!product) return;

  const plansHTML = product.plans.map((plan, i) =>
    `<div style="display:flex;gap:6px;margin-bottom:6px;">
      <input class="admin-input edit-plan-dur" placeholder="Durasi" value="${plan.duration}" style="flex:1.5">
      <input class="admin-input edit-plan-price" placeholder="Harga" type="number" value="${plan.price}" step="0.01" style="flex:1">
    </div>`
  ).join('');

  const { value: formValues } = await Swal.fire({
    title: '<span style="font-family:Orbitron">Edit Produk</span>',
    html: `
      <div style="text-align:left;">
        <label style="font-size:12px;color:var(--purple-light);text-transform:uppercase;letter-spacing:1px;">Nama</label>
        <input id="edit-name" class="admin-input" value="${product.name}" style="width:100%;margin-bottom:10px;">
        <label style="font-size:12px;color:var(--purple-light);text-transform:uppercase;letter-spacing:1px;">Image URL</label>
        <input id="edit-image" class="admin-input" value="${product.image || ''}" style="width:100%;margin-bottom:10px;">
        <label style="font-size:12px;color:var(--purple-light);text-transform:uppercase;letter-spacing:1px;">Deskripsi</label>
        <input id="edit-desc" class="admin-input" value="${product.description || ''}" style="width:100%;margin-bottom:10px;">
        <label style="font-size:12px;color:var(--purple-light);text-transform:uppercase;letter-spacing:1px;">Fitur (per baris)</label>
        <textarea id="edit-features" class="admin-input" style="width:100%;min-height:80px;margin-bottom:10px;">${(product.features || []).join('\n')}</textarea>
        <label style="font-size:12px;color:var(--purple-light);text-transform:uppercase;letter-spacing:1px;">Plans</label>
        <div id="edit-plans">${plansHTML}</div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    preConfirm: () => {
      const name = document.getElementById('edit-name')?.value?.trim();
      if (!name) { Swal.showValidationMessage('Nama wajib diisi!'); return false; }
      const plans = [];
      const durs = document.querySelectorAll('.edit-plan-dur');
      const prices = document.querySelectorAll('.edit-plan-price');
      durs.forEach((d, i) => {
        if (d.value.trim() && prices[i]?.value) {
          plans.push({ duration: d.value.trim(), price: parseFloat(prices[i].value) });
        }
      });
      return {
        name,
        image: document.getElementById('edit-image')?.value?.trim() || '',
        description: document.getElementById('edit-desc')?.value?.trim() || '',
        features: (document.getElementById('edit-features')?.value || '').split('\n').filter(f => f.trim()),
        plans
      };
    }
  });

  if (!formValues) return;

  try {
    const db2 = await dbRead();
    const idx = db2.products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      db2.products[idx] = { ...db2.products[idx], ...formValues };
      await dbWrite(db2);
      showNotify('success', 'Berhasil!', 'Produk berhasil diupdate!');
      loadAdminProducts(db2.products);
    }
  } catch (err) {
    showNotify('error', 'Error', 'Gagal update produk.');
  }
}

/* ---- PROMO CODES ---- */
async function submitAddPromo() {
  const code = document.getElementById('promo-code')?.value?.trim().toUpperCase();
  const percent = parseInt(document.getElementById('promo-percent')?.value);
  const maxUsage = parseInt(document.getElementById('promo-max')?.value);
  const btn = document.getElementById('add-promo-btn');

  if (!code) { showNotify('error', 'Error', 'Kode promo wajib diisi!'); return; }
  if (isNaN(percent) || percent < 1 || percent > 100) { showNotify('error', 'Error', 'Persen harus antara 1-100!'); return; }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

  try {
    const db = await dbRead();
    if ((db.promoCodes || []).find(p => p.code === code)) {
      showNotify('error', 'Duplikat', 'Kode promo sudah ada!');
      return;
    }

    const promo = { code, percent, maxUsage: maxUsage || 0, createdAt: new Date().toISOString() };
    db.promoCodes = [...(db.promoCodes || []), promo];
    await dbWrite(db);
    showNotify('success', 'Berhasil!', `Promo "${code}" (${percent}%) ditambahkan!`);
    loadAdminPromos(db.promoCodes);

    ['promo-code', 'promo-percent', 'promo-max'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

  } catch (err) {
    showNotify('error', 'Error', 'Gagal menambah promo.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> ADD PROMO'; }
  }
}

function loadAdminPromos(promos) {
  const container = document.getElementById('promo-list');
  if (!container) return;

  if (!promos || promos.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Belum ada kode promo.</p>';
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Code</th><th>Diskon</th><th>Max Pakai</th><th>Dibuat</th><th>Aksi</th>
      </tr></thead>
      <tbody>
        ${promos.map(p => `
          <tr>
            <td style="font-family:'Space Mono',monospace;color:var(--accent-gold)">${p.code}</td>
            <td style="color:var(--accent-green)">${p.percent}%</td>
            <td>${p.maxUsage || 'Bebas'}</td>
            <td>${formatDate(p.createdAt)}</td>
            <td><button class="btn-admin btn-danger btn-sm" onclick="deletePromo('${p.code}')"><i class="fas fa-trash"></i></button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function deletePromo(code) {
  const confirmed = await Swal.fire({ title: 'Hapus Promo?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal' });
  if (!confirmed.isConfirmed) return;

  try {
    const db = await dbRead();
    db.promoCodes = (db.promoCodes || []).filter(p => p.code !== code);
    await dbWrite(db);
    showNotify('success', 'Berhasil!', 'Promo dihapus.');
    loadAdminPromos(db.promoCodes);
  } catch (err) {
    showNotify('error', 'Error', 'Gagal menghapus promo.');
  }
}

/* ---- RUNNING TEXT ---- */
async function saveRunningText() {
  const text = document.getElementById('running-text-input')?.value?.trim();
  const enabled = document.getElementById('running-text-toggle')?.checked;
  const btn = document.getElementById('save-running-text-btn');

  if (!text) { showNotify('error', 'Error', 'Teks tidak boleh kosong!'); return; }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

  try {
    const db = await dbRead();
    db.settings = db.settings || {};
    db.settings.runningText = text;
    db.settings.runningTextEnabled = enabled;
    await dbWrite(db);
    showNotify('success', 'Berhasil!', 'Running text disimpan!');
  } catch (err) {
    showNotify('error', 'Error', 'Gagal menyimpan.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> SIMPAN'; }
  }
}

/* ---- ADD SALDO ---- */
async function submitAddSaldo() {
  const username = document.getElementById('saldo-username')?.value?.trim();
  const amount = parseFloat(document.getElementById('saldo-amount')?.value);
  const btn = document.getElementById('add-saldo-btn');

  if (!username) { showNotify('error', 'Error', 'Username wajib diisi!'); return; }
  if (isNaN(amount) || amount <= 0) { showNotify('error', 'Error', 'Jumlah saldo tidak valid!'); return; }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

  try {
    const db = await dbRead();
    const userIdx = (db.users || []).findIndex(u => u.username === username);
    if (userIdx === -1) {
      showNotify('error', 'Error', `User "${username}" tidak ditemukan!`);
      return;
    }

    db.users[userIdx].credits = (db.users[userIdx].credits || 0) + amount;
    await dbWrite(db);
    showNotify('success', 'Berhasil!', `$${amount} berhasil ditambahkan ke ${username}. Saldo baru: $${db.users[userIdx].credits.toFixed(2)}`);
    loadAdminStats(db);
    loadAdminUsers(db.users);

    document.getElementById('saldo-username').value = '';
    document.getElementById('saldo-amount').value = '';

  } catch (err) {
    showNotify('error', 'Error', 'Gagal menambah saldo.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> TRANSFER SALDO'; }
  }
}

/* ---- RESET KEY TOGGLE ---- */
async function saveResetKeyToggle() {
  const enabled = document.getElementById('reset-key-toggle')?.checked;
  try {
    const db = await dbRead();
    db.settings = db.settings || {};
    db.settings.resetKeyEnabled = enabled;
    await dbWrite(db);
    showNotify('success', 'Berhasil!', `Fitur Reset Key ${enabled ? 'diaktifkan' : 'dinonaktifkan'}!`);
  } catch (err) {
    showNotify('error', 'Error', 'Gagal menyimpan setting.');
  }
}

/* ---- ADMIN LOGS & TRANSACTIONS ---- */
function loadAdminLogs(transactions) {
  const container = document.getElementById('admin-logs-container');
  if (!container) return;

  if (!transactions || transactions.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>Belum ada transaksi.</p></div>`;
    return;
  }

  const sorted = [...transactions].reverse();
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>User</th><th>Produk</th><th>Plan</th><th>Total</th><th>WA</th><th>Status</th><th>Aksi</th>
      </tr></thead>
      <tbody>
        ${sorted.map(trx => {
          const statusClass = trx.status === 'approved' ? 'approved' : trx.status === 'rejected' ? 'rejected' : 'waiting';
          const statusText = trx.status === 'approved' ? '✓ Approved' : trx.status === 'rejected' ? '✗ Rejected' : '⏳ Waiting';
          return `
            <tr>
              <td style="font-family:'Space Mono',monospace;font-size:11px;color:var(--purple-bright)">${trx.id}</td>
              <td>${trx.username}</td>
              <td>${trx.productName}</td>
              <td>${trx.plan} x${trx.quantity}</td>
              <td style="color:var(--accent-gold)">$${trx.totalPrice?.toFixed(2)}</td>
              <td>${trx.waNumber}</td>
              <td><span class="log-status ${statusClass}">${statusText}</span></td>
              <td>
                <div class="table-actions">
                  ${trx.status === 'waiting' ? `
                    <button class="btn-admin btn-success btn-sm" onclick="approveTransaction('${trx.id}')"><i class="fas fa-check"></i></button>
                    <button class="btn-admin btn-danger btn-sm" onclick="rejectTransaction('${trx.id}')"><i class="fas fa-times"></i></button>
                  ` : ''}
                </div>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

async function approveTransaction(trxId) {
  const db = await dbRead();
  const trx = (db.transactions || []).find(t => t.id === trxId);
  if (!trx) return;

  const { value: keys } = await Swal.fire({
    title: '<span style="font-family:Orbitron">Approve & Kirim Key</span>',
    html: `
      <div style="text-align:left;">
        <div class="trx-detail" style="background:rgba(45,0,96,0.3);border:1px solid rgba(153,51,255,0.3);border-radius:8px;padding:12px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--text-muted)">Produk</span><span>${trx.productName}</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--text-muted)">User</span><span>${trx.username}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted)">Plan</span><span>${trx.plan} x${trx.quantity}</span></div>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Masukan key untuk dikirim ke user (1 key per baris, maks ${trx.quantity} key):</p>
        <textarea id="keys-input" class="admin-input" style="width:100%;min-height:100px;" placeholder="KEY-XXXX-XXXX\nKEY-YYYY-YYYY"></textarea>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Approve & Kirim',
    cancelButtonText: 'Batal',
    preConfirm: () => {
      const val = document.getElementById('keys-input')?.value?.trim();
      if (!val) { Swal.showValidationMessage('Key tidak boleh kosong!'); return false; }
      return val.split('\n').map(k => k.trim()).filter(k => k);
    }
  });

  if (!keys) return;

  try {
    const db2 = await dbRead();
    const trxIdx = (db2.transactions || []).findIndex(t => t.id === trxId);
    if (trxIdx !== -1) {
      db2.transactions[trxIdx].status = 'approved';
      db2.transactions[trxIdx].keys = keys;
      db2.transactions[trxIdx].updatedAt = new Date().toISOString();
      await dbWrite(db2);
      showNotify('success', 'Approved!', 'Transaksi diapprove dan key dikirim ke user.');
      loadAdminLogs(db2.transactions);
      loadAdminStats(db2);
    }
  } catch (err) {
    showNotify('error', 'Error', 'Gagal approve transaksi.');
  }
}

async function rejectTransaction(trxId) {
  const confirmed = await Swal.fire({ title: 'Reject Transaksi?', text: 'Saldo user akan dikembalikan.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Reject', cancelButtonText: 'Batal' });
  if (!confirmed.isConfirmed) return;

  try {
    const db = await dbRead();
    const trxIdx = (db.transactions || []).findIndex(t => t.id === trxId);
    if (trxIdx === -1) return;

    const trx = db.transactions[trxIdx];
    // Refund
    const userIdx = (db.users || []).findIndex(u => u.username === trx.username);
    if (userIdx !== -1) {
      db.users[userIdx].credits = (db.users[userIdx].credits || 0) + (trx.totalPrice || 0);
    }

    db.transactions[trxIdx].status = 'rejected';
    db.transactions[trxIdx].updatedAt = new Date().toISOString();
    await dbWrite(db);

    showNotify('success', 'Rejected!', 'Transaksi ditolak dan saldo dikembalikan ke user.');
    loadAdminLogs(db.transactions);
    loadAdminStats(db);
    loadAdminUsers(db.users);
  } catch (err) {
    showNotify('error', 'Error', 'Gagal reject transaksi.');
  }
}

/* ---- ADMIN USERS ---- */
function loadAdminUsers(users) {
  const container = document.getElementById('admin-users-container');
  if (!container) return;

  if (!users || users.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted)">Belum ada user.</p>';
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Username</th><th>Saldo</th><th>Dibuat</th><th>Aksi</th>
      </tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.username}</td>
            <td style="color:var(--accent-gold);font-weight:700">$${(u.credits || 0).toFixed(2)}</td>
            <td>${formatDate(u.createdAt)}</td>
            <td>
              <button class="btn-admin btn-danger btn-sm" onclick="deleteUser('${u.username}')"><i class="fas fa-trash"></i></button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function deleteUser(username) {
  if (username === 'admin') {
    showNotify('error', 'Error', 'Tidak bisa menghapus akun admin!');
    return;
  }

  const confirmed = await Swal.fire({ title: `Hapus User "${username}"?`, text: 'User akan dihapus permanen!', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal' });
  if (!confirmed.isConfirmed) return;

  try {
    const db = await dbRead();
    db.users = (db.users || []).filter(u => u.username !== username);
    await dbWrite(db);
    showNotify('success', 'Berhasil!', `User "${username}" dihapus.`);
    loadAdminUsers(db.users);
    loadAdminStats(db);
  } catch (err) {
    showNotify('error', 'Error', 'Gagal menghapus user.');
  }
}

function loadAdminSettings(settings) {
  const resetToggle = document.getElementById('reset-key-toggle');
  const rtToggle = document.getElementById('running-text-toggle');
  const rtInput = document.getElementById('running-text-input');

  if (resetToggle) resetToggle.checked = settings.resetKeyEnabled !== false;
  if (rtToggle) rtToggle.checked = settings.runningTextEnabled === true;
  if (rtInput) rtInput.value = settings.runningText || '';
}

async function initDB() {
  const confirmed = await Swal.fire({
    title: 'Inisialisasi Database?',
    html: '<p>Ini akan membuat struktur database awal di JSONBin.io.<br><strong>Lakukan hanya sekali!</strong></p>',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Inisialisasi',
    cancelButtonText: 'Batal'
  });

  if (!confirmed.isConfirmed) return;

  try {
    await dbWrite(INITIAL_DB);
    showNotify('success', 'Berhasil!', 'Database berhasil diinisialisasi! Default user: admin/admin123');
  } catch (err) {
    showNotify('error', 'Error', 'Gagal inisialisasi database. Cek API key dan Bin ID di CONFIG.');
  }
}

/* ============================================
   UTILITY FUNCTIONS
============================================ */
function setupPasswordToggle(inputId, btnId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.innerHTML = isText ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
  });
}

function showNotify(type, title, text) {
  const icons = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
  Swal.fire({
    icon: icons[type] || 'info',
    title: `<span style="font-family:Orbitron">${title}</span>`,
    text,
    timer: type === 'success' ? 2500 : undefined,
    timerProgressBar: type === 'success'
  });
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/* ============================================
   ANIMATED BACKGROUND (PARTICLES)
============================================ */
function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const count = 60;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? '153,51,255' : '204,85,255'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });

    // Draw connections
    particles.forEach((p, i) => {
      particles.slice(i + 1).forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(153,51,255,${0.15 * (1 - d / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });

    requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

/* ============================================
   PAGE AUTO INIT
============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();

  const page = document.body.dataset.page;

  if (page === 'login') initLoginPage();
  else if (page === 'register') initRegisterPage();
  else if (page === 'home') initHomePage();
  else if (page === 'admin') initAdminPage();
});