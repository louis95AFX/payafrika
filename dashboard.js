

// 1. Data State
let userData = {
    name: "John",
    walletBalance: 2500.50,
    pocketBalance: 1200.00,
    loanBalance: 450.00,
    loanLimit: 5000.00,
    currency: "R",
    transactions: [] // Added this line
};

// 2. Initialize Dashboard
window.onload = function() {
    updateUI();
    renderTicker();
    setInterval(renderTicker, 10000); // Update prices every 10s
};

// 3. The Navigation Function (Fixes your error)
function switchTab(viewName, btn) {
    // Hide all view sections
    const views = document.querySelectorAll('.view-content');
    views.forEach(view => view.style.display = 'none');

    // Remove 'active' class from all tab buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));

    // Show the specific view and highlight the clicked button
    document.getElementById(viewName + '-view').style.display = 'block';
    btn.classList.add('active');
}

// 4. UI Rendering Logic
function updateUI() {
    const fmt = (num) => num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    document.getElementById('displayUserName').innerText = userData.name;
    document.getElementById('walletBalanceDisplay').innerText = `${userData.currency} ${fmt(userData.walletBalance)}`;
    document.getElementById('pocketBalanceDisplay').innerText = `${userData.currency} ${fmt(userData.pocketBalance)}`;
    document.getElementById('loanBalanceDisplay').innerText = `${userData.currency} ${fmt(userData.loanBalance)}`;

    // Update Loan Progress
    const usagePercent = (userData.loanBalance / userData.loanLimit) * 100;
    document.getElementById('loanUsageBar').style.width = `${usagePercent}%`;
    document.getElementById('loanLimitText').innerText = `R ${fmt(userData.loanBalance)} of R ${fmt(userData.loanLimit)} limit used`;
}

// 5. Modal Controllers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        // Special logic for loan modal to show dynamic limit
        if(modalId === 'requestLoanModal') {
            const available = userData.loanLimit - userData.loanBalance;
            const limitText = document.getElementById('availableLimitText');
            if(limitText) limitText.innerText = `Available Credit: R ${available.toFixed(2)}`;
        }
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside the box
window.onclick = function(event) {
    if (event.target.classList.contains('db-modal')) {
        event.target.style.display = 'none';
    }
};

// 6. Action Executions
function executeDeposit() {
    const input = document.getElementById('depositInput');
    const rawAmount = parseFloat(input.value);
    const reference = document.getElementById('paymentReference').innerText;
    
    if (!rawAmount || rawAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // 1. Calculate Fees
    const feeAmount = rawAmount * currentFee;
    const finalAmount = rawAmount - feeAmount;

    // 2. Determine Destination
    const isPocket = document.getElementById('pocket-view').style.display === 'block';
    const destination = isPocket ? 'Pocket' : 'Wallet';
    
    if (isPocket) {
        userData.pocketBalance += finalAmount;
    } else {
        userData.walletBalance += finalAmount;
    }

    // 3. Update Transaction History
    addTransaction(`Deposit to ${destination}`, finalAmount, currentMethod, "Pending");

    // 4. Update UI & Feedback
    updateUI();
    alert(`Success! R${finalAmount.toFixed(2)} will be credited to your ${destination}.\nRef: ${reference}`);
    
    closeModal('depositActionModal');
    
    // 5. Reset Modal View for next time
    setTimeout(() => {
        document.getElementById('depositInputArea').style.display = 'block';
        document.getElementById('bankDetailsArea').style.display = 'none';
        input.value = '';
    }, 500);
}

function executeWithdraw() {
    const input = document.getElementById('withdrawInput');
    const amt = parseFloat(input.value);
    
    if (amt > 0 && amt <= userData.walletBalance) {
        userData.walletBalance -= amt;
        
        // Add to history
        addTransaction("Withdrawal", amt, "Bank Transfer", "Completed");

        updateUI();
        closeModal('withdrawModal');
        input.value = '';
        alert("Withdrawal Processed!");
    } else {
        alert("Invalid amount or insufficient funds.");
    }
}

function executeLoan() {
    const input = document.getElementById('loanRequestInput');
    const amt = parseFloat(input.value);
    const available = userData.loanLimit - userData.loanBalance;
    
    if (amt > 0 && amt <= available) {
        userData.loanBalance += amt;
        userData.walletBalance += amt;
        
        // Add to history
        addTransaction("Loan Payout", amt, "PayAfrika Credit", "Completed");

        updateUI();
        closeModal('actualLoanActionModal');
        input.value = '';
        alert("Loan Approved and Funded!");
    } else {
        alert("Amount exceeds limit.");
    }
}

function executeLoan() {
    const input = document.getElementById('loanRequestInput');
    const amt = parseFloat(input.value);
    const available = userData.loanLimit - userData.loanBalance;
    if (amt > 0 && amt <= available) {
        userData.loanBalance += amt;
        userData.walletBalance += amt;
        updateUI();
        closeModal('requestLoanModal');
        input.value = '';
        alert("Loan Approved and Funded!");
    } else {
        alert("Amount exceeds limit.");
    }
}

// 7. Ticker Logic
function renderTicker() {
    const ticker = document.getElementById('tickerWrapper');
    const rates = [
        { p: "USD/ZAR", v: (18.4 + Math.random()).toFixed(2) },
        { p: "GBP/ZAR", v: (23.2 + Math.random()).toFixed(2) },
        { p: "BTC/USD", v: "64,120" }
    ];
    ticker.innerHTML = rates.map(r => `<span><b>${r.p}:</b> ${r.v}</span>`).join('&nbsp;&nbsp;&nbsp;&nbsp;');
    // New Function: Handles the Registration Form
function submitLoanRegistration() {
    const name = document.getElementById('regName').value;
    const idNum = document.getElementById('regID').value;
    const income = document.getElementById('regIncome').value;

    // Simple validation
    if (name.length < 3 || idNum.length < 5 || !income) {
        alert("Please complete all fields correctly to verify your identity.");
        return;
    }

    // Simulate a verification delay
    const btn = event.target;
    btn.innerText = "Verifying Details...";
    btn.disabled = true;

    setTimeout(() => {
        closeModal('requestLoanModal');
        // Reset button
        btn.innerText = "Verify & Continue";
        btn.disabled = false;
        
        // Open the second step
        const available = userData.loanLimit - userData.loanBalance;
        document.getElementById('availableLimitText').innerText = `Approved Limit: R ${available.toFixed(2)}`;
        openModal('actualLoanActionModal');
    }, 1500); 
}

// Modified executeLoan to close the correct modal
function executeLoan() {
    const input = document.getElementById('loanRequestInput');
    const amt = parseFloat(input.value);
    const available = userData.loanLimit - userData.loanBalance;
    
    if (amt > 0 && amt <= available) {
        userData.loanBalance += amt;
        userData.walletBalance += amt;
        updateUI();
        closeModal('actualLoanActionModal'); // Close step 2
        input.value = '';
        alert("Success! Your loan has been approved and funded to your wallet.");
    } else {
        alert("Amount exceeds your available credit limit.");
    }
}
}

// Track the current deposit settings
let currentFee = 0;
let currentMethod = '';

// This function is called when a method (EFT, ATM, CASH) is clicked
function prepDeposit(method, fee) {
    currentMethod = method;
    currentFee = fee;
    
    closeModal('depositMethodModal');
    
    // Update the label in the next modal so the user sees the fee
    const feePercent = (fee * 100).toFixed(1);
    const feeText = fee > 0 ? ` (includes ${feePercent}% ${method} fee)` : " (Free)";
    
    openModal('depositActionModal');
    // Dynamically update the header of the action modal
    document.querySelector('#depositActionModal h3').innerText = `Deposit via ${method}`;
}

// Updated execution logic to handle fees and destinations
function executeDeposit() {
    const input = document.getElementById('depositInput');
    const rawAmount = parseFloat(input.value);
    
    if (isNaN(rawAmount) || rawAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // Calculate the fee and the final amount to be added
    const feeAmount = rawAmount * currentFee;
    const finalAmount = rawAmount - feeAmount;

    // Check which view is currently visible to decide where the money goes
    const isPocket = document.getElementById('pocket-view').style.display === 'block';

    if (isPocket) {
        userData.pocketBalance += finalAmount;
    } else {
        userData.walletBalance += finalAmount;
    }

    updateUI();
    closeModal('depositActionModal');
    input.value = '';

    const destination = isPocket ? "Pocket" : "Wallet";

    // Update Transaction History
    addTransaction(`Deposit to ${dest}`, finalAmount, currentMethod);
    alert(`Success! R${finalAmount.toFixed(2)} added to ${destination}.\n(${currentMethod} Fee: R${feeAmount.toFixed(2)})`);
}

// This runs every time the user types a number
function calculateLiveFee() {
    const input = document.getElementById('depositInput');
    const rawAmount = parseFloat(input.value) || 0;
    
    // Math logic
    const feeAmount = rawAmount * currentFee;
    const finalAmount = rawAmount - feeAmount;

    // Update UI labels
    document.getElementById('summaryFeePercent').innerText = (currentFee * 100).toFixed(1);
    document.getElementById('summaryFeeAmount').innerText = `- R ${feeAmount.toFixed(2)}`;
    document.getElementById('summaryTotalAmount').innerText = `R ${finalAmount.toFixed(2)}`;
}

// Updated prepDeposit to clear old numbers when switching methods
function prepDeposit(method, fee) {
    currentMethod = method;
    currentFee = fee;
    
    // Clear the input and reset the summary
    document.getElementById('depositInput').value = '';
    calculateLiveFee();
    
    closeModal('depositMethodModal');
    document.getElementById('depositModalTitle').innerText = `Deposit via ${method}`;
    openModal('depositActionModal');
}

// Update executeDeposit to use the same logic
function executeDeposit() {
    const input = document.getElementById('depositInput');
    const rawAmount = parseFloat(input.value);
    
    if (!rawAmount || rawAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const feeAmount = rawAmount * currentFee;
    const finalAmount = rawAmount - feeAmount;

    // Check destination (Wallet or Pocket)
    const isPocket = document.getElementById('pocket-view').style.display === 'block';
    
    if (isPocket) {
        userData.pocketBalance += finalAmount;
    } else {
        userData.walletBalance += finalAmount;
    }

    updateUI();
    closeModal('depositActionModal');
    
    // Success feedback
    alert(`Success! R${finalAmount.toFixed(2)} has been added to your ${isPocket ? 'Pocket' : 'Wallet'}.`);
}

// Function to show bank details after amount is entered
function showBankDetails() {
    const amount = document.getElementById('depositInput').value;
    
    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // 1. Determine Prefix based on active view
    const isPocket = document.getElementById('pocket-view').style.display === 'block';
    const prefix = isPocket ? "PS" : "PW";

    // 2. Generate Random 4-digit number
    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    // 3. Get Current Date (DDMMYY)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;

    // 4. Final Format: PW-####INV-DDMMYY or PS-####INV-DDMMYY
    const fullRef = `${prefix}-${randomNumber}INV-${dateStr}`;
    
    // Update UI
    document.getElementById('paymentReference').innerText = fullRef;

    // Switch views within the modal
    document.getElementById('depositInputArea').style.display = 'none';
    document.getElementById('bankDetailsArea').style.display = 'block';
}

// Update your existing executeDeposit to reset the view
function executeDeposit() {
    const input = document.getElementById('depositInput');
    const rawAmount = parseFloat(input.value);
    const reference = document.getElementById('paymentReference').innerText;
    
    if (!rawAmount || rawAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // Calculate Final Amount after Fee
    const feeAmount = rawAmount * currentFee;
    const finalAmount = rawAmount - feeAmount;

    // Check Destination
    const isPocket = document.getElementById('pocket-view').style.display === 'block';
    
    if (isPocket) {
        userData.pocketBalance += finalAmount;
    } else {
        userData.walletBalance += finalAmount;
    }

    // Refresh UI and Close
    updateUI();
    alert(`Success! R${finalAmount.toFixed(2)} will be credited to your ${isPocket ? 'Pocket' : 'Wallet'} once payment is verified.\nRef: ${reference}`);
    
    closeModal('depositActionModal');
    
    // Reset Modal for next time
    setTimeout(() => {
        document.getElementById('depositInputArea').style.display = 'block';
        document.getElementById('bankDetailsArea').style.display = 'none';
        input.value = '';
    }, 500);
}

// 1. Function to add a transaction to the list
function addTransaction(type, amount, method, status = "Completed") {
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const newTx = {
        date: dateStr,
        type: type, // e.g., "Deposit", "Withdrawal"
        amount: amount,
        method: method,
        status: status
    };

    userData.transactions.unshift(newTx); // Add to the start of the array
    renderTransactions();
}

// 2. Function to display transactions in the HTML
function renderTransactions() {
    const list = document.getElementById('transactionList');
    if (userData.transactions.length === 0) return;

    list.innerHTML = userData.transactions.map(tx => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 8px;">
            <div>
                <div style="font-weight: 600; font-size: 0.9rem;">${tx.type} (${tx.method})</div>
                <div style="font-size: 0.75rem; color: #888;">${tx.date}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: ${tx.type === 'Withdrawal' ? '#e74c3c' : '#2ecc71'};">
                    ${tx.type === 'Withdrawal' ? '-' : '+'} R ${tx.amount.toFixed(2)}
                </div>
                <div style="font-size: 0.7rem; color: #27ae60;">● ${tx.status}</div>
            </div>
        </div>
    `).join('');
}

// 3. Function to simulate PDF Download
function downloadReceipt() {
    const ref = document.getElementById('paymentReference').innerText;
    const amt = document.getElementById('depositInput').value;
    
    const receiptContent = `
        PAYAFRIKA OFFICIAL RECEIPT
        --------------------------
        Reference: ${ref}
        Amount: R ${amt}
        Date: ${new Date().toLocaleString()}
        Bank: FNB
        Status: PENDING VERIFICATION
        --------------------------
        Please keep this for your records.
    `;

    // Create a temporary link to download the text as a file
    const element = document.createElement('a');
    const file = new Blob([receiptContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${ref}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Function to show/hide the wallet address field
function toggleCryptoFields() {
    const tradeTo = document.getElementById('tradeTo').value;
    const externalField = document.getElementById('externalWalletGroup');
    
    if (tradeTo === 'KNG') {
        externalField.style.display = 'block';
    } else {
        externalField.style.display = 'none';
    }
}

function executeTrade() {
    const amount = parseFloat(document.getElementById('tradeAmount').value);
    const destination = document.getElementById('tradeTo').value;
    const walletAddr = document.getElementById('walletAddress').value;
    
    // 1. Basic Validation
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // 2. Check Balance (Assuming your balance variable is named currentBalance)
    // Replace 'userBalance' with whatever variable stores your ZAR amount
    if (amount > userBalance) {
        alert("Insufficient ZAR balance.");
        return;
    }

    // 3. Handle KNG External Transfer
    if (destination === 'KNG') {
        if (walletAddr.trim() === "") {
            alert("Please enter the destination KNG wallet address.");
            return;
        }
        
        const confirmSend = confirm(`Confirm conversion of R${amount} to KNG and sending to: ${walletAddr}?`);
        
        if (confirmSend) {
            // Deduct balance
            userBalance -= amount;
            
            // Update UI
            updateUI(); // Your existing function to refresh labels/balances
            
            // Log Transaction
            addTransaction("Debit", `Sent KNG to ${walletAddr.substring(0,6)}...`, -amount);
            
            alert("Transaction processing! KNG will arrive at the exchange shortly.");
            closeModal('tradeModal');
        }
    } else {
        // Handle normal internal trades (USD/BTC)
        alert(`Traded R${amount} for ${destination} successfully.`);
        closeModal('tradeModal');
    }
}

// Helper to add to your transaction list
function addTransaction(type, desc, amt) {
    const list = document.getElementById('transactionList');
    const date = new Date().toLocaleDateString();
    const html = `
        <div class="transaction-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <span><strong>${desc}</strong><br><small>${date}</small></span>
            <span style="color: ${amt < 0 ? '#e74c3c' : '#2ecc71'}">${amt < 0 ? '-' : '+'} R${Math.abs(amt).toFixed(2)}</span>
        </div>
    `;
    list.insertAdjacentHTML('afterbegin', html);
}