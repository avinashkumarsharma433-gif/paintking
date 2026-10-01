# PAINTKING ERP — FUNCTIONAL REQUIREMENT DOCUMENT (FRD)
**Document 2 of 8 | Version 1.0**

Built on the corrected business model from Document 1: PaintKing is a **job-work finishing company** (Spray Painting, Hydrographic Printing, UV Digital Printing, Injection Moulding) processing OEM-client-supplied parts. Every module below is written against that reality — material belongs to the client until dispatch, and the whole system exists to prove custody + process + quality at every stage.

Modules follow the FR-IDs from the BRD. Each module: purpose, user stories, features, input/output/validation, workflow, edge cases, dependencies, acceptance criteria.

---

## Module 1 — Authentication & RBAC

**Purpose:** Every action in the plant must be attributable to a person and constrained to their role — this is both an operational need and an ISO/MNC-audit requirement.

**User stories**
- As an **Admin**, I want to create/deactivate user accounts so only current employees can log in.
- As **MD**, I want superuser access to every module so I can investigate anything without asking IT.
- As a **QC Inspector**, I want to see only my own stage's queue (IQC, or FPA/IPQC, or OQC/PDI) so I'm not confused by jobs that aren't mine.
- As a **Painter**, I want to see only my own assigned Painter Job Card (one of 3 painter cards per batch), not peers' cards, to focus on my allocated piece count without friction on the floor.

**Roles (confirmed from existing RBAC matrix)**
`MD (superuser)`, `Plant Head`, `Production Supervisor` (single operational day shift, manages daily opening & EOD closure), `IQC Inspector`, `FPA/IPQC Inspector`, `OQC/PDI Inspector`, `Painter` (3 dedicated line painters), `Store Keeper`, `Store Manager`, `Dispatch Coordinator`, `Security` (Gate Pass owner), `HR Executive`, `Accountant`, `Admin/IT`.

**Input/Output/Validation**
- Input: employee ID or phone, password (+ optional OTP for MD/Plant Head).
- Output: session token (JWT) + role-scoped menu.
- Validation: account must be active; role must map to at least one permission set; failed logins locked after 5 attempts for 15 minutes.

**Workflow**
1. User logs in → system checks role → renders only permitted modules/screens.
2. Every screen-level and action-level permission is checked server-side (not just hidden in UI).

**Edge cases**
- Employee has two functions (e.g., covers Store Keeper during leave) → Admin can grant a temporary secondary role with an expiry date, logged in audit trail.
- Shared shop-floor tablet used by Painters → each painter logs into their own profile to view their specific Painter Job Card; no "stay logged in" on shared devices.

**Dependencies:** All other modules depend on this.

**Acceptance criteria:** A user can only see/act on screens their role permits; attempting a disallowed action via direct URL/API call is rejected server-side and logged.

---

## Module 2 — Employee Management & Plant Day-End (EOD) Protocol

**Purpose:** Single source of truth for plant personnel and operational schedule — feeds RBAC, Job Card assignment, and Leave. Reflects the **Single General Day Shift** operational reality (morning to evening; plant closes down at end of day and reopens next morning; no multi-shift handovers).

**User stories**
- As **HR Executive**, I want to add new employees with role and department so they can start using the system immediately.
- As **Production Supervisor**, I want to see which of the 3 painters are active today to allocate batch quantities across the 3 Painter Job Cards.
- As **Production Supervisor / Plant Head**, I want to trigger the **Daily Day-End (EOD) Closure** at evening shutdown to record daily completed WIP, safely lock overnight holdings, and close the plant until next morning.

**Features:**
- Employee master (name, ID, role, department, contact, date of joining, status active/inactive; single general day shift default).
- Daily Day-End (EOD) Plant Shutdown log: captures total pieces sprayed across all 3 painters, parts in rework queue, and locks shopfloor state until morning opening.

**Validation:** Employee ID unique; role must exist in RBAC; cannot deactivate an employee with open/assigned job cards without reassignment.

**Edge cases:** Employee resigns mid-job — system blocks deactivation until Supervisor reassigns their open job cards.

**Dependencies:** Auth & RBAC (Module 1); feeds Job Card (Module 3) and Leave (part of Module 2 scope in BRD FR-15).

**Acceptance criteria:** Every job card assignment references a valid, active employee; daily plant EOD closure is logged every evening without shift-handover ambiguity.

---

## Module 3 — Job Card & TAT Tracking (with 3-Painter Split & Rework Loop)

**Purpose:** The core operational record. One Master Job Card = one client order/batch moving through one or more processes (Spray Painting / Hydrographic / UV Printing / Injection Moulding) with target TAT. When released to the paint shopfloor, the batch is split into **3 distinct Painter Job Cards (P1, P2, P3)** for individual operator accountability.

**User stories**
- As **Production Supervisor**, I want to create a Master Job Card from a client PO and split it into **3 Painter Job Cards (`JC-xxx-P1`, `JC-xxx-P2`, `JC-xxx-P3`)** assigning specific quantities to the 3 shopfloor painters.
- As **Production Supervisor**, when parts are rejected during IPQC/OQC/PDI, I want to route them to a **Rework Child Job Card (`JC-xxx-RW1`)** so painters can sand, touch-up, and re-spray them rather than scrapping valuable client material.
- As **MD**, I want to see all job cards at risk of TAT breach, individual output per painter, and the rework recovery yield %.
- As **Painter**, I want to see only my own assigned Painter Job Card (`JC-xxx-P1`), confirm my allocated count, log my sprayed quantity, first-pass good pieces, and parts sent to rework.

**Features**
- Master Job Card fields: client, client PO reference, part description, total quantity, process type(s), material source, target TAT, assigned Supervisor, overall stage.
- **3-Painter Sub Job Cards:** Split automatically or manually across 3 active painters (e.g. Total 3000 pcs → Painter 1: 1000 pcs, Painter 2: 1000 pcs, Painter 3: 1000 pcs). Each child card tracks: `assigned_painter_id`, `allocated_qty`, `sprayed_qty`, `first_pass_good_qty`, `rework_flagged_qty`.
- **Rework on Rejection Management:**
  - Defects identified in IPQC, OQC, or PDI (runs, dust spots, orange peel, shade variation) trigger **Rework Disposition**.
  - System generates a **Rework Child Job Card** linked to parent. Defect categorized: `dust_nibs`, `paint_run`, `orange_peel`, `scratch`, `undercoat_show`.
  - Parts route to: `De-nibbing / Sanding` → `Re-coat / Re-dip / Touch-up` → `Re-bake` → `Re-inspection (IPQC/OQC Rework Gate)`.
  - Only non-salvageable parts (e.g. substrate crack, excessive thickness build-up beyond tolerance) proceed to irreversible scrap.
- Auto status progression: `Created → Material Received (GRN) → IQC → FPA Approved → In Production (Split to 3 Painters) → IPQC → [Rework Loop if needed] → OQC → PDI → Packed → Dispatched`.
- TAT countdown with color flag: green (on track), amber (<20% time remaining), red (breached).
- Single General Day Shift: At evening shutdown, each painter logs completed count, open WIP is recorded in Daily EOD Closure, and resumes next morning.

**Input/Output/Validation**
- Cannot move to "In Production" without a passed IQC and an approved FPA (system-enforced gate).
- Cannot generate Packing Slip without passed PDI (which checks both first-pass accepted and rework-cleared parts).
- Sum of 3 Painter allocated quantities must exactly equal Master Job Card batch quantity.

**Workflow (text flowchart with 3-Painter Split & Rework Loop)**
```
Client PO received
   ↓
Master Job Card created (Supervisor)
   ↓
Material Inward / GRN (Store Keeper) ──► Module 4
   ↓
IQC (IQC Inspector) ──pass──► FPA sample submitted
   │fail                          ↓
   ↓                        FPA Approved (designated approver)
Reject/Return to client            ↓
                         Split into 3 Painter Job Cards
                         (Painter 1 | Painter 2 | Painter 3)
                                   ↓
                         Bulk Production by 3 Painters
                                   ↓
                         IPQC checks (during run)
                                   │
              ┌────────────────────┴────────────────────┐
              ▼ (Pass)                                  ▼ (Defects found)
           OQC Check                               Rework Loop (Sanding/Touch-up)
              │                                         │
              ├─── Defect ──► Rework Child Card ◄───────┘
              ▼ (Pass)               │
           PDI Gate                  ▼ (Re-spray & Re-bake)
              │               Re-inspect at IPQC/OQC
              ├─── Defect ───────────┘
              ▼ (All Passed)
       Packing Slip + FG Offer Report
              ↓
       Dispatch + Gate Pass (Outward)
```

**Quantity Handover Confirmation (cross-stage loss tracking)**

Added to solve a real, recurring floor problem: pieces going missing between stages with no visibility into *where* the loss happened.

- Every stage-to-stage handover requires **two-sided quantity confirmation**: the handing-over role logs quantity sent; the receiving role logs quantity actually received.
- Handover points: Store Keeper → 3 Painters (individual material issues per Painter Job Card), 3 Painters → FPA/IPQC Inspector (batch complete per painter), IPQC → OQC, OQC → PDI, PDI → Dispatch Coordinator (packing).
- Any variance (sent ≠ received) requires a mandatory reason code before the job card can proceed: `damaged`, `miscount`, `rejected_not_logged`, `rework_holding`, `other`.
- Each handover's variance is recorded independently, pinpointing exact operator or station discrepancies.
- A variance above a configurable threshold (e.g., >2% of batch) auto-escalates to Production Supervisor and Store Manager.

**Edge cases**
- **Rework on Rejection:** Parts that fail inspection are NOT written off as lost or scrapped; they enter the Rework Child Job Card. Only if a part fails after max rework attempts (default: 2 cycles) or suffers substrate breakage is it flagged as permanent scrap.
- **One Painter finishes ahead of others:** Each painter card can progress independently to IPQC, but final batch packing waits for full reconciliation across all 3 cards or splits into sub-deliveries.
- **Single Shift End with WIP in booth:** Painter logs current pieces sprayed; remaining pieces stay in "In-Progress Overnight Holding"; status locked in EOD closure and unlocked next morning.
- Client changes quantity mid-job → requires Supervisor + Plant Head approval, logged as a job card amendment with reason.
- Handover variance disputed between two roles → both quantities remain on record exactly as entered, annotated with a supervisor resolution note.

**Dependencies:** Employee Management, Material Custody (GRN), QC modules, Dispatch.

**Acceptance criteria:** Master Job Card splits seamlessly into 3 Painter Job Cards; each painter sees and logs only their own card; rejections trigger a trackable Rework Loop; no job skips a QC gate; stage transitions are timestamped and signed off.

---

## Module 4 — Material Custody (Client Material Inward / GRN)

**Purpose:** Because this is job-work, the client owns the raw material. PaintKing must prove exactly what came in, what was consumed, what was returned, and what was scrapped — this is the single highest-liability data in the whole system.

**User stories**
- As **Store Keeper**, I want to record exact quantity and condition of client material on arrival so there's no dispute later.
- As **Store Manager**, I want to reconcile issued vs. returned vs. scrapped material per job card.

**Features**
- GRN entry: client, job card reference, item description, quantity received, unit, condition notes, photo of received material, received-by.
- Issue-to-production tracking: quantity issued to floor per job card, running balance.
- Scrap/wastage recording with reason code (process loss, damaged-on-arrival, rejected-at-IQC).
- Return-to-client tracking for unused material.

**Validation:** Quantity issued to production cannot exceed quantity received minus already-issued minus scrapped. Any mismatch requires Store Manager override with mandatory remark (logged).

**Edge cases:** Client delivers material without an advance PO reference (walk-in/rush job) → Store Keeper can create a provisional GRN, later linked to a job card once created.

**Dependencies:** Job Card (Module 3).

**Acceptance criteria:** At any point, system can show: received qty, issued qty, in-process qty, finished qty, scrap qty, returned qty — and they reconcile to the received total.

---

## Module 4a — Material Consumption Tracking (Paint / Consumables)

**Purpose:** Distinct from Module 4 (client-owned material custody) — this tracks **PaintKing-owned consumables** (paint, hydrographic film, UV ink) issued against a job card. Moved up from Phase 2 to Phase 1 because it's the same class of problem as the piece-loss issue (Module 3's Handover Confirmation): material goes out, and without job-card-linked tracking, nobody can tell how much was actually used vs. wasted vs. unaccounted for.

**User stories**
- As **Store Keeper**, I want to issue paint/consumables against a specific job card so stock deducts in real time and I know exactly what went where.
- As **Production Supervisor**, I want rework consumption tracked separately from the original run, so a job's normal usage figures aren't silently distorted by a rejection that needed repainting.
- As **Plant Head**, I want to see if any job used far more paint than expected, so abnormal wastage (or worse) gets flagged instead of buried in a monthly total.

**Features**
- Paint/consumable issue entry: job card reference, **issue type** (`original` or `rework` — mandatory selection, not inferred), quantity issued (liters/kg/meters depending on consumable), issued by (Store Keeper), issued to (Painter).
- Real-time stock deduction from the `consumables` register on issue.
- Return/leftover logging: quantity actually used vs. quantity returned unused — both recorded, so issued = used + returned is checked, the same reconciliation pattern as Module 4's material custody.
- Standard consumption rate per process type/part (e.g., "~15ml per piece for this part") settable by Plant Head; system flags a job card whose actual consumption is significantly above this rate — for review, not an automatic block.
- Rework issues always reference back to the original job card and are visible as a separate line item on that job card's history — never merged into the original figure.

**Input/Output/Validation**
- Issue type is mandatory on every entry — a rework issue cannot be logged as "original," and vice versa (this is the one field that must never be inferred, since it's the whole point of the fix).
- Cannot issue more than current stock balance without a Store Manager override (same pattern as Module 4).

**Workflow**
```
Store Keeper receives paint request for Job Card
   ↓
Selects: Original run OR Rework
   ↓
Enters quantity issued → stock deducted in real time
   ↓
Painter uses material → logs quantity actually used / returns unused balance
   ↓
System checks: issued = used + returned?
   ↓ (mismatch)                          ↓ (matches)
Store Keeper flags with reason      Consumption recorded against job card,
                                     checked against standard rate
```

**Edge cases**
- A job is reworked more than once (rejected twice) → each rework issue is its own line item, not merged with the first rework — full history shows exactly how many attempts a job took.
- Multiple consumables used in one job (e.g., primer + top coat for spray painting) → each logged as a separate issue line under the same job card, same issue-type distinction applies to each.

**Dependencies:** Job Card (Module 3), Store Keeper role (Document 3).

**Acceptance criteria:** Every unit of paint/consumable issued is attributable to a specific job card and a specific issue type (original/rework); a job card's consumption history clearly separates original-run usage from rework usage; any job whose consumption significantly exceeds the standard rate is visible on the dashboard for review.

---



**Purpose:** Digitizes the existing FPA workflow — a first-piece/sample sign-off before bulk production starts, replacing the verbal-dependency problem that was the original reason this system was built.

**User stories**
- As **Production Supervisor**, I want to submit a first-piece sample (photo + specs) for approval before running the full batch, so I don't waste material on a wrong spec.
- As the **designated FPA approver**, I want a clear queue of pending approvals so nothing sits waiting on me unnoticed.

**Features:** Sample submission (photo, color/finish code, spec reference document), approve/reject with remarks, linked to job card, blocks "In Production" status until approved (enforced in Module 3).

**Edge cases:** Approver unavailable → system escalates after a configurable SLA (e.g., 2 hours) to a backup approver or Plant Head.

**Dependencies:** Job Card, DMS (spec documents).

**Acceptance criteria:** No job card can reach "In Production" status without a logged FPA approval record.

---

## Module 6 — Quality Control (IQC, IPQC, OQC, PDI)

**Purpose:** Four-stage QC gate matching the existing paper formats, now digital with photo evidence — this is what makes PaintKing's MNC-client audits fast (BRD BO-4, BO-5).

**User stories**
- As **IQC Inspector**, I want a simple pass/fail/rework form with mandatory photo so incoming material issues are caught before production starts.
- As **FPA/IPQC Inspector**, I want to log in-process checks at defined intervals during a run without stopping the line for long.
- As **OQC/PDI Inspector**, I want a final checklist before dispatch so defective goods never leave the plant.

**Features (per stage — IQC / IPQC / OQC / PDI)**
- Checklist based on process type (Spray Painting checklist differs from Hydrographic/UV/Moulding checklist).
- Mandatory photo capture (before/after or defect close-up).
- Pass / Fail / Rework disposition with remark field.
- Inspector, timestamp, job card reference auto-attached.
- Rejection triggers a notification to Production Supervisor.

**Input/Output/Validation:** A stage cannot be submitted with a "Fail" or "Rework" disposition and zero photos — photo is mandatory evidence on any non-pass result.

**Edge cases**
- IPQC check flags an issue mid-run → Supervisor can pause the job card; resuming requires a remark.
- Client demands to witness OQC/PDI (common in MNC job-work) → system supports a "client-witnessed" checkbox with an optional client signature/name field.

**Dependencies:** Job Card (gates), DMS (checklists per process type).

**Acceptance criteria:** Every job card has an unbroken IQC→IPQC→OQC→PDI record before Packing Slip generation; every non-pass disposition has at least one photo and a remark.

---

## Module 7 — Document Management (13 Digitized Formats + FPA)

**Purpose:** Structured storage (not flat PDFs) of: Production Report, Job Card, GRN Copy, IQC Report, FPA Report, IPQC, OQC Report, PDI Report, Packing Slip, FG Offer Report, Production Offering Report, Leave Format, Gate Pass.

**User stories:** As **any role**, I want to pull up the historical record for a job card in seconds during a client or ISO audit.

**Features:** Each format above is a structured record type (not a scanned image) linked to job card / employee / date; version history on any edited document; export to PDF for external sharing (client, auditor) while keeping the structured original.

**Edge cases:** Client requests a document format they're used to seeing on paper → PDF export should visually resemble the original paper format where practical, to ease client-side transition.

**Dependencies:** Nearly every module feeds this one.

**Acceptance criteria:** Any of the 13 formats can be retrieved and exported for a given job card within a few clicks, with full history of who created/edited it.

---

## Module 8 — Dispatch (Packing Slip, FG Offer Report, Production Offering Report)

**Purpose:** Final outbound step, gated on passed PDI.

**User stories:** As **Dispatch Coordinator**, I want to generate the Packing Slip and FG Offer Report directly from job card data so I'm not re-typing quantities that QC already recorded.

**Features:** Auto-populate from job card + PDI pass record; Packing Slip lists quantity, part, client, job card ref; FG Offer Report and Production Offering Report as per existing paper formats, now system-generated.

**Validation:** Packing Slip generation blocked unless PDI status = Pass (system-enforced, ties to FR-11).

**Dependencies:** Job Card, QC (PDI), Gate Pass.

**Acceptance criteria:** Packing Slip quantity always reconciles to PDI-passed quantity; cannot be generated for a job card without a PDI pass.

---

## Module 9 — Gate Pass (Security)

**Purpose:** Physical control of material/vehicle movement in/out — owned entirely by Security role per the existing RBAC matrix.

**User stories:** As **Security**, I want to log every inbound/outbound vehicle and material movement, linked to a GRN or Job Card where one exists, so there's a physical-movement record independent of production data.

**Features:** Gate Pass entry (vehicle no., driver, material description, quantity, in/out timestamp, linked job card/GRN if applicable), standalone entries allowed for non-job movements (e.g., general goods, visitor vehicles).

**Edge cases:** Material leaves for outside processing (sub-contracted step, if any) and returns later — Gate Pass supports "out for job work" and matching "return" pairing.

**Dependencies:** Job Card, GRN (optional link).

**Acceptance criteria:** Every dispatch has a corresponding outbound Gate Pass entry.

---

## Module 10 — GST Job-Work Invoicing

**Purpose:** Job-work has distinct GST treatment — material movement is via delivery challan (not tax invoice) under CGST Act Sec. 143; PaintKing invoices only for the **service** (job-work charges), not the material value.

**User stories:** As **Accountant**, I want the system to generate the correct document type (challan vs. GST invoice) automatically based on transaction type, so we don't accidentally invoice client-owned material.

**Features**
- Delivery challan: generated for client material inward/outward movement (no GST, since ownership doesn't transfer).
- Job-work GST invoice: generated for the service charge only, correct SAC code for job-work services, applicable GST rate.
- Reference linking: challan ↔ job card ↔ invoice, fully traceable.

**Validation:** System should warn (not silently allow) if a user attempts to invoice material value instead of service value — flagged for Accountant review, not hard-blocked, since final judgment is a compliance/CA call.

**Edge cases:** Job work involving PaintKing-procured consumables (paint, film, ink) that do get consumed and become part of invoiced value — must be itemized separately from client-owned material.

**Dependencies:** Job Card, Material Custody, Dispatch.

**Acceptance criteria:** Every dispatched job card has either a linked challan, a linked invoice, or both, matching the material-ownership rule above. *(Flagged in BRD Risk Register — requires CA sign-off before go-live.)*

---

## Module 11 — Leave Management

**Purpose:** Basic leave request/approval, feeding shift/employee availability shown in Job Card assignment.

**User stories:** As **any employee**, I want to apply for leave and see approval status; as **Supervisor**, I want to approve/reject with visibility into who else is off that day.

**Features:** Leave request (date range, type, reason), Supervisor approval, calendar view of team availability.

**Dependencies:** Employee Management.

**Acceptance criteria:** Approved leave reflects in shift/availability views used for job assignment.

---

## Module 12 — Reports & Dashboards (MD/Plant Head)

**Purpose:** Real-time visibility that doesn't exist today (BRD BO-6).

**User stories:** As **MD**, I want one screen showing WIP by process line, TAT breaches, and QC rejection rate, without asking anyone on the floor.

**Features**
- WIP count by process type (Spray/Hydrographic/UV/Moulding).
- TAT breach list (red-flagged job cards) with days overdue.
- QC rejection rate by stage (IQC/IPQC/OQC/PDI) — trend over time.
- Daily production count vs. target.
- Drill-down from any dashboard number to the underlying job cards.

**Dependencies:** All operational modules feed this.

**Acceptance criteria:** Dashboard numbers always match a live query of underlying job card data (no stale/batch-only reporting for Phase 1 scope).

---

## Module 13 — Audit Trail & Compliance

**Purpose:** Every create/update/approve action logged — required both for internal dispute resolution and MNC/ISO audits (BRD FR-17).

**User stories:** As **MD or an external auditor**, I want to see exactly who changed what and when on any record, with no possibility of silent edits.

**Features:** Append-only audit log (user, action, timestamp, before/after values) on every module; no hard deletes anywhere — status changes (e.g., "cancelled") instead of removal.

**Dependencies:** All modules.

**Acceptance criteria:** For any record in the system, a complete change history can be produced on demand.

---

**Cross-module note on Phase 2 items** (MNC Audit Questionnaire digitization, CAPA, full reorder-threshold Inventory management, Moulding tooling register, full Accounting, Customer Portal) — these are scoped in the BRD as Phase 2/3 and will get their own detailed FRD sections once Phase 1 is live and stable, rather than diluting this document. Basic consumable issue-tracking (Module 4a above) is Phase 1; only the fuller vendor/reorder-alert layer on top of it remains Phase 2.

---
*Next: Document 3 — Role-Wise SOP Manual (18 roles), written for non-technical shop-floor staff, using the exact module workflows above.*
