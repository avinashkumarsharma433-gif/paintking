# PaintKing Surface Solutions - Operations OS (ERP/MES) Documentation
**Document Version:** 1.0.0  
**Last Updated:** October 2026  
**Standards Compliance:** ISO 9001:2015 & IATF 16949

---

## 1. Executive Architecture Overview

PaintKing Operations OS is an industrial Manufacturing Execution System (MES) and Enterprise Resource Planning (ERP) platform custom-engineered for high-volume custom surface coating, 3D hydrographic dipping, flatbed UV printing, and thermoplastic injection molding.

### Core Tech Stack
* **Framework:** React 19 + TypeScript + Vite
* **Styling:** Tailwind CSS v4 (@theme tokens)
* **Design Philosophy:** Editorial Industrial Luxury (PaintKing Gold `#c09748`, Deep Charcoal `#17191c`, Fog Paper `#fafafb`)
* **State Management:** Reactive Persistent Context Store (`PortalStoreContext.tsx`) with LocalStorage syncing and real-time multi-plant isolation.
* **Document Engine:** jsPDF with automated table generators, ISO 9001 headers, and dynamic QR traceability codes.

---

## 2. End-to-End Plant Floor Workflow Pipeline

```
  ┌────────────────────────────────────────────────────────┐
  │ 1. Gate Inward & Security Verification                │
  │    • Inward Gate Pass (PK-SEC-GP-001)                  │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. Incoming Quality Control (IQC)                     │
  │    • 20% Sampling Rule (AQL Standard)                  │
  │    • 7 Core Aspects Verification & Discrepancy Flag    │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. Stores & Inventory Management                      │
  │    • Goods Receipt Note (GRN - PK-STR-GRN-001)         │
  │    • Material Issue Notes (MIN) against Floor MRNs     │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 4. Quality Gate 1: Pre-Production Inspection (PIR)     │
  │    • PK-QA-PIR-001 (100% Substrate Check)              │
  │    • IPA Wiping, De-dusting, Burrs, Count Verification │
  └───────────────────────────┬────────────────────────────┘
                              ▼ (MANDATORY REQUIREMENT)
  ┌────────────────────────────────────────────────────────┐
  │ 5. Quality Gate 2: First Part Approval (FPA)           │
  │    • PK-QA-FPA-001 (Golden Gate Sample)                │
  │    • Delta-E <= 0.70 & ASTM 5B Cross-Hatch Adhesion    │
  │    • LOCKED until Gate 1 (PIR) Passes                  │
  └───────────────────────────┬────────────────────────────┘
                              ▼ (MASS PRODUCTION UNLOCKED)
  ┌────────────────────────────────────────────────────────┐
  │ 6. Production Execution & 3-Painter Line Allocation    │
  │    • Master Job Cards & Painter Sub-Cards (P1/P2/P3)   │
  │    • Max-2 Active Jobs Guardrail per Painter           │
  │    • Shift Progress Logging & 3-Stage Handshakes       │
  └───────────────────────────┬────────────────────────────┘
                              ▼ (PARALLEL AUDITS)
  ┌────────────────────────────────────────────────────────┐
  │ 7. Quality Gate 3: In-Process Quality Control (IPQC)   │
  │    • PK-QA-IPQ-001 (8 Exact 3-Hourly Shift Slots)      │
  │    • Time-locked slot audit protection                 │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 8. Outgoing Quality Clearance (OQC / PDI)             │
  │    • PK-QA-OQC-001 Release Approval                    │
  │    • Defect Routing to Rework Child Cards (Sand/Respray)│
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 9. Packing, Billing & Outward Gate Pass               │
  │    • Box Packing Slip with QR Code (PK-STR-PKG-001)    │
  │    • Commercial Tax Invoice against Cleared PDI Qty    │
  │    • Outward Dispatch Gate Pass (PK-SEC-GP-002)        │
  └────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Module Breakdown & Core Responsibilities

### Module A: Gate Security & Vehicle Ingest (`GatePassView.tsx`)
* **Doc Numbers:** `PK-SEC-GP-001` (Inward), `PK-SEC-GP-002` (Outward).
* **Workflow:** Transporter vehicle number, driver name, challan number, party name, item description, and quantity verification at factory gate.
* **Handshake:** Real-time push into `materialInwardLogs` for IQC queue ingestion.

### Module B: Incoming Quality Control (`QAView.tsx`)
* **Standard:** `PK-QA-IQC-001`.
* **Logic:** 
  * 20% statistical sampling of all raw substrates.
  * 7 Core Aspects inspection (Box condition, transit damage, sink marks, short-fill, flash, oil contamination, quantity count).
  * 1% batch rejection threshold with Return to Vendor (RTV) classification.
  * Discrepancy auto-alert to Production Manager and one-click party email dispatch.

### Module C: Stores & Inventory Custody (`StoresView.tsx`)
* **Standard:** `PK-STR-GRN-001`.
* **Logic:**
  * Converts approved IQC materials into stock balances (ABS/PC components, PU Paints, Thinners, Hardener).
  * Responds to floor Material Requisition Notes (MRN) with Material Issue Notes (MIN).
  * Aging analysis and shelf-life tracking for 2K chemicals.

### Module D: Production Floor, Job Cards & Line Fleet (`JobCardsView.tsx`)
* **Standards:** `PK-PRD-JCR-001` (Master Card), `Doc No: 001`.
* **Logic:**
  * **Master & Painter Split:** Splits Master Card into 3 sub-cards (P1: Ramesh, P2: Suresh, P3: Mahesh).
  * **Painter Guardrail:** Enforces max 2 active jobs per painter to prevent floor bottlenecking.
  * **Inter-Stage Custody Handshakes:** 3-stage validation (Stage 1: Base Coat $\rightarrow$ Stage 2: 3D Dipping/UV $\rightarrow$ Stage 3: Clear Lacquer & Curing).
  * **Rework Salvage Queue:** Routes defective parts to Rework Child Cards (`JC-xxx-RW1`) with defect-specific sanding instructions instead of immediate scrapping.

### Module E: Sequential Quality Gates Architecture
1. **Gate 1: Pre-Production Inspection (PIR - `PreProductionInspectionModal.tsx`):**
   * Verifies 100% pre-treatment quality (IPA solvent wiping, static de-dusting, flash/burrs removal, hook jigging, piece count).
   * Generates official Portrait A4 PDF (`PK-QA-PIR-001`).
2. **Gate 2: First Part Approval (FPA - `FPAModal.tsx`):**
   * **STRICT LOCK:** Completely disabled until Gate 1 (PIR) passes.
   * Golden sample coupon tested for spectrophotometer Delta-E ($\le 0.70$) and ASTM 5B cross-cut adhesion (100% tape pass).
   * **Lot-Wide Sync:** Once approved, all painter sub-cards for that lot automatically unlock for mass spraying.
3. **Gate 3: In-Process Quality Control (IPQC - `IPQCModal.tsx`):**
   * 8 discrete 3-hourly time slots (08:00–11:00, 11:00–14:00, etc.).
   * Strict time-gating: Only the active time slot is open for recording; future slots are locked to prevent forged back-dated audits.

### Module F: Paint Mixing Lab (`PaintMixingView.tsx`)
* **Standard:** `PK-PRD-PMX-001`.
* **Logic:** Formula recipes, base-to-hardener thinner ratios, Ford Cup #4 viscosity timing (target: 14–16s), and 2K pot-life expiry timers.

### Module G: Packing, Box QR & Billing (`PackingView.tsx`, `BillingView.tsx`)
* **Standards:** `PK-STR-PKG-001` (Packing Slip), `PK-ACC-INV-001` (GST Invoice).
* **Logic:**
  * Packing slips generated strictly from PDI/OQC cleared quantities.
  * Dynamic scannable QR codes containing box traceability metadata.
  * Invoice generator matching Customer PO with excess quantity and client concession approval triggers.

---

## 4. Universal Document & PDF Generation Standards

All official printable documents generated by the system adhere to `src/portal/utils/pdfStandardHeader.ts`:
* **Orientation:** Portrait A4 standard (`orientation: 'portrait'`, `format: 'a4'`).
* **Header Architecture:** Standard PaintKing company logo, registration details, dynamic Indian timestamp (`DD-MM-YYYY HH:MM`), and 2/3-column metadata field grids (`drawMetaField`).
* **Table Styling Rule:**
  * Table Header Fill: Light Grey `doc.setFillColor(242, 242, 243);` (Never dark black).
  * Table Header Text: Deep Charcoal `doc.setTextColor(23, 25, 28);` (Bold 7.0–7.5pt).
  * Borders: Uniform grid border `TABLE_BORDER_COLOR = [180, 185, 195]` and line width `0.45pt`.
  * Striping: Alternating white (`255, 255, 255`) and soft fog tint (`235, 238, 244`).
* **Footer:** ISO 9001:2015 & IATF 16949 compliance seal with 3-tier authorized signatures (Inspector, Supervisor, QA Manager).

---

## 5. Directory & File Reference Map

```
src/portal/
├── components/
│   ├── CreateGRNModal.tsx               # Inward Goods Receipt Note Form
│   ├── FPAModal.tsx                     # Gate 2: First Part Approval Golden Sample
│   ├── IPQCModal.tsx                    # Gate 3: 3-Hourly Multi-Slot Line Audit
│   ├── PreProductionInspectionModal.tsx # Gate 1: Pre-Production Substrate Check
│   ├── JobCardModal.tsx                 # Master & Child Job Card Creator
│   ├── PaintkingDatePicker.tsx          # Indian DD-MM-YYYY Date Picker
│   ├── OfficialGRNDocument.tsx          # Standard GRN printable view
│   └── UniversalEmailModal.tsx          # Direct client/vendor email dispatcher
├── context/
│   └── PortalStoreContext.tsx           # Global state, localStorage engine & handlers
├── data/
│   └── mockInitialData.ts               # Seed data for all ERP registers and jobs
├── types/
│   └── portalTypes.ts                   # Universal TypeScript interfaces & enums
├── utils/
│   ├── pdfStandardHeader.ts             # jsPDF Standard Engine & report generators
│   └── emailDispatchEngine.ts           # Email composer & notification formatter
└── views/
    ├── DashboardView.tsx                # Plant-wide KPI & executive overview
    ├── JobCardsView.tsx                 # Production Floor, Split & Quality Gates
    ├── PainterWorkspaceView.tsx         # Kiosk Touch Screen for Painters (P1/P2/P3)
    ├── QAView.tsx                       # Complete Quality Hub (IQC, PIR, FPA, IPQC, OQC)
    ├── StoresView.tsx                   # Store Inventory, Stocks & Balances
    ├── PaintMixingView.tsx              # Shade formulation & Ford Cup #4 Viscosity
    ├── PackingView.tsx                  # Barcode/QR Box packaging & slips
    ├── BillingView.tsx                  # PDI Cleared Billing & Concession approvals
    └── GatePassView.tsx                 # Inward/Outward Security Gate verification
```
