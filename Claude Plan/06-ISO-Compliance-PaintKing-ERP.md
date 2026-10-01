# PAINTKING ERP — ISO COMPLIANCE MAPPING
**Document 6 of 8 | Version 1.0**

> Scope note: PaintKing is a job-work surface-finishing operator (spray painting, hydrographic printing, UV digital printing, injection moulding), not a paint/coatings manufacturer. BIS standards for paint *formulation* (IS 101, IS 2932 etc.) are therefore **not applicable** — those govern paint manufacturers, not applicators. What matters for PaintKing's clients (often MNC OEMs) is **process control and traceability**, which is what Documents 1–5 already build. This document maps existing/planned ERP features to the standards that actually apply to a job-work finishing operation.

---

## 1. ISO 9001:2015 — Quality Management Systems

The most directly relevant standard — an MNC client auditing PaintKing is largely checking ISO 9001-style process control even if PaintKing isn't formally certified yet.

| Clause | Requirement | ERP Feature | Evidence Produced |
|---|---|---|---|
| 4.4 (Processes) | Documented process approach with inputs/outputs/controls | Job Card lifecycle (Module 3) — every stage transition is a defined, gated process step | `job_card_stage_history` — full process map per job |
| 7.1.5 (Monitoring & Measuring Resources) | Inspection equipment/methods must be defined and controlled | QC checklist templates per process type (Module 6) | `qc_checklist_templates` table |
| 7.5 (Documented Information) | Controlled documents with version history | DMS (Module 7) — 13 structured formats with version history | `documents` + `document_versions` |
| 8.1 (Operational Planning & Control) | Planned, controlled production | Job Card + FPA gate before bulk production | `fpa_approvals`, stage-gate enforcement in API (409 on gate violation) |
| 8.4 (Control of Externally Provided Processes/Products) | Control over client-supplied material — directly analogous to "externally provided product" in job-work context | Material Custody / GRN module (Module 4) with mandatory photo and reconciliation | `material_grns`, `material_reconciliation` view |
| 8.5.2 (Identification & Traceability) | Product traceable at all stages | Job Card number + stage history + QC records, all linked | `job_card_stage_history`, `qc_inspections` |
| 8.6 (Release of Products/Services) | Products released only after verification | PDI gate before Packing Slip (system-enforced) | `packing_slips.pdi_inspection_id` FK requirement |
| 8.7 (Control of Nonconforming Outputs) | Nonconforming output identified, segregated, dispositioned | QC disposition (`fail`/`rework`) with partial-batch split at OQC/PDI | `qc_inspections.disposition`, `parent_job_card_id` split logic |
| 9.1 (Monitoring, Measurement, Analysis, Evaluation) | Track and analyze QC/process data | Dashboard (Module 12) — rejection rate trend, TAT compliance | `/dashboard/summary` endpoint |
| 9.2 (Internal Audit) | Internal audits at planned intervals | Audit trail (Module 13) provides raw data for internal audit; formal audit *scheduling* is a process the company runs, not a system feature per se | `audit_logs` |
| 10.2 (Nonconformity & Corrective Action) | Root-cause and corrective action on failures | CAPA (Phase 2, FR-20) | `capa_records` (stub table, Document 4) |

**Certification roadmap:** PaintKing already has most of clause 8 (operational control) covered once Phase 1 ships. Clause 9.2 (formal internal audit) and 10.2 (CAPA) are Phase 2 — realistic sequencing is: Phase 1 go-live → 3 months of clean data → engage a certification body for a gap assessment → Phase 2 CAPA build informed by that gap assessment, rather than building CAPA speculatively now.

---

## 2. ISO 27001:2022 — Information Security Management

Relevant because client-owned material data, specs, and QC photos are business-sensitive, and MNC clients increasingly ask job-work vendors about data security before awarding contracts.

| Clause/Annex A Control | Requirement | ERP Feature |
|---|---|---|
| A.5.15 (Access Control) | Access restricted by business need | RBAC (Module 1) — role-scoped, server-enforced |
| A.5.17 (Authentication Information) | Secure credential management | Password hashing, account lockout after 5 failed attempts, OTP for MD/Plant Head |
| A.8.15 (Logging) | Security-relevant events logged | `audit_logs` — append-only, no update/delete grants |
| A.8.24 (Use of Cryptography) | Data protected in transit/at rest | TLS for all API traffic; S3 server-side encryption for photos/documents |
| A.5.34 (Privacy & Protection of PII) | Personal data protected | Employee records access-limited to HR/Admin roles; aligns with DPDP Act 2023 (Section 7 below) |
| A.5.23 (Cloud Services Security) | Due diligence on cloud provider | AWS Mumbai region chosen specifically for data residency + provider maturity |

**Note:** Full ISO 27001 certification is a significant undertaking (ISMS scope, risk register, Statement of Applicability) — this mapping shows the *technical controls* the ERP already provides; formal certification would additionally require organizational policy documents outside this ERP's scope.

---

## 3. ISO 45001:2018 — Occupational Health & Safety

Applicable given spray booths (solvent exposure), UV curing (UV light exposure), and injection moulding (mechanical/heat hazards) are all inherently OH&S-relevant processes.

| Clause | Requirement | ERP Feature (Phase 2 unless noted) |
|---|---|---|
| 8.1.2 (Eliminating Hazards) | Hazard identification process | Not an ERP feature — physical/procedural control; ERP can log incidents if desired (Phase 2 addition, not currently scoped) |
| 6.1.2 (Hazard ID & Risk Assessment) | Documented risk assessments | Could be stored as a `documents` type (Module 7) if the company wants this digitized — currently out of the 13-format list, flag if wanted |
| 9.1 (Monitoring & Measurement) | Incident/near-miss tracking | **Not currently in Phase 1/2 scope** — recommend adding an "Incident Report" document type + basic incident log if ISO 45001 certification is an actual near-term goal |

**Honest gap:** This ERP as scoped (Documents 1–5) does not build OH&S incident tracking. If ISO 45001 is a genuine target (not just referenced from the original brief template), it needs its own small module — flagging this rather than inventing features not actually requested.

---

## 4. ISO 14001:2015 — Environmental Management

Relevant given solvent-based spray painting and UV ink use.

| Clause | Requirement | ERP Feature |
|---|---|---|
| 8.1 (Operational Control) | Control of processes with environmental aspects | Consumables tracking (Phase 2, FR-21) can extend to track solvent/paint waste volume, but isn't currently scoped for that purpose |
| 9.1 (Monitoring) | Environmental performance monitoring | **Not in current scope** — same honest-gap note as ISO 45001 above |

**Recommendation:** Same as OH&S — if environmental certification is a genuine near-term goal, scope a small "waste/effluent log" module in Phase 2 rather than assuming the consumables module covers it by default.

---

## 5. ISO 30414:2025 — Human Capital Reporting

Lightweight applicability at PaintKing's scale.

| Area | ERP Feature |
|---|---|
| Workforce composition, headcount | Employee Management (Module 2) |
| Attendance/leave metrics | Leave Management (Module 11) |
| Turnover | Employee status field (active/inactive) + date fields support a basic turnover calculation, not a full ISO 30414 report set |

**Note:** ISO 30414 is designed for larger organizations with formal HR reporting obligations (often investor-facing). At PaintKing's current scale, treat this as "the data exists if ever needed," not a certification target worth actively pursuing.

---

## 6. ISO/IEC 26514:2022 — User Documentation

| Requirement | How this deliverable set satisfies it |
|---|---|
| Documentation matches actual system behavior | Documents 1–5 (BRD, FRD, SOP Manual, DB Schema, API Spec) collectively are the user/technical documentation set |
| Role-appropriate documentation | SOP Manual (Document 3) written specifically for non-technical shop-floor comprehension, separate from the technical documents (4–5) aimed at developers |

---

## 7. DPDP Act 2023 (India) — Data Protection

Not an ISO standard, but included per the original brief's research requirement and directly relevant since this handles employee personal data.

| Requirement | ERP Feature |
|---|---|
| Data localization / residency | AWS Mumbai (ap-south-1) hosting (Document 7) |
| Purpose limitation | Employee data accessible only to HR/Admin roles, not exposed to unrelated modules |
| Data principal rights (access/correction) | Employee can view own leave/attendance record; formal "data subject request" handling is a process, not currently a dedicated system feature — flag if a formal request-handling workflow is wanted |
| Breach notification readiness | Audit trail (Module 13) supports incident investigation if a breach is suspected |

---

## 8. ISA-95 (Manufacturing Integration) — Applicability Note

**This standard is largely not applicable to PaintKing as scoped.** ISA-95 addresses integration between enterprise systems (ERP) and shop-floor control systems (MES/SCADA) for automated, sensor-instrumented manufacturing lines. PaintKing's processes (manual/semi-manual spray painting, hydrographic dipping, UV printing, injection moulding) are not currently instrumented with a SCADA/MES layer — the ERP built in Documents 1–5 *is* effectively the shop-floor system for this operation, not a layer integrating with a separate one. If PaintKing later automates a line (e.g., a robotic spray booth with PLC control), ISA-95-style integration becomes relevant then, not now.

---

## 9. Certification Roadmap Summary

| Standard | Realistic near-term relevance | Recommended sequencing |
|---|---|---|
| ISO 9001:2015 | High — directly matches what's already built | Phase 1 go-live → 3 months clean data → gap assessment → pursue certification |
| ISO 27001:2022 | Medium — matters for MNC client confidence, full certification is heavier | Technical controls already in place via Documents 1–5; formal ISMS documentation is a separate, later project |
| ISO 45001:2018 | Medium — genuinely relevant given process hazards, but **not currently built** | Requires its own small incident-tracking module if pursued — confirm this is wanted before Phase 2 planning |
| ISO 14001:2015 | Medium — same gap as above | Same — needs a waste/effluent module if pursued |
| ISO 30414:2025 | Low at current scale | Data exists for basic reporting; not worth dedicated build effort now |
| ISO/IEC 26514:2022 | Already satisfied | This document set itself is the evidence |
| BIS paint standards (IS 101/151/2932) | **Not applicable** | PaintKing applies coatings, doesn't manufacture them |
| ISA-95 | **Not applicable at current automation level** | Revisit only if a line becomes PLC/SCADA-controlled |

---

**Assumption flagged for confirmation:** This document assumes ISO 45001 and ISO 14001 were included in the original brief as generic template items rather than active certification targets, since neither has a corresponding module in Documents 1–5. If either is a real near-term goal, say so and a small additional module (incident log / waste log) should be added to the FRD before Phase 2 planning — better to flag this gap now than to claim compliance the system doesn't actually provide.

---
*Next: Document 7 — Tech Stack + Architecture, formalizing the recommendations already referenced above (AWS Mumbai, RBAC, audit logging) into a full architecture document.*
