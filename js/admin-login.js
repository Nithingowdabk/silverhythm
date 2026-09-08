// admin-login.js
// Handles the login functionality for the admin portal, moved from inline to comply with CSP.

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;

    loginBtn.addEventListener('click', async function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('loginError');
        const btn = this;

        if (!email || !password) {
            errorEl.textContent = 'Please enter both username/email and password.';
            errorEl.classList.add('visible');
            return;
        }

        errorEl.classList.remove('visible');
        btn.textContent = 'Authenticating...';
        btn.disabled = true;

        try {
            const response = await fetch('api/auth.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ email: email, password: password })
            });

            const data = await response.json();

            if (response.ok && data.user) {
                window.location.href = 'admin.php';
            } else {
                errorEl.textContent = data.message || 'Authentication failed.';
                errorEl.classList.add('visible');
                btn.textContent = 'Secure Entry';
                btn.disabled = false;
            }
        } catch(err) {
            errorEl.textContent = 'Connection error.';
            errorEl.classList.add('visible');
            btn.textContent = 'Secure Entry';
            btn.disabled = false;
        }
    });
});
