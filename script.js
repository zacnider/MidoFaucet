// Gerçekçi Faucet İstatistik Yönetimi
document.addEventListener('DOMContentLoaded', function() {
    // Gelişmiş Captcha Oluşturma
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

    // Gerçekçi Faucet İstatistik Yönetimi Sınıfı
    class RealisticFaucetStats {
        constructor() {
            // Temel istatistik parametreleri
            this.STATS_STORAGE_KEY = 'MIDEN_FAUCET_REALISTIC_STATS_V2';
            
            // Gerçekçi sınır değerler
            this.MAX_FAUCET_BALANCE = 500000; // 500,000 MIDO
            this.DAILY_TOKEN_LIMIT = 50000; // Günlük 50,000 MIDO
            this.TYPICAL_REQUEST_AMOUNTS = [0.1, 0.5, 1.0];
            
            // Proje başlangıç tarihi
            this.PROJECT_START_DATE = new Date('2024-03-15');
        }

        // Güvenli rastgele sayı üretimi
        _secureRandom(min, max) {
            const crypto = window.crypto || window.msCrypto;
            const randomBuffer = new Uint32Array(1);
            crypto.getRandomValues(randomBuffer);
            
            const randomNumber = randomBuffer[0] / (0xFFFFFFFF + 1);
            return Math.floor(randomNumber * (max - min + 1)) + min;
        }

        // Gerçekçi istatistik hesaplama
        _calculateRealisticStats() {
            // Proje başlangıcından bu yana geçen günler
            const daysSinceStart = Math.floor(
                (new Date() - this.PROJECT_START_DATE) / (24 * 60 * 60 * 1000)
            );

            // Günlük kullanıcı ve token tahminleri
            const dailyUsers = this._calculateDailyUsers(daysSinceStart);
            const dailyTokens = this._calculateDailyTokens(dailyUsers);

            // Toplam istatistikler
            const totalUsers = Math.floor(dailyUsers * daysSinceStart);
            const totalTokensDistributed = Math.floor(dailyTokens * daysSinceStart);

            // Faucet bakiyesi hesaplama
            const initialBalance = 500000;
            const faucetBalance = Math.max(
                0, 
                Math.floor(initialBalance - totalTokensDistributed)
            );

            return {
                usersServed: totalUsers,
                tokensDistributed: totalTokensDistributed,
                faucetBalance: faucetBalance,
                dailyUsers: dailyUsers,
                dailyTokens: dailyTokens
            };
        }

        // Günlük kullanıcı sayısı tahmini
        _calculateDailyUsers(daysSinceStart) {
            // Başlangıçta daha düşük, zamanla artan kullanıcı sayısı
            const baseUsers = 10; // Günlük başlangıç kullanıcı sayısı
            const growthFactor = 1.05; // Haftalık %5 büyüme
            
            return Math.floor(
                baseUsers * Math.pow(growthFactor, daysSinceStart / 7)
            );
        }

        // Günlük token dağıtımı tahmini
        _calculateDailyTokens(dailyUsers) {
            // Kullanıcı başına ortalama token miktarı
            const averageTokensPerUser = this.TYPICAL_REQUEST_AMOUNTS.reduce((a, b) => a + b, 0) / 
                this.TYPICAL_REQUEST_AMOUNTS.length;
            
            return Math.floor(dailyUsers * averageTokensPerUser);
        }

        // İstatistikleri güncelleme
        updateStats() {
            const realisticStats = this._calculateRealisticStats();
            
            // DOM elemanlarını güncelleme
            this._updateDOMElements(realisticStats);
            
            // Yerel depolamaya kaydetme
            this._saveStatsToLocalStorage(realisticStats);
            
            return realisticStats;
        }

        // DOM elemanlarını güncelleme
        _updateDOMElements(stats) {
            document.getElementById('usersServed').textContent = 
                stats.usersServed.toLocaleString();
            
            document.getElementById('tokensDistributed').textContent = 
                stats.tokensDistributed.toLocaleString();
            
            document.getElementById('faucetBalance').textContent = 
                stats.faucetBalance.toLocaleString();
        }

        // Yerel depolamaya kaydetme
        _saveStatsToLocalStorage(stats) {
            try {
                localStorage.setItem(
                    this.STATS_STORAGE_KEY, 
                    JSON.stringify({
                        ...stats,
                        lastUpdated: Date.now()
                    })
                );
            } catch (error) {
                console.error('İstatistik kaydetme hatası:', error);
            }
        }

        // Token dağıtım kontrolü
        canDistributeTokens(requestedAmount) {
            const stats = this._calculateRealisticStats();
            
            return stats.faucetBalance >= requestedAmount &&
                   requestedAmount <= this.DAILY_TOKEN_LIMIT;
        }

        // Token dağıtımını simüle etme
        simulateTokenDistribution(amount) {
            const currentStats = this._calculateRealisticStats();
            
            // Küçük günlük varyasyonlar ekle
            const randomVariation = this._secureRandom(-5, 5);
            
            // Güncellenmiş istatistikler
            const updatedStats = {
                usersServed: currentStats.usersServed + 1,
                tokensDistributed: currentStats.tokensDistributed + amount,
                faucetBalance: currentStats.faucetBalance - amount
            };
            
            // DOM ve depolamayı güncelle
            this._updateDOMElements(updatedStats);
            this._saveStatsToLocalStorage(updatedStats);
            
            return updatedStats;
        }

        // Periyodik güncelleme
        setupPeriodicUpdate() {
            // Her 5 dakikada bir hafif güncellemeler
            setInterval(() => {
                this.updateStats();
            }, 5 * 60 * 1000);
        }
    }

    // Güvenli transaction ID üretimi
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

    // Gerçekçi istatistik yöneticisini başlat
    const faucetStats = new RealisticFaucetStats();
    
    // İstatistikleri başlangıçta güncelle
    faucetStats.updateStats();
    
    // Periyodik güncellemeleri başlat
    faucetStats.setupPeriodicUpdate();
    
    // Form gönderimi için olay dinleyicisi
    document.getElementById('faucetForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const addressInput = document.getElementById('addressInput');
        const captchaInput = document.getElementById('captchaInput');
        
        const address = addressInput.value.trim();
        const captchaInputValue = captchaInput.value.trim();
        const captchaText = document.getElementById('captchaText').innerText;
        
        // Adres doğrulama
        if (!validateMidenAddress(address)) {
            showError('Geçersiz Miden adresi. 0x ile başlayan 40-64 karakter arası hex adres kullanın.');
            return;
        }
        
        // Captcha doğrulama
        if (captchaInputValue.toUpperCase() !== captchaText.toUpperCase()) {
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
        if (faucetStats.canDistributeTokens(selectedAmount)) {
            // Token dağıtımını simüle et
            faucetStats.simulateTokenDistribution(selectedAmount);
            
            // Token isteği işleme
            processTokenRequest(address, selectedAmount);
        } else {
            // Hata mesajı göster
            showError('Şu anda token dağıtımı yapılamıyor. Lütfen daha sonra tekrar deneyin.');
        }
    });

    // Amount button seçimi
    const amountButtons = document.querySelectorAll('.amount-btn');
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // İlk captcha oluşturma
    generateSecureCaptcha();
});

// Hata mesajı gösterme fonksiyonu
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
