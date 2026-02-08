const supabaseUrl = 'https://wnajtvhshsfnzgrtcwub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYWp0dmhzaHNmbnpncnRjd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTM2NTUsImV4cCI6MjA4NTY4OTY1NX0.yGzxLL6oRg2SCs6g7UUdIMb7wmFPGFPC3IVDk5Da-HU'; 
const supa = supabase.createClient(supabaseUrl, supabaseKey);

const loader = document.getElementById('loaderOverlay');
const showL = () => loader.style.display = 'flex';
const hideL = () => loader.style.display = 'none';

let cachedAllTransactions = [];

function switchView(view) {
    document.getElementById('dashboardView').classList.toggle('active', view === 'dashboard');
    document.getElementById('transactionsView').classList.toggle('active', view === 'transactions');
    document.getElementById('navDash').classList.toggle('active', view === 'dashboard');
    document.getElementById('navTx').classList.toggle('active', view === 'transactions');
    
    if(view === 'transactions') loadAllTransactions();
    else loadPending();
}

async function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPass').value;
    if (email === "admin@payafrika.com" && password === "1234") {
        launchDashboard();
    } else {
        showL();
        const { data, error } = await supa.auth.signInWithPassword({ email, password });
        if (error) { alert("Invalid Credentials"); hideL(); return; }
        checkAdminAccess(data.user);
    }
}

async function checkAdminAccess(user) {
    const { data } = await supa.from('profiles').select('is_admin').eq('id', user.id).single();
    if (data?.is_admin) launchDashboard();
    else { alert("Access Denied"); handleLogout(); }
}

function launchDashboard() {
    document.getElementById('adminLoginOverlay').style.display = 'none';
    document.getElementById('adminContent').style.display = 'flex';
    loadPending();
    fetchCurrentRate();
}

async function fetchCurrentRate() {
    const { data } = await supa.from('exchange_rates').select('rate').eq('pair', 'ZAR_NGN').maybeSingle();
    if (data) {
        document.getElementById('newRateInput').value = data.rate;
        document.getElementById('rateStatus').innerText = `1 ZAR = ₦${data.rate}`;
    }
}

async function updateGlobalRate() {
    const newRate = parseFloat(document.getElementById('newRateInput').value);
    if (!newRate) return;
    showL();
    await supa.from('exchange_rates').upsert({ pair: 'ZAR_NGN', rate: newRate, updated_at: new Date() }, { onConflict: 'pair' });
    await fetchCurrentRate();
    hideL();
    showMsg("Rate Synchronized");
}

async function loadPending() {
    const tbody = document.getElementById('txBody');
    const { data: txs } = await supa.from('transactions').select('*').eq('status', 'pending');
    
    if (!txs || txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--slate-400);">No pending approvals.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    for (const tx of txs) {
        const { data: profile } = await supa.from('profiles').select('*').eq('id', tx.user_id).single();
        const row = document.createElement('tr');
        row.onclick = () => showTxDetails(tx);
        row.innerHTML = `
            <td style="font-size: 0.85rem;">${new Date(tx.created_at).toLocaleDateString()}</td>
            <td><strong>${profile?.first_name || 'User'}</strong><br><small style="color:var(--slate-400)">${profile?.email || ''}</small></td>
            <td><span style="text-transform: capitalize;">${tx.type}</span></td>
            <td style="font-weight: 700;">R${tx.amount}</td>
            <td><span class="badge badge-pending">${tx.status}</span></td>
            <td style="text-align: right;" onclick="event.stopPropagation()">
                <button class="btn btn-primary" onclick="approve('${tx.id}')">Approve</button>
            </td>
        `;
        tbody.appendChild(row);
    }
}

async function loadAllTransactions() {
    showL();
    const { data: txs } = await supa.from('transactions').select('*').order('created_at', { ascending: false });
    cachedAllTransactions = txs || [];
    renderAllTxTable(cachedAllTransactions);
    hideL();
}

function renderAllTxTable(txs) {
    const tbody = document.getElementById('allTxBody');
    tbody.innerHTML = txs.map(tx => `
        <tr onclick="showTxDetails(${JSON.stringify(tx).replace(/"/g, '&quot;')})">
            <td style="font-weight:700">${tx.reference}</td>
            <td>${new Date(tx.created_at).toLocaleDateString()}</td>
            <td title="${tx.user_id}">${tx.user_id.substring(0,8)}...</td>
            <td>${tx.method}</td>
            <td style="text-transform: capitalize;">${tx.type}</td>
            <td style="font-weight:700">R${tx.amount}</td>
            <td style="color:var(--rose)">R${tx.fee}</td>
            <td><span class="badge badge-${tx.status}">${tx.status}</span></td>
        </tr>
    `).join('');
}

function showTxDetails(tx) {
    const modal = document.getElementById('txModal');
    const content = document.getElementById('modalContent');
    const meta = tx.metadata || {};

    content.innerHTML = `
        <div class="detail-row"><span class="detail-label">Internal ID</span><span class="detail-value">${tx.id}</span></div>
        <div class="detail-row"><span class="detail-label">Reference</span><span class="detail-value">${tx.reference}</span></div>
        <div class="detail-row"><span class="detail-label">Timestamp</span><span class="detail-value">${new Date(tx.created_at).toLocaleString()}</span></div>
        <div class="detail-row"><span class="detail-label">Target Account</span><span class="detail-value" style="text-transform:uppercase;">${tx.target_account}</span></div>
        <div class="detail-row"><span class="detail-label">Recipient Info</span><span class="detail-value">${tx.recipient_info || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">Bank Details</span><span class="detail-value">${meta.bankDetails || 'Not Provided'}</span></div>
        <div class="detail-row"><span class="detail-label">Total Deducted</span><span class="detail-value">R${meta.totalDeducted || tx.amount}</span></div>
    `;
    modal.style.display = 'flex';
}

function filterAllTransactions() {
    const query = document.getElementById('txSearch').value.toLowerCase();
    const filtered = cachedAllTransactions.filter(t => 
        t.reference.toLowerCase().includes(query) || 
        t.user_id.toLowerCase().includes(query)
    );
    renderAllTxTable(filtered);
}

function exportToCSV() {
    if(!cachedAllTransactions.length) return;
    const headers = ["Reference", "Date", "User_ID", "Method", "Type", "Amount", "Fee", "Status"];
    const csvRows = [headers.join(",")];

    cachedAllTransactions.forEach(t => {
        const values = [
            t.reference,
            new Date(t.created_at).toISOString(),
            t.user_id,
            t.method,
            t.type,
            t.amount,
            t.fee,
            t.status
        ];
        csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `PayAfrika_Transactions_${new Date().toLocaleDateString()}.csv`);
    a.click();
}

async function approve(txId) {
    if(!confirm("Authorize this transaction?")) return;
    showL();
    await supa.from('transactions').update({ status: 'completed' }).eq('id', txId);
    await loadPending();
    hideL();
    showMsg("Approved");
}

function showMsg(txt) {
    const m = document.getElementById('statusMsg');
    m.innerText = "✓ " + txt;
    setTimeout(() => m.innerText = "", 3000);
}

async function handleLogout() { await supa.auth.signOut(); location.reload(); }

window.onload = async () => {
    const { data } = await supa.auth.getSession();
    if (data?.session) checkAdminAccess(data.session.user);
};