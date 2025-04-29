// Güvenli Faucet İşlemleri
document.addEventListener('DOMContentLoaded', function() {
    // Güvenli Captcha Oluşturma
    function generateSecureCaptcha() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        const crypto = window.crypto || window.msCrypto;
        const randomBytes = crypto.getRandomValues(new Uint8Array(6));
        
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(randomBytes[i] % chars.length);
        }
        
        document.getElementById('captchaText').innerText = captcha;
        document.getElementById('captchaInput').value = '';
    }

    // Gelişmiş Miden Adresi Doğrulama
    function validateMidenAddress(address) {
        // Miden adresi için kesin regex kontrolü
        const midenAddressRegex = /^0x[a-fA-F0-9]{40,64}$/;
        return midenAddressRegex.test(address);
    }

    // Güvenli Transaction ID Üretimi
    function generateSecureTxId() {
        const crypto = window.crypto || window.msCrypto;
        const randomBytes = crypto.getRandomValues(new Uint8Array(16));
        return '0x' + Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Rate Limiting için Gelişmiş Mekanizma
    const RequestTracker = {
        storage: {},
        
        logRequest: function(address) {
            const now = Date.now();
            const existingRequest = this.storage[address];
            
            // 24 saat içinde 1 kez token alma
            if (existingRequest && (now - existingRequest.timestamp) < 24 * 60 * 60 * 1000) {
                return false;
            }
            
            this.storage[address] = {
                timestamp: now,
                count: (existingRequest ? existingRequest.count : 0) + 1
            };
            
            return true;
        }
    };

    // Güvenli İstatistik Yönetimi
    const SecureFaucetStats = {
        maxFaucetBalance: 100000,
        dailyTokenLimit: 1000,

        // İstatistikleri başlatma
        initializeStats: function() {
            const storedStats = this.loadStats();
            this.updateDOMStats(storedStats);
            return storedStats;
        },

        // İstatistikleri yükleme
        loadStats: function() {
            const defaultStats = {
                usersServed: 0,
                tokensDistributed: 0,
                faucetBalance: this.maxFaucetBalance,
                lastUpdateTimestamp: Date.now(),
                dailyTokensDistributed: 0
            };

            try {
                const storedStatsJson = localStorage.getItem('MIDEN_FAUCET_STATS');
                if (storedStatsJson) {
                    const storedStats = JSON.parse(storedStatsJson);
                    
                    // Günlük token limitini sıfırlama
                    const now = Date.now();
                    const oneDayAgo = now - (24 * 60 * 60 * 1000);
                    
                    if (storedStats.lastUpdateTimestamp < oneDayAgo) {
                        storedStats.dailyTokensDistributed = 0;
                        storedStats.lastUpdateTimestamp = now;
                    }
                    
                    return { ...defaultStats, ...storedStats };
                }
                return defaultStats;
            } catch (error) {
                console.error('İstatistik yükleme hatası:', error);
                return defaultStats;
            }
        },

        // İstatistikleri kaydetme
        saveStats: function(stats) {
            try {
                localStorage.setItem('MIDEN_FAUCET_STATS', JSON.stringify(stats));
            } catch (error) {
                console.error('İstatistik kaydetme hatası:', error);
            }
        },

        // DOM'daki istatistikleri güncelleme
        updateDOMStats: function(stats) {
            document.getElementById('usersServed').textContent = 
                stats.usersServed.toLocaleString();
            
            document.getElementById('tokensDistributed').textContent = 
                stats.tokensDistributed.toLocaleString();
            
            document.getElementById('faucetBalance').textContent = 
                stats.faucetBalance.toLocaleString();
        },

        // Token dağıtım kontrolü
        canDistributeTokens: function(requestedAmount) {
            const stats = this.loadStats();
            
            return stats.dailyTokensDistributed + requestedAmount <= this.dailyTokenLimit &&
                   stats.faucetBalance >= requestedAmount;
        },

        // Token dağıtımını güncelleme
        updateTokenDistribution: function(requestedAmount) {
            const stats = this.loadStats();
            
            stats.usersServed += 1;
            stats.tokensDistributed += requestedAmount;
            stats.faucetBalance -= requestedAmount;
            stats.dailyTokensDistributed += requestedAmount;
            stats.lastUpdateTimestamp = Date.now();
            
            this.saveStats(stats);
            this.updateDOMStats(stats);
            
            return stats;
        }
    };

    // Token İsteği İşleme
    function processTokenRequest(address, amount) {
        // Güvenli transaction ID üretimi
        const txIdValue = generateSecureTxId();

        // Simüle edilmiş token isteği
        setTimeout(() => {
            // İşlem detaylarını güncelle
            document.getElementById('txId').textContent = txIdValue;
            document.getElementById('txAmount').textContent = amount;
            
            // Kullanıcı arayüzünü güncelle
            document.getElementById('resultBox').style.display = 'block';
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('errorMessage').style.display = 'none';
            
            // Form sıfırlama
            document.getElementById('faucetForm').reset();
            generateSecureCaptcha();
        }, 2000);
    }

    // Hata Mesajı Gösterme
    function showError(message) {
        const resultBox = document.getElementById('resultBox');
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        resultBox.style.display = 'block';
        successMessage.style.display = 'none';
        errorMessage.style.display = 'block';
    }

    // Form Gönderim İşleyicisi
    document.getElementById('faucetForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const addressInput = document.getElementById('addressInput');
        const captchaInput = document.getElementById('captchaInput');
        
        const address = addressInput.value.trim();
        const captchaInput = captchaInput.value.trim();
        const captchaText = document.getElementById('captchaText').innerText;
        
        // Adres doğrulama
        if (!validateMidenAddress(address)) {
            showError('Geçersiz Miden adresi. 0x ile başlayan 40-64 karakter arası hex adres kullanın.');
            return;
        }
        
        // Captcha doğrulama
        if (captchaInput.toUpperCase() !== captchaText.toUpperCase()) {
            showError('Captcha doğrulaması başarısız. Lütfen tekrar deneyin.');
            generateSecureCaptcha();
            return;
        }
        
        // Rate limiting kontrolü
        if (!RequestTracker.logRequest(address)) {
            showError('24 saat içinde bu adrese tekrar token alınamaz.');
            return;
        }
        
        // Seçilen token miktarı
        const selectedAmount = parseFloat(
            document.querySelector('.amount-btn.active').getAttribute('data-amount')
        );
        
        // Token dağıtım kontrolü
        if (!SecureFaucetStats.canDistributeTokens(selectedAmount)) {
            showError('Şu anda token dağıtımı yapılamıyor. Lütfen daha sonra tekrar deneyin.');
            return;
        }
        
        // Token dağıtımını güncelle
        SecureFaucetStats.updateTokenDistribution(selectedAmount);
        
        // Token isteği işleme
        processTokenRequest(address, selectedAmount);
    });

    // Sayfa yüklendiğinde istatistikleri başlat
    SecureFaucetStats.initializeStats();

    // İlk captcha oluşturma
    generateSecureCaptcha();

    // Amount button seçimi
    const amountButtons = document.querySelectorAll('.amount-btn');
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
