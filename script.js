/* =============================================
   DRIP CLIENT - SCRIPT.JS
   Full Feature Implementation
   ============================================= */

// ===== JSONBIN CONFIG =====
const JSONBIN_BASE = 'https://api.jsonbin.io/v3';
const JSONBIN_KEY = '$2a$10$jln1n/3LPfIJMQk4n2macecu35wOt9aY1F5RO73j1zI.MAfA02PNO';
const MASTER_KEY = '$2a$10$Y.jqtzCgEfTCuODvJNV08ex.6qQW0V5p2WF6UUqlhg.fYT4W.4Gu6';

// Bin IDs - akan di-auto create jika belum ada
const BINS = {
  users:    null,
  products: null,
  orders:   null,
  promos:   null,
  settings: null,
  stats:    null
};

// BIN storage in localStorage untuk persistent
function getBinId(name) {
  return localStorage.getItem('dc_bin_' + name);
}

function setBinId(name, id) {
  localStorage.setItem('dc_bin_' + name, id);
}

// ===== JSONBIN CRUD =====
async function jbGet(binName) {
  const id = getBinId(binName);
  if (!id) return null;
  try {
    const r = await fetch(`${JSONBIN_BASE}/b/${id}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY, 'X-Bin-Meta': false }
    });
    if (!r.ok) return null;
    return await r.json();
  } catch(e) { console.error('jbGet error', e); return null; }
}

async function jbCreate(binName, data) {
  try {
    const r = await fetch(`${JSONBIN_BASE}/b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY,
        'X-Bin-Name': 'dripclient_' + binName,
        'X-Bin-Private': 'false'
      },
      body: JSON.stringify(data)
    });
    const res = await r.json();
    if (res.metadata && res.metadata.id) {
      setBinId(binName, res.metadata.id);
      return res.record;
    }
    return null;
  } catch(e) { console.error('jbCreate error', e); return null; }
}

async function jbUpdate(binName, data) {
  let id = getBinId(binName);
  if (!id) {
    // Create new bin
    return await jbCreate(binName, data);
  }
  try {
    const r = await fetch(`${JSONBIN_BASE}/b/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify(data)
    });
    if (!r.ok) return null;
    const res = await r.json();
    return res.record;
  } catch(e) { console.error('jbUpdate error', e); return null; }
}

// ===== INIT DATA =====
async function getOrInitData(binName, defaultData) {
  let data = await jbGet(binName);
  if (!data) {
    data = await jbCreate(binName, defaultData);
    if (!data) {
      // Fallback to localStorage if JSONBIN not configured
      const local = localStorage.getItem('dc_data_' + binName);
      if (local) return JSON.parse(local);
      return defaultData;
    }
  }
  return data;
}

async function saveData(binName, data) {
  localStorage.setItem('dc_data_' + binName, JSON.stringify(data));
  const res = await jbUpdate(binName, data);
  if (!res) {
    // fallback ok, localStorage used
  }
  return data;
}

async function loadData(binName, defaultData) {
  // Try jsonbin first, fallback to localStorage
  let data = await jbGet(binName);
  if (data) {
    localStorage.setItem('dc_data_' + binName, JSON.stringify(data));
    return data;
  }
  const local = localStorage.getItem('dc_data_' + binName);
  if (local) return JSON.parse(local);
  return defaultData;
}

// ===== SECURITY HELPERS =====
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

function validateUsername(u) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(u);
}

function validatePassword(p) {
  return p && p.length >= 6;
}

function hashSimple(str) {
  // Simple obfuscation (for demo - in prod use bcrypt server-side)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'dh_' + Math.abs(hash).toString(36) + str.length;
}

// ===== SESSION =====
function getSession() {
  try {
    const s = sessionStorage.getItem('dc_session') || localStorage.getItem('dc_session');
    if (!s) return null;
    return JSON.parse(s);
  } catch(e) { return null; }
}

function setSession(userData, remember) {
  const s = JSON.stringify(userData);
  sessionStorage.setItem('dc_session', s);
  if (remember) localStorage.setItem('dc_session', s);
}

function clearSession() {
  sessionStorage.removeItem('dc_session');
  localStorage.removeItem('dc_session');
}

// ===== PARTICLES BG =====
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W = window.innerWidth, H = window.innerHeight;

  canvas.width = W; canvas.height = H;

  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
  });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 2 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.6 + 0.1;
      this.color = `hsla(${260 + Math.random()*40}, 80%, ${50 + Math.random()*30}%, ${this.alpha})`;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  // Draw connections
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108,43,217,${0.15 * (1 - dist/100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }
  animate();
}

// ===== LOADING SCREEN =====
function startLoadingScreen(revealId, isDashboard = false, isAdmin = false) {
  const chars = 'DRIPCLIENT'.split('');
  const container = document.getElementById('loading-chars');
  if (container) {
    chars.forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.animationDelay = (i * 0.1 + 0.3) + 's';
      container.appendChild(span);
    });
  }

  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.classList.add('loading-screen-out');
      setTimeout(() => {
        ls.style.display = 'none';
        if (isDashboard) {
          initDashboard(revealId);
        } else if (isAdmin) {
          initAdmin(revealId);
        } else {
          const el = document.getElementById(revealId);
          if (el) el.style.display = '';
        }
      }, 700);
    }
  }, 3000);
}

// ===== TOGGLE PASSWORD =====
function togglePass(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
  } else {
    input.type = 'password';
    if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
  }
}

// ===== SWEETALERT-LIKE NOTIFICATIONS =====
function notify(type, title, msg, duration = 3500) {
  const existing = document.querySelector('.dc-toast');
  if (existing) existing.remove();

  const colors = {
    success: { bg: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.4)', icon: 'fas fa-check-circle', color: '#00e676' },
    error:   { bg: 'rgba(255,45,120,0.1)', border: 'rgba(255,45,120,0.4)', icon: 'fas fa-times-circle', color: '#ff2d78' },
    info:    { bg: 'rgba(108,43,217,0.15)', border: 'rgba(108,43,217,0.4)', icon: 'fas fa-info-circle', color: '#9b59f7' },
    warning: { bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.4)', icon: 'fas fa-exclamation-triangle', color: '#ffd700' }
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.className = 'dc-toast';
  toast.style.cssText = `
    position:fixed; top:80px; right:20px; z-index:99999;
    background:${c.bg}; border:1px solid ${c.border}; border-radius:12px;
    padding:14px 18px; display:flex; align-items:flex-start; gap:12px;
    max-width:340px; min-width:260px;
    box-shadow:0 8px 32px rgba(0,0,0,0.6);
    backdrop-filter:blur(20px);
    animation:toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    font-family:'Rajdhani',sans-serif;
  `;

  toast.innerHTML = `
    <i class="${c.icon}" style="color:${c.color};font-size:20px;flex-shrink:0;margin-top:2px;"></i>
    <div>
      <div style="font-weight:700;font-size:14px;color:#f0eaff;margin-bottom:3px;">${title}</div>
      <div style="font-size:12px;color:#a89bc2;line-height:1.4;">${msg}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#5c4d7a;cursor:pointer;font-size:16px;margin-left:auto;flex-shrink:0;padding:0;">×</button>
  `;

  const style = document.createElement('style');
  style.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}} @keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(60px)}}`;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== MODAL HELPERS =====
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'flex'; requestAnimationFrame(() => el.classList.add('active')); }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('active');
    setTimeout(() => { el.style.display = 'none'; }, 300);
  }
}

// ===== LOGIN =====
async function doLogin() {
  const usernameRaw = document.getElementById('login-username').value;
  const passwordRaw = document.getElementById('login-password').value;
  const remember = document.getElementById('remember-me') && document.getElementById('remember-me').checked;
  const msg = document.getElementById('login-msg');

  const username = sanitizeInput(usernameRaw);
  const password = sanitizeInput(passwordRaw);

  if (!username || !password) {
    msg.style.color = 'var(--accent-pink)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Username dan password wajib diisi!';
    return;
  }

  if (!validateUsername(username)) {
    msg.style.color = 'var(--accent-pink)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Username tidak valid (3-20 karakter, huruf/angka/_)';
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>MEMPROSES...';
  msg.style.color = 'var(--text-secondary)';
  msg.innerHTML = '<i class="fas fa-database" style="margin-right:6px;"></i>Memvalidasi ke database...';

  try {
    const users = await loadData('users', { list: [] });
    const userList = users.list || [];

    const found = userList.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!found) {
      msg.style.color = 'var(--accent-pink)';
      msg.innerHTML = '<i class="fas fa-times-circle" style="margin-right:6px;"></i>Username tidak ditemukan!';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>LOGIN';
      return;
    }

    const hashedInput = hashSimple(password);
    if (found.password !== hashedInput) {
      msg.style.color = 'var(--accent-pink)';
      msg.innerHTML = '<i class="fas fa-times-circle" style="margin-right:6px;"></i>Password salah!';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>LOGIN';
      return;
    }

    msg.style.color = 'var(--accent-green)';
    msg.innerHTML = '<i class="fas fa-check-circle" style="margin-right:6px;"></i>Login berhasil! Mengarahkan...';

    setSession({ username: found.username, credit: found.credit || 0, role: found.role || 'user' }, remember);

    // Welcome animation
    document.getElementById('auth-area').style.display = 'none';
    const ws = document.getElementById('welcome-screen');
    ws.style.display = 'flex';
    document.getElementById('welcome-msg').textContent = `Welcome, ${found.username}! 👋`;

    setTimeout(() => {
      ws.style.animation = 'screenOut 0.7s ease forwards';
      setTimeout(() => { window.location.href = 'home.html'; }, 700);
    }, 2500);

  } catch(e) {
    msg.style.color = 'var(--accent-pink)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Gagal terhubung ke database. Coba lagi!';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>LOGIN';
  }
}

// ===== REGISTER =====
async function doRegister() {
  const usernameRaw = document.getElementById('reg-username').value;
  const passwordRaw = document.getElementById('reg-password').value;
  const password2Raw = document.getElementById('reg-password2').value;
  const msg = document.getElementById('reg-msg');

  const username = sanitizeInput(usernameRaw);
  const password = sanitizeInput(passwordRaw);
  const password2 = sanitizeInput(password2Raw);

  if (!username || !password) {
    msg.style.color = 'var(--accent-pink)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Semua field wajib diisi!';
    return;
  }

  if (!validateUsername(username)) {
    msg.style.color = 'var(--accent-pink)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Username tidak valid (3-20 karakter, huruf/angka/_)';
    return;
  }

  if (!validatePassword(password)) {
    msg.style.color = 'var(--accent-pink)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Password minimal 6 karakter!';
    return;
  }

  if (password !== password2) {
    msg.style.color = 'var(--accent-pink)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Password dan konfirmasi tidak cocok!';
    return;
  }

  const btn = document.getElementById('reg-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>MENDAFTAR...';
  msg.style.color = 'var(--text-secondary)';
  msg.innerHTML = '<i class="fas fa-database" style="margin-right:6px;"></i>Menyimpan akun ke database...';

  try {
    const users = await loadData('users', { list: [] });
    const userList = users.list || [];

    const exists = userList.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      msg.style.color = 'var(--accent-pink)';
      msg.innerHTML = '<i class="fas fa-times-circle" style="margin-right:6px;"></i>Username sudah digunakan!';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:8px;"></i>DAFTAR SEKARANG';
      return;
    }

    const newUser = {
      id: 'u_' + Date.now(),
      username: username,
      email: sanitizeInput(document.getElementById('reg-email').value || ''),
      password: hashSimple(password),
      credit: 0,
      role: 'user',
      createdAt: new Date().toISOString(),
      usedPromos: []
    };

    userList.push(newUser);
    await saveData('users', { list: userList });

    msg.style.color = 'var(--accent-green)';
    msg.innerHTML = '<i class="fas fa-check-circle" style="margin-right:6px;"></i>Akun berhasil dibuat! Silahkan login...';
    notify('success', 'Registrasi Berhasil!', `Akun @${username} telah dibuat. Silahkan login.`);

    setTimeout(() => { window.location.href = 'index.html'; }, 2000);

  } catch(e) {
    msg.style.color = 'var(--accent-pink)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Gagal menyimpan. Coba lagi!';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:8px;"></i>DAFTAR SEKARANG';
  }
}

// ===== LOGOUT =====
function doLogout() {
  if (confirm('Yakin ingin logout?')) {
    clearSession();
    window.location.href = 'index.html';
  }
}

// ===== DASHBOARD INIT =====
async function initDashboard(contentId) {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  const content = document.getElementById(contentId);
  if (content) content.style.display = '';

  // Check maintenance
  const settings = await loadData('settings', getDefaultSettings());
  if (settings.maintenance) {
    const mp = document.getElementById('maintenance-popup');
    if (mp) {
      mp.style.display = 'flex';
      document.getElementById('maintenance-reason').textContent = settings.maintenanceReason || 'Website sedang dalam pemeliharaan.';
    }
    return;
  }

  // Update topbar
  document.getElementById('topbar-username').textContent = session.username;

  // Update credit from DB
  const users = await loadData('users', { list: [] });
  const userObj = (users.list || []).find(u => u.username === session.username);
  const credit = userObj ? (userObj.credit || 0) : 0;
  document.getElementById('topbar-credit').textContent = 'Rp ' + credit.toLocaleString('id-ID');

  // Update session credit
  session.credit = credit;
  setSession(session, !!localStorage.getItem('dc_session'));

  // Running text
  if (settings.runningText && settings.runningTextVal) {
    const rtw = document.getElementById('running-text-wrap');
    if (rtw) rtw.style.display = '';
    ['running-text-content','running-text-content2','running-text-content3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = settings.runningTextVal;
    });
  }

  // Welcome popup
  if (settings.waPopup) {
    document.getElementById('welcome-popup-name').textContent = `Welcome, ${session.username}! 👋`;
    openModal('welcome-popup');
  }

  // Notif 2
  if (settings.notif2 && settings.notif2Title) {
    setTimeout(() => {
      document.getElementById('notif2-icon').className = settings.notif2Icon || 'fas fa-bell';
      document.getElementById('notif2-title').textContent = settings.notif2Title;
      document.getElementById('notif2-text').textContent = settings.notif2Text;
      openModal('notif2-popup');
    }, 500);
  }

  // Load products
  await renderProducts();

  // Load FAQ
  renderFAQ();

  // Load user logs
  await renderUserLogs(session.username);

  showSection('home-sec');
}

// ===== SHOW SECTION =====
function showSection(id) {
  ['home-sec','logs-sec','faq-sec'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? '' : 'none';
  });
}

// ===== SIDE NAV =====
function toggleSideNav() {
  const nav = document.getElementById('side-nav');
  const overlay = document.getElementById('side-overlay');
  if (nav) nav.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeSideNav() {
  const nav = document.getElementById('side-nav');
  const overlay = document.getElementById('side-overlay');
  if (nav) nav.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// ===== RENDER PRODUCTS =====
async function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const products = await loadData('products', { list: [] });
  const list = products.list || [];

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Belum ada produk tersedia.</p></div>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => `
    <div class="product-card fade-in" style="animation-delay:${i*0.1}s" onclick="openProductPopup('${p.id}')">
      <div class="product-img-wrap">
        <img src="${p.image || 'https://via.placeholder.com/400x200/1a0a3d/9b59f7?text=DRIP'}" class="product-img" alt="${p.name}" onerror="this.src='https://via.placeholder.com/400x200/1a0a3d/9b59f7?text=DRIP'"/>
        <div class="product-img-overlay"></div>
        <div class="product-badge">NEW</div>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc || ''}</div>
        <ul class="product-features">
          ${(p.features || []).map(f => `<li><i class="fas fa-check"></i>${f}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');
}

// ===== PRODUCT POPUP =====
let currentProduct = null;
let selectedPrice = null;
let currentQty = 1;
let priceTab = 'full';
let appliedPromo = null;

async function openProductPopup(productId) {
  const products = await loadData('products', { list: [] });
  const p = (products.list || []).find(pr => pr.id === productId);
  if (!p) return;

  currentProduct = p;
  selectedPrice = null;
  currentQty = 1;
  appliedPromo = null;
  priceTab = 'full';

  document.getElementById('pp-img').src = p.image || '';
  document.getElementById('pp-name').textContent = p.name;
  document.getElementById('pp-desc').textContent = p.desc || '';
  document.getElementById('qty-display').textContent = '1';
  document.getElementById('pp-total').textContent = 'Rp 0';
  document.getElementById('promo-result').textContent = '';
  document.getElementById('promo-input').value = '';
  document.getElementById('wa-input').value = '';

  // Setup tabs
  const tabFull = document.getElementById('tab-full');
  const tabRental = document.getElementById('tab-rental');
  if (p.hasRental) {
    tabRental.style.display = '';
  } else {
    tabRental.style.display = 'none';
  }

  switchPriceTab('full');
  openModal('product-popup');
}

function switchPriceTab(tab) {
  priceTab = tab;
  selectedPrice = null;
  currentQty = 1;
  document.getElementById('qty-display').textContent = '1';

  const tabFull = document.getElementById('tab-full');
  const tabRental = document.getElementById('tab-rental');
  if (tabFull) {
    tabFull.classList.toggle('active', tab === 'full');
    if (tabRental) tabRental.classList.toggle('active', tab === 'rental');
  }

  const container = document.getElementById('pp-price-options');
  if (!currentProduct) return;

  const prices = tab === 'full' ? (currentProduct.fullPrices || []) : (currentProduct.rentalPrices || []);
  const validPrices = prices.filter(p => p.label && p.price);

  if (validPrices.length === 0) {
    container.innerHTML = '<div class="notice"><i class="fas fa-info-circle"></i>Belum ada pilihan harga.</div>';
    return;
  }

  container.innerHTML = validPrices.map((p, i) => `
    <label class="price-option" onclick="selectPrice(${i}, '${p.label}', ${p.price})">
      <input type="radio" name="price-opt" value="${i}"/>
      <span class="price-label">${p.label}</span>
      <span class="price-amount">Rp ${Number(p.price).toLocaleString('id-ID')}</span>
    </label>
  `).join('');

  updateTotal();
}

function selectPrice(idx, label, price) {
  selectedPrice = { idx, label, price: Number(price) };
  document.querySelectorAll('.price-option').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
  updateTotal();
}

function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById('qty-display').textContent = currentQty;
  updateTotal();
}

function updateTotal() {
  if (!selectedPrice) {
    document.getElementById('pp-total').textContent = 'Rp 0';
    return;
  }
  let total = selectedPrice.price * currentQty;
  if (appliedPromo) {
    total = Math.round(total * (1 - appliedPromo.pct / 100));
  }
  document.getElementById('pp-total').textContent = 'Rp ' + total.toLocaleString('id-ID');
}

async function applyPromo() {
  const code = sanitizeInput(document.getElementById('promo-input').value.toUpperCase());
  const resultEl = document.getElementById('promo-result');

  if (!code) { resultEl.innerHTML = '<span style="color:var(--accent-pink)">Masukan kode promo!</span>'; return; }

  const session = getSession();
  const users = await loadData('users', { list: [] });
  const userObj = (users.list || []).find(u => u.username === session.username);
  const usedPromos = userObj ? (userObj.usedPromos || []) : [];

  if (usedPromos.includes(code)) {
    resultEl.innerHTML = '<span style="color:var(--accent-pink)"><i class="fas fa-times-circle" style="margin-right:4px;"></i>Kamu sudah pernah memakai promo ini!</span>';
    return;
  }

  const promos = await loadData('promos', { list: [] });
  const promo = (promos.list || []).find(p => p.code === code);

  if (!promo) {
    resultEl.innerHTML = '<span style="color:var(--accent-pink)"><i class="fas fa-times-circle" style="margin-right:4px;"></i>Kode promo tidak valid!</span>';
    return;
  }

  if (promo.used >= promo.maxUse) {
    resultEl.innerHTML = `<span style="color:var(--accent-pink)"><i class="fas fa-times-circle" style="margin-right:4px;"></i>Promo sudah mencapai batas pemakaian (${promo.maxUse} orang)!</span>`;
    return;
  }

  appliedPromo = { code, pct: promo.pct };
  resultEl.innerHTML = `<span class="promo-discount"><i class="fas fa-tag" style="margin-right:4px;"></i>Promo ${code} aktif! Diskon ${promo.pct}%</span>`;
  updateTotal();
  notify('success', 'Promo Berhasil!', `Diskon ${promo.pct}% diterapkan.`);
}

async function doBuyNow() {
  const session = getSession();
  if (!session) { window.location.href = 'index.html'; return; }
  if (!currentProduct) return;
  if (!selectedPrice) { notify('warning', 'Pilih Paket!', 'Silahkan pilih paket harga terlebih dahulu.'); return; }

  const waNum = sanitizeInput(document.getElementById('wa-input').value);
  if (!waNum) { notify('warning', 'Nomor WA!', 'Masukan nomor WhatsApp kamu untuk konfirmasi.'); return; }

  let total = selectedPrice.price * currentQty;
  const users = await loadData('users', { list: [] });
  const userList = users.list || [];
  const userIdx = userList.findIndex(u => u.username === session.username);

  if (userIdx === -1) { notify('error', 'Error!', 'User tidak ditemukan.'); return; }

  const userCredit = userList[userIdx].credit || 0;

  if (appliedPromo) {
    total = Math.round(total * (1 - appliedPromo.pct / 100));
  }

  if (userCredit < total) {
    notify('error', 'Saldo Tidak Cukup!', `Saldo kamu Rp ${userCredit.toLocaleString('id-ID')} - Dibutuhkan Rp ${total.toLocaleString('id-ID')}`);
    return;
  }

  // Deduct credit
  userList[userIdx].credit -= total;

  // Mark promo used
  if (appliedPromo) {
    const promos = await loadData('promos', { list: [] });
    const promoList = promos.list || [];
    const pi = promoList.findIndex(p => p.code === appliedPromo.code);
    if (pi !== -1) promoList[pi].used = (promoList[pi].used || 0) + 1;
    await saveData('promos', { list: promoList });

    if (!userList[userIdx].usedPromos) userList[userIdx].usedPromos = [];
    userList[userIdx].usedPromos.push(appliedPromo.code);
  }

  await saveData('users', { list: userList });

  // Create order
  const orders = await loadData('orders', { list: [] });
  const orderList = orders.list || [];
  const trxId = 'TRX' + Date.now();

  const newOrder = {
    id: trxId,
    username: session.username,
    productId: currentProduct.id,
    productName: currentProduct.name,
    plan: selectedPrice.label,
    planType: priceTab === 'full' ? 'Access Full Key' : 'Rental Key',
    qty: currentQty,
    total: total,
    waNumber: waNum,
    promo: appliedPromo ? appliedPromo.code : null,
    promoDiscount: appliedPromo ? appliedPromo.pct : 0,
    status: 'waiting',
    keys: [],
    createdAt: new Date().toISOString()
  };

  orderList.push(newOrder);
  await saveData('orders', { list: orderList });

  // Update stats
  const stats = await loadData('stats', getDefaultStats());
  stats.totalRevenue = (stats.totalRevenue || 0) + total;
  const today = new Date().toDateString();
  if (stats.todayDate !== today) { stats.todayDate = today; stats.todaySold = 0; }
  stats.todaySold = (stats.todaySold || 0) + 1;
  await saveData('stats', stats);

  // Update topbar
  document.getElementById('topbar-credit').textContent = 'Rp ' + userList[userIdx].credit.toLocaleString('id-ID');
  session.credit = userList[userIdx].credit;
  setSession(session, !!localStorage.getItem('dc_session'));

  closeModal('product-popup');
  notify('success', 'Pembelian Berhasil!', `Transaksi ${trxId} sedang diproses admin.`);
  setTimeout(() => { showSection('logs-sec'); closeSideNav(); renderUserLogs(session.username); }, 1000);
}

// ===== RENDER USER LOGS =====
async function renderUserLogs(username) {
  const grid = document.getElementById('user-logs-grid');
  if (!grid) return;

  const orders = await loadData('orders', { list: [] });
  const userOrders = (orders.list || []).filter(o => o.username === username).reverse();

  if (userOrders.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>Belum ada transaksi.</p></div>`;
    return;
  }

  grid.innerHTML = userOrders.map(o => `
    <div class="log-card fade-in" onclick="openLogDetail('${o.id}')">
      <div class="log-header">
        <div class="log-product"><i class="fas fa-box" style="margin-right:6px;color:var(--purple-light);"></i>${o.productName}</div>
        <span class="status-badge status-${o.status}">${o.status === 'approved' ? '✓ Approved' : o.status === 'rejected' ? '✗ Rejected' : '⏳ Waiting'}</span>
      </div>
      <div class="log-meta">
        <span class="log-meta-item"><i class="fas fa-receipt" style="margin-right:4px;"></i>${o.id}</span>
        <span class="log-meta-item"><i class="fas fa-calendar" style="margin-right:4px;"></i>${new Date(o.createdAt).toLocaleDateString('id-ID')}</span>
        <span class="log-meta-item" style="color:var(--accent-gold);font-weight:700;">Rp ${o.total.toLocaleString('id-ID')}</span>
      </div>
    </div>
  `).join('');
}

async function openLogDetail(orderId) {
  const orders = await loadData('orders', { list: [] });
  const o = (orders.list || []).find(ord => ord.id === orderId);
  if (!o) return;

  const keysHTML = o.keys && o.keys.length > 0
    ? `<div style="margin-top:8px;"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;letter-spacing:1px;">KEYS DIKIRIM:</div>${o.keys.filter(k=>k).map(k=>`<div class="terminal-display" style="min-height:auto;padding:10px;font-size:13px;margin-bottom:6px;">${k}</div>`).join('')}</div>`
    : '';

  document.getElementById('log-detail-content').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-muted);">Produk</span>
        <span style="font-size:14px;font-weight:700;color:var(--text-primary);">${o.productName}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-muted);">Paket</span>
        <span style="font-size:14px;color:var(--text-secondary);">${o.plan} (${o.planType})</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-muted);">Tanggal</span>
        <span style="font-size:13px;color:var(--text-secondary);">${new Date(o.createdAt).toLocaleString('id-ID')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-muted);">ID Transaksi</span>
        <span style="font-size:12px;font-family:var(--font-mono);color:var(--purple-light);">${o.id}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-muted);">Quantity</span>
        <span style="font-size:14px;color:var(--text-secondary);">x${o.qty}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-muted);">Total Bayar</span>
        <span style="font-size:18px;font-weight:700;font-family:var(--font-display);color:var(--accent-gold);">Rp ${o.total.toLocaleString('id-ID')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-muted);">Status</span>
        <span class="status-badge status-${o.status}">${o.status === 'approved' ? '✓ Approved' : o.status === 'rejected' ? '✗ Rejected' : '⏳ Menunggu Proses'}</span>
      </div>
      ${keysHTML}
    </div>
  `;
  openModal('log-detail-popup');
}

// ===== RESET KEY =====
async function doResetKey() {
  const key = sanitizeInput(document.getElementById('reset-key-input').value);
  const terminal = document.getElementById('reset-terminal');
  terminal.style.display = 'block';
  terminal.innerHTML = '';

  if (!key) {
    addTerminalLine(terminal, '❌ Error: Key tidak boleh kosong', 'terminal-error');
    return;
  }

  const settings = await loadData('settings', getDefaultSettings());
  if (!settings.resetKeyEnabled) {
    addTerminalLine(terminal, '⚠ Connecting to server...', 'terminal-warn');
    await sleep(600);
    addTerminalLine(terminal, '❌ Error 503: Service Unavailable', 'terminal-error');
    await sleep(400);
    addTerminalLine(terminal, '📌 Maaf, fitur ini sedang dinonaktifkan oleh admin atau sedang tidak beroperasi normal. Silahkan coba lagi nanti.', 'terminal-error');
    return;
  }

  // Check max reset
  const resets = JSON.parse(localStorage.getItem('dc_resets_' + key) || '{"count":0,"date":""}');
  const today = new Date().toDateString();
  if (resets.date !== today) { resets.count = 0; resets.date = today; }

  addTerminalLine(terminal, '⟶ Connecting to Drip Server...', 'terminal-info');
  await sleep(700);
  addTerminalLine(terminal, '⟶ Authenticating request...', 'terminal-info');
  await sleep(600);
  addTerminalLine(terminal, `⟶ Fetching device data for key: ${key}`, 'terminal-info');
  await sleep(800);
  addTerminalLine(terminal, '⟶ Validating reset quota...', 'terminal-warn');
  await sleep(500);

  if (resets.count >= 1) {
    addTerminalLine(terminal, '❌ Reset Failed: Daily limit reached (1x/day)', 'terminal-error');
    await sleep(300);
    const nextReset = new Date(); nextReset.setDate(nextReset.getDate() + 1); nextReset.setHours(0,0,0,0);
    addTerminalLine(terminal, `📌 Status: 429 - {"success":false,"message":"Daily reset limit reached","resetsused":1,"resetsmax":1,"nextresettime":"${nextReset.toISOString().slice(0,19).replace('T',' ')}"}`, 'terminal-error');
    return;
  }

  await sleep(600);
  addTerminalLine(terminal, '⟶ Sending reset command...', 'terminal-info');
  await sleep(700);
  addTerminalLine(terminal, '⟶ Wiping device binding...', 'terminal-warn');
  await sleep(500);
  addTerminalLine(terminal, '⟶ Clearing hardware fingerprint...', 'terminal-warn');
  await sleep(400);
  addTerminalLine(terminal, '⟶ Flushing session tokens...', 'terminal-warn');
  await sleep(500);
  addTerminalLine(terminal, '─────────────────────────────────', 'terminal-info');
  addTerminalLine(terminal, '✅ Reset Successful', 'terminal-success');
  await sleep(200);

  resets.count++;
  localStorage.setItem('dc_resets_' + key, JSON.stringify(resets));

  const now = new Date(); now.setDate(now.getDate() + 1); now.setHours(0,0,0,0);
  addTerminalLine(terminal, `Status: 200`, 'terminal-success');
  addTerminalLine(terminal, `Response: {"success":true,"message":"Token reset successfully","resetsused":${resets.count},"resetsmax":1,"nextresettime":"${now.toISOString().slice(0,19).replace('T',' ')}"}`, 'terminal-success');
}

function addTerminalLine(terminal, text, cls) {
  const line = document.createElement('div');
  line.className = 'terminal-line ' + cls;
  line.textContent = text;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== FAQ =====
const FAQ_DATA = [
  { q: 'Bagaimana cara membeli key?', a: 'Pilih produk yang tersedia di dashboard, klik card produk, pilih paket yang diinginkan, lalu klik tombol Buy Now. Pastikan saldo kamu mencukupi.' },
  { q: 'Berapa lama proses setelah pembelian?', a: 'Setelah pembelian diverifikasi admin, key akan dikirimkan ke akun kamu dalam waktu 5-30 menit. Cek tab "Logs Transaksi" untuk statusnya.' },
  { q: 'Bagaimana cara top-up saldo?', a: 'Hubungi admin melalui WhatsApp atau saluran resmi kami untuk melakukan top-up saldo.' },
  { q: 'Apakah key bisa digunakan di beberapa perangkat?', a: 'Key hanya bisa digunakan di 1 perangkat. Jika ingin ganti perangkat, gunakan fitur Reset Key (maks 1x per hari).' },
  { q: 'Apa itu Rental Key vs Access Full Key?', a: 'Access Full Key: akses berdasarkan durasi (1 hari, 7 hari, dll). Rental Key: akses berdasarkan jam pemakaian. Pilih sesuai kebutuhan.' },
  { q: 'Bagaimana jika ada error atau masalah?', a: 'Silahkan join saluran WhatsApp kami atau hubungi admin langsung. Tim kami siap membantu 24/7.' },
  { q: 'Apakah aman menggunakan Drip Client?', a: 'Drip Client menggunakan sistem enkripsi dan perlindungan berlapis untuk menjaga keamanan akun dan data kamu.' }
];

function renderFAQ() {
  const container = document.getElementById('faq-container');
  if (!container) return;
  container.innerHTML = FAQ_DATA.map((item, i) => `
    <div class="faq-item fade-in" style="animation-delay:${i*0.08}s" id="faq-${i}">
      <div class="faq-question" onclick="toggleFAQ(${i})">
        <span>${item.q}</span>
        <div class="faq-icon"><i class="fas fa-chevron-down"></i></div>
      </div>
      <div class="faq-answer" id="faq-ans-${i}">${item.a}</div>
    </div>
  `).join('');
}

function toggleFAQ(i) {
  const item = document.getElementById('faq-' + i);
  const ans = document.getElementById('faq-ans-' + i);
  const isOpen = item.classList.contains('active');
  // Close all
  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.faq-answer').forEach(el => el.classList.remove('open'));
  if (!isOpen) {
    item.classList.add('active');
    ans.classList.add('open');
  }
}

// ===== ADMIN INIT =====
async function initAdmin(contentId) {
  const content = document.getElementById(contentId);
  if (content) content.style.display = '';

  await loadAdminOverview();
  await renderAdminProducts();
  await renderAdminLogs();
  await renderAdminPromos();
  await renderAdminUsers();
  await loadAdminSettings();
}

// ===== ADMIN TAB SWITCHING =====
function switchAdminTab(tab) {
  const tabs = ['overview', 'products', 'logs', 'promo', 'users', 'settings'];
  tabs.forEach(t => {
    const sec = document.getElementById('section-' + t);
    if (sec) sec.classList.toggle('active', t === tab);
  });
  document.querySelectorAll('.admin-tab').forEach((btn, i) => {
    btn.classList.toggle('active', tabs[i] === tab);
  });
}

// ===== ADMIN OVERVIEW =====
async function loadAdminOverview() {
  const stats = await loadData('stats', getDefaultStats());
  const orders = await loadData('orders', { list: [] });
  const users = await loadData('users', { list: [] });

  const today = new Date().toDateString();
  if (stats.todayDate !== today) { stats.todaySold = 0; }

  const allOrders = orders.list || [];
  const approvedOrders = allOrders.filter(o => o.status === 'approved');
  const pendingOrders = allOrders.filter(o => o.status === 'waiting');

  const totalBuyers = new Set(approvedOrders.map(o => o.username)).size;
  const totalRev = approvedOrders.reduce((s, o) => s + (o.total || 0), 0);

  document.getElementById('stat-total-buyers').textContent = totalBuyers;
  document.getElementById('stat-revenue').textContent = 'Rp ' + totalRev.toLocaleString('id-ID');
  document.getElementById('stat-today').textContent = stats.todaySold || 0;
  document.getElementById('stat-pending').textContent = pendingOrders.length;
  document.getElementById('pending-badge').textContent = pendingOrders.length;

  // Recent logs
  const recent = [...allOrders].reverse().slice(0, 5);
  const container = document.getElementById('recent-logs-admin');
  if (container) {
    if (recent.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>Belum ada transaksi.</p></div>';
    } else {
      container.innerHTML = recent.map(o => `
        <div class="admin-log-item">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${o.productName} - ${o.plan}</div>
              <div style="font-size:12px;color:var(--text-muted);">@${o.username} | ${o.id} | ${new Date(o.createdAt).toLocaleString('id-ID')}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-family:var(--font-display);color:var(--accent-gold);font-size:14px;">Rp ${o.total.toLocaleString('id-ID')}</span>
              <span class="status-badge status-${o.status}">${o.status}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

// ===== ADD PRODUCT =====
function getPriceInputs(labelClass, priceClass) {
  const labels = Array.from(document.querySelectorAll('.' + labelClass));
  const prices = Array.from(document.querySelectorAll('.' + priceClass));
  const result = [];
  for (let i = 0; i < labels.length; i++) {
    if (labels[i].value && prices[i].value) {
      result.push({ label: sanitizeInput(labels[i].value), price: Number(prices[i].value) });
    }
  }
  return result;
}

async function addProduct() {
  const name = sanitizeInput(document.getElementById('new-prod-name').value);
  const img = sanitizeInput(document.getElementById('new-prod-img').value);
  const desc = sanitizeInput(document.getElementById('new-prod-desc').value);
  const featuresRaw = sanitizeInput(document.getElementById('new-prod-features').value);
  const hasRental = document.getElementById('new-rental-toggle').checked;

  if (!name) { notify('warning', 'Perhatian!', 'Nama produk wajib diisi!'); return; }

  const fullPrices = getPriceInputs('new-fp', 'new-fp-price');
  const rentalPrices = hasRental ? getPriceInputs('new-rp', 'new-rp-price') : [];
  const features = featuresRaw.split(',').map(f => f.trim()).filter(f => f);

  const products = await loadData('products', { list: [] });
  const list = products.list || [];
  const newProd = {
    id: 'p_' + Date.now(),
    name, img, desc, image: img,
    features, hasRental, fullPrices, rentalPrices,
    createdAt: new Date().toISOString()
  };

  list.push(newProd);
  await saveData('products', { list });
  notify('success', 'Produk Ditambahkan!', `Produk "${name}" berhasil ditambahkan.`);
  await renderAdminProducts();
  switchAdminTab('products');
}

async function renderAdminProducts() {
  const container = document.getElementById('admin-products-list');
  if (!container) return;

  const products = await loadData('products', { list: [] });
  const list = products.list || [];

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Belum ada produk.</p></div>';
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="admin-product-card">
      <img src="${p.image || p.img || 'https://via.placeholder.com/60x60/1a0a3d/9b59f7?text=P'}" class="admin-product-img" alt="${p.name}" onerror="this.src='https://via.placeholder.com/60x60/1a0a3d/9b59f7?text=P'"/>
      <div class="admin-product-info">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-meta">${p.fullPrices ? p.fullPrices.filter(x=>x.label).length : 0} harga | ${p.hasRental ? '✓ Rental' : '✗ No Rental'}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn-edit" onclick="openEditProduct('${p.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-danger" onclick="deleteProduct('${p.id}')" style="padding:7px 10px;"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

async function deleteProduct(id) {
  if (!confirm('Hapus produk ini?')) return;
  const products = await loadData('products', { list: [] });
  products.list = (products.list || []).filter(p => p.id !== id);
  await saveData('products', products);
  notify('success', 'Dihapus!', 'Produk berhasil dihapus.');
  await renderAdminProducts();
}

async function openEditProduct(id) {
  const products = await loadData('products', { list: [] });
  const p = (products.list || []).find(pr => pr.id === id);
  if (!p) return;

  document.getElementById('edit-prod-id').value = p.id;
  document.getElementById('edit-prod-name').value = p.name;
  document.getElementById('edit-prod-img').value = p.image || p.img || '';
  document.getElementById('edit-prod-desc').value = p.desc || '';
  document.getElementById('edit-prod-features').value = (p.features || []).join(', ');
  document.getElementById('edit-rental-toggle').checked = p.hasRental || false;
  document.getElementById('edit-rental-group').style.display = p.hasRental ? '' : 'none';

  // Fill full prices
  const fps = document.querySelectorAll('.edit-fp');
  const fpps = document.querySelectorAll('.edit-fp-price');
  (p.fullPrices || []).forEach((fp, i) => { if (fps[i]) fps[i].value = fp.label || ''; if (fpps[i]) fpps[i].value = fp.price || ''; });

  const rps = document.querySelectorAll('.edit-rp');
  const rpps = document.querySelectorAll('.edit-rp-price');
  (p.rentalPrices || []).forEach((rp, i) => { if (rps[i]) rps[i].value = rp.label || ''; if (rpps[i]) rpps[i].value = rp.price || ''; });

  openModal('edit-product-modal');
}

document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'edit-rental-toggle') {
    document.getElementById('edit-rental-group').style.display = e.target.checked ? '' : 'none';
  }
});

async function saveEditProduct() {
  const id = document.getElementById('edit-prod-id').value;
  const name = sanitizeInput(document.getElementById('edit-prod-name').value);
  const img = sanitizeInput(document.getElementById('edit-prod-img').value);
  const desc = sanitizeInput(document.getElementById('edit-prod-desc').value);
  const featuresRaw = sanitizeInput(document.getElementById('edit-prod-features').value);
  const hasRental = document.getElementById('edit-rental-toggle').checked;

  const fullPrices = getPriceInputs('edit-fp', 'edit-fp-price');
  const rentalPrices = hasRental ? getPriceInputs('edit-rp', 'edit-rp-price') : [];
  const features = featuresRaw.split(',').map(f => f.trim()).filter(f => f);

  const products = await loadData('products', { list: [] });
  const idx = (products.list || []).findIndex(p => p.id === id);
  if (idx === -1) return;

  products.list[idx] = { ...products.list[idx], name, image: img, img, desc, features, hasRental, fullPrices, rentalPrices };
  await saveData('products', products);
  closeModal('edit-product-modal');
  notify('success', 'Produk Diperbarui!', `Produk "${name}" berhasil diupdate.`);
  await renderAdminProducts();
}

// ===== ADMIN LOGS =====
let currentLogFilter = 'all';

async function renderAdminLogs(filter) {
  if (filter) currentLogFilter = filter;
  const container = document.getElementById('admin-logs-list');
  if (!container) return;

  const orders = await loadData('orders', { list: [] });
  let list = [...(orders.list || [])].reverse();

  if (currentLogFilter !== 'all') list = list.filter(o => o.status === currentLogFilter);

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>Tidak ada transaksi.</p></div>';
    return;
  }

  container.innerHTML = list.map(o => `
    <div class="admin-log-item">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
        <div>
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);">${o.productName}</div>
          <div style="font-size:12px;color:var(--text-muted);">@${o.username} • ${o.plan} (${o.planType}) • Qty: ${o.qty}</div>
          <div style="font-size:11px;color:var(--text-muted);">${o.id} • ${new Date(o.createdAt).toLocaleString('id-ID')}</div>
          <div style="font-size:12px;color:var(--accent-green);"><i class="fab fa-whatsapp" style="margin-right:4px;"></i>${o.waNumber}</div>
          ${o.promo ? `<div style="font-size:11px;color:var(--accent-gold);">Promo: ${o.promo} (-${o.promoDiscount}%)</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-display);color:var(--accent-gold);font-size:16px;font-weight:700;">Rp ${o.total.toLocaleString('id-ID')}</div>
          <span class="status-badge status-${o.status}">${o.status}</span>
        </div>
      </div>
      ${o.status === 'waiting' ? `
        <div class="log-actions">
          <button class="btn-approve" onclick="openApproveModal('${o.id}')"><i class="fas fa-check" style="margin-right:4px;"></i>Approve</button>
          <button class="btn-reject" onclick="rejectOrder('${o.id}')"><i class="fas fa-times" style="margin-right:4px;"></i>Reject</button>
        </div>
      ` : ''}
      ${o.status === 'approved' && o.keys && o.keys.length > 0 ? `
        <div style="margin-top:8px;font-size:12px;color:var(--accent-green);">
          <i class="fas fa-key" style="margin-right:4px;"></i>Keys: ${o.keys.filter(k=>k).join(', ')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function filterLogs(filter, btn) {
  currentLogFilter = filter;
  document.querySelectorAll('#section-logs .admin-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAdminLogs(filter);
}

let approvingOrderId = null;

function openApproveModal(orderId) {
  approvingOrderId = orderId;
  document.getElementById('approve-trx-id').textContent = 'ID: ' + orderId;
  document.getElementById('key-inputs').innerHTML = `
    <input type="text" class="key-input approve-key-field" placeholder="Key 1..."/>
    <input type="text" class="key-input approve-key-field" placeholder="Key 2... (opsional)"/>
    <input type="text" class="key-input approve-key-field" placeholder="Key 3... (opsional)"/>
  `;
  openModal('approve-modal');
}

function addKeyInput() {
  const container = document.getElementById('key-inputs');
  const count = container.querySelectorAll('.approve-key-field').length + 1;
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'key-input approve-key-field';
  inp.placeholder = `Key ${count}... (opsional)`;
  container.appendChild(inp);
}

async function confirmApprove() {
  if (!approvingOrderId) return;
  const keyFields = document.querySelectorAll('.approve-key-field');
  const keys = Array.from(keyFields).map(k => sanitizeInput(k.value)).filter(k => k);

  const orders = await loadData('orders', { list: [] });
  const idx = (orders.list || []).findIndex(o => o.id === approvingOrderId);
  if (idx === -1) return;

  orders.list[idx].status = 'approved';
  orders.list[idx].keys = keys;
  orders.list[idx].approvedAt = new Date().toISOString();

  await saveData('orders', orders);

  // Update stats: totalBuyers
  const stats = await loadData('stats', getDefaultStats());
  const today = new Date().toDateString();
  if (stats.todayDate !== today) { stats.todayDate = today; stats.todaySold = 0; }
  stats.todaySold = (stats.todaySold || 0) + 0; // Already counted on purchase
  await saveData('stats', stats);

  closeModal('approve-modal');
  notify('success', 'Order Diapprove!', `Transaksi ${approvingOrderId} berhasil diapprove dan key dikirim.`);
  approvingOrderId = null;
  await renderAdminLogs();
  await loadAdminOverview();
}

async function rejectOrder(orderId) {
  if (!confirm('Yakin ingin reject order ini? Saldo user akan dikembalikan.')) return;

  const orders = await loadData('orders', { list: [] });
  const idx = (orders.list || []).findIndex(o => o.id === orderId);
  if (idx === -1) return;

  const order = orders.list[idx];
  if (order.status !== 'waiting') { notify('warning', 'Error!', 'Order sudah diproses sebelumnya.'); return; }

  orders.list[idx].status = 'rejected';
  orders.list[idx].rejectedAt = new Date().toISOString();
  await saveData('orders', orders);

  // Refund
  const users = await loadData('users', { list: [] });
  const uIdx = (users.list || []).findIndex(u => u.username === order.username);
  if (uIdx !== -1) {
    users.list[uIdx].credit = (users.list[uIdx].credit || 0) + order.total;
    await saveData('users', users);
  }

  notify('info', 'Order Ditolak!', `Transaksi ${orderId} ditolak. Saldo Rp ${order.total.toLocaleString('id-ID')} dikembalikan ke @${order.username}.`);
  await renderAdminLogs();
  await loadAdminOverview();
}

// ===== PROMO =====
async function addPromoCode() {
  const code = sanitizeInput(document.getElementById('promo-code-input').value.toUpperCase());
  const pct = Number(document.getElementById('promo-pct-input').value);
  const maxUse = Number(document.getElementById('promo-max-input').value);

  if (!code || !pct || !maxUse) { notify('warning', 'Perhatian!', 'Semua field promo wajib diisi!'); return; }
  if (pct < 1 || pct > 99) { notify('warning', 'Perhatian!', 'Persen diskon harus antara 1-99%'); return; }

  const promos = await loadData('promos', { list: [] });
  const list = promos.list || [];
  if (list.find(p => p.code === code)) { notify('warning', 'Duplikat!', 'Kode promo sudah ada!'); return; }

  list.push({ id: 'promo_' + Date.now(), code, pct, maxUse, used: 0, createdAt: new Date().toISOString() });
  await saveData('promos', { list });
  notify('success', 'Promo Ditambahkan!', `Kode ${code} - Diskon ${pct}% (maks ${maxUse}x) berhasil.`);
  document.getElementById('promo-code-input').value = '';
  document.getElementById('promo-pct-input').value = '';
  document.getElementById('promo-max-input').value = '';
  await renderAdminPromos();
}

async function renderAdminPromos() {
  const container = document.getElementById('admin-promos-list');
  if (!container) return;
  const promos = await loadData('promos', { list: [] });
  const list = promos.list || [];

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-tag"></i><p>Belum ada kode promo.</p></div>';
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="admin-log-item" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--accent-gold);">${p.code}</div>
        <div style="font-size:12px;color:var(--text-muted);">Diskon ${p.pct}% • Digunakan: ${p.used}/${p.maxUse}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <div class="status-badge ${p.used >= p.maxUse ? 'status-rejected' : 'status-approved'}">${p.used >= p.maxUse ? 'Habis' : 'Aktif'}</div>
        <button class="btn-danger" onclick="deletePromo('${p.id}')" style="padding:6px 10px;"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

async function deletePromo(id) {
  if (!confirm('Hapus kode promo ini?')) return;
  const promos = await loadData('promos', { list: [] });
  promos.list = (promos.list || []).filter(p => p.id !== id);
  await saveData('promos', promos);
  notify('success', 'Promo Dihapus!', '');
  await renderAdminPromos();
}

// ===== USERS =====
async function renderAdminUsers() {
  const container = document.getElementById('admin-users-list');
  if (!container) return;
  const users = await loadData('users', { list: [] });
  const list = users.list || [];

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Belum ada user.</p></div>';
    return;
  }

  container.innerHTML = list.map(u => `
    <div class="admin-log-item" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--text-primary);">@${u.username}</div>
        <div style="font-size:12px;color:var(--text-muted);">Role: ${u.role || 'user'} • Bergabung: ${new Date(u.createdAt || Date.now()).toLocaleDateString('id-ID')}</div>
      </div>
      <div style="font-family:var(--font-display);color:var(--accent-gold);font-size:14px;font-weight:700;">
        Rp ${(u.credit || 0).toLocaleString('id-ID')}
      </div>
    </div>
  `).join('');
}

async function transferSaldo() {
  const username = sanitizeInput(document.getElementById('topup-username').value);
  const amount = Number(document.getElementById('topup-amount').value);

  if (!username || !amount) { notify('warning', 'Perhatian!', 'Username dan jumlah wajib diisi!'); return; }
  if (amount < 1) { notify('warning', 'Perhatian!', 'Jumlah saldo minimal Rp 1!'); return; }

  const users = await loadData('users', { list: [] });
  const idx = (users.list || []).findIndex(u => u.username.toLowerCase() === username.toLowerCase());

  if (idx === -1) { notify('error', 'User Tidak Ditemukan!', `Username @${username} tidak ada di database.`); return; }

  users.list[idx].credit = (users.list[idx].credit || 0) + amount;
  await saveData('users', users);
  notify('success', 'Transfer Berhasil!', `Rp ${amount.toLocaleString('id-ID')} berhasil dikirim ke @${username}.`);
  document.getElementById('topup-username').value = '';
  document.getElementById('topup-amount').value = '';
  await renderAdminUsers();
}

// ===== SETTINGS =====
function getDefaultSettings() {
  return {
    runningText: false,
    runningTextVal: 'KODE PROMO TERBARU : DISKON70%',
    waPopup: true,
    notif2: false,
    notif2Icon: 'fas fa-exclamation-triangle',
    notif2Title: 'Perhatian!',
    notif2Text: 'Jika mengalami kesulitan hubungi admin.',
    resetKeyEnabled: true,
    maintenance: false,
    maintenanceReason: 'Website sedang dalam pemeliharaan.'
  };
}

function getDefaultStats() {
  return { totalRevenue: 0, todaySold: 0, todayDate: '' };
}

async function loadAdminSettings() {
  const settings = await loadData('settings', getDefaultSettings());

  const sw = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
  const si = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  sw('sw-running', settings.runningText);
  si('running-text-val', settings.runningTextVal);
  sw('sw-wa-popup', settings.waPopup);
  sw('sw-notif2', settings.notif2);
  si('notif2-icon-input', settings.notif2Icon);
  si('notif2-title-input', settings.notif2Title);
  si('notif2-text-input', settings.notif2Text);
  sw('sw-reset-key', settings.resetKeyEnabled);
  sw('sw-maintenance', settings.maintenance);
  si('maintenance-reason-input', settings.maintenanceReason);
}

async function saveSettings() {
  const gv = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  const gc = id => { const el = document.getElementById(id); return el ? el.checked : false; };

  const settings = {
    runningText: gc('sw-running'),
    runningTextVal: gv('running-text-val'),
    waPopup: gc('sw-wa-popup'),
    notif2: gc('sw-notif2'),
    notif2Icon: gv('notif2-icon-input'),
    notif2Title: gv('notif2-title-input'),
    notif2Text: gv('notif2-text-input'),
    resetKeyEnabled: gc('sw-reset-key'),
    maintenance: gc('sw-maintenance'),
    maintenanceReason: gv('maintenance-reason-input')
  };

  await saveData('settings', settings);
  notify('success', 'Settings Tersimpan!', 'Pengaturan berhasil diperbarui.');
}

// ===== MISC =====
function toggleNewRentalSection() {
  const show = document.getElementById('new-rental-toggle').checked;
  document.getElementById('new-rental-section').style.display = show ? '' : 'none';
}

// Handle Enter key on login
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const loginBtn = document.getElementById('login-btn');
    const regBtn = document.getElementById('reg-btn');
    if (loginBtn) doLogin();
    if (regBtn) doRegister();
  }
});