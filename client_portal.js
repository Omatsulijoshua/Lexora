// Lexora Client Portal Script (Database Sync Enabled)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Client-side state arrays
    let clients = [];
    let cases = [];
    let invoices = [];
    let contracts = [];
    let appointments = [];
    let firmDetails = {};

    let activeClient = sessionStorage.getItem('lexora_active_client') || '';

    // 2. Fetch and Load Database Tables from Server APIs
    async function loadAllDatabaseTables() {
        try {
            const [clientsRes, casesRes, invoicesRes, contractsRes, appointmentsRes, settingsRes] = await Promise.all([
                fetch('/api/clients').then(res => res.json()),
                fetch('/api/cases').then(res => res.json()),
                fetch('/api/invoices').then(res => res.json()),
                fetch('/api/contracts').then(res => res.json()),
                fetch('/api/appointments').then(res => res.json()),
                fetch('/api/settings').then(res => res.json())
            ]);

            clients = clientsRes;
            cases = casesRes;
            invoices = invoicesRes;
            contracts = contractsRes;
            appointments = appointmentsRes;
            firmDetails = settingsRes;

            // Re-populate client login dropdown selector
            populateLoginSelector();

            // Refresh active client views if authenticated
            if (activeClient) {
                renderOverviewMilestones();
                renderClientInvoices();
                renderClientDocuments();
                renderClientAppointmentsList();
                applyFirmBranding();
            }
            lucide.createIcons();
        } catch (err) {
            console.error("Error fetching client database tables:", err);
        }
    }

    function populateLoginSelector() {
        const clientSelect = document.getElementById('client-select-login');
        if (!clientSelect) return;
        
        const currentSelectedVal = clientSelect.value;
        clientSelect.innerHTML = '';
        
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            clientSelect.appendChild(opt);
        });

        if (currentSelectedVal) {
            clientSelect.value = currentSelectedVal;
        }
    }

    // 3. Inject Logo Icons
    const logoSlots = ['login-logo-icon', 'sidebar-logo-icon'];
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

    // 4. Authenticate Logic
    const clientSelect = document.getElementById('client-select-login');
    const loginGate = document.getElementById('login-gate');
    const portalMain = document.getElementById('portal-main');
    const clientDisplayName = document.getElementById('client-display-name');

    window.authenticateClient = function() {
        const clientName = clientSelect.value;
        if (!clientName) return;

        sessionStorage.setItem('lexora_active_client', clientName);
        activeClient = clientName;
        
        loginGate.style.display = 'none';
        portalMain.style.display = 'flex';
        
        clientDisplayName.textContent = clientName.toUpperCase();
        
        // Refresh active views
        renderOverviewMilestones();
        renderClientInvoices();
        renderClientDocuments();
        renderClientAppointmentsList();
        applyFirmBranding();
        showToast(`Secure session authorized for ${clientName}`);
        
        lucide.createIcons();
    };

    window.logOutClient = function() {
        sessionStorage.removeItem('lexora_active_client');
        activeClient = '';
        loginGate.style.display = 'flex';
        portalMain.style.display = 'none';
    };

    // Auto-login if session exists
    if (activeClient) {
        loginGate.style.display = 'none';
        portalMain.style.display = 'flex';
        clientDisplayName.textContent = activeClient.toUpperCase();
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
        const clientCases = cases.filter(c => c.client === activeClient);
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

        const clientInvs = invoices.filter(inv => inv.client === activeClient);

        if (clientInvs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--slate-500)">No invoices billed to your account.</td></tr>`;
            return;
        }

        clientInvs.forEach(inv => {
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

        const clientDocs = contracts.filter(doc => doc.client === activeClient);

        if (clientDocs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--slate-500)">No files pending review.</td></tr>`;
            return;
        }

        clientDocs.forEach(doc => {
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
        payBtn.textContent = "Processing Trust Escrow Authorization...";

        fetch(`/api/invoices/${activePayingInvId}/pay`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientName: activeClient, amount: activePayingInvAmt })
        })
        .then(res => res.json())
        .then(() => {
            showToast("Trust account cleared. Invoice paid successfully!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            closePaymentModal();
            payBtn.disabled = false;
            payBtn.textContent = "Submit Secure Payment";
        })
        .catch(err => {
            console.error("Error processing card payment:", err);
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

        fetch(`/api/contracts/${activeSigningDocId}/sign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: signedContent })
        })
        .then(res => res.json())
        .then(() => {
            showToast("Agreement signed and registered with legal counsel!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            closeSignatureModal();
        })
        .catch(err => console.error("Error signing document:", err));
    };

    window.downloadSignedContract = function(title) {
        showToast(`Initiating download for: ${title}.pdf`);
    };

    // 10. Appointments Scheduling and List renders
    window.renderClientAppointmentsList = function() {
        const list = document.getElementById('client-appointments-list');
        if (!list) return;
        list.innerHTML = '';
        
        const clientAppts = appointments.filter(a => a.client === activeClient);
        
        if (clientAppts.length === 0) {
            list.innerHTML = `<li><span style="color:var(--slate-500)">No appointments scheduled.</span></li>`;
            return;
        }
        
        clientAppts.slice().sort((a,b) => a.date.localeCompare(b.date)).forEach(a => {
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
        
        fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client: activeClient, title: `${type} (${notes || 'No notes'})`, date, time, type: "Consultation" })
        })
        .then(res => res.json())
        .then(() => {
            showToast("Consultation requested successfully!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            document.getElementById('book-appointment-form').reset();
        })
        .catch(err => console.error("Error booking appointment:", err));
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
