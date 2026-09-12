# PaintKing Surface Solutions & Operations OS (`PK-OS`)

> **Brand Entity:** PaintKing Surface Solutions  
> **Platform:** Enterprise Web Portal & Shopfloor Operations Management OS  
> **Architecture:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Motion React + Lucide Icons  
> **Compliance Standard:** ISO 9001:2015 / IATF-Aligned Shopfloor System  

---

## 🌟 Overview

PaintKing is India's premier B2B custom surface finishing, liquid spray painting, hydrographic 3D immersion dipping, industrial flatbed direct UV printing, and custom thermoplastic injection moulding enterprise.

This repository powers both:
1. **The Official Public Brand Website:** Editorial luxury aesthetic combining clean Swiss precision, spacious typography, and the signature PaintKing Gold accent (`#c09748`).
2. **PaintKing Operations OS (`PK-OS`):** A centralized industrial operations operating system solving the two core shopfloor challenges:
   - **Order Color-Split Mismatch & Smart Billing Reconciliation:** Tracking exact color splits (e.g. 250 Red + 750 Black) and preventing unapproved customer over-billing.
   - **Digital Chain-of-Custody & Inter-Stage Handover Ledger:** Enforcing a mandatory two-way verification handshake between production stations to eliminate mystery shrinkage.

---

## 🚀 Key Modules & Departmental Workstations

- **Executive Cockpit (`PK-SYS-DSH-001`):** Real-time yield %, scrap rates, paint efficiency (pcs/L), and ISO defect Pareto analysis (D01–D16).
- **Stores & Goods Receipt Note (`PK-STR-GRN-001`):** Inward truck registration with multi-color job requirement breakdown and automatic child Job Card generation.
- **Job Cards & Color Caps (`PK-PRD-JCR-001`):** Real-time color spray tracking with automated target cap alerts (`⚠️ Over-Run Flagged`).
- **Inter-Stage Custody Handover (`PK-PRD-TRF-001`):** 7-stage manufacturing sequence pipeline with instant discrepancy halts and supervisor investigation sign-offs.
- **Industrial Quality Assurance (`PK-QA-FPA-001`):** First Part Approval (FPA) Golden Gate clearance ($\Delta E \le 0.70$ colorimetry + 100% cross-cut adhesion).
- **Paint Mixing Lab (`PK-PRD-PMX-001`):** 4:1:1 mix ratio verification, Ford 4 cup viscosity logging, and pot life monitoring.
- **Packing & Thermal QR Labels (`PK-QA-PKG-001`):** Traceability box slips with 4"x6" automotive thermal QR sticker generation.
- **Commercial Billing & PO Reconciliation (`PK-ACC-INV-001`):** 3-way line item reconciliation, finished goods buffer quarantine, and 18% GST (CGST 9% + SGST 9%) tax invoice generator.
- **Security Gate Pass (`PK-SEC-GTP-001`):** Inward vehicle check-in and outward delivery exit authorization.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build test
npm run build
```

---

## 🚢 Continuous Deployment

This repository is continuously deployed to **Vercel**. Every commit pushed to the `main` branch automatically triggers a production build.

