# WORKING_SET.MD - PaintKing Active Work Tracker

> **Instruction for Agent:** Read this file at the start of every session. If a request touches recently edited code, jump directly to the file and anchor string below without scanning the repository. Keep only the latest 10 entries.

---

### [2026-10-30] Removed Redundant 'Rework & Salvage' Tab & Sidebar Sub-Item
- **Task:** Removed 'Rework & Salvage' tab from JobCardsView.tsx and sub-item from PortalSidebar.tsx. Direct shop-floor rework is performed directly without generating separate child paperwork, simplifying the production header tabs.
- **Files Touched:**
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `activeTab === 'ALL'`
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `Store Demands & Arriving (MRN)`
- **Unfinished:** None.

---

### [2026-10-30] Removed Redundant '3-Painter Splits' Tab & Sidebar Sub-Item
- **Task:** Removed '3-Painter Splits' tab from JobCardsView.tsx and sub-item from PortalSidebar.tsx. Since painters and target quantities are planned directly at Job Card creation time, individual painter splits are redundant.
- **Files Touched:**
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `handleSelectTab`
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `Rework & Salvage Recovery`
- **Unfinished:** None.

---

### [2026-10-30] Moved 'Showing X of Y Cards' Count to Top-Right of Job Cards List
- **Task:** Repositioned the 'Showing X of Y Cards' indicator to the top right of the Job Cards list grid header alongside the 'Reset Filters' trigger. Converted the filter bar into a clean single-row search & dropdown toolbar.
- **Files Touched:**
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `Showing <strong className="text-[#17191c] font-mono font-bold">{filteredCards.length}</strong>`
- **Unfinished:** None.

---

### [2026-10-30] Removal of Redundant 'Master Batches' Tab & Header Button Cleanup
- **Task:** Removed the redundant 'Master Batches' tab from `JobCardsView.tsx` and `PortalSidebar.tsx`. Plant Head Priorities tab already handles master order priorities and job card creation/allocation. Simplified header button from '+ Create Master Job Card (Doc No: 001)' to '+ Create Job Card'.
- **Files Touched:**
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `activeTab === 'ALL'`
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `All Job Cards`
- **Unfinished:** None.

---

### [2026-10-30] Minimalist Job Card List Redesign (Anti-Clutter / Cognitive Ease)
- **Task:** Transformed heavy ~1,000-line per-card list view in `JobCardsView.tsx` into a high-scannability, minimal card. Removed embedded redundant ledgers, 10+ sub-buttons, and stage receipts from the card preview while keeping high-level order & painter metrics, shift/PO progress, PIR/FPA gate badges, and prominent gold-pill 'View Job Card' trigger opening the full-page modal (`JobCardModal.tsx`).
- **Files Touched:**
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `minimal_job_card_list_view`
- **Unfinished:** None.

---

### [2026-10-30] Floor-to-Store Balance Material Return Slips (RTN) Handshake Verification
- **Task:** Verified and connected full Floor-to-Store material return workflow: painters/supervisors can return unpainted customer pieces (`Pcs`) and leftover chemicals (`Litres`) from `BalanceReturnModal.tsx` into a Return Slip (`RTN-2026-xxx`) with status `Pending Store Verification`. The slip appears directly in `StoresView.tsx` under the 'Returns (RTN)' desk with 1-click 'Verify & Restock' into origin batches.
- **Files Touched:**
  - `src/portal/components/BalanceReturnModal.tsx` (Component: `BalanceReturnModal`) | Anchor: `rtn_substrate_line`
  - `src/portal/context/PortalStoreContext.tsx` (Context: `createBalanceReturnSlip`) | Anchor: `createBalanceReturnSlip`
- **Unfinished:** None.

---

### [2026-10-30] Strictly Company Chemical Consumables in Job Card Materials Table
- **Task:** Purged Party Substrate pieces (`Pcs`) from Company Issued Materials table across `JobCardModal.tsx`, `JobCardsView.tsx`, and `mockInitialData.ts`. The table now exclusively tracks Company Consumables (Paints, Thinners, Hardeners, Clear Coats in Litres/Kgs), while customer pieces are tracked stage-by-stage in the Process Output Tracker.
- **Files Touched:**
  - `src/portal/components/JobCardModal.tsx` (Component: `JobCardModal`) | Anchor: `sanitizeCompanyMaterials`
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `handleRequestFromSpecificStock`
  - `src/portal/data/mockInitialData.ts` (Mock data) | Anchor: `mat_smp_2`
- **Unfinished:** None.

---

### [2026-10-30] Full-Page Job Card Modal: Date Filter & Daily Material Issue/Usage Tracking
- **Task:** Upgraded full-page Job Card detail modal (`JobCardModal.tsx`): added interactive Working Date & Shift Filter (`ALL` and individual dates), Day's shift production summary, upgraded materials table displaying Store Issued, Actual Consumed, and Floor Balance, and added direct 'Update Usage' action modal to log chemical consumption on the floor.
- **Files Touched:**
  - `src/portal/components/JobCardModal.tsx` (Component: `JobCardModal`) | Anchor: `Production Date & Shift Filter`
- **Unfinished:** None.

---

### [2026-10-30] Always-Visible Daily Target & Company Consumables Chemical Tracking
- **Task:** Added always-visible Daily Target Quota section across all Job Cards and implemented comprehensive Company Consumables Floor Usage Ledger (2K Basecoat Paint, PU Thinner, Hardener, Clear Lacquer) tracking Issued, Consumed, Floor Balance, and batch usage logging.
- **Files Touched:**
  - `src/portal/types/portalTypes.ts` (Interface: `IssuedMaterialItem`) | Anchor: `consumedQty?: number`
  - `src/portal/data/mockInitialData.ts` (Mock: `INITIAL_JOB_CARDS`) | Anchor: `dailyTargetQty: 1000`
  - `src/portal/context/PortalStoreContext.tsx` (Context: `updateJobCardProgress`) | Anchor: `consumablesUsage`
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `Company Consumables Floor Usage Ledger`
- **Unfinished:** None.

---

### [2026-10-30] Daily Production Target & Multi-Day Quota Issuance + Mojibake Encoding Fix
- **Task:** 100% completed Daily Production Target system: separated Total PO Target from Today's Shift Quota, auto-calculated daily company consumables (paints/thinners), zero rework tracking (rejection is strictly permanent dead scrap), dual-progress metrics, Next Day Quota Requisition modal, and eliminated all character encoding mojibake (`ÃfÂ¢...` & `â€¢`) using pure CSS indicator dots.
- **Files Touched:**
  - `src/portal/types/portalTypes.ts` (Interface: `JobCardDailyTargetRecord`, `JobCard`) | Anchor: `dailyTargetQty?: number`
  - `src/portal/components/JobCardModal.tsx` (Component: `JobCardModal`) | Anchor: `Today's Production Target (Shift Quota)`
  - `src/portal/context/PortalStoreContext.tsx` (Context: `PortalStoreContext`) | Anchor: `requestNextDayTarget`
  - `src/portal/views/JobCardsView.tsx` (Component: `JobCardsView`) | Anchor: `Request Next Day Quota`
  - `src/portal/views/StoresView.tsx` (Component: `StoresView`) | Anchor: `PK-STR-GRN-001 | STORES & INWARD DESK`
  - `src/portal/components/PortalSidebar.tsx` (Component: `PortalSidebar`) | Anchor: `item.docCode`
  - `index.html` (Title meta) | Anchor: `PaintKing | Premium Industrial Coating`
- **Unfinished:** None.

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



