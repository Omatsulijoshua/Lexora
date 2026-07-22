# Lexora — Premium Legal Technology Platform

Lexora is an all-in-one legal technology SaaS platform designed for law firm owners to create and manage their law firm workspaces, invite colleagues, handle secure client intakes, billing/invoicing, document compliance, and leverage responsible legal AI.

This repository contains the official branding guidelines, high-fidelity vector assets, and an interactive landing page platform demonstration alongside full lawyer workspace and client portal applications.

---

## 📂 Project Architecture

* **[`assets/`](file:///c:/Users/Joshua/Desktop/My%20Projects/Websites/Lexora/assets)**: Contains the 9 variations of Lexora's premium logo assets in lightweight, scalable SVG format.
* **[`index.html`](file:///c:/Users/Joshua/Desktop/My%20Projects/Websites/Lexora/index.html)**: The **Brand Assets & Identity Portal**. An interactive page where developers and designers can inspect, customize card backdrops, copy inline vector markup, or download logos directly.
* **[`landing.html`](file:///c:/Users/Joshua/Desktop/My%20Projects/Websites/Lexora/landing.html)**: The **SaaS Landing Page & Interactive Platform Demo**. It showcases:
  * Marketing grids detailing the core services.
  * An interactive **Pricing/Seat Calculator** with annual discounting.
  * A functional **Responsible Legal AI Terminal Sandbox** simulating NDA and lease contract audits.
  * A step-by-step **Workspace Provisioning Wizard** that dynamically launches a mock lawyer dashboard custom-tailored to user inputs.
* **[`dashboard.html`](file:///c:/Users/Joshua/Desktop/My%20Projects/Websites/Lexora/dashboard.html)**: The **Lawyer Workspace Dashboard**. A comprehensive SaaS workspace for attorneys to manage:
  * A live **Client Database** with deposit registration capabilities.
  * A **Matters pipeline Kanban Board** supporting click-to-transition phase cards.
  * A **Dynamic Invoicing Sheet Generator** that computes hours and tax rates with custom print media queries.
  * A **Legal AI Drafting Workbench** compiling custom NDAs, retainers, and agreements.
* **[`client_portal.html`](file:///c:/Users/Joshua/Desktop/My%20Projects/Websites/Lexora/client_portal.html)**: The **Secure Client Portal Gateway**. A dedicated client login portal supporting:
  * **Milestone Progress timelines** mapping active case stages in real-time.
  * An interactive **Digital Signature Canvas pad** allowing clients to sign retainer and NDA agreements.
  * A **Stripe Credit Card Trust Account** payment form to clear bills.
* **State Synchronization**: All updates are bound dynamically using the browser's `localStorage` storage events. Dragging a case stage or generating a bill as a lawyer instantly triggers milestone or payment updates on the client's screen, and paying a bill or signing a contract as a client instantly settles accounts on the lawyer's dashboard.
* **[`landing.css`](file:///c:/Users/Joshua/Desktop/My%20Projects/Websites/Lexora/landing.css)**: Centralized design system styling sheets containing dark variables, gold gradients, animations, and sliders.
* **[`landing.js`](file:///c:/Users/Joshua/Desktop/My%20Projects/Websites/Lexora/landing.js)**: Client-side logic orchestrating interactive calculations, workspace deployment pipelines, and semantic AI text audits.

---

## 🎨 Branding System Quick Reference

* **Primary Dark Navy**: `#081A33` (RGB: `8, 26, 51` / HSL: `215°, 73%, 12%`)
* **Secondary Midnight Blue**: `#102A43`
* **Accent Gold**: `#C6A15B` (RGB: `198, 161, 91` / HSL: `39°, 50%, 57%`)
* **Champagne Accent**: `#D8C08C`
* **Neutral Dark Charcoal**: `#1C2430`
* **Fonts**: *Outfit* (Authoritative headings) and *Inter* (Sleek UI body)
