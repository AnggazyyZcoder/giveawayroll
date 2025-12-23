// Daftar peserta giveaway
const participants = [
    "RYAN21", "reffy", "Vinz", "ray", "vinz", "epin", "villo", 
    "loren", "velo", "rey", "kelz", "diaz", "Zee", "noya", 
    "ikhsan", "lewy"
];

// Elemen DOM
const participantsList = document.getElementById('participantsList');
const rollButton = document.getElementById('rollButton');
const rollingText = document.getElementById('rollingText');
const statusText = document.getElementById('statusText');
const winnerSection = document.getElementById('winnerSection');
const winnerName = document.getElementById('winnerName');
const winnerNumber = document.getElementById('winnerNumber');
const rollAgainButton = document.getElementById('rollAgainButton');

// Variabel untuk kontrol animasi
let isRolling = false;
let rollInterval;
const winnerIndex = 7; // Loren adalah peserta nomor 8 (indeks 7)
const rollDuration = 4000; // 4 detik
const fastRollSpeed = 50; // ms per perubahan nama selama roll cepat
const slowRollSpeed = 200; // ms per perubahan nama selama roll lambat

// Inisialisasi halaman
document.addEventListener('DOMContentLoaded', function() {
    // Tampilkan daftar peserta
    displayParticipants();
    
    // Setup event listeners
    setupEventListeners();
    
    // Animasi masuk untuk elemen
    setupAnimations();
});

// Menampilkan daftar peserta
function displayParticipants() {
    participantsList.innerHTML = '';
    
    participants.forEach((participant, index) => {
        const participantCard = document.createElement('div');
        participantCard.className = 'participant-card';
        participantCard.dataset.index = index;
        
        // Tandai pemenang (akan ditampilkan setelah pengacakan)
        if (index === winnerIndex) {
            participantCard.classList.add('winner');
        }
        
        participantCard.innerHTML = `
            <div class="participant-number">${index + 1}</div>
            <div class="participant-name">${participant}</div>
            <div class="winner-badge"><i class="fas fa-crown"></i></div>
        `;
        
        participantsList.appendChild(participantCard);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Tombol acak pemenang
    rollButton.addEventListener('click', startRolling);
    
    // Tombol acak lagi
    rollAgainButton.addEventListener('click', resetRoller);
    
    // Tombol bagikan
    document.querySelector('.share-button').addEventListener('click', shareResult);
    
    // Toggle tema (opsional untuk versi pro)
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
}

// Setup animasi saat scroll
function setupAnimations() {
    // Animasi fade in saat scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    }, observerOptions);
    
    // Observasi setiap bagian
    document.querySelectorAll('.participants-section, .roller-section, .winner-section').forEach(section => {
        observer.observe(section);
    });
}

// Mulai proses pengacakan
function startRolling() {
    if (isRolling) return;
    
    isRolling = true;
    rollButton.disabled = true;
    rollButton.style.opacity = '0.7';
    statusText.textContent = 'Mengacak pemenang...';
    
    // Reset tampilan pemenang jika ada
    winnerSection.classList.add('hidden');
    
    // Hilangkan highlight dari semua peserta
    document.querySelectorAll('.participant-card').forEach(card => {
        card.classList.remove('winner');
    });
    
    // Animasi rolling teks
    let rollTime = 0;
    let currentSpeed = fastRollSpeed;
    
    // Fase 1: Rolling cepat
    rollInterval = setInterval(() => {
        // Tampilkan nama acak
        const randomIndex = Math.floor(Math.random() * participants.length);
        rollingText.innerHTML = `<span>${participants[randomIndex]}</span>`;
        
        rollTime += currentSpeed;
        
        // Fase 2: Setelah 3 detik, mulai melambat
        if (rollTime > 3000) {
            currentSpeed = slowRollSpeed;
        }
        
        // Fase 3: Setelah 4 detik, berhenti di pemenang
        if (rollTime >= rollDuration) {
            clearInterval(rollInterval);
            showWinner();
        }
    }, currentSpeed);
}

// Tampilkan pemenang
function showWinner() {
    // Tampilkan nama pemenang
    rollingText.innerHTML = `<span>${participants[winnerIndex]}</span>`;
    statusText.textContent = 'Pemenang telah ditemukan!';
    
    // Highlight pemenang di daftar peserta
    const winnerCard = document.querySelector(`.participant-card[data-index="${winnerIndex}"]`);
    winnerCard.classList.add('winner');
    
    // Tampilkan animasi pemenang
    setTimeout(() => {
        // Update detail pemenang
        winnerName.textContent = participants[winnerIndex].toUpperCase();
        winnerNumber.textContent = winnerIndex + 1;
        
        // Tampilkan bagian pemenang dengan animasi
        winnerSection.classList.remove('hidden');
        winnerSection.classList.add('animate__bounceIn');
        
        // Reset tombol
        rollButton.disabled = false;
        rollButton.style.opacity = '1';
        isRolling = false;
        
        // Scroll ke bagian pemenang
        winnerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
}

// Reset roller untuk pengacakan ulang
function resetRoller() {
    // Sembunyikan bagian pemenang
    winnerSection.classList.add('hidden');
    
    // Reset tampilan roller
    rollingText.innerHTML = '<span>?</span>';
    statusText.textContent = 'Siap untuk mengacak pemenang';
    
    // Hilangkan highlight dari pemenang sebelumnya
    const winnerCard = document.querySelector(`.participant-card[data-index="${winnerIndex}"]`);
    winnerCard.classList.remove('winner');
    
    // Scroll ke roller section
    document.querySelector('.roller-section').scrollIntoView({ behavior: 'smooth' });
}

// Bagikan hasil (simulasi)
function shareResult() {
    const shareText = `Saya baru saja menggunakan GiveawayRoller! Pemenang giveaway Part 1 adalah ${participants[winnerIndex]} (No. ${winnerIndex + 1}). Coba di: ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Hasil Giveaway Roller',
            text: shareText,
            url: window.location.href
        });
    } else {
        // Fallback untuk browser yang tidak mendukung Web Share API
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Hasil giveaway telah disalin ke clipboard!');
        });
    }
}

// Toggle tema (opsional)
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-toggle i');
    
    if (body.classList.contains('light-theme')) {
        // Kembali ke tema gelap
        body.classList.remove('light-theme');
        themeIcon.className = 'fas fa-moon';
        
        // Update warna tema
        document.documentElement.style.setProperty('--primary-color', '#c084fc');
        document.documentElement.style.setProperty('--bg-color', '#1a0b2e');
    } else {
        // Tema terang
        body.classList.add('light-theme');
        themeIcon.className = 'fas fa-sun';
        
        // Update warna tema
        document.documentElement.style.setProperty('--primary-color', '#8b5cf6');
        document.documentElement.style.setProperty('--bg-color', '#f5f3ff');
    }
}

// Efek konfeti tambahan saat pemenang ditampilkan
function createConfetti() {
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.backgroundColor = getRandomColor();
        confetti.style.position = 'fixed';
        confetti.style.top = '-20px';
        confetti.style.zIndex = '9999';
        confetti.style.borderRadius = '2px';
        
        document.body.appendChild(confetti);
        
        // Animasi jatuh
        const animation = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight + 20}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
        });
        
        // Hapus confetti setelah animasi selesai
        animation.onfinish = () => {
            confetti.remove();
        };
    }
}

// Helper untuk warna acak
function getRandomColor() {
    const colors = ['#c084fc', '#8b5cf6', '#ffd700', '#ff6b9d', '#6bcf7f', '#5dade2'];
    return colors[Math.floor(Math.random() * colors.length)];
}