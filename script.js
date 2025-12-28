
// Tokens API - menggunakan token yang Anda berikan
const tokens = [
    "f7ca592b29b7f9eca59b352695a80e2a0cb9d1a0511b99bab913c947f1456c8b",
    "1e51b47b5526318a1b091ce809351831c283ac3508c1cc058d19c7dc153a6b1f",
    "1268a2225806ec952aefe8eb950687c9b3d336de719e4b3245c2be3150003d09",
    "abd44b8d6fe5f877a4d184e0df08e29370f2d49414853a75a5d6d46e758c84c7",
    "84b6ed6ca89973bb531906f2cca7c1251424a8cac49604180cbf87977df8f62e",
    "4c107ec4076a436a4de96a6d5c337896ba79c991685896d7cff242d8107343ad",
    "04f74d31946dbab25f603e412686d25a50d6c2ceb4d7ee2d3c37bca1ee68f720",
    "e83a0190933eb8e48429fec6d64cf4587c6d7fe50c932c8b837f9c2ef2b2d67c",
    "9c0807ac50818cb10cb9c4d7d58f33e15285e7924b32aa2ab41129eb581b49ce",
    "56ab13daaca55ddd1d23d283065999ef205df6a21b7590dd214306ae8ada1739",
    "891bb0e6b6fdd0a218d15374898b230be150622c393aa40a35c44c76dfc2fb84",
    "251471094f0f614c8112489a4c24140198438d235864c6fde6b0552e9e170993"
];

let currentTokenIndex = 0;
let successCount = 0;
let isProcessing = false;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const postUrlInput = document.getElementById('postUrl');
const emojiInput = document.getElementById('emojiInput');
const emojiPreview = document.getElementById('previewEmojis');
const reactBtn = document.getElementById('reactBtn');
const clearBtn = document.getElementById('clearBtn');
const activeTokenElement = document.getElementById('activeToken');
const apiStatusElement = document.getElementById('apiStatus');
const successCountElement = document.getElementById('successCount');
const tokenProgress = document.getElementById('tokenProgress');
const progressText = document.getElementById('progressText');
const resultsList = document.getElementById('resultsList');
const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const emojiButtons = document.querySelectorAll('.emoji-btn');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after 2 seconds
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        
        // Animate welcome text
        animateWelcomeText();
        
        // Update initial status
        updateStatus();
        
        // Set up smooth scrolling for navigation links
        setupSmoothScrolling();
        
        // Set up intersection observer for fade-in animations
        setupIntersectionObserver();
        
        // Pre-fill with example data for testing
        prefillExampleData();
        
        // Initialize connection monitoring
        monitorConnection();
    }, 2000);
    
    // Initialize event listeners
    initEventListeners();
});

// Pre-fill example data for testing
function prefillExampleData() {
    // Example WhatsApp channel link
    postUrlInput.value = 'https://whatsapp.com/channel/0029VbBmhCB...';
    
    // Example emoji
    emojiInput.value = '😂';
    
    // Update preview
    updateEmojiPreview();
}

// Animate welcome text
function animateWelcomeText() {
    const titleParts = document.querySelectorAll('.title-part');
    titleParts.forEach((part, index) => {
        part.style.opacity = '0';
        part.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            part.style.transition = 'opacity 1s ease, transform 1s ease';
            part.style.opacity = '1';
            part.style.transform = 'translateY(0)';
        }, 300 * (index + 1));
    });
}

// Update status display
function updateStatus() {
    activeTokenElement.textContent = `${currentTokenIndex + 1}/${tokens.length}`;
    successCountElement.textContent = successCount;
    
    // Calculate token usage percentage
    const usagePercentage = Math.round(((currentTokenIndex + 1) / tokens.length) * 100);
    tokenProgress.style.width = `${usagePercentage}%`;
    progressText.textContent = `${usagePercentage}%`;
    
    // Update API status based on usage
    if (usagePercentage < 50) {
        apiStatusElement.textContent = 'Ready';
        apiStatusElement.style.color = '#06d6a0';
    } else if (usagePercentage < 80) {
        apiStatusElement.textContent = 'Moderate';
        apiStatusElement.style.color = '#ffd166';
    } else {
        apiStatusElement.textContent = 'Heavy Load';
        apiStatusElement.style.color = '#ef476f';
    }
}

// Initialize event listeners
function initEventListeners() {
    // Update emoji preview as user types
    emojiInput.addEventListener('input', updateEmojiPreview);
    
    // Add emoji from suggestion buttons
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const emoji = this.getAttribute('data-emoji');
            const currentValue = emojiInput.value.trim();
            
            if (currentValue === '') {
                emojiInput.value = emoji;
            } else {
                // Remove trailing comma if exists
                const cleanValue = currentValue.endsWith(',') ? 
                    currentValue.slice(0, -1) : currentValue;
                emojiInput.value = cleanValue + ',' + emoji;
            }
            
            updateEmojiPreview();
            
            // Animate button
            this.style.transform = 'scale(1.3)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
    
    // React button click
    reactBtn.addEventListener('click', handleReact);
    
    // Clear button click
    clearBtn.addEventListener('click', clearFields);
    
    // Theme toggle
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
    
    // Enter key support
    postUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleReact();
        }
    });
    
    emojiInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleReact();
        }
    });
}

// Update emoji preview
function updateEmojiPreview() {
    const emojis = emojiInput.value.trim();
    
    if (emojis === '') {
        emojiPreview.textContent = '';
        return;
    }
    
    // Clean and format emojis
    const emojiArray = emojis.split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);
    
    emojiPreview.textContent = emojiArray.join('');
}

// Handle react button click
async function handleReact() {
    // Prevent multiple simultaneous requests
    if (isProcessing) {
        showNotification('Sedang memproses reaksi sebelumnya...', 'info');
        return;
    }
    
    const postUrl = postUrlInput.value.trim();
    const emojis = emojiInput.value.trim();
    
    // Validate inputs
    if (!postUrl) {
        showNotification('Masukkan link saluran WhatsApp terlebih dahulu!', 'error');
        postUrlInput.focus();
        return;
    }
    
    if (!emojis) {
        showNotification('Masukkan minimal satu emoji untuk reaksi!', 'error');
        emojiInput.focus();
        return;
    }
    
    // Validate URL format - more flexible validation
    if (!postUrl.includes('whatsapp.com') && !postUrl.includes('whatsapp')) {
        const proceed = confirm('Link tidak terdeteksi sebagai link WhatsApp. Lanjutkan?');
        if (!proceed) {
            return;
        }
    }
    
    // Set processing flag
    isProcessing = true;
    
    // Show loading state
    const originalText = reactBtn.innerHTML;
    reactBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    reactBtn.disabled = true;
    
    // Prepare emojis array
    const emojiArray = emojis.split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);
    
    try {
        // Call API to react to post
        const result = await reactToPost(postUrl, emojiArray);
        
        if (result.success) {
            showNotification('Reaksi berhasil dikirim!', 'success');
            successCount++;
            
            // Add to results history
            addToResults({
                success: true,
                postUrl: postUrl,
                emojis: emojiArray,
                timestamp: new Date().toLocaleTimeString(),
                tokenUsed: currentTokenIndex,
                data: result.data
            });
        } else {
            // Handle specific error cases
            let errorMessage = 'Gagal mengirim reaksi';
            
            if (result.error === 'All tokens are limited') {
                errorMessage = 'Semua token sedang limit, coba lagi nanti';
            } else if (result.status === 402) {
                errorMessage = 'Token limit, sistem otomatis ganti token';
            } else if (result.error && typeof result.error === 'object' && result.error.message) {
                errorMessage = result.error.message;
            } else if (typeof result.error === 'string') {
                errorMessage = result.error;
            }
            
            showNotification(errorMessage, 'error');
            
            // Add to results history
            addToResults({
                success: false,
                postUrl: postUrl,
                emojis: emojiArray,
                timestamp: new Date().toLocaleTimeString(),
                error: errorMessage,
                status: result.status
            });
        }
        
        // Update status display
        updateStatus();
        
    } catch (error) {
        console.error('Error:', error);
        
        // Handle network errors specifically
        let errorMsg = 'Terjadi kesalahan saat memproses permintaan';
        if (error.message && (error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
            errorMsg = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
        } else if (error.message && error.message.includes('timeout')) {
            errorMsg = 'Waktu permintaan habis. Server mungkin sedang sibuk.';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showNotification(errorMsg, 'error');
        
        // Add to results history
        addToResults({
            success: false,
            postUrl: postUrl,
            emojis: emojiArray,
            timestamp: new Date().toLocaleTimeString(),
            error: error.message || 'Unknown error'
        });
    } finally {
        // Reset button state
        reactBtn.innerHTML = originalText;
        reactBtn.disabled = false;
        isProcessing = false;
    }
}

// Fungsi utama untuk react ke post - MENGIKUTI STRUKTUR YANG ANDA BERIKAN
async function reactToPost(postUrl, emojis) {
    let attempts = 0;
    const maxAttempts = tokens.length;
    const startTime = Date.now();

    while (attempts < maxAttempts) {
        const apiKey = tokens[currentTokenIndex];
        
        try {
            console.log(`🎯 Reacting to: ${postUrl}`);
            console.log(`🎭 With emojis: ${emojis}`);
            console.log(`🔑 Using token index: ${currentTokenIndex}`);
            console.log(`🕒 Attempt ${attempts + 1} of ${maxAttempts}`);

            showNotification(`Mencoba dengan Token ${currentTokenIndex + 1}...`, 'info');

            const response = await axios({
                method: 'POST',
                url: `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${apiKey}`,
                headers: {
                    'authority': 'foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app',
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'content-type': 'application/json',
                    'origin': 'https://asitha.top',
                    'referer': 'https://asitha.top/',
                    'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
                    'sec-ch-ua-mobile': '?1',
                    'sec-ch-ua-platform': '"Android"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
                },
                data: {
                    post_link: postUrl,
                    reacts: Array.isArray(emojis) ? emojis : [emojis]
                },
                timeout: 30000 // 30 detik timeout
            });

            const elapsedTime = Date.now() - startTime;
            console.log(`✅ Success! Time: ${elapsedTime}ms`);
            console.log('Response:', response.data);
            
            // Pindah ke token berikutnya untuk request selanjutnya
            currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
            
            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            const elapsedTime = Date.now() - startTime;
            console.log(`❌ Token ${currentTokenIndex} failed (${elapsedTime}ms):`, error.response?.data || error.message);
            
            // Check for specific error types
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                console.log(`⏰ Timeout pada token ${currentTokenIndex}`);
                showNotification(`Token ${currentTokenIndex + 1} timeout, mencoba token lain...`, 'warning');
            }
            
            if (error.response && error.response.status === 402) {
                console.log(`🔄 Token ${currentTokenIndex} limit (402), switching token`);
                showNotification(`Token ${currentTokenIndex + 1} limit, ganti token...`, 'warning');
                
                currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
                attempts++;
                continue;
            }

            if (error.response?.data?.message?.includes('limit') || error.response?.data?.message?.includes('Limit')) {
                console.log(`🔄 Token ${currentTokenIndex} limited, switching token`);
                showNotification(`Token ${currentTokenIndex + 1} limited, ganti token...`, 'warning');
                
                currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
                attempts++;
                continue;
            }

            // Untuk error lainnya, coba token berikutnya
            console.log(`🔄 Token ${currentTokenIndex} error, trying next token`);
            currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
            attempts++;
            
            // Jika sudah mencoba semua token
            if (attempts >= maxAttempts) {
                console.log('❌ All tokens failed!');
                break;
            }
            
            // Delay kecil sebelum mencoba token berikutnya
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('❌ All tokens limited or failed!');
    return {
        success: false,
        error: 'All tokens are limited or failed',
        status: 402
    };
}

// Alternative function using Fetch API jika Axios bermasalah
async function reactToPostWithFetch(postUrl, emojis) {
    let attempts = 0;
    const maxAttempts = tokens.length;

    while (attempts < maxAttempts) {
        const apiKey = tokens[currentTokenIndex];
        
        try {
            console.log(`🔧 Using Fetch API with token ${currentTokenIndex}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(`https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${apiKey}`, {
                method: 'POST',
                headers: {
                    'authority': 'foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app',
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'content-type': 'application/json',
                    'origin': 'https://asitha.top',
                    'referer': 'https://asitha.top/',
                    'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
                    'sec-ch-ua-mobile': '?1',
                    'sec-ch-ua-platform': '"Android"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
                },
                body: JSON.stringify({
                    post_link: postUrl,
                    reacts: Array.isArray(emojis) ? emojis : [emojis]
                }),
                signal: controller.signal,
                mode: 'cors'
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
            
            const data = await response.json();
            
            // Pindah ke token berikutnya
            currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
            
            return {
                success: true,
                data: data
            };
            
        } catch (error) {
            console.log(`❌ Fetch API failed with token ${currentTokenIndex}:`, error.message);
            
            // Coba token berikutnya
            currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
            attempts++;
            
            if (attempts >= maxAttempts) {
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    return {
        success: false,
        error: 'All tokens failed with Fetch API',
        status: 500
    };
}

// Add result to history
function addToResults(result) {
    // Hide placeholder if it's the first result
    if (resultsPlaceholder.style.display !== 'none') {
        resultsPlaceholder.style.display = 'none';
        resultsList.style.display = 'flex';
    }
    
    // Create result element
    const resultElement = document.createElement('div');
    resultElement.className = `result-item ${result.success ? 'success' : 'error'}`;
    
    // Format emojis for display
    const emojisDisplay = Array.isArray(result.emojis) ? 
        result.emojis.join('') : 
        (result.emojis || '');
    
    // Truncate URL for display
    const displayUrl = result.postUrl.length > 40 ? 
        result.postUrl.substring(0, 40) + '...' : 
        result.postUrl;
    
    // Create result HTML
    resultElement.innerHTML = `
        <div class="result-header">
            <span class="result-status ${result.success ? 'success' : 'error'}">
                ${result.success ? 'SUCCESS' : 'ERROR'}
            </span>
            <span class="result-time">${result.timestamp}</span>
        </div>
        <div class="result-details">
            <div class="result-detail">
                <i class="fas fa-link"></i>
                <span title="${result.postUrl}">${displayUrl}</span>
            </div>
            <div class="result-detail">
                <i class="fas fa-smile"></i>
                <span class="result-emojis">${emojisDisplay}</span>
            </div>
            ${result.tokenUsed !== undefined ? `
            <div class="result-detail">
                <i class="fas fa-key"></i>
                <span>Token: ${result.tokenUsed + 1}</span>
            </div>` : ''}
        </div>
        ${!result.success ? `
        <div class="result-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>${typeof result.error === 'string' ? result.error : 
                result.error && result.error.message ? result.error.message : 
                'Unknown error'}</span>
        </div>` : ''}
        ${result.success && result.data ? `
        <div class="result-success">
            <i class="fas fa-check-circle"></i>
            <span>${result.data.message || 'Reaction sent successfully'}</span>
        </div>` : ''}
    `;
    
    // Add animation
    resultElement.style.animation = 'slideInRight 0.5s ease forwards';
    resultElement.style.opacity = '0';
    
    // Add to top of results list
    if (resultsList.firstChild) {
        resultsList.insertBefore(resultElement, resultsList.firstChild);
    } else {
        resultsList.appendChild(resultElement);
    }
    
    // Trigger animation
    setTimeout(() => {
        resultElement.style.opacity = '1';
    }, 10);
    
    // Limit to 10 results
    if (resultsList.children.length > 10) {
        resultsList.removeChild(resultsList.lastChild);
    }
    
    // Scroll to results
    setTimeout(() => {
        resultsList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

// Clear input fields
function clearFields() {
    postUrlInput.value = '';
    emojiInput.value = '';
    emojiPreview.textContent = '';
    
    // Animate clear button
    clearBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        clearBtn.style.transform = 'rotate(0)';
    }, 300);
    
    showNotification('Fields cleared', 'info');
    postUrlInput.focus();
}

// Show notification
function showNotification(message, type) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}" style="margin-right: 10px;"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#06d6a0' : 
                         type === 'error' ? '#ef476f' : 
                         type === 'warning' ? '#ffd166' : '#8a2be2'};
        color: white;
        border-radius: var(--border-radius);
        font-weight: 600;
        box-shadow: var(--shadow);
        z-index: 1000;
        transform: translateX(100%);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.5s ease;
        max-width: 400px;
        word-wrap: break-word;
        display: flex;
        align-items: center;
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after appropriate time
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, duration);
}

// Toggle theme
function toggleTheme() {
    const themeToggle = document.querySelector('.theme-toggle i');
    
    if (themeToggle.classList.contains('fa-moon')) {
        themeToggle.classList.remove('fa-moon');
        themeToggle.classList.add('fa-sun');
        showNotification('Light mode coming soon!', 'info');
    } else {
        themeToggle.classList.remove('fa-sun');
        themeToggle.classList.add('fa-moon');
    }
    
    // Animate toggle
    themeToggle.parentElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
        themeToggle.parentElement.style.transform = 'scale(1)';
    }, 200);
}

// Setup smooth scrolling for navigation links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
}

// Setup intersection observer for fade-in animations
function setupIntersectionObserver() {
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    fadeElements.forEach(element => {
        observer.observe(element);
    });
}

// Monitor connection status
function monitorConnection() {
    const connectionStatus = document.createElement('div');
    connectionStatus.id = 'connectionStatus';
    connectionStatus.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 8px 15px;
        background-color: #06d6a0;
        color: white;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0.9;
        transition: all 0.3s ease;
    `;
    
    connectionStatus.innerHTML = `
        <i class="fas fa-wifi"></i>
        <span>Online</span>
    `;
    
    document.body.appendChild(connectionStatus);
    
    // Update connection status
    const updateConnectionStatus = (isOnline) => {
        if (isOnline) {
            connectionStatus.innerHTML = `<i class="fas fa-wifi"></i><span>Online</span>`;
            connectionStatus.style.backgroundColor = '#06d6a0';
        } else {
            connectionStatus.innerHTML = `<i class="fas fa-wifi-slash"></i><span>Offline</span>`;
            connectionStatus.style.backgroundColor = '#ef476f';
            showNotification('Anda sedang offline. Periksa koneksi internet.', 'error');
        }
    };
    
    // Initial check
    updateConnectionStatus(navigator.onLine);
    
    // Listen for connection changes
    window.addEventListener('online', () => updateConnectionStatus(true));
    window.addEventListener('offline', () => updateConnectionStatus(false));
}

// Test API connection
async function testAPIConnection() {
    try {
        showNotification('Testing API connection...', 'info');
        
        const response = await fetch('https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app', {
            method: 'HEAD',
            mode: 'no-cors'
        });
        
        console.log('✅ API server is reachable');
        showNotification('API server is reachable', 'success');
        return true;
    } catch (error) {
        console.log('❌ API server may be unreachable:', error.message);
        showNotification('API server mungkin sedang offline atau ada masalah CORS', 'warning');
        return false;
    }
}

// Initialize API test on load
setTimeout(() => {
    testAPIConnection();
}, 3000);

// Tambahkan tombol untuk mencoba dengan Fetch API
function addFetchFallbackButton() {
    const fetchButton = document.createElement('button');
    fetchButton.id = 'fetchFallbackBtn';
    fetchButton.className = 'btn-secondary';
    fetchButton.innerHTML = '<i class="fas fa-sync-alt"></i> Try Fetch API';
    fetchButton.style.marginTop = '10px';
    
    fetchButton.addEventListener('click', async () => {
        const postUrl = postUrlInput.value.trim();
        const emojis = emojiInput.value.trim();
        
        if (!postUrl || !emojis) {
            showNotification('Harap isi link dan emoji terlebih dahulu', 'error');
            return;
        }
        
        const emojiArray = emojis.split(',')
            .map(e => e.trim())
            .filter(e => e.length > 0);
        
        showNotification('Mencoba dengan Fetch API...', 'info');
        
        const result = await reactToPostWithFetch(postUrl, emojiArray);
        
        if (result.success) {
            showNotification('Berhasil dengan Fetch API!', 'success');
            successCount++;
            updateStatus();
            
            addToResults({
                success: true,
                postUrl: postUrl,
                emojis: emojiArray,
                timestamp: new Date().toLocaleTimeString(),
                tokenUsed: currentTokenIndex,
                data: result.data
            });
        } else {
            showNotification('Gagal dengan Fetch API: ' + result.error, 'error');
            
            addToResults({
                success: false,
                postUrl: postUrl,
                emojis: emojiArray,
                timestamp: new Date().toLocaleTimeString(),
                error: result.error
            });
        }
    });
    
    document.querySelector('.action-buttons').appendChild(fetchButton);
}

// Initialize fetch fallback button
setTimeout(() => {
    addFetchFallbackButton();
}, 1000);

// Tambahkan CSS untuk animasi
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .result-error, .result-success {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        border-radius: 8px;
        font-size: 0.9rem;
    }
    
    .result-error {
        background-color: rgba(239, 71, 111, 0.1);
        color: #ef476f;
    }
    
    .result-success {
        background-color: rgba(6, 214, 160, 0.1);
        color: #06d6a0;
    }
    
    #fetchFallbackBtn {
        margin-top: 10px;
        width: 100%;
    }
`;
document.head.appendChild(style);
