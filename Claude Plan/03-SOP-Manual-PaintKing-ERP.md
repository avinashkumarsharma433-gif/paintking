# PAINTKING ERP — ROLE-WISE SOP MANUAL
**Document 3 of 8 | Version 1.0**

> Roles below are adapted from the standard 18-role template to match PaintKing's actual structure (confirmed in Documents 1–2): job-work finishing company, not a manufacturer. Some generic roles (e.g., "Production Manager") are merged into existing confirmed roles (e.g., Plant Head) to avoid inventing a position that doesn't exist on your floor — flag any of these mappings that are wrong.

**Role list (18):** 1. Director/MD 2. Plant Head (GM) 3. Production Supervisor 4. Painter/Machine Operator 5. IQC Inspector 6. FPA/IPQC Inspector 7. OQC/PDI Inspector 8. Store Keeper 9. Store Manager 10. Purchase Executive 11. Dispatch Coordinator 12. Security (Gate Pass) 13. Accountant 14. Finance Manager 15. HR Executive 16. HR Manager 17. IT Administrator 18. Maintenance Engineer

Every SOP follows this structure: **Role Definition → Reports To → ERP Access (screen-level) → Daily Tasks (step-by-step) → Weekly Tasks → Monthly Tasks → Exception Handling → KPIs → Escalation Matrix.**

---

## 1. Director / MD

**Role Definition:** Business owner, final decision authority, superuser on the ERP.
**Reports To:** —
**ERP Access:** All modules, all screens, all data (superuser). Can impersonate/view as any role for troubleshooting.

**Daily Tasks**
1. Open Dashboard → check TAT breach list (red flags) first.
2. Review QC rejection rate trend (any spike vs. yesterday).
3. Spot-check 2–3 job cards end-to-end (GRN → QC → dispatch) at random.

**Weekly Tasks:** Review production count vs. target; review any escalations logged during the week; approve any rush-job TAT overrides pending.
**Monthly Tasks:** Review client-wise TAT compliance report; review CAPA/audit findings (once Phase 2 live).

**Exception Handling:** Any red-flagged job card open more than 24 hours without Plant Head action → MD reviews directly.
**KPIs:** Overall TAT compliance %, QC rejection rate, client complaint count.
**Escalation Matrix:** Top of the chain — no escalation above MD.

---

## 2. Plant Head (General Manager)

**Role Definition:** Runs day-to-day plant operations across all four process lines.
**Reports To:** MD.
**ERP Access:** All operational modules (Job Card, QC, Dispatch, Material Custody, Dashboard); can approve TAT overrides and job card amendments; cannot edit financial/invoicing data.

**Daily Tasks**
1. Login → Dashboard → check WIP by process line.
2. Review any job cards flagged amber/red → contact Supervisor for the reason.
3. Approve/reject any pending FPA escalations (if backup approver).
4. Review Gate Pass log for anything unusual overnight.

**Weekly Tasks:** Meet with Production Supervisors on TAT performance; review Leave approvals for the week; check consumables stock trend (Phase 2).
**Monthly Tasks:** Compile production summary for MD; review Store Manager's material reconciliation report.

**Exception Handling:** Client quantity change request → approve/reject job card amendment with reason (logged).
**KPIs:** TAT breach %, QC pass rate by process line, on-time dispatch %.
**Escalation Matrix:** Escalates to MD for: budget overruns, client disputes, repeated QC failures from one line.

---

## 3. Production Supervisor

**Role Definition:** Owns the shop floor for the **Single General Day Shift** — the single most-used role in the system day to day. There are no shift rotations or multi-shift handovers; the supervisor oversees morning startup through evening Day-End (EOD) closure.
**Reports To:** Plant Head.
**ERP Access:** Master Job Card (create/update), 3-Painter Sub Job Card splitting, Rework Job Card routing, FPA submission, view GRN, Leave approval for floor staff, Daily EOD Plant Closure.

**Daily Tasks (step-by-step)**
1. Login → "My Job Cards" screen.
2. For each new client PO: tap "New Master Job Card" → fill client, part, total quantity, process type, target TAT → Save.
3. Once Store Keeper confirms GRN linked to the job card, tap "Submit for IQC."
4. After IQC passes, tap "Submit FPA Sample" → attach photo + spectrophotometer reading → wait for approval notification.
5. Once FPA approved, tap "Start Production" → **Split Master Job Card into 3 distinct Painter Job Cards (`JC-xxx-P1`, `JC-xxx-P2`, `JC-xxx-P3`)** for the 3 line painters. Allocate specific target quantities (e.g. 1,000 pcs each for a 3,000 pcs batch).
6. Monitor IPQC alerts during the run:
   - When defects (dust nibs, paint runs, orange peel, shade variation) are flagged, **do NOT declare scrap**.
   - Tap **"Route to Rework"** → creates Rework Child Job Card (`JC-xxx-RW1`) with defect tags.
   - Assign rework pieces to de-nibbing / sanding, then re-spray and re-bake.
7. **Evening Plant Shutdown (EOD Closure):**
   - At the end of the day, review all 3 Painter Job Cards.
   - Record total pieces sprayed, pieces cleared at first-pass, and pieces currently in rework queue.
   - Tap **"Execute Daily Day-End (EOD) Closure"** → system freezes daily output, logs overnight WIP holding, and safely shuts down operations until next morning. *(No shift handover — plant closes and re-opens next morning).*

**Weekly Tasks:** Review TAT performance, individual output per painter, and rework recovery yield %; flag recurring defects to Plant Head.
**Monthly Tasks:** Review Painter attendance/performance for input to HR.

**Exception Handling:** Client material short/damaged on arrival → do not submit for IQC; ask Store Keeper to raise a discrepancy note first. Unsalvageable defects after max rework cycles → escalate to Plant Head for formal scrap/client debit note authorization.
**KPIs:** On-time job card completion %, First-Pass Yield (FPY), Rework Recovery Rate %, individual painter output parity.
**Escalation Matrix:** Escalates to Plant Head for TAT overrides, client quantity changes, unresolved QC disputes with Inspector.

---

## 4. Painter / Machine Operator

**Role Definition:** Executes the physical spray/hydrographic/UV/moulding process on assigned individual Painter Job Cards (1 of 3 painters). Assume limited digital literacy — SOP is deliberately minimal-tap.
**Reports To:** Production Supervisor.
**ERP Access:** "My Jobs Today" screen only — sees only their own assigned Painter Job Card (`JC-xxx-P1`), cannot see peers' cards or other modules.

**Daily Tasks**
1. Login (tap employee photo/PIN on shared shopfloor tablet) → see today's assigned Painter Job Card.
2. **Confirm quantity received** — when Store Keeper issues raw pieces for your specific card, enter the quantity actually received. If it doesn't match the allocation, enter a reason before starting.
3. Tap the job card → view approved spec sheet and FPA photo reference before spraying.
4. During production, spray the allocated batch adhering to Ford 4 viscosity and gun distance standards.
5. Log production output:
   - Tap "Log Shift Batch" → enter Pieces Sprayed, First-Pass Good Pieces, and Pieces Flagged for Rework.
   - Place defective pieces (dust spots, runs) in the designated "Rework Holding Rack" for surface de-nibbing and re-spraying.
6. When handling Rework assignments: collect sanded pieces, apply re-coat/touch-up, and submit for re-inspection.
7. Log out at breaks or day-end (mandatory on shared devices).

**Weekly / Monthly Tasks:** None — this role has no reporting duties.
**Exception Handling:** Spec unclear or material looks wrong → do NOT proceed; tap "Flag Issue" which notifies Supervisor immediately. Handover mismatch → always enter the real count and a reason.
**KPIs:** Pieces sprayed per day, First-Pass Yield % (low defect rate), rework turnaround time.
**Escalation Matrix:** Escalates only to Production Supervisor.

---

## 5. IQC Inspector

**Role Definition:** First quality gate — inspects client-supplied material on arrival, before production starts.
**Reports To:** Plant Head (quality line), coordinates daily with Production Supervisor.
**ERP Access:** IQC queue only (own stage) — job cards awaiting IQC.

**Daily Tasks**
1. Login → "IQC Queue" → see job cards with material received (GRN done), awaiting inspection.
2. Open job card → run checklist for that process type → mandatory photo → mark Pass / Fail / Rework.
3. On Fail: add remark, notify Store Keeper for return/replacement coordination.

**Weekly Tasks:** Review own rejection rate trend.
**Monthly Tasks:** None additional.
**Exception Handling:** Material partially acceptable → split disposition is NOT available at IQC stage (whole-lot decision only); flag partial concerns in remarks for Store Manager follow-up with client.
**KPIs:** IQC turnaround time (arrival to inspection), rejection rate.
**Escalation Matrix:** Escalates disputed rejections to Plant Head.

---

## 6. FPA / IPQC Inspector

**Role Definition:** Approves the first-piece sample before bulk production (FPA), then performs in-process checks during the run (IPQC). Confirmed as one combined role in the RBAC matrix.
**Reports To:** Plant Head (quality line).
**ERP Access:** FPA approval queue + IPQC queue (own stage).

**Daily Tasks**
1. Login → "FPA Pending" queue → review submitted sample photo + spec reference + spectrophotometer reading → Approve or Reject with remark.
2. Login → "IPQC Queue" → for jobs currently in production, log periodic in-process checks with photo.
3. On any defect: select **"Rework Disposition"** (do NOT declare scrap); tag defect type (`dust_nibs`, `paint_run`, `orange_peel`, `scratch`, `undercoat_show`) and route parts to Rework Loop.
4. When a batch is complete: confirm quantity received from the 3 Painters' handovers before inspecting. When passing the batch forward to OQC, log the quantity handed over.

**Weekly / Monthly Tasks:** Review own FPA turnaround time and rework generation causes.
**Exception Handling:** FPA sample doesn't match client spec document → reject with specific reason, do not approve "close enough."
**KPIs:** FPA approval turnaround time, IPQC defect catch rate (defects routed to rework before reaching OQC).
**Escalation Matrix:** Unavailable for >2 hours → system auto-escalates to backup approver/Plant Head.

---

## 7. OQC / PDI Inspector

**Role Definition:** Final two quality gates — Outgoing QC after production, Pre-Dispatch Inspection as the last check before goods leave.
**Reports To:** Plant Head (quality line).
**ERP Access:** OQC queue + PDI queue + Rework Clearance Queue (own stage).

**Daily Tasks**
1. Before inspecting: confirm quantity received from the IPQC handover — mismatch requires a reason before OQC can start.
2. Login → "OQC Queue" → inspect completed production batches → Pass/Rework/Scrap with photo.
3. **Handling Rejections:**
   - Defective parts are tagged for **Rework** (sanding, touch-up, re-coat).
   - Use "Split Batch" to route passed pieces directly to "PDI Queue", while defective pieces spawn a **Rework Child Job Card (`JC-xxx-RW1`)**.
   - Inspect reworked parts once re-sprayed and cured; upon passing, merge them into the PDI batch.
4. Passed batches move to "PDI Queue" → final check before packing → Pass/Fail.
5. When handing the PDI-passed batch to Dispatch Coordinator for packing, log the quantity handed over — Dispatch Coordinator confirms on their end before generating the Packing Slip.

**Weekly Tasks:** Review rework recovery rate % and primary defect root causes.
**Exception Handling:** Client wants to witness PDI in person → check "Client-Witnessed" box, capture witness name.
**KPIs:** OQC/PDI throughput, Rework recovery validation rate, on-time PDI completion.
**Escalation Matrix:** Disputed PDI failure close to a hard client deadline → escalate to Plant Head immediately, not end of day.

---

## 8. Store Keeper

**Role Definition:** Front-line custodian of client material — the most legally sensitive daily task in the company (job-work liability).
**Reports To:** Store Manager.
**ERP Access:** GRN entry, material issue-to-production, Gate Pass linkage (view only).

**Daily Tasks**
1. On material arrival: login → "New GRN" → enter client, job card ref (or provisional if none yet), quantity, condition, mandatory photo.
2. When Supervisor requests material for a job: log "Issue to Production" with quantity — this creates a handover record. The Painter must confirm the quantity actually received before starting the job; if it doesn't match what you logged, a reason is required (mandatory) before the job can proceed.
3. Log any scrap/return with reason code.

**Weekly Tasks:** Reconcile received vs. issued vs. balance for all open job cards with Store Manager, including any handover variance flagged between Store and Painter.
**Exception Handling:** Material arrives damaged/short → photo it immediately, flag discrepancy, do not sign a clean GRN.
**KPIs:** GRN entry accuracy (zero unresolved reconciliation gaps), turnaround time from arrival to GRN logged.
**Escalation Matrix:** Discrepancies escalate to Store Manager same day.

---

## 9. Store Manager

**Role Definition:** Oversees material custody accuracy across all Store Keepers; owns client-facing material disputes.
**Reports To:** Plant Head.
**ERP Access:** Full Material Custody module, reconciliation reports.

**Daily Tasks:** Review GRN entries logged by Store Keepers for completeness; resolve any flagged discrepancies.
**Weekly Tasks:** Run reconciliation report (received/issued/scrap/returned) per client; escalate unresolved mismatches. Also review the handover variance report across all stages (Store→Painter→IPQC→OQC→PDI→Dispatch) — this is where recurring piece-loss patterns become visible stage by stage instead of as one unexplained shortfall at the end.
**Monthly Tasks:** Provide material custody summary to Plant Head for client review meetings.
**Exception Handling:** Client disputes a quantity → pull GRN photo + issue history as evidence.
**KPIs:** Reconciliation accuracy %, discrepancy resolution time.
**Escalation Matrix:** Client-facing disputes escalate to Plant Head with evidence pack ready.

---

## 10. Purchase Executive

**Role Definition:** Procures PaintKing-owned consumables (paint, hydrographic film, UV ink) — distinct from client-owned job-work material. Full module scoped for Phase 2 (Inventory).
**Reports To:** Plant Head / Accountant (procurement approval).
**ERP Access (Phase 2):** Consumables inventory, reorder alerts, vendor/PO records.

**Daily Tasks:** Monitor consumable stock levels; raise PO when below reorder threshold.
**Weekly Tasks:** Follow up on pending vendor deliveries.
**Monthly Tasks:** Reconcile consumable consumption vs. production volume (helps catch wastage/pilferage).
**Exception Handling:** Urgent stock-out risk → raise emergency PO, flag to Plant Head.
**KPIs:** Stock-out incidents, cost per unit trend.
**Escalation Matrix:** Budget-exceeding POs escalate to Plant Head/MD.

---

## 11. Dispatch Coordinator

**Role Definition:** Final outbound step — generates Packing Slip and coordinates physical dispatch.
**Reports To:** Plant Head.
**ERP Access:** Dispatch module (Packing Slip, FG Offer Report, Production Offering Report generation) for PDI-passed job cards only.

**Daily Tasks**
1. Login → "Ready for Dispatch" queue (auto-populated from PDI-passed job cards).
2. Confirm the quantity you received from the OQC/PDI Inspector's handover — if it doesn't match the PDI-passed count, log a reason before proceeding.
3. Generate Packing Slip → verify quantity matches PDI-passed count.
4. Generate FG Offer Report → coordinate with Store/Security for physical loading.
5. Confirm dispatch → job card auto-updates to "Dispatched."

**Weekly Tasks:** Review any dispatch delays against TAT targets.
**Exception Handling:** Packing Slip quantity doesn't match physical count at loading → stop, recheck PDI record before proceeding, do not manually override the quantity.
**KPIs:** On-time dispatch %, packing accuracy.
**Escalation Matrix:** Quantity mismatches escalate to OQC/PDI Inspector and Plant Head.

---

## 12. Security (Gate Pass)

**Role Definition:** Owns all physical material/vehicle movement logging — fully independent of production data as a cross-check.
**Reports To:** Plant Head (admin line).
**ERP Access:** Gate Pass module only.

**Daily Tasks**
1. On any vehicle/material movement (in or out): login → "New Gate Pass" → vehicle no., driver, material description, quantity, link to job card/GRN if applicable.
2. Log timestamp automatically on save.

**Weekly Tasks:** None additional.
**Exception Handling:** Material leaves for outside processing and will return → use "Out for Job Work" type, matched later against a "Return" entry.
**KPIs:** Zero unlogged movements (spot-checked against camera/manual logs during transition period).
**Escalation Matrix:** Any movement without proper documentation → hold and escalate to Plant Head before allowing exit.

---

## 13. Accountant

**Role Definition:** Handles day-to-day job-work invoicing and challans.
**Reports To:** Finance Manager (or Plant Head, if Finance Manager role isn't filled yet — confirm current org structure).
**ERP Access:** Invoicing/Challan module (Phase 1 basic version), full accounting (Phase 2).

**Daily Tasks**
1. Review dispatched job cards awaiting billing documents.
2. Generate delivery challan for material movement (no GST) and separate GST invoice for job-work service charge.
3. Verify SAC code and GST rate applied correctly.

**Weekly Tasks:** Reconcile generated challans/invoices against dispatch records.
**Monthly Tasks:** GST return data preparation (support, not full filing, in Phase 1).
**Exception Handling:** Any transaction where material value and service value are ambiguous → flag for CA review, do not guess.
**KPIs:** Invoicing turnaround time, zero compliance flags from CA review.
**Escalation Matrix:** Compliance ambiguity escalates to Finance Manager and external CA.

---

## 14. Finance Manager

**Role Definition:** Oversees accounting accuracy and compliance; Phase 2 role as full accounting module comes online.
**Reports To:** MD.
**ERP Access:** Full financial module (Phase 2), read access to job/dispatch data for reconciliation.

**Daily Tasks (Phase 2):** Review Accountant's entries; monitor cash flow.
**Weekly/Monthly Tasks:** Financial reporting to MD; GST filing oversight; vendor payment reconciliation.
**Exception Handling:** Client payment disputes tied to job-work documentation → pull full job card + challan + invoice trail.
**KPIs:** Days sales outstanding, compliance accuracy.
**Escalation Matrix:** Reports directly to MD; no intermediate escalation layer.

---

## 15. HR Executive

**Role Definition:** Day-to-day employee record-keeping and leave processing.
**Reports To:** HR Manager (or Plant Head if standalone).
**ERP Access:** Employee Management, Leave module.

**Daily Tasks:** Process new employee onboarding into system; handle leave requests needing HR input (beyond Supervisor approval, e.g., extended leave).
**Weekly Tasks:** Attendance/leave summary review.
**Monthly Tasks:** Headcount and attrition reporting.
**Exception Handling:** Employee role/department change → update in system, confirm RBAC role updated accordingly (coordinate with IT Admin).
**KPIs:** Onboarding turnaround time, leave processing accuracy.
**Escalation Matrix:** Policy exceptions escalate to HR Manager.

---

## 16. HR Manager

**Role Definition:** Oversees HR policy and escalated people matters. *(Confirm if this is a distinct filled position or if HR Executive reports directly to Plant Head/MD at current company size — common for an SME to not have both.)*
**Reports To:** MD.
**ERP Access:** Full Employee Management + Leave, reporting views.

**Daily/Weekly Tasks:** Oversight of HR Executive's work; handle escalated leave/attendance disputes.
**Monthly Tasks:** HR reporting to MD; policy review.
**Exception Handling:** Disciplinary matters — logged outside ERP scope (HR-sensitive), only attendance/role status reflected in system.
**KPIs:** Employee retention, policy compliance.
**Escalation Matrix:** Reports to MD.

---

## 17. IT Administrator

**Role Definition:** System administration — user accounts, role assignment, technical support for all other roles.
**Reports To:** MD/Plant Head.
**ERP Access:** Full system admin — user creation/deactivation, role assignment, system configuration. Not a data-entry role.

**Daily Tasks:** Monitor system uptime/errors; handle password reset and login issue requests.
**Weekly Tasks:** Review audit trail for any unusual access patterns.
**Monthly Tasks:** User access review (deactivate any accounts for departed employees — cross-check with HR).
**Exception Handling:** Suspected unauthorized access → lock account immediately, review audit log, report to MD.
**KPIs:** System uptime, ticket resolution time.
**Escalation Matrix:** Security incidents escalate directly to MD.

---

## 18. Maintenance Engineer

**Role Definition:** Upkeep of spray booths, conveyors, hydrographic dip tanks, UV printers, and injection moulding machines/moulds. Full module (mould register, maintenance schedule) is Phase 2 (FR-22).
**Reports To:** Plant Head.
**ERP Access (Phase 2):** Equipment/mould register, maintenance schedule and logs.

**Daily Tasks:** Log any equipment issue affecting production; check scheduled maintenance due list.
**Weekly Tasks:** Preventive maintenance per schedule.
**Monthly Tasks:** Equipment downtime report to Plant Head.
**Exception Handling:** Equipment failure mid-production → log immediately, notify Production Supervisor (job card may need to pause/reassign to another line).
**KPIs:** Unplanned downtime hours, preventive maintenance compliance %.
**Escalation Matrix:** Major equipment failure escalates to Plant Head immediately.

---

**Assumptions flagged for confirmation:**
1. Merged "Production Manager" into Plant Head, and "QC Manager" into the three QC Inspector roles reporting to Plant Head directly — confirm if a separate QC Manager layer actually exists.
2. Assumed HR Manager and Finance Manager may not be filled/distinct positions yet at current company size — SOPs written for both in case they are, but Phase 1 build can run with just HR Executive + Accountant if that's the real structure.
3. Purchase Executive and Maintenance Engineer SOPs reference Phase 2 modules (Inventory, Mould Register) since those aren't in Phase 1 scope — their Phase 1 involvement is minimal.

---
*Next: Document 4 — Database Schema (PostgreSQL), built directly from the modules and roles above.*
