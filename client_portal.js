// Lexora Client Portal Script (JWT Guard & DB Sync Enabled)

document.addEventListener('DOMContentLoaded', () => {
    // Route Guard: Redirect to login.html if token missing
    const token = sessionStorage.getItem('lexora_token');
    const role = sessionStorage.getItem('lexora_role');
    const activeClient = sessionStorage.getItem('lexora_active_client') || '';

    if (!token || role !== 'client' || !activeClient) {
        sessionStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    // Secure fetchAPI helper
    function fetchAPI(url, options = {}) {
        const headers = Object.assign({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }, options.headers || {});
        
        const secureOptions = Object.assign({}, options, { headers });
        
        return fetch(url, secureOptions).then(async res => {
            const data = await res.json();
            if (res.status === 401 || res.status === 403) {
                sessionStorage.clear();
                window.location.href = 'login.html';
                throw new Error("Session expired. Redirecting...");
            }
            if (!res.ok) throw new Error(data.error || "API error occurred");
            return data;
        });
    }

    // 1. Client-side state arrays
    let clients = [];
    let cases = [];
    let invoices = [];
    let contracts = [];
    let appointments = [];
    let firmDetails = {};

    const clientDisplayName = document.getElementById('client-display-name');
    if (clientDisplayName) {
        clientDisplayName.textContent = activeClient.toUpperCase();
    }

    // 2. Fetch and Load Database Tables from Server APIs
    async function loadAllDatabaseTables() {
        try {
            const [clientsRes, casesRes, invoicesRes, contractsRes, appointmentsRes, settingsRes] = await Promise.all([
                fetchAPI('/api/clients'),
                fetchAPI('/api/cases'),
                fetchAPI('/api/invoices'),
                fetchAPI('/api/contracts'),
                fetchAPI('/api/appointments'),
                fetchAPI('/api/settings')
            ]);

            clients = clientsRes;
            cases = casesRes;
            invoices = invoicesRes;
            contracts = contractsRes;
            appointments = appointmentsRes;
            firmDetails = settingsRes;

            renderOverviewMilestones();
            renderClientInvoices();
            renderClientDocuments();
            renderClientAppointmentsList();
            applyFirmBranding();
            lucide.createIcons();
        } catch (err) {
            console.error("Error fetching client database tables:", err);
        }
    }

    // Check for returning Stripe Checkout redirect parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    if (paymentStatus === 'success') {
        const invId = urlParams.get('invoiceId');
        const amount = urlParams.get('amount');
        const clientName = urlParams.get('clientName');
        
        fetchAPI(`/api/invoices/${invId}/pay`, {
            method: 'PUT',
            body: JSON.stringify({ clientName, amount })
        })
        .then(() => {
            showToast("Stripe Payment transaction verified successfully!");
            triggerDBSyncNotification();
            window.history.replaceState({}, document.title, window.location.pathname);
            loadAllDatabaseTables();
        })
        .catch(err => showToast("Stripe payment verification failed."));
    }

    // 3. Inject Logo Icons
    const logoSlots = ['sidebar-logo-icon'];
    fetch('assets/logo_icon_light.svg')
        .then(res => res.text())
        .then(svgText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgContent = doc.documentElement.innerHTML;
            const viewBox = doc.documentElement.getAttribute('viewBox') || '0 0 200 200';
            
            logoSlots.forEach(slotId => {
                const el = document.getElementById(slotId);
                if (el) {
                    el.innerHTML = svgContent;
                    el.setAttribute('viewBox', viewBox);
                }
            });
        })
        .catch(err => console.error('Error loading client portal logos:', err));

    // Logout
    window.logOutClient = function() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    };

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logOutClient();
        });
    }

    // 5. Sidebar Router
    const menuItems = document.querySelectorAll('.menu-item');
    const tabViews = document.querySelectorAll('.tab-view');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            tabViews.forEach(view => {
                if (view.id === tabId) {
                    view.classList.add('active');
                } else {
                    view.classList.remove('active');
                }
            });
        });
    });

    // 6. Theme Toggle Logic
    const themeBtn = document.getElementById('btn-theme-toggle');
    themeBtn.addEventListener('click', () => {
        const body = document.body;
        const currentTheme = body.getAttribute('class');
        
        if (currentTheme === 'dark-theme') {
            body.setAttribute('class', 'light-theme');
            body.setAttribute('data-theme', 'light');
            themeBtn.innerHTML = `<i data-lucide="moon"></i>`;
        } else {
            body.setAttribute('class', 'dark-theme');
            body.setAttribute('data-theme', 'dark');
            themeBtn.innerHTML = `<i data-lucide="sun"></i>`;
        }
        lucide.createIcons();
    });

    // 7. Render Views Logic
    function renderOverviewMilestones() {
        const clientCases = cases; // Filtered by server automatically!
        const caseTitleText = document.getElementById('active-case-title');
        const progressBar = document.getElementById('milestone-progress-bar');
        
        const stepIntake = document.getElementById('step-intake');
        const stepResearch = document.getElementById('step-research');
        const stepDrafting = document.getElementById('step-drafting');
        const stepClosed = document.getElementById('step-closed');

        [stepIntake, stepResearch, stepDrafting, stepClosed].forEach(step => {
            step.className = 'timeline-step';
        });

        if (clientCases.length === 0) {
            caseTitleText.textContent = "No Active Matters Logged";
            progressBar.style.width = "0%";
            return;
        }

        const activeCase = clientCases[0];
        caseTitleText.textContent = activeCase.title;

        let progressWidth = "0%";
        if (activeCase.stage === 'intake') {
            progressWidth = "0%";
            stepIntake.classList.add('active');
        } else if (activeCase.stage === 'research') {
            progressWidth = "33%";
            stepIntake.classList.add('completed');
            stepResearch.classList.add('active');
        } else if (activeCase.stage === 'drafting') {
            progressWidth = "66%";
            stepIntake.classList.add('completed');
            stepResearch.classList.add('completed');
            stepDrafting.classList.add('active');
        } else if (activeCase.stage === 'closed') {
            progressWidth = "100%";
            stepIntake.classList.add('completed');
            stepResearch.classList.add('completed');
            stepDrafting.classList.add('completed');
            stepClosed.classList.add('completed');
        }

        progressBar.style.width = progressWidth;
    }

    function renderClientInvoices() {
        const tbody = document.getElementById('client-invoices-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--slate-500)">No invoices billed to your account.</td></tr>`;
            return;
        }

        invoices.forEach(inv => {
            const tr = document.createElement('tr');
            const actionBtn = inv.status === 'Unpaid' 
                ? `<button class="btn btn-gold btn-small" onclick="openPaymentModal(${inv.id}, ${inv.amount})">Pay Now</button>`
                : `<span class="badge-status active">Settled</span>`;
            
            tr.innerHTML = `
                <td><strong>#INV-${inv.id}</strong></td>
                <td>${inv.date}</td>
                <td>${inv.description}</td>
                <td class="gold-text"><strong>$${parseFloat(inv.amount).toLocaleString()}</strong></td>
                <td>
                    <span class="badge-status ${inv.status === 'Paid' ? 'active' : 'inactive'}">${inv.status}</span>
                </td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderClientDocuments() {
        const tbody = document.getElementById('client-documents-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (contracts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--slate-500)">No files pending review.</td></tr>`;
            return;
        }

        contracts.forEach(doc => {
            const tr = document.createElement('tr');
            const actionBtn = doc.status === 'Draft'
                ? `<button class="btn btn-gold btn-small" onclick="openSignatureModal(${doc.id})">Review & Sign</button>`
                : `<button class="btn btn-secondary btn-small" onclick="downloadSignedContract('${doc.title}')"><i data-lucide="download" style="width:12px; height:12px; margin-right:4px;"></i> Download</button>`;

            tr.innerHTML = `
                <td><strong>${doc.title}</strong></td>
                <td>${doc.type.toUpperCase()} File</td>
                <td>July 21, 2026</td>
                <td>
                    <span class="badge-status ${doc.status === 'Signed' ? 'active' : 'inactive'}" style="text-transform: capitalize;">${doc.status}</span>
                </td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
        lucide.createIcons();
    }

    // 8. Stripe Credit Card Payment Process
    const paymentModal = document.getElementById('payment-modal');
    const payTotalDisplay = document.getElementById('pay-total-amount');
    
    let activePayingInvId = null;
    let activePayingInvAmt = 0;

    window.openPaymentModal = function(invoiceId, amount) {
        activePayingInvId = invoiceId;
        activePayingInvAmt = amount;
        payTotalDisplay.textContent = `$${parseFloat(amount).toLocaleString()}`;
        paymentModal.classList.add('open');
    };

    window.closePaymentModal = function() {
        paymentModal.classList.remove('open');
        activePayingInvId = null;
        document.getElementById('stripe-payment-form').reset();
    };

    window.processCardPayment = function() {
        const payBtn = document.getElementById('btn-submit-payment');
        payBtn.disabled = true;
        payBtn.textContent = "Redirecting to Stripe Gateway...";

        fetchAPI('/api/payments/create-checkout', {
            method: 'POST',
            body: JSON.stringify({ invoiceId: activePayingInvId, amount: activePayingInvAmt, clientName: activeClient })
        })
        .then(data => {
            if (data.sandbox) {
                showToast("Sandbox payment authorized! Ledger cleared.");
                triggerDBSyncNotification();
                loadAllDatabaseTables();
                closePaymentModal();
                payBtn.disabled = false;
                payBtn.textContent = "Submit Secure Payment";
            } else if (data.url) {
                // Redirect to real Stripe!
                window.location.href = data.url;
            }
        })
        .catch(err => {
            showToast("Failed to verify transaction.");
            payBtn.disabled = false;
            payBtn.textContent = "Submit Secure Payment";
        });
    };

    // 9. HTML5 Digital Signature Pad Canvas Logic
    const signatureModal = document.getElementById('signature-modal');
    const signaturePad = document.getElementById('signature-pad');
    const sigDocTitle = document.getElementById('sig-doc-title');
    const sigPreviewText = document.getElementById('sig-contract-preview-text');

    let activeSigningDocId = null;
    let canvasContext = null;
    let drawing = false;

    function initCanvas() {
        if (!signaturePad) return;
        
        canvasContext = signaturePad.getContext('2d');
        canvasContext.strokeStyle = '#FFFFFF';
        canvasContext.lineWidth = 2.5;
        canvasContext.lineCap = 'round';
        canvasContext.lineJoin = 'round';

        signaturePad.addEventListener('mousedown', (e) => {
            drawing = true;
            const pos = getMousePos(signaturePad, e);
            canvasContext.beginPath();
            canvasContext.moveTo(pos.x, pos.y);
        });

        signaturePad.addEventListener('mousemove', (e) => {
            if (!drawing) return;
            const pos = getMousePos(signaturePad, e);
            canvasContext.lineTo(pos.x, pos.y);
            canvasContext.stroke();
        });

        window.addEventListener('mouseup', () => {
            drawing = false;
        });

        signaturePad.addEventListener('touchstart', (e) => {
            drawing = true;
            const touch = e.touches[0];
            const pos = getMousePos(signaturePad, touch);
            canvasContext.beginPath();
            canvasContext.moveTo(pos.x, pos.y);
            e.preventDefault();
        });

        signaturePad.addEventListener('touchmove', (e) => {
            if (!drawing) return;
            const touch = e.touches[0];
            const pos = getMousePos(signaturePad, touch);
            canvasContext.lineTo(pos.x, pos.y);
            canvasContext.stroke();
            e.preventDefault();
        });

        signaturePad.addEventListener('touchend', () => {
            drawing = false;
        });
    }

    function getMousePos(canvasDom, eventOrTouch) {
        const rect = canvasDom.getBoundingClientRect();
        return {
            x: (eventOrTouch.clientX - rect.left) * (canvasDom.width / rect.width),
            y: (eventOrTouch.clientY - rect.top) * (canvasDom.height / rect.height)
        };
    }

    window.openSignatureModal = function(docId) {
        activeSigningDocId = docId;
        const docObj = contracts.find(d => d.id === docId);
        
        if (docObj) {
            sigDocTitle.textContent = `Review & Sign: ${docObj.title}`;
            sigPreviewText.value = docObj.content;
        }

        signatureModal.classList.add('open');
        
        setTimeout(() => {
            initCanvas();
            clearSignatureCanvas();
        }, 100);
    };

    window.closeSignatureModal = function() {
        signatureModal.classList.remove('open');
        activeSigningDocId = null;
    };

    window.clearSignatureCanvas = function() {
        if (canvasContext && signaturePad) {
            canvasContext.clearRect(0, 0, signaturePad.width, signaturePad.height);
        }
    };

    window.applyDigitalSignature = function() {
        const blank = document.createElement('canvas');
        blank.width = signaturePad.width;
        blank.height = signaturePad.height;
        
        if (signaturePad.toDataURL() === blank.toDataURL()) {
            showToast("Please draw a signature first!");
            return;
        }

        const docObj = contracts.find(d => d.id === activeSigningDocId);
        if (!docObj) return;

        const signedContent = `${docObj.content}\n\n[DIGITALLY SIGNED VIA LEXORA CLIENT PORTAL]\nClient: ${activeClient.toUpperCase()}\nDate: ${new Date().toLocaleString()}`;

        fetchAPI(`/api/contracts/${activeSigningDocId}/sign`, {
            method: 'PUT',
            body: JSON.stringify({ content: signedContent })
        })
        .then(() => {
            showToast("Agreement signed successfully!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            closeSignatureModal();
        })
        .catch(err => showToast(err.message));
    };

    window.downloadSignedContract = function(title) {
        showToast(`Initiating download for: ${title}.pdf`);
    };

    // 10. Appointments Scheduling and List renders
    window.renderClientAppointmentsList = function() {
        const list = document.getElementById('client-appointments-list');
        if (!list) return;
        list.innerHTML = '';
        
        if (appointments.length === 0) {
            list.innerHTML = `<li><span style="color:var(--slate-500)">No appointments scheduled.</span></li>`;
            return;
        }
        
        appointments.slice().sort((a,b) => a.date.localeCompare(b.date)).forEach(a => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="appt-info">
                    <strong>${a.title}</strong>
                    <span>Status: Confirmed</span>
                </div>
                <div class="appt-date-badge">
                    <span>${a.date}</span><br>
                    <span style="font-size:0.7rem; opacity:0.8;">${a.time}</span>
                </div>
            `;
            list.appendChild(li);
        });
    }

    window.submitClientBookingForm = function() {
        const type = document.getElementById('book-appt-type').value;
        const date = document.getElementById('book-appt-date').value;
        const time = document.getElementById('book-appt-time').value;
        const notes = document.getElementById('book-appt-notes').value.trim();
        
        fetchAPI('/api/appointments', {
            method: 'POST',
            body: JSON.stringify({ client: activeClient, title: `${type} (${notes || 'No notes'})`, date, time, type: "Consultation" })
        })
        .then(() => {
            showToast("Consultation requested successfully!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            document.getElementById('book-appointment-form').reset();
        })
        .catch(err => showToast(err.message));
    }

    function applyFirmBranding() {
        if (!firmDetails.firm) return;
        const displayHost = document.getElementById('display-firm-host');
        if (displayHost) displayHost.textContent = firmDetails.firm.toUpperCase();
        
        const payFirm = document.getElementById('pay-firm-name');
        if (payFirm) payFirm.textContent = firmDetails.firm.toUpperCase();
    }

    // 11. State Sync Heartbeat
    function triggerDBSyncNotification() {
        localStorage.setItem('lexora_db_sync_trigger', Date.now().toString());
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'lexora_db_sync_trigger') {
            loadAllDatabaseTables();
        }
    });

    // Toast alert message utility
    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Startup Initializations
    loadAllDatabaseTables();
});
