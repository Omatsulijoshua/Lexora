"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Building, Users, FolderKanban, BarChart3, Settings, LogOut, Sun, Moon, 
  ExternalLink, Info, User, PlusCircle, CheckCircle, AlertTriangle, FileText, Printer, Copy, Calendar, Download, RefreshCw
} from "lucide-react";
import "../client_portal.css";

export default function ClientPortal() {
  const [authorized, setAuthorized] = useState(false);
  const [token, setToken] = useState("");
  const [activeClient, setActiveClient] = useState("");
  const [firmHost, setFirmHost] = useState("LEXORA HOST");
  const [theme, setTheme] = useState("dark");

  // Tab navigation
  const [activeTab, setActiveTab] = useState("tab-overview");

  // Database lists
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [firmDetails, setFirmDetails] = useState({});

  // Booking states
  const [bookType, setBookType] = useState("Consultation Meeting");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookNotes, setBookNotes] = useState("");

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // E-Sign modal state
  const [showSignModal, setShowSignModal] = useState(false);
  const [signDocId, setSignDocId] = useState(null);
  const [signDocTitle, setSignDocTitle] = useState("");
  const [signDocContent, setSignDocContent] = useState("");
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // Toast status
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  // Route Guard Checks
  useEffect(() => {
    const sessionToken = sessionStorage.getItem("lexora_token");
    const role = sessionStorage.getItem("lexora_role");
    const clientName = sessionStorage.getItem("lexora_active_client");
    
    if (!sessionToken || role !== "client" || !clientName) {
      sessionStorage.clear();
      window.location.href = "/login";
    } else {
      setToken(sessionToken);
      setActiveClient(clientName);
      setAuthorized(true);
    }
  }, []);

  // Fetch Database tables helper
  const fetchAPI = async (url, options = {}) => {
    const sessionToken = sessionStorage.getItem("lexora_token");
    const headers = Object.assign({
      "Authorization": `Bearer ${sessionToken}`,
      "Content-Type": "application/json"
    }, options.headers || {});
    
    const secureOptions = Object.assign({}, options, { headers });
    
    const res = await fetch(url, secureOptions);
    const data = await res.json();
    if (res.status === 401 || res.status === 403) {
      sessionStorage.clear();
      window.location.href = "/login";
      throw new Error("Session expired. Redirecting...");
    }
    if (!res.ok) throw new Error(data.error || "API query failed");
    return data;
  };

  const loadAllDatabaseTables = async () => {
    try {
      const [clientsRes, casesRes, invoicesRes, contractsRes, appointmentsRes, settingsRes] = await Promise.all([
        fetchAPI("/api/clients"),
        fetchAPI("/api/cases"),
        fetchAPI("/api/invoices"),
        fetchAPI("/api/contracts"),
        fetchAPI("/api/appointments"),
        fetchAPI("/api/settings")
      ]);

      setClients(clientsRes);
      setCases(casesRes);
      setInvoices(invoicesRes);
      setContracts(contractsRes);
      setAppointments(appointmentsRes);
      setFirmDetails(settingsRes);

      if (settingsRes.firm) {
        setFirmHost(settingsRes.firm.toUpperCase());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load tables & verify payment callback on mount
  useEffect(() => {
    if (authorized) {
      const checkPaymentCallback = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get("payment");
        if (paymentStatus === "success") {
          const invId = urlParams.get("invoiceId");
          const amount = urlParams.get("amount");
          const clientName = urlParams.get("clientName");
          
          try {
            await fetchAPI(`/api/invoices/${invId}/pay`, {
              method: "PUT",
              body: JSON.stringify({ clientName, amount })
            });
            triggerToast("Stripe Payment verified successfully!");
            // Clear url parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            triggerDBSync();
          } catch (err) {
            triggerToast("Payment verification failed.");
          }
        }
      };
      
      checkPaymentCallback().then(() => loadAllDatabaseTables());
    }
  }, [authorized]);

  // Synchronize database updates across tabs
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (e.key === "lexora_db_sync_trigger") {
        loadAllDatabaseTables();
      }
    };
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, []);

  const triggerDBSync = () => {
    localStorage.setItem("lexora_db_sync_trigger", Date.now().toString());
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Logout
  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  // Stripe Checkout Payment Redirection
  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    triggerToast("Initiating Stripe transaction...");
    try {
      const data = await fetchAPI("/api/payments/create-checkout", {
        method: "POST",
        body: JSON.stringify({ invoiceId: payInvoiceId, amount: payAmount, clientName: activeClient })
      });
      if (data.sandbox) {
        triggerToast("Sandbox transaction authorized! Retainer updated.");
        setShowPayModal(false);
        triggerDBSync();
        loadAllDatabaseTables();
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      triggerToast("Failed to process billing transaction.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Canvas E-Signature initialization
  const startDrawing = ({ nativeEvent }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (nativeEvent.clientX || nativeEvent.touches[0].clientX) - rect.left;
    const y = (nativeEvent.clientY || nativeEvent.touches[0].clientY) - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawingSig(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawingSig) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (nativeEvent.clientX || (nativeEvent.touches && nativeEvent.touches[0].clientX)) - rect.left;
    const y = (nativeEvent.clientY || (nativeEvent.touches && nativeEvent.touches[0].clientY)) - rect.top;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawingSig(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Handle doc signature approval
  const handleApplySignature = async () => {
    const canvas = canvasRef.current;
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;

    if (canvas.toDataURL() === blank.toDataURL()) {
      triggerToast("Please draw a digital signature first!");
      return;
    }

    const docObj = contracts.find(d => d.id === signDocId);
    if (!docObj) return;

    const signedText = `${docObj.content}\n\n[DIGITALLY SIGNED VIA LEXORA CLIENT PORTAL]\nClient: ${activeClient.toUpperCase()}\nDate: ${new Date().toLocaleString()}`;

    try {
      await fetchAPI(`/api/contracts/${signDocId}/sign`, {
        method: "PUT",
        body: JSON.stringify({ content: signedText })
      });
      triggerToast("Agreement signed successfully!");
      setShowSignModal(false);
      triggerDBSync();
      loadAllDatabaseTables();
    } catch (err) {
      triggerToast(err.message);
    }
  };

  // Open e-sign modal
  const openSignatureModal = (doc) => {
    setSignDocId(doc.id);
    setSignDocTitle(`Review & Sign: ${doc.title}`);
    setSignDocContent(doc.content);
    setShowSignModal(true);

    // Init canvas context after render
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 400;
        canvas.height = 120;
        const context = canvas.getContext("2d");
        context.strokeStyle = "#FFFFFF";
        context.lineWidth = 2.5;
        context.lineCap = "round";
        contextRef.current = context;
        clearSignatureCanvas();
      }
    }, 100);
  };

  // Booking Consultation meeting
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await fetchAPI("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          client: activeClient,
          title: `${bookType} (${bookNotes || "No notes"})`,
          date: bookDate,
          time: bookTime,
          type: "Consultation"
        })
      });
      triggerToast("Consultation requested successfully!");
      setBookDate("");
      setBookTime("");
      setBookNotes("");
      triggerDBSync();
      loadAllDatabaseTables();
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const downloadSignedDoc = (title) => {
    triggerToast(`Initiating download for: ${title}.pdf`);
  };

  if (!authorized) {
    return <div className="dark-theme" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><RefreshCw className="spin" /></div>;
  }

  // Get active milestone stage
  const clientCases = cases;
  const activeCase = clientCases.length > 0 ? clientCases[0] : null;
  
  let progressWidth = "0%";
  let intakeClass = "timeline-step";
  let researchClass = "timeline-step";
  let draftingClass = "timeline-step";
  let closedClass = "timeline-step";

  if (activeCase) {
    if (activeCase.stage === "intake") {
      progressWidth = "0%";
      intakeClass += " active";
    } else if (activeCase.stage === "research") {
      progressWidth = "33%";
      intakeClass += " completed";
      researchClass += " active";
    } else if (activeCase.stage === "drafting") {
      progressWidth = "66%";
      intakeClass += " completed";
      researchClass += " completed";
      draftingClass += " active";
    } else if (activeCase.stage === "closed") {
      progressWidth = "100%";
      intakeClass += " completed";
      researchClass += " completed";
      draftingClass += " completed";
      closedClass += " completed";
    }
  }

  return (
    <div className={`client-portal-page ${theme === "dark" ? "dark-theme" : "light-theme"}`}>
      
      <div className="portal-layout">
        
        {/* Sidebar Nav */}
        <aside className="portal-sidebar">
          <div className="sidebar-brand">
            <svg viewBox="0 0 200 200" style={{ width: 28, height: 28 }} className="logo-svg">
              <path d="M 100,22 L 54,32 C 42,95 45,142 100,178" fill="none" stroke="#FFFFFF" strokeWidth="8" />
              <path d="M 100,22 L 146,32 C 153,52 153,68 150,78" fill="none" stroke="#C6A15B" strokeWidth="8" />
              <path d="M 137,132 C 128,150 118,165 100,178" fill="none" stroke="#C6A15B" strokeWidth="8" />
              <path d="M 92,140 L 132,84" fill="none" stroke="#FFFFFF" strokeWidth="11" />
              <path d="M 118,65 L 118,84 L 146,138" fill="none" stroke="#C6A15B" strokeWidth="12" />
            </svg>
            <span id="display-firm-host">{firmHost}</span>
          </div>

          <div className="sidebar-client-tag">
            <User style={{ width: 14, height: 14 }} />
            <span id="client-display-name">{activeClient}</span>
          </div>

          <nav className="sidebar-menu">
            <a 
              href="#" 
              className={`menu-item ${activeTab === "tab-overview" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("tab-overview"); }}
            >
              <FolderKanban /> Case Milestones
            </a>
            <a 
              href="#" 
              className={`menu-item ${activeTab === "tab-invoices" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("tab-invoices"); }}
            >
              <FileText /> Billed Invoices
            </a>
            <a 
              href="#" 
              className={`menu-item ${activeTab === "tab-documents" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("tab-documents"); }}
            >
              <FileText /> Legal Agreements
            </a>
            <a 
              href="#" 
              className={`menu-item ${activeTab === "tab-calendar" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); setActiveTab("tab-calendar"); }}
            >
              <Calendar /> Book Consultations
            </a>
          </nav>

          <div className="sidebar-footer">
            <button className="btn btn-secondary btn-full" onClick={handleLogout}>
              <LogOut /> Log Out Securely
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="portal-main-content">
          
          {/* Topbar */}
          <header className="portal-topbar">
            <h2>Secure Client Access Node</h2>
            <button className="theme-toggle-btn" onClick={toggleTheme} id="btn-theme-toggle">
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>
          </header>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "tab-overview" && (
            <div className="tab-view active" id="tab-overview">
              <div className="card timeline-card">
                <h3>Current Matter Progress Pipeline</h3>
                <h4 id="active-case-title" className="gold-text" style={{ fontSize: "1.2rem", margin: "1rem 0" }}>
                  {activeCase ? activeCase.title : "No active matters logged."}
                </h4>

                <div className="timeline-container">
                  <div className="timeline-progress-bg">
                    <div className="timeline-progress-bar" id="milestone-progress-bar" style={{ width: progressWidth }}></div>
                  </div>

                  <div className="timeline-steps">
                    <div className={intakeClass} id="step-intake">
                      <div className="step-circle">1</div>
                      <span>Intake Review</span>
                    </div>
                    <div className={researchClass} id="step-research">
                      <div className="step-circle">2</div>
                      <span>Research & Discovery</span>
                    </div>
                    <div className={draftingClass} id="step-drafting">
                      <div className="step-circle">3</div>
                      <span>Drafting & Review</span>
                    </div>
                    <div className={closedClass} id="step-closed">
                      <div className="step-circle">4</div>
                      <span>Case Closed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Case information */}
              <div className="card" style={{ marginTop: "2rem" }}>
                <h3>Case Files Repository</h3>
                <p>Verify active documents or billed values in the side navigation panels.</p>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICES */}
          {activeTab === "tab-invoices" && (
            <div className="tab-view active" id="tab-invoices">
              <div className="card">
                <h3>Billed Invoices Statement</h3>
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Date Billed</th>
                      <th>Description of Work</th>
                      <th>Total Amount</th>
                      <th>Payment Status</th>
                      <th>Execute Action</th>
                    </tr>
                  </thead>
                  <tbody id="client-invoices-tbody">
                    {invoices.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--slate-500)" }}>No invoices billed to your account.</td></tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td><strong>#INV-{inv.id}</strong></td>
                          <td>{inv.date}</td>
                          <td>{inv.description}</td>
                          <td className="gold-text"><strong>${parseFloat(inv.amount).toLocaleString()}</strong></td>
                          <td>
                            <span className={`badge-status ${inv.status === "Paid" ? "active" : "inactive"}`}>{inv.status}</span>
                          </td>
                          <td>
                            {inv.status === "Unpaid" ? (
                              <button 
                                className="btn btn-gold btn-small"
                                onClick={() => { setPayInvoiceId(inv.id); setPayAmount(inv.amount); setShowPayModal(true); }}
                              >
                                Pay Now
                              </button>
                            ) : (
                              <span className="badge-status active">Settled</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === "tab-documents" && (
            <div className="tab-view active" id="tab-documents">
              <div className="card">
                <h3>Agreements Pending Review</h3>
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Agreement Description</th>
                      <th>Document Type</th>
                      <th>Generated Date</th>
                      <th>Signing Status</th>
                      <th>E-Sign Action</th>
                    </tr>
                  </thead>
                  <tbody id="client-documents-tbody">
                    {contracts.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--slate-500)" }}>No files pending review.</td></tr>
                    ) : (
                      contracts.map((doc) => (
                        <tr key={doc.id}>
                          <td><strong>{doc.title}</strong></td>
                          <td>{doc.type.toUpperCase()} File</td>
                          <td>July 21, 2026</td>
                          <td>
                            <span className={`badge-status ${doc.status === "Signed" ? "active" : "inactive"}`} style={{ textTransform: "capitalize" }}>{doc.status}</span>
                          </td>
                          <td>
                            {doc.status === "Draft" ? (
                              <button 
                                className="btn btn-gold btn-small"
                                onClick={() => openSignatureModal(doc)}
                              >
                                Review & Sign
                              </button>
                            ) : (
                              <button 
                                className="btn btn-secondary btn-small"
                                onClick={() => downloadSignedDoc(doc.title)}
                              >
                                <Download style={{ width: 12, height: 12, marginRight: 4, display: "inline" }} /> Download
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CALENDAR */}
          {activeTab === "tab-calendar" && (
            <div className="tab-view active" id="tab-calendar">
              <div className="calendar-booking-grid">
                
                {/* Booking form */}
                <div className="card">
                  <h3>Book Consultation With Firm</h3>
                  <form onSubmit={handleBookAppointment} id="book-appointment-form">
                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                      <label htmlFor="book-appt-type">Consultation Specialty</label>
                      <select 
                        id="book-appt-type"
                        value={bookType}
                        onChange={(e) => setBookType(e.target.value)}
                        required
                      >
                        <option value="Case Auditing Review">Case Auditing Review</option>
                        <option value="Contract Scope Advisory">Contract Scope Advisory</option>
                        <option value="Litigation Strategy Session">Litigation Strategy Session</option>
                      </select>
                    </div>
                    <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div className="form-group">
                        <label htmlFor="book-appt-date">Preferred Date</label>
                        <input 
                          type="date" 
                          id="book-appt-date" 
                          value={bookDate}
                          onChange={(e) => setBookDate(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="book-appt-time">Preferred Time</label>
                        <input 
                          type="time" 
                          id="book-appt-time" 
                          value={bookTime}
                          onChange={(e) => setBookTime(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                      <label htmlFor="book-appt-notes">Additional Context Notes</label>
                      <textarea 
                        id="book-appt-notes" 
                        value={bookNotes}
                        onChange={(e) => setBookNotes(e.target.value)}
                        placeholder="Add details for the attorney chamber..."
                      />
                    </div>
                    <button type="submit" className="btn btn-gold btn-full">Submit Request</button>
                  </form>
                </div>

                {/* List appointments */}
                <div className="card">
                  <h3>Your Scheduled Consultations</h3>
                  <ul className="appointments-list-view" id="client-appointments-list">
                    {appointments.length === 0 ? (
                      <li><span style={{ color: "var(--slate-500)" }}>No consultations requested.</span></li>
                    ) : (
                      appointments.slice().sort((a,b) => a.date.localeCompare(b.date)).map((a) => (
                        <li key={a.id}>
                          <div className="appt-info">
                            <strong>{a.title}</strong>
                            <span>Status: Confirmed</span>
                          </div>
                          <div className="appt-date-badge">
                            <span>{a.date}</span><br />
                            <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>{a.time}</span>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* STRIPE PAYMENT MODAL */}
      {showPayModal && (
        <div className="modal open" id="payment-modal">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3>Secure Invoice Billing</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>×</button>
            </div>
            
            <div className="payment-invoice-summary" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "6px", margin: "1rem 0" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--slate-500)" }}>RECEIVABLE AMOUNT:</span>
              <h2 id="pay-total-amount" style={{ margin: "0.5rem 0", color: "var(--gold)" }}>${parseFloat(payAmount).toLocaleString()}</h2>
              <span style={{ fontSize: "0.75rem" }}>Firm: <strong id="pay-firm-name">{firmHost}</strong></span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleProcessPayment(); }} id="stripe-payment-form">
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Billing Entity</label>
                <input type="text" value={activeClient} readOnly />
              </div>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Card details</label>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-glass)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ color: "var(--slate-500)", fontSize: "0.9rem" }}>💳 Mock Stripe Card Mounted</span>
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-gold btn-full"
                id="btn-submit-payment"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? <RefreshCw className="spin" /> : "Redirect to Secure Checkout"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* E-SIGN SIGNATURE MODAL */}
      {showSignModal && (
        <div className="modal open" id="signature-modal">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 id="sig-doc-title">{signDocTitle}</h3>
              <button className="modal-close" onClick={() => setShowSignModal(false)}>×</button>
            </div>
            
            <textarea 
              className="sig-contract-preview" 
              id="sig-contract-preview-text" 
              value={signDocContent}
              readOnly 
              style={{ width: "100%", height: "200px", padding: "1rem", background: "rgba(0,0,0,0.2)", color: "var(--slate-300)", border: "1px solid var(--border-glass)", borderRadius: "6px", fontFamily: "monospace", margin: "1rem 0" }}
            />

            <div className="signature-pad-container" style={{ margin: "1.5rem 0" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", display: "block", marginBottom: "0.5rem" }}>DRAW DIGITAL SIGNATURE INSIDE ESCROW CANVAS:</span>
              <canvas 
                id="signature-pad"
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed var(--border-glass)", borderRadius: "6px", cursor: "crosshair", display: "block", margin: "0 auto" }}
              />
              <button 
                className="btn btn-secondary btn-small" 
                onClick={clearSignatureCanvas}
                style={{ marginTop: "0.5rem" }}
              >
                Clear Canvas
              </button>
            </div>

            <button className="btn btn-gold btn-full" onClick={handleApplySignature}>Apply Digital Signature</button>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      <div className={`toast ${showToast ? "show" : ""}`} id="toast">
        <div className="toast-content">
          <Info className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      </div>

    </div>
  );
}
