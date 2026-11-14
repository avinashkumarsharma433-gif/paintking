# Portal Components (`src/portal/components`)

## Overview
Reusable UI components, modals, wizards, pickers, and document renderers used across the PaintKing Portal.

## Interface
- `CustomSelect.tsx:SelectOption`, `CustomSelect.tsx:CustomSelect`
- `OfficialGRNDocument.tsx:OfficialGRNDocument`
- `PortalHeader.tsx:PortalHeader`
- `PortalSidebar.tsx:PortalTab`, `PortalSidebar.tsx:TAB_LABELS`, `PortalSidebar.tsx:PortalSidebar`
- `DailyAssignmentModal.tsx:DailyAssignmentModal`
- `ShiftCloseModal.tsx:ShiftCloseModal`
- `CreateGRNModal.tsx:CreateGRNModal`
- `JobCardModal.tsx:JobCardModal`
- `QuickInwardModal.tsx:QuickInwardModal`
- `UniversalJobModal.tsx:UniversalJobModal`
- `PainterConfigModal.tsx:PainterConfigModal`
- `BalanceReturnModal.tsx:BalanceReturnModal`
- `FifoCompliancePanel.tsx:FifoCompliancePanel`
- `IssueWizardModal.tsx:IssueWizardModal`
- `OQCModal.tsx:OQCVisualItem`, `OQCModal.tsx:OQCModal`
- `PDIModal.tsx:PDIModal`
- `IPQCModal.tsx:TIME_SLOTS`, `IPQCModal.tsx:SlotTimeInfo`, `IPQCModal.tsx:IPQCModal`

## Invariants
- `[DailyAssignmentModal.tsx:handleSubmit]` Target quantity must be `> 0` and `<=` masterJobCard pending balance (`targetQty - goodQty`), and an active painter must be selected.
- `[QuickInwardModal.tsx:isMatch]` Total color-allocated quantity must equal `totalQty (> 0)` for color breakdown to match.
- `[PortalHeader.tsx:handlePasswordSubmit]` New password must be at least 8 characters and match `confirmPassword` before calling `supabase.auth.updateUser`.
- `[FifoCompliancePanel.tsx:isManagementOrStores]` Management/Stores view access is restricted to roles `SUPER_ADMIN`, `DIRECTOR`, `PLANT_HEAD`, or `STORES`.

## Side Effects
- `[CustomSelect.tsx:useEffect]` Registers and cleans up a `document` `mousedown` listener for outside-click dismissal.
- `[PortalHeader.tsx:useEffect]` Registers and cleans up `document` `mousedown` and `keydown` (`Escape`) listeners when dropdown is open.
- `[PortalHeader.tsx:handlePasswordSubmit]` Calls `supabase.auth.updateUser({ password })` to update user credentials.
- `[OfficialGRNDocument.tsx:handlePrint]` Invokes `window.print()` for browser printing.
- `[OfficialGRNDocument.tsx:handleDownload]` Invokes `downloadStandardGRNPdf(grn)` to generate and download a PDF.
- `[CreateGRNModal.tsx:addGRN]`, `[QuickInwardModal.tsx:addGRN]`, `[UniversalJobModal.tsx:addUniversalJob]`, `[PDIModal.tsx:submitPdiClearance]` Dispatch state mutations to `PortalStoreContext`.
- `[DailyAssignmentModal.tsx:handleSubmit]`, `[ShiftCloseModal.tsx:handleSubmit]` Invoke parent assignment/shift-close callbacks.

## Verification
- Run: `npm run lint && npm run build`
