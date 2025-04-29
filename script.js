document.addEventListener('DOMContentLoaded', function() {
    // Sayfa yüklendiğinde captcha oluştur (önceden HTML'de de bir tane var)
    generateCaptcha();
    
    // Set realistic initial stats based on date
    initializeRealisticStats();
    
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
    
    // Add realistic stats updates with time-based variations
    let lastUpdateTime = Date.now();
    
    setInterval(() => {
        const now = Date.now();
        const timeDiff = now - lastUpdateTime;
        
        // Only update if enough time has passed (create natural rhythm)
        if (timeDiff > 5000 && Math.random() > 0.7) {
            const hourOfDay = new Date().getHours();
            
            // More activity during business hours
            const isBusinessHours = hourOfDay >= 9 && hourOfDay <= 17;
            const activityFactor = isBusinessHours ? 0.8 : 0.3;
            
            if (Math.random() < activityFactor) {
                updateStatsWithActivity();
                lastUpdateTime = now;
            }
        }
    }, 3000);
    
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
            
            // Add coin animation
            createCoinAnimation(amount);
            
            // Update stats after transaction
            updateStatsAfterTransaction(amount);
        }, 3000);
    }
    
    // Initialize realistic stats based on current date
    function initializeRealisticStats() {
        const currentDate = new Date();
        const daysSinceStart = Math.floor((currentDate - new Date('2025-01-01')) / (24 * 60 * 60 * 1000));
        
        // Use a more realistic starting point
        let totalUsers = 12 + Math.floor(daysSinceStart * 1.2);
        
        // Calculate total tokens (mix of different amounts)
        let totalTokens = 0;
        for (let i = 0; i < totalUsers; i++) {
            // Distribute users across different token amounts
            const rand = Math.random();
            if (rand < 0.5) {
                totalTokens += 0.1; // 50% choose 0.1
            } else if (rand < 0.8) {
                totalTokens += 0.5; // 30% choose 0.5
            } else {
                totalTokens += 1.0; // 20% choose 1.0
            }
        }
        
        // Round to 1 decimal place for display
        totalTokens = Math.round(totalTokens * 10) / 10;
        
        let faucetBalance = 10000 - totalTokens;
        faucetBalance = Math.round(faucetBalance * 10) / 10;
        
        document.getElementById('usersServed').textContent = totalUsers.toLocaleString();
        document.getElementById('tokensDistributed').textContent = totalTokens.toLocaleString();
        document.getElementById('faucetBalance').textContent = faucetBalance.toLocaleString();
    }
    
    // Update stats with random activity
    function updateStatsWithActivity() {
        const usersServed = document.getElementById('usersServed');
        const tokensDistributed = document.getElementById('tokensDistributed');
        const faucetBalance = document.getElementById('faucetBalance');
        
        // Increment users
        let users = parseInt(usersServed.textContent.replace(/,/g, ''));
        users++;
        usersServed.textContent = users.toLocaleString();
        
        // Random amount for simulation
        const amounts = [0.1, 0.5, 1.0];
        const probabilities = [0.5, 0.3, 0.2]; // 50% choose 0.1, 30% choose 0.5, 20% choose 1.0
        let randIndex = 0;
        const rand = Math.random();
        let cumulativeProbability = 0;
        
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProbability += probabilities[i];
            if (rand < cumulativeProbability) {
                randIndex = i;
                break;
            }
        }
        
        const randAmount = amounts[randIndex];
        
        // Update tokens distributed
        let tokens = parseFloat(tokensDistributed.textContent.replace(/,/g, ''));
        tokens += randAmount;
        tokens = Math.round(tokens * 10) / 10; // Round to 1 decimal place
        tokensDistributed.textContent = tokens.toLocaleString();
        
        // Update balance
        let balance = parseFloat(faucetBalance.textContent.replace(/,/g, ''));
        balance -= randAmount;
        balance = Math.round(balance * 10) / 10; // Round to 1 decimal place
        faucetBalance.textContent = balance.toLocaleString();
    }
    
    // Update stats after a successful transaction
    function updateStatsAfterTransaction(amount) {
        const usersServed = document.getElementById('usersServed');
        const tokensDistributed = document.getElementById('tokensDistributed');
        const faucetBalance = document.getElementById('faucetBalance');
        
        // Increment users
        let users = parseInt(usersServed.textContent.replace(/,/g, ''));
        users++;
        usersServed.textContent = users.toLocaleString();
        
        // Update tokens distributed
        let tokens = parseFloat(tokensDistributed.textContent.replace(/,/g, ''));
        tokens += parseFloat(amount);
        tokens = Math.round(tokens * 10) / 10; // Round to 1 decimal place
        tokensDistributed.textContent = tokens.toLocaleString();
        
        // Update balance
        let balance = parseFloat(faucetBalance.textContent.replace(/,/g, ''));
        balance -= parseFloat(amount);
        balance = Math.round(balance * 10) / 10; // Round to 1 decimal place
        faucetBalance.textContent = balance.toLocaleString();
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

// Captcha oluştur
function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Captcha elementini bul ve içeriğini güncelle
    const captchaElement = document.getElementById('captchaText');
    if (captchaElement) {
        captchaElement.innerText = captcha;
    }
    
    // Captcha giriş alanını temizle
    const captchaInput = document.getElementById('captchaInput');
    if (captchaInput) {
        captchaInput.value = '';
    }
}

// Hata mesajını göster
function showError(message) {
    const resultBox = document.getElementById('resultBox');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    resultBox.style.display = 'block';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'block';
    
    // Reset button state
    const requestBtn = document.getElementById('requestBtn');
    requestBtn.innerHTML = '<span class="btn-text">Request Tokens</span><span class="btn-icon"><i class="fas fa-tint"></i></span>';
    requestBtn.disabled = false;
}

// Token miktarına göre coin animasyonu oluştur
function createCoinAnimation(amount) {
    const container = document.getElementById('coinAnimation');
    container.innerHTML = '';
    
    // Determine number of coins based on amount
    let numCoins = 1;
    let coinSize = 50;
    
    if (parseFloat(amount) <= 0.1) {
        numCoins = 1;
        coinSize = 30;
    } else if (parseFloat(amount) <= 0.5) {
        numCoins = 3;
        coinSize = 40;
    } else {
        numCoins = 5;
        coinSize = 50;
    }
    
    // Create coins
    for (let i = 0; i < numCoins; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.classList.add('coin');
            
            const posX = 30 + (Math.random() * 40); // Distribute coins horizontally across middle area
            
            coin.style.cssText = `
                position: absolute;
                width: ${coinSize}px;
                height: ${coinSize}px;
                background-color: gold;
                border-radius: 50%;
                box-shadow: 0 0 15px rgba(255,215,0,0.9), 0 0 30px rgba(255,215,0,0.3);
                left: ${posX}%;
                top: -${coinSize}px;
                z-index: 1;
                animation: fallAnimation 3s ease-in forwards;
            `;
            
            // Add M letter to the coin
            const letter = document.createElement('div');
            letter.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: ${coinSize * 0.6}px;
                color: rgba(0,0,0,0.5);
            `;
            letter.textContent = 'M';
            coin.appendChild(letter);
            
            container.appendChild(coin);
            
            // Add sparkle effects around the coin
            for (let j = 0; j < 3; j++) {
                setTimeout(() => {
                    const sparkle = document.createElement('div');
                    sparkle.style.cssText = `
                        position: absolute;
                        width: ${5 + Math.random() * 5}px;
                        height: ${5 + Math.random() * 5}px;
                        background-color: white;
                        border-radius: 50%;
                        box-shadow: 0 0 10px rgba(255,255,255,0.7);
                        left: ${posX + Math.random() * 10 - 5}%;
                        top: ${100 + Math.random() * 50}px;
                        z-index: 1;
                        opacity: 0.8;
                        animation: sparkle 1.5s ease-out forwards;
                    `;
                    container.appendChild(sparkle);
                    
                    setTimeout(() => {
                        sparkle.remove();
                    }, 1500);
                }, j * 300);
            }
            
            setTimeout(() => {
                coin.remove();
            }, 3000);
        }, i * 200);
    }
}
