# RBAC Matrix — PaintKing PMS Admin Dashboard
## Role × Module × Permission mapping (companion to PRD v2)

*Built from the actual sign-off chains found on each paper format (Prepared By / Checked By / Verified By / Approved By) plus the role list in PRD Module A. Use this to configure login-based module visibility and action permissions.*

---

### 1. Roles (derived from actual form sign-off fields)

| Role | Found on these forms as | Notes |
|---|---|---|
| **Store Incharge** | GRN (Store Incharge sign), Job Card (Store Incharge sign) | Owns inward material + material issue to production |
| **Painter / Operator** | Job Card (Painter Name, W.No.), FPA (Painter acceptance), Packing Slip (Painter Name) | Shop-floor execution role, mobile-first |
| **Prod. Supervisor** | Job Card (Prod. Supervisor sign), Production Report (Checked By), FPA (Production Incharge acceptance), OQC (Production Incharge acceptance) | Floor-level production oversight |
| **Quality Engineer** | IQC, FPA, IPQC, OQC, PDI (Prepared By: Quality Engineer) | Runs all inspections, first point of QC data entry |
| **Manager QA** | FPA, OQC, PDI (Approved By: Manager QA) | Approves/overrides QC stage gates |
| **HR** | Leave Format (H.R. Sign) | Leave approvals only, isolated module |
| **Dept. Incharge** | Leave Format (Dept. Incharge Sign) | Departmental leave approval, cuts across floor roles |
| **Management / MD** | Production Report, GRN, Job Card (Approved By), Audit Questionnaire (Reviewed by) | Top-level visibility + final approvals; Gurprit Sir's role |
| **Security / Gate** | Gate Pass (Authorized Sign) | Structure TBD — placeholder role until Gate Pass format is finalized |
| **System Admin** | — (not on any paper form) | New role for the software itself: user management, role config, master data (customers, parts, defect codes) |

---

### 2. Module Visibility & Permissions Matrix

Legend: **V** = View, **C** = Create, **E** = Edit (before approval/lock), **A** = Approve/Sign-off, **—** = No access

| Module / Form | Store Incharge | Painter/Operator | Prod. Supervisor | Quality Engineer | Manager QA | HR | Dept. Incharge | Management/MD | System Admin |
|---|---|---|---|---|---|---|---|---|---|
| **GRN (inward)** | V,C,E | — | V | V,A (Ok By IQC field) | V | — | — | V,A (final approve) | V |
| **Job Card — Issue side** | V,C,E (issue material) | V (own cards only) | V,C,E | V | — | — | — | V | V |
| **Job Card — Return side** | V,A (return qty check) | V,E (own cards, return details) | V,A | V | — | — | — | V | V |
| **Gate Pass** | V | — | V | — | — | — | — | V,A | V,C,E |
| **Production Report** | — | V (own entries) | V,C,E | — | — | — | — | V,A | V |
| **Production Offering Report** | — | V,C (own), E | V,C,E,A (Checked By) | V,A (QA By) | V | — | — | V,A (Approved By) | V |
| **IQC Report** | V | — | V | V,C,E,A (Prepared By) | V | — | — | V | V |
| **FPA Report** | — | V,A (Painter acceptance only) | V,A (Prod. Incharge acceptance) | V,C,E,A (Prepared By) | V,A (Approved By) | — | — | V | V |
| **IPQC** | — | V (own shift) | V | V,C,E,A (Inspected By, both shifts) | V,A (Verified By) | — | — | V | V |
| **OQC Report** | — | — | V,A (Prod. Incharge acceptance) | V,C,E,A (Prepared By) | V,A (Approved By) | — | — | V | V |
| **PDI Report** | V (before dispatch) | — | V | V,C,E,A (Prepared By) | V,A (Approved By) | — | — | V | V |
| **FG Offer Report** | — | V,C (Checked By Prod.) | V,C,E,A (Checked By Prod.) | V,A (Verified By QC) | V | — | — | V | V |
| **Packing Slip** | — | V,C (Packed By) | V,A (Checked By) | V,A (Verified By) | V | — | — | V | V |
| **Leave Format** | V,C (own) | V,C (own) | — | — | — | V,A (H.R. Sign) | V,A (Dept. Incharge Sign) | V | V,C,E,A |
| **Audit Questionnaire (A–M)** | V (own section, e.g. B) | — | V (own section, e.g. E) | V,C,E (most sections: C,D,E,F,G,I,K,L) | V,A (review sign-off) | — | — | V,A (Reviewed by / final) | V |
| **CAPA / Rework-Scrap tickets** | V (if Store-linked) | V (if assigned rework) | V,E | V,C,E,A (root cause, corrective, preventive) | V,A | — | — | V | V |
| **Dashboards — floor-level (TAT, rejection %, efficiency)** | V (own dept) | V (own output) | V (own plant) | V (QC metrics) | V (QC metrics) | — | — | V (all) | V |
| **User & Role Management** | — | — | — | — | — | — | — | V | V,C,E,A |
| **Master Data (Customers, Parts, Defect Codes, SLA rules)** | V | — | V | V | V,E | — | — | V,E,A | V,C,E,A |

---

### 3. Approval Chain Logic (system-enforced, not just visual sign-off)

These are the chains the paper forms already imply — the system should **block progression** to the next stage until the required role signs off, not just display the field:

1. **GRN**: Store Incharge (create) → Quality/IQC (Ok By IQC qty) → Approver/MD (final approve) → material becomes available for Job Card issue.
2. **Job Card**: Store Incharge (issue) → Prod. Supervisor (approve issue) → Painter (executes) → Painter/Checking Person (return) → Prod. Supervisor (approve return) → variance reconciliation required if Issue Qty ≠ Return Ok + Rejection Qty.
3. **FPA (gate before production run)**: Quality Engineer (inspect) → Painter (acceptance) → Prod. Incharge (acceptance) → Manager QA (approve) → **only after this, Production Report / Job Card for that batch can log output.**
4. **IQC / IPQC / OQC / PDI**: Quality Engineer (Prepared By) → Manager QA (Approved By) — no batch/lot can move to the next stage (e.g. OQC-passed → Packing) without Manager QA approval.
5. **Rejection at any QC stage**: auto-creates CAPA ticket → Quality Engineer (root cause) → Manager QA (approve corrective/preventive action) → closed.
6. **Leave**: Employee (apply) → Dept. Incharge (approve) → HR (approve) → closed.
7. **Audit Questionnaire**: each section owner fills (Store Incharge for B, Quality Engineer for C/D/E/F/G/I/K/L, etc.) → Management/MD reviews and signs the "Reviewed by" field → locked for that audit cycle.

---

### 4. Open Questions to Finalize Before Dashboard Build

- Is **Quality Engineer** one person per shift, or is IQC/FPA/IPQC/OQC/PDI split across different QC staff? (affects whether you need sub-roles like "IQC Inspector" vs "Line QC" vs "Dispatch QC")
- Does **Prod. Supervisor** exist per-shift (A/B) like IPQC shows, meaning you need Shift A Supervisor / Shift B Supervisor as distinct logins?
- Who owns **Gate Pass** structure — Security guard role, or does Store Incharge double up on this?
- Should **Painter** see rejection %/efficiency for other painters (peer comparison) or only their own numbers?
- Does **Management/MD** need a single login (Gurprit Sir) or multiple management-tier logins (e.g. Plant Head vs MD) with different approval limits?
