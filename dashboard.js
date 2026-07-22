// Lexora Lawyer Dashboard Application Script

document.addEventListener('DOMContentLoaded', () => {
    // 1. Shared State Keys
    const CLIENTS_KEY = 'lexora_clients_db';
    const CASES_KEY = 'lexora_cases_db';
    const INVOICES_KEY = 'lexora_invoices_db';
    const CONTRACTS_KEY = 'lexora_contracts_db';

    // Default Seed Data
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
        { id: 9001, client: "Apex Biotech Corp", date: "July 21, 2026", description: "Bylaw review & retainer setup", amount: 4200, hours: 12, status: "Unpaid" },
        { id: 9002, client: "Nexus Venture Fund", date: "July 20, 2026", description: "Series A term sheet consulting", amount: 8500, hours: 24, status: "Paid" },
        { id: 9003, client: "Silverline Properties", date: "July 18, 2026", description: "Lease draft consultation", amount: 1500, hours: 4, status: "Unpaid" }
    ];

    const defaultContracts = [
        { id: 8001, client: "Apex Biotech Corp", title: "Mutual NDA Agreement", type: "nda", status: "Draft", content: `MUTUAL NON-DISCLOSURE AGREEMENT\n-------------------------------\nThis Mutual NDA is made between OMATSULI LEGAL ASSOCIATES and APEX BIOTECH CORP.\n\nRecipient agrees to hold confidential intellectual property in escrow for a period of 5 years.` },
        { id: 8002, client: "Nexus Venture Fund", title: "Attorney Retainer Engagement", type: "retainer", status: "Signed", content: `ATTORNEY RETAINER AGREEMENT\n---------------------------\nThis Engagement Contract assigns corporate services to Nexus Venture Fund at a rate of $350/hour.` }
    ];

    // Seed database if empty
    if (!localStorage.getItem(CLIENTS_KEY)) localStorage.setItem(CLIENTS_KEY, JSON.stringify(defaultClients));
    if (!localStorage.getItem(CASES_KEY)) localStorage.setItem(CASES_KEY, JSON.stringify(defaultCases));
    if (!localStorage.getItem(INVOICES_KEY)) localStorage.setItem(INVOICES_KEY, JSON.stringify(defaultInvoices));
    if (!localStorage.getItem(CONTRACTS_KEY)) localStorage.setItem(CONTRACTS_KEY, JSON.stringify(defaultContracts));

    let clients = JSON.parse(localStorage.getItem(CLIENTS_KEY));
    let cases = JSON.parse(localStorage.getItem(CASES_KEY));
    let invoices = JSON.parse(localStorage.getItem(INVOICES_KEY));
    let contracts = JSON.parse(localStorage.getItem(CONTRACTS_KEY));

    // 2. Parse URL Parameters for Multi-Tenant Setup
    const urlParams = new URLSearchParams(window.location.search);
    const firmName = urlParams.get('firm') || 'Omatsuli Legal Associates';
    const practiceArea = urlParams.get('practice') || 'Corporate Law Practice';
    const staffInvites = urlParams.get('staff') || '';

    // Update Header Display
    document.getElementById('display-firm-name').textContent = firmName.toUpperCase();
    document.getElementById('display-practice-area').textContent = `${practiceArea} Workspace`;
    
    // Set Avatar Initial
    document.getElementById('user-avatar').textContent = firmName.charAt(0).toUpperCase();

    // Populate Staff widget list
    const staffList = document.getElementById('portal-staff-list');
    if (staffList) {
        staffList.innerHTML = `<li>You (Host Administrator)</li>`;
        if (staffInvites) {
            staffInvites.split(',').forEach(email => {
                const mail = email.trim();
                if (mail) {
                    staffList.innerHTML += `<li>${mail} <span class="badge-status inactive" style="font-size:0.6rem; padding:0 0.3rem;">Pending</span></li>`;
                }
            });
        } else {
            staffList.innerHTML += `<li>john@example.com <span class="badge-status inactive" style="font-size:0.6rem; padding:0 0.3rem;">Pending</span></li>`;
        }
    }

    // 3. Inject Logo SVG
    fetch('assets/logo_icon_light.svg')
        .then(res => res.text())
        .then(svgText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgContent = doc.documentElement.innerHTML;
            const viewBox = doc.documentElement.getAttribute('viewBox') || '0 0 200 200';
            
            const logoEl = document.getElementById('dashboard-logo-icon');
            if (logoEl) {
                logoEl.innerHTML = svgContent;
                logoEl.setAttribute('viewBox', viewBox);
            }
        })
        .catch(err => console.error('Error loading dashboard logo icon:', err));

    // 4. Tab Navigation Router
    const menuItems = document.querySelectorAll('.menu-item');
    const tabViews = document.querySelectorAll('.tab-view');

    window.switchTab = function(tabId) {
        menuItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        tabViews.forEach(view => {
            if (view.id === tabId) {
                view.classList.add('active');
            } else {
                view.classList.remove('active');
            }
        });
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // 5. Theme Toggle Logic
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

    // 6. Renders Databases
    function renderClientsTable() {
        const tbody = document.getElementById('clients-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${client.name}</strong></td>
                <td>${client.email}</td>
                <td>${client.practice}</td>
                <td>$${client.balance.toLocaleString()}</td>
                <td><span class="badge-status active">Active</span></td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="selectClientForInvoicing('${client.name}')">Bill Client</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderMattersKanban() {
        const containers = {
            intake: document.getElementById('cards-intake'),
            research: document.getElementById('cards-research'),
            drafting: document.getElementById('cards-drafting'),
            closed: document.getElementById('cards-closed')
        };

        const counts = {
            intake: document.getElementById('count-intake'),
            research: document.getElementById('count-research'),
            drafting: document.getElementById('count-drafting'),
            closed: document.getElementById('count-closed')
        };

        // Reset containers
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });

        let countsTracker = { intake: 0, research: 0, drafting: 0, closed: 0 };

        cases.forEach(item => {
            const card = document.createElement('div');
            card.className = 'kanban-card';
            
            const nextStage = item.stage === 'intake' ? 'research' : item.stage === 'research' ? 'drafting' : item.stage === 'drafting' ? 'closed' : null;
            const nextBtn = nextStage ? `<button class="btn btn-secondary btn-small" onclick="advanceCaseStage(${item.id}, '${nextStage}')" title="Move Stage">→</button>` : '';

            card.innerHTML = `
                <h4>${item.title}</h4>
                <div class="kanban-card-client">${item.client}</div>
                <div class="kanban-card-footer">
                    <span class="kanban-card-user"><i data-lucide="user" style="width:10px; height:10px; display:inline-block; margin-right:4px;"></i>${item.attorney}</span>
                    <div style="display:flex; align-items:center; gap:0.35rem;">
                        <span class="kanban-card-badge ${item.priority.toLowerCase() === 'high' ? 'low' : 'mid'}">${item.priority}</span>
                        ${nextBtn}
                    </div>
                </div>
            `;
            
            if (containers[item.stage]) {
                containers[item.stage].appendChild(card);
                countsTracker[item.stage]++;
            }
        });

        // Update headers counts
        Object.entries(counts).forEach(([stage, el]) => {
            if(el) el.textContent = countsTracker[stage];
        });

        // Update Overview metrics
        const metricMatters = document.getElementById('metric-active-matters');
        if (metricMatters) {
            metricMatters.textContent = `${cases.length} Cases`;
        }

        lucide.createIcons();
    }

    function renderOverviewCases() {
        const tbody = document.getElementById('overview-matters-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        // Take top 3 recent cases
        cases.slice(0, 3).forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.title}</strong></td>
                <td>${item.client}</td>
                <td><span class="status-dot green"></span> Open</td>
                <td><span class="badge-status active" style="text-transform: capitalize;">${item.stage}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function populateSelectors() {
        const invSelect = document.getElementById('inv-client-select');
        const draftSelect = document.getElementById('draft-client-select');
        const newCaseClient = document.getElementById('new-case-client');
        const apptClientSelect = document.getElementById('appt-client-select');

        [invSelect, draftSelect, newCaseClient, apptClientSelect].forEach(sel => {
            if (sel) {
                sel.innerHTML = '';
                clients.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.name;
                    opt.textContent = c.name;
                    sel.appendChild(opt);
                });
            }
        });
    }

    window.advanceCaseStage = function(caseId, stageName) {
        cases = cases.map(c => {
            if (c.id === caseId) {
                c.stage = stageName;
                showToast(`Case moved to ${stageName.toUpperCase()}`);
            }
            return c;
        });
        localStorage.setItem(CASES_KEY, JSON.stringify(cases));
        renderMattersKanban();
        renderOverviewCases();
    }

    // Modal Control
    const clientModal = document.getElementById('client-modal');
    window.openClientModal = function() {
        clientModal.classList.add('open');
    }
    window.closeClientModal = function() {
        clientModal.classList.remove('open');
    }

    const caseModal = document.getElementById('case-modal');
    window.openCaseModal = function() {
        caseModal.classList.add('open');
    }
    window.closeCaseModal = function() {
        caseModal.classList.remove('open');
    }

    // Forms Submission
    window.submitClientForm = function() {
        const name = document.getElementById('new-client-name').value.trim();
        const email = document.getElementById('new-client-email').value.trim();
        const practice = document.getElementById('new-client-practice').value;
        const deposit = parseFloat(document.getElementById('new-client-deposit').value) || 0;

        const newClient = {
            id: clients.length + 1,
            name: name,
            email: email,
            practice: practice,
            balance: deposit,
            status: "Active"
        };

        clients.push(newClient);
        
        // Write to shared state
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
        
        // Refresh UI
        renderClientsTable();
        populateSelectors();
        closeClientModal();
        updateDashboardMetrics();
        showToast("New Client registered successfully!");
        
        // Reset Form
        document.getElementById('add-client-form').reset();
    }

    window.submitCaseForm = function() {
        const title = document.getElementById('new-case-title').value.trim();
        const client = document.getElementById('new-case-client').value;
        const stage = document.getElementById('new-case-stage').value;

        const newCase = {
            id: Date.now(),
            title: title,
            client: client,
            stage: stage,
            priority: "Mid",
            attorney: "You"
        };

        cases.push(newCase);
        
        // Write to shared state
        localStorage.setItem(CASES_KEY, JSON.stringify(cases));
        
        // Refresh UI
        renderMattersKanban();
        renderOverviewCases();
        closeCaseModal();
        updateDashboardMetrics();
        showToast("New Case File initialized!");

        // Reset
        document.getElementById('add-case-form').reset();
    }

    window.selectClientForInvoicing = function(clientName) {
        switchTab('tab-invoices');
        const invSelect = document.getElementById('inv-client-select');
        if (invSelect) {
            invSelect.value = clientName;
        }
    }

    // 7. Dynamic Invoice Generator
    const invoiceSheet = document.getElementById('invoice-sheet');
    const printBtn = document.getElementById('btn-print-invoice');

    window.generateInvoice = function() {
        const clientName = document.getElementById('inv-client-select').value;
        const hours = parseFloat(document.getElementById('inv-hours').value);
        const rate = parseFloat(document.getElementById('inv-rate').value);
        const description = document.getElementById('inv-desc').value.trim();

        const clientObj = clients.find(c => c.name === clientName) || { email: 'client@example.com' };
        
        const subtotal = hours * rate;
        const taxes = subtotal * 0.08; // 8% tax
        const total = subtotal + taxes;

        const invoiceId = Math.floor(Math.random() * 89999) + 10000;
        const dateString = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Save invoice to shared state
        invoices.push({
            id: invoiceId,
            client: clientName,
            date: dateString,
            description: description,
            amount: total,
            hours: hours,
            status: "Unpaid"
        });
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
        updateDashboardMetrics();

        invoiceSheet.innerHTML = `
            <div class="invoice-sheet">
                <div class="invoice-sheet-header">
                    <div class="invoice-sheet-brand">
                        <svg viewBox="0 0 200 200" style="width:28px; height:28px;" id="invoice-sheet-logo">
                          <!-- Logo path inserted dynamically -->
                        </svg>
                        <span>LEXORA</span>
                    </div>
                    <div class="invoice-title-block">
                        <h2>INVOICE</h2>
                        <span>#INV-${invoiceId}</span>
                    </div>
                </div>

                <div class="invoice-meta-grid">
                    <div class="inv-from-block">
                        <strong>FROM:</strong>
                        <span>${firmName.toUpperCase()}</span><br>
                        <span>Workspace: ${practiceArea}</span><br>
                        <span>billing@lexora.app</span>
                    </div>
                    <div class="inv-to-block" style="text-align: right;">
                        <strong>BILL TO:</strong>
                        <span>${clientName}</span><br>
                        <span>${clientObj.email}</span><br>
                        <span>Date: ${dateString}</span>
                    </div>
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Description of Services</th>
                            <th style="text-align: center;">Hours</th>
                            <th style="text-align: right;">Rate ($)</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${description}</td>
                            <td style="text-align: center;">${hours}</td>
                            <td style="text-align: right;">$${rate}</td>
                            <td style="text-align: right;">$${subtotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align: right; border:none; font-weight:600;">Tax (8%):</td>
                            <td style="text-align: right; border:none;">$${taxes.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="invoice-totals">
                    <span>Total Due:</span>
                    <span>$${total.toLocaleString()}</span>
                </div>

                <div class="invoice-sheet-footer">
                    <span>Thank you for your business. Payments are processed securely via Lexora Trust Accounts.</span>
                </div>
            </div>
        `;

        // Inject logo into invoice template
        fetch('assets/logo_icon_light.svg')
            .then(res => res.text())
            .then(svgText => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgText, 'image/svg+xml');
                const logo = document.getElementById('invoice-sheet-logo');
                if (logo) {
                    logo.innerHTML = doc.documentElement.innerHTML;
                }
            });

        printBtn.removeAttribute('disabled');
        showToast("Invoice Drafted Successfully!");
    }

    window.printInvoiceSheet = function() {
        window.print();
    }

    // 8. AI Drafting Workbench
    const draftText = document.getElementById('draft-textbox');
    const docTitle = document.getElementById('draft-doc-title');

    window.generateAIDraft = function() {
        const clientName = document.getElementById('draft-client-select').value;
        const type = document.getElementById('draft-template-type').value;

        draftText.value = "// Initializing legal compiler parameters...\n// Mapping document vectors...";
        
        let templateContent = "";
        let titleName = "";

        if (type === 'nda') {
            titleName = "MUTUAL NON-DISCLOSURE AGREEMENT";
            templateContent = `MUTUAL NON-DISCLOSURE AGREEMENT
--------------------------------------------------
This Mutual Non-Disclosure Agreement ("Agreement") is made and entered into this ${new Date().toLocaleDateString('en-US')} ("Effective Date"), by and between:

FIRM REPRESENTING: ${firmName.toUpperCase()} ("Disclosing Party"),
AND
CLIENT PARTY: ${clientName.toUpperCase()} ("Recipient Party").

1. Purpose: The parties wish to enter into discussions regarding potential business relationships. In the course of these discussions, it may be necessary for either party to disclose confidential intellectual property or business projections.

2. Confidential Information: "Confidential Information" refers to any proprietary data, trade secrets, software code, financials, or legal strategies disclosed by one party to the other that is marked as confidential or should reasonably be understood to be proprietary.

3. Term of Protection: The obligations of confidentiality, non-use and non-disclosure set forth herein shall survive the termination of this Agreement for a period of five (5) years following the Effective Date.

IN WITNESS WHEREOF, the parties hereto have executed this Mutual Non-Disclosure Agreement as of the Effective Date written above.

For: ${firmName.toUpperCase()}
Sign: ____________________________

For: ${clientName.toUpperCase()}
Sign: ____________________________`;
        } else if (type === 'retainer') {
            titleName = "ATTORNEY RETAINER AGREEMENT";
            templateContent = `ATTORNEY RETAINER AGREEMENT & ENGAGEMENT
--------------------------------------------------
This Retainer Agreement is executed by and between:

LAW CHAMBER: ${firmName.toUpperCase()} (hereinafter "Attorney"),
AND
CLIENT: ${clientName.toUpperCase()} (hereinafter "Client").

1. Scope of Representation: Client retains Attorney to perform legal counsel services related specifically to: ${practiceArea}. Attorney shall provide counseling, drafting, litigation, and regulatory support as required.

2. Trust Retainer Deposit: Client agrees to pay an initial retainer deposit of $5,000 to be held in Attorney's Interest on Lawyers Trust Accounts (IOLTA). Attorney shall deduct billable hours from this account at the standard hourly rates described in Schedule A.

3. Fractional Hourly Billing: Attorney shall log work in increments of one-tenth (1/10th) of an hour. The primary billing attorney rate is set to $350/hour.

Executed on this ${new Date().toLocaleDateString('en-US')}.

Attorney Sign: ___________________________
Client Sign:   ___________________________`;
        } else {
            titleName = "CONSULTING SERVICES CONTRACT";
            templateContent = `PROFESSIONAL CONSULTING SERVICES CONTRACT
--------------------------------------------------
This Agreement is entered into by:

CLIENT: ${clientName.toUpperCase()} ("Client"),
AND
CONSULTANT: ${firmName.toUpperCase()} ("Consultant").

1. Services: Consultant agrees to provide professional corporate consulting, regulatory review, and technology integration parameters.

2. Intellectual Property Assignment: All intellectual property, legal templates, and code generated by Consultant in the course of performing these services shall assign to Client immediately upon receipt of full payment for related invoices.

3. Compensation: Client shall clear outstanding invoices within fifteen (15) business days of receipt. Overdue balances shall accumulate interest at 1.5% per month.

Signed:

For Client: ___________________________
For Consultant: _______________________`;
        }

        setTimeout(() => {
            docTitle.textContent = titleName;
            draftText.value = templateContent;
            
            // Save contract to shared database
            const docId = Math.floor(Math.random() * 8999) + 1000;
            contracts.push({
                id: docId,
                client: clientName,
                title: titleName,
                type: type,
                status: 'Draft',
                content: templateContent
            });
            localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
            
            showToast("AI Document Synthesized!");
        }, 1200);
    }

    window.copyDraftText = function() {
        if (!draftText.value || draftText.value.startsWith("//")) {
            showToast("Generate a draft first!");
            return;
        }
        navigator.clipboard.writeText(draftText.value).then(() => {
            showToast("Agreement text copied to clipboard!");
        });
    }

    // 9. AI Quick Assistant Widget
    const aiInput = document.getElementById('ai-quick-query');
    const aiOutput = document.getElementById('ai-quick-output');
    const aiBtn = document.getElementById('btn-quick-ai');

    if (aiBtn) {
        aiBtn.addEventListener('click', () => {
            const query = aiInput.value.trim().toLowerCase();
            if (!query) return;

            aiOutput.style.display = 'block';
            aiOutput.textContent = "AI Assistant: Mapping vectors & analyzing query...";

            setTimeout(() => {
                if (query.includes('nda') || query.includes('disclosure')) {
                    aiOutput.textContent = `Lexora AI Advisor: Standard NDAs should include:
- Reciprocal confidentiality obligations.
- Survival period limited to 3-5 years (indefinite survival is a risk).
- Exclusions for public knowledge or independent creation.`;
                } else if (query.includes('delaware') || query.includes('llc')) {
                    aiOutput.textContent = `Lexora AI Advisor: Delaware LLC requirements:
- Registered Agent in DE.
- Certificate of Formation filed with DE Division of Corporations.
- Annual Franchise Tax of $300 (due June 1st).
- Written Operating Agreement.`;
                } else {
                    aiOutput.textContent = `Lexora AI Advisor: Based on standard practice areas under ${practiceArea}, I recommend referencing local bar association rules. For contract generation, please use the 'AI Drafting' workbench tab.`;
                }
            }, 1000);
        });
    }

    // Toast Notifications
    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Filter Clients Functionality
    window.filterClients = function() {
        const query = document.getElementById('search-clients').value.toLowerCase();
        const rows = document.querySelectorAll('#clients-table-body tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // 9. Update Metrics Function
    function updateDashboardMetrics() {
        const trustSum = clients.reduce((acc, c) => acc + c.balance, 0);
        const outstandingSum = invoices.reduce((acc, inv) => acc + (inv.status === 'Unpaid' ? inv.amount : 0), 0);
        
        const totalHours = invoices.reduce((acc, inv) => {
            return acc + (inv.hours || (inv.amount / 350));
        }, 0);

        const trustMetric = document.getElementById('metric-trust-balance');
        if (trustMetric) trustMetric.textContent = `$${trustSum.toLocaleString()}`;

        const hoursMetric = document.getElementById('metric-hours-worked');
        if (hoursMetric) hoursMetric.textContent = `${totalHours.toFixed(1)} hrs`;

        const activeMattersMetric = document.getElementById('metric-active-matters');
        if (activeMattersMetric) activeMattersMetric.textContent = `${cases.length} Cases`;

        const outstandingMetric = document.getElementById('metric-outstanding');
        if (outstandingMetric) outstandingMetric.textContent = `$${outstandingSum.toLocaleString()}`;
    }

    // 10. Calendar & Appointments State Setup
    const APPOINTMENTS_KEY = 'lexora_appointments_db';
    const defaultAppointments = [
        { id: 7001, client: "Apex Biotech Corp", title: "Series A Legal Audit", date: "2026-07-23", time: "10:00", type: "Consultation" },
        { id: 7002, client: "Nexus Venture Fund", title: "Bylaws Review Advisory", date: "2026-07-24", time: "14:00", type: "Hearing" }
    ];

    if (!localStorage.getItem(APPOINTMENTS_KEY)) {
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(defaultAppointments));
    }
    let appointments = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY));

    let currentYear = 2026;
    let currentMonth = 6; // July (0-indexed)

    window.renderCalendarDays = function() {
        const container = document.getElementById('calendar-days-container');
        if (!container) return;
        container.innerHTML = '';
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('calendar-month-name').textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
        
        // Overflow days from previous month
        for (let x = firstDayIndex; x > 0; x--) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.innerHTML = `<span class="day-number">${prevLastDay - x + 1}</span>`;
            container.appendChild(day);
        }
        
        // Days of current month
        for (let i = 1; i <= lastDay; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            
            const isToday = (i === 22 && currentMonth === 6 && currentYear === 2026);
            if (isToday) day.classList.add('today');
            
            const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            
            const dayAppts = appointments.filter(a => a.date === dateStr);
            let eventsHtml = '<div class="day-events">';
            dayAppts.forEach(a => {
                const clientShort = a.client.split(' ')[0];
                eventsHtml += `<div class="event-dot" title="${a.client}: ${a.title}">${clientShort}: ${a.title}</div>`;
            });
            eventsHtml += '</div>';

            day.innerHTML = `
                <span class="day-number">${i}</span>
                ${eventsHtml}
            `;
            container.appendChild(day);
        }
        
        // Next month overflow cells
        const totalCells = firstDayIndex + lastDay;
        const nextMonthCells = 42 - totalCells;
        for (let j = 1; j <= nextMonthCells; j++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.innerHTML = `<span class="day-number">${j}</span>`;
            container.appendChild(day);
        }
    }

    window.showPrevMonth = function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendarDays();
    }

    window.showNextMonth = function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendarDays();
    }

    window.renderAppointmentsList = function() {
        const list = document.getElementById('dashboard-appointments-list');
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
                    <span>Client: ${a.client}</span>
                </div>
                <div class="appt-date-badge">
                    <span>${a.date}</span><br>
                    <span style="font-size:0.7rem; opacity:0.8;">${a.time}</span>
                </div>
            `;
            list.appendChild(li);
        });
    }

    window.submitAppointmentForm = function() {
        const clientName = document.getElementById('appt-client-select').value;
        const title = document.getElementById('appt-title').value.trim();
        const date = document.getElementById('appt-date').value;
        const time = document.getElementById('appt-time').value;

        const newAppt = {
            id: Date.now(),
            client: clientName,
            title: title,
            date: date,
            time: time,
            type: "Consultation"
        };

        appointments.push(newAppt);
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
        
        renderCalendarDays();
        renderAppointmentsList();
        showToast("New meeting consultation scheduled!");
        
        document.getElementById('add-appointment-form').reset();
    }

    // 11. Listen to LocalStorage updates from Client Portal!
    window.addEventListener('storage', (e) => {
        if (e.key === CLIENTS_KEY) {
            clients = JSON.parse(e.newValue);
            renderClientsTable();
            populateSelectors();
            updateDashboardMetrics();
        }
        if (e.key === CASES_KEY) {
            cases = JSON.parse(e.newValue);
            renderMattersKanban();
            renderOverviewCases();
            updateDashboardMetrics();
        }
        if (e.key === INVOICES_KEY) {
            invoices = JSON.parse(e.newValue);
            updateDashboardMetrics();
        }
        if (e.key === CONTRACTS_KEY) {
            contracts = JSON.parse(e.newValue);
        }
        if (e.key === APPOINTMENTS_KEY) {
            appointments = JSON.parse(e.newValue || '[]');
            renderCalendarDays();
            renderAppointmentsList();
        }
    });

    // Startup Initializations
    renderClientsTable();
    renderMattersKanban();
    renderOverviewCases();
    populateSelectors();
    updateDashboardMetrics();
    renderCalendarDays();
    renderAppointmentsList();
});
