# WORKING_SET.MD - PaintKing Active Work Tracker

> **Instruction for Agent:** Read this file at the start of every session. If a request touches recently edited code, jump directly to the file and anchor string below without scanning the repository. Keep only the latest 10 entries.

---

### [2026-11-03] Interactive Tax Invoice & 3-Way Reconciliation Billing System
- **Task:** Built and integrated the end-to-end Tax Invoice Creation Engine (`PK-ACC-INV-WIZARD`) in `BillingView.tsx`. Accounts officers can now review "Pending PDI Releases Ready for Invoicing", trigger 1-click invoice creation, perform 3-way line reconciliation (PO Agreed Qty vs PDI Cleared Qty vs Excess Overruns), toggle client written concession approvals, adjust contract unit rates, configure intra-state (CGST 9% + SGST 9%) vs inter-state (IGST 18%), and preview real-time financial totals with Amount in Words in INR. Updated `PortalStoreContext.tsx` with `createCustomTaxInvoice` to advance jobs to stage 6, added GST/SAC fields to `BillingInvoice`, and enhanced `downloadStandardTaxInvoicePdf` to support inter-state IGST alongside standard CGST+SGST.
- **Files Touched:**
  - `src/portal/views/BillingView.tsx` (Component: `BillingView`) | Anchor: `PK-ACC-INV-WIZARD • TAX INVOICE CREATION`
  - `src/portal/context/PortalStoreContext.tsx` (Context: `PortalStoreContext`) | Anchor: `createCustomTaxInvoice`
  - `src/portal/types/portalTypes.ts` (Interface: `BillingInvoice`) | Anchor: `gstType?: 'INTRA_STATE' | 'INTER_STATE'`
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardTaxInvoicePdf`) | Anchor: `invoice.gstType === 'INTER_STATE'`
- **Unfinished:** None.

---

### [2026-11-03] Separated OQC (Gate 4) and PDI (Gate 5) into Dedicated Quality Stages
- **Task:** Disentangled OQC and PDI into distinct industrial quality stages. Gate 4 (OQC) now focuses strictly on finished coated product inspection (Delta-E, DFT, 5B adhesion, gloss GU, visual finish), unlocking transfer to the Packing Bay. Gate 5 (PDI) now independently handles pre-dispatch verification on packaged master cartons (drop test, 4"x6" barcode traceability match, piece count vs invoice match, dunnage, vehicle readiness). Built dedicated official PDF generators (`downloadStandardOqcPdf` and `downloadStandardPdiPdf`), added Gate 5 in `PortalSidebar.tsx` and `QAView.tsx`, and wired `submitPdiClearance` to automatically trigger tax invoicing upon PDI clearance.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `activeSubTab === 'PDI'`
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `Gate 5: Pre-Dispatch (PDI)`
  - `src/portal/utils/pdfStandardHeader.ts` (Functions: `downloadStandardOqcPdf`, `downloadStandardPdiPdf`) | Anchor: `downloadStandardPdiPdf`
  - `src/portal/context/PortalStoreContext.tsx` (Context: `PortalStoreContext`) | Anchor: `submitPdiClearance`
  - `src/portal/types/portalTypes.ts` (Interface: `FinalQualityRelease`) | Anchor: `dftMicrons?: number`
- **Unfinished:** None.

---

### [2026-11-03] Full Factory Flow & Edge Cases Deep Audit & Hardening
- **Task:** Completed deep audit across all 6 factory lifecycle stages (Security Gate Inward ➔ Stores GRN ➔ Job Card Production ➔ 5 QC Gates ➔ Material Balance Return ➔ Outward Dispatch). Fixed batch overdraft risk with aggregate issue validation in `stockEngine.ts`, isolated GRN composite return keys (`grnNo___itemName`) to eliminate cross-item stock contamination, enforced positive item quantities in inward gate pass, restored proper UOM preservation for liquid chemicals in `addGRN`, added 'Part Accepted' support in `submitMasterIQCReport` and `acceptedIqcJobs`, fixed customer AND partCode matching in Stores `materialTrackerList` to prevent cross-customer stock deduction, resolved undefined passRate/rating in `getPainterPerformanceStats`, implemented missing official standard OQC PDF generator `downloadStandardOqcPdf`, and added OQC PDF download buttons in `QAView.tsx`.
- **Files Touched:**
  - `src/portal/utils/stockEngine.ts` (Functions: `validateIssue`, `applyReturn`, `getEligibleSortedBatches`) | Anchor: `validateIssue`
  - `src/portal/context/PortalStoreContext.tsx` (Context: `PortalStoreContext`) | Anchor: `submitMasterIQCReport`
  - `src/portal/views/StoresView.tsx` (Component: `StoresView`) | Anchor: `materialTrackerList`
  - `src/portal/views/GatePassView.tsx` (Component: `GatePassView`) | Anchor: `handleInwardSubmit`
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `downloadStandardOqcPdf`
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardOqcPdf`) | Anchor: `downloadStandardOqcPdf`
  - `src/portal/types/portalTypes.ts` (Interfaces: `MaterialInwardRecord`, `GRNLineItem`) | Anchor: `interface GRNLineItem`
- **Unfinished:** None.

---

### [2026-11-03] Removed Redundant Rework & Defect Clearance Dashboard
- **Task:** Removed the 'Rework & Defect Clearance' dashboard per user instruction. Removed sub-item from `PortalSidebar.tsx`, deleted the tab switcher button, the entire Rework Clearance view queue, and the route-to-rework action modal from `QAView.tsx`. Cleaned up unused imports (`RotateCcw`, `DefectCategory`) and state hooks.
- **Files Touched:**
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `Gate 4: Outward Release (OQC)`
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `activeSubTab === 'IQC'`
- **Unfinished:** None.

---

### [2026-11-03] Calibrated All Remaining QC Gates (FPA, IPQC, OQC & Modals)
- **Task:** Standardized all remaining QC gates in `QAView.tsx` to the calibrated typography & row padding standard (`12px–13px` primary text, `11px` headers and secondary metadata, `py-2.5 px-3` row padding, `whitespace-nowrap`). Upgraded Gate 2 FPA (Pending Golden Sample Queue), Gate 3 IPQC (Active Floor Line Audits & Completed IPQC Time-slot Register), Gate 4 OQC (Pending Outward Release & Cleared PDI Register), and Inspection Verification Modal tables (7 Core Aspect Checkpoints and Inward Items Intake), removing all uncalibrated `p-3` padding and upgrading all micro-text to `text-[11px]`.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `filteredPendingFpaJobs.map`
- **Unfinished:** None.

---

### [2026-11-03] Universal Table Typography & Density Standard Across All Dashboards
- **Task:** Standardized all dashboard tables across the portal to the calibrated sleek standard (`12px–13px` primary text, `11px` headers and secondary metadata, `py-2.5 px-3` row padding, `whitespace-nowrap`). Upgraded `StoresView.tsx` (Stock Tracker, Issued MIN Slips, Pending IQC, Return Slips), `GatePassView.tsx` (Inward Gate Register, Outward Gate Pass Register), `JobCardsView.tsx` (MRN Requisitions Table), `DashboardView.tsx` (Stock Priority Allocation Table), `BillingView.tsx` (3-Way Line Reconciliation Table), `CalibrationView.tsx` (Instruments Register), `ProductionOfferingView.tsx` (Offering Line Items), `Capa8DView.tsx` (4M Changes), and `PainterDetailProfileView.tsx` (Painter Jobs Table).
- **Files Touched:**
  - `src/portal/views/StoresView.tsx` (Component: `StoresView`) | Anchor: `py-2.5 px-3 whitespace-nowrap`
  - `src/portal/views/GatePassView.tsx` (Component: `GatePassView`) | Anchor: `1. INWARD REF & DATE`
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `Requisition Ref`
  - `src/portal/views/DashboardView.tsx` (Component: `DashboardView`) | Anchor: `Plant Head Action`
  - `src/portal/views/BillingView.tsx` (Component: `BillingView`) | Anchor: `Color / Finish Line`
  - `src/portal/views/CalibrationView.tsx` (Component: `CalibrationView`) | Anchor: `NABL Calibration Agency`
  - `src/portal/views/ProductionOfferingView.tsx` (Component: `ProductionOfferingView`) | Anchor: `Offered Qty`
  - `src/portal/views/Capa8DView.tsx` (Component: `Capa8DView`) | Anchor: `Change ID`
  - `src/portal/views/PainterDetailProfileView.tsx` (Component: `PainterDetailProfileView`) | Anchor: `Job Card # & Dates`
- **Unfinished:** None.

---

### [2026-11-03] Calibrated QA Table Typography Down by ~30% for Compact Sleek UI
- **Task:** Reduced visual typography and row padding by ~30% across all Quality Gates in `QAView.tsx` (Gate 0 IQC, Gate 1 PIR, Gate 2 FPA, Gate 3 IPQC, Gate 4 OQC). Primary entities (Job Card, Inward Ref, Party Name, Material Desc) scaled to `text-xs sm:text-[13px]`, secondary metadata and challans to `text-[11px]`, table headers to `py-2 px-3 text-[11px] font-bold uppercase`, badges to `px-2.5 py-0.5 text-[11px]`, action buttons to `px-3 py-1.5 text-xs`, and row padding to `py-2.5 px-3` with `whitespace-nowrap` preserved. Calibrated `Design.md` standard accordingly.
- **Files Touched:**
  - `Design.md` (Standard: `3.1 Calibrated Desktop Table Typography Standard`) | Anchor: `Balanced & Sleek Desktop Table Standard`
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `py-2.5 px-3 whitespace-nowrap`
- **Unfinished:** None.

---

### [2026-11-03] Desktop Typography Minimum Standard & High-Legibility QA Tables
- **Task:** Established official "Strict Desktop Typography Minimum Standard (Zero Micro-Text Policy)" in `Design.md`, enforcing an absolute floor of 12px (`text-xs`) on desktop, disallowing 9px-11px micro-text. Upgraded all Quality Gate tables (Gate 0 IQC, Gate 1 PIR, Gate 2 FPA, Gate 3 IPQC, Gate 4 OQC) in `QAView.tsx`: primary entities, job cards, ref codes, party names, and material descriptions upgraded to `text-sm` (14px), metadata to `text-xs` (12px), badges to `text-xs font-semibold px-3 py-1`, and buttons to `text-xs sm:text-[13px] px-4 py-2` with `p-3.5` comfortable row padding.
- **Files Touched:**
  - `Design.md` (Specification: `3.1 Strict Desktop Typography Minimum Standard`) | Anchor: `Zero Micro-Text Policy`
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `GATE 0 • PENDING INWARD IQC QUEUE`
- **Unfinished:** None.

---

### [2026-11-03] Restored IQC Tables & Universal No-Wrap Table Architecture
- **Task:** Restored the missing Gate 0 IQC pending inwards and verified reports tables in `QAView.tsx`. Enforced strict `whitespace-nowrap` across all quality gate tables (IQC, PIR, FPA, IPQC, OQC) for table headers, badges (`Pre-Spray Due`, `Golden Sample Due`, `Line Active`), buttons (`Perform PIR &rarr;`), and lot quantities, accompanied by `min-w-[760px]` horizontal scroll containers to eliminate text wrapping.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `GATE 0 • PENDING INWARD IQC QUEUE`
- **Unfinished:** None.

---

### [2026-11-03] Unified 2-State Filter (Incomplete & Completed) Across All QC Dashboards
- **Task:** Standardized all Quality Gate dashboards (Gate 1 PIR, Gate 2 FPA, Gate 3 IPQC, Gate 4 OQC) to exactly match Gate 0 IQC architecture. Installed dedicated SubTab Switchers with two luxury pill filters (`1. Incomplete / Pending Jobs` & `2. Completed Jobs / Reports`) with real-time counter badges, inline search bar with clear button, and separate 5-column desktop tables and responsive mobile cards for both pending queues and verified registers.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `GATE 1 • PRE-SPRAY PIR QUEUE`
- **Unfinished:** None.





