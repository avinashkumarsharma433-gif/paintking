# PAINTKING ERP — BUSINESS REQUIREMENT DOCUMENT (BRD)
**Document 1 of 8 | Version 1.0 | Prepared for PaintKing Paints Pvt. Ltd.**

> **Correction from initial brief:** PaintKing is **not** a paint/chemical manufacturer. Based on paintking.in and existing internal documentation, PaintKing is a **30+ year old industrial job-work / contract finishing company** offering four services to OEM clients: **Spray Painting, Hydrographic Printing (water-transfer), UV Digital Printing, and Injection Moulding.** Clients send parts (metal, plastic, EVA) for surface finishing or moulding; PaintKing does not own the end product — it processes client-supplied or client-specified components and returns finished goods. This BRD, and all 7 documents that follow, are built around a **job-work / contract manufacturing** model, not a chemical process-manufacturing model.

---

## 1. Executive Summary

PaintKing runs four production lines — Spray Painting, Hydrographic Printing, UV Digital Printing, Injection Moulding — serving automotive, electrical appliance, and consumer product OEMs on a job-work basis. Operations today run on paper formats (13 identified: Job Card, GRN, IQC/FPA/IPQC/OQC/PDI reports, Packing Slip, FG Offer Report, Production Offering Report, Leave Format, Gate Pass) plus verbal coordination for production specs, which has already been partially solved internally via a designer-built FPA (File/Final Production Approval) system with a standardized naming convention and 8-step workflow.

This project formalizes and extends that existing groundwork into a full **custom ERP + QMS platform** — replacing paper and verbal dependency with role-based digital workflows, real-time job/TAT tracking, multi-stage quality control, client material custody tracking, and MNC-audit-ready compliance reporting, culminating in a live dashboard for the MD.

**Confirmed Operational Rules (Factory Ground-Truth):**
1. **3 Painters = 3 Dedicated Job Cards:** When production starts on a batch, the master lot is divided across the 3 painters into 3 individual Painter Job Cards (`JC-xxx-P1`, `JC-xxx-P2`, `JC-xxx-P3`). Each painter is accountable for their own allocated quantity, sprayed count, first-pass yield, and defect rate.
2. **Single Shift Operation Only:** The plant runs in a **Single General Day Shift** (Morning to Evening). There is **no shift rotation or multi-shift handover**. At the end of the day, the factory executes an End-of-Day (EOD) closure, daily WIP is logged and safely held, the plant shuts down, and reopens the next morning.
3. **Rework on Rejection:** Parts flagged as defective during IPQC, OQC, or PDI (e.g. dust nibs, paint runs, orange peel, shade variation) are **NOT automatically scrapped**. They are routed into a formal **Rework Protocol** (sanding/buffing → re-coating/re-dipping → re-baking → re-inspection). Only parts failing after rework or suffering substrate defects are classified as scrap.

**This BRD builds on, not replaces, existing work:** the PRD for Modules A–E, the RBAC matrix (IQC / FPA-IPQC / OQC-PDI inspectors as separate roles, Production Supervisor across the single operational day shift, Painter self-view of their own specific sub-job card, Security-owned Gate Pass, Plant Head + MD logins with MD as superuser), the 13 digitized paper formats, and the bilingual 13-section MNC audit questionnaire are treated as confirmed inputs, not open questions.

## 2. Business Objectives

| ID | Objective | Why it matters |
|---|---|---|
| BO-1 | Eliminate verbal/WhatsApp dependency for production specs and approvals | Root cause of rework, wrong-spec batches, and disputes with clients |
| BO-2 | Full job/batch traceability from **client material inward → process → QC → rework → dispatch** | Job-work liability: client owns the material; PaintKing must prove custody, process history, and rework recovery |
| BO-3 | Real-time TAT (turnaround time) visibility per job card & individual painter output | Client SLAs are TAT-based; 3 individual painter job cards ensure granular operator accountability |
| BO-4 | Multi-stage QC digitized (IQC, FPA, IPQC, OQC, PDI) with photo evidence and sign-off | MNC clients audit PaintKing's QC process before awarding contracts |
| BO-5 | One-click MNC audit readiness (CAPA + evidence trail) | Existing 13-section/100-question audit is manual today; becoming a bottleneck for new MNC client onboarding |
| BO-6 | Live MD/Plant Head dashboard (capacity, WIP, TAT breaches, QC rejection rate) | No real-time visibility above shop-floor level today |
| BO-7 | GST-compliant job-work invoicing and documentation (challan, ITC-04, E-Way Bill) | Job work has distinct GST treatment (CGST Act Sec. 143) — compliance risk if mishandled |

## 3. Scope

### 3.1 In Scope (Phase 1 — 16 weeks)
- Authentication & Role-Based Access Control
- Employee Management (basic)
- Job Card creation, tracking, and TAT dashboard
- Client Material Inward (GRN) with custody tracking
- Quality Control: IQC, FPA, IPQC, OQC, PDI — digital forms with photo capture
- Document Management for the 13 digitized formats + FPA workflow
- Dispatch & Packing Slip, FG Offer Report
- Basic GST job-work invoicing (challan-based, not full accounting)
- Gate Pass (Security role)
- Leave Management (basic)
- MD/Plant Head live dashboard
- Audit trail on all transactions

### 3.2 In Scope (Phase 2 — post Phase 1)
- Full accounting module (ledgers, payments, reconciliation)
- MNC audit questionnaire digitization with CAPA workflow
- Inventory/consumables management (paint stock, hydrographic film, UV ink)
- Injection Moulding-specific tooling/mould maintenance tracking
- Customer portal (client self-service job status view)

### 3.3 In Scope (Phase 3 — future)
- Predictive maintenance for spray booths/conveyors
- Mobile app for shop-floor (currently assumed browser-based PWA)
- Multi-plant support (if PaintKing expands sites)
- API integrations with client ERPs (large MNC clients may request EDI/API job status feeds)

### 3.4 Out of Scope (all phases, unless explicitly requested)
- Payroll processing (assume existing HR/payroll tool continues)
- E-commerce / D2C storefront
- Raw material manufacturing (PaintKing does not manufacture paint/ink itself — it applies purchased coatings)

## 4. Stakeholder Matrix

| Stakeholder | Role in project | Interest |
|---|---|---|
| MD (Gurprit Sir) | Executive sponsor, final approver | ROI, audit-readiness, real-time visibility |
| Plant Head / General Manager | Operational owner | Shop-floor adoption, TAT compliance |
| Avinash (You) | Business analyst / design lead / requirements owner | Translating shop-floor reality into working system |
| Production Supervisor | Primary daily user | Master Job Card creation, splitting into 3 Painter Job Cards, EOD plant closure |
| QC Inspectors (IQC/FPA-IPQC/OQC-PDI) | Primary daily user | Fast, unambiguous digital forms; rework tagging |
| Store Keeper / Store Manager | Material custody | Client material inward/outward accuracy |
| Dispatch Coordinator | Outbound | Packing slip, FG offer accuracy |
| Security | Gate Pass owner | Vehicle/material gate movement |
| MNC clients (external) | Audit stakeholder | Traceability, CAPA evidence during audits |
| Development team (external/vendor) | Build | Clear, unambiguous FRD and schema |

## 5. Functional Requirements (Module-Wise, with Priority)

Priority key: **P0** = Phase 1 mandatory, **P1** = Phase 1 desirable, **P2** = Phase 2+.

| ID | Module | Requirement | Priority |
|---|---|---|---|
| FR-01 | Auth & RBAC | Role-based login; roles map 1:1 to existing RBAC matrix (IQC Inspector, FPA/IPQC Inspector, OQC/PDI Inspector, Production Supervisor, Painter, Store Keeper/Manager, Dispatch Coordinator, Security, Plant Head, MD) | P0 |
| FR-02 | Job Card | Create Master Job Card per client PO/order; split into 3 distinct Painter Job Cards (P1, P2, P3) for the 3 shopfloor painters; track allocated vs sprayed count per painter | P0 |
| FR-03 | Job Card | Auto-calculate TAT remaining; flag jobs at risk of breach (amber/red) | P0 |
| FR-04 | Material Custody | GRN entry on client material inward; link material lot to job card; track quantity received vs. quantity issued to production vs. returned/scrapped | P0 |
| FR-05 | FPA (Final Production Approval) | Digital first-piece approval workflow: Production Supervisor submits sample → designated approver signs off before bulk run starts | P0 |
| FR-06 | QC — IQC | Incoming QC check on client-supplied material before production acceptance | P0 |
| FR-07 | QC — IPQC | In-process QC checks at defined intervals during Spray/Hydrographic/UV runs, with photo capture and immediate defect identification | P0 |
| FR-08 | QC — OQC & Rework | Outgoing QC before packing, with pass/rework/scrap disposition; parts rejected for paint/surface defects automatically route to Rework Loop | P0 |
| FR-09 | QC — PDI | Pre-Dispatch Inspection, final gate before Packing Slip generation (checks both first-pass and rework-cleared parts) | P0 |
| FR-10 | QC | Each QC stage records inspector, timestamp, photo(s), pass/fail/rework disposition, defect categorization, remarks | P0 |
| FR-11 | Dispatch | Packing Slip generation from passed-PDI job card only (system-enforced) | P0 |
| FR-12 | Dispatch | FG Offer Report and Production Offering Report generated from job card data | P0 |
| FR-13 | Gate Pass | Security creates/logs gate pass for inbound/outbound material and vehicles, linked to GRN or Job Card where applicable | P0 |
| FR-14 | Invoicing | Generate job-work delivery challan (non-GST-invoice document per Sec. 143) and GST job-work invoice with correct HSN/SAC for the service | P0 |
| FR-15 | Leave | Employee leave application + supervisor approval | P1 |
| FR-16 | Dashboard | MD/Plant Head view: WIP by process line, individual painter output, rework recovery rate %, TAT breach count, daily production count | P0 |
| FR-17 | Audit Trail | Every create/update/approve action logged with user, timestamp, before/after state | P0 |
| FR-18 | DMS | Store the 13 digitized formats as structured data (not just PDFs) with version history | P1 |
| FR-19 | MNC Audit | Digitize 13-section/~100-question bilingual audit questionnaire with response history | P2 |
| FR-20 | CAPA | Corrective/Preventive Action tracking linked to QC rejections, rework trends, and audit findings | P2 |
| FR-21 | Inventory | Consumables stock (paint, hydrographic film, UV ink, rework abrasive/solvents) with reorder alerts | P2 |
| FR-22 | Moulding | Mould/tooling register with maintenance schedule, linked to Injection Moulding job cards | P2 |
| FR-23 | Accounting | Full ledger, payments, reconciliation | P2 |
| FR-24 | Customer Portal | Client login to view own job status (read-only) | P2 |

*(Full user stories, workflows, and acceptance criteria per module are in Document 2 — FRD.)*

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Job card list and dashboard load < 2s for up to 500 concurrent jobs |
| Availability | 99.5% uptime during operating hours (Single General Day Shift operation; daily EOD closure at evening, plant reopens next morning) |
| Security | Role-based access enforced server-side; QC photo evidence immutable once submitted; password + optional OTP for MD/Plant Head logins |
| Scalability | Designed for current single-plant scale (assume 50–150 employees); architecture should not block future multi-plant rollout |
| Usability | Shop-floor roles (Painter, QC Inspector, Security) must be operable by non-technical staff on day one — large touch targets, minimal typing, photo-first capture, Hindi/English toggle |
| Data residency | All data hosted in India (DPDP Act 2023 compliance) |
| Auditability | No hard deletes anywhere in the system; audit log retained minimum 5 years (aligns with GST/ISO record-keeping norms) |
| Offline tolerance | Shop-floor PWA should queue QC submissions if network drops briefly and sync on reconnect (spray booth areas may have weak Wi-Fi) |

## 7. Technology Stack Recommendation

| Layer | Recommendation | Why |
|---|---|---|
| Frontend | Next.js + React + TypeScript + Tailwind + shadcn/ui | Fast to build, PWA-capable for shop-floor tablets, matches modern hiring pool |
| Backend | Node.js + NestJS + TypeScript | Structured, testable, same language as frontend (easier for a small team to maintain) |
| Database | PostgreSQL 16 | Strong relational integrity for job/material/QC traceability chains |
| ORM | Prisma | Type-safe, fast to iterate schema during build |
| File/photo storage | AWS S3 (Mumbai region) or an Indian cloud (Yotta/NxtGen) if data-residency preference is strict | QC photos are core evidence — need durable, cheap object storage |
| Auth | Self-managed JWT + refresh tokens (Keycloak only if user count later exceeds ~200 and SSO becomes worthwhile) | Keeps Phase 1 lean; avoid over-engineering auth for current scale |
| Hosting | AWS Mumbai (ap-south-1) or Indian cloud provider | Data residency + low latency for plant location |
| Monitoring | Basic uptime + error logging (e.g., simple Grafana/Prometheus or a hosted alternative) | Full observability stack is Phase 2+; don't over-build for Phase 1 team size |

*(Full architecture, scaling plan, and security design are in Document 7.)*

## 8. Timeline — Phase 1 (16 Weeks)

| Week(s) | Milestone |
|---|---|
| 1–2 | Requirements freeze, RBAC/role confirmation, DB schema finalization |
| 3–4 | Auth, RBAC, Employee Management, base UI shell |
| 5–6 | Job Card module + Material Custody (GRN) |
| 7–9 | QC module: IQC, FPA, IPQC, OQC, PDI (digital forms + photo capture) |
| 10 | Gate Pass + Leave Management |
| 11–12 | Dispatch: Packing Slip, FG Offer Report, Production Offering Report |
| 13 | Job-work invoicing (challan + GST invoice generation) |
| 14 | MD/Plant Head dashboard |
| 15 | Audit trail hardening, UAT with actual shop-floor staff |
| 16 | Bug fixes, training, go-live |

## 9. Budget Estimate (INR) — Phase 1

> Assumption stated explicitly: figures below assume a **2–3 person build team** (1 full-stack lead + 1 developer + part-time QA/PM), typical for an Indian SME custom-build engagement. Adjust once you confirm whether this is in-house, freelance, or agency-built.

| Item | Estimate (INR) |
|---|---|
| Development (16 weeks, 2–3 person team) | ₹9,00,000 – ₹14,00,000 |
| Cloud hosting + storage (Year 1) | ₹60,000 – ₹1,20,000 |
| UAT devices (tablets for shop floor, if not already owned) | ₹80,000 – ₹1,50,000 (qty-dependent) |
| Training & documentation | ₹40,000 – ₹60,000 |
| Contingency (15%) | ~₹1,60,000 |
| **Total Phase 1 (approx.)** | **₹12,00,000 – ₹18,00,000** |

## 10. Success Criteria & KPIs

| KPI | Target post go-live |
|---|---|
| % of jobs with complete digital QC trail (IQC→PDI) | 100% |
| Average TAT breach rate | Reduce by 30% within 3 months |
| Verbal/WhatsApp spec disputes | Reduce to near-zero |
| Time to produce MNC audit evidence pack | From days to < 1 hour |
| Client material discrepancy incidents (lost/mismatched custody) | Reduce by 50% |
| System adoption by shop-floor roles | 90%+ daily active use within 4 weeks of go-live |

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shop-floor staff resist digital forms (low tech literacy) | Medium | High | Photo-first, minimal-typing UI; hands-on training; Hindi UI toggle |
| Weak Wi-Fi near spray/hydrographic booths breaks real-time QC entry | Medium | Medium | Offline-queue-and-sync PWA design (NFR above) |
| Scope creep from Phase 2/3 features into Phase 1 | High | Medium | Strict phase gating in this BRD; change requests go through formal approval |
| Client material custody errors during transition (paper→digital) | Medium | High | Run parallel (paper + digital) for first 2 weeks post go-live |
| Single developer/vendor dependency | Medium | High | Ensure documentation (this deliverable set) is complete enough for a different developer to pick up |
| GST job-work compliance misconfigured | Low | High | CA/GST consultant review of Document invoicing logic before go-live |

## 12. Approval Matrix

| Deliverable | Reviewed by | Approved by |
|---|---|---|
| This BRD | Avinash | Gurprit Sir (MD) |
| FRD (Doc 2) | Avinash + Plant Head | Gurprit Sir |
| SOP Manual (Doc 3) | Each department head | Plant Head |
| DB Schema / API Spec (Doc 4–5) | Dev team | Avinash |
| ISO Mapping (Doc 6) | External QMS consultant (recommended) | Gurprit Sir |
| Architecture (Doc 7) | Dev team | Avinash |
| UI/UX (Doc 8) | Shop-floor role reps (pilot users) | Plant Head |

---

**Key confirmed operational realities (Factory Ground-Truth):**
1. **Single Shift Operation Only:** Confirmed single general day-shift operation (morning to evening). No night shifts or multi-shift handovers; plant executes daily EOD closure and reopens next morning.
2. **3 Painters = 3 Dedicated Job Cards:** Every batch scheduled on the paint floor splits into 3 distinct Painter Job Cards (P1, P2, P3) for individual accountability, piece counts, and defect rates.
3. **Rework on Rejection:** PaintKing does NOT immediately scrap defective parts. Rejections from IPQC/OQC route into a formal Rework Loop (sanding, touch-up, re-spray, re-bake) to maximize recovery yield.
4. Phase 1 build team is small (2–3 people) — budget will change significantly if you're hiring an agency.
5. Existing PRD Modules A–E, RBAC matrix, and 13 digitized formats are final and this BRD extends them rather than replacing them.
6. "FPA" = Final/First Production Approval (pre-bulk-run sign-off).
7. Job-work GST treatment (challan + Sec. 143) applies under SAC 9988.

---
*Next: Document 2 (FRD) — detailed module-wise user stories, workflows, and acceptance criteria for all 13 modules listed above, corrected for the job-work coating/printing/moulding model.*
