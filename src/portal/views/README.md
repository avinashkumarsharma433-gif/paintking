# Portal Views (`src/portal/views`)

## Overview
Top-level page views for each operational module in the PaintKing Portal (Dashboard, Job Cards, Stores, QA, Packing, Billing, Gate Pass, Calibration, CAPA 8D, MNC Audit, HR, and User Management).

## Interface
- `BillingView.tsx:BillingView`
- `CalibrationView.tsx:CalibrationView`
- `Capa8DView.tsx:Capa8DView`
- `DashboardView.tsx:DashboardView` (`onNavigateTab: (tab: PortalTab) => void`)
- `GatePassView.tsx:GatePassView`
- `HRLeaveView.tsx:HRLeaveView`
- `JobCardsView.tsx:JobCardsView`
- `MncAuditView.tsx:MncAuditView`
- `PackingView.tsx:PackingView`
- `PaintMixingView.tsx:PaintMixingView`
- `PainterDetailProfileView.tsx:PainterDetailProfileView` (`painter`, `onBack`, `onEdit`, `onViewJobCard`)
- `ProductionOfferingView.tsx:ProductionOfferingView`
- `QAView.tsx:QAView`
- `StoresView.tsx:StoresView`

## Invariants
- `[BillingView.tsx:plantInvoices]` Filters `billingInvoices` by `matchesPlant(inv.plant, activePlant)`.
- `[BillingView.tsx:availablePdiOrders]` Filters `qualityReleases` by `matchesPlant(r.plant, activePlant) && r.pdiStatus === 'Cleared for Invoicing'`.
- `[CalibrationView.tsx:filtered]` Filters `calibrationList` by `searchQuery` and `statusFilter` (`'Calibrated (Valid)'`, `'Due Soon'`, `'Overdue (Locked)'`).
- `[Capa8DView.tsx:plantFourMChanges]` Filters `fourMChanges` by `matchesPlant(c.plant, activePlant)`.
- `[DashboardView.tsx:plantJobCards]` Strict plant isolation guard via `matchesPlant(..., activePlant)`.
- `[MncAuditView.tsx:stats]` Effective audit `scorepct` excludes NA questions: `((compliant * 1.0 + partial * 0.5) / (total - na)) * 100`.
- `[PackingView.tsx:readyLots]` Filters `qualityReleases` by `matchesPlant(r.plant, activePlant)` and `(oqcStatus === 'Accepted' || pdiStatus === 'Cleared for Invoicing')`.
- `[PaintMixingView.tsx:plantMixing]` Filters `paintMixing` by `matchesPlant(pm.plant, activePlant)`.
- `[ProductionOfferingView.tsx:plantOfferings]` Filters `productionOfferings` and `jobCards` by `matchesPlant(..., activePlant)`.
- `[StoresView.tsx:isStoreIncharge]` Role guard: `currentUser.role in ['SUPER_ADMIN', 'STORES', 'PLANT_HEAD', 'DIRECTOR']`.

## Side Effects
- `[BillingView.tsx:downloadStandardTaxInvoicePdf]`, `[BillingView.tsx:downloadStandardDeliveryChallanPdf]` Client-side PDF generation via `jsPDF`.
- `[PackingView.tsx:handleGenerateAndDownloadPDF]` Allocates sequential box numbers via `getNextBoxCounterRange` and generates multi-page thermal label PDF.
- `[BillingView.tsx:useEffect]`, `[GatePassView.tsx:useEffect]`, `[QAView.tsx:useEffect]`, `[StoresView.tsx:useEffect]` Sync local tab state with `activeSubTab` / `globalSubTab`.

## Verification
- Run: `npm run lint && npm run build`
