const supabaseUrl = 'https://wnajtvhshsfnzgrtcwub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYWp0dmhzaHNmbnpncnRjd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTM2NTUsImV4cCI6MjA4NTY4OTY1NX0.yGzxLL6oRg2SCs6g7UUdIMb7wmFPGFPC3IVDk5Da-HU';
const supa = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentPocketBalance = 0;

// UI Logic
function openTab(evt, tabName) {
    // 1. Handle Tab Switching
    let contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.remove("active");
    }
    
    let buttons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }
    
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");

    // 2. Toggle History Visibility
    const historySection = document.querySelector('.history-section');
    if (tabName === 'loan') {
        historySection.style.display = 'none';
    } else {
        historySection.style.display = 'block';
        // Refresh history when switching back to wallet/pocket
        fetchTransactionHistory(); 
    }
}

function openModal() { document.getElementById('depositModal').style.display = 'block'; }
function closeModal() { document.getElementById('depositModal').style.display = 'none'; }

// Data Logic
async function checkUser() {
    const { data: { session } } = await supa.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }

    currentUser = session.user;
    document.getElementById('navUserName').textContent = currentUser.user_metadata.first_name || currentUser.email.split('@')[0];
    
    await fetchBalances();

    document.getElementById('loading').style.display = 'none';
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('dashboardUI').style.display = 'block';
}

async function fetchBalances() {
const { data, error } = await supa
.from('profiles')
.select('pocket_balance, wallet_balance')
.eq('id', currentUser.id)
.maybeSingle();

if (error) {
console.error("Error fetching balances:", error);
return;
}

if (data) {
// Update Wallet UI
const walletBal = data.wallet_balance || 0;
document.getElementById('walletBalanceDisplay').textContent = walletBal.toFixed(2);

// Update Pocket UI
const pocketBal = data.pocket_balance || 0;
document.getElementById('pocketBalanceDisplay').textContent = pocketBal.toFixed(2);

// Update local variable if you use it elsewhere
currentPocketBalance = pocketBal; 
} else {
// Create an initial profile record for new users if none exists
await supa.from('profiles').upsert({ 
    id: currentUser.id, 
    pocket_balance: 0, 
    wallet_balance: 0 
});
}
}

function openModal(type, target) {
    if (type === 'deposit') {
        document.getElementById('depositTarget').value = target;
        document.getElementById('modalTitle').textContent = `Deposit to ${target.charAt(0).toUpperCase() + target.slice(1)}`;
        document.getElementById('depositModal').style.display = 'block';
        updateBankDetails();
    } else if (type === 'withdraw') {
        document.getElementById('withdrawSource').value = target;
        document.getElementById('withdrawSourceText').textContent = target.charAt(0).toUpperCase() + target.slice(1);
        document.getElementById('withdrawModal').style.display = 'block';
    }
}

function closeModal() {
    document.getElementById('depositModal').style.display = 'none';
    document.getElementById('withdrawModal').style.display = 'none';
}



async function processDeposit() {
const amount = parseFloat(document.getElementById('depositAmount').value);
const method = document.getElementById('depositMethod').value;
const targetAccount = document.getElementById('depositTarget').value; // 'wallet' or 'pocket'
const btn = document.getElementById('depositSubmitBtn');

if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
}

btn.disabled = true;
btn.textContent = "Submitting...";

try {
    // Create Transaction with target_account column
    const { error: txError } = await supa
        .from('transactions')
        .insert([{ 
            user_id: currentUser.id, 
            amount: amount, 
            method: method, 
            type: 'deposit',
            target_account: targetAccount, // New field to tell admin where to credit
            // status: 'pending'
        }]);

    if (txError) throw txError;

    alert(`Deposit request for $${amount.toFixed(2)} to your ${targetAccount} submitted via ${method}. Funds will reflect once verified.`);
    closeModal();
    document.getElementById('depositAmount').value = '';
    
} catch (error) {
    alert("Submission failed: " + error.message);
} finally {
    btn.disabled = false;
    btn.textContent = "Confirm Deposit";
}
}

async function handleLogout() {
    await supa.auth.signOut();
    window.location.href = 'index.html';
}

window.onload = checkUser;

// 1. Define your bank details here
const bankDetails = {
"EFT": `<strong>Bank:</strong> First National Bank<br>
    <strong>Acc Name:</strong> PayAfrika Pty Ltd<br>
    <strong>Acc Number:</strong> 62839405961<br>
    <strong>Branch Code:</strong> 250655<br>
    <strong>Ref:</strong> [Your Name/Email]`,
    
"ATM": `<strong>Bank:</strong> Standard Bank<br>
    <strong>Acc Number:</strong> 1014958372<br>
    <strong>ATM Ref:</strong> Use your Phone Number`,
    
"OTC": `<strong>Bank:</strong> Absa Bank<br>
    <strong>Acc Name:</strong> PayAfrika Deposits<br>
    <strong>Acc Number:</strong> 409283746<br>
    <strong>Note:</strong> Keep your deposit slip!`
};

// 2. Function to update the UI when method changes
function updateBankDetails() {
const method = document.getElementById('depositMethod').value;
const detailsDiv = document.getElementById('bankDetailsContent');

// Inject the HTML based on the selection
detailsDiv.innerHTML = bankDetails[method] || "Select a method to see details";
}

// 3. Update your existing openModal to trigger the initial display
function openModal(type, target) {
    if (type === 'deposit') {
        document.getElementById('depositTarget').value = target;
        document.getElementById('modalTitle').textContent = `Deposit to ${target.charAt(0).toUpperCase() + target.slice(1)}`;
        document.getElementById('depositModal').style.display = 'block';
        updateBankDetails();
    } else if (type === 'withdraw') {
        document.getElementById('withdrawSource').value = target;
        document.getElementById('withdrawSourceText').textContent = target.charAt(0).toUpperCase() + target.slice(1);
        document.getElementById('withdrawModal').style.display = 'block';
    }
}

function closeModal() {
    document.getElementById('depositModal').style.display = 'none';
    document.getElementById('withdrawModal').style.display = 'none';

    // Initialize details when modal opens
updateBankDetails();
}




// Helper to generate the dynamic reference
function generateReference(target) {
if (!currentUser) return "N/A";

const prefix = target === 'wallet' ? 'PW' : 'PS';
const shortId = currentUser.id.substring(0, 4).toUpperCase();

// Format date: dd/mm/yy
const now = new Date();
const dd = String(now.getDate()).padStart(2, '0');
const mm = String(now.getMonth() + 1).padStart(2, '0');
const yy = String(now.getFullYear()).slice(-2);
const dateStr = `${dd}${mm}${yy}`;

return `${prefix}-${shortId}INV${dateStr}`;
}

// Updated bank details mapping (using a function to inject the ref)
function getBankDetailsHTML(method, reference) {
const details = {
"EFT": {
    bank: "First National Bank",
    accName: "PayAfrika Pty Ltd",
    accNum: "62839405961",
    branch: "250655"
},
"ATM": {
    bank: "Standard Bank",
    accName: "PayAfrika Pty Ltd",
    accNum: "1014958372",
    branch: "0001"
},
"OTC": {
    bank: "Absa Bank",
    accName: "PayAfrika Deposits",
    accNum: "409283746",
    branch: "632005"
}
};

const info = details[method];
return `
<strong>Bank:</strong> ${info.bank}<br>
<strong>Acc Name:</strong> ${info.accName}<br>
<strong>Acc Number:</strong> ${info.accNum}<br>
<strong>Reference:</strong> <span style="color: #ef4444; font-weight: 700;">${reference}</span>
`;
}

// Updated UI trigger
function updateBankDetails() {
const method = document.getElementById('depositMethod').value;
const target = document.getElementById('depositTarget').value;
const detailsDiv = document.getElementById('bankDetailsContent');

const ref = generateReference(target);
detailsDiv.innerHTML = getBankDetailsHTML(method, ref);
}

// Updated openModal
function openModal(type, target) {
    if (type === 'deposit') {
        document.getElementById('depositTarget').value = target;
        document.getElementById('modalTitle').textContent = `Deposit to ${target.charAt(0).toUpperCase() + target.slice(1)}`;
        document.getElementById('depositModal').style.display = 'block';
        updateBankDetails();
    } else if (type === 'withdraw') {
        document.getElementById('withdrawSource').value = target;
        document.getElementById('withdrawSourceText').textContent = target.charAt(0).toUpperCase() + target.slice(1);
        document.getElementById('withdrawModal').style.display = 'block';
    }
}

function closeModal() {
    document.getElementById('depositModal').style.display = 'none';
    document.getElementById('withdrawModal').style.display = 'none';
    updateBankDetails();

}


// Updated Process Deposit (to save the reference to Supabase)
async function processDeposit() {
const amount = parseFloat(document.getElementById('depositAmount').value);
const method = document.getElementById('depositMethod').value;
const targetAccount = document.getElementById('depositTarget').value;
const reference = generateReference(targetAccount); // Generate the same ref for DB
const btn = document.getElementById('depositSubmitBtn');

if (isNaN(amount) || amount <= 0) {
alert("Please enter a valid amount.");
return;
}

btn.disabled = true;
btn.textContent = "Submitting...";

try {
const { error: txError } = await supa
    .from('transactions')
    .insert([{ 
        user_id: currentUser.id, 
        amount: amount, 
        method: method, 
        type: 'deposit',
        target_account: targetAccount,
        reference: reference, // Ensure this column exists in your Supabase table
        // status: 'pending'
    }]);

if (txError) throw txError;

alert(`Deposit request submitted!\n\nPlease use Reference: ${reference}`);
closeModal();
document.getElementById('depositAmount').value = '';

} catch (error) {
alert("Submission failed: " + error.message);
} finally {
btn.disabled = false;
btn.textContent = "Confirm Deposit";
}
}

async function processWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const bankName = document.getElementById('withdrawBank').value.trim();
    const accNumber = document.getElementById('withdrawAccount').value.trim();
    const sourceAccount = document.getElementById('withdrawSource').value; // 'wallet' or 'pocket'
    const btn = document.getElementById('withdrawSubmitBtn');

    // 1. Basic Validation
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    if (!bankName || !accNumber) {
        alert("Please provide your bank details.");
        return;
    }

    // 2. Balance Validation (Prevent over-withdrawing)
    // We check against the variable updated in fetchBalances()
    const currentBalance = (sourceAccount === 'pocket') ? currentPocketBalance : parseFloat(document.getElementById('walletBalanceDisplay').textContent);
    
    if (amount > currentBalance) {
        alert(`Insufficient funds in your ${sourceAccount}. Current balance: R${currentBalance.toFixed(2)}`);
        return;
    }

    btn.disabled = true;
    btn.textContent = "Processing...";

    try {
        const { error: txError } = await supa
            .from('transactions')
            .insert([{ 
                user_id: currentUser.id, 
                amount: amount, 
                type: 'withdrawal',
                target_account: sourceAccount,
                method: 'Bank Transfer',
                reference: `WITHDRAW-${bankName.substring(0,3).toUpperCase()}`,
                // We store bank info in a metadata or note column if you have one, 
                // otherwise the admin checks user history.
                status: 'pending' 
            }]);

        if (txError) throw txError;

        alert(`Withdrawal request for R${amount.toFixed(2)} submitted. Please allow 24-48 hours for processing.`);
        closeModal();
        
        // Clear fields
        document.getElementById('withdrawAmount').value = '';
        document.getElementById('withdrawBank').value = '';
        document.getElementById('withdrawAccount').value = '';
        
    } catch (error) {
        alert("Withdrawal failed: " + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Confirm Withdrawal";
    }
}

async function fetchTransactionHistory() {
    const historyList = document.getElementById('historyList');
    
    const { data, error } = await supa
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10); // Show last 10 transactions

    if (error) {
        console.error("Error fetching history:", error);
        historyList.innerHTML = "<p>Could not load history.</p>";
        return;
    }

    if (!data || data.length === 0) {
        historyList.innerHTML = "<p style='padding:15px; font-size:0.9rem; color:#64748b;'>No transactions found.</p>";
        return;
    }

    historyList.innerHTML = data.map(tx => {
        const isDeposit = tx.type === 'deposit';
        const statusClass = tx.status === 'completed' ? 'status-completed' : 'status-pending';
        const date = new Date(tx.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });

        return `
            <div class="history-item">
                <div class="history-info">
                    <span class="history-type">${isDeposit ? '📥' : '📤'} ${tx.type} (${tx.target_account})</span>
                    <span class="history-date">${date} • Ref: ${tx.reference || 'N/A'}</span>
                </div>
                <div style="text-align: right;">
                    <div class="history-amount" style="color: ${isDeposit ? '#10b981' : '#ef4444'};">
                        ${isDeposit ? '+' : '-'} R${tx.amount.toFixed(2)}
                    </div>
                    <span class="status-badge ${statusClass}">${tx.status || 'pending'}</span>
                </div>
            </div>
        `;
    }).join('');
}