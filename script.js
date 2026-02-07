// Create Supabase client once and make it global
  window.supabase = supabase.createClient(
    'https://wnajtvhshsfnzgrtcwub.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYWp0dmhzaHNmbnpncnRjd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTM2NTUsImV4cCI6MjA4NTY4OTY1NX0.yGzxLL6oRg2SCs6g7UUdIMb7wmFPGFPC3IVDk5Da-HU'
  );

  document.addEventListener('DOMContentLoaded', () => {

// --- Toggle Auth Tabs ---
function toggleAuth(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.auth-tabs .tab-btn[onclick="toggleAuth('${tab}')"]`).classList.add('active');
}
window.toggleAuth = toggleAuth;

// --- Register New User ---
const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // 1. Identify the button and save original state
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  // Grab input values
  const firstName = registerForm.querySelector('input[placeholder="First Name"]').value.trim();
  const surname = registerForm.querySelector('input[placeholder="Surname"]').value.trim();
  const email = registerForm.querySelector('input[placeholder="Email Address"]').value.trim();
  const phone = registerForm.querySelector('input[placeholder="Phone Number"]').value.trim();
  const password = registerForm.querySelector('input[placeholder="Password"]').value;
  const repeatPassword = registerForm.querySelector('input[placeholder="Repeat Password"]').value;

  // 2. Validate fields with Toasts
  if (!firstName || !surname || !email || !phone || !password || !repeatPassword) {
    showToast('Please fill all fields', 'error');
    return;
  }

  if (password !== repeatPassword) {
    showToast('Passwords do not match!', 'error');
    return;
  }

  try {
    // 3. Start Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> Creating Account...`;

    // 4. Create user in Supabase Auth
    const { data, error: authError } = await window.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          surname: surname,
          phone: phone 
        }
      }
    });

    
    if (data?.user) {
      // NEW STEP: Manually create the profile row
      await window.supabase
        .from('profiles')
        .insert([
          { 
            id: data.user.id, 
            first_name: firstName, 
            pocket_balance: 0 
          }
        ]);
    }

    if (authError) {
      showToast(`Registration failed: ${authError.message}`, 'error');
      // Reset button so user can fix details
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }

    // 5. Success Toast
    showToast('Registration successful! Welcome aboard.');
    
    // Brief delay for the user to celebrate their new account
    setTimeout(() => {
      if (typeof toggleAuth === 'function') {
        toggleAuth('login');
      } else {
        window.location.href = '/dashboard.html';
      }
    }, 1500);

  } catch (error) {
    console.error('Registration Error:', error);
    showToast('An unexpected error occurred.', 'error');
    
    // Reset button on catch
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});
// --- Login Form ---
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML; // Save "Login" text

  const email = loginForm.querySelector('input[placeholder="Email Address"]').value.trim();
  const password = loginForm.querySelector('input[placeholder="Password"]').value;

  if (!email || !password) {
    showToast("Please enter both email and password.", "error");
    return;
  }

  try {
    // 1. Start Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> Logging in...`;

    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast(error.message, "error");
      // 2. Reset Button on Error
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }

    showToast("Welcome back! Redirecting...");
    
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1500);

  } catch (err) {
    showToast("An unexpected error occurred.", "error");
    // 3. Reset Button on Error
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});

function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: type === "success" ? "#22c55e" : "#ef4444", // Green for success, Red for error
      borderRadius: "8px",
      fontFamily: "sans-serif"
    }
  }).showToast();
}
function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    style: {
      background: type === "success" ? "#22c55e" : "#ef4444",
      borderRadius: "8px"
    }
  }).showToast();
}
// --- Admin Modal Logic ---
const modal = document.getElementById("authModal");
const btn = document.getElementById("adminBtn");
const closeSpan = document.getElementById("closeModal");

if(btn) btn.onclick = () => modal.style.display = "block";
if(closeSpan) closeSpan.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

// --- Loan Calculator ---
const loanAmt = document.getElementById("loanAmt");
const loanTerm = document.getElementById("loanTerm");
const amtDisplay = document.getElementById("amt-display");
const termDisplay = document.getElementById("term-display");
const monthlyResult = document.getElementById("monthlyResult");

const interestRate = 0.18; // 18% annual example

function formatCurrency(value) {
    return "R" + value.toLocaleString();
}

function updateSliderFill(slider) {
    const percent = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = 
        `linear-gradient(to right, #2ecc71 ${percent}%, #ddd ${percent}%)`;
}

function calculateLoan() {
    const amount = parseInt(loanAmt.value);
    const months = parseInt(loanTerm.value);
    const monthlyRate = interestRate / 12;

    const payment = 
        (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

    animateNumber(monthlyResult, payment);
    amtDisplay.textContent = formatCurrency(amount);
    termDisplay.textContent = `${months} months`;

    updateSliderFill(loanAmt);
    updateSliderFill(loanTerm);
}

function animateNumber(element, value) {
    const start = 0;
    const duration = 400;
    const startTime = performance.now();

    function animate(time) {
        const progress = Math.min((time - startTime) / duration, 1);
        const current = Math.floor(progress * value);
        element.textContent = formatCurrency(current);
        if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

loanAmt.addEventListener("input", calculateLoan);
loanTerm.addEventListener("input", calculateLoan);

// Init
calculateLoan();

const portal = document.querySelector('.portal-frame');

portal.addEventListener('mousemove', (e) => {
    const rect = portal.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 18;
    const rotateX = ((y / rect.height) - 0.5) * -18;

    portal.style.transform = 
        `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

portal.addEventListener('mouseleave', () => {
    portal.style.transform = 'rotateX(0) rotateY(0)';
});

const engine = document.querySelector('.payment-engine');
let direction = 1;

setInterval(() => {
    engine.style.transform = `translateY(${direction * 6}px)`;
    direction *= -1;
}, 1800);

const terminal = document.querySelector('.terminal-frame');
let tilt = 1;

setInterval(() => {
    terminal.style.transform =
        `rotateX(${tilt * 4}deg) rotateY(${tilt * -4}deg)`;
    tilt *= -1;
}, 2500);

const carousel = document.querySelector('.testimonials-carousel');
let scrollAmount = 0;
const scrollStep = 1;

function autoScroll() {
    if (!carousel) return;
    scrollAmount += scrollStep;
    if (scrollAmount > carousel.scrollWidth - carousel.clientWidth) {
        scrollAmount = 0;
    }
    carousel.scrollTo({ left: scrollAmount, behavior: 'smooth' });
}

setInterval(autoScroll, 30);

const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
        // Close other items
        faqItems.forEach(i => {
            if(i !== item) i.classList.remove('active');
        });

        // Toggle current
        item.classList.toggle('active');
    });
});

const icons = document.querySelectorAll('.social-icons a');

icons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
        icon.style.transform = 'scale(1.2) rotate(5deg)';
    });
    icon.addEventListener('mouseleave', () => {
        icon.style.transform = 'scale(1) rotate(0deg)';
    });
});
// --- Chatbot Logic ---
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');

const responseLogic = [
  { keywords: ['hi','hello','hey','greetings'], response: "Hi there! How are you today? How can PayAfrika help you?" },
  { keywords: ['loan','credit','money','borrow','apply'], response: "We offer personal and business loans from R1,000 to R500,000. You can use our calculator on this page to estimate your monthly repayments!" },
  { keywords: ['trade','b2b','nigeria','import','export','supplier'], response: "We facilitate seamless trade between SA and Nigeria, including supplier payments and logistics coordination. Would you like a trade consultation?" },
  { keywords: ['crypto','bitcoin','forex','exchange','currency','dollar','naira'], response: "We provide secure digital currency exchange and forex trading at competitive rates. We can assist with your settlement needs." },
  { keywords: ['thanks','thank you','okay','cool'], response: "You're very welcome! Let me know if you have any other questions." }
];


function addMessage(text, type) {
  const msg = document.createElement('div');
  msg.className = type === 'bot' ? 'bot-msg' : 'user-msg';
  msg.textContent = text;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function processInput(userInput) {
  const input = userInput.toLowerCase();
  let foundResponse = null;
  for (let item of responseLogic) {
    if (item.keywords.some(keyword => input.includes(keyword))) {
      foundResponse = item.response;
      break;
    }
  }
  setTimeout(() => {
    addMessage(foundResponse || "That sounds a bit complicated for me. Please hold a moment while I connect you with a PayAfrika consultant...", "bot");
  }, 800);
}

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== "") {
    const text = chatInput.value;
    addMessage(text, 'user');
    chatInput.value = "";
    processInput(text);
  }
});

window.handleInquiry = (key) => {
  const quickReplies = document.getElementById('quickReplies');
  if (quickReplies) quickReplies.style.display = 'none';
  const displayMap = { loans: "Loan Info", trade: "B2B Trade", crypto: "Crypto/Forex" };
  addMessage(displayMap[key], 'user');
  processInput(key);
};

});

// Move this OUTSIDE of document.addEventListener('DOMContentLoaded', () => { ... });
// --- Chatbot Logic ---
// We move the functions outside the event listener so HTML buttons can find them
function toggleChat() {
  const chat = document.getElementById('chatWindow');
  if (chat) {
    chat.style.display = (chat.style.display === 'flex') ? 'none' : 'flex';
  }
}

// Attach to window so onclick works
window.toggleChat = toggleChat;

document.addEventListener('DOMContentLoaded', () => {
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn'); // Define the send button

  const responseLogic = [
    { keywords: ['hi','hello','hey','greetings'], response: "Hi there! How are you today? How can PayAfrika help you?" },
    { keywords: ['loan','credit','money','borrow','apply'], response: "We offer personal and business loans from R1,000 to R500,000. You can use our calculator on this page to estimate your monthly repayments!" },
    { keywords: ['trade','b2b','nigeria','import','export','supplier'], response: "We facilitate seamless trade between SA and Nigeria, including supplier payments and logistics coordination." },
    { keywords: ['crypto','bitcoin','forex','exchange','currency','dollar','naira'], response: "We provide secure digital currency exchange and forex trading at competitive rates." },
    { keywords: ['thanks','thank you','okay','cool'], response: "You're very welcome! Let me know if you have any other questions." }
  ];

  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = type === 'bot' ? 'bot-msg' : 'user-msg';
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function processInput(userInput) {
    const input = userInput.toLowerCase();
    let foundResponse = null;
    for (let item of responseLogic) {
      if (item.keywords.some(keyword => input.includes(keyword))) {
        foundResponse = item.response;
        break;
      }
    }
    setTimeout(() => {
      addMessage(foundResponse || "That sounds a bit complicated for me. Please hold a moment while I connect you with a PayAfrika consultant...", "bot");
    }, 800);
  }

  // --- NEW: Function to handle the sending action ---
  function sendMessage() {
    const text = chatInput.value.trim();
    if (text !== "") {
      addMessage(text, 'user');
      chatInput.value = "";
      processInput(text);
    }
  }

  // Trigger on Send Button click
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  // Trigger on Enter key
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Handle Quick Replies
  window.handleInquiry = (key) => {
    const quickReplies = document.getElementById('quickReplies');
    if (quickReplies) quickReplies.style.display = 'none';
    const displayMap = { loans: "Loan Info", trade: "B2B Trade", crypto: "Crypto/Forex" };
    addMessage(displayMap[key], 'user');
    processInput(key);
  };
});

   // Toggle password visibility and swap eye icon
   function togglePassword(inputId, iconSpan) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        iconSpan.innerHTML = `
            <!-- Closed-eye icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 0 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 0 0 0 6 3 3 0 0 0 0-6z"/>
                <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2"/>
            </svg>`;
    } else {
        input.type = "password";
        iconSpan.innerHTML = `
            <!-- Open-eye icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
                <circle cx="12" cy="12" r="2.5"/>
            </svg>`;
    }
}

// Password match validation
const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', function(e) {
    const password = document.getElementById('password').value;
    const repeatPassword = document.getElementById('repeatPassword').value;
    if (password !== repeatPassword) {
        e.preventDefault();
        alert("Passwords do not match!");
    }
});

// Toggle password visibility for both forms
function togglePassword(inputId, iconSpan) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
      input.type = "text";
      iconSpan.innerHTML = `
          <!-- Closed-eye icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 0 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 0 0 0 6 3 3 0 0 0 0-6z"/>
              <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2"/>
          </svg>`;
  } else {
      input.type = "password";
      iconSpan.innerHTML = `
          <!-- Open-eye icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
              <circle cx="12" cy="12" r="2.5"/>
          </svg>`;
  }
}