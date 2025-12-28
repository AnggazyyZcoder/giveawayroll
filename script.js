// Tokens API
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
    postUrlInput.value = 'https://whatsapp.com/channel/0029VbB2Ajh...';
    
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
        // Call API to react to post - menggunakan fetch sebagai fallback
        const result = await reactToPostWithFallback(postUrl, emojiArray);
        
        if (result.success) {
            showNotification('Reaksi berhasil dikirim!', 'success');
            successCount++;
            
            // Add to results history
            addToResults({
                success: true,
                postUrl: postUrl,
                emojis: emojiArray,
                timestamp: new Date().toLocaleTimeString(),
                tokenUsed: result.tokenIndex,
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
        if (error.message && (error.message.includes('Network Error') || error.message.includes('Failed to fetch') || error.message.includes('timeout'))) {
            showNotification('Koneksi jaringan bermasalah. Periksa koneksi internet Anda.', 'error');
        } else {
            showNotification('Terjadi kesalahan saat memproses permintaan', 'error');
        }
        
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

// Enhanced API function with fetch as primary and axios as fallback
async function reactToPostWithFallback(postUrl, emojis) {
    let attempts = 0;
    const maxAttempts = tokens.length;
    
    // Show initial attempt status
    console.log(`🚀 Starting reaction attempt to: ${postUrl.substring(0, 50)}...`);
    console.log(`🎭 Emojis: ${emojis.join(', ')}`);
    
    // Loop through tokens
    for (let i = 0; i < maxAttempts; i++) {
        const tokenIndex = (currentTokenIndex + i) % tokens.length;
        const apiKey = tokens[tokenIndex];
        
        console.log(`🔑 Attempt ${i + 1}: Using token index ${tokenIndex}`);
        showNotification(`Mencoba dengan Token ${tokenIndex + 1}...`, 'info');
        
        try {
            // Try with fetch first
            const result = await makeRequestWithFetch(postUrl, emojis, apiKey, tokenIndex);
            
            // Update current token index for next request
            currentTokenIndex = (tokenIndex + 1) % tokens.length;
            
            return {
                success: true,
                data: result,
                tokenIndex: tokenIndex
            };
            
        } catch (error) {
            console.log(`❌ Token ${tokenIndex} failed:`, error.message || error);
            
            // Check if we should try next token
            if (error.message && (
                error.message.includes('limit') || 
                error.message.includes('Limit') || 
                error.message.includes('402') ||
                error.message.includes('timeout') ||
                error.message.includes('network') ||
                error.message.includes('Network')
            )) {
                // Try next token
                showNotification(`Token ${tokenIndex + 1} gagal, mencoba token lain...`, 'warning');
                continue;
            }
            
            // For other errors, return the failure
            return {
                success: false,
                error: error.message || 'Unknown error',
                status: error.status || 500
            };
        }
    }
    
    // If all tokens failed
    console.log('❌ All tokens failed!');
    return {
        success: false,
        error: 'All tokens are limited or failed',
        status: 402
    };
}

// Make request using Fetch API
async function makeRequestWithFetch(postUrl, emojis, apiKey, tokenIndex) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
        const apiUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${apiKey}`;
        
        console.log(`📤 Making request to: ${apiUrl.substring(0, 60)}...`);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://asitha.top',
                'Referer': 'https://asitha.top/'
            },
            body: JSON.stringify({
                post_link: postUrl,
                reacts: Array.isArray(emojis) ? emojis : [emojis]
            }),
            signal: controller.signal,
            mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        // Check if response is ok
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
        
        return data;
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        // Re-throw the error with proper formatting
        throw {
            message: error.message || 'Request failed',
            status: error.status || 0,
            data: error.data || null
        };
    }
}

// Alternative function using Axios (as fallback)
async function makeRequestWithAxios(postUrl, emojis, apiKey, tokenIndex) {
    try {
        // Make sure axios is loaded
        if (typeof axios === 'undefined') {
            throw new Error('Axios not loaded');
        }
        
        const apiUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${apiKey}`;
        
        const response = await axios({
            method: 'POST',
            url: apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://asitha.top',
                'Referer': 'https://asitha.top/'
            },
            data: {
                post_link: postUrl,
                reacts: Array.isArray(emojis) ? emojis : [emojis]
            },
            timeout: 15000
        });
        
        console.log('✅ Success with Axios! Response:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Axios request failed:', error);
        
        if (error.response) {
            throw {
                message: error.response.data?.message || `HTTP ${error.response.status}`,
                status: error.response.status,
                data: error.response.data
            };
        } else if (error.request) {
            throw {
                message: 'No response received from server',
                status: 0,
                data: null
            };
        } else {
            throw {
                message: error.message || 'Axios setup error',
                status: 0,
                data: null
            };
        }
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
                JSON.stringify(result.error)}</span>
        </div>` : ''}
        ${result.success && result.data ? `
        <div class="result-success">
            <i class="fas fa-check-circle"></i>
            <span>Success: ${result.data.message || 'Reaction sent successfully'}</span>
        </div>` : ''}
    `;
    
    // Add animation delay based on existing results
    const existingResults = resultsList.children.length;
    const delay = existingResults * 0.1;
    resultElement.style.animationDelay = `${delay}s`;
    
    // Reset animation for new element
    resultElement.style.animation = 'none';
    setTimeout(() => {
        resultElement.style.animation = `slideInRight 0.5s ease ${delay}s forwards`;
    }, 10);
    
    // Add to top of results list
    if (resultsList.firstChild) {
        resultsList.insertBefore(resultElement, resultsList.firstChild);
    } else {
        resultsList.appendChild(resultElement);
    }
    
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
        const testUrl = 'https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app';
        const response = await fetch(testUrl, { 
            method: 'HEAD',
            mode: 'no-cors'
        });
        
        // If we can make the request (even with no-cors), the server is reachable
        console.log('✅ API server is reachable');
        return true;
    } catch (error) {
        console.log('❌ API server may be unreachable:', error.message);
        showNotification('API server mungkin sedang offline', 'warning');
        return false;
    }
}

// Initialize API test on load
setTimeout(() => {
    testAPIConnection();
}, 3000);

// Add CSS for result items
const style = document.createElement('style');
style.textContent = `
    .result-item {
        animation: slideInRight 0.5s ease forwards;
        opacity: 0;
    }
    
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
`;
document.head.appendChild(style);
