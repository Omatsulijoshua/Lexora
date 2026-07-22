// Lexora Client Portal Script

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Shared Keys
    const CLIENTS_KEY = 'lexora_clients_db';
    const CASES_KEY = 'lexora_cases_db';
    const INVOICES_KEY = 'lexora_invoices_db';
    const CONTRACTS_KEY = 'lexora_contracts_db';

    // 2. Default Seed Data (used if localStorage is empty)
    const defaultClients = [
        { id: 1, name: "Apex Biotech Corp", email: "legal@apexbiotech.com", practice: "Corporate Law", balance: 15000, status: "Active" },
        { id: 2, name: "Nexus Venture Fund", email: "intake@nexusfund.io", practice: "Corporate Law", balance: 25000, status: "Active" },
        { id: 3, name: "Silverline Properties", email: "ops@silverline.com", practice: "Real Estate", balance: 5000, status: "Active" },
    ];

    const defaultCases = [
        { id: 101, title: "Series A Financing Audit", client: "Apex Biotech Corp", stage: "research", priority: "High", attorney: "You" },
        { id: 102, title: "Bylaws Drafting & Review", client: "Nexus Venture Fund", stage: "drafting", priority: "Low", attorney: "You" },
        { id: 103, title: "Commercial Lease Negotiation", client: "Silverline Properties", stage: "intake", priority: "Mid", attorney: "You" },
        { id: 104, title: "IP License Agreement", client: "Apex Biotech Corp", stage: "drafting", priority: "High", attorney: "You" }
    ];

    const defaultInvoices = [
        { id: 9001, client: "Apex Biotech Corp", date: "July 21, 2026", description: "Bylaw review & retainer setup", amount: 4200, status: "Unpaid" },
        { id: 9002, client: "Nexus Venture Fund", date: "July 20, 2026", description: "Series A term sheet consulting", amount: 8500, status: "Paid" },
        { id: 9003, client: "Silverline Properties", date: "July 18, 2026", description: "Lease draft consultation", amount: 1500, status: "Unpaid" }
    ];

    const defaultContracts = [
        { id: 8001, client: "Apex Biotech Corp", title: "Mutual NDA Agreement", type: "nda", status: "Draft", content: `MUTUAL NON-DISCLOSURE AGREEMENT\n-------------------------------\nThis Mutual NDA is made between OMATSULI LEGAL ASSOCIATES and APEX BIOTECH CORP.\n\nRecipient agrees to hold confidential intellectual property in escrow for a period of 5 years.` },
        { id: 8002, client: "Nexus Venture Fund", title: "Attorney Retainer Engagement", type: "retainer", status: "Signed", content: `ATTORNEY RETAINER AGREEMENT\n---------------------------\nThis Engagement Contract assigns corporate services to Nexus Venture Fund at a rate of $350/hour.` }
    ];

    // Seed database if empty
    function initializeStorage() {
        if (!localStorage.getItem(CLIENTS_KEY)) localStorage.setItem(CLIENTS_KEY, JSON.stringify(defaultClients));
        if (!localStorage.getItem(CASES_KEY)) localStorage.setItem(CASES_KEY, JSON.stringify(defaultCases));
        if (!localStorage.getItem(INVOICES_KEY)) localStorage.setItem(INVOICES_KEY, JSON.stringify(defaultInvoices));
        if (!localStorage.getItem(CONTRACTS_KEY)) localStorage.setItem(CONTRACTS_KEY, JSON.stringify(defaultContracts));
    }
    initializeStorage();

    // Load Local Data variables
    let clients = JSON.parse(localStorage.getItem(CLIENTS_KEY));
    let cases = JSON.parse(localStorage.getItem(CASES_KEY));
    let invoices = JSON.parse(localStorage.getItem(INVOICES_KEY));
    let contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY));

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

    // Populate clients login selector
    if (clientSelect) {
        clientSelect.innerHTML = '';
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            clientSelect.appendChild(opt);
        });
    }

    let activeClient = sessionStorage.getItem('lexora_active_client') || '';

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
        
        // Trigger render
        setTimeout(() => {
            renderOverviewMilestones();
            renderClientInvoices();
            renderClientDocuments();
            lucide.createIcons();
        }, 100);
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
        // Find cases matching this client
        const clientCases = cases.filter(c => c.client === activeClient);
        const caseTitleText = document.getElementById('active-case-title');
        const progressBar = document.getElementById('milestone-progress-bar');
        
        // Timeline DOM elements
        const stepIntake = document.getElementById('step-intake');
        const stepResearch = document.getElementById('step-research');
        const stepDrafting = document.getElementById('step-drafting');
        const stepClosed = document.getElementById('step-closed');

        // Reset timeline styles
        [stepIntake, stepResearch, stepDrafting, stepClosed].forEach(step => {
            step.className = 'timeline-step';
        });

        if (clientCases.length === 0) {
            caseTitleText.textContent = "No Active Matters Logged";
            progressBar.style.width = "0%";
            return;
        }

        // Take primary active case
        const activeCase = clientCases[0];
        caseTitleText.textContent = activeCase.title;

        // Set progress width and active states
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
                <td class="gold-text"><strong>$${inv.amount.toLocaleString()}</strong></td>
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

    window.openPaymentModal = function(invoiceId, amount) {
        activePayingInvId = invoiceId;
        payTotalDisplay.textContent = `$${amount.toLocaleString()}`;
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

        setTimeout(() => {
            // Update status in local variable
            invoices = invoices.map(inv => {
                if (inv.id === activePayingInvId) {
                    inv.status = 'Paid';
                }
                return inv;
            });

            // Write back to storage
            localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
            
            // Sync clients ledger subtraction
            clients = clients.map(c => {
                if (c.name === activeClient) {
                    // deduct invoice amount from trust balance
                    const invObj = invoices.find(i => i.id === activePayingInvId);
                    c.balance = Math.max(0, c.balance - (invObj ? invObj.amount : 0));
                }
                return c;
            });
            localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));

            showToast("Trust account cleared. Invoice paid successfully!");
            
            // Re-render
            renderClientInvoices();
            closePaymentModal();
            payBtn.disabled = false;
            payBtn.textContent = "Submit Secure Payment";
        }, 1500);
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
        canvasContext.strokeStyle = '#FFFFFF'; // Draw white stroke on dark bg
        canvasContext.lineWidth = 2.5;
        canvasContext.lineCap = 'round';
        canvasContext.lineJoin = 'round';

        // Mouse Handlers
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

        // Touch Handlers (for mobile/tablet)
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
        
        // Initialize canvas context and clear pad
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
        // Simulate checking if signature drawn (simple blank check)
        const blank = document.createElement('canvas');
        blank.width = signaturePad.width;
        blank.height = signaturePad.height;
        
        if (signaturePad.toDataURL() === blank.toDataURL()) {
            showToast("Please draw a signature first!");
            return;
        }

        // Apply signature
        contracts = contracts.map(doc => {
            if (doc.id === activeSigningDocId) {
                doc.status = 'Signed';
                doc.content += `\n\n[DIGITALLY SIGNED VIA LEXORA CLIENT PORTAL]\nClient: ${activeClient.toUpperCase()}\nDate: ${new Date().toLocaleString()}`;
            }
            return doc;
        });

        // Write back
        localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
        showToast("Agreement signed and registered with legal counsel!");

        // Refresh
        renderClientDocuments();
        closeSignatureModal();
    };

    window.downloadSignedContract = function(title) {
        // Simulate PDF download
        showToast(`Initiating download for: ${title}.pdf`);
    };

    // 10. Listen to LocalStorage updates from Lawyer Dashboard!
    window.addEventListener('storage', (e) => {
        // Reload parameters if shared keys change
        if (e.key === CASES_KEY) {
            cases = JSON.parse(e.newValue);
            renderOverviewMilestones();
        }
        if (e.key === INVOICES_KEY) {
            invoices = JSON.parse(e.newValue);
            renderClientInvoices();
        }
        if (e.key === CONTRACTS_KEY) {
            contracts = JSON.parse(e.newValue);
            renderClientDocuments();
        }
        if (e.key === CLIENTS_KEY) {
            clients = JSON.parse(e.newValue);
            renderClientsTable();
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
});
