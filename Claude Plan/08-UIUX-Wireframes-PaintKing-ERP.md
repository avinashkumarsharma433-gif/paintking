# PAINTKING ERP — UI/UX WIREFRAME DOCUMENTATION
**Document 8 of 8 | Version 1.0**

Design priority, stated plainly: **shop-floor usability beats visual polish.** Painters, Security, and Store Keepers are the highest-frequency users and the least likely to tolerate a fiddly interface — every screen below is designed photo-first, tap-first, minimal-typing.

---

## 1. Design System

| Token | Value | Why |
|---|---|---|
| Typography | Large base size (18px minimum body text on shop-floor screens; 16px acceptable for office/desk roles) | Tablets viewed at arm's length in a booth, sometimes with gloves on |
| Color — status | Green (#16A34A) = pass/on-track, Amber (#D97706) = at-risk, Red (#DC2626) = fail/breach, Gray (#6B7280) = not started | Matches the TAT flag and QC disposition system directly — same three colors used everywhere, no reinterpretation per screen |
| Touch targets | Minimum 48x48px | Gloved/wet hands near paint booths |
| Primary action button | Full-width on mobile/tablet, bottom-anchored | One clear next action per screen, not buried in a toolbar |
| Language toggle | Hindi/English switch, persistent top-right on every shop-floor screen | Confirmed non-technical-user requirement (Document 3) |

---

## 2. Navigation Structure

```
Login
  │
  ├─ Painter / Security / Store Keeper → single-purpose home screen (no side menu, no module switcher)
  │
  └─ Supervisor / Inspector / Manager / MD → left sidebar nav:
        Dashboard | Job Cards | Material Custody | QC Queue | Dispatch | Gate Pass | Employees | Reports
        (sidebar items shown are role-permission-filtered — an IQC Inspector never sees "Dispatch" at all)
```

---

## 3. Role-Based Dashboards

### 3.1 Painter — "My Jobs Today" (home screen, no dashboard concept needed)
```
┌─────────────────────────────────┐
│ [Photo] Ramesh K. (Painter 1)   │
├─────────────────────────────────┤
│  MY ASSIGNED PAINTER CARD       │
│  ┌─────────────────────────┐    │
│  │ JC-000451-P1 (Spray)    │    │
│  │ Allocated: 1,000 pcs    │    │
│  │ Sprayed:   650 pcs      │    │
│  │ First Pass: 638 pcs     │    │
│  │ To Rework:  12 pcs      │ →  │
│  │ [Amber: 3h remaining]   │    │
│  └─────────────────────────┘    │
│                                  │
│  [ LOG SPRAYED BATCH ]          │
│  [ 🔁 SEND DEFECT TO REWORK ]   │
│  [ ⚠ FLAG ISSUE ]               │
└─────────────────────────────────┘
```
Tapping a job → **if material handover is pending**, shows "Confirm Quantity Received" screen first (large number input pre-filled with what Store Keeper issued for this specific painter card) → spec/reference photo (from FPA) full-screen → options to log pieces sprayed, first-pass good pieces, and pieces placed in rework buffer rack.

```
┌─────────────────────────────────┐
│  CONFIRM QUANTITY RECEIVED       │
│  JC-000451-P1 (Painter 1)        │
├─────────────────────────────────┤
│  Store allocated:   1000 pcs    │
│  You received:     [ 1000 ]     │
│                                  │
│  ⚠ Mismatch — select reason:     │
│  ( ) Damaged  ( ) Miscount       │
│  ( ) Other                       │
│                                  │
│      [ CONFIRM & CONTINUE ]      │
└─────────────────────────────────┘
```

### 3.2 Security — "Gate Pass" (home screen)
```
┌─────────────────────────────────┐
│  GATE PASS                       │
│  [+ NEW ENTRY]                   │
├─────────────────────────────────┤
│  Recent:                         │
│  Out • 14:20 • Truck MH04-1234  │
│  In  • 13:05 • Client material  │
│  Inward Pass (DOC NO: 00)       │
└─────────────────────────────────┘
```
New Entry form: Direction (In/Out) → Movement type (large tappable icons: Dispatch / Material In / Job Work Out / Return / General / Visitor) → vehicle/material fields → Save.

### 3.3 Store Keeper — "GRN & Issue"
```
┌─────────────────────────────────┐
│  [+ NEW GRN]   [ISSUE MATERIAL] │
├─────────────────────────────────┤
│  Pending Reconciliation (2)     │
│  JC-000448 — balance mismatch   │
└─────────────────────────────────┘
```
New GRN form: Client → Job Card (or "no job card yet") → Item, Qty, Unit → **camera opens automatically** for the mandatory photo → Condition notes → Save.

### 3.4 QC Inspector (IQC / FPA-IPQC / OQC-PDI) — own-stage queue
```
┌─────────────────────────────────┐
│  QC INSPECTION QUEUE (5)        │
│  ┌─────────────────────────┐    │
│  │ JC-000451-P1 (Painter 1)│    │
│  │ Bracket Assy - 650 pcs  │ →  │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ 🔁 REWORK QUEUE (12 pcs) │ →  │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```
Inspection form: Checklist with large checkboxes → camera for mandatory photo on defects → **Pass / Rework / Scrap** (three big buttons) → on defect, select category (`dust_nibs`, `paint_run`, `orange_peel`, `scratch`, `undercoat_show`) → Submit immediately spawns/updates Rework Child Job Card (`JC-xxx-RW1`).

### 3.5 Production Supervisor — Job Card list + 3-Painter Split + EOD Closure
```
┌───────────────────────────────────────────┐
│ Dashboard | Job Cards | Material | QC | ...│
├───────────────────────────────────────────┤
│ [+ NEW MASTER CARD]  [🌙 DAY-END CLOSURE] │
│  ┌─────────────────────────────────────┐  │
│  │ Master: JC-000451 (3,000 pcs) Spray │  │
│  │  ├─ P1 (Ramesh):  1,000 pcs [🟢650] │  │
│  │  ├─ P2 (Suresh):  1,000 pcs [🟢620] │  │
│  │  └─ P3 (Mahesh):  1,000 pcs [🟢640] │  │
│  │  └─ 🔁 Rework:     35 pcs [Sanding]  │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```
**3-Painter Split Modal:**
```
┌───────────────────────────────────────────┐
│ SPLIT MASTER BATCH ACROSS 3 PAINTERS      │
│ Master: JC-000451 (Total: 3,000 pcs)      │
├───────────────────────────────────────────┤
│ Painter 1 (Ramesh):  [ 1,000 ] pcs        │
│ Painter 2 (Suresh):  [ 1,000 ] pcs        │
│ Painter 3 (Mahesh):  [ 1,000 ] pcs        │
│ Total Allocated: 3,000 / 3,000 pcs (✓)    │
│                                           │
│       [ RELEASE TO PAINTER TABLETS ]      │
└───────────────────────────────────────────┘
```

### 3.6 Plant Head / MD — Dashboard (the "live view" from BRD BO-6)
```
┌───────────────────────────────────────────────────┐
│  DASHBOARD (Single General Day Shift) [Hi/Eng]     │
├───────────────────────────────────────────────────┤
│  WIP by Process Line                              │
│  Spray: 12   Hydrographic: 4   UV: 7   Moulding: 9│
│                                                   │
│  3-Painter Daily Output Parity                    │
│  P1 (Ramesh): 650 pcs │ P2: 620 pcs │ P3: 640 pcs │
│                                                   │
│  Rework Recovery Yield: 94.2% (Salvaged 48/51 pcs)│
│                                                   │
│  🔴 TAT BREACHES (2)              [View all →]    │
│  JC-000453 — 1 day late — Client X                │
│                                                   │
│  Today's Production: 1,910 pcs  (Target: 2,000)   │
└───────────────────────────────────────────────────┘
```
Every number is tappable → drills into the underlying job card list (per FRD acceptance criteria — no dead-end stats).

---

## 4. Key User Flows

**Flow: Job Card from creation to dispatch** (Supervisor-driven, cross-references Document 2's workflow diagram)
`New Job Card → GRN linked → IQC submitted → FPA sample submitted → FPA approved → Production started → Painter marks complete → IPQC logged → OQC logged (pass/split) → PDI logged → Packing Slip generated → Gate Pass (outbound) → Dispatched`

Each arrow above is a screen transition triggered by exactly one button tap from the responsible role — no step requires two roles to coordinate outside the system (directly addresses BRD BO-1, eliminating verbal dependency).

**Underneath every arrow that crosses a role** (Store→Painter, Painter→IPQC, IPQC→OQC, OQC→PDI, PDI→Dispatch), a quantity handover confirmation runs automatically — the receiving role can't proceed with their own action until they've confirmed the count, with a reason logged if it doesn't match. This is what turns "50 pieces lost somewhere in production" into "10 lost between Store and Painter, 10 between Painter and IPQC" — visible per link, not just at the end.

**Flow: Material discrepancy at GRN**
`Store Keeper opens New GRN → notices damage/shortage → photographs it → ticks "Discrepancy" flag → Save (as flagged, not clean) → Store Manager notified → Store Manager reviews → contacts client if needed → resolves flag`

---

Tapping a job card number anywhere in the app (Supervisor's list, MD's dashboard drill-down, etc.) opens its detail view — every report generated against that job card (GRN, IQC/FPA/IPQC/OQC/PDI Report, Packing Slip, etc.) is listed there with a **Download PDF** button next to it. No separate "reports" section to hunt through — the PDF is always one tap away from the job card it belongs to.

## 5. Error States & Empty States

| Screen | Empty state | Error state |
|---|---|---|
| Painter "My Jobs Today" | "No jobs assigned yet — check with your Supervisor" (illustration: simple checkmark icon) | N/A (read-only screen) |
| QC Queue | "Queue clear — no pending inspections" | If checklist submission fails (network drop): "Saved locally, will sync when connection returns" — never lose an inspector's work |
| Job Card creation | N/A | Inline field-level errors only (e.g., "Target TAT cannot be in the past") — no generic toast-only errors for form submissions |
| Dashboard | If no data yet (fresh install): "Dashboard will populate as job cards move through the system" | If a data fetch fails: show last-successfully-loaded numbers with a small "Last updated X min ago" note, not a blank/broken screen |

---

## 6. Loading States

- Shop-floor forms (QC, GRN): optimistic UI — the "Submit" button shows a brief in-progress spinner, then confirms immediately; if offline, shows "Queued — will submit when online" rather than blocking the inspector.
- Dashboard: skeleton loaders (gray placeholder blocks) for each stat card while data loads, never a full-screen spinner that blocks the whole view.

---

## 7. Accessibility (WCAG 2.1 AA)

- Color is never the only signal: every status color (green/amber/red) is paired with a text label ("On track" / "3h left" / "Late") — important since some shop-floor lighting is poor and color perception varies.
- All interactive elements reachable via keyboard for office-role desktop users (Supervisor, Accountant, HR).
- Minimum contrast ratio 4.5:1 for body text, verified against the color tokens in Section 1.
- Photo capture screens include a text-based confirmation ("Photo captured ✓") in addition to the visual thumbnail, for screen-reader compatibility on office-side accessibility needs.

---

## 8. Component Library (reusable across the app)

`StatusBadge` (green/amber/red/gray, always with text label) · `PhotoCapture` (camera-first, thumbnail preview, retake option) · `BigActionButton` (full-width, bottom-anchored, one per screen) · `StageProgressBar` (used on every Job Card detail view) · `RoleScopedNav` (renders only permitted sidebar items) · `ReconciliationTable` (Material Custody — received/issued/scrap/return/balance columns) · `ChecklistForm` (QC — large checkboxes + mandatory-photo-on-fail logic built in once, reused across IQC/IPQC/OQC/PDI) · `QuantityHandoverConfirm` (pre-filled sent quantity, editable received quantity, mandatory reason-on-mismatch — reused at every Store→Painter→IPQC→OQC→PDI→Dispatch link) · `DownloadPDFButton` (appears on every one of the 13 document types — GRN, IQC/FPA/IPQC/OQC/PDI Report, Job Card, Packing Slip, FG Offer Report, Production Offering Report, Leave Format, Gate Pass — same component, calls `GET /documents/{id}/pdf`) · `LanguageToggle`.

---

## 9. Mobile-First PWA Notes

- Shop-floor roles (Painter, Security, Store Keeper, QC Inspectors) get the PWA installed on shared tablets — home-screen icon, no browser chrome, matches Section 5's offline-queue requirement from Document 7's architecture.
- Office roles (Supervisor, Accountant, HR, Plant Head, MD) primarily use desktop browser — same codebase, responsive layout adds the sidebar navigation (Section 2) that shop-floor single-purpose screens don't need.

---

**Assumptions flagged for confirmation:**
1. Shared tablets per booth/station (not one device per Painter) — confirm device provisioning plan, since it affects the "log in/out per session" requirement from Document 3.
2. Hindi translation scope — assumed UI labels and checklist items need translation; confirm if QC remark/free-text fields should also support Hindi input (affects font/keyboard requirements).

---

## Summary — All 8 Documents Complete

1. ✅ BRD — business case, scope, budget, timeline
2. ✅ FRD — 13 modules, detailed workflows
3. ✅ SOP Manual — 18 roles, step-by-step
4. ✅ Database Schema — PostgreSQL, full DDL
5. ✅ API Specification — OpenAPI 3.0
6. ✅ ISO Compliance Mapping — honest gaps flagged
7. ✅ Tech Stack + Architecture — sized for actual team/scale
8. ✅ UI/UX Wireframes — shop-floor-first design

All 8 are corrected for PaintKing's actual business (job-work spray painting / hydrographic printing / UV digital printing / injection moulding), not the generic paint-manufacturing template from the original brief, and all build on the existing FPA/RBAC/13-format work rather than replacing it.
