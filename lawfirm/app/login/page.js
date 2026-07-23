"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Info, Lock, ArrowLeft } from "lucide-react";
import "../login.css";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login"); // "login" or "signup"
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
  const [signupFirm, setSignupFirm] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Toast status
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Read query parameters on mount to pre-fill firm name
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const firmName = params.get("firm");
    if (firmName) {
      setActiveTab("signup");
      setSignupFirm(firmName);
    }
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    triggerToast("Authorizing session with secure node...");

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login credentials unauthorized");
      return data;
    })
    .then(data => {
      // Save JWT Session details
      sessionStorage.setItem("lexora_token", data.token);
      sessionStorage.setItem("lexora_role", data.role);
      sessionStorage.setItem("lexora_email", data.email);
      sessionStorage.setItem("lexora_firm_name", data.firmName);
      
      if (data.role === "client") {
        sessionStorage.setItem("lexora_active_client", data.client_name);
        triggerToast("Client Authentication Success! Launching Portal...");
        setTimeout(() => {
          window.location.href = "/portal";
        }, 1000);
      } else {
        triggerToast("Lawyer Authentication Success! Launching Workspace...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      }
    })
    .catch(err => {
      triggerToast(err.message);
    });
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    triggerToast("Provisioning firm database workspace...");

    fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmName: signupFirm, email: signupEmail, password: signupPassword })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      return data;
    })
    .then(data => {
      // Save JWT Session details
      sessionStorage.setItem("lexora_token", data.token);
      sessionStorage.setItem("lexora_role", data.role);
      sessionStorage.setItem("lexora_email", data.email);
      sessionStorage.setItem("lexora_firm_name", data.firmName);

      triggerToast("Workspace Provisioned successfully!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    })
    .catch(err => {
      triggerToast(err.message);
    });
  };

  return (
    <div className="dark-theme login-wrapper-page">
      <div className="login-wrapper">
        
        {/* Header Branding */}
        <div className="login-brand">
          <svg viewBox="0 0 200 200" style={{ width: 36, height: 36 }} id="login-brand-logo">
            <path d="M 100,22 L 54,32 C 42,95 45,142 100,178" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 100,22 L 146,32 C 153,52 153,68 150,78" fill="none" stroke="#C6A15B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 137,132 C 128,150 118,165 100,178" fill="none" stroke="#C6A15B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 92,140 L 132,84" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round"/>
            <path d="M 66,66 L 79,66 M 73,66 L 73,124 L 104,124" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 118,65 L 118,84 L 146,138" fill="none" stroke="#C6A15B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>LEXORA</span>
        </div>

        {/* Login Box Card */}
        <div className="login-box">
          
          {/* Tab Toggles */}
          <div className="login-tabs">
            <button 
              className={`login-tab-btn ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Account Sign In
            </button>
            <button 
              className={`login-tab-btn ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveTab("signup")}
            >
              Register Firm
            </button>
          </div>

          {/* Sign In Form */}
          {activeTab === "login" && (
            <div className="login-form-pane active">
              <h3>Secure Credentials Login</h3>
              <p className="pane-description">Authorized lawyers and clients enter secure access parameters below.</p>
              
              <form onSubmit={handleLoginSubmit}>
                <div className="login-group">
                  <label htmlFor="login-email">Access Email Address</label>
                  <input 
                    type="email" 
                    id="login-email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. lawyer@lexora.app" 
                    required 
                  />
                </div>
                <div className="login-group">
                  <label htmlFor="login-password">Account Password</label>
                  <input 
                    type="password" 
                    id="login-password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-gold btn-full">Secure Sign In</button>
              </form>
            </div>
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <div className="login-form-pane active">
              <h3>Provision Law Workspace</h3>
              <p className="pane-description">Configure your new multi-tenant law firm workspace in under 10 seconds.</p>
              
              <form onSubmit={handleSignupSubmit}>
                <div className="login-group">
                  <label htmlFor="signup-firm">Law Firm Name</label>
                  <input 
                    type="text" 
                    id="signup-firm" 
                    value={signupFirm}
                    onChange={(e) => setSignupFirm(e.target.value)}
                    placeholder="e.g. Apex Legal Associates" 
                    required 
                  />
                </div>
                <div className="login-group">
                  <label htmlFor="signup-email">Administrator Email</label>
                  <input 
                    type="email" 
                    id="signup-email" 
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. partner@apexlegal.com" 
                    required 
                  />
                </div>
                <div className="login-group">
                  <label htmlFor="signup-password">Choose Password</label>
                  <input 
                    type="password" 
                    id="signup-password" 
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-gold btn-full">Provision Workspace</button>
              </form>
            </div>
          )}

        </div>

        {/* Redirect Home */}
        <Link href="/" className="back-home-link">
          <ArrowLeft style={{ width: 14, height: 14, display: "inline", marginRight: 4 }} /> Return to Landing Page
        </Link>
      </div>

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
