# WORKING_SET.MD - PaintKing Active Work Tracker

> **Instruction for Agent:** Read this file at the start of every session. If a request touches recently edited code, jump directly to the file and anchor string below without scanning the repository. Keep only the latest 10 entries.

---

### [2026-11-04] Removed Issue Date & Rev Date Strip from FPA PDF Top Right
- **Task:** 
  - Removed `'Issue Date: 01.01.2021  |  Rev: 02  |  Rev Date: 13.02.2021'` text from the top right section in `downloadStandardFPAPdf` (`pdfStandardHeader.ts`).
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `FIRST PART APPROVAL (FPA) QUALITY REPORT`
- **Unfinished:** None.

---

### [2026-11-04] Fixed Broken Font / Symbol in FPA PDF QA Head Signature
- **Task:** 
  - Replaced unsupported unicode tick symbol `✓` in jsPDF with standard text `Satish Sharma (Approved)` in Section 4 (Joint Authorization Sign-off) of `downloadStandardFPAPdf`.
  - Resolved character encoding glitch that caused spaced text rendering (`S a t i s h  S h a r m a ( A p p r o v e d ' )`).
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `Satish Sharma (Approved)`
- **Unfinished:** None.

---

### [2026-11-04] Re-aligned Table 3 (CIELAB) Columns Directly with Table 1 Layout
- **Task:** 
  - Standardized Table 3 column boundaries to mirror Table 1 perfectly: `[14, 23, 56, 92, 126, 196]` with S1-S5 at `[126, 140, 154, 168, 182, 196]`.
  - Fixed excessive spacing: Parameter column set to 33mm (matching Table 1), Master Target centered at 74mm (36mm width), Instrument centered at 109mm (34mm width).
  - Renamed Row D label to `Delta-E (Color Variance)` so it fits comfortably within the 33mm parameter column without crowding.
  - Eliminated wide gap between Instrument and S1 column, giving uniform vertical rhythm across the entire PDF report.
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `const deltaCols = [14, 23, 56, 92, 126, 196];`
- **Unfinished:** None.

---

### [2026-11-04] Fixed Table 3 CIELAB Layout Spacing & Text Overlap
- **Task:** 
  - Adjusted Table 3 columns in `downloadStandardFPAPdf` (`pdfStandardHeader.ts`): Parameter width resized to 45mm, Master Target centered at 28mm, Instrument centered at 30mm.
  - Eliminated text collision in Row D (`Delta-E (Total Color Variance)` now has dedicated space without spilling into Master Target `<= 0.70`).
  - Standardized decimal formatting (`toFixed(2)`) across Master Target and all S1-S5 samples (`42.00`, `42.10`, `0.40`).
  - Shortened consolidated compliance bar text to avoid right margin overflow (`[PASS] ALL 5 SAMPLES WITHIN TOLERANCE (Delta-E <= 0.70)`).
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `TABLE 3: CIELAB SPECTROMETER COLORIMETRIC DELTA-E TEST`
- **Unfinished:** None.

---

### [2026-11-04] Cleaned Section 2 Adhesion Text in FPA PDF
- **Task:** 
  - Section 2 in `downloadStandardFPAPdf` (`pdfStandardHeader.ts`) has been cleaned to exact minimalist specifications:
    - Col 2: Only `"Cross-Cut Tape Adhesion Test"` (all method/subtext removed).
    - Col 3: Clean single word `"Pass"` or `"Fail"` in the status box.
    - Col 4: Only `"Tape Impression"` inside the physical 3M tape box frame (all helper text removed).
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `Col 2: Only "Cross-Cut Tape Adhesion Test"`
- **Unfinished:** None.

---

### [2026-11-04] Connected Table Column Vertical Dividers & Redesigned Section 2 Adhesion
- **Task:** 
  - Fixed vertical column lines in Table 1 (Visual) & Table 3 (Delta-E) in `downloadStandardFPAPdf` (`pdfStandardHeader.ts`) so they connect seamlessly all the way to the top border line `visTableStartY` / `deltaTableStartY`.
  - Redesigned Section 2 (ASTM 5B Cross-Cut Adhesion): widened Parameter column to eliminate text-overflow (`lattice` cutoff), centered the PASS/FAIL capsule in Col 3, and balanced the 3M tape specimen impression frame.
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `SECTION 2: ADHESION TEST (ASTM 5B CROSS CUT WITH DEDICATED TAPE BOX)`
- **Unfinished:** None.

---

### [2026-11-04] Removed "5 Samples Observation" Header from FPA PDF Tables
- **Task:** 
  - Cleaned up Table 1 (Visual Test) and Table 3 (CIELAB Spectrometer) in `downloadStandardFPAPdf` (`pdfStandardHeader.ts`).
  - Removed redundant top row text `"5 SAMPLES OBSERVATION"` and internal split line in both tables; headers are now clean single-tier rows (`SR | PARAMETER | SPECIFICATION | TECH | S1 | S2 | S3 | S4 | S5`).
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `sampleHeaders.forEach((sh, sIdx) => {`
- **Unfinished:** None.

---

### [2026-11-04] Automated Real-Time FPA Approval Timestamping
- **Task:** 
  - Removed manual "Approval Time" input field from `FPAModal.tsx` Step 1 (retaining only Startup/Spray Time).
  - Automated `approvalTime`: when QC clicks "Approve & Release", the system automatically records the exact live timestamp (e.g. `05:31 PM`). If placed on Hold, it marks as `Under Review / Hold`.
- **Files Touched:**
  - `src/portal/components/FPAModal.tsx` (Component: `FPAModal`) | Anchor: `Auto-stamp exact live system approval time when submitted`
- **Unfinished:** None.

---

### [2026-11-04] Removed Family Field from FPA & PIR Forms
- **Task:** 
  - Removed redundant "Family" input from `FPAModal.tsx` (simplified Row 2 to a clean 3-column grid: Part Code, Part Description, Color/Finish).
  - Cleaned up `PreProductionInspectionModal.tsx` preview card to focus on inspection stage and batch release qty rather than family.
- **Files Touched:**
  - `src/portal/components/FPAModal.tsx` (Component: `FPAModal`) | Anchor: `Row 2: Part Code, Part Description & Color`
  - `src/portal/components/PreProductionInspectionModal.tsx` (Component: `PreProductionInspectionModal`) | Anchor: `Inspection Stage:`
- **Unfinished:** None.

---

### [2026-11-04] Matched FPA Header & Stepper to IQC & PIR Standard
- **Task:** 
  - Redesigned the top section and multi-step stepper of `FPAModal.tsx` to match the exact design system used in PIR (`PreProductionInspectionModal.tsx`) and IQC:
    1. Center-aligned editorial header with `PK-QA-FPA-001 • QUALITY GATE 2 RELEASE` champagne badge, serif heading, and descriptive subtitle.
    2. 4 responsive stage cards with circular step numbers, "Part 1..4" labels, title, and descriptive subtitles, matching PIR's card layout with active gold outline (`ring-1 ring-[#c09748]/30`).
- **Files Touched:**
  - `src/portal/components/FPAModal.tsx` (Component: `FPAModal`) | Anchor: `4-PART RESPONSIVE STEPPER CARDS (EXACT MATCH WITH PIR / IQC DESIGN)`
- **Unfinished:** None.

---

### [2026-11-04] Fixed Missing materialRequisitions Destructure in QAView
- **Task:** 
  - Fixed runtime exception `materialRequisitions is not defined` in `QAView.tsx` by destructuring `materialRequisitions` from `usePortalStore()`.
  - QA Hub & Manager QA views now load instantly without crash.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `materialRequisitions,`
- **Unfinished:** None.

---

### [2026-11-04] Filtered Out Unissued Job Cards from FPA Pending List
- **Task:** 
  - Updated `pendingFpaJobs` memo in `QAView.tsx` to automatically filter out any Job Card whose materials have not yet been issued by the Store (`materialRequisitions`, `linkedMinNo`, or `issuedMaterials`).
  - Now, Job Cards that trigger the "Material Issue Verification Required" lock are not shown in the Gate 2 FPA Due queue at all until Store issues the material.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `Filter out job cards where store has NOT issued any material yet`
- **Unfinished:** None.

---

### [2026-11-04] Dynamic Job Card Material Handshake (Zero Phantom Fields)
- **Task:** 
  - Fixed hardcoded fallback batches in `FPAModal.tsx` that showed hardener and thinner fields across all job cards even when not issued.
  - Re-architected batch section to read strictly from `jobCard.issuedMaterials`: only genuine chemical materials issued to that specific Job Card appear in the dynamic grid (if 1 material is issued, exactly 1 batch appears; if 2, then 2).
- **Files Touched:**
  - `src/portal/components/FPAModal.tsx` (Component: `FPAModal`) | Anchor: `Issued Materials & Batch Traceability`
- **Unfinished:** None.

---

### [2026-11-04] Full Chemical Batches & Hardener Traceability Handshake (FPA Form & PDF)
- **Task:** 
  - Upgraded `FPAModal.tsx` and `portalTypes.ts` to capture and auto-populate all chemical batches issued to the Job Card (Paint Batch, Hardener/Catalyst Batch, Thinner Batch, and 3rd-party chemicals/primers). Added visual chips in the modal showing all linked batches.
  - Updated `downloadStandardFPAPdf` in `pdfStandardHeader.ts` to dynamically print complete chemical batch traceability (`CHEMICAL BATCHES (MIN TRACEABILITY): PNT: ... • HDN: ... • THN: ...`) ensuring zero missing batch data for 2K PU systems.
- **Files Touched:**
  - `src/portal/types/portalTypes.ts` (Interface: `FPARecord`) | Anchor: `hardenerBatch?: string;`
  - `src/portal/components/FPAModal.tsx` (Component: `FPAModal`) | Anchor: `All Issued Chemical Batches for Job Card:`
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `CHEMICAL BATCHES (MIN TRACEABILITY)`
- **Unfinished:** None.

---

### [2026-11-04] FPA Auto-Handshake & Standard PDF Re-architecture (IQC / PIR Standard)
- **Task:** 
  - Locked known system fields in `FPAModal.tsx` (Painter name, Booth, Customer, WO, Part Code/Description, Paint Description, Paint & Thinner Batches) from Job Card & Requisitions/Mixing store, leaving only actual floor measurements editable (Viscosity, times, 5-sample checks, adhesion, LAB spectrometer readings, remarks).
  - Overhauled `downloadStandardFPAPdf` in `pdfStandardHeader.ts` to match the clean, luxurious layout of IQC & PIR: 3-row structured metadata card (`metaBoxHeight = 44`), Table 1 Visual Test (S1-S5) with `#f2f2f3` header, Section 2 Adhesion Test with 5B rating & dedicated physical 3M tape frame, Table 3 CIELAB Spectrometer colorimetry with dynamic tolerance limit, and Section 4 dual-row sign-offs with Painter, Production Incharge, QA Engineer, QA Head.
- **Files Touched:**
  - `src/portal/components/FPAModal.tsx` (Component: `FPAModal`) | Anchor: `Locked (MIN)`
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `FIRST PART APPROVAL (FPA) QUALITY REPORT`
- **Unfinished:** None.

---

### [2026-11-04] Built FPA QC 4-Part Modal & Excel Matching Official PDF Report
- **Task:** 
  - Redesigned `FPAModal.tsx` into 4 clean parts matching Excel format: Part 1 (Locked Job Card, Customer, WO, Part Code/Desc, Family, Paint Desc, Batches, Viscosity, Painter, Booth, Times), Part 2 (Visual 5-Samples Checklist A-F across S1-S5 with Quick Mark OK), Part 3 (Cross-Cut Tape Adhesion & CIELAB Spectrometer S1-S5 with Master LAB & live tolerance verification), Part 4 (Sign-offs & Golden Sample Handover).
  - Redesigned `downloadStandardFPAPdf` in `pdfStandardHeader.ts` to match user's uploaded official Excel template (`Issue Date - 01.01.2021 | Rev - 02 | Rev Date - 13.02.2021`): 2-column metadata grid, Table 1 Visual Test S1-S5, Section 2 Adhesion Test with OK/NOT OK boxes and physical `Tape impression` swatch box, Table 3 Delta Value Test (L, A, B, Delta E), Section 4 QA Comments, Mandatory Golden Sample Handover Note, and dual department sign-off boxes.
- **Files Touched:**
  - `src/portal/components/FPAModal.tsx` (Component: `FPAModal`) | Anchor: `Part 1: Header, Line & Paint Parameters`
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardFPAPdf`) | Anchor: `First Part Approval Report`
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `onSuccess={() => { setShowFpaModal(false); setSelectedJcForFpa(null); }}`
- **Unfinished:** None.

---

### [2026-11-04] Fixed Table 1 Slanted Divider Line in PIR PDF
- **Task:** 
  - Fixed line drawing coordinate bug on Table 1 row 1 (`pdfStandardHeader.ts` -> `downloadStandardPreProductionPdf`): `doc.line(14, currentY + row1H, 196, currentY + 6.2)` had an asymmetric `6.2` instead of `row1H` causing the bottom border to print slanted on the left. Corrected to `doc.line(14, currentY + row1H, 196, currentY + row1H)` for a perfectly horizontal border.
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardPreProductionPdf`) | Anchor: `doc.line(14, currentY + row1H, 196, currentY + row1H)`
- **Unfinished:** None.

---

### [2026-11-04] Fixed IQC Result Badge Color for Accepted Reports
- **Task:** Fixed the badge status color in the Completed IQC Inspection Reports table (`QAView.tsx`). The condition previously checked for `'Passed'` causing `'Accepted'` records to fall back to the red rejection styling (`bg-red-50 text-red-800`). Updated to check `rec.status === 'Accepted' || rec.status === 'Passed'` applying PaintKing's official champagne brand gold (`bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]`), along with distinct styling for `'Part Accepted'` (`bg-blue-50 text-blue-800`).
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `rec.status === 'Accepted' || rec.status === 'Passed'`
- **Unfinished:** None.

---

### [2026-11-04] PDF Refinements: Added Material Type / Ownership, Removed Top Stamp
- **Task:** Updated `downloadStandardIQCPdf` in `pdfStandardHeader.ts`:
  1. Removed the top-right clearance badge stamp per user feedback.
  2. Integrated **`MATERIAL TYPE / OWNERSHIP`** (`Party Material (Client)` vs `Internal Company`) directly into Metadata Row 2.
  3. Relocated `BATCH / LOT NO.` into Metadata Row 3 alongside Consignment Part/Material description and Quantity summary.
  4. Added `materialCategory` field to `IQCInspectionRecord` and wired it from form submission.
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardIQCPdf`) | Anchor: `MATERIAL TYPE / OWNERSHIP`
  - `src/portal/types/portalTypes.ts` (Interface: `IQCInspectionRecord`) | Anchor: `materialCategory?: 'Party Material' | 'Internal Company'`
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `materialCategory: masterIqcForm.materialCategory`
- **Unfinished:** None.

---

### [2026-11-04] Enhanced IQC PDF: Added Header Stamp Badge & Inward Traceability
- **Task:** Enhanced the official IQC inspection PDF (`pdfStandardHeader.ts` -> `downloadStandardIQCPdf`) with 3 improvements:
  1. Added a prominent official top-right clearance stamp badge (`CLEARED / ACCEPTED` in Champagne gold, `PART ACCEPTED` in Blue, `HOLD FOR REVIEW` in Amber, and `LOT REJECTED` in Red).
  2. Linked Security Inward Traceability in Metadata Row 1 (`REPORT NO. (INWARD REF)` -> e.g., `IQC-20261104-95 (INW-2026-232)`).
  3. Added proper color-coded handling for `Part Accepted` in the CAPA Remarks/Disposition section.
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardIQCPdf`) | Anchor: `Official Clearance Stamp Badge on Top-Right`
- **Unfinished:** None.

---

### [2026-11-04] Compact Slim Refactor for Inward Line Item Cards (Part 1)
- **Task:** Reduced the vertical card height by ~55% by converting the bulky 2-tier card into a sleek, compact 2-row layout (`rounded-[14px] p-2.5 sm:p-3`): Row 1 places material name, Challan quantity badge, and verification pills (`✓ Match` / `Flag Shortage`) on a single line; Row 2 pairs the physical count input (`h-8`) and the reconciliation result bar (`h-8`) seamlessly without redundant empty margins.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `Line Items Checklist Cards - Compact Slim Luxury Industrial Layout`
- **Unfinished:** None.

---

### [2026-11-04] Redesigned Inward Material Line Item Verification Cards
- **Task:** Redesigned the inward materials verification item card in Part 1 of the IQC form. Replaced the cramped box with a 2-tier luxury card (`rounded-[18px]`): an editorial header strip with clean material title wrapping, numbered badge, pill-tag Challan reference, and right-aligned fast action pills (`✓ Match` / `Flag Shortage`); paired with a modern 2-column input body featuring styled `Physical Received Qty` with inner UOM suffix and live reconciliation indicator.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `Line Items Checklist Cards - Redesigned Luxury Industrial Card Layout`
- **Unfinished:** None.

---

### [2026-11-04] Redesigned IQC Modal Stepper & Generative UI Architecture
- **Task:** Fixed the text-clipping issue in the IQC Form stepper by redesigning the stepper header with spacious 3-column Part cards (`Part 1: Material Intake`, `Part 2: Quality Aspects`, `Part 3: 20% Sampling`) styled with PaintKing luxury gold accents, clear metadata, rounded-[14px] elevation, and full responsive support preventing any text cut-offs.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `Stepper Header (Clear Full-Width Step Cards with No Cutoff / Text Clipping)`
- **Unfinished:** None.

---

### [2026-11-04] IQC Form Step 1: Replaced Box Condition with Material Ownership (Point 8)
- **Task:** Removed Box Condition dropdown from Step 1 of the IQC form since it is already tested and graded (Pass/Fail) under Step 2's Quality Aspects. Replaced point 8 with refined **"8. Material Ownership"** pill badge (`Party Material (Client)` vs `Company (Internal)`) auto-populated directly from the Security Inward Record.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `8. Material Ownership`
- **Unfinished:** None.

---

### [2026-11-04] Incoming Quality Control (IQC) 3-Part Report Generation Form
- **Task:** Built and integrated the structured 3-part step-by-step IQC Report Generation Form modal (`PK-QA-IQC-001`) in `QAView.tsx`. Step 1 auto-fills the 9 identification fields directly from Gate Inward records (`MaterialInwardRecord`), incorporates physical packaging checks, and line-item physical count vs challan verification with automated discrepancy alerts. Step 2 guides visual & quality aspects testing across 7 core industrial parameters with custom instrument methods and impact levels (`Critical`/`Major`/`Minor`). Step 3 enforces the 20% sampling rule, 1% lot rejection threshold, CAPA root-cause inputs, and dual sign-off. Modal renders full screen on mobile and as a centered popup on desktop/tablet with top-right (X) close. Submission automatically updates Inward entries to `'IQC Cleared - Awaiting Stores GRN'` / `'Passed'`.
- **Files Touched:**
  - `src/portal/views/QAView.tsx` (Component: `QAView`) | Anchor: `Clean Inward Reference Summary Card (9 Identification Fields Auto-filled)`
- **Unfinished:** None.

---

### [2026-11-04] Outward Dispatch & Gate Pass Automation with New-Client Payment Gating
- **Task:** Implemented automated Commercial Outward Gate Pass clearance in the Security desk (`GatePassView.tsx`) wired with generated Tax Invoices and Delivery Challans. Enforced the user's critical business rule: Regular corporate clients (Net 30/15 Days credit) are immediately cleared for gate pass issuance, whereas new / one-time clients are strictly locked (`DISPATCH BLOCKED: 100% Payment Mandatory`) until Accounts verifies bank payment receipt/UTR. Integrated 1-click Gate Outward Pass issuance pre-filling vehicle, driver, and invoice details, marking jobs as `'7. Outward Dispatched'`, updating invoice status to `'Dispatched'`, and generating the official standard Gate Outward Pass PDF (`downloadStandardGateOutwardPdf`).
- **Files Touched:**
  - `src/portal/views/GatePassView.tsx` (Component: `GatePassView`) | Anchor: `Ready for Outward Gate Clearance`
  - `src/portal/views/BillingView.tsx` (Component: `BillingView`) | Anchor: `New Client: 100% Payment Mandatory`
  - `src/portal/context/PortalStoreContext.tsx` (Context: `PortalStoreContext`) | Anchor: `recordInvoicePayment`
  - `src/portal/types/portalTypes.ts` (Interfaces: `BillingInvoice`, `MaterialOutwardRecord`) | Anchor: `clientType?: 'REGULAR_CREDIT' | 'NEW_CLIENT_ADVANCE'`
  - `src/portal/data/mockInitialData.ts` (Data: `INITIAL_BILLING_INVOICES`) | Anchor: `PK-TAX-2026-9088`
- **Unfinished:** None.

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






