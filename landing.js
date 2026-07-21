// Lexora SaaS Landing Page Interactivity Script

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons
    lucide.createIcons();

    // 2. Load and Inject SVGs Dynamically
    const logoSlots = ['nav-logo-icon', 'portal-logo-icon', 'footer-logo-icon'];
    
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
        .catch(err => console.error('Error loading logo icon:', err));

    // 3. Pricing Calculator Logic
    const seatsSlider = document.getElementById('seats-slider');
    const storageSlider = document.getElementById('storage-slider');
    const billingToggle = document.getElementById('billing-cycle');
    
    const seatsVal = document.getElementById('seats-val');
    const storageVal = document.getElementById('storage-val');
    const planPrice = document.getElementById('plan-total-price');
    const planTierBadge = document.getElementById('plan-tier-badge');
    const featSeatsText = document.getElementById('feat-seats');
    const featStorageText = document.getElementById('feat-storage');

    function updatePricing() {
        const seats = parseInt(seatsSlider.value);
        const storage = parseInt(storageSlider.value);
        const isAnnual = billingToggle.checked;

        // Display slider numbers
        seatsVal.textContent = `${seats} Seat${seats > 1 ? 's' : ''}`;
        storageVal.textContent = storage >= 1000 ? `${(storage/1000).toFixed(0)} TB` : `${storage} GB`;

        // Calculate Pricing
        // Base rate: $30/mo
        // Cost per seat: $15
        // Cost per GB: $0.15
        let total = 30 + (seats * 15) + (storage * 0.15);
        
        // Annual discount (20% off)
        if (isAnnual) {
            total = total * 0.8;
        }

        planPrice.innerHTML = `$${Math.round(total)}<span class="period">/mo</span>`;

        // Determine plan tier names
        let tier = "PROFESSIONAL";
        if (seats <= 3 && storage <= 50) {
            tier = "STARTER / BASIC";
        } else if (seats > 25 || storage > 500) {
            tier = "ENTERPRISE PRO";
        }
        planTierBadge.textContent = tier;

        // Update features text
        featSeatsText.textContent = `${seats} Attorney & Staff Seats`;
        featStorageText.textContent = storage >= 1000 ? `${(storage/1000).toFixed(0)} TB SOC2 Secure Storage` : `${storage} GB SOC2 Secure Storage`;
    }

    if (seatsSlider && storageSlider && billingToggle) {
        seatsSlider.addEventListener('input', updatePricing);
        storageSlider.addEventListener('input', updatePricing);
        billingToggle.addEventListener('change', updatePricing);
        updatePricing(); // run once initial
    }

    // 4. Legal AI Assistant Sandbox Simulator
    const terminal = document.getElementById('terminal-screen');
    const runBtn = document.getElementById('btn-run-ai');
    const ndaBtn = document.getElementById('btn-tmpl-nda');
    const leaseBtn = document.getElementById('btn-tmpl-lease');
    const serviceBtn = document.getElementById('btn-tmpl-service');

    let activeTemplate = 'nda';

    const templates = {
        nda: {
            title: "Corporate NDA - Clause Analysis",
            content: `CONTRACT AUDIT: Mutual Non-Disclosure Agreement
Party A: Lexora Technologies Inc
Party B: Global Venture Partners LLC
Date: July 21, 2026

[Clause 4. Indemnification]
"Recipient agrees to indemnify, defend and hold harmless Discloser and its directors from any liability, loss, cost, damage or expense, including reasonable attorney fees, arising out of any breach of this Agreement by Recipient."

[Clause 9. Survival]
"The obligations of confidentiality, non-use and non-disclosure set forth herein shall survive the termination of this Agreement for an indefinite period."`
        },
        lease: {
            title: "Commercial Lease - Risk Scan",
            content: `CONTRACT AUDIT: Commercial Office Lease
Landlord: Gotham Realty Trust
Tenant: Lexora Offices NY
Date: July 21, 2026

[Section 14. Trial Waiver]
"Tenant hereby waives all right to a trial by jury in any action, proceeding or counterclaim brought by either of the parties hereto against the other on any matters whatsoever arising out of this Lease."

[Section 22. Security Deposit Interest]
"Landlord shall hold the security deposit without liability for interest, and Landlord may mingle the security deposit with other assets of the Landlord."`
        },
        service: {
            title: "Consulting Agreement - Intellectual Property",
            content: `CONTRACT AUDIT: Master Consulting Contract
Client: Lexora Technologies Inc
Consultant: Apex Software Guild
Date: July 21, 2026

[Clause 6. Intellectual Property Rights]
"All intellectual property, code, and inventions created by Consultant during the term of this contract shall assign automatically to Client immediately upon creation, irrespective of invoice payment status."`
        }
    };

    function selectTemplate(type, btn) {
        activeTemplate = type;
        [ndaBtn, leaseBtn, serviceBtn].forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        terminal.innerHTML = '';
        appendLine(`// Switched template to: ${templates[type].title}`, 'input');
        appendLine(`// Click "Run AI Analysis" to audit...`, 'input');
    }

    if (ndaBtn) ndaBtn.addEventListener('click', () => selectTemplate('nda', ndaBtn));
    if (leaseBtn) leaseBtn.addEventListener('click', () => selectTemplate('lease', leaseBtn));
    if (serviceBtn) serviceBtn.addEventListener('click', () => selectTemplate('service', serviceBtn));

    function appendLine(text, type = 'output', delay = 0) {
        return new Promise(resolve => {
            setTimeout(() => {
                const line = document.createElement('div');
                line.className = `terminal-line ${type}`;
                line.innerHTML = text;
                terminal.appendChild(line);
                terminal.scrollTop = terminal.scrollHeight;
                resolve();
            }, delay);
        });
    }

    async function simulateAIAnalysis() {
        runBtn.disabled = true;
        terminal.innerHTML = '';
        
        await appendLine(`[SYSTEM] Initializing Lexora AI Engine...`, 'input', 100);
        await appendLine(`[SYSTEM] Loading ethical legal safety filters...`, 'input', 200);
        await appendLine(`[SYSTEM] Scanning document characters...`, 'input', 200);
        
        const text = templates[activeTemplate].content;
        await appendLine(`[AUDITING SOURCE]:\n${text}\n`, 'output', 300);
        
        await appendLine(`[AI ENGINE] Processing NLP semantic models...`, 'input', 500);
        await appendLine(`[AI ENGINE] Matching standard legal database vectors...`, 'input', 400);

        if (activeTemplate === 'nda') {
            await appendLine(`\n-----------------------------------------`, 'output', 200);
            await appendLine(`[AI RISK IDENTIFIED: HIGH]`, 'highlight', 100);
            await appendLine(`Clause: Clause 4 (Indemnification)`, 'output', 50);
            await appendLine(`Analysis: Unilateral indemnification for simple breach. Disproportional liability shifted to Recipient.`, 'output', 50);
            await appendLine(`Mitigation Rec: Amend to mutual indemnification or restrict liability cap to direct fees.`, 'success', 50);
            
            await appendLine(`\n[AI RISK IDENTIFIED: MEDIUM]`, 'output', 100);
            await appendLine(`Clause: Clause 9 (Survival)`, 'output', 50);
            await appendLine(`Analysis: Indefinite confidentiality survival is considered a tail risk. Standard is 3 to 5 years.`, 'output', 50);
            await appendLine(`Mitigation Rec: Amend survival to '5 years following termination of discussions'.`, 'success', 50);
        } else if (activeTemplate === 'lease') {
            await appendLine(`\n-----------------------------------------`, 'output', 200);
            await appendLine(`[AI RISK IDENTIFIED: HIGH]`, 'highlight', 100);
            await appendLine(`Clause: Section 14 (Trial Waiver)`, 'output', 50);
            await appendLine(`Analysis: Severe restriction on constitutional dispute resolution rights. Jury waivers should be reciprocal.`, 'output', 50);
            await appendLine(`Mitigation Rec: Negotiate removal of jury trial waiver or introduce structured mediation first.`, 'success', 50);
            
            await appendLine(`\n[AI RISK IDENTIFIED: MEDIUM]`, 'output', 100);
            await appendLine(`Clause: Section 22 (Security Deposit Interest)`, 'output', 50);
            await appendLine(`Analysis: Lack of interest accumulation and escrow separation. Deposits should ideally be held in escrow.`, 'output', 50);
            await appendLine(`Mitigation Rec: Request escrow holding clause with standard interest yields.`, 'success', 50);
        } else {
            await appendLine(`\n-----------------------------------------`, 'output', 200);
            await appendLine(`[AI RISK IDENTIFIED: HIGH]`, 'highlight', 100);
            await appendLine(`Clause: Clause 6 (Intellectual Property Rights)`, 'output', 50);
            await appendLine(`Analysis: IP assigns automatically upon creation *before* invoices are cleared. Consultant risk of non-payment.`, 'output', 50);
            await appendLine(`Mitigation Rec: Amend to state: "IP assigns immediately upon receipt of full payment for related invoices".`, 'success', 50);
        }

        await appendLine(`\n[SYSTEM] Audit complete. 100% vectors mapped. Output clean.`, 'input', 500);
        runBtn.disabled = false;
    }

    if (runBtn) {
        runBtn.addEventListener('click', simulateAIAnalysis);
    }

    // 5. Workspace Creator Wizard Logic
    const formStep = document.getElementById('wizard-form-step');
    const deployStep = document.getElementById('wizard-deploying-step');
    const dashStep = document.getElementById('wizard-dashboard-step');
    const logsBox = document.getElementById('deployment-logs-box');

    const formElement = document.getElementById('workspace-wizard-form');
    const firmNameInput = document.getElementById('firm-name');
    const practiceSelect = document.getElementById('practice-area');
    const inviteInput = document.getElementById('invite-emails');

    const portalFirmDisplay = document.getElementById('portal-firm-display');
    const portalPracticeDisplay = document.getElementById('portal-practice-display');
    const portalStaffList = document.getElementById('portal-staff-list');

    window.startDeployment = async function() {
        const firmName = firmNameInput.value.trim();
        const practice = practiceSelect.value;
        const invites = inviteInput.value.trim();

        // Switch to loader
        formStep.classList.remove('active');
        deployStep.classList.add('active');

        // Reset logs
        logsBox.innerHTML = '';
        
        async function log(text, delay) {
            return new Promise(resolve => {
                setTimeout(() => {
                    const line = document.createElement('div');
                    line.className = 'log-line';
                    line.textContent = text;
                    logsBox.appendChild(line);
                    logsBox.scrollTop = logsBox.scrollHeight;
                    resolve();
                }, delay);
            });
        }

        await log("Parsing deployment parameters...", 300);
        await log(`Verifying domain: lexora.app/${firmName.toLowerCase().replace(/[^a-z0-9]/g, '')}`, 400);
        await log("Provisioning tenant database on AWS RDS (PostgreSQL)...", 600);
        await log("Applying SOC2 structural encryption parameters...", 500);
        await log(`Enabling AI capabilities for specialty: ${practice}`, 400);
        await log("Configuring multi-tenant security headers...", 400);
        
        if (invites) {
            const list = invites.split(',').map(e => e.trim());
            await log(`Queuing ${list.length} email invitations...`, 300);
        }
        
        await log("SaaS instance initialization successful!", 600);
        await log("Redirecting to your workspace dashboard...", 400);

        // Populate Dashboard details
        portalFirmDisplay.textContent = firmName.toUpperCase();
        portalPracticeDisplay.textContent = practice;
        
        portalStaffList.innerHTML = '';
        if (invites) {
            const list = invites.split(',').map(e => e.trim());
            list.forEach(email => {
                const li = document.createElement('li');
                li.textContent = `${email} (Pending Invite)`;
                portalStaffList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No staff members invited yet.";
            portalStaffList.appendChild(li);
        }

        // Switch to dashboard
        deployStep.classList.remove('active');
        dashStep.classList.add('active');
        
        // Scroll to container
        document.getElementById('launch-card-container').scrollIntoView();
        
        // Trigger lucide icons inside dashboard
        lucide.createIcons();
    }
});
