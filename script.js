// Tokens API
const tokens = [
    "f7ca592b29b7f9eca59b352695a80e2a0cb9d1a0511b99bab913c947f1456c8b"
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
        if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
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

// Improved API function to react to post with better error handling
async function reactToPost(postUrl, emojis) {
    let attempts = 0;
    const maxAttempts = tokens.length;
    
    // Show initial attempt status
    console.log(`🚀 Starting reaction attempt to: ${postUrl.substring(0, 50)}...`);
    console.log(`🎭 Emojis: ${emojis.join(', ')}`);
    
    while (attempts < maxAttempts) {
        const apiKey = tokens[currentTokenIndex];
        
        // Update UI with current token attempt
        showNotification(`Mencoba dengan Token ${currentTokenIndex + 1}...`, 'info');
        
        try {
            console.log(`🔑 Attempt ${attempts + 1}: Using token index ${currentTokenIndex}`);
            
            // Prepare request data
            const requestData = {
                post_link: postUrl,
                reacts: Array.isArray(emojis) ? emojis : [emojis]
            };
            
            // Configure request with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
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
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                data: requestData,
                signal: controller.signal,
                timeout: 10000
            });
            
            clearTimeout(timeoutId);
            
            console.log('✅ Success! Response:', response.data);
            
            // Move to next token for next request
            currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
            
            return {
                success: true,
                data: response.data
            };
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle specific error types
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                console.log(`⏰ Timeout on token ${currentTokenIndex}`);
                showNotification(`Token ${currentTokenIndex + 1} timeout, mencoba token lain...`, 'warning');
            } else if (error.name === 'AbortError') {
                console.log(`🛑 Request aborted for token ${currentTokenIndex}`);
                showNotification(`Request dibatalkan, mencoba token lain...`, 'warning');
            } else if (error.response) {
                // Server responded with error status
                console.log(`❌ Token ${currentTokenIndex} failed with status ${error.response.status}:`, error.response.data);
                
                if (error.response.status === 402) {
                    console.log(`🔄 Token ${currentTokenIndex} limit (402), switching token`);
                    showNotification(`Token ${currentTokenIndex + 1} limit, ganti token...`, 'warning');
                    
                    currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
                    attempts++;
                    continue;
                }
                
                if (error.response.data?.message?.includes('limit') || error.response.data?.message?.includes('Limit')) {
                    console.log(`🔄 Token ${currentTokenIndex} limited, switching token`);
                    showNotification(`Token ${currentTokenIndex + 1} limited, ganti token...`, 'warning');
                    
                    currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
                    attempts++;
                    continue;
                }
                
                // Return the error for other status codes
                return {
                    success: false,
                    error: error.response.data,
                    status: error.response.status
                };
                
            } else if (error.request) {
                // Request was made but no response received
                console.log(`🌐 Network error with token ${currentTokenIndex}:`, error.message);
                
                // Check for CORS errors specifically
                if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
                    console.log(`🔄 CORS/Network issue, trying next token`);
                    showNotification(`Masalah jaringan dengan token ${currentTokenIndex + 1}, coba token lain...`, 'warning');
                }
            } else {
                // Something else happened
                console.log(`❓ Unknown error with token ${currentTokenIndex}:`, error.message);
            }
            
            // Try next token on any error
            currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
            attempts++;
            
            // If we've tried all tokens, break
            if (attempts >= maxAttempts) {
                console.log('❌ All tokens failed!');
                break;
            }
            
            // Small delay before trying next token
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log('❌ All tokens limited or failed!');
    return {
        success: false,
        error: 'All tokens are limited or failed',
        status: 402
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
                JSON.stringify(result.error)}</span>
        </div>` : ''}
        ${result.success && result.data ? `
        <div class="result-success">
            <i class="fas fa-check-circle"></i>
            <span>Reaction ID: ${result.data.id || 'N/A'}</span>
        </div>` : ''}
    `;
    
    // Add animation delay based on existing results
    const existingResults = resultsList.children.length;
    resultElement.style.animationDelay = `${existingResults * 0.1}s`;
    
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
    notification.textContent = message;
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
    `;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}" style="margin-right: 10px;"></i>
        ${message}
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

// Toggle theme (for future expansion)
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

// Add connection status monitoring
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
    `;
    
    connectionStatus.innerHTML = `
        <i class="fas fa-wifi"></i>
        <span>Online</span>
    `;
    
    document.body.appendChild(connectionStatus);
    
    // Update connection status
    window.addEventListener('online', () => {
        connectionStatus.innerHTML = `<i class="fas fa-wifi"></i><span>Online</span>`;
        connectionStatus.style.backgroundColor = '#06d6a0';
    });
    
    window.addEventListener('offline', () => {
        connectionStatus.innerHTML = `<i class="fas fa-wifi-slash"></i><span>Offline</span>`;
        connectionStatus.style.backgroundColor = '#ef476f';
        showNotification('Anda sedang offline. Periksa koneksi internet.', 'error');
    });
}

// Initialize connection monitoring
monitorConnection();