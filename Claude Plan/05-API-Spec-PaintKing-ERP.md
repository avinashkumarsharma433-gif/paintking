# PAINTKING ERP — API SPECIFICATION (OpenAPI 3.0)
**Document 5 of 8 | Version 1.0**

Conventions used throughout: JWT + refresh token auth, cursor-free offset pagination (`page`, `page_size`) suited to this data volume, consistent error envelope, and versioning via URL prefix (`/api/v1`). Full YAML below covers all Phase 1 endpoints; Phase 2 endpoints (consumables, moulds, CAPA, audit questionnaire) are listed as a stub section at the end so the spec doesn't need restructuring later.

```yaml
openapi: 3.0.3
info:
  title: PaintKing ERP API
  version: "1.0.0"
  description: >
    Job-work ERP for PaintKing Paints Pvt. Ltd. — Spray Painting, Hydrographic
    Printing, UV Digital Printing, Injection Moulding. Covers Job Card lifecycle,
    Material Custody, FPA, multi-stage QC, Dispatch, Gate Pass, GST job-work
    invoicing, and Employee/Leave management.
servers:
  - url: https://api.paintking.in/api/v1
    description: Production
  - url: https://staging-api.paintking.in/api/v1
    description: Staging

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  parameters:
    PageParam:
      name: page
      in: query
      schema: { type: integer, default: 1, minimum: 1 }
    PageSizeParam:
      name: page_size
      in: query
      schema: { type: integer, default: 25, maximum: 100 }

  schemas:
    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            code: { type: string, example: "VALIDATION_ERROR" }
            message: { type: string, example: "quantity_issued exceeds available balance" }
            details: { type: object, nullable: true }

    PaginationMeta:
      type: object
      properties:
        page: { type: integer }
        page_size: { type: integer }
        total_count: { type: integer }
        total_pages: { type: integer }

    Employee:
      type: object
      properties:
        id: { type: string, format: uuid }
        employee_code: { type: string }
        full_name: { type: string }
        role: { type: string, example: "Production Supervisor" }
        department: { type: string }
        shift: { type: string }
        status: { type: string, enum: [active, inactive] }

    JobCard:
      type: object
      properties:
        id: { type: string, format: uuid }
        job_card_number: { type: string, example: "JC-2026-000451" }
        client_id: { type: string, format: uuid }
        client_po_reference: { type: string }
        part_description: { type: string }
        quantity_ordered: { type: number, format: double }
        unit: { type: string }
        process_types:
          type: array
          items: { type: string, enum: [spray_painting, hydrographic_printing, uv_printing, injection_moulding] }
        material_source: { type: string, enum: [client_supplied, paintking_procured] }
        target_tat_at: { type: string, format: date-time }
        current_stage:
          type: string
          enum: [created, material_received, iqc, fpa_approved, in_production, ipqc, oqc, pdi, packed, dispatched, rejected_returned, cancelled]
        tat_status: { type: string, enum: [green, amber, red] }
        supervisor_id: { type: string, format: uuid }
        created_at: { type: string, format: date-time }

    JobCardCreateRequest:
      type: object
      required: [client_id, part_description, quantity_ordered, process_types, material_source, target_tat_at]
      properties:
        client_id: { type: string, format: uuid }
        client_po_reference: { type: string }
        part_description: { type: string }
        quantity_ordered: { type: number }
        unit: { type: string, default: "pcs" }
        process_types:
          type: array
          items: { type: string }
        material_source: { type: string, enum: [client_supplied, paintking_procured] }
        target_tat_at: { type: string, format: date-time }

    MaterialGRN:
      type: object
      properties:
        id: { type: string, format: uuid }
        grn_number: { type: string }
        job_card_id: { type: string, format: uuid, nullable: true }
        client_id: { type: string, format: uuid }
        item_description: { type: string }
        quantity_received: { type: number }
        unit: { type: string }
        condition_notes: { type: string }
        photo_url: { type: string, format: uri }
        is_provisional: { type: boolean }

    QCInspection:
      type: object
      properties:
        id: { type: string, format: uuid }
        job_card_id: { type: string, format: uuid }
        stage_type: { type: string, enum: [iqc, ipqc, oqc, pdi] }
        inspector_id: { type: string, format: uuid }
        checklist_responses: { type: object }
        disposition: { type: string, enum: [pass, fail, rework] }
        quantity_inspected: { type: number }
        quantity_passed: { type: number }
        photo_urls:
          type: array
          items: { type: string, format: uri }
        remark: { type: string }
        client_witnessed: { type: boolean }

    QCInspectionCreateRequest:
      type: object
      required: [job_card_id, stage_type, checklist_responses, disposition, photo_urls]
      properties:
        job_card_id: { type: string, format: uuid }
        stage_type: { type: string, enum: [iqc, ipqc, oqc, pdi] }
        checklist_responses: { type: object }
        disposition: { type: string, enum: [pass, fail, rework] }
        quantity_inspected: { type: number }
        quantity_passed: { type: number }
        photo_urls:
          type: array
          items: { type: string }
        remark: { type: string }
        client_witnessed: { type: boolean }
        client_witness_name: { type: string }

    FPAApproval:
      type: object
      properties:
        id: { type: string, format: uuid }
        job_card_id: { type: string, format: uuid }
        sample_photo_url: { type: string, format: uri }
        status: { type: string, enum: [pending, approved, rejected] }
        approval_remark: { type: string }

    JobCardHandover:
      type: object
      description: >
        Two-sided quantity confirmation at every stage-to-stage handover
        (Store→Painter→IPQC→OQC→PDI→Dispatch) — catches piece-loss at the
        exact link it happened rather than as one lump shortfall at dispatch.
      properties:
        id: { type: string, format: uuid }
        job_card_id: { type: string, format: uuid }
        from_stage: { type: string, enum: [store, painter, ipqc, oqc, pdi] }
        to_stage: { type: string, enum: [painter, ipqc, oqc, pdi, dispatch] }
        quantity_handed_over: { type: number }
        quantity_received: { type: number, nullable: true }
        variance: { type: number, nullable: true, description: "Set once confirmed; null while pending" }
        variance_reason: { type: string, enum: [damaged, miscount, rejected_not_logged, other], nullable: true }
        photo_url: { type: string, format: uri, nullable: true }
        confirmed_at: { type: string, format: date-time, nullable: true }

    GatePass:
      type: object
      properties:
        id: { type: string, format: uuid }
        gate_pass_number: { type: string }
        direction: { type: string, enum: [inbound, outbound] }
        movement_type:
          type: string
          enum: [job_card_dispatch, material_inward, out_for_job_work, return_from_job_work, general_goods, visitor_vehicle]
        vehicle_number: { type: string }
        driver_name: { type: string }
        material_description: { type: string }
        quantity: { type: number }

    PackingSlip:
      type: object
      properties:
        id: { type: string, format: uuid }
        packing_slip_number: { type: string }
        job_card_id: { type: string, format: uuid }
        quantity_packed: { type: number }
        pdi_inspection_id: { type: string, format: uuid }

    GSTInvoice:
      type: object
      properties:
        id: { type: string, format: uuid }
        invoice_number: { type: string }
        job_card_id: { type: string, format: uuid }
        sac_code: { type: string }
        service_charge: { type: number }
        consumables_value: { type: number }
        gst_rate: { type: number }
        gst_amount: { type: number }
        total_amount: { type: number }
        flagged_for_ca_review: { type: boolean }

    DeliveryChallan:
      type: object
      properties:
        id: { type: string, format: uuid }
        challan_number: { type: string }
        job_card_id: { type: string, format: uuid }
        material_description: { type: string }
        quantity: { type: number }

  responses:
    ValidationError:
      description: Request failed validation
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    Forbidden:
      description: Role does not have permission for this action
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }

paths:
  # ── AUTH ──────────────────────────────────────────────────────────
  /auth/login:
    post:
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [login_identifier, password]
              properties:
                login_identifier: { type: string }
                password: { type: string }
                otp: { type: string, nullable: true }
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token: { type: string }
                  refresh_token: { type: string }
                  employee: { $ref: '#/components/schemas/Employee' }
        '401':
          description: Invalid credentials or account locked
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }

  /auth/refresh:
    post:
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refresh_token]
              properties:
                refresh_token: { type: string }
      responses:
        '200':
          description: New access token issued
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token: { type: string }

  # ── JOB CARDS ─────────────────────────────────────────────────────
  /job-cards:
    get:
      tags: [Job Cards]
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
        - name: current_stage
          in: query
          schema: { type: string }
        - name: tat_status
          in: query
          schema: { type: string, enum: [green, amber, red] }
        - name: supervisor_id
          in: query
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: List of job cards (role-scoped — e.g. Painter sees only own assigned jobs)
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/JobCard' }
                  meta: { $ref: '#/components/schemas/PaginationMeta' }
    post:
      tags: [Job Cards]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/JobCardCreateRequest' }
      responses:
        '201':
          description: Job card created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/JobCard' }
        '400': { $ref: '#/components/responses/ValidationError' }
        '403': { $ref: '#/components/responses/Forbidden' }

  /job-cards/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    get:
      tags: [Job Cards]
      responses:
        '200':
          description: Job card detail with full stage history
          content:
            application/json:
              schema: { $ref: '#/components/schemas/JobCard' }
        '404': { $ref: '#/components/responses/NotFound' }

  /job-cards/{id}/transition:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    post:
      tags: [Job Cards]
      summary: Advance job card to next stage (server enforces gates — e.g. cannot enter in_production without passed IQC + approved FPA)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [to_stage]
              properties:
                to_stage: { type: string }
                remark: { type: string }
      responses:
        '200':
          description: Stage transitioned
          content:
            application/json:
              schema: { $ref: '#/components/schemas/JobCard' }
        '409':
          description: Stage gate not satisfied (e.g. IQC/FPA not yet passed/approved)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }

  /job-cards/{id}/amendments:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    post:
      tags: [Job Cards]
      summary: Quantity/TAT/process change requiring Supervisor + Plant Head co-approval
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amendment_type, new_value, reason]
              properties:
                amendment_type: { type: string, enum: [quantity_change, tat_change, process_change] }
                new_value: { type: object }
                reason: { type: string }
      responses:
        '201':
          description: Amendment recorded

  /job-cards/{id}/handovers:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    get:
      tags: [Job Cards]
      summary: List all handover records for a job card, in order — shows exactly where any quantity variance occurred
      responses:
        '200':
          description: List of handovers
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/JobCardHandover' }
    post:
      tags: [Job Cards]
      summary: Handing-over role logs quantity sent (e.g. Store Keeper issuing material to a Painter)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [from_stage, to_stage, quantity_handed_over]
              properties:
                from_stage: { type: string, enum: [store, painter, ipqc, oqc, pdi] }
                to_stage: { type: string, enum: [painter, ipqc, oqc, pdi, dispatch] }
                quantity_handed_over: { type: number }
                photo_url: { type: string, nullable: true }
      responses:
        '201':
          description: Handover created, awaiting receiving-side confirmation
          content:
            application/json:
              schema: { $ref: '#/components/schemas/JobCardHandover' }

  /job-cards/{id}/handovers/{handover_id}/confirm:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
      - name: handover_id
        in: path
        required: true
        schema: { type: string, format: uuid }
    post:
      tags: [Job Cards]
      summary: >
        Receiving role confirms quantity actually received. If it does not match
        quantity_handed_over, variance_reason is required — server rejects the
        confirmation without one. A variance beyond the configured threshold
        auto-escalates to Production Supervisor and Store Manager.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [quantity_received]
              properties:
                quantity_received: { type: number }
                variance_reason: { type: string, enum: [damaged, miscount, rejected_not_logged, other] }
      responses:
        '200':
          description: Handover confirmed
          content:
            application/json:
              schema: { $ref: '#/components/schemas/JobCardHandover' }
        '400':
  /job-cards/{id}/split-painters:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    post:
      tags: [Job Cards]
      summary: Split Master Job Card across 3 line painters into 3 dedicated Painter Child Job Cards (JC-xxx-P1, P2, P3)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [splits]
              properties:
                splits:
                  type: array
                  minItems: 3
                  maxItems: 3
                  items:
                    type: object
                    required: [assigned_painter_id, allocated_qty]
                    properties:
                      assigned_painter_id: { type: string, format: uuid }
                      allocated_qty: { type: number }
      responses:
        '201':
          description: Master Job Card split into 3 Painter Child Cards
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/JobCard' }
        '400':
          description: Total allocated quantity does not equal Master Job Card ordered quantity

  /job-cards/{id}/route-rework:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    post:
      tags: [Job Cards, QC]
      summary: Spawn a dedicated Rework Child Job Card (JC-xxx-RW1) for defective parts flagged in IPQC/OQC
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [qc_inspection_id, quantity_rework, defect_category]
              properties:
                qc_inspection_id: { type: string, format: uuid }
                quantity_rework: { type: number }
                defect_category: { type: string, enum: [dust_nibs, paint_run, orange_peel, scratch, undercoat_show, shade_deviation, other] }
                rework_instructions: { type: string }
      responses:
        '201':
          description: Rework Job Card created and routed to surface preparation/re-coat
          content:
            application/json:
              schema: { $ref: '#/components/schemas/JobCard' }

  /operations/day-end-closure:
    post:
      tags: [Operations]
      summary: Execute daily plant shutdown at evening for the single day-shift; logs overnight WIP and shuts down operations until morning
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [plant_id, closure_date, total_pieces_sprayed, total_rework_in_queue, overnight_wip_summary]
              properties:
                plant_id: { type: string, format: uuid }
                closure_date: { type: string, format: date }
                total_pieces_sprayed: { type: number }
                total_rework_in_queue: { type: number }
                overnight_wip_summary: { type: object }
                remarks: { type: string }
      responses:
        '201':
          description: Day-end closure recorded and daily shopfloor state frozen

  # ── MATERIAL CUSTODY ──────────────────────────────────────────────
  /material-grns:
    get:
      tags: [Material Custody]
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
      responses:
        '200':
          description: List of GRNs
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/MaterialGRN' }
    post:
      tags: [Material Custody]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [client_id, item_description, quantity_received, unit, photo_url]
              properties:
                job_card_id: { type: string, format: uuid, nullable: true }
                client_id: { type: string, format: uuid }
                item_description: { type: string }
                quantity_received: { type: number }
                unit: { type: string }
                condition_notes: { type: string }
                photo_url: { type: string }
                is_provisional: { type: boolean, default: false }
      responses:
        '201':
          description: GRN recorded
          content:
            application/json:
              schema: { $ref: '#/components/schemas/MaterialGRN' }

  /material-grns/{id}/transactions:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    post:
      tags: [Material Custody]
      summary: Issue to production / return / scrap — validated against reconciliation balance
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [transaction_type, quantity]
              properties:
                transaction_type: { type: string, enum: [issued_to_production, returned_to_client, scrapped] }
                quantity: { type: number }
                reason_code: { type: string }
                remark: { type: string }
      responses:
        '201':
          description: Transaction recorded
        '409':
          description: Quantity exceeds available balance (requires Store Manager override flag)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }

  /material-grns/{id}/reconciliation:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    get:
      tags: [Material Custody]
      summary: Received vs. issued vs. returned vs. scrapped vs. balance for this GRN
      responses:
        '200':
          description: Reconciliation figures

  # ── FPA ───────────────────────────────────────────────────────────
  /fpa-approvals:
    post:
      tags: [FPA]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [job_card_id, sample_photo_url]
              properties:
                job_card_id: { type: string, format: uuid }
                sample_photo_url: { type: string }
                spec_document_id: { type: string, format: uuid }
      responses:
        '201':
          description: FPA sample submitted, status = pending
          content:
            application/json:
              schema: { $ref: '#/components/schemas/FPAApproval' }

  /fpa-approvals/{id}/decision:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    post:
      tags: [FPA]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status: { type: string, enum: [approved, rejected] }
                approval_remark: { type: string }
      responses:
        '200':
          description: FPA decision recorded

  # ── QUALITY CONTROL ───────────────────────────────────────────────
  /qc-inspections:
    get:
      tags: [Quality Control]
      parameters:
        - name: job_card_id
          in: query
          schema: { type: string, format: uuid }
        - name: stage_type
          in: query
          schema: { type: string, enum: [iqc, ipqc, oqc, pdi] }
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
      responses:
        '200':
          description: List of QC inspections (role-scoped to own stage — e.g. IQC Inspector sees only iqc-stage queue)
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/QCInspection' }
    post:
      tags: [Quality Control]
      summary: Submit an inspection result. photo_urls is required and validated non-empty when disposition != pass.
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/QCInspectionCreateRequest' }
      responses:
        '201':
          description: Inspection recorded
          content:
            application/json:
              schema: { $ref: '#/components/schemas/QCInspection' }
        '400': { $ref: '#/components/responses/ValidationError' }

  /qc-checklist-templates:
    get:
      tags: [Quality Control]
      parameters:
        - name: process_type
          in: query
          schema: { type: string }
        - name: stage_type
          in: query
          schema: { type: string }
      responses:
        '200':
          description: Applicable checklist for a process/stage combination

  # ── DISPATCH ──────────────────────────────────────────────────────
  /packing-slips:
    post:
      tags: [Dispatch]
      summary: Generate from a PDI-passed job card only — server rejects if PDI not passed
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [job_card_id, pdi_inspection_id]
              properties:
                job_card_id: { type: string, format: uuid }
                pdi_inspection_id: { type: string, format: uuid }
      responses:
        '201':
          description: Packing slip generated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PackingSlip' }
        '409':
          description: PDI not passed for this job card
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }

  /fg-offer-reports:
    post:
      tags: [Dispatch]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [job_card_id, quantity_offered]
              properties:
                job_card_id: { type: string, format: uuid }
                quantity_offered: { type: number }
      responses:
        '201':
          description: FG Offer Report generated

  # ── GATE PASS ─────────────────────────────────────────────────────
  /gate-passes:
    get:
      tags: [Gate Pass]
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
        - name: direction
          in: query
          schema: { type: string, enum: [inbound, outbound] }
      responses:
        '200':
          description: List of gate pass entries
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/GatePass' }
    post:
      tags: [Gate Pass]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [direction, movement_type]
              properties:
                direction: { type: string, enum: [inbound, outbound] }
                movement_type: { type: string }
                job_card_id: { type: string, format: uuid, nullable: true }
                grn_id: { type: string, format: uuid, nullable: true }
                matched_gate_pass_id: { type: string, format: uuid, nullable: true }
                vehicle_number: { type: string }
                driver_name: { type: string }
                material_description: { type: string }
                quantity: { type: number }
      responses:
        '201':
          description: Gate pass logged
          content:
            application/json:
              schema: { $ref: '#/components/schemas/GatePass' }

  # ── INVOICING ─────────────────────────────────────────────────────
  /delivery-challans:
    post:
      tags: [Invoicing]
      summary: Material movement only — no GST fields, ownership does not transfer (Sec. 143)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [job_card_id, material_description, quantity]
              properties:
                job_card_id: { type: string, format: uuid }
                material_description: { type: string }
                quantity: { type: number }
      responses:
        '201':
          description: Challan generated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/DeliveryChallan' }

  /gst-invoices:
    post:
      tags: [Invoicing]
      summary: Job-work service charge invoice. System sets flagged_for_ca_review=true if consumables_value looks like it may include material value — Accountant must clear it, not silently blocked.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [job_card_id, sac_code, service_charge, gst_rate]
              properties:
                job_card_id: { type: string, format: uuid }
                challan_id: { type: string, format: uuid, nullable: true }
                sac_code: { type: string }
                service_charge: { type: number }
                consumables_value: { type: number, default: 0 }
                gst_rate: { type: number }
      responses:
        '201':
          description: Invoice generated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/GSTInvoice' }

  # ── EMPLOYEES & LEAVE ─────────────────────────────────────────────
  /employees:
    get:
      tags: [Employees]
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
        - name: status
          in: query
          schema: { type: string, enum: [active, inactive] }
      responses:
        '200':
          description: List of employees
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/Employee' }
    post:
      tags: [Employees]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [full_name, role_id]
              properties:
                full_name: { type: string }
                phone: { type: string }
                role_id: { type: string, format: uuid }
                department: { type: string }
                shift: { type: string }
      responses:
        '201':
          description: Employee created

  /leave-requests:
    post:
      tags: [Leave]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [leave_type, start_date, end_date]
              properties:
                leave_type: { type: string, enum: [casual, sick, earned, unpaid] }
                start_date: { type: string, format: date }
                end_date: { type: string, format: date }
                reason: { type: string }
      responses:
        '201':
          description: Leave request submitted

  /leave-requests/{id}/decision:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    post:
      tags: [Leave]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status: { type: string, enum: [approved, rejected] }
      responses:
        '200':
          description: Leave decision recorded

  # ── DASHBOARD ─────────────────────────────────────────────────────
  /dashboard/summary:
    get:
      tags: [Dashboard]
      summary: MD/Plant Head live view — WIP by process line, TAT breaches, QC rejection rate, daily production count
      responses:
        '200':
          description: Dashboard summary
          content:
            application/json:
              schema:
                type: object
                properties:
                  wip_by_process:
                    type: object
                    additionalProperties: { type: integer }
                  tat_breaches:
                    type: array
                    items: { $ref: '#/components/schemas/JobCard' }
                  qc_rejection_rate_by_stage:
                    type: object
                    additionalProperties: { type: number }
                  daily_production_count: { type: integer }

  # ── DOCUMENTS (13 digitized formats — PDF export) ────────────────
  /documents:
    get:
      tags: [Documents]
      summary: List documents — GRN, IQC/FPA/IPQC/OQC/PDI reports, Job Card, Packing Slip, FG Offer Report, Production Offering Report, Leave Format, Gate Pass, Client Spec Sheet
      parameters:
        - name: job_card_id
          in: query
          schema: { type: string, format: uuid }
        - name: document_type
          in: query
          schema: { type: string }
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
      responses:
        '200':
          description: List of documents (structured data, not the rendered PDF)

  /documents/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    get:
      tags: [Documents]
      summary: Structured record behind the document (the actual data — quantities, inspector, checklist responses, etc.)
      responses:
        '200':
          description: Structured document data
        '404': { $ref: '#/components/responses/NotFound' }

  /documents/{id}/pdf:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    get:
      tags: [Documents]
      summary: >
        Renders and returns a downloadable PDF of this document — same structured
        data as GET /documents/{id}, formatted to visually resemble the original
        paper format (FRD Module 7 edge case) so it's easy for clients/auditors used
        to the paper version. Every one of the 13 formats supports this endpoint —
        it's the same rendering path for all of them, keyed by document_type.
      responses:
        '200':
          description: PDF file
          content:
            application/pdf:
              schema: { type: string, format: binary }
        '404': { $ref: '#/components/responses/NotFound' }

  /documents/{id}/versions:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string, format: uuid }
    get:
      tags: [Documents]
      summary: Full version history of this document (who edited what, when)
      responses:
        '200':
          description: Version history

  # ── AUDIT ─────────────────────────────────────────────────────────
  /audit-logs:
    get:
      tags: [Audit]
      summary: Append-only change history — filterable by table and record
      parameters:
        - name: table_name
          in: query
          schema: { type: string }
        - name: record_id
          in: query
          schema: { type: string, format: uuid }
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
      responses:
        '200':
          description: Audit log entries

# ── WEBHOOKS (for notifications — e.g. FPA pending approval, IPQC fail alert) ──
webhooks:
  fpaSubmitted:
    post:
      summary: Fired when a new FPA sample is submitted, notifies the approver queue
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                job_card_id: { type: string, format: uuid }
                fpa_approval_id: { type: string, format: uuid }
      responses:
        '200': { description: Webhook acknowledged }

  qcFailed:
    post:
      summary: Fired on any fail/rework disposition, notifies Production Supervisor
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                job_card_id: { type: string, format: uuid }
                stage_type: { type: string }
                disposition: { type: string }
      responses:
        '200': { description: Webhook acknowledged }

  tatBreach:
    post:
      summary: Fired when a job card crosses into red TAT status, notifies Plant Head/MD
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                job_card_id: { type: string, format: uuid }
      responses:
        '200': { description: Webhook acknowledged }
```

---

## Rate Limiting & Versioning Notes

- **Rate limiting:** 300 requests/min per user token for standard roles; dashboard polling clients should use a longer interval (15–30s) rather than tight polling — a future websocket/SSE channel for the dashboard is a reasonable Phase 2 addition rather than Phase 1 scope.
- **Versioning:** `/api/v1` now; breaking changes get `/api/v2` — additive changes (new optional fields) never require a version bump.
- **Pagination:** Offset-based (`page`, `page_size`) is sufficient at this data volume (single plant, thousands not millions of job cards/year); switch to cursor-based only if data volume grows an order of magnitude.

---

## Phase 2 Endpoint Stubs (not detailed here — placeholders only)

- `/consumables`, `/consumables/{id}/reorder`
- `/moulds`, `/moulds/{id}/maintenance-log`
- `/capa-records`
- `/audit-questionnaire/sections`, `/audit-questionnaire/responses`
- `/customer-portal/job-status` (read-only, client-scoped token — separate auth flow from internal roles)

---
*Next: Document 6 — ISO Compliance Mapping, tied to the modules and audit trail already built above.*
