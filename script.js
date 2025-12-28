// Token API - hanya 1 token
const tokens = [
    "3ed363abb163b7f8fe9b488f802950a9cf5bb6434e21200ff2b00ac0d22f1a07"
];

let currentTokenIndex = 0;
let successCount = 0;
let isProcessing = false;
let tokenCooldown = false;
let cooldownEndTime = 0;

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
        
        // Start cooldown timer
        startCooldownTimer();
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
    
    // Update API status
    if (tokenCooldown) {
        const remainingTime = Math.max(0, Math.ceil((cooldownEndTime - Date.now()) / 1000));
        if (remainingTime > 0) {
            apiStatusElement.textContent = `Cooldown: ${remainingTime}s`;
            apiStatusElement.style.color = '#ffd166';
        } else {
            apiStatusElement.textContent = 'Ready';
            apiStatusElement.style.color = '#06d6a0';
            tokenCooldown = false;
        }
    } else {
        apiStatusElement.textContent = 'Ready';
        apiStatusElement.style.color = '#06d6a0';
    }
}

// Start cooldown timer
function startCooldownTimer() {
    setInterval(() => {
        if (tokenCooldown && Date.now() >= cooldownEndTime) {
            tokenCooldown = false;
            updateStatus();
            showNotification('Token cooldown selesai, siap digunakan!', 'success');
        }
        updateStatus();
    }, 1000);
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
    
    // Check if token is in cooldown
    if (tokenCooldown) {
        const remainingTime = Math.ceil((cooldownEndTime - Date.now()) / 1000);
        showNotification(`Token dalam cooldown. Tunggu ${remainingTime} detik lagi.`, 'warning');
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
    
    // Validate URL format
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
                tokenUsed: 0,
                data: result.data
            });
            
            // Reset cooldown on success
            tokenCooldown = false;
        } else {
            // Handle specific error cases
            let errorMessage = 'Gagal mengirim reaksi';
            
            if (result.error && typeof result.error === 'object' && result.error.message) {
                errorMessage = result.error.message;
            } else if (typeof result.error === 'string') {
                errorMessage = result.error;
            }
            
            showNotification(errorMessage, 'error');
            
            // Check if token is limited
            if (result.status === 402 || errorMessage.includes('limit') || errorMessage.includes('Limit')) {
                // Set cooldown for 30 seconds
                tokenCooldown = true;
                cooldownEndTime = Date.now() + 30000; // 30 seconds
                showNotification('Token limit, akan aktif kembali dalam 30 detik', 'warning');
            }
            
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
        
        // Set cooldown for network errors
        tokenCooldown = true;
        cooldownEndTime = Date.now() + 15000; // 15 seconds
    } finally {
        // Reset button state
        reactBtn.innerHTML = originalText;
        reactBtn.disabled = false;
        isProcessing = false;
    }
}

// Fungsi utama untuk react ke post - MENGGUNAKAN AUTHORIZATION HEADER
async function reactToPost(postUrl, emojis) {
    const apiKey = tokens[currentTokenIndex];
    
    try {
        console.log(`🎯 Reacting to: ${postUrl}`);
        console.log(`🎭 With emojis: ${emojis}`);
        console.log(`🔑 Using API Key: ${apiKey.substring(0, 10)}...`);

        // METHOD 1: Authorization Header (Recommended)
        const response = await fetch('https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': window.location.origin,
                'Referer': window.location.href
            },
            body: JSON.stringify({
                post_link: postUrl,
                reacts: Array.isArray(emojis) ? emojis : [emojis]
            }),
            mode: 'cors',
            credentials: 'omit'
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText || `HTTP ${response.status}` };
            }
            
            throw {
                message: errorData.message || `HTTP ${response.status}`,
                status: response.status,
                data: errorData
            };
        }
        
        const data = await response.json();
        console.log('✅ Success! Response:', data);
        
        return {
            success: true,
            data: data
        };

    } catch (error) {
        console.log(`❌ Request failed:`, error.message || error);
        
        // If authorization header method fails, try query parameter method
        if (error.status === 401 || error.message?.includes('401')) {
            console.log('🔄 Trying with query parameter method...');
            return await reactToPostWithQueryParam(postUrl, emojis, apiKey);
        }
        
        return {
            success: false,
            error: error.message || 'Request failed',
            status: error.status || 500
        };
    }
}

// METHOD 2: Query Parameter Method
async function reactToPostWithQueryParam(postUrl, emojis, apiKey) {
    try {
        console.log(`🔧 Trying query parameter method...`);
        
        const response = await fetch(`https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': window.location.origin,
                'Referer': window.location.href
            },
            body: JSON.stringify({
                post_link: postUrl,
                reacts: Array.isArray(emojis) ? emojis : [emojis]
            }),
            mode: 'cors',
            credentials: 'omit'
        });

        console.log('Query param response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText || `HTTP ${response.status}` };
            }
            
            throw {
                message: errorData.message || `HTTP ${response.status}`,
                status: response.status,
                data: errorData
            };
        }
        
        const data = await response.json();
        console.log('✅ Success with query param! Response:', data);
        
        return {
            success: true,
            data: data
        };

    } catch (error) {
        console.log(`❌ Query param method also failed:`, error.message || error);
        
        // Last attempt: Try with axios if available
        if (typeof axios !== 'undefined') {
            console.log('🔄 Trying with Axios...');
            return await reactToPostWithAxios(postUrl, emojis, apiKey);
        }
        
        return {
            success: false,
            error: error.message || 'All methods failed',
            status: error.status || 500
        };
    }
}

// METHOD 3: Axios Method (Fallback)
async function reactToPostWithAxios(postUrl, emojis, apiKey) {
    try {
        console.log(`⚡ Trying with Axios...`);
        
        const response = await axios({
            method: 'POST',
            url: 'https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': window.location.origin,
                'Referer': window.location.href
            },
            data: {
                post_link: postUrl,
                reacts: Array.isArray(emojis) ? emojis : [emojis]
            },
            timeout: 30000
        });

        console.log('✅ Success with Axios! Response:', response.data);
        
        return {
            success: true,
            data: response.data
        };

    } catch (error) {
        console.log(`❌ Axios also failed:`, error.message || error);
        
        return {
            success: false,
            error: error.response?.data || error.message || 'Axios request failed',
            status: error.response?.status || 500
        };
    }
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
            <div class="result-detail">
                <i class="fas fa-key"></i>
                <span>Token: 1</span>
            </div>
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
        const apiKey = tokens[0];
        showNotification('Testing API connection...', 'info');
        
        // Try with authorization header first
        const response = await fetch('https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_link: 'https://whatsapp.com/channel/0029VbBmhCB...',
                reacts: ['😂']
            }),
            mode: 'cors'
        });
        
        if (response.status === 401) {
            console.log('✅ API is reachable but unauthorized (expected)');
            showNotification('API server is reachable', 'success');
            return true;
        }
        
        console.log('✅ API connection test response:', response.status);
        showNotification('API server is reachable', 'success');
        return true;
        
    } catch (error) {
        console.log('❌ API connection test failed:', error.message);
        showNotification('API server mungkin sedang offline', 'warning');
        return false;
    }
}

// Initialize API test on load
setTimeout(() => {
    testAPIConnection();
}, 3000);

// Add CSS for animations
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
    
    .cooldown-timer {
        font-size: 0.9rem;
        color: #ffd166;
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .cooldown-timer i {
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Add cooldown timer to status indicator
function addCooldownTimer() {
    const statusContent = document.querySelector('.status-content');
    if (statusContent) {
        const cooldownElement = document.createElement('div');
        cooldownElement.className = 'cooldown-timer';
        cooldownElement.id = 'cooldownTimer';
        cooldownElement.innerHTML = '<i class="fas fa-clock"></i><span>Cooldown: 0s</span>';
        statusContent.appendChild(cooldownElement);
    }
}

// Initialize cooldown timer display
setTimeout(addCooldownTimer, 1000);
