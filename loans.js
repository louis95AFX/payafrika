// REGISTER FORM LOGIC
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const password = this.querySelector('input[name="password"]').value;
    const confirm = document.getElementById('confirm_password').value;

    // Validate: Match passwords before sending to server
    if (password !== confirm) {
        alert("Passwords do not match. Please try again.");
        return; 
    }

    const formData = new FormData(this);

    fetch('auth.php?action=register', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Account created successfully! Switching to Login.');
            toggleAuth('login'); // Swaps the UI to the login tab
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error("Connection Error:", err);
        alert("Could not connect to the server.");
    });
});
function toggleAuth(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const indicator = document.querySelector('.tab-indicator');
    const buttons = document.querySelectorAll('.tab-btn');

    if (type === 'login') {
        // Toggle Forms
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        
        // Update Buttons
        buttons[0].classList.add('active');
        buttons[1].classList.remove('active');
        
        // Move Indicator
        indicator.style.left = '0%';
    } else {
        // Toggle Forms
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        
        // Update Buttons
        buttons[1].classList.add('active');
        buttons[0].classList.remove('active');
        
        // Move Indicator
        indicator.style.left = '50%';
    }
}
