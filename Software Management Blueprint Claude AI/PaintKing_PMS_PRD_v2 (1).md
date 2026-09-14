# Project Brief & Product Requirement Document (PRD) — v2
## Custom Manufacturing ERP & Quality Management SaaS for Industrial Spray Painting Operations

*This version maps every module directly onto PaintKing's actual paper formats (13 live shop-floor sheets) and the live MNC audit questionnaire (13 sections, A–M, ~100 questions, English + Hindi), so the schema below can be handed straight to a developer or AI code-builder.*

---

### 1. Executive Summary

PaintKing Solutions Pvt. Ltd. is an industrial spray painting and surface coating company transitioning from manual, paper-based operations (logbooks, paper forms, unlinked spreadsheets) to a centralized, cloud-based SaaS platform (ERP + QMS).

Objectives:

* Digitize shop floor reporting across all production stages, using the company's own existing form fields (not generic templates) so operator adoption is immediate.
* Establish absolute material traceability to eliminate quantity discrepancies during inter-department handovers.
* Enforce operational discipline via automated turnaround time (TAT) tracking and job card deadlines.
* Build an end-to-end Quality Control (QC) architecture across every stage of the lifecycle — Incoming → In-Process → First Part Approval → Outgoing → Pre-Dispatch.
* Meet and exceed enterprise-grade MNC vendor audit standards by embedding the 13-section (A–M), ~100-question compliance framework directly into daily process data.

---

### 2. Core Business Problems & Bottlenecks

1. **Unorganized Data & Lack of Real-Time Visibility** — Production, QC, and store records live across 13+ separate paper formats (Production Report, Job Card, GRN, IQC, FPA, IPQC, OQC, PDI, Packing Slip, FG Offer Report, Leave Format, Gate Pass), with no linkage between them.
2. **Inter-Department Material Discrepancies / Shrinkage** — Job Card "Issue" vs "Return" quantities and GRN "Invoiced/Challaned Qty" vs "Actual Received" vs "Short-Excess" are reconciled manually, causing untracked losses and blame-shifting between Store, Production, and QC.
3. **Absence of Strict SLA / Deadline Enforcement** — Job Cards capture Issue Date/Time and Return Date/Time but have no system-enforced Lead Time or escalation.
4. **Disjointed Quality Control** — Five separate inspection stages (IQC, FPA, IPQC, OQC, PDI) each run on standalone sheets with no shared defect taxonomy, sample-to-batch linkage, or rejection roll-up.
5. **Low Vendor Audit Scores from Tier-1 MNC Clients** — The existing Audit Questionnaire (13 sections, A–M) is filled manually per audit cycle; process rigor and record-keeping described in it aren't backed by system-generated evidence, hurting vendor quality ratings.

---

### 3. Source Document Inventory (mapped to the PRD)

| Existing paper format | Maps to PRD module | Purpose |
|---|---|---|
| Production Report / Production Offering Report | Module C | Daily plant-wise output vs target, rejection, efficiency |
| Job Card (Cubic Paint Frame) | Module B, C | Issue/Return chain of custody + process-stage quantities |
| GRN Copy | Module B | Inward material receipt & reconciliation |
| IQC Report | Module D.1 | Incoming Quality Inspection |
| FPA Report | Module D.3 (gate) | First Part Approval before a production run starts |
| IPQC | Module D.3 | In-Process Quality Control, shift-wise |
| OQC Report | Module D.4 | Outgoing Quality Control on finished lots |
| PDI Report | Module D.5 | Pre-Dispatch Inspection |
| Packing Slip | Module D.5 | Box-level packing record |
| FG Offer Report (for OQC) | Module D.4 | Finished-goods lot offered for OQC, box-wise |
| Leave Format | Module A (HR sub-module) | Employee leave application |
| Gate Pass | Module B (optional) | Material/vehicle gate movement |
| Audit Questionnaire (A–M, English+Hindi) | Module E | Live MNC audit compliance framework |

---

### 4. Key Functional Modules & Features Required

#### Module A: Role-Based Access & Departmental Reporting

* **RBAC dashboards** for: Store/Inward, Production/Painting, Quality Engineer, Manager QA, Prod. Supervisor, HR, Management/MD.
* **Digital Forms** — each of the 13 paper formats above becomes a mobile/tablet-friendly digital form, using the exact field labels already in use (bilingual English/Hindi labels where the source form uses both), so no retraining is needed for shop-floor staff.
* **HR sub-module**: Leave Application Form digitized — Employee Name, Father Name, Department, Designation, Local Address, Permanent Address, Reason, Leave On/Off Date, Total Leave Days, with Employee → Dept. Incharge → H.R. → Authorized Sign digital approval chain.
* **Automated Anomaly & Error Escalation** — real-time alerts on critical errors, delays, or threshold violations.

#### Module B: Digital Material Handover & Custody Tracking

* **GRN (Goods Received Note)**: GRN No., Date, Vehicle No., Supplier, Invoice/Challan No. & Date, Received Date, Transport Name, and a line-item table (Part Code, Part Description, Invoiced/Challaned Qty, Actual Received, Short-Excess, Ok By IQC, Rej. Qty, Remark) — system auto-computes Short-Excess and blocks GRN closure until Store Incharge + Quality (IQC) + Approver all sign off.
* **Job Card — Two-Way Handover Verification**: Initial Process side (Painter Name, W.No., Issue Date/Time, Customer, Lead Time, Dept., Issue Material Details: Item Description/Qty/Colour/UOM/Remark) vs Final Process side (Return Material Description, Return Painter Name, Return Date/Time, Return Ok Qty, Return Rejection Qty, Checking Person). System flags variance between Issue Qty and (Return Ok Qty + Return Rejection Qty) and requires a reconciliation code before the job card can close.
* **Job Card — Process Stage Tracking**: Process First (Base Coat), Process Second (Dipping), Process Third (Final Lacquer) — each stage captures Total Qty / Ok Qty / Rejection Qty, giving stage-wise yield.
* **Gate Pass**: digitized for material/vehicle in-out movement (structure to be finalized with security team — current sheet is a placeholder in the source file).
* **Batch/Lot & Job Card Tracking** via Barcode/QR linking every physical batch from GRN → Job Card → IQC/FPA/IPQC/OQC/PDI → Packing Slip.

#### Module C: Job Card Production Management & Deadline Tracking

* **Production Report fields**: Plant, Painter Name, Customer, Model, Colour, Target, FPA Time, Achieved Qty, Effi. (Efficiency %), Remarks — rolled up to a Production Efficiency Overall dashboard, with Checked By / Approved By sign-off.
* **Production Offering Report fields**: Doc No., Date, Plant, Painter Name, Customer, Job Model, Job, Colour, Target, Achieved, In-Process Rejection, Final Rejection, Problem, Painter Sign, Remark — Prepared By / Checked By / QA By / Approved By chain.
* **Standard Operating Time & SLA Engine**: Job Card's Lead Time field becomes a system-enforced TAT; auto-flag when Issue→Return exceeds Lead Time.
* **Operator Accountability**: start/pause/completion timestamps tied to Painter Name and W.No. (worker number).
* **Bottleneck Escalation**: dashboard highlighting near-deadline/overdue job cards by Plant and Painter, notifying Prod. Supervisor.

#### Module D: Multi-Stage Quality Assurance (QA/QC)

All five inspection stages share a common structure: header (Report No., Date/Time, Part Description, Part Code, Family, Customer, Work Order No., Batch/Lot info) + a parameters table (Sr. No., Parameter, Specification, Measurement Technique, Result/Observation) + sign-off (Prepared By: Quality Engineer / Approved By: Manager QA).

1. **Incoming Quality Inspection (IQC)** — Vendor/Customer, Part/Component, Invoice/Challan No. & Date, Inv. Quantity, UOM, Actual Received; checks: Packing/Box Condition, Traceability (Batch No.), Quantity, Physical Inspection (damage/silver line/lock damage/bend/flash), Conductivity, Adhesion (cross-cut + tape test), Delta Value (spectrophotometer, tolerance within 1); each tagged Major/Critical impact. Captures Sample Size, Pass Qty, Reject Qty, Rejection %, Rejection Detail, and a Root Cause / Corrective Action / Preventive Action block (feeds Module E CAPA).
2. **First Part Approval (FPA)** — Paint Description, Paint Batch No., Thinner Batch No., Paint Viscosity, Painter Name, Painting Booth, Startup Time, Approval Time, Work Order No.; checks across up to 5 samples (S1–S5): Visual Test (Bubble, Dust Spot, Over Paint, Paint Missing, Colour vs Approved Sample, Overall Finishing), Adhesion Test (cross-cut tape), Delta Value Test (L, A, B, ∆E via spectrometer). Ends with Quality Engineer comment, Painter acceptance, and Production Incharge acceptance — this is the mandatory gate before a production run can start (a full run cannot log output in Module C until its FPA record is Approved).
3. **In-Process Quality Control (IPQC)** — same header fields as FPA plus Shift A/Shift B supervisors and painters, sampled across defined time windows (8:00–11:00 through 5:00–8:00, 8 slots/day); same defect + Delta Value parameter set as FPA, logged per shift.
4. **Outgoing Quality Control (OQC)** — Customer, Work Order No., Part Code/Description, Model, Colour, Offer Qty; checks: Damage, Scratch, Sink Mark, Short Fill, Bubble, Pin Mark, Dust Spot, Over Paint, Paint Missing, Colour, Overall Finishing (all visual) + Delta Value Test (L, A, B, ∆E). Captures No. of Checked Samples, Rejected Nos., and Lot Acceptance status; feeds the FG Offer Report (Box No., Customer, Item Code, Part Description, Model, Colour, Box Qty, Ok Qty, Rej. Qty, Total Qty) which is the box-level ledger checked by Production and verified by QC.
5. **Pre-Dispatch Inspection (PDI)** — Lot Size, Box Qty, Invoice Number; checks: Box/Bin Condition, Polybag Condition, Identification (vs Store Material Slip), Short/Excess (count), Painting Defects, Adhesion Test, Delta Values (L, A, B, ∆E). Captures Checked Sample count, Rejected Nos., Defect Details, Lot Acceptance. Final artifact is the **Packing Slip** (Customer, Packing Date, Packed Qty, Model, Part Description, Colour, Box No., Painter Name, Packed By / Checked By / Verified By) — auto-generated once PDI passes.
* **Automated Rework / Scrap Workflow**: any Rejection Qty logged at Job Card, IQC, FPA, IPQC, OQC, or PDI stages auto-creates a defect-coded rework/scrap ticket with cost roll-up.

#### Module E: MNC Audit Readiness & Enterprise Compliance Engine

* **Pre-configured Audit Questionnaire — live structure, not generic**: 13 sections (A–M), bilingual English/Hindi, ~100 questions total, header block (Plant, Date, Filled by, Department, Designation, Mobile, Reviewed by, Review date):
  - A. Plant & Process Scope
  - B. Incoming Material & Stores
  - C. Paint Preparation & Mixing
  - D. Pre-treatment, Cleaning & Loading
  - E. Painting Process & Parameters
  - F. Start-up / First Piece Approval
  - G. In-process & Final Quality Controls
  - H. Traceability, Packing & Dispatch
  - I. Rejection, Rework & Non-Conforming Material
  - J. Customer Complaints, CAPA & Change Control
  - K. Machines, Maintenance & Calibration
  - L. SPC, Capability, Training & Documents
  - M. Internal Audit & Management Review
  - Each answer captures: actual current practice (not ideal-state), Yes/No/NA, actual value/range where applicable, and the linked record/form name — so wherever the answer is "see Job Card / IQC / FPA / IPQC / OQC / PDI / GRN", the system pulls the live record instead of a manual note.
* **Issue Resolution & CAPA Lifecycle** (Section J, and fed by IQC's Root Cause/Corrective/Preventive Action block): Root Cause Analysis (5-Why/Fishbone) with sign-off tracking.
* **One-Click Audit Reporting**: exports full batch traceability (GRN → Job Card → FPA → IPQC → OQC → PDI → Packing Slip) plus calibration records (Section K) and the filled Audit Questionnaire on demand.

---

### 5. Technical & Non-Functional Requirements

* **Platform**: Responsive Web Application (desktop for QA/Management, mobile/tablet for shop floor).
* **Architecture**: Secure Multi-tenant or Enterprise Single-tenant Cloud Architecture (e.g., AWS/GCP).
* **Notifications**: transactional email/SMS/WhatsApp for critical alerts (TAT breach, quantity variance, rejection spike).
* **Input Baseline**: database schema mapped directly from the 13 existing formats above — field names, labels, and bilingual text preserved wherever the source form uses them, so operator-facing forms match what staff already know.
* **Language**: bilingual English/Hindi UI for shop-floor-facing forms (Job Card, Leave Format, Audit Questionnaire), matching current practice.

---

### 6. Expected Outcome

A unified, paperless manufacturing execution system — built on PaintKing's own real forms rather than a generic template — that eliminates unaccounted product loss, enforces painter productivity and deadlines, establishes airtight quality gates across IQC/FPA/IPQC/OQC/PDI, and turns the existing 13-section audit questionnaire into a system-backed, one-click compliance report for MNC vendor audits.
