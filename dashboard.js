// Lexora Lawyer Dashboard Application Script (JWT Guard & DB Sync Enabled)

document.addEventListener('DOMContentLoaded', () => {
    // Route Guard: Redirect to login.html if token missing
    const token = sessionStorage.getItem('lexora_token');
    const role = sessionStorage.getItem('lexora_role');
    
    if (!token || role !== 'lawyer') {
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

    let currentYear = 2026;
    let currentMonth = 6; // July (0-indexed)

    // 2. Fetch and Load Database Tables from Express APIs
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

            // Redraw all UI blocks
            renderClientsTable();
            renderMattersKanban();
            renderOverviewCases();
            populateSelectors();
            updateDashboardMetrics();
            renderCalendarDays();
            renderAppointmentsList();
            applyFirmBranding();
            lucide.createIcons();
        } catch (err) {
            console.error("Error fetching database tables:", err);
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
                <td>$${parseInt(client.balance).toLocaleString()}</td>
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

        lucide.createIcons();
    }

    function renderOverviewCases() {
        const tbody = document.getElementById('overview-matters-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        cases.slice(-3).reverse().forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.title}</strong></td>
                <td>${item.client}</td>
                <td><span class="status-dot ${item.stage === 'closed' ? 'gray' : 'green'}"></span> ${item.stage === 'closed' ? 'Closed' : 'Open'}</td>
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

    // 7. Case advancement
    window.advanceCaseStage = function(caseId, stageName) {
        fetchAPI(`/api/cases/${caseId}/stage`, {
            method: 'PUT',
            body: JSON.stringify({ stage: stageName })
        })
        .then(() => {
            showToast(`Case moved to ${stageName.toUpperCase()}`);
            triggerDBSyncNotification();
            loadAllDatabaseTables();
        })
        .catch(err => console.error("Error advancing case stage:", err));
    }

    // Modal Controls
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

        fetchAPI('/api/clients', {
            method: 'POST',
            body: JSON.stringify({ name, email, practice, balance: deposit })
        })
        .then(() => {
            closeClientModal();
            showToast("New Client registered successfully!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            document.getElementById('add-client-form').reset();
        })
        .catch(err => showToast(err.message));
    }

    window.submitCaseForm = function() {
        const title = document.getElementById('new-case-title').value.trim();
        const client = document.getElementById('new-case-client').value;
        const stage = document.getElementById('new-case-stage').value;

        fetchAPI('/api/cases', {
            method: 'POST',
            body: JSON.stringify({ title, client, stage, priority: "Mid", attorney: "You" })
        })
        .then(() => {
            closeCaseModal();
            showToast("New Case File initialized!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            document.getElementById('add-case-form').reset();
        })
        .catch(err => showToast(err.message));
    }

    window.selectClientForInvoicing = function(clientName) {
        switchTab('tab-invoices');
        const invSelect = document.getElementById('inv-client-select');
        if (invSelect) {
            invSelect.value = clientName;
        }
    }

    // 8. Dynamic Invoice Generator
    const invoiceSheet = document.getElementById('invoice-sheet');
    const printBtn = document.getElementById('btn-print-invoice');

    window.generateInvoice = function() {
        const clientName = document.getElementById('inv-client-select').value;
        const hours = parseFloat(document.getElementById('inv-hours').value);
        const rate = parseFloat(document.getElementById('inv-rate').value);
        const description = document.getElementById('inv-desc').value.trim();

        const clientObj = clients.find(c => c.name === clientName) || { email: 'client@example.com' };
        
        const subtotal = hours * rate;
        const taxes = subtotal * 0.08;
        const total = subtotal + taxes;

        const dateString = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        fetchAPI('/api/invoices', {
            method: 'POST',
            body: JSON.stringify({ client: clientName, date: dateString, description, amount: total, hours })
        })
        .then(newInv => {
            showToast("Invoice Drafted Successfully!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            
            invoiceSheet.innerHTML = `
                <div class="invoice-sheet">
                    <div class="invoice-sheet-header">
                        <div class="invoice-sheet-brand">
                            <svg viewBox="0 0 200 200" style="width:28px; height:28px;" id="invoice-sheet-logo">
                              <!-- Injected dynamically -->
                            </svg>
                            <span>LEXORA</span>
                        </div>
                        <div class="invoice-title-block">
                            <h2>INVOICE</h2>
                            <span>#INV-${newInv.id}</span>
                        </div>
                    </div>

                    <div class="invoice-meta-grid">
                        <div class="inv-from-block">
                            <strong>FROM:</strong>
                            <span>${firmDetails.firm ? firmDetails.firm.toUpperCase() : 'LEXORA PARTNERS'}</span><br>
                            <span>Workspace: ${firmDetails.practice || 'Corporate Law'}</span><br>
                            <span>${firmDetails.email || 'billing@lexora.app'}</span>
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

            fetch('assets/logo_icon_light.svg')
                .then(r => r.text())
                .then(svgText => {
                    const parser = new DOMParser();
                    const logoDoc = parser.parseFromString(svgText, 'image/svg+xml');
                    const logo = document.getElementById('invoice-sheet-logo');
                    if (logo) logo.innerHTML = logoDoc.documentElement.innerHTML;
                });

            printBtn.removeAttribute('disabled');
        })
        .catch(err => showToast(err.message));
    }

    window.printInvoiceSheet = function() {
        window.print();
    }

    // 9. Production AI Drafting Workbench (OpenAI Integrated)
    const draftText = document.getElementById('draft-textbox');
    const docTitle = document.getElementById('draft-doc-title');

    window.generateAIDraft = function() {
        const clientName = document.getElementById('draft-client-select').value;
        const type = document.getElementById('draft-template-type').value;

        draftText.value = "// Initializing OpenAI legal models...\n// Compiling contextual parameters...";
        
        fetchAPI('/api/ai/draft', {
            method: 'POST',
            body: JSON.stringify({ clientName, type })
        })
        .then(data => {
            docTitle.textContent = data.title;
            draftText.value = data.content;
            showToast(data.sandbox ? "AI Document Drafted (Sandbox)!" : "AI Document Drafted via GPT-4!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
        })
        .catch(err => {
            showToast("Failed to compile AI document draft.");
            console.error(err);
        });
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

    // 10. Appointments Calendar & Monthly Grid
    window.renderCalendarDays = function() {
        const container = document.getElementById('calendar-days-container');
        if (!container) return;
        container.innerHTML = '';
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('calendar-month-name').textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
        
        for (let x = firstDayIndex; x > 0; x--) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.innerHTML = `<span class="day-number">${prevLastDay - x + 1}</span>`;
            container.appendChild(day);
        }
        
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

        fetchAPI('/api/appointments', {
            method: 'POST',
            body: JSON.stringify({ client: clientName, title, date, time, type: "Consultation" })
        })
        .then(() => {
            showToast("New meeting consultation scheduled!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
            document.getElementById('add-appointment-form').reset();
        })
        .catch(err => showToast(err.message));
    }

    // 11. Firm Settings Submission
    window.submitSettingsForm = function() {
        const firm = document.getElementById('settings-firm-name').value.trim();
        const practice = document.getElementById('settings-practice-area').value.trim();
        const address = document.getElementById('settings-firm-address').value.trim();
        const phone = document.getElementById('settings-firm-phone').value.trim();
        const email = document.getElementById('settings-firm-email').value.trim();
        
        fetchAPI('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ firm, practice, address, phone, email })
        })
        .then(() => {
            showToast("Workspace branding configurations saved!");
            triggerDBSyncNotification();
            loadAllDatabaseTables();
        })
        .catch(err => showToast(err.message));
    }

    function applyFirmBranding() {
        if (!firmDetails.firm) return;
        document.getElementById('display-firm-name').textContent = firmDetails.firm.toUpperCase();
        document.getElementById('display-practice-area').textContent = `${firmDetails.practice} Workspace`;
        document.getElementById('user-avatar').textContent = firmDetails.firm.charAt(0).toUpperCase();

        const setFirm = document.getElementById('settings-firm-name');
        if (setFirm) setFirm.value = firmDetails.firm;
        const setPrac = document.getElementById('settings-practice-area');
        if (setPrac) setPrac.value = firmDetails.practice;
        const setAddr = document.getElementById('settings-firm-address');
        if (setAddr) setAddr.value = firmDetails.address;
        const setPhone = document.getElementById('settings-firm-phone');
        if (setPhone) setPhone.value = firmDetails.phone;
        const setEmail = document.getElementById('settings-firm-email');
        if (setEmail) setEmail.value = firmDetails.email;
    }

    function updateDashboardMetrics() {
        const trustSum = clients.reduce((acc, c) => acc + parseInt(c.balance), 0);
        const outstandingSum = invoices.reduce((acc, inv) => acc + (inv.status === 'Unpaid' ? parseFloat(inv.amount) : 0), 0);
        
        const totalHours = invoices.reduce((acc, inv) => {
            return acc + parseFloat(inv.hours || (inv.amount / 350));
        }, 0);

        const trustMetric = document.getElementById('metric-trust-balance');
        if (trustMetric) trustMetric.textContent = `$${trustSum.toLocaleString()}`;

        const hoursMetric = document.getElementById('metric-hours-worked');
        if (hoursMetric) hoursMetric.textContent = `${totalHours.toFixed(1)} hrs`;

        const activeMattersMetric = document.getElementById('metric-active-matters');
        if (activeMattersMetric) activeMattersMetric.textContent = `${cases.length} Cases`;

        const outstandingMetric = document.getElementById('metric-outstanding');
        if (outstandingMetric) outstandingMetric.textContent = `$${outstandingSum.toLocaleString()}`;

        const reportTrust = document.getElementById('report-deposited-trust');
        if (reportTrust) reportTrust.textContent = `$${trustSum.toLocaleString()}`;

        const reportOut = document.getElementById('report-outstanding-billed');
        if (reportOut) reportOut.textContent = `$${outstandingSum.toLocaleString()}`;
    }

    // 12. State Sync Pulse
    function triggerDBSyncNotification() {
        localStorage.setItem('lexora_db_sync_trigger', Date.now().toString());
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'lexora_db_sync_trigger') {
            loadAllDatabaseTables();
        }
    });

    // Logout
    window.logOutUser = function() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logOutUser();
        });
    }

    // Toast alert utility
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
