// Function to toggle password visibility
window.togglePassword = function(inputId, button) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        button.querySelector('.eye-icon').style.opacity = '1';
    } else {
        input.type = 'password';
        button.querySelector('.eye-icon').style.opacity = '0.7';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab');

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show/hide forms
            if (tabName === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            }
        });
    });

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to dashboard on successful login
                window.location.href = '/dashboard.html';
            } else {
                showError(loginForm, data.error);
            }
        } catch (err) {
            showError(loginForm, 'An error occurred. Please try again.');
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('registerFirstName').value;
        const lastName = document.getElementById('registerLastName').value;
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showError(registerForm, 'Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    first_name: firstName,
                    last_name: lastName,
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to dashboard on successful registration
                window.location.href = '/dashboard.html';
            } else {
                showError(registerForm, data.error);
            }
        } catch (err) {
            showError(registerForm, 'An error occurred. Please try again.');
        }
    });

    // Helper function to show error messages
    function showError(form, message) {
        const existingError = form.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        form.appendChild(errorDiv);
    }
});