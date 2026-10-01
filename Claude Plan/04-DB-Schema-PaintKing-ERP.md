# PAINTKING ERP — DATABASE SCHEMA (PostgreSQL 16)
**Document 4 of 8 | Version 1.0**

Built directly from Documents 2–3. Covers Phase 1 tables in full; Phase 2 tables (Inventory, Mould Register, full Accounting, CAPA/MNC Audit) are stubbed with column-level comments so the schema doesn't need a breaking migration later.

---

## 1. Conventions

- **Naming:** `snake_case`, singular table names avoided in favor of plural (`job_cards`, not `job_card`) — standard Postgres/Prisma convention.
- **Primary keys:** `id UUID DEFAULT gen_random_uuid()` everywhere — avoids sequential-ID guessing across a job-work system with external client visibility (customer portal, Phase 2).
- **Audit columns on every table:** `created_at`, `created_by`, `updated_at`, `updated_by` — non-negotiable per BRD NFR (auditability).
- **Soft delete:** No hard deletes anywhere (per FRD Module 13). Every table has `is_deleted BOOLEAN DEFAULT FALSE` + `deleted_at`, `deleted_by`. Application layer filters `WHERE is_deleted = FALSE` by default; nothing is ever physically removed.
- **Multi-tenancy:** Single plant today. Every table that would need partitioning for multi-plant (Phase 3) carries a `plant_id UUID` column now, defaulting to a single seeded plant row, so a future second plant is a data change, not a schema migration.
- **Data retention:** Minimum 5 years per audit-log records (GST + ISO norms), enforced at the application/backup layer, not by any auto-delete job — nothing in this schema self-purges.
- **Money:** `NUMERIC(12,2)`, never `FLOAT`, for anything GST/invoice-related.
- **Timestamps:** `TIMESTAMPTZ`, always UTC-stored, rendered in IST at the application layer.

---

## 2. Core: Users, Roles, Permissions, Audit Logs

```sql
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                  -- e.g. 'PaintKing Main Plant'
    address TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Seed one row for the current single plant. Phase 3 multi-plant just adds rows here.

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,           -- 'MD','Plant Head','Production Supervisor','IQC Inspector',
                                          -- 'FPA_IPQC Inspector','OQC_PDI Inspector','Painter','Store Keeper',
                                          -- 'Store Manager','Purchase Executive','Dispatch Coordinator',
                                          -- 'Security','Accountant','Finance Manager','HR Executive',
                                          -- 'HR Manager','IT Administrator','Maintenance Engineer'
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE only for MD role
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module TEXT NOT NULL,                -- 'job_card','material_custody','qc_iqc','qc_ipqc','qc_oqc_pdi',
                                          -- 'dispatch','gate_pass','invoicing','employee','leave','dms','dashboard'
    action TEXT NOT NULL,                -- 'view','create','update','approve','delete_soft'
    UNIQUE(module, action)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id),
    permission_id UUID NOT NULL REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id),
    employee_code TEXT NOT NULL UNIQUE,  -- e.g. 'PK-EMP-0042'
    full_name TEXT NOT NULL,
    phone TEXT,
    role_id UUID NOT NULL REFERENCES roles(id),
    secondary_role_id UUID REFERENCES roles(id),          -- temporary role coverage (FRD Module 1 edge case)
    secondary_role_expires_at TIMESTAMPTZ,
    department TEXT,                     -- 'Spray Painting','Hydrographic','UV Printing','Injection Moulding','Store','Dispatch','Security','Admin'
    shift TEXT NOT NULL DEFAULT 'general_day',            -- Confirmed Single General Day Shift (no night shift or shift rotation)
    date_of_joining DATE,
    status TEXT NOT NULL DEFAULT 'active',  -- 'active','inactive'
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES employees(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES employees(id)
);

CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL UNIQUE REFERENCES employees(id),
    login_identifier TEXT NOT NULL UNIQUE,   -- employee_code or phone
    password_hash TEXT NOT NULL,
    otp_enabled BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE for MD/Plant Head per NFR
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Captures daily evening plant shutdown and next morning opening
CREATE TABLE plant_day_end_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id),
    closure_date DATE NOT NULL,
    total_pieces_sprayed NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_rework_in_queue NUMERIC(12,2) NOT NULL DEFAULT 0,
    active_painters_count INT NOT NULL DEFAULT 3,
    overnight_wip_summary JSONB NOT NULL,              -- snapshot of open pieces held overnight in booths/holding racks
    closed_by UUID NOT NULL REFERENCES employees(id),  -- Supervisor / Plant Head
    closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reopened_by UUID REFERENCES employees(id),         -- Next morning opening supervisor
    reopened_at TIMESTAMPTZ,
    remarks TEXT
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,                -- 'create','update','approve','reject','soft_delete'
    performed_by UUID REFERENCES employees(id),
    before_state JSONB,
    after_state JSONB,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Append-only by convention: no UPDATE or DELETE grants on this table for any application role.
-- Comment: retain minimum 5 years (BRD NFR); back up separately from operational DB.
```

---

## 3. Clients & Job Cards (Master + 3-Painter Sub Cards + Rework Cards)

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gstin TEXT,                          -- client's GSTIN, required for job-work challan/invoice
    address TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id),
    job_card_number TEXT NOT NULL UNIQUE,   -- e.g. 'JC-2026-000451' (Master) or 'JC-2026-000451-P1' (Painter Sub) or 'JC-2026-000451-RW1' (Rework)
    job_card_type TEXT NOT NULL DEFAULT 'master' CHECK (job_card_type IN ('master', 'painter_child', 'rework_child')),
    client_id UUID NOT NULL REFERENCES clients(id),
    client_po_reference TEXT,
    part_description TEXT NOT NULL,
    quantity_ordered NUMERIC(12,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    process_types TEXT[] NOT NULL,       -- array: e.g. ARRAY['injection_moulding','spray_painting'] for multi-process jobs
    material_source TEXT NOT NULL,       -- 'client_supplied','paintking_procured'
    target_tat_at TIMESTAMPTZ NOT NULL,
    current_stage TEXT NOT NULL DEFAULT 'created',
        -- 'created','material_received','iqc','fpa_approved','in_production',
        -- 'ipqc','rework_in_progress','oqc','pdi','packed','dispatched','rejected_returned','cancelled'
    tat_status TEXT NOT NULL DEFAULT 'green',   -- 'green','amber','red' — recomputed by a scheduled job, not stored authoritatively
    supervisor_id UUID REFERENCES employees(id),
    assigned_painter_id UUID REFERENCES employees(id),  -- specifically assigned line painter (1 of 3 painters)
    parent_job_card_id UUID REFERENCES job_cards(id),  -- links Painter Sub-card or Rework Card to Master Job Card
    allocated_qty NUMERIC(12,2),                       -- quantity allocated to this specific painter
    sprayed_qty NUMERIC(12,2) DEFAULT 0,               -- actual pieces sprayed
    first_pass_good_qty NUMERIC(12,2) DEFAULT 0,       -- passed first-pass inspection
    rework_flagged_qty NUMERIC(12,2) DEFAULT 0,        -- pieces flagged for rework (sanding/re-coat)
    scrap_qty NUMERIC(12,2) DEFAULT 0,                 -- irrecoverable scrap after rework
    tat_override_by UUID REFERENCES employees(id),     -- Plant Head only, per FRD edge case
    tat_override_reason TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES employees(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES employees(id)
);
CREATE INDEX idx_job_cards_stage ON job_cards(current_stage) WHERE is_deleted = FALSE;
CREATE INDEX idx_job_cards_tat_status ON job_cards(tat_status) WHERE is_deleted = FALSE;
CREATE INDEX idx_job_cards_painter ON job_cards(assigned_painter_id) WHERE assigned_painter_id IS NOT NULL;
CREATE INDEX idx_job_cards_parent ON job_cards(parent_job_card_id) WHERE parent_job_card_id IS NOT NULL;

CREATE TABLE job_card_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    amendment_type TEXT NOT NULL,        -- 'quantity_change','tat_change','process_change'
    old_value JSONB,
    new_value JSONB,
    reason TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES employees(id),  -- Supervisor + Plant Head co-approval enforced at app layer
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_card_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    from_stage TEXT,
    to_stage TEXT NOT NULL,
    changed_by UUID REFERENCES employees(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    remark TEXT
);
-- This table is the source of truth for "unbroken stage record" acceptance criteria in FRD Module 3.

-- Added to solve the recurring piece-loss problem: two-sided quantity confirmation at every
-- stage-to-stage handover, so a shortfall is caught at the exact link it happened, not as one
-- unexplained lump total at dispatch. See FRD Module 3 for the full workflow.
CREATE TABLE job_card_handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    from_stage TEXT NOT NULL,            -- 'store','painter','ipqc','oqc','pdi'
    to_stage TEXT NOT NULL,              -- 'painter','ipqc','oqc','pdi','dispatch'
    handed_over_by UUID NOT NULL REFERENCES employees(id),
    quantity_handed_over NUMERIC(12,2) NOT NULL,
    handed_over_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_by UUID REFERENCES employees(id),
    quantity_received NUMERIC(12,2),
    confirmed_at TIMESTAMPTZ,
    variance NUMERIC(12,2),              -- computed at app layer as quantity_handed_over - quantity_received
                                          -- once confirmed; NULL while a handover is still pending confirmation
    variance_reason TEXT,                -- 'damaged','miscount','rejected_not_logged','other'
                                          -- mandatory at app layer whenever variance != 0
    photo_url TEXT,                      -- optional: tray/bin count photo at physical handover point
    escalated_at TIMESTAMPTZ,            -- set when variance exceeds the configurable threshold (e.g. >2% of batch)
    escalated_to UUID REFERENCES employees(id)   -- Production Supervisor / Store Manager
);
CREATE INDEX idx_handovers_job_card ON job_card_handovers(job_card_id);
CREATE INDEX idx_handovers_pending ON job_card_handovers(job_card_id) WHERE confirmed_at IS NULL;

CREATE VIEW handover_variance_report AS
SELECT
    h.job_card_id,
    j.job_card_number,
    h.from_stage,
    h.to_stage,
    h.quantity_handed_over,
    h.quantity_received,
    h.variance,
    h.variance_reason,
    h.handed_over_at,
    h.confirmed_at
FROM job_card_handovers h
JOIN job_cards j ON j.id = h.job_card_id
WHERE h.variance IS NOT NULL AND h.variance <> 0;
-- This view is exactly what Store Manager's weekly variance review (Document 3) runs against.
```

---

## 4. Material Custody (GRN)

```sql
CREATE TABLE material_grns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_number TEXT NOT NULL UNIQUE,
    job_card_id UUID REFERENCES job_cards(id),   -- nullable: provisional GRN edge case (FRD Module 4)
    client_id UUID NOT NULL REFERENCES clients(id),
    item_description TEXT NOT NULL,
    quantity_received NUMERIC(12,2) NOT NULL,
    unit TEXT NOT NULL,
    condition_notes TEXT,
    photo_url TEXT NOT NULL,             -- mandatory per FRD
    received_by UUID NOT NULL REFERENCES employees(id),
    is_provisional BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE material_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES material_grns(id),
    transaction_type TEXT NOT NULL,      -- 'issued_to_production','returned_to_client','scrapped'
    quantity NUMERIC(12,2) NOT NULL,
    reason_code TEXT,                    -- for scrap: 'process_loss','damaged_on_arrival','rejected_at_iqc'
    remark TEXT,
    recorded_by UUID NOT NULL REFERENCES employees(id),
    override_by UUID REFERENCES employees(id),  -- Store Manager override when balance mismatch (FRD validation)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Reconciliation check (received - issued - scrapped - returned = balance) is a computed VIEW, not a stored column:

CREATE VIEW material_reconciliation AS
SELECT
    g.id AS grn_id,
    g.quantity_received,
    COALESCE(SUM(t.quantity) FILTER (WHERE t.transaction_type = 'issued_to_production'), 0) AS issued,
    COALESCE(SUM(t.quantity) FILTER (WHERE t.transaction_type = 'returned_to_client'), 0) AS returned,
    COALESCE(SUM(t.quantity) FILTER (WHERE t.transaction_type = 'scrapped'), 0) AS scrapped,
    g.quantity_received
        - COALESCE(SUM(t.quantity) FILTER (WHERE t.transaction_type = 'issued_to_production'), 0)
        - COALESCE(SUM(t.quantity) FILTER (WHERE t.transaction_type = 'returned_to_client'), 0)
        - COALESCE(SUM(t.quantity) FILTER (WHERE t.transaction_type = 'scrapped'), 0) AS balance
FROM material_grns g
LEFT JOIN material_transactions t ON t.grn_id = g.id
GROUP BY g.id, g.quantity_received;
```

---

## 5. FPA & Quality Control (IQC / IPQC / OQC / PDI)

```sql
CREATE TABLE fpa_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    submitted_by UUID NOT NULL REFERENCES employees(id),
    sample_photo_url TEXT NOT NULL,
    spec_document_id UUID,               -- FK to documents(id), see Section 6
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending','approved','rejected'
    approved_by UUID REFERENCES employees(id),
    approval_remark TEXT,
    escalated_to UUID REFERENCES employees(id),  -- backup approver, SLA breach (FRD edge case)
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at TIMESTAMPTZ
);

-- One shared table for all four QC stages, differentiated by stage_type — avoids four near-identical tables.
CREATE TABLE qc_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    stage_type TEXT NOT NULL,            -- 'iqc','ipqc','oqc','pdi'
    inspector_id UUID NOT NULL REFERENCES employees(id),
    checklist_template_id UUID,          -- FK to qc_checklist_templates(id) below
    checklist_responses JSONB NOT NULL,  -- {"check_1": "pass", "check_2": "fail", ...}
    disposition TEXT NOT NULL,           -- 'pass','rework','scrap' (rework is prioritized over scrap)
    quantity_inspected NUMERIC(12,2),
    quantity_passed NUMERIC(12,2) DEFAULT 0,       -- supports partial-pass split (FRD Module 6/OQC edge case)
    quantity_rework NUMERIC(12,2) DEFAULT 0,       -- pieces flagged for rework (sanding/touch-up/re-coat)
    quantity_scrapped NUMERIC(12,2) DEFAULT 0,     -- unsalvageable scrap
    defect_category TEXT,                          -- 'dust_nibs','paint_run','orange_peel','scratch','undercoat_show','shade_deviation','none'
    rework_job_card_id UUID REFERENCES job_cards(id), -- linked child rework job card spawned on defect
    photo_urls TEXT[] NOT NULL,          -- mandatory, enforced non-empty at app layer when disposition != 'pass'
    remark TEXT,
    client_witnessed BOOLEAN NOT NULL DEFAULT FALSE,
    client_witness_name TEXT,
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qc_job_stage ON qc_inspections(job_card_id, stage_type);
CREATE INDEX idx_qc_rework_job ON qc_inspections(rework_job_card_id) WHERE rework_job_card_id IS NOT NULL;

CREATE TABLE qc_checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_type TEXT NOT NULL,          -- 'spray_painting','hydrographic_printing','uv_printing','injection_moulding'
    stage_type TEXT NOT NULL,            -- 'iqc','ipqc','oqc','pdi'
    checklist_items JSONB NOT NULL,      -- ["Surface cleanliness","Color match to spec","No orange peel", ...]
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5a. Material Consumption Tracking (Paint / Consumables — Phase 1)

```sql
-- Distinct from material_grns/material_transactions (Section 4), which track CLIENT-OWNED
-- material. This tracks PAINTKING-OWNED consumables (paint, hydrographic film, UV ink).
CREATE TABLE consumables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                  -- e.g. 'Red Oxide Primer','PU Top Coat - RAL 9010','Hydrographic Film - Carbon'
    unit TEXT NOT NULL,                  -- 'liters','kg','meters'
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
    reorder_threshold NUMERIC(12,2),     -- Phase 1 stores this; automated reorder alerts remain Phase 2
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE standard_consumption_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_type TEXT NOT NULL,          -- 'spray_painting','hydrographic_printing','uv_printing'
    part_category TEXT,                  -- optional finer grain, e.g. 'small_bracket','panel'
    consumable_id UUID NOT NULL REFERENCES consumables(id),
    standard_rate_per_piece NUMERIC(12,4) NOT NULL,   -- e.g. 0.015 (liters/piece)
    set_by UUID REFERENCES employees(id),             -- Plant Head, per FRD Module 4a
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE material_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    consumable_id UUID NOT NULL REFERENCES consumables(id),
    issue_type TEXT NOT NULL CHECK (issue_type IN ('original','rework')),  -- mandatory, never inferred
    quantity_issued NUMERIC(12,3) NOT NULL,
    quantity_used NUMERIC(12,3),         -- filled in once Painter reports actual usage
    quantity_returned NUMERIC(12,3),     -- unused, returned to store
    issued_by UUID NOT NULL REFERENCES employees(id),    -- Store Keeper
    issued_to UUID NOT NULL REFERENCES employees(id),    -- Painter
    variance_reason TEXT,                -- required at app layer if issued != used + returned
    is_flagged_abnormal BOOLEAN NOT NULL DEFAULT FALSE,  -- set when actual consumption exceeds
                                                          -- standard_consumption_rates significantly
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reported_at TIMESTAMPTZ
);
CREATE INDEX idx_material_issues_job_card ON material_issues(job_card_id);
CREATE INDEX idx_material_issues_type ON material_issues(job_card_id, issue_type);
-- Rework entries are simply additional rows with issue_type = 'rework' referencing the same
-- job_card_id — a job card's full consumption history (original vs. every rework attempt)
-- is just `SELECT * FROM material_issues WHERE job_card_id = ... ORDER BY issued_at`.
```



```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL,
        -- 'production_report','job_card_pdf','grn_copy','iqc_report','fpa_report','ipqc_report',
        -- 'oqc_report','pdi_report','packing_slip','fg_offer_report','production_offering_report',
        -- 'leave_format','gate_pass','client_spec_sheet'
    job_card_id UUID REFERENCES job_cards(id),
    employee_id UUID REFERENCES employees(id),   -- for leave_format
    file_url TEXT,                        -- rendered PDF export
    structured_data JSONB NOT NULL,       -- the actual structured record backing the PDF
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES employees(id)
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    version INT NOT NULL,
    structured_data JSONB NOT NULL,
    changed_by UUID REFERENCES employees(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7. Dispatch

```sql
CREATE TABLE packing_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    packing_slip_number TEXT NOT NULL UNIQUE,
    quantity_packed NUMERIC(12,2) NOT NULL,   -- must equal linked PDI quantity_passed, validated at app layer
    pdi_inspection_id UUID NOT NULL REFERENCES qc_inspections(id),
    generated_by UUID NOT NULL REFERENCES employees(id),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fg_offer_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    quantity_offered NUMERIC(12,2) NOT NULL,
    generated_by UUID NOT NULL REFERENCES employees(id),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE production_offering_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    details JSONB NOT NULL,
    generated_by UUID NOT NULL REFERENCES employees(id),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8. Gate Pass

```sql
CREATE TABLE gate_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_pass_number TEXT NOT NULL UNIQUE,
    direction TEXT NOT NULL,             -- 'inbound','outbound'
    movement_type TEXT NOT NULL,         -- 'job_card_dispatch','material_inward','out_for_job_work','return_from_job_work','general_goods','visitor_vehicle'
    job_card_id UUID REFERENCES job_cards(id),
    grn_id UUID REFERENCES material_grns(id),
    matched_gate_pass_id UUID REFERENCES gate_passes(id),  -- pairs an 'out_for_job_work' with its 'return' entry
    vehicle_number TEXT,
    driver_name TEXT,
    material_description TEXT,
    quantity NUMERIC(12,2),
    logged_by UUID NOT NULL REFERENCES employees(id),   -- Security role, enforced at app layer
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 9. GST Job-Work Invoicing

```sql
CREATE TABLE delivery_challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_number TEXT NOT NULL UNIQUE,
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    material_description TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    -- No GST fields here by design: challan covers material movement only, ownership doesn't transfer (Sec. 143)
    generated_by UUID NOT NULL REFERENCES employees(id),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gst_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    job_card_id UUID NOT NULL REFERENCES job_cards(id),
    challan_id UUID REFERENCES delivery_challans(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    sac_code TEXT NOT NULL,              -- job-work service SAC code
    service_charge NUMERIC(12,2) NOT NULL,     -- job-work labor/service value only
    consumables_value NUMERIC(12,2) DEFAULT 0, -- PaintKing-procured paint/film/ink itemized separately (FRD edge case)
    gst_rate NUMERIC(5,2) NOT NULL,
    gst_amount NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    flagged_for_ca_review BOOLEAN NOT NULL DEFAULT FALSE,   -- material/service ambiguity flag, not hard-blocked
    generated_by UUID NOT NULL REFERENCES employees(id),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10. Leave Management

```sql
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_type TEXT NOT NULL,            -- 'casual','sick','earned','unpaid'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending','approved','rejected'
    approved_by UUID REFERENCES employees(id),
    hr_reviewed_by UUID REFERENCES employees(id),   -- for extended leave requiring HR input
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 11. Phase 2 Stub Tables (schema-compatible now, populated later)

```sql
-- Consumables inventory itself (paint, hydrographic film, UV ink) moved to Phase 1 —
-- see Section 5a. Only the fuller reorder/vendor layer stays Phase 2:
CREATE TABLE consumable_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumable_id UUID NOT NULL REFERENCES consumables(id),
    vendor_name TEXT NOT NULL,
    last_purchase_rate NUMERIC(12,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mould/tooling register — FR-22
CREATE TABLE moulds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mould_code TEXT NOT NULL UNIQUE,
    client_id UUID REFERENCES clients(id),   -- moulds are often client-owned too, same custody logic as material
    description TEXT,
    last_maintenance_at TIMESTAMPTZ,
    next_maintenance_due_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',   -- 'active','under_maintenance','retired'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CAPA (Corrective/Preventive Action) — FR-20
CREATE TABLE capa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,           -- 'qc_rejection','audit_finding'
    source_id UUID NOT NULL,             -- polymorphic reference to qc_inspections.id or audit_findings.id
    description TEXT NOT NULL,
    corrective_action TEXT,
    preventive_action TEXT,
    owner_id UUID REFERENCES employees(id),
    status TEXT NOT NULL DEFAULT 'open', -- 'open','in_progress','closed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ
);

-- MNC Audit Questionnaire (13 sections, ~100 questions, bilingual) — FR-19
CREATE TABLE audit_questionnaire_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code TEXT NOT NULL,          -- 'A' through 'M'
    section_title_en TEXT NOT NULL,
    section_title_hi TEXT
);

CREATE TABLE audit_questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES audit_questionnaire_sections(id),
    question_text_en TEXT NOT NULL,
    question_text_hi TEXT,
    response TEXT,
    evidence_document_id UUID REFERENCES documents(id),
    answered_by UUID REFERENCES employees(id),
    answered_at TIMESTAMPTZ
);
```

---

## 12. ER Diagram (text-based, Phase 1 core)

```
plants ──< employees ──< user_accounts
   │            │
   │            └──< job_cards (supervisor_id)
   │
   └──< job_cards
              │
              ├──< job_card_amendments
              ├──< job_card_stage_history
              ├──< job_card_handovers (Store→Painter→IPQC→OQC→PDI→Dispatch, piece-loss tracking)
              ├──< material_grns ──< material_transactions
              ├──< fpa_approvals
              ├──< qc_inspections >── qc_checklist_templates
              ├──< documents
              ├──< packing_slips ──> qc_inspections (pdi)
              ├──< fg_offer_reports
              ├──< production_offering_reports
              ├──< delivery_challans ──< gst_invoices
              └──< gate_passes (also standalone, non-job-card movements)

clients ──< job_cards
clients ──< material_grns
clients ──< delivery_challans / gst_invoices

roles ──< role_permissions >── permissions
roles ──< employees

audit_logs: independent, references every table's record_id polymorphically (no FK constraint, by design —
            must survive even if the source record is later restructured)
```

---

**Assumptions flagged for confirmation:**
1. `qc_inspections` uses one shared table across all four QC stages (rather than four separate tables) — simpler schema, but confirm the dev team is comfortable with this pattern before build starts.
2. `job_card_number` and other business-facing IDs are app-generated sequential-looking strings, not exposed database UUIDs — needed if a customer portal (Phase 2) ever surfaces these to clients.
3. Multi-plant `plant_id` columns are included now but unused (single row) until Phase 3 — confirm this forward-compatibility is wanted vs. simplifying further for Phase 1 only.

---
*Next: Document 5 — API Specification (OpenAPI 3.0), covering endpoints for every table above.*
