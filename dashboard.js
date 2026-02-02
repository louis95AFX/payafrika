// 1. Initialize State
let balance = 12450.00; // Starting balance

// Helper function to update the balance on the screen
function updateBalanceUI() {
    const balanceElement = document.getElementById('currentBalance');
    if (balanceElement) {
        // Format to ZAR currency style
        balanceElement.innerText = `R ${balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

// 2. Modal Controls
function openModal(id) {
    document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// 3. Deposit Logic
function showDepositDetails(type) {
    closeModal('depositMethodModal');
    document.getElementById('depTitle').innerText = (type === 'EFT') ? 'Bank EFT Deposit' : 'ATM Cash Deposit';
    openModal('depositDetailsModal');
}

function handleDepositSubmit() {
    const file = document.getElementById('popUpload').value;
    const amountStr = prompt("Enter the amount you deposited (for simulation):", "1000");
    const amount = parseFloat(amountStr);

    if(!file) {
        alert("Please attach your proof of payment.");
        return;
    }

    if(isNaN(amount) || amount <= 0) {
        alert("Invalid amount.");
        return;
    }

    alert("Proof uploaded! Your balance will update once our team verifies the deposit (Simulating 3 second verification...).");
    closeModal('depositDetailsModal');

    // Simulate a delay for "Verification"
    setTimeout(() => {
        balance += amount;
        updateBalanceUI();
        alert(`Deposit Verified! R ${amount} has been added to your balance.`);
    }, 3000);
}

// 4. Send Money Logic
function handleSendMoney() {
    const code = document.getElementById('receiverCode').value.trim();
    const amountInput = document.getElementById('sendAmount');
    const amount = parseFloat(amountInput.value);

    if (code.length < 5) {
        alert("Please enter a valid PayAfrika Receiver Code.");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount to send.");
        return;
    }

    if (amount > balance) {
        alert("Insufficient funds for this transaction.");
        return;
    }

    const confirmSend = confirm(`Confirm transfer of R${amount.toFixed(2)} to ${code.toUpperCase()}?`);
    
    if (confirmSend) {
        // Deduct from balance
        balance -= amount;
        updateBalanceUI();

        alert(`Transaction Successful! R${amount.toFixed(2)} sent to ${code.toUpperCase()}.`);
        
        // Clear inputs and close
        amountInput.value = "";
        document.getElementById('receiverCode').value = "";
        closeModal('sendModal');
    }
}

// 5. Receive Money Logic
function showReceiveCode() {
    const randomCode = "PA-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    document.getElementById('userReceiveCode').innerText = randomCode;
    openModal('receiveModal');
    
    // Simulation: Randomly "receive" money while the modal is open
    // In a real app, this would be a WebSocket listener
}

// 6. Forex Ticker Logic
async function fetchForexRates() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/ZAR');
        const data = await response.json();
        if (data && data.rates) {
            const ngn = data.rates.NGN.toFixed(2);
            const jpy = data.rates.JPY.toFixed(2);
            const usd = (1 / data.rates.USD).toFixed(2);
            const gbp = (1 / data.rates.GBP).toFixed(2);

            document.getElementById('zarNgn').innerText = ngn;
            document.getElementById('zarNgn2').innerText = ngn;
            document.getElementById('zarJpy').innerText = jpy;
            document.getElementById('zarJpy2').innerText = jpy;
            document.getElementById('usdZar').innerText = "R" + usd;
            document.getElementById('gbpZar').innerText = "R" + gbp;
        }
    } catch (error) {
        console.error("Forex fetch failed");
    }
}

// 7. Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateBalanceUI();
    fetchForexRates();
    setInterval(fetchForexRates, 300000); // 5 mins
});
