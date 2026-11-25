# WORKING SET

- 2026-11-25: Redesigned Full-Screen 2-Column Painter Task Allocation UI/UX (`DailyAssignmentModal.tsx`)
  - Files touched:
    - `src/portal/components/DailyAssignmentModal.tsx`: Upgraded to balanced `max-w-7xl` two-column full-screen workspace (`lg:col-span-8` main step canvas + sticky `lg:col-span-4` Live Allocation Ledger panel), clickable Painter & Booth selection cards in Step 1, larger typography (`>=12px` labels, `14px` `h-11` inputs), progress bar, and instant step edit shortcuts.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-25: Converted Painter Task Allocation into 3-Step Wizard (`DailyAssignmentModal.tsx`)
  - Files touched:
    - `src/portal/components/DailyAssignmentModal.tsx`: Split full-screen modal into 3 connected pill-stepper stages: Step 1 (Job Details, Painter, Booth & Remarks), Step 2 (Multi-Model Qty & Colour Splits), Step 3 (Internal Company Materials & Auto-Estimate), with per-step validation and contextual step summaries.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-25: Made Painter Task Allocation Full-Screen & Mobile Responsive (`DailyAssignmentModal.tsx`)
  - Files touched:
    - `src/portal/components/DailyAssignmentModal.tsx`: Converted modal to full-screen (`w-screen h-dvh`) with sticky top header, centered `max-w-6xl` scrollable body, sticky bottom action bar, and 2-column mobile grid layouts (`grid-cols-2 sm:grid-cols-12`) for model split rows & chemical rows.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-25: Upgraded Painter Task Allocation for Multi-Model & Same-Model Colour Splits (`DailyAssignmentModal.tsx`, `PortalStoreContext.tsx`)
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `PainterBatchTaskLine` and `allocationBatchId` on `PainterAssignment`.
    - `src/portal/context/PortalStoreContext.tsx`: Added `createPainterAssignmentsBatch` with atomic per-part/master balance validation, colour-aware proportional chemical distribution (`distributeBatchMaterials`), single consolidated MRN upsert (`upsertPendingFloorDemand`), and colour-aware chemical grouping key in `buildConsolidatedFloorDemand`.
    - `src/portal/components/DailyAssignmentModal.tsx`, `src/portal/views/JobCardsView.tsx`, `src/portal/components/JobCardModal.tsx`: Replaced single model/qty/colour inputs with multi-row task builder supporting quick inward model pills, `+ Select All Pending`, 1-click `Split` colour splitting, quick colour fill chips, and colour-aware `Auto-Estimate`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-25: Added Monthly Lot Sequence, Box Quantity Input & Challan Details on Party Stock Ledger Cards (`GatePassView.tsx`, `PortalStoreContext.tsx`, `BatchLedger.tsx`)
  - Files touched:
    - `src/portal/types/portalTypes.ts` & `src/portal/utils/stockEngine.ts`: Added `challanNo`, `challanDate`, `totalBoxes`, `monthlyLotNo`, `monthlyLotMonth` fields plus `extractYearMonthKey`, `toComparableDateKey`, and `formatOrdinalLot` helpers.
    - `src/portal/views/GatePassView.tsx`: Added `7. Box Quantity (Cartons / Boxes)` field (`inwardHeader.totalBoxes`) in Inward Step 1 and surfaced Box Qty / Monthly Lot No in the Gate Inward Details modal.
    - `src/portal/context/PortalStoreContext.tsx` & `src/portal/components/CreateGRNModal.tsx`: Auto-calculated per-party calendar-month `monthlyLotNo` (`1st`, `2nd`, ..., resetting on new month) in `addMaterialInwardRecord` and `addGRN`, propagating `challanNo`, `challanDate`, `totalBoxes`, and `monthlyLotNo` into `StockBatch` records.
    - `src/portal/components/BatchLedger.tsx`: Grouped Party Stock cards per Party + Inward Lot/GRN (`PARTY_LOT_`) and displayed `Lot No.`, `Box Qty`, `Challan No.`, `Challan Date`, and `Total Inward` directly on every main Party Card (with dynamic fallback lookup from `grnList` & `materialInwardLogs`).
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-25: Simplified Party Stock Ledger View (`BatchLedger.tsx`)
  - Files touched:
    - `src/portal/components/BatchLedger.tsx`: Moved `Inward Date` onto the main Party Card summary row (`inwardDatesLabel`) and stripped repetitive per-model Inward Date, GRN, Batch No., FIFO badges, and empty deduction boxes from `PARTY_MATERIAL` models — leaving a clean single-row model summary (`Model`, `Part Code`, `Inward`, `Issued`, `Balance`, plus expandable Job Card deductions only when issued > 0).
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-25: Added Party-Wise Filter & 1-Party-1-Card Collapsible Model Grouping in Stock Ledger (`BatchLedger.tsx`)
  - Files touched:
    - `src/portal/components/BatchLedger.tsx`: Added `partyFilter` dropdown and grouped `PARTY_MATERIAL` stock batches by customer (`PARTY_${partyKey}`) with nested collapsible `PartyModelGroup` rows (`expandedModels`) inside each Party card so multi-model inflows (e.g. 10 Kolors models) stay under one Party card; updated filter bar active chips to PK-OS champagne style.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Built Finalised Vendor Catalog & Auto-Learned Party/Material Suggestion System (`GatePassView.tsx`, `PortalStoreContext.tsx`)
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `FinalisedVendor`, `FinalisedVendorMaterial`, `LearnedPartyDirectoryEntry`, `LearnedPartyMaterial`.
    - `src/portal/context/PortalStoreContext.tsx`: Added persistent + Supabase-synced `finalisedVendors` (`pk_finalised_vendors`) with CRUD (`addFinalisedVendor`, `updateFinalisedVendor`, `deleteFinalisedVendor`), plus auto-learning `learnedParties` (`pk_learned_parties`) seeded from historical Party Inwards and auto-updated in `addMaterialInwardRecord`.
    - `src/portal/views/GatePassView.tsx` & `src/portal/components/PortalSidebar.tsx`: Added `Vendors & Parties` (`MASTER_DIRECTORY`) management tab & modal, reusable `SmartSuggestInput` autocomplete for 1–2 letter Party/Vendor/Material lookup, and strict Finalised Vendor + Approved Material Catalog dropdown lock for `Internal Company` Inwards.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Auto-Deduplicated Existing Duplicate GRNs & Phantom StockBatches (`PortalStoreContext.tsx`)
  - Files touched:
    - `src/portal/context/PortalStoreContext.tsx`: Added `deduplicateGrnsByInward` (prioritizing GRNs linked to `jobCards`/`plantHeadPriorities` so e.g. `PK-GRN-2026-3905` stays while `PK-GRN-2026-2577` & `2697` are purged) and applied it across `localStorage` init, runtime `useEffect`, and `hydrateCloudState()` along with cleaning phantom `stockBatches`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Enforced `1 Inward = 1 GRN` & Fixed `CreateGRNModal` Success-Screen Reset Loop
  - Files touched:
    - `src/portal/components/CreateGRNModal.tsx`: Fixed `useEffect` dependency bug (`latestGateInward` changing inside `addGRN` had immediately reset `createdGRN(null)` and allowed repeated clicks); guarded initialization via `lastOpenedKeyRef`, added `isSubmitting` lock & duplicate GRN error/preview handling.
    - `src/portal/context/PortalStoreContext.tsx`: Added `latestGrnListRef` + strict duplicate guard in `addGRN` (blocks duplicate `grnNo`, `sourceIqcReportNo`, or `(challan + customer + date + plant)`) and `deleteGRN` (only allowed when unlinked from Job Cards, Priorities & Stock Issues).
    - `src/portal/views/StoresView.tsx`: Strengthened `acceptedIqcJobs` filter against duplicate GRNs and added `Delete` button on unlinked duplicate GRNs in GRN Register.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Redesigned Executive Cockpit Header & Removed Stale 6 KPI Cards and EOD/Rework Modals (`DashboardView.tsx`)
  - Files touched:
    - `src/portal/views/DashboardView.tsx`: Redesigned Top Operations Cockpit banner (dynamic `activePlant` unit pill, zero buttons, live 3-stat capsule for Store Lots / Master Cards / Painters Active); removed hardcoded `VASAI PLANT` pill, the 6 stale KPI cards (`Today's Sprayed 0/2,000`, `First Pass Yield`, etc.), and unused EOD/Rework modals & states.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Removed Legacy 3-Painter, Active Manufacturing Batches & Rework Hub Sections from Executive Cockpit (`DashboardView.tsx`)
  - Files touched:
    - `src/portal/views/DashboardView.tsx`: Deleted hardcoded `3-Painter Line Allocation`, fake-fallback `Active Manufacturing Batches`, and `Rework & Salvage Hub` blocks along with unused `painterChildCards` / `p1..p3` state and unused Lucide imports.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Redesigned Executive Cockpit Priority Allocator UI/UX & Fixed Live Store Balance / GRN Priority Matching (`DashboardView.tsx`)
  - Files touched:
    - `src/portal/views/DashboardView.tsx`: Redesigned Section 2.5 (`Store Material Stock & Production Priority Allocator`) and Priority Modal per PK-OS rules — removed duplicate filter pills, emojis, hardcoded scheduler/manager names, and pitch-black buttons; added live search + 5-column desktop table + 3-row mobile cards + `PaintkingDatePicker`; synced `storeBalance` from `stockBatches` (instead of deducting `masterCard.targetQty`) and matched priorities strictly by `grnNo` so distinct GRNs never inherit another lot's Master Job Card.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Removed `Actual Consumed` & `Floor Balance` Columns from Tab 1 Legacy Materials Table (`JobCardModal.tsx`)
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`: Updated fallback `companyMaterials` table under `Total Materials & Chemicals Used` to show `Issued (= Consumed)`, `UOM`, and `Shade / Batch`, removing `Actual Consumed` and `Floor Balance`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-24: Removed Manual Chemical Usage Update System (`Issued = Consumed` ISO Policy)
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`: Removed `Update Usage` inline edit drawer/buttons (`editingMatLogId`, `editGoodReturnQty`, `editFloorWasteQty`, `editMatBatch`, `updateAssignmentMaterialLog`), simplified Tab 1 summary & Tab 2 painter/all-painters chemical tables to clean `Issued (= Consumed)` + `MIN / MRN Slip` + `Batch` ISO traceability.
    - `src/portal/context/PortalStoreContext.tsx`: Removed unused `updateAssignmentMaterialLog` from context type, implementation, and provider value while keeping `AssignmentMaterialLog` backward-compatible.
    - `src/portal/components/BalanceReturnModal.tsx`: Synced End-of-Job Return `materialsAnalysis` with Store-transferred `assignmentMaterialLogs` (proportional unused calculation only if job closes below target).
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Fixed Missing Store Demand MRN on Add-On Consumables & Stale Job Card Closure
  - Files touched:
    - `src/portal/context/PortalStoreContext.tsx`: Updated `requestAssignmentChemicals` to always raise a dedicated Add-On Store Floor Demand MRN (`Pending Store Issue`) via `getNextUniqueMrnNo` instead of merging silently into `existingPendingMrn` or dropping assignments in `dispatchedAsgIds`; excluded Add-On MRNs from `upsertPendingFloorDemand` overwrite; switched `parentJob` lookup in `createPainterAssignment`, `requestAssignmentChemicals`, and `addTargetToPainterAssignment` to `latestJobCardsRef.current`.
    - `src/portal/components/JobCardModal.tsx` & `src/portal/views/JobCardsView.tsx`: Passed `currentJcForModals` / `selectedMasterForAssign` overrides into `createPainterAssignment` & `requestAssignmentChemicals`, and added explicit toast errors for invalid chemical add-on inputs.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Enforced Strict End-to-End Inward -> IQC -> Store GRN -> Priority -> Master Job Card Gatekeepers
  - Files touched:
    - `src/portal/views/DashboardView.tsx`: Removed `+ Inward Intake (GRN)` / `QuickInwardModal` bypass from Executive Cockpit; restricted `storeStockItems` strictly to IQC-cleared (`Accepted` / `Passed` / `Part Accepted`) Party Material GRNs (excluding Company Consumables).
    - `src/portal/context/PortalStoreContext.tsx`: Added `isGrnAndIqcVerified` guard inside `assignProductionPriority` & `createMasterJobCardFromPriority`, and tightened `canIssueJobCard` to require explicit IQC clearance (`Accepted` / `Passed` / `Part Accepted`).
    - `src/portal/views/JobCardsView.tsx`: Filtered `plantPriorityOrders` to require a matching IQC-cleared GRN in `grnList` and added a `{grnNo} • IQC ✓` badge on every Master Job Card.
    - `src/portal/views/QAView.tsx`: Blocked standalone/blank IQC report creation in `openMasterIqcForNewReport` when no pending Gate Inward exists.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Removed Redundant `All Job Cards` Tab & Unified Controls into `Master Job Cards & Priority Orders`
  - Files touched:
    - `src/portal/views/JobCardsView.tsx`: Removed `All Job Cards` tab pill (`ALL`), `'ALL'` search/filter bar, and orphaned `ALL` JSX cards grid; defaulted `activeTab` to `'PRIORITY_QUEUE'`, renamed tab pill to `Master Job Cards & Priority Orders`, and added `Gate 1: PIR` / `Gate 2: FPA` / `Gate 3: IPQC Audit` badges, `OK Completed` count, `PDF` download, and `Delete` actions directly onto Priority Queue Master Cards.
    - `src/portal/components/PortalSidebar.tsx`: Updated `jobcards` first `subItems` entry to `{ label: 'Master Job Cards & Priority Queue', subTab: 'PRIORITY_QUEUE' }`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`, 8.38s).

- 2026-11-24: Simplified Priority Queue Master Card Layout in `JobCardsView.tsx`
  - Files touched:
    - `src/portal/views/JobCardsView.tsx`: Removed the stale `Allocated % / 100% Fully Allocated` progress bar and `"+ Create Job Card"` wording from `PRIORITY_QUEUE`, replaced with crisp Master Card header (`masterCard.jobCardNo`), Total Quantity box (`totalLotQty`), inward material list (`resolveJobCardInwardParts`), `Painters Assigned` count, and clean `Open Job Card` button.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`, 9.10s).

- 2026-11-24: Plant Head Priority Auto-Generates System Master Job Card & Removed Production 4-Step Creation Form
  - Files touched:
    - `src/portal/context/PortalStoreContext.tsx`: Added `buildOrReuseMasterJobCardForPriority` & `createMasterJobCardFromPriority`, updated `assignProductionPriority` to automatically generate a strictly monotonic unique `JC-YYYY-NNN` Master Job Card when Plant Head sets Priority (`status: 'Job Card Launched'`, `0` premature painters/MRNs), and synced `latestJobCardsRef`/`jobCardSeqRef`.
    - `src/portal/views/DashboardView.tsx`: Updated `handleSavePriority` toast to show the auto-generated `JC-YYYY-NNN` number for Production Team.
    - `src/portal/views/JobCardsView.tsx`: Removed top-right `+ Create Job Card` button (`handleCreateNewJobCard`, `handleCreateJobCardFromReceivedBatch`, `handleRequestFromSpecificStock`), updated Priority Queue actions (`Open Master Job Card` + 1-click fallback via `createMasterJobCardFromPriority`), and updated priority banner wording.
    - `src/portal/components/JobCardModal.tsx`: Removed the entire 4-step Creation Wizard UI & stepper (`VIEW MODE 2`) so Production opens existing auto-generated Master Job Cards directly (`isExistingCard` guard).
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`, 10.74s).

- 2026-11-24: Guarded Party Material `+ Add Target` (Unlocked Only After Daily Target Finished) & Anytime Company Chemical Add-On Slips
  - Files touched:
    - `src/portal/context/PortalStoreContext.tsx`: Added `addTargetToPainterAssignment` enforcing `pendingShiftBalance <= 0` and Master Job Card/Part balance before incrementing `dailyTargetQty`, auditing `progressLogs`, and raising a fresh Add-On Floor Demand MRN (`MRN-YYYY-NNN`); company consumables via `requestAssignmentChemicals` remain allowed anytime and generate supplementary MRNs/MIN slips.
    - `src/portal/components/JobCardModal.tsx`: Added Tab 2 `+ Add Target (Party Material)` bar & inline drawer strictly locked while `metrics.pending > 0` (`Lock` indicator) and unlocked when daily target finishes, plus `+ Add Company Chemical (Anytime)` and a per-painter `Store Floor Demands & MIN Slips` tracker (`showAddTargetDrawer`).
    - `src/portal/views/StoresView.tsx` & `src/portal/utils/pdfStandardHeader.ts`: Fixed `allIssuedSlips`, `selectedIssueSlipForPrint` modal, and `downloadStandardMINPdf` to prioritize `requisitionLines` and `batchLines` so initial, Party Add-On, and Company Consumable Add-On MIN slips show and print accurate items & UOMs.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`, 8.91s).

- 2026-11-24: Painter-Driven Daily Party + Company Material Allocation, Consolidated Store Floor Demands & Floor Transfer Sync
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `PainterDailyMaterialAllocation`, `PainterFloorDemandEntry`, `plannedMaterials` / `storeDemandMrnNo` / `storeTransferStatus` / `storeMinNo` on `PainterAssignment`, `painterDemands` on `MaterialRequisitionNote`, and `transferStatus` / `mrnNo` / `minNo` on `AssignmentMaterialLog`.
    - `src/portal/context/PortalStoreContext.tsx`: Stopped premature `autoMrn` creation in `addJobCard` when no painter is assigned; added `upsertPendingFloorDemand`, `buildConsolidatedFloorDemand`, and `requestAssignmentChemicals`; updated `createPainterAssignment` to raise/merge consolidated `Pending Store Issue` MRNs covering all assigned painters and their daily Party + Company materials; updated `issueMaterialRequisitionWithBatches` to deduct store batches (with clean unbatched chemical fallback) and transfer chemicals directly into `painterAssignments` & `assignmentMaterialLogs`.
    - `src/portal/components/DailyAssignmentModal.tsx`: Added `6. Daily Company Materials (Today's Basis Only)` inline builder with presets, Store stock pickers, and `Auto-Estimate` alongside Party Material daily target qty.
    - `src/portal/components/JobCardModal.tsx` & `src/portal/views/JobCardsView.tsx`: Made Step 3 optional/per-painter with daily Company Materials per painter, turned Step 4 into Consolidated Store Floor Demand Report Preview, synced Tab 2 to show Store Transfer status and route extra chemical requests to Stores (`requestAssignmentChemicals`), removed fake `companyMaterials` fallback, and surfaced `painterDemands` in `JobCardsView` MRN details.
    - `src/portal/views/StoresView.tsx` & `src/portal/components/IssueWizardModal.tsx`: Scoped `Floor Demands` by `activePlant`, displayed the exact `painterDemands` report on Floor Demand cards & inside `IssueWizardModal`, strictly isolated `PARTY_MATERIAL` vs `COMPANY_CONSUMABLE` batch matching, and wired Store transfer directly to production floor.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`, 9.25s).

- 2026-11-24: Enforced Strictly Monotonic Never-Reused Job Card Numbering (`pk_jobcard_seq_counter`)
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `extractJobCardSeq` and enhanced `getNextJobCardNo` to combine `jobCards`, `localStorage` monotonic counter `pk_jobcard_seq_counter`, and historical records.
    - `src/portal/context/PortalStoreContext.tsx`: Added persistent cloud-synced `jobCardSeqCounter` (`pk_jobcard_seq_counter`), exposed `getNextUniqueJobCardNo`, updated `addJobCard` to auto-assign the next never-used number if a number was ever used before (even after deletion) and return the saved `JobCard`, and added `masterJobCardOverride` on `createPainterAssignment`.
    - `src/portal/components/JobCardModal.tsx` & `src/portal/views/JobCardsView.tsx`: Switched new Job Card numbering to `getNextUniqueJobCardNo()` and passed `savedCard` to `createPainterAssignment`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Prevented Duplicate `jobCardNo` Creation & Cross-Customer Priority Queue Linking
  - Files touched:
    - `src/portal/views/JobCardsView.tsx`: Tightened `PRIORITY_QUEUE` `matchingJobCards` filter to require plant + GRN/Challan+Customer ownership so stale `linkedJobCardNo` never maps one customer's Priority Order (e.g. `Avinash Sharma`) to another customer's `JC-2026-001`.
    - `src/portal/components/JobCardModal.tsx`: Guaranteed unique `resolvedJobCardNo` via `getNextJobCardNo(jobCards)` before saving a new card.
    - `src/portal/context/PortalStoreContext.tsx`: Added `sanitizePriorityLinks`, deduplicated `jobCardNo` across local init, `hydrateCloudState`, and `addJobCard`, scoped priority auto-linking strictly to matching GRN/Customer+Part+Challan, and reset `linkedJobCardNo` on `deleteJobCard`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Prevented Store Material Issuance & Orphan Chemical Logs Without Assigned Painters
  - Files touched:
    - `src/portal/context/PortalStoreContext.tsx`: Added `filterValidMaterialLogs` (purging logs whose `assignmentId` does not belong to valid `painterAssignments`), required valid `PainterAssignment` in `issueAssignmentMaterials` (with optional `targetAssignmentOverride`), prevented `COMPANY_CONSUMABLE` MRN lines when no painter is assigned in `addJobCard`, and used max-sequence `ASG` IDs.
    - `src/portal/components/JobCardModal.tsx`: Removed auto-seeded fake `issuedMaterials` default, passed `res.assignment` to `issueAssignmentMaterials`, and gated Tab 1 `Total Materials & Chemicals Used`, Tab 2 `All Chemicals Issued`, and `companyMaterials` fallback strictly on `currentJcAssignments.length > 0` + valid `assignmentId`.
    - `src/portal/views/JobCardsView.tsx`: Removed pre-seeded `issuedMaterials` and hardcoded `Ramesh Kumar (P1)` defaults on `handleLaunchJobCardFromPriority` and `handleRequestFromSpecificStock`, and filtered drilldown `CONSUMABLES` logs by valid `painterAssignments`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`).

- 2026-11-24: Removed Redundant `Painter Consumables Ledger` Main Tab from Job Cards View
  - Files touched:
    - `src/portal/views/JobCardsView.tsx`: Removed `CONSUMABLES_LEDGER` tab button, view block, and `plantMaterialLogs` memo so painter chemical usage stays focused inside each Master Job Card (`JobCardModal`).
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and pushed to `origin/main`.

- 2026-11-23: Simplified Painter Assignment Modal (Auto Today Date, Removed Shift & Coating Stage) & Fixed Orphan Assignment Ghost Counts
  - Files touched:
    - `src/portal/components/DailyAssignmentModal.tsx`: Removed `Assignment Date` input (auto-uses today's date with info pill), removed `Shift Allocation` and `Coating Process Stage` dropdowns (background defaults), renumbered fields cleanly 1–6 including `Part / Material Type` inward selector.
    - `src/portal/components/JobCardModal.tsx`: Removed redundant `Coating Stage *` dropdown from Wizard Step 3 painter allocation grid.
    - `src/portal/context/PortalStoreContext.tsx`: Added `filterValidAssignments` + cascade cleanup in `addJobCard`, `deleteJobCard`, local state initializers, and `hydrateCloudState` to prevent stale deleted-card `painterAssignments`/`assignmentMaterialLogs` (e.g. `4,975 Pcs` ghost counts) from re-attaching to reused `JC-2026-001`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-23: Fixed `JC-2026-001` Disappearing on Refresh & Plant-Scoped Tab Badge Counts in Job Cards
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `isLegacyDemoJobCard` (only matches `ROOP POLYMERS LTD`, `Demo Party`, `WO-1042` without deleting real `JC-2026-001` cards) and `getNextJobCardNo`.
    - `src/portal/context/PortalStoreContext.tsx`: Replaced `j.jobCardNo !== 'JC-2026-001'` filters in `ensureCleanStorageVersion`, `hydrateCloudState`, and `jobCards` initializer with `!isLegacyDemoJobCard(j)` so newly created `JC-2026-001` Job Cards persist across refresh; scoped `autoMrn.plant` to `formattedJc.plant` and used collision-free `mrnNo`.
    - `src/portal/components/JobCardModal.tsx`: Used `getNextJobCardNo(jobCards)` for new Job Card numbers.
    - `src/portal/views/JobCardsView.tsx`: Added `plantJobCards`, `plantPriorityOrders`, `plantMaterialRequisitions`, and `plantMaterialLogs` using `matchesPlant(..., activePlant)` and wired them across all 5 tab badges, dropdown stats, `Pending Launches`, `filterStats.total`, and `CONSUMABLES_LEDGER`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-19: Multi-Material Inward Support Across Master Job Cards & Per-Part Painter Shift Assignment
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `JobCardOrderLineItem`, `JobCard.orderLineItems`, `PainterAssignment.partCode`/`partDescription`, `resolveJobCardInwardParts`, and `computeAssignmentBalance` helpers.
    - `src/portal/context/PortalStoreContext.tsx`: Updated `createPainterAssignment` to validate per-part pending balance alongside Master Job Card pending balance and persist `partCode`/`partDescription`.
    - `src/portal/components/DailyAssignmentModal.tsx`: Added inward material/part selector (`inwardParts` prop / `resolveJobCardInwardParts`) with per-part pending balance & max quota clamping.
    - `src/portal/components/JobCardModal.tsx`: Preserved all GRN inward parts in `orderLineItems` (Step 1/2/3 + `handleSave`), displayed all inward material types on Tab 1 `Component & Order Specifications` + per-part completion breakdown, and surfaced assigned material pills across Tab 1 & Tab 2.
    - `src/portal/views/JobCardsView.tsx`: Displayed all inward material types on main Job Card cards via `resolveJobCardInwardParts`, carried `orderLineItems` from GRN priority launch, and passed `inwardParts` into `DailyAssignmentModal`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`, built in 7.91s, 0 errors).

- 2026-11-14: Fixed Temporal Dead Zone Runtime Crash (`Cannot access before initialization`) in `JobCardModal`
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`: Declared `getAssignmentStageSums` and `getAssignmentLiveMetrics` above `masterMetrics` so `masterMetrics` `useMemo` never invokes them before initialization in production builds.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`, built in 8.88s, 0 errors).

- 2026-11-14: Synced Master Order Completion Summary (`Total Pieces Completed & Remaining Status`) with Painter Shift Outputs
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`: Added `masterMetrics` aggregating `completedGood`, `rework`, and `scrap` across all `currentJcAssignments` via `getAssignmentLiveMetrics` (with `liveStoreJc` fallback), and wired `Total Pieces Completed & Remaining Status` cards and progress bar to `masterMetrics`.
    - `src/portal/context/PortalStoreContext.tsx`: Separated `reworkQty` and `rejectQty` (scrap only) inside `addJobCardProgressLog` so Master Job Card totals stay consistent.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-14: Removed `Close Shift & Reconcile` Button & Popup from Job Card Modal
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`: Removed `Close Shift & Reconcile` / `Close Shift` buttons, `ShiftCloseModal` import, `showShiftCloseModal` / `selectedAssignmentForClose` states, `closePainterAssignment` destructure, and `<ShiftCloseModal />` dialog; synced `liveProgressLogs` with live store `jobCards` and scoped legacy untagged logs to the first assignment in `getAssignmentStageSums` to prevent cross-shift count bleed.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-14: Fixed All-Stages Completed OK Calculation & Split Dedicated Rework / Dead Scrap KPI Cards
  - Files touched:
    - `src/portal/context/PortalStoreContext.tsx`: Updated `recordAssignmentStageOutput` so only Stage 3 (`stage_3_topcoat`) increments `actualCompletedQty` (eliminating Stage 2 + Stage 3 double-counting such as `440 + 440 = 880`).
    - `src/portal/components/JobCardModal.tsx`: Added shared `getAssignmentLiveMetrics` helper (Completed Good = Stage 3 OK, Rework = summed across stages, Dead Scrap = summed cleanly across stages), and split the combined Rework & Scrap KPI card into 5 dedicated KPI cards (`Assigned Today Target`, `Completed Good Output`, `Rework (Salvage)`, `Dead Scrap (Rej)`, `Pending Shift Balance`) plus reused across Tab 1 & Tab 2.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-14: Enforced Remaining Order Balance & Input Clamping in Assign Daily Target Modal
  - Files touched:
    - `src/portal/components/DailyAssignmentModal.tsx`: Added optional `existingAssignments` prop to compute true `COMPLETED OK` (`max(masterJobCard.goodQty, assignedCompletedOk)`) and `BALANCE PENDING` (`targetQty - max(completed, committed)` -> e.g. 8,000 when 2,000 are done/assigned), clamped `6. Daily Target Qty (Pcs)` `onChange` so users cannot type beyond `balancePending`, synced initial `targetQty` via `useEffect`, and disabled submit when `balancePending <= 0`.
    - `src/portal/components/JobCardModal.tsx`: Updated `currentJcForModals` to read live `jobCards` record over stale `initialData` and passed `existingAssignments={currentJcAssignments}` to `DailyAssignmentModal`.
    - `src/portal/views/JobCardsView.tsx`: Passed `existingAssignments` and returned `createPainterAssignment` result in `DailyAssignmentModal`.
    - `src/portal/context/PortalStoreContext.tsx`: Updated `createPainterAssignment` quota calculation so active targets and completed OK are never double-counted.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-14: Enforced Sequential 3-Stage Piece Limits Per Painter Assignment
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`: Added `getAssignmentStageMaxAllowed` so Stage 2 (`stage_2_basecoat`) is capped at `Stage 1 OK - s2.good - s2.scrap` (excluding Stage 1 dead scrap) and Stage 3 (`stage_3_topcoat`) is capped at `Stage 2 OK - s3.good - s3.scrap`; guarded `handleSaveOutputBatch` against `logPiecesSprayed > currentStageMaxAllowed`.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-14: Merged Tab 2 & Tab 3 into Unified `2. Painter Operations & Material Ledger`
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `assignmentId?: string` on `JobCardProductionProgressLog`.
    - `src/portal/context/PortalStoreContext.tsx`: Added & exposed `updateAssignmentMaterialLog` (good returned, floor wastage, batch, net consumed, per-piece calculation) and `recordAssignmentStageOutput` (per-assignment Stage 1/2/3 OK, Rework & Dead Scrap counters + efficiency).
    - `src/portal/components/JobCardModal.tsx`: Merged Tab 2 (`PAINTER_ASSIGNMENTS`) & Tab 3 (`DAILY_LOG`) into `2. Painter Operations & Material Ledger` (3 tabs total), added top Painter Filter pills (`All Painters` + per-assignment pills), per-painter assigned shift KPIs & colour shade, interactive 3-stage output logger (`Stage 1/2/3`), inline chemical issue (`+ Issue Paint / Thinner`) & row usage updater (`Update Usage`), and timestamped painter activity logs.
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors) and `npm run build` (`vite build`, built in 13.41s, 0 errors).

- 2026-11-14: Moved Colour Assignment to Painter Shifts & Added Date-Wise Shift Ledger to Tab 1
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `colorShade?: string` on `PainterAssignment`.
    - `src/portal/components/DailyAssignmentModal.tsx`: Added required `Assigned Colour / Shade` field to Tier-2 painter shift creation.
    - `src/portal/components/JobCardModal.tsx`: Removed global `Target Colour` from Tab 1 (`Component & Order Specifications`) and made `batchColor` optional on Master Job Card creation; added `Assigned Colour / Shade` per painter in Step 3 & Card 3; removed `Master Order Piece Reconciliation` from Tab 1 and added `Working Dates & Painter Shift Ledger` (`Date`, `Painter`, `Booth`, `Daily Quota`, `Good`, `Scrap`, `Achieved`).
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-14: Made Tab 1 (Master Order Overview) 100% Read-Only & Enforced 1 GRN = 1 Master Job Card
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`: Set default `existingCardTab` to `'EXECUTION'` (`1. Master Order Overview`), removed all inline edit/add/update triggers (`isEditingDailyQuota`, `showAddMaterialDrawer`, `Update Usage`, `showOutputLogger`, 3-stage update flow, and Activity Logs) from Tab 1, and converted Tab 1 into a pure read-only summary of Master Job Card details, active painters (`currentJcAssignments`), aggregated Tier-3 materials (`assignmentMaterialLogs`), and total pieces completed/remaining.
    - `src/portal/views/JobCardsView.tsx`: Replaced `Create Next Job Card` with `Open Master Job Card` when a Master Job Card already exists for a GRN lot (`1 GRN = 1 Master Job Card`).
  - Status: Verified with `npm run lint` (`tsc --noEmit`, 0 errors).

- 2026-11-14: Revamped Job Card Creation Wizard & Management View as per 3-Tier Plan
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`:
      - Revamped 4-stage wizard: Step 1 (Master Order & optional GRN link with dropdown or standalone), Step 2 (Substrate specs, Master PO target qty & Overall SLA deadline), Step 3 (Tier-2 multi-painter shift line allocations across booths with dynamic quotas), Step 4 (Tier-3 company chemicals & 3-tier launch summary).
      - Auto-registers Master Job Card, `createPainterAssignment` for all allocated painters, and `issueAssignmentMaterials`.
      - On existing job card: First/default tab is `PAINTER_ASSIGNMENTS` with painter cards, 3-stage yield, chemical ledger, and shift close triggers; `DAILY_LOG` with painter filter; fixed `masterJobCardNo` vs `masterJobCardId` display.
    - `src/portal/views/JobCardsView.tsx`: Protected `CustomDropdownSelect` against undefined `options[0]` crash, opened blank creation wizard on `+ Create Job Card` instead of forcing demo stocks, guarded all `.split(' ')[0]` calls.
    - `src/portal/context/PortalStoreContext.tsx`: Thoroughly scrubbed any lingering `ROOP POLYMERS LTD` or `JC-2026-001` records from `localStorage` and cloud hydration.
    - `src/portal/components/ShiftCloseModal.tsx`: Unified callback dispatch for shift closure.
  - Status: Verified with `npx tsc --noEmit` (0 errors) and `npm run build` (built in 8.28s with 0 errors).


- 2026-11-14: Purged Lingering Demo Data Across Entire ERP & Added Permanent Delete Job Card Action
  - Files touched:
    - `src/portal/context/PortalStoreContext.tsx`: Bumped `PK_STORAGE_VERSION` to `3.4.0-zero-demo-guarantee`, purged `JC-2026-001` (`ROOP POLYMERS LTD`) from storage and state sanitization, implemented `deleteJobCard`.
    - `src/portal/views/JobCardsView.tsx`: Added permanent "Delete" button with confirmation on every Job Card and guarded `handleCreateNewJobCard` to require real inward stock instead of creating dummy cards.
    - `src/portal/components/JobCardModal.tsx`: Added "Delete Job Card" button inside existing modal header, cleaned remaining dummy fallbacks.
    - `src/portal/components/QuickInwardModal.tsx`, `UniversalJobModal.tsx`, `OQCModal.tsx`, `PDIModal.tsx`, `IPQCModal.tsx`, `QAView.tsx`, `BillingView.tsx`, `pdfStandardHeader.ts`: Cleaned all remaining hardcoded demo state (`ROOP POLYMERS LTD`, `RP-8841`, `WO-1042`, `UK-08-AL-4412`).
  - Status: Verified with `npx tsc --noEmit` (0 errors), `npm run build` (built in 7.76s).

- 2026-11-14: Added Painter Assignment Dedicated View with Today's Target, 3-Stage Yield & Chemical Ledger
  - Files touched:
    - `src/portal/components/DailyAssignmentModal.tsx`: Fixed undefined crash by adding defensive fallbacks for `painters`/`availablePainters` and `booths`/`availableBooths`.
    - `src/portal/components/JobCardModal.tsx`:
      - Set default tab to "Painter Shift Assignments" on inspection.
      - Added "View Details" button on each painter assignment opening a full dedicated painter page with Today's Target Quota, 3-Stage Coating Yield (OK, Rework, Scrap), and chemical consumption tracking (Issued, Good Return, Wastage, Net Consumed per piece).
  - Status: Verified with `npx tsc --noEmit` (0 errors) and `npm run build` (built in 7.72s).
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`:
      - Replaced single-painter display on Card 3 of "Floor Execution & Materials" with Multi-Painter Quotas summary showing all assigned painters, booths, shifts, and targets with quick "+ Assign Painter" trigger.
      - Added painter filter pill bar (`All Painters` | individual painters) to "Daily Shift Production & Chemicals Ledger".
      - Dynamically filtered quantitative milestone cards, company chemical usage descriptions, and batch outputs by the selected painter and working date.
  - Status: Verified with `npx tsc --noEmit` (0 errors) and `npm run build` (built in 8.21s).

- 2026-11-14: Fixed Job Card Creation Store GRN Auto-Linking & Embedded Shift Allocations
  - Files touched:
    - `src/portal/components/JobCardModal.tsx`:
      - Removed hardcoded fallback `'PK-GRN-2026-1250'` and dummy `'ROOP POLYMERS LTD'`.
      - Added strict warning banner when no Store Inward (GRN) exists with validation preventing bypass unless explicitly authorized.
      - Embedded dedicated "Painter Shift Assignments" tab directly inside the Job Card modal with `DailyAssignmentModal` and `ShiftCloseModal` triggers.
  - Status: Verified with `npx tsc --noEmit` and `npm run build` (built in 7.38s with 0 errors).

- 2026-11-14: Implemented 3-Tier Job Card, Shift Allocations & Consumables Ledger
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added types `PainterAssignment`, `AssignmentMaterialLog`, `MasterJobCard`, `AssignmentShiftType`, `AssignmentProcessStage`.
    - `src/portal/context/PortalStoreContext.tsx`: Added store state, sync keys, `createPainterAssignment`, `issueAssignmentMaterials`, `closePainterAssignment`, and `getPainterConsumablesLedger`.
    - `src/portal/components/DailyAssignmentModal.tsx`: New modal for shift target allocation with pending balance validation.
    - `src/portal/components/ShiftCloseModal.tsx`: New modal for shift close yield, stage breakdown, and chemical reconciliation.
    - `src/portal/views/JobCardsView.tsx`: Added "+ Assign Painter (Target)", drill-down drawer (Shifts & Chemical Logs), and Painter Consumables Ledger view tab.
    - `src/portal/views/PainterWorkspaceView.tsx`: Integrated active shift assignments banner with instant shift close and reconciliation modal.
  - Status: Verified with `npx tsc --noEmit` and `npm run build` (built in 8.51s with 0 errors).

- 2026-11-13: Fixed Painter & Booth Fleet Strict Plant Data Isolation (Floor Desk & Fleet Management)
  - Files touched:
    - `src/portal/types/portalTypes.ts`: Added `plant: PlantLocation` to `PainterProfile`.
    - `src/portal/data/mockInitialData.ts`: Assigned specific plants to `INITIAL_PAINTERS` and added initial technicians and booths for Haridwar, Vasai, Vapi, and Mumbai.
    - `src/portal/context/PortalStoreContext.tsx`: Initialized painters/booths with plant defaults, updated `addPainter`/`addPaintingBooth` to stamp active plant, and plant-isolated `pendingVerificationJobsCount` and `getPainterActiveJobCount`.
    - `src/portal/components/PainterConfigModal.tsx`: Added plant scope assignment and passed `currentPlant` on add/update.
    - `src/portal/views/PainterWorkspaceView.tsx`: Filtered Painter Floor Desk by `matchesPlant(p.plant, activePlant)`, updated active target selection on plant switch, and displayed plant badges.
    - `src/portal/components/JobCardModal.tsx`: Filtered painter & booth combobox options by the job card's plant.
  - Status: Verified with `npm run build` (production build succeeded in 8.12s with 0 errors).

- 2026-11-13: Integrated Google Elephant-Goldfish Model (EGM) Spec-Driven Framework
  - Files touched:
    - Installed official marketplace plugin `antigravity-plugins-official/plugin/egm`.
    - `docs/specs/template_rfc.md`: Created standard RFC template with PaintKing design tokens and Goldfish checklist.
    - `docs/specs/README.md`: Created registry guide for specifications and review lifecycle.
    - `AGENTS.md`: Added Section 9 defining Elephant vs Goldfish roles, review triage, and hand-off rules.
  - Status: Verified plugin activation and build check.

- 2026-11-13: Completely Deleted "Stage Custody Handover" Module & References Across Project
  - Files touched:
    - Deleted `src/portal/views/CustodyHandoverView.tsx`.
    - Cleaned `src/portal/PortalApp.tsx`, `src/portal/components/PortalSidebar.tsx`, `src/portal/components/PortalHeader.tsx`, `src/portal/utils/portalAuth.ts`, `src/portal/context/PortalStoreContext.tsx`, `src/portal/types/portalTypes.ts`, `src/portal/data/mockInitialData.ts`, and `src/portal/views/DashboardView.tsx`.
  - Status: Verified with `npm run build` (built in 8.56s with 0 errors).

- 2026-11-13: Added Super Admin Plant Selector & Enforced Strict Plant Data Isolation Across All 9 ERP Modules
  - Files touched:
    - `src/portal/utils/portalAuth.ts`: Added `matchesPlant(itemPlant, activePlant)` supporting fuzzy plant matching and `'ALL'` plant aggregation.
    - `src/portal/context/PortalStoreContext.tsx`: Upgraded `activePlant` to `PlantLocation | 'ALL'` so Super Admin/Directors can switch between individual plants or view `'ALL'` plants consolidated. Creation handlers safely fallback to 'Haridwar' when 'ALL' is selected.
    - `src/portal/components/PortalHeader.tsx`, `src/portal/components/PortalSidebar.tsx`: Added plant scope selectors (`All Plants`, `Haridwar`, `Vasai`, `Vapi`, `Mumbai`) for authorized roles (`SUPER_ADMIN`, `DIRECTOR`) and locked badge for standard staff.
    - `src/portal/views/GatePassView.tsx`, `StoresView.tsx`, `JobCardsView.tsx`, `QAView.tsx`, `PackingView.tsx`, `BillingView.tsx`, `CustodyHandoverView.tsx`, `PainterWorkspaceView.tsx`, `DashboardView.tsx`, `PaintMixingView.tsx`, `ProductionOfferingView.tsx`, `Capa8DView.tsx`: Filtered all transactional records, summaries, priority orders, and requisitions by `matchesPlant(record.plant, activePlant)`.
  - Status: Verified with `npm run build` (production build succeeded in 8.31s with zero errors).

- 2026-11-13: Fixed Supabase Permission Denied by Granting Table Permissions to Authenticated Roles
  - Files touched:
    - `supabase_schema.sql`: Added explicit schema, table, sequence, and routine grants for `anon`, `authenticated`, and `service_role` with default privileges.
  - Status: Committed `06ac276` and pushed to `origin/main`.

- 2026-11-12: Implemented Supabase Authentication, `SUPER_ADMIN` Root Role, Plant Assignment & Module-Level Permissions
  - Files touched:
    - `supabase_schema.sql`: Added `pk_portal_users` table (`role`, `plant`, `allowed_modules`, `is_active`), `is_active_portal_user()` / `is_super_admin()` helper functions, and tightened RLS across all 6 ERP tables to `TO authenticated` active users only.
    - `supabase/functions/admin-users/index.ts`: Created secure Supabase Edge Function for `SUPER_ADMIN`-only staff `@paintking.in` account creation (`email_confirm: true`), module/plant updates, password resets, and deletion.
    - `src/portal/types/portalTypes.ts`, `src/portal/utils/portalAuth.ts`, `src/portal/lib/supabaseClient.ts`: Added `SUPER_ADMIN` role, `ERP_MODULE_CATALOG`, `ROLE_PRESETS`, `normalizePortalEmail`, `canAccessPortalTab`, and profile/admin API helpers.
    - `src/portal/views/PortalLoginView.tsx`, `src/portal/views/UserManagementView.tsx`: Built `@paintking.in` Login Gate and Super Admin User & Access Control console (create/edit accounts, assign plant, toggle exact ERP modules).
    - `src/portal/PortalApp.tsx`, `src/portal/components/PortalSidebar.tsx`, `src/portal/components/PortalHeader.tsx`, `src/portal/context/PortalStoreContext.tsx`: Replaced insecure role switcher with verified Supabase session auth, Change Password modal, Logout + cache wipe, plant lock enforcement, and `SUPER_ADMIN` privileges across `StoresView.tsx`, `BalanceReturnModal.tsx`, `FifoCompliancePanel.tsx`, and `IssueWizardModal.tsx`.
  - Status: Verified with `npm.cmd run lint` (`tsc --noEmit`, 0 errors) and `npm.cmd run build` (built in 8.92s).

- 2026-11-12: Purged All Demo Data (Local + Supabase) & Upgraded Full Cloud Hydration/Sync
  - Files touched:
    - `src/portal/data/mockInitialData.ts`: Emptied all 25 transactional demo arrays (`INITIAL_MATERIAL_INWARD`, `INITIAL_GRN_DATA`, `INITIAL_JOB_CARDS`, `INITIAL_IQC_RECORDS`, `INITIAL_FPA_RECORDS`, `INITIAL_IPQC_RECORDS`, `INITIAL_QUALITY_RELEASES`, `INITIAL_BILLING_INVOICES`, `INITIAL_GATE_PASSES`, `INITIAL_STOCK_BATCHES`, etc.) and reset `MASTER_DEFECTS` counts to `0`; kept system masters (`INITIAL_USER_PROFILES`, `INITIAL_PAINTING_BOOTHS`, `INITIAL_PAINTERS`, `INITIAL_CALIBRATION_RECORDS`, `INITIAL_MNC_AUDIT_QUESTIONS`).
    - `src/portal/lib/supabaseClient.ts`: Added `fetchAllRemoteState()` for single-request cloud hydration from `pk_portal_state`.
    - `src/portal/context/PortalStoreContext.tsx`: Added `PK_STORAGE_VERSION = '3.0.0-clean'` + `ensureCleanStorageVersion()` to purge stale browser demo cache before mount, guarded `persistRemoteState` with `isCloudHydratedRef` to prevent mount race overwrites, and connected all 30 state collections to Supabase sync.
    - `src/portal/views/StoresView.tsx`, `src/portal/views/QAView.tsx`, `src/portal/views/HRLeaveView.tsx`, `src/portal/views/PackingView.tsx`, `src/portal/views/DashboardView.tsx`, `src/portal/views/JobCardsView.tsx`, `src/portal/views/CustodyHandoverView.tsx`: Removed all remaining hardcoded demo metrics/fallbacks (0.0% / 0 pcs / Unassigned defaults on DashboardView, empty CustodyHandover form defaults, empty expandedMasterIds).
    - `src/portal/views/HRSuiteView.tsx`: Connected `pk_hr_employees` and `pk_hr_attendance_records` to Supabase hydration and live sync (`isHrCloudHydratedRef`).
  - Database cleaned: Truncated all rows across `pk_portal_state`, `pk_job_cards`, `pk_quality_records`, `pk_stores_records`, `pk_employees`, `pk_attendance_logs` (all verified 0 rows).
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (built in 8.00s).

- 2026-11-12: Integrated Supabase (PostgreSQL) Live Cloud Database & Offline-First Realtime Sync
  - Files touched:
    - `src/portal/lib/supabaseClient.ts`: Configured production Supabase client with offline fallback helpers `fetchRemoteState` and `persistRemoteState`.
    - `src/portal/context/PortalStoreContext.tsx`: Connected Job Cards, IQC, Stock Batches, Balance Returns, and Calibration records to background cloud synchronization with mount hydration.
    - `supabase_schema.sql`: Authored production DDL schema for 6 core tables with permissive factory terminal RLS policies.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds in 8.09s).

- 2026-11-11: Implemented Strict Role-Based Access Control (RBAC) across All Navigation Tabs & Sub-items
  - Files touched:
    - `src/portal/components/PortalSidebar.tsx`: Enforced strict role restrictions on top-level tabs and sub-items (Payroll, Employee Directory, Recognition Lab strictly restricted to Director/HR; Operator & Security limited to operational tabs).
    - `src/portal/PortalApp.tsx`: Synced `TAB_ALLOWED_ROLES` and route guards to automatically prevent unauthorized route access on persona switch.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds successfully in 8.22s).

- 2026-11-11: Integrated Equipment Calibration Master Directly into QA Dashboard & Redesigned UI
  - Files touched:
    - `src/portal/views/CalibrationView.tsx`: Redesigned according to PaintKing UI/UX guidelines (white luxury surface, 3 metric pill cards, responsive 4-column desktop table, mobile responsive cards, pill buttons, NABL certification modal).
    - `src/portal/views/QAView.tsx`: Added dedicated sub-tab "Gauges & Calibration Master" with real-time valid counter right alongside Gates 0-5 in the QA Hub.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds successfully in 8.08s).

- 2026-11-11: Streamlined Navigation by Removing Standalone Paint Mixing Lab Tab (Consolidated into FPA/QC Flow)
  - Files touched:
    - `src/portal/components/PortalSidebar.tsx`: Removed `paintmixing` from `PortalTab`, `TAB_LABELS`, and sidebar menu items.
    - `src/portal/PortalApp.tsx`: Removed `paintmixing` role permissions and view route.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds successfully in 8.38s).

- 2026-11-11: Decommissioned Redundant Standalone Production Offering Tab & Preserved PK-PRD-OFF-01 Auto-Generated PDF
  - Files touched:
    - `src/portal/components/PortalSidebar.tsx`: Removed `production_offering` from tab enum, `TAB_LABELS`, and main navigation list.
    - `src/portal/PortalApp.tsx`: Removed `production_offering` permissions and routing to prevent dead tabs.
    - `src/portal/utils/pdfStandardHeader.ts`: Implemented `downloadStandardProductionOfferingPdf` for official PK-PRD-OFF-01 / Appendix A.11 standard PDF with 4-tier authorization chain, 3-stage clearance audit, and quantity roll-up.
    - `src/portal/views/QAView.tsx`: Integrated one-click Offering Slip download in Pending OQC table/cards, Completed OQC register, and detailed OQC report modal.
    - `src/portal/views/JobCardsView.tsx` & `src/portal/components/JobCardModal.tsx`: Added one-click Offering Slip export when good finished pieces are logged.
    - `src/portal/components/OQCModal.tsx`: Added Offering Slip download button on OQC release.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds successfully in 7.93s).

- 2026-11-10: Increased Face Detection Confidence to 0.50 & Required 3 Continuous Consecutive Frames for Punch
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts`: Increased SSD MobileNet face detection confidence threshold from 0.22 to 0.50 (`SsdMobilenetv1Options({ minConfidence: 0.50 })`) preventing background shadows/motion blur from triggering false face slots.
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx`: Set `requiredConsecutiveFrames = 3` (with localStorage auto-upgrade to >= 3), ensuring a genuine employee must match continuously across ~1.2s before attendance is punched.
  - Status: Verified with `npm.cmd run lint` (0 errors).

- 2026-11-10: Fixed Duplicate Employee ID Generation (PK-EMP-xxxx Collision) & Added Auto-Deduplication
  - Files touched:
    - `src/portal/views/HRSuiteView.tsx`: Changed ID generator from naive `employees.length + 101` to regex-based max number tracking `Math.max(...nums) + 1` preventing ID collisions when employees are added/removed. Added auto-healing sanitizer in `useState<Employee[]>` initializer to rename existing duplicate IDs in localStorage (`PK-EMP-0104`, etc.) so multiple employees never share the same ID.
  - Status: Verified with `npm.cmd run lint` (0 errors).

- 2026-11-10: Calibrated Expression Tolerance (Threshold <= 0.44) & Relaxed Margin Blocking Across Multi-Enrollments
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts`: Calibrated `maxAllowedDistance` up to 0.44 (master centroid gate +0.05). Relaxed multi-employee margin check (`bestDistance <= 0.40 || margin >= 0.02`), preventing the 2nd enrolled employee from being blocked as 'Unknown' when standing in camera.
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx`: Calibrated default confidence threshold to 0.44 (presets Strict: 0.38, Normal: 0.44, Fast: 0.48), updated saved localStorage config to auto-upgrade to 0.44.
  - Status: Verified with `npm.cmd run lint` (0 errors).
