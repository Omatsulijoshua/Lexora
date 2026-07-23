"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Info, Palette, Eye } from "lucide-react";
import "../brand.css";

const logoAssets = [
  { name: "logo_horizontal_light.svg", title: "Horizontal Logo (Light Theme)", theme: "dark-bg" },
  { name: "logo_horizontal_dark.svg", title: "Horizontal Logo (Dark Theme)", theme: "light-bg" },
  { name: "logo_stacked_light.svg", title: "Stacked Logo (Light Theme)", theme: "dark-bg" },
  { name: "logo_stacked_dark.svg", title: "Stacked Logo (Dark Theme)", theme: "light-bg" },
  { name: "logo_icon_light.svg", title: "Brand Icon Only (Light Theme)", theme: "dark-bg" },
  { name: "logo_icon_dark.svg", title: "Brand Icon Only (Dark Theme)", theme: "light-bg" },
  { name: "logo_monochrome_white.svg", title: "Monochrome Logo (White)", theme: "dark-bg" },
  { name: "logo_monochrome_black.svg", title: "Monochrome Logo (Black)", theme: "light-bg" },
  { name: "logo_icon_app.svg", title: "App Store Mockup Icon", theme: "app-bg" }
];

export default function BrandGuidelines() {
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  const handleDownload = (filename) => {
    triggerToast(`Downloading branding file: ${filename}...`);
  };

  return (
    <div className="dark-theme brand-guidelines-page">
      <div className="brand-layout-container">
        
        {/* Navigation Header */}
        <header className="brand-header">
          <Link href="/" className="back-link">
            <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Home
          </Link>
          <div className="brand-title-group">
            <Palette className="brand-title-icon" />
            <h1>Lexora Corporate Brand Identity</h1>
            <p>Unified design systems, logo variations, and color tokens for the Lexora SaaS ecosystem.</p>
          </div>
        </header>

        {/* Assets Grid */}
        <section className="brand-section">
          <h2>Vector Logo Artifacts</h2>
          <p className="section-description">High-resolution SVG files formatted for developers and designers.</p>

          <div className="assets-grid">
            {logoAssets.map((asset, idx) => (
              <div className="asset-card" key={idx}>
                <div className={`asset-preview-pane ${asset.theme}`}>
                  <img 
                    src={`/assets/${asset.name}`} 
                    alt={asset.title} 
                    className="vector-image" 
                  />
                </div>
                <div className="asset-meta-info">
                  <h3>{asset.title}</h3>
                  <span>{asset.name}</span>
                  <div className="asset-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => handleDownload(asset.name)}>
                      <Download style={{ width: 12, height: 12, marginRight: 4, display: "inline" }} /> Download SVG
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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
