// --- CONFIGURATION & INITIALIZATION ---
const supabaseUrl = 'https://wnajtvhshsfnzgrtcwub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYWp0dmhzaHNmbnpncnRjd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTM2NTUsImV4cCI6MjA4NTY4OTY1NX0.yGzxLL6oRg2SCs6g7UUdIMb7wmFPGFPC3IVDk5Da-HU';
const supa = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentPocketBalance = 0;
let currentWalletBalance = 0;

// Configurable Rates
let EXCHANGE_RATE_NGN = 80.45;const FEE_RATES = {
    CASH: 0.05,          // 5% for Cash
    IMMEDIATE_EFT: 0.02, // 2% for Immediate EFT
    STANDARD_EFT: 0.00   // 0% for Standard
};

// --- AUTH & DATA FETCHING ---
async function checkUser() {
    const { data: { session } } = await supa.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }

    currentUser = session.user;
    
    // Fetch rate and balances in parallel for speed
    await Promise.all([fetchBalances(), fetchCurrentRate()]);

    document.getElementById('navUserName').textContent = currentUser.user_metadata.first_name || currentUser.email.split('@')[0];
    document.getElementById('loading').style.display = 'none';
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('dashboardUI').style.display = 'block';
    fetchTransactionHistory();
}

async function fetchBalances() {
    const { data, error } = await supa
        .from('profiles')
        .select('pocket_balance, wallet_balance')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (error) { console.error("Error fetching balances:", error); return; }

    if (data) {
        currentWalletBalance = data.wallet_balance || 0;
        currentPocketBalance = data.pocket_balance || 0;
        
        document.getElementById('walletBalanceDisplay').textContent = currentWalletBalance.toFixed(2);
        document.getElementById('pocketBalanceDisplay').textContent = currentPocketBalance.toFixed(2);
    } else {
        await supa.from('profiles').upsert({ id: currentUser.id, pocket_balance: 0, wallet_balance: 0 });
    }
}

// --- UI & MODAL CONTROL ---
function openTab(evt, tabName) {
    let contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");
    
    let buttons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove("active");
    
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");

    const historySection = document.querySelector('.history-section');
    if (tabName === 'loan') {
        historySection.style.display = 'none';
    } else {
        historySection.style.display = 'block';
        fetchTransactionHistory(); 
    }
}

function openModal(type, target = 'wallet') {
    if (type === 'deposit') {
        document.getElementById('depositTarget').value = target;
        document.getElementById('modalTitle').textContent = `Deposit to ${target.charAt(0).toUpperCase() + target.slice(1)}`;
        document.getElementById('depositModal').style.display = 'flex';
        updateBankDetails();
    } else if (type === 'withdraw') {
        document.getElementById('withdrawSource').value = target;
        document.getElementById('withdrawSourceText').textContent = target.charAt(0).toUpperCase() + target.slice(1);
        document.getElementById('withdrawModal').style.display = 'flex';
        toggleWithdrawFields(); // Initialize view
    } else if (type === 'trade') {
        document.getElementById('tradeModal').style.display = 'block';
        calculateExchange();
    }
}

function closeModal() {
    const modals = ['depositModal', 'withdrawModal', 'tradeModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if(modal) modal.style.display = 'none';
    });
}

// --- DEPOSIT LOGIC ---
function updateBankDetails() {
    const method = document.getElementById('depositMethod').value;
    const target = document.getElementById('depositTarget').value;
    const detailsDiv = document.getElementById('bankDetailsContent');
    
    const prefix = target === 'wallet' ? 'PW' : 'PS';
    const shortId = currentUser.id.substring(0, 4).toUpperCase();
    const ref = `${prefix}-${shortId}INV${new Date().getTime().toString().slice(-6)}`;

    const details = {
        "EFT": { bank: "First National Bank", accNum: "62839405961" },
        "ATM": { bank: "Standard Bank", accNum: "1014958372" },
        "OTC": { bank: "Absa Bank", accNum: "409283746" }
    };

    const info = details[method];
    detailsDiv.innerHTML = `
        <strong>Bank:</strong> ${info.bank}<br>
        <strong>Acc Number:</strong> ${info.accNum}<br>
        <strong>Reference:</strong> <span style="color: #ef4444; font-weight: 700;">${ref}</span>
    `;
    return ref;
}

async function processDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const method = document.getElementById('depositMethod').value;
    const targetAccount = document.getElementById('depositTarget').value; 
    const reference = updateBankDetails(); 
    const btn = document.getElementById('depositSubmitBtn');

    if (!amount || amount <= 0) { alert("Enter a valid amount."); return; }

    btn.disabled = true;
    try {
        const { error } = await supa.from('transactions').insert([{ 
            user_id: currentUser.id, amount, method, type: 'deposit',
            target_account: targetAccount, reference, status: 'pending'
        }]);
        if (error) throw error;
        alert("Deposit submitted. Funds will reflect after verification.");
        closeModal();
    } catch (e) { alert(e.message); } finally { btn.disabled = false; }
}

// --- WITHDRAWAL LOGIC (PERCENTAGE FEES) ---
function toggleWithdrawFields() {
    const method = document.getElementById('withdrawMethod').value;
    document.getElementById('eftFields').style.display = (method === 'EFT') ? 'block' : 'none';
    document.getElementById('cashFields').style.display = (method === 'CASH') ? 'block' : 'none';
    calculateWithdrawTotal();
}

function calculateWithdrawTotal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;
    const method = document.getElementById('withdrawMethod').value;
    const isImmediate = document.getElementById('immediatePayment').checked;
    
    let rate = 0;
    if (method === 'CASH') rate = FEE_RATES.CASH;
    else if (method === 'EFT' && isImmediate) rate = FEE_RATES.IMMEDIATE_EFT;

    const fee = amount * rate;
    const total = amount + fee;

    document.getElementById('feeDisplay').textContent = `R${fee.toFixed(2)}`;
    document.getElementById('withdrawTotalDisplay').textContent = `R${total.toFixed(2)}`;
    
    return { amount, fee, total, method: method + (isImmediate ? ' (Immediate)' : '') };
}

async function processWithdrawal() {
    const { amount, fee, total, method } = calculateWithdrawTotal();
    const bankDetails = document.getElementById('withdrawBank').value.trim();
    const sourceAccount = document.getElementById('withdrawSource').value;
    const btn = document.getElementById('withdrawSubmitBtn');
    const userName = document.getElementById('navUserName').textContent;

    if (amount <= 0) { alert("Enter a valid amount."); return; }
    
    const balance = (sourceAccount === 'pocket') ? currentPocketBalance : currentWalletBalance;
    if (total > balance) { alert(`Insufficient funds. Total needed: R${total.toFixed(2)}`); return; }

    btn.disabled = true;
    try {
        const reference = `WTH-${Math.floor(Math.random()*10000)}`;
        
        // 1. Insert into Supabase
        const { error } = await supa.from('transactions').insert([{ 
            user_id: currentUser.id, amount, fee, type: 'withdrawal',
            method, target_account: sourceAccount, status: 'pending',
            reference: reference,
            metadata: { bankDetails, totalDeducted: total }
        }]);

        if (error) throw error;

        // 2. Prepare WhatsApp Message
        const phoneNumber = "27658615896"; // International format for 0658615896
        let message = `*NEW WITHDRAWAL REQUEST*%0A`;
        message += `----------------------------%0A`;
        message += `*User:* ${userName}%0A`;
        message += `*Amount:* R${amount.toFixed(2)}%0A`;
        message += `*Fee:* R${fee.toFixed(2)}%0A`;
        message += `*Total Deduction:* R${total.toFixed(2)}%0A`;
        message += `*Method:* ${method}%0A`;
        message += `*Source:* ${sourceAccount.toUpperCase()}%0A`;
        message += `*Ref:* ${reference}%0A`;
        
        if (bankDetails) {
            message += `*Bank Details:* ${bankDetails}%0A`;
        }
        message += `----------------------------`;

        // 3. Open WhatsApp in a new tab
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');

        alert("Withdrawal request pending approval. WhatsApp notification sent.");
        closeModal();
        fetchBalances();
    } catch (e) { 
        alert(e.message); 
    } finally { 
        btn.disabled = false; 
    }
}

// --- TRADE LOGIC ---
function calculateExchange() {
    const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
    const result = amount * EXCHANGE_RATE_NGN;
    
    const rateDisplay = document.getElementById('currentRateDisplay');
    const resultDisplay = document.getElementById('exchangeResult');

    if (rateDisplay) rateDisplay.textContent = `1 ZAR = ${EXCHANGE_RATE_NGN} NGN`;
    if (resultDisplay) resultDisplay.innerText = `₦ ${result.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

async function processTrade() {
    const amount = parseFloat(document.getElementById('tradeAmount').value);
    const recipient = document.getElementById('tradeRecipient').value.trim();
    const btn = document.getElementById('tradeSubmitBtn');

    if (!amount || amount <= 0 || !recipient) { alert("Fill all fields."); return; }
    if (amount > currentPocketBalance) { alert("Insufficient Pocket funds."); return; }

    btn.disabled = true;
    try {
        const { error } = await supa.from('transactions').insert([{ 
            user_id: currentUser.id, amount, type: 'trade', method: 'ZAR to NGN',
            target_account: 'pocket', status: 'pending',
            reference: `TRD-NGN-${Math.floor(Math.random()*9000)}`,
            recipient_info: recipient
        }]);
        if (error) throw error;
        alert("Trade request submitted.");
        closeModal();
        fetchBalances();
    } catch (e) { alert(e.message); } finally { btn.disabled = false; }
}

// --- HISTORY & UTILS ---
async function fetchTransactionHistory() {
    const historyList = document.getElementById('historyList');
    const { data, error } = await supa.from('transactions')
        .select('*').eq('user_id', currentUser.id)
        .order('created_at', { ascending: false }).limit(10);

    if (error || !data || data.length === 0) {
        historyList.innerHTML = "<p>No recent activity.</p>";
        return;
    }

    historyList.innerHTML = data.map(tx => {
        const isDeposit = tx.type === 'deposit';
        return `
            <div class="history-item">
                <div class="history-info">
                    <span class="history-type">${isDeposit ? '📥' : '📤'} ${tx.type}</span>
                    <span class="history-date">${new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
                <div style="text-align: right;">
                    <div class="history-amount" style="color: ${isDeposit ? '#10b981' : '#ef4444'};">
                        ${isDeposit ? '+' : '-'} R${tx.amount.toFixed(2)}
                    </div>
                    <span class="status-badge status-${tx.status}">${tx.status}</span>
                </div>
            </div>`;
    }).join('');
}

let currentZarNgnRate = 80.45; // Default fallback

// 1. Fetch the rate from Supabase
async function fetchCurrentRate() {
    try {
        const { data, error } = await supa
            .from('exchange_rates') // Plural as per your SQL
            .select('rate')
            .eq('pair', 'ZAR_NGN')  // Column is 'pair'
            .maybeSingle();

        if (error) throw error;

        if (data && data.rate) {
            // Update the global value to 323
            EXCHANGE_RATE_NGN = parseFloat(data.rate); 
            
            // UPDATE THE HTML DISPLAY
            const rateDisplay = document.getElementById('currentRateDisplay');
            if (rateDisplay) {
                rateDisplay.textContent = `1 ZAR = ${EXCHANGE_RATE_NGN} NGN`;
            }
            
            // Refresh the "Recipient Gets" calculation if the modal is open
            if (typeof calculateExchange === "function") {
                calculateExchange();
            }
        }
    } catch (err) {
        console.error("Error fetching rate:", err.message);
        document.getElementById('currentRateDisplay').textContent = "Rate unavailable";
    }
}
// 2. Update the UI text
function updateRateUI() {
    const rateDisplay = document.getElementById('currentRateDisplay');
    if (rateDisplay) {
        rateDisplay.innerText = `1 ZAR = ${currentZarNgnRate} NGN`;
    }
}

// 3. Update your exchange calculation function
function calculateExchange() {
    const amountInput = document.getElementById('tradeAmount');
    const resultDisplay = document.getElementById('exchangeResult');
    
    // Use the live variable (which should now be 323)
    const zarAmount = parseFloat(amountInput.value) || 0;
    const ngnResult = zarAmount * EXCHANGE_RATE_NGN;

    // Update the "Recipient Gets" display
    if (resultDisplay) {
        resultDisplay.innerText = `₦ ${ngnResult.toLocaleString(undefined, {
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2
        })}`;
    }
}

// Call fetchCurrentRate() inside your initialization function (e.g., when the user logs in)

async function handleLogout() { await supa.auth.signOut(); window.location.href = 'index.html'; }

window.onload = checkUser;
window.onclick = (e) => { if (e.target.classList.contains('modal')) closeModal(); };