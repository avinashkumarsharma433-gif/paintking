# 🧠 PaintKing Technical Architecture & Codebase Map (RAG Knowledge Base)

> **Document Type:** Retrieval-Augmented Generation (RAG) Architecture & File-by-File System Map  
> **Brand Entity:** PaintKing Surface Solutions (`https://paintking.in/`)  
> **Platform:** Public Brand Website + PaintKing Operations OS (`PK-OS`)  
> **Core Tech Stack:** Vite 6 + React 19 + TypeScript + Tailwind CSS v4 + Motion React + Lucide Icons + jsPDF  
> **Compliance Standards:** ISO 9001:2015 & IATF 16949-Aligned Industrial Shopfloor Traceability  

---

## 1. High-Level Architecture Overview

This repository operates as a unified dual-layer platform:
1. **Public Brand Experience (Client-Facing Website):** Editorial Industrial Luxury showcase highlighting PaintKing's 30+ years of manufacturing heritage, 4 finishing divisions, 14 standard finish profiles, interactive before/after substrate comparisons, client trust cloud, and technical RFQ builder.
2. **PaintKing Operations OS (`PK-OS` Portal):** An enterprise shopfloor operations management system engineered to eliminate component shrinkage, enforce digital chain-of-custody, automate incoming quality control (IQC) with ISO 2859-1 / ANSI AQL sampling, manage Stores Goods Receipt Notes (DOC NO: 00), split color-capped job cards, track paint mixing recipes, verify First Part Approvals (FPA), generate thermal QR labels, and process 18% GST tax invoices.

---

## 2. Directory Structure & File-by-File Map

```
├── public/                                # Static public assets & blog media
│   ├── assets/blogs/                      # Technical whitepapers & ISO articles (markdown + webp)
│   ├── favicon.svg                        # Brand logo SVG favicon
│   └── robots.txt                         # Search crawler directives
├── src/                                   # Application source code
│   ├── components/                        # Public website UI components
│   │   ├── BeforeAfterSlider.tsx          # Raw substrate vs coated component comparison slider
│   │   ├── DownloadCatalogue.tsx          # Client-side printable PDF product brochure generator
│   │   ├── Footer.tsx                     # Multi-plant footprint, company credentials & RFQ links
│   │   ├── Header.tsx                     # Editorial utility strip, navigation menu, and portal button
│   │   └── PageBanner.tsx                 # Breadcrumb banners with serif typography for subpages
│   ├── pages/                             # Public website pages
│   │   ├── AboutUs.tsx                    # 30-year heritage, mission, executive leadership & plants
│   │   ├── Blog.tsx                       # Scientific articles on Delta-E colorimetry & ASTM adhesion
│   │   ├── Careers.tsx                    # Talent culture, benefits, vacancies, and application dialog
│   │   ├── ContactUs.tsx                  # Technical RFQ quote builder & embedded Google Maps nodes
│   │   ├── DigitalPrinting.tsx            # UV flatbed printing division, instant LED curing & specs
│   │   ├── Gallery.tsx                    # Specimen gallery with finish filtering and sample request modal
│   │   ├── Home.tsx                       # 12-slide hero showcase, division cards, finish swatches
│   │   ├── Hydrographic.tsx               # 3D water transfer dipping science & 11-step protocol timeline
│   │   ├── InjectionMolding.tsx           # Thermoplastic molding fleet (80T to 450T) & tooling
│   │   ├── OurServices.tsx                # 4-division breakdown, substrate matrix & 5-step workflow
│   │   └── SprayPainting.tsx              # Cleanroom spray painting, ASTM 5B adhesion, FAQ accordion
│   ├── portal/                            # PaintKing Operations OS (Shopfloor Portal)
│   │   ├── components/                    # Reusable portal dialogs, modal forms & documents
│   │   │   ├── CreateGRNModal.tsx         # 3-step Store intake wizard (Pre-filled Inward ➔ IQC Count ➔ Sign-off)
│   │   │   ├── CustomSelect.tsx           # Accessible custom select dropdown with search filtering
│   │   │   ├── JobCardModal.tsx           # Issue new production job cards from store lots
│   │   │   ├── OfficialGRNDocument.tsx    # Luxury editorial Goods Received Note (DOC NO: 00 • Rev.00) view & print
│   │   │   ├── PortalHeader.tsx           # Active plant switcher, logged-in user persona & notifications
│   │   │   ├── PortalSidebar.tsx          # Collapsible navigation drawer covering all 14 portal views
│   │   │   ├── QuickInwardModal.tsx       # Rapid gate arrival modal with dynamic color breakdown rows
│   │   │   └── UniversalJobModal.tsx      # Global single-ID job history & cross-department tracking modal
│   │   ├── context/                       # Centralized global state management
│   │   │   └── PortalStoreContext.tsx     # Unified React Context holding all industrial records & mutations
│   │   ├── data/                          # Mock seed data & audit questionnaire databases
│   │   │   ├── mncAuditQuestionsData.ts   # 50+ IATF 16949 / VDA 6.3 audit checklist questions with scoring
│   │   │   └── mockInitialData.ts         # Initial mock database (Gate logs, IQC tests, GRNs, Job cards)
│   │   ├── types/                         # TypeScript data contracts & interfaces
│   │   │   └── portalTypes.ts             # All domain types (Inward, IQC, GRN, JobCard, Handover, FPA, Invoice)
│   │   ├── utils/                         # PDF document engines & assets
│   │   │   ├── paintkingLogoBase64.ts     # Embedded vector brand logo for client-side jsPDF rendering
│   │   │   └── pdfStandardHeader.ts       # Standardized vector PDF generators (Gate Pass, IQC, GRN, Tax Invoice)
│   │   ├── views/                         # Shopfloor Departmental Views
│   │   │   ├── BillingView.tsx            # GST Tax Invoice (Rule 31) & Delivery Challan (Rule 55) generator
│   │   │   ├── CalibrationView.tsx        # Gauge calibration logs, micrometer & gloss meter expiry tracker
│   │   │   ├── Capa8DView.tsx             # 8D Root Cause Analysis, 5-Why Ishikawa, and CAPA resolution
│   │   │   ├── CustodyHandoverView.tsx    # 7-stage chain of custody ledger with Discrepancy Halt protection
│   │   │   ├── DashboardView.tsx          # Executive Cockpit: Daily output, scrap rate, Pareto defect chart
│   │   │   ├── GatePassView.tsx           # Security Gate Pass (Inward vehicle register, Outward exit passes)
│   │   │   ├── HRLeaveView.tsx            # Plant workforce shift attendance, leaves & operator certifications
│   │   │   ├── JobCardsView.tsx           # Production floor color-split job cards with over-run prevention
│   │   │   ├── MncAuditView.tsx           # IATF 16949 & Tier-1 OEM audit readiness audit scorecard
│   │   │   ├── PackingView.tsx            # Final box packaging, packing slips & 4"x6" thermal QR stickers
│   │   │   ├── PaintMixingView.tsx        # Paint Kitchen: 4:1:1 mix ratios, Ford 4 viscosity, pot life timer
│   │   │   ├── ProductionOfferingView.tsx # Master manufacturing capability & pricing matrix
│   │   │   ├── QAView.tsx                 # Master IQC incoming inspection, AQL sampling, IPQC & ASTM adhesion
│   │   │   └── StoresView.tsx             # Stores intake desk, pending IQC queue, official GRN ledger
│   │   └── PortalApp.tsx                  # Portal entry point, view routing & modal coordinators
│   ├── App.tsx                            # Root application component with public website view switcher
│   ├── constants.ts                       # Public site constants, navigation items, hotline details
│   ├── data.ts                            # Public site finish library (14 profiles) & service division data
│   ├── index.css                          # Tailwind CSS v4 `@theme` configuration, typography & focus rings
│   ├── main.tsx                           # React 19 bootstrap mount onto `#root`
│   └── types.ts                           # Public site TypeScript interfaces
├── vite.config.ts                         # Vite build configuration, Tailwind v4 plugin, watcher ignore rules
├── tsconfig.json                          # TypeScript compiler configuration (strict mode)
└── package.json                           # Dependencies & project scripts
```

---

## 3. End-to-End Shopfloor Industrial Lifecycle

The Operations OS coordinates a 9-station linear pipeline where data flows seamlessly without duplicate entry:

```
[1. Gate Security Inward] 
   └── Truck check-in (Challan No, Vehicle No, Party, Description, Total Qty)
         │
         ▼
[2. Master IQC & AQL Sampling (QAView)]
   └── Line-item intake check, ANSI/ASQ Z1.4 sampling size, 7 visual checkpoints,
       Defect breakdown, Pass/Fail disposition ➔ Generates Master IQC Certificate (PK-QA-IQC-001)
         │
         ▼
[3. Stores Goods Receipt Note (StoresView / CreateGRNModal)]
   └── Store Incharge reviews pre-filled Gate & IQC data, confirms Actual Received count,
       reconciles Short/Excess ➔ Generates Official GRN (DOC NO: 00 • Rev.00) & updates Inventory
         │
         ▼
[4. Job Card Release & Color Caps (JobCardsView)]
   └── Store releases raw substrates to Production with strict Color-Split Job Cards (e.g. 250 Red + 750 Black).
       Enforces Over-Run Flags if operators exceed ordered quantities.
         │
         ▼
[5. Paint Kitchen Mixing (PaintMixingView)]
   └── Base, hardener, thinner 4:1:1 ratio, Ford 4 viscosity cup seconds, pot life timer.
         │
         ▼
[6. Inter-Station Custody Handover (CustodyHandoverView)]
   └── Mandatory two-way verification handshake (Sender Qty vs Receiver Qty).
       If Sender ≠ Receiver, system triggers a "Discrepancy Halt" requiring supervisor sign-off.
         │
         ▼
[7. First Part Approval (FPA Golden Gate in QAView)]
   └── Spectrophotometer Delta-E test (ΔE ≤ 0.70) + ASTM D3359 cross-hatch tape test.
         │
         ▼
[8. Packing & Traceability (PackingView)]
   └── Final carton packaging, box slips, and 4"x6" industrial thermal QR labels.
         │
         ▼
[9. Commercial Billing & Outward Gate Pass (BillingView & GatePassView)]
   └── 3-way reconciliation (PO vs Sprayed vs Accepted), buffer quarantine, 18% GST Tax Invoice
       (HSN 9988) + Rule 55 Delivery Challan, followed by Outward Security Gate Pass exit.
```

---

## 4. State Management Architecture (`PortalStoreContext.tsx`)

Global application state is managed via React Context (`usePortalStore` hook) backed by local browser persistence.

### Core State Entities:
- `materialInwardLogs: MaterialInwardRecord[]` — Gate security raw arrivals.
- `iqcRecords: IQCInspectionRecord[]` — Incoming quality inspection records with AQL sample data.
- `grnList: GoodsReceiptNote[]` — Official Goods Received Notes with 8 header fields, items table, and 3 signatures.
- `jobCards: JobCard[]` — Active shopfloor job cards with color caps and live shift batch logs.
- `handovers: CustodyHandover[]` — Custody transfer ledger between the 7 manufacturing stages.
- `fpaRecords: FPATestRecord[]` — Quality lab spectrophotometer and cross-hatch adhesion clearances.
- `billingInvoices: BillingInvoice[]` — GST tax invoices and delivery challans with concession controls.
- `gatePasses: GatePassRecord[]` — Vehicle entry and exit passes.
- `calibrationTools: CalibrationTool[]` — Factory equipment calibration schedules.
- `capaReports: Capa8DReport[]` — 8D corrective and preventive action reports.
- `activePlant: string` — Multi-plant scope filter (`Haridwar`, `Vapi`, `Mumbai`, `Vasai`).
- `currentUser: UserPersona` — Role-based access control (Security, QA Lead, Store Incharge, Plant Head).

### Key State Mutation Methods:
- `addMaterialInwardRecord(record)`: Automatically routes new inward lot to IQC Pending queue.
- `addIQCRecord(record)`: Updates inward record status to `Passed`/`Accepted` and queues it into Store Intake desk.
- `addGRN(grn)`: Ingests verified quantities into Store inventory, updates inward log status to `Received into Store`, and auto-spawns color-split job cards.
- `updateJobCardSprayed(id, sprayedQty, rejectQty, defectCategory)`: Updates sprayed counts and calculates yield.
- `sendHandover(stage, senderQty, ...)`: Creates transfer ticket in `Pending Receipt` status.
- `receiveHandover(transferId, receiverQty, ...)`: Compares quantities; halts transfer if discrepancy exists.
- `resolveHandoverDiscrepancy(transferId, resolutionNote, ...)`: Supervisor sign-off to clear halt.
- `addFPATest(fpa)`: Unlocks mass production when Delta-E and adhesion criteria pass.

---

## 5. Standard PDF Generation Engine (`pdfStandardHeader.ts`)

All printable factory documentation is generated directly client-side using `jsPDF` with high-resolution vector geometry (A4 portrait/landscape and 4"x6" thermal dimensions):
- `drawStandardPdfHeader(doc)`: Draws PaintKing logo, company credentials, ISO certification badge, and champagne dividing line.
- `drawStandardPdfFooter(doc)`: Draws page numbers, confidentiality declaration, and generation timestamp.
- Specialized document generators:
  - `downloadStandardGRNPdf(grn)`: Official Goods Received Note (DOC NO: 00 • Rev.00).
  - `downloadStandardIQCPdf(record)`: Master IQC Inspection & AQL Certificate (PK-QA-IQC-001).
  - `downloadStandardGateInwardPdf(inward)`: Security Gate Inward Slip.
  - `downloadStandardTaxInvoicePdf(invoice)`: GST Tax Invoice under Section 31 CGST Act 2017 (HSN 9988).
  - `downloadStandardDeliveryChallanPdf(invoice)`: Delivery Challan under Rule 55 CGST Rules.
  - `downloadStandardBoxThermalLabel(pkg)`: 4"x6" automotive thermal barcode label.

---

## 6. Development & Build Commands

- **Start Local Dev Server:** `npm run dev` (Runs Vite on `http://localhost:3000/`)
- **Build Production Bundle:** `npm run build` (Runs `tsc` type check and Vite rollup compilation to `/dist`)
- **Lint TypeScript Code:** `npm run lint` (`tsc --noEmit`)
