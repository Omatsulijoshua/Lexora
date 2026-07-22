// Lexora Authentication Controller

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons
    lucide.createIcons();

    // 2. Load and Inject SVG Logo Icon
    fetch('assets/logo_icon_light.svg')
        .then(res => res.text())
        .then(svgText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgContent = doc.documentElement.innerHTML;
            const viewBox = doc.documentElement.getAttribute('viewBox') || '0 0 200 200';
            
            const logoEl = document.getElementById('login-brand-logo');
            if (logoEl) {
                logoEl.innerHTML = svgContent;
                logoEl.setAttribute('viewBox', viewBox);
            }
        })
        .catch(err => console.error('Error loading login logo icon:', err));

    // 3. Tab Toggles
    const paneLogin = document.getElementById('pane-login');
    const paneSignup = document.getElementById('pane-signup');
    const btnLogin = document.getElementById('tab-login-btn');
    const btnSignup = document.getElementById('tab-signup-btn');

    window.switchLoginTab = function(tab) {
        if (tab === 'login') {
            paneLogin.classList.add('active');
            paneSignup.classList.remove('active');
            btnLogin.classList.add('active');
            btnSignup.classList.remove('active');
        } else {
            paneLogin.classList.remove('active');
            paneSignup.classList.add('active');
            btnLogin.classList.remove('active');
            btnSignup.classList.add('active');
        }
    };

    // Pre-fill firm name from query parameters if redirecting from wizard
    const urlParams = new URLSearchParams(window.location.search);
    const qFirm = urlParams.get('firm');
    if (qFirm) {
        switchLoginTab('signup');
        const signupFirmInput = document.getElementById('signup-firm');
        if (signupFirmInput) signupFirmInput.value = qFirm;
    }

    // 4. Submit Handlers
    window.handleAuthLogin = function() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login credentials unauthorized");
            return data;
        })
        .then(data => {
            // Save JWT Session details
            sessionStorage.setItem('lexora_token', data.token);
            sessionStorage.setItem('lexora_role', data.role);
            sessionStorage.setItem('lexora_email', data.email);
            sessionStorage.setItem('lexora_firm_name', data.firmName);
            
            if (data.role === 'client') {
                sessionStorage.setItem('lexora_active_client', data.client_name);
                showToast("Client Authentication Success! Authorizing session...");
                setTimeout(() => {
                    window.location.href = 'client_portal.html';
                }, 1000);
            } else {
                showToast("Lawyer Authentication Success! Launching workspace...");
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        })
        .catch(err => {
            showToast(err.message);
        });
    };

    window.handleAuthSignup = function() {
        const firmName = document.getElementById('signup-firm').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firmName, email, password })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Signup failed");
            return data;
        })
        .then(data => {
            // Save JWT Session details
            sessionStorage.setItem('lexora_token', data.token);
            sessionStorage.setItem('lexora_role', data.role);
            sessionStorage.setItem('lexora_email', data.email);
            sessionStorage.setItem('lexora_firm_name', data.firmName);

            showToast("Workspace Provisioned! Building Workspace...");
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        })
        .catch(err => {
            showToast(err.message);
        });
    };

    // Toast alerts utility
    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
});
