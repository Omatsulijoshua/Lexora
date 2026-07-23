"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Scale, Users, Shield, Zap, LayoutDashboard, FileText, CheckCircle, HelpCircle, ArrowRight, Play, RefreshCw, BarChart2 } from "lucide-react";
import "./landing.css";

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

export default function LandingPage() {
  // Pricing Slider State
  const [seats, setSeats] = useState(5);
  const [storage, setStorage] = useState(100);
  const [isAnnual, setIsAnnual] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [tierName, setTierName] = useState("PROFESSIONAL");

  // AI Sandbox State
  const [activeTemplate, setActiveTemplate] = useState("nda");
  const [terminalLines, setTerminalLines] = useState([
    { text: "// Selected template: Mutual NDA Agreement", type: "input" },
    { text: "// Click 'Run AI Analysis' to audit...", type: "input" }
  ]);
  const [isDrafting, setIsDrafting] = useState(false);
  const terminalEndRef = useRef(null);

  // Workspace Wizard State
  const [firmName, setFirmName] = useState("");
  const [practiceArea, setPracticeArea] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [wizardStep, setWizardStep] = useState(1); // 1 = Form, 2 = Deploying, 3 = Complete
  const [deployLogs, setDeployLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Pricing Calculation
  useEffect(() => {
    let total = 30 + (seats * 15) + (storage * 0.15);
    if (isAnnual) {
      total = total * 0.8;
    }
    setTotalPrice(Math.round(total));

    let tier = "PROFESSIONAL";
    if (seats <= 3 && storage <= 50) {
      tier = "STARTER / BASIC";
    } else if (seats > 25 || storage > 500) {
      tier = "ENTERPRISE PRO";
    }
    setTierName(tier);
  }, [seats, storage, isAnnual]);

  // Terminal Auto Scroll
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLines]);

  // Deploy Logs Auto Scroll
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [deployLogs]);

  // AI Analysis Simulation
  const handleRunAI = async () => {
    setIsDrafting(true);
    setTerminalLines([]);

    const addLine = (text, type, delay) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setTerminalLines((prev) => [...prev, { text, type }]);
          resolve();
        }, delay);
      });
    };

    await addLine("[SYSTEM] Initializing Lexora AI Engine...", "input", 100);
    await addLine("[SYSTEM] Loading ethical legal safety filters...", "input", 200);
    await addLine("[SYSTEM] Scanning document characters...", "input", 200);

    const text = templates[activeTemplate].content;
    await addLine(`[AUDITING SOURCE]:\n${text}\n`, "output", 300);

    await addLine("[AI ENGINE] Processing NLP semantic models...", "input", 500);
    await addLine("[AI ENGINE] Matching standard legal database vectors...", "input", 400);

    if (activeTemplate === "nda") {
      await addLine("\n-----------------------------------------", "output", 200);
      await addLine("[AI RISK IDENTIFIED: HIGH]", "highlight", 100);
      await addLine("Clause: Clause 4 (Indemnification)", "output", 50);
      await addLine("Analysis: Unilateral indemnification for simple breach. Disproportional liability shifted to Recipient.", "output", 50);
      await addLine("Mitigation Rec: Amend to mutual indemnification or restrict liability cap to direct fees.", "success", 50);

      await addLine("\n[AI RISK IDENTIFIED: MEDIUM]", "output", 100);
      await addLine("Clause: Clause 9 (Survival)", "output", 50);
      await addLine("Analysis: Indefinite confidentiality survival is considered a tail risk. Standard is 3 to 5 years.", "output", 50);
      await addLine("Mitigation Rec: Amend survival to '5 years following termination of discussions'.", "success", 50);
    } else if (activeTemplate === "lease") {
      await addLine("\n-----------------------------------------", "output", 200);
      await addLine("[AI RISK IDENTIFIED: HIGH]", "highlight", 100);
      await addLine("Clause: Section 14 (Trial Waiver)", "output", 50);
      await addLine("Analysis: Severe restriction on constitutional dispute resolution rights. Jury waivers should be reciprocal.", "output", 50);
      await addLine("Mitigation Rec: Negotiate removal of jury trial waiver or introduce structured mediation first.", "success", 50);

      await addLine("\n[AI RISK IDENTIFIED: MEDIUM]", "output", 100);
      await addLine("Clause: Section 22 (Security Deposit Interest)", "output", 50);
      await addLine("Analysis: Lack of interest accumulation and escrow separation. Deposits should ideally be held in escrow.", "output", 50);
      await addLine("Mitigation Rec: Request escrow holding clause with standard interest yields.", "success", 50);
    } else {
      await addLine("\n-----------------------------------------", "output", 200);
      await addLine("[AI RISK IDENTIFIED: HIGH]", "highlight", 100);
      await addLine("Clause: Clause 6 (Intellectual Property Rights)", "output", 50);
      await addLine("Analysis: IP assigns automatically upon creation *before* invoices are cleared. Consultant risk of non-payment.", "output", 50);
      await addLine("Mitigation Rec: Amend to state: \"IP assigns immediately upon receipt of full payment for related invoices\".", "success", 50);
    }

    await addLine("\n[SYSTEM] Audit complete. 100% vectors mapped. Output clean.", "input", 500);
    setIsDrafting(false);
  };

  // Switch AI template
  const handleSwitchTemplate = (type) => {
    setActiveTemplate(type);
    setTerminalLines([
      { text: `// Switched template to: ${templates[type].title}`, type: "input" },
      { text: "// Click 'Run AI Analysis' to audit...", type: "input" }
    ]);
  };

  // Launch wizard simulation
  const startDeployment = async (e) => {
    e.preventDefault();
    setWizardStep(2);
    setDeployLogs([]);

    const log = (text, delay) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setDeployLogs((prev) => [...prev, text]);
          resolve();
        }, delay);
      });
    };

    await log("Parsing deployment parameters...", 300);
    await log(`Verifying domain: lexora.app/${firmName.toLowerCase().replace(/[^a-z0-9]/g, "")}`, 400);
    await log("Provisioning tenant database on AWS RDS (PostgreSQL)...", 600);
    await log("Applying SOC2 structural encryption parameters...", 500);
    await log(`Enabling AI capabilities for specialty: ${practiceArea}`, 400);
    await log("Configuring multi-tenant security headers...", 400);

    if (inviteEmails) {
      const list = inviteEmails.split(",").map((e) => e.trim());
      await log(`Queuing ${list.length} email invitations...`, 300);
    }

    await log("SaaS instance initialization successful!", 600);
    await log("Redirecting to workspace signup credentials configuration...", 400);

    setTimeout(() => {
      window.location.href = `/login?firm=${encodeURIComponent(firmName)}`;
    }, 1500);
  };

  return (
    <div className="dark-theme landing-wrapper">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <Link href="#" className="brand-logo">
            <svg viewBox="0 0 200 200" className="logo-svg">
              <path d="M 100,22 L 54,32 C 42,95 45,142 100,178" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 100,22 L 146,32 C 153,52 153,68 150,78" fill="none" stroke="#C6A15B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 137,132 C 128,150 118,165 100,178" fill="none" stroke="#C6A15B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 92,140 L 132,84" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round"/>
              <path d="M 66,66 L 79,66 M 73,66 L 73,124 L 104,124" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 118,65 L 118,84 L 146,138" fill="none" stroke="#C6A15B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>LEXORA</span>
          </Link>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#ai-sandbox" className="nav-link">Legal AI</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link href="/login" className="nav-link">
              <Users style={{ width: 14, height: 14, display: "inline", marginRight: 4 }} /> Secure Access
            </Link>
            <Link href="/brand" className="nav-link">
              <Zap style={{ width: 14, height: 14, display: "inline", marginRight: 4 }} /> Brand Guidelines
            </Link>
            <a href="#launch" className="btn btn-primary btn-nav">Launch App</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge"><Scale style={{ width: 12, height: 12 }} /> Enterprise Multi-Tenant Law Firm SaaS</span>
            <h1>Accelerate Your Law Practice</h1>
            <p>Deploy secure lawyer workspaces, isolate client trusts, compile invoices, and draft legally sound documents instantly using secure GPT-4 models.</p>
            <div className="hero-actions">
              <a href="#launch" className="btn btn-gold">Provision Workspace</a>
              <a href="#features" className="btn btn-secondary">Learn More</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-window">
              <div className="window-header">
                <span className="window-dot red"></span>
                <span className="window-dot yellow"></span>
                <span className="window-dot green"></span>
                <span className="window-title">lexora.app/firm/dashboard</span>
              </div>
              <div className="window-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div>
                    <h3>Apex Legal Partners</h3>
                    <small style={{ color: "var(--slate-400)" }}>Corporate Law Workspace</small>
                  </div>
                  <span className="window-pill">Active SOC2</span>
                </div>
                <div className="window-chart-mock">
                  <div className="chart-mock-bar" style={{ height: "45%" }}></div>
                  <div className="chart-mock-bar" style={{ height: "70%" }}></div>
                  <div className="chart-mock-bar" style={{ height: "95%" }}></div>
                  <div className="chart-mock-bar" style={{ height: "60%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Built for modern litigation teams</h2>
            <p>A comprehensive operations platform combining case, document, and accounting automation.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Users /></div>
              <h3>Multi-Tenancy</h3>
              <p>Completely isolated workspace datastores for different firms, ensuring strict privacy rules.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Shield /></div>
              <h3>Trust Ledgers</h3>
              <p>Keep track of client retainers and deposits in compliance with compliance frameworks.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FileText /></div>
              <h3>Contract Compiler</h3>
              <p>Generate clean, professional contracts and capture electronic signatures instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Sandbox Section */}
      <section className="ai-sandbox-section" id="ai-sandbox">
        <div className="container">
          <div className="section-header">
            <h2>Interactive Legal AI Sandbox</h2>
            <p>Select a legal document template to test the semantic risk scan analyzer.</p>
          </div>
          
          <div className="ai-sandbox-grid">
            <div className="sandbox-controls">
              <button 
                className={`btn btn-secondary btn-full sandbox-tab ${activeTemplate === "nda" ? "active" : ""}`}
                onClick={() => handleSwitchTemplate("nda")}
              >
                Mutual NDA Agreement
              </button>
              <button 
                className={`btn btn-secondary btn-full sandbox-tab ${activeTemplate === "lease" ? "active" : ""}`}
                onClick={() => handleSwitchTemplate("lease")}
              >
                Commercial Lease
              </button>
              <button 
                className={`btn btn-secondary btn-full sandbox-tab ${activeTemplate === "service" ? "active" : ""}`}
                onClick={() => handleSwitchTemplate("service")}
              >
                Consulting Contract
              </button>

              <button 
                className="btn btn-gold btn-full"
                onClick={handleRunAI}
                disabled={isDrafting}
                style={{ marginTop: "1rem" }}
              >
                {isDrafting ? <RefreshCw className="spin" /> : <Play />} Run AI Analysis
              </button>
            </div>

            <div className="sandbox-terminal">
              <div className="terminal-header">
                <span>Legal AI Risk Analysis Console</span>
              </div>
              <div className="terminal-body">
                <div className="terminal-screen" style={{ overflowY: "auto", maxHeight: "350px" }}>
                  {terminalLines.map((line, idx) => (
                    <div key={idx} className={`terminal-line ${line.type}`} style={{ whiteSpace: "pre-wrap" }}>
                      {line.text}
                    </div>
                  ))}
                  <div ref={terminalEndRef}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Slider Section */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Flexible, transparent sizing calculator</h2>
            <p>Drag the sliders below to estimate pricing parameters tailored to your firm size.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-sliders-block">
              <div className="slider-group">
                <div className="slider-label">
                  <span>Workspace User Seats</span>
                  <strong id="seats-val">{seats} Seat{seats > 1 ? "s" : ""}</strong>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={seats} 
                  onChange={(e) => setSeats(parseInt(e.target.value))} 
                  className="pricing-slider" 
                />
              </div>

              <div className="slider-group">
                <div className="slider-label">
                  <span>SOC2 Secure Storage</span>
                  <strong id="storage-val">{storage >= 1000 ? `${(storage/1000).toFixed(0)} TB` : `${storage} GB`}</strong>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="2000" 
                  step="10"
                  value={storage} 
                  onChange={(e) => setStorage(parseInt(e.target.value))} 
                  className="pricing-slider" 
                />
              </div>

              <div className="billing-cycle-toggle">
                <span>Monthly Billing</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isAnnual} 
                    onChange={(e) => setIsAnnual(e.target.checked)} 
                  />
                  <span className="slider-round"></span>
                </label>
                <span>Annual (20% Off)</span>
              </div>
            </div>

            <div className="pricing-summary-card">
              <span className="badge-tier" id="plan-tier-badge">{tierName}</span>
              <h2 id="plan-total-price">${totalPrice}<span className="period">/mo</span></h2>
              <ul className="plan-feats">
                <li id="feat-seats"><CheckCircle style={{ width: 14, height: 14, color: "var(--gold)" }} /> {seats} Attorney & Staff Seats</li>
                <li id="feat-storage"><CheckCircle style={{ width: 14, height: 14, color: "var(--gold)" }} /> {storage >= 1000 ? `${(storage/1000).toFixed(0)} TB` : `${storage} GB`} Secure Storage</li>
                <li><CheckCircle style={{ width: 14, height: 14, color: "var(--gold)" }} /> Unlimited Case Folders</li>
                <li><CheckCircle style={{ width: 14, height: 14, color: "var(--gold)" }} /> 256-bit Document Encryption</li>
              </ul>
              <a href="#launch" className="btn btn-gold btn-full">Choose Plan</a>
            </div>
          </div>
        </div>
      </section>

      {/* Launch Workspace Section */}
      <section className="launch-section" id="launch">
        <div className="container">
          <div className="launch-card">
            {wizardStep === 1 && (
              <div className="wizard-step active">
                <div className="wizard-header">
                  <h2>Provision Law Firm Workspace</h2>
                  <p>Deploy a customized, secure environment. Enter your firm details to initialize the multi-tenant SaaS server.</p>
                </div>
                
                <form className="wizard-form" onSubmit={startDeployment}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="firm-name">Law Firm Name</label>
                      <input 
                        type="text" 
                        id="firm-name" 
                        value={firmName}
                        onChange={(e) => setFirmName(e.target.value)}
                        placeholder="e.g. Omatsuli Legal Associates" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="practice-area">Practice Area</label>
                      <select 
                        id="practice-area" 
                        value={practiceArea}
                        onChange={(e) => setPracticeArea(e.target.value)}
                        required
                      >
                        <option value="">Select Specialty</option>
                        <option value="Corporate & Tech">Corporate & Tech Law</option>
                        <option value="Intellectual Property">Intellectual Property</option>
                        <option value="Criminal Defense">Criminal Defense</option>
                        <option value="Family Law">Family Law</option>
                        <option value="Real Estate">Real Estate Transactions</option>
                      </select>
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="invite-emails">Invite Staff (Emails separated by commas)</label>
                      <input 
                        type="text" 
                        id="invite-emails" 
                        value={inviteEmails}
                        onChange={(e) => setInviteEmails(e.target.value)}
                        placeholder="john@example.com, sarah@example.com" 
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-gold btn-full">Initialize SaaS Node</button>
                </form>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="wizard-step active">
                <div className="wizard-header">
                  <h2>Provisioning Workspace Instance...</h2>
                  <p>Executing multi-tenant database migrations and securing server credentials.</p>
                </div>
                
                <div className="deployment-console">
                  <div className="console-header">
                    <span>Virtual Machine Deployment Logs</span>
                  </div>
                  <div className="console-body" id="deployment-logs-box" style={{ overflowY: "auto", maxHeight: "250px" }}>
                    {deployLogs.map((logLine, idx) => (
                      <div key={idx} className="log-line">
                        {logLine}
                      </div>
                    ))}
                    <div ref={logsEndRef}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="brand-logo">LEXORA</span>
              <p>Premium Legal Technology Suite</p>
            </div>
            <div className="footer-links-group">
              <h4>System Nodes</h4>
              <Link href="/login" className="footer-link">Login Gate</Link>
              <Link href="/brand" className="footer-link">Style Guide</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Lexora Technologies Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
