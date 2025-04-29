document.addEventListener('DOMContentLoaded', function() {
    // Gelişmiş Faucet İstatistik Yönetimi
    class EnhancedFaucetStats {
        constructor() {
            this.STATS_STORAGE_KEY = 'MIDEN_FAUCET_ENHANCED_STATS_V1';
            this.INITIAL_FAUCET_BALANCE = 10000000; // 10 milyon MIDO
            this.INITIAL_USERS_SERVED = 20;
            this.HOURLY_USERS_MIN = 30;
            this.HOURLY_USERS_MAX = 50;
            this.HOURLY_TOKENS_MIN = 100;
            this.HOURLY_TOKENS_MAX = 300;
            this.MAX_FAUCET_BALANCE = 15000000;
        }

        _secureRandom(min, max) {
            const crypto = window.crypto || window.msCrypto;
            const randomBuffer = new Uint32Array(1);
            crypto.getRandomValues(randomBuffer);
            
            const randomNumber = randomBuffer[0] / (0xFFFFFFFF + 1);
            return Math.floor(randomNumber * (max - min + 1)) + min;
        }

        _initializeStats() {
            const storedStats = this._loadStats();
            const now = Date.now();
            const lastUpdated = storedStats.lastUpdated || now;
            const hoursSinceLastUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60));
            
            const usersIncrease = this._secureRandom(
                this.HOURLY_USERS_MIN * hoursSinceLastUpdate, 
                this.HOURLY_USERS_MAX * hoursSinceLastUpdate
            );
            
            const tokensIncrease = this._secureRandom(
                this.HOURLY_TOKENS_MIN * hoursSinceLastUpdate, 
                this.HOURLY_TOKENS_MAX * hoursSinceLastUpdate
            );
            
            const updatedStats = {
                usersServed: Math.max(this.INITIAL_USERS_SERVED, storedStats.usersServed + usersIncrease),
                tokensDistributed: storedStats.tokensDistributed + tokensIncrease,
                faucetBalance: Math.max(0, Math.min(
                    this.MAX_FAUCET_BALANCE, 
                    this.INITIAL_FAUCET_BALANCE - storedStats.tokensDistributed - tokensIncrease
                )),
                lastUpdated: now
            };
            
            this._saveStats(updatedStats);
            this._updateDOMElements(updatedStats);
            
            return updatedStats;
        }

        _loadStats() {
            try {
                const storedStats = localStorage.getItem(this.STATS_STORAGE_KEY);
                
                if (storedStats) {
                    return JSON.parse(storedStats);
                }
                
                return {
                    usersServed: this.INITIAL_USERS_SERVED,
                    tokensDistributed: 0,
                    faucetBalance: this.INITIAL_FAUCET_BALANCE,
                    lastUpdated: Date.now()
                };
            } catch (error) {
                console.error('İstatistik yükleme hatası:', error);
                return {
                    usersServed: this.INITIAL_USERS_SERVED,
                    tokensDistributed: 0,
                    faucetBalance: this.INITIAL_FAUCET_BALANCE,
                    lastUpdated: Date.now()
                };
            }
        }

        _saveStats(stats) {
            try {
                localStorage.setItem(this.STATS_STORAGE_KEY, JSON.stringify(stats));
            } catch (error) {
                console.error('İstatistik kaydetme hatası:', error);
            }
        }

        _updateDOMElements(stats) {
            document.getElementById('usersServed').textContent = 
                stats.usersServed.toLocaleString();
            
            document.getElementById('tokensDistributed').textContent = 
                stats.tokensDistributed.toLocaleString();
            
            document.getElementById('faucetBalance').textContent = 
                stats.faucetBalance.toLocaleString();
        }

        canDistributeTokens(requestedAmount) {
            const currentStats = this._loadStats();
            return currentStats.faucetBalance >= requestedAmount;
        }

        simulateTokenDistribution(amount) {
            const currentStats = this._loadStats();
            
            const updatedStats = {
                usersServed: currentStats.usersServed + 1,
                tokensDistributed: currentStats.tokensDistributed + amount,
                faucetBalance: currentStats.faucetBalance - amount,
                lastUpdated: Date.now()
            };
            
            this._saveStats(updatedStats);
            this._updateDOMElements(updatedStats);
            
            return updatedStats;
        }

        setupPeriodicUpdate() {
            setInterval(() => {
                this._initializeStats();
            }, 60 * 60 * 1000);
        }

        initialize() {
            this._initializeStats();
            this.setupPeriodicUpdate();
        }
    }

    // Sayfa yüklendiğinde captcha oluştur
    generateCaptcha();
    
    // Set realistic initial stats based on date
    const faucetStats = new EnhancedFaucetStats();
    faucetStats.initialize();
    
    // Amount buttons
    const amountButtons = document.querySelectorAll('.amount-btn');
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Form submission
    const faucetForm = document.getElementById('faucetForm');
    const resultBox = document.getElementById('resultBox');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const txId = document.getElementById('txId');
    const txAmount = document.getElementById('txAmount');
    
    faucetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const address = document.getElementById('addressInput').value;
        const captchaInput = document.getElementById('captchaInput').value;
        const captchaText = document.getElementById('captchaText').innerText;
        
        // Get selected amount
        let selectedAmount = '0.1';
        document.querySelectorAll('.amount-btn').forEach(btn => {
            if (btn.classList.contains('active')) {
                selectedAmount = btn.getAttribute('data-amount');
            }
        });
        
        // Validate captcha
        if (captchaInput.toUpperCase() !== captchaText.toUpperCase()) {
            showError('Captcha verification failed. Please try again.');
            generateCaptcha();
            return;
        }
        
        // Validate address (simple validation for demo)
        if (!address || address.length < 10) {
            showError('Please enter a valid Miden address.');
            return;
        }
        
        // Check faucet balance
        if (!faucetStats.canDistributeTokens(parseFloat(selectedAmount))) {
            showError('Insufficient faucet balance. Please try again later.');
            return;
        }

        // Simulate token distribution
        faucetStats.simulateTokenDistribution(parseFloat(selectedAmount));
        
        // Check if the address was used recently (simulate cooldown)
        if (localStorage.getItem('lastRequest_' + address)) {
            const lastRequest = new Date(localStorage.getItem('lastRequest_' + address));
            const now = new Date();
            const hoursSince = (now - lastRequest) / (1000 * 60 * 60);
            
            if (hoursSince < 24) {
                const hoursLeft = Math.ceil(24 - hoursSince);
                showError(`This address has already received tokens. Please wait ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'} before requesting again.`);
                return;
            }
        }
        
        // Show loading state
        const requestBtn = document.getElementById('requestBtn');
        requestBtn.innerHTML = '<span class="btn-text">Processing...</span><span class="btn-icon"><i class="fas fa-spinner fa-spin"></i></span>';
        requestBtn.disabled = true;
        
        // Handle the token request with iframe fallback
        processTokenRequest(address, selectedAmount);
    });
    
    // Function to process token request
    function processTokenRequest(address, amount) {
        // Create a hidden iframe to load the faucet page in the background
        if (document.getElementById('faucetFrame')) {
            document.getElementById('faucetFrame').remove();
        }
        
        const iframe = document.createElement('iframe');
        iframe.id = 'faucetFrame';
        iframe.style.display = 'none';
        iframe.src = `http://141.11.109.169:8081/?address=${encodeURIComponent(address)}&amount=${amount}`;
        document.body.appendChild(iframe);
        
        // Create a simulated transaction ID
        const txIdValue = generateRealisticTxId();
        
        // Wait for a moment to simulate processing
        setTimeout(() => {
            // Store request time for this address
            localStorage.setItem('lastRequest_' + address, new Date().toString());
            
            // Show success UI
            txId.textContent = txIdValue;
            txAmount.textContent = amount;
            
            resultBox.style.display = 'block';
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            
            // Reset form
            faucetForm.reset();
            generateCaptcha();
            const requestBtn = document.getElementById('requestBtn');
            requestBtn.innerHTML = '<span class="btn-text">Request Tokens</span><span class="btn-icon"><i class="fas fa-tint"></i></span>';
            requestBtn.disabled = false;
        }, 3000);
    }
    
    // Generate realistic transaction ID
    function generateRealisticTxId() {
        const prefix = "0x";
        const chars = "0123456789abcdef";
        let txId = prefix;
        
        // Generate a 64 character hex string
        for (let i = 0; i < 64; i++) {
            txId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return txId;
    }
});

// Captcha generation function
function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const captchaElement = document.getElementById('captchaText');
    if (captchaElement) {
        captchaElement.innerText = captcha;
    }
    
    const captchaInput = document.getElementById('captchaInput');
    if (captchaInput) {
        captchaInput.value = '';
    }
}

// Error display function
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
