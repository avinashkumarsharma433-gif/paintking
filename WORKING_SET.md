# WORKING_SET.MD - PaintKing Active Work Tracker

> **Instruction for Agent:** Read this file at the start of every session. If a request touches recently edited code, jump directly to the file and anchor string below without scanning the repository. Keep only the latest 10 entries.

---

### [2026-10-29] Automated 20:45 Floor Cutoff Material Return Slips (RTN)
- **Task:** Implemented 20:45 floor cutoff return auto-reconciliation (15-min transit before 21:00 plant close); calculates unconsumed pieces (Issued - Sprayed) and generates RTN slips with 1-click 'Verify & Restock' in Stores Returns.
- **Files Touched:**
  - `src/portal/context/PortalStoreContext.tsx` (Hook/Engine) | Anchor: `executePlantClosingReconciliation`
  - `src/portal/views/StoresView.tsx` (Component: `StoresView`) | Anchor: `Floor Cutoff: 20:45 (8:45 PM)`
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `5. Floor Material Returns (RTN)`
- **Unfinished:** None.

---

### [2026-10-29] Mojibake Encoding Artifacts Elimination
- **Task:** Fixed Windows-1252/UTF-8 corrupted symbols (`ÃƒÂ¢...`, `â€¢`, `â€“`, checkmarks) in StoresView and PortalSidebar; restored clean standard bullet dots (`•`), en-dashes (`–`), checkmarks (`✓`), and clean icons across all text lines and sidebar headers.
- **Files Touched:**
  - `src/portal/views/StoresView.tsx` (Component: `StoresView`) | Anchor: `Plant: {req.plant} • {req.date}`
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `<span className="mx-1 text-gray-300">•</span>`
- **Unfinished:** None.

---

### [2026-10-29] Elimination of Redundant Shelf-Life Tab & Cleanup
- **Task:** Removed redundant Shelf-Life tab and markup from StoresView & PortalSidebar; replaced KPI Card 4 with Floor Demands (Pending); cleaned up lingering `filteredShelfLife` memo that referenced deleted `shelfHealthFilter`.
- **Files Touched:**
  - `src/portal/views/StoresView.tsx` (Component: `StoresView`) | Anchor: `activeTab`
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `subItems`
- **Unfinished:** None.

---

### [2026-10-29] Executive Card Strips for Floor Demands (MRN)
- **Task:** Implemented Option 2 Executive Card Strips architecture for Floor Demands in StoresView; unified desktop and mobile with luxury industrial cards (Top bar with MRN/JC/Customer/Status, middle section with required items chips & Qty, Gold Review & Issue button, and footer personnel audit).
- **Files Touched:**
  - `src/portal/views/StoresView.tsx` (Component: `StoresView` -> Demands Tab) | Anchor: `Executive Card Strips Architecture (Modern PK-OS Standard)`
- **Unfinished:** None.

---

### [2026-10-29] Store Floor Demands Issue Wizard Dropdown Elimination
- **Task:** Removed GRN batch `<select>` dropdown and split buttons in IssueWizardModal; displayed direct pre-allocated Job Card GRN lot with 4-box statement (Total Inward Received -> Available in Store -> Issue Qty Now -> Balance After).
- **Files Touched:**
  - `src/portal/components/IssueWizardModal.tsx` (Component: `IssueWizardModal`) | Anchor: `Linked GRN Lot Allocation`
- **Unfinished:** None.

---

### [2026-10-29] Classification-First Stock Ledger with Job Card Deductions Trail
- **Task:** Upgraded BatchLedger to group company materials by inward classifications (Paint, Thinner, Hardener, Clear Coat) with total balance, GRN inward breakdown, and nested Job Card deduction trail.
- **Files Touched:**
  - `src/portal/components/BatchLedger.tsx` (Component: `BatchLedger`) | Anchor: `GRN Inward Lots & Job Card Deductions Breakdown`
- **Unfinished:** None.

---

### [2026-10-29] Fix Object as React Child in RTN Return Tab
- **Task:** Fixed React runtime crash `Objects are not valid as a React child` in StoresView Balance Return (RTN) tab by extracting `.signedBy` from `slip.supervisorSignOff`.
- **Files Touched:**
  - `src/portal/views/StoresView.tsx` (Component: `StoresView` -> Balance Return Slips table) | Anchor: `slip.supervisorSignOff.signedBy`
- **Unfinished:** None.

---

### [2026-10-29] Gate Inward PDF Metadata Complete 3x3 Grid
- **Task:** Replaced Driver Phone and GST E-Way Bill in Gate Inward Pass PDF with 'MATERIAL TYPE / CATEGORY' and added 'PLANT LOCATION' in 3rd column.
- **Files Touched:**
  - `src/portal/utils/pdfStandardHeader.ts` (Function: `downloadStandardGateInwardPdf`) | Anchor: `PLANT LOCATION`
- **Unfinished:** None.

---

### [2026-10-29] Removed 4 Optional Logistics Fields from Inward Form
- **Task:** Removed Driver Phone No, GST E-Way Bill No, Purchase Order (PO), and Total Packages / Boxes from Inward Gate Pass Part 1.
- **Files Touched:**
  - `src/portal/views/GatePassView.tsx` (Component: `GatePassView`) | Anchor: `Point 2: Supplier Challan & Vehicle Logistics`
- **Unfinished:** None.

---

### [2026-10-29] Master Operating Instructions Integration
- **Task:** Added Master Operating Instructions (PK-OS) to `AGENTS.md` and initialized `WORKING_SET.md`.
- **Files Touched:**
  - `AGENTS.md` (Section `## 0. MASTER OPERATING INSTRUCTIONS`) | Anchor: `MASTER OPERATING INSTRUCTIONS FOR THE CODING AGENT`
  - `WORKING_SET.md` (Repo root tracker)
- **Unfinished:** None.



