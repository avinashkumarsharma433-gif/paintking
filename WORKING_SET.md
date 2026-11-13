# WORKING SET

- 2026-11-13: Added Super Admin Plant Selector & Enforced Strict Plant Data Isolation Across All 9 ERP Modules
  - Files touched:
    - `src/portal/utils/portalAuth.ts`: Added `matchesPlant(itemPlant, activePlant)` supporting fuzzy plant matching and `'ALL'` plant aggregation.
    - `src/portal/context/PortalStoreContext.tsx`: Upgraded `activePlant` to `PlantLocation | 'ALL'` so Super Admin/Directors can switch between individual plants or view `'ALL'` plants consolidated. Creation handlers safely fallback to 'Haridwar' when 'ALL' is selected.
    - `src/portal/components/PortalHeader.tsx`, `src/portal/components/PortalSidebar.tsx`: Added plant scope selectors (`All Plants`, `Haridwar`, `Vasai`, `Vapi`, `Mumbai`) for authorized roles (`SUPER_ADMIN`, `DIRECTOR`) and locked badge for standard staff.
    - `src/portal/views/GatePassView.tsx`, `StoresView.tsx`, `JobCardsView.tsx`, `QAView.tsx`, `PackingView.tsx`, `BillingView.tsx`, `CustodyHandoverView.tsx`, `PainterWorkspaceView.tsx`, `DashboardView.tsx`, `PaintMixingView.tsx`, `ProductionOfferingView.tsx`, `Capa8DView.tsx`: Filtered all transactional records, summaries, priority orders, and requisitions by `matchesPlant(record.plant, activePlant)`.
  - Status: Verified with `npm run build` (production build succeeded in 8.31s with zero errors).

- 2026-11-13: Fixed Supabase Permission Denied by Granting Table Permissions to Authenticated Roles
  - Files touched:
    - `supabase_schema.sql`: Added explicit schema, table, sequence, and routine grants for `anon`, `authenticated`, and `service_role` with default privileges.
  - Status: Committed `06ac276` and pushed to `origin/main`.

- 2026-11-12: Implemented Supabase Authentication, `SUPER_ADMIN` Root Role, Plant Assignment & Module-Level Permissions
  - Files touched:
    - `supabase_schema.sql`: Added `pk_portal_users` table (`role`, `plant`, `allowed_modules`, `is_active`), `is_active_portal_user()` / `is_super_admin()` helper functions, and tightened RLS across all 6 ERP tables to `TO authenticated` active users only.
    - `supabase/functions/admin-users/index.ts`: Created secure Supabase Edge Function for `SUPER_ADMIN`-only staff `@paintking.in` account creation (`email_confirm: true`), module/plant updates, password resets, and deletion.
    - `src/portal/types/portalTypes.ts`, `src/portal/utils/portalAuth.ts`, `src/portal/lib/supabaseClient.ts`: Added `SUPER_ADMIN` role, `ERP_MODULE_CATALOG`, `ROLE_PRESETS`, `normalizePortalEmail`, `canAccessPortalTab`, and profile/admin API helpers.
    - `src/portal/views/PortalLoginView.tsx`, `src/portal/views/UserManagementView.tsx`: Built `@paintking.in` Login Gate and Super Admin User & Access Control console (create/edit accounts, assign plant, toggle exact ERP modules).
    - `src/portal/PortalApp.tsx`, `src/portal/components/PortalSidebar.tsx`, `src/portal/components/PortalHeader.tsx`, `src/portal/context/PortalStoreContext.tsx`: Replaced insecure role switcher with verified Supabase session auth, Change Password modal, Logout + cache wipe, plant lock enforcement, and `SUPER_ADMIN` privileges across `StoresView.tsx`, `BalanceReturnModal.tsx`, `FifoCompliancePanel.tsx`, and `IssueWizardModal.tsx`.
  - Status: Verified with `npm.cmd run lint` (`tsc --noEmit`, 0 errors) and `npm.cmd run build` (built in 8.92s).

- 2026-11-12: Purged All Demo Data (Local + Supabase) & Upgraded Full Cloud Hydration/Sync
  - Files touched:
    - `src/portal/data/mockInitialData.ts`: Emptied all 25 transactional demo arrays (`INITIAL_MATERIAL_INWARD`, `INITIAL_GRN_DATA`, `INITIAL_JOB_CARDS`, `INITIAL_IQC_RECORDS`, `INITIAL_FPA_RECORDS`, `INITIAL_IPQC_RECORDS`, `INITIAL_QUALITY_RELEASES`, `INITIAL_BILLING_INVOICES`, `INITIAL_GATE_PASSES`, `INITIAL_STOCK_BATCHES`, etc.) and reset `MASTER_DEFECTS` counts to `0`; kept system masters (`INITIAL_USER_PROFILES`, `INITIAL_PAINTING_BOOTHS`, `INITIAL_PAINTERS`, `INITIAL_CALIBRATION_RECORDS`, `INITIAL_MNC_AUDIT_QUESTIONS`).
    - `src/portal/lib/supabaseClient.ts`: Added `fetchAllRemoteState()` for single-request cloud hydration from `pk_portal_state`.
    - `src/portal/context/PortalStoreContext.tsx`: Added `PK_STORAGE_VERSION = '3.0.0-clean'` + `ensureCleanStorageVersion()` to purge stale browser demo cache before mount, guarded `persistRemoteState` with `isCloudHydratedRef` to prevent mount race overwrites, and connected all 30 state collections to Supabase sync.
    - `src/portal/views/StoresView.tsx`, `src/portal/views/QAView.tsx`, `src/portal/views/HRLeaveView.tsx`, `src/portal/views/PackingView.tsx`, `src/portal/views/DashboardView.tsx`, `src/portal/views/JobCardsView.tsx`, `src/portal/views/CustodyHandoverView.tsx`: Removed all remaining hardcoded demo metrics/fallbacks (0.0% / 0 pcs / Unassigned defaults on DashboardView, empty CustodyHandover form defaults, empty expandedMasterIds).
    - `src/portal/views/HRSuiteView.tsx`: Connected `pk_hr_employees` and `pk_hr_attendance_records` to Supabase hydration and live sync (`isHrCloudHydratedRef`).
  - Database cleaned: Truncated all rows across `pk_portal_state`, `pk_job_cards`, `pk_quality_records`, `pk_stores_records`, `pk_employees`, `pk_attendance_logs` (all verified 0 rows).
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (built in 8.00s).

- 2026-11-12: Integrated Supabase (PostgreSQL) Live Cloud Database & Offline-First Realtime Sync
  - Files touched:
    - `src/portal/lib/supabaseClient.ts`: Configured production Supabase client with offline fallback helpers `fetchRemoteState` and `persistRemoteState`.
    - `src/portal/context/PortalStoreContext.tsx`: Connected Job Cards, IQC, Stock Batches, Balance Returns, and Calibration records to background cloud synchronization with mount hydration.
    - `supabase_schema.sql`: Authored production DDL schema for 6 core tables with permissive factory terminal RLS policies.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds in 8.09s).

- 2026-11-11: Implemented Strict Role-Based Access Control (RBAC) across All Navigation Tabs & Sub-items
  - Files touched:
    - `src/portal/components/PortalSidebar.tsx`: Enforced strict role restrictions on top-level tabs and sub-items (Payroll, Employee Directory, Recognition Lab strictly restricted to Director/HR; Operator & Security limited to operational tabs).
    - `src/portal/PortalApp.tsx`: Synced `TAB_ALLOWED_ROLES` and route guards to automatically prevent unauthorized route access on persona switch.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds successfully in 8.22s).

- 2026-11-11: Integrated Equipment Calibration Master Directly into QA Dashboard & Redesigned UI
  - Files touched:
    - `src/portal/views/CalibrationView.tsx`: Redesigned according to PaintKing UI/UX guidelines (white luxury surface, 3 metric pill cards, responsive 4-column desktop table, mobile responsive cards, pill buttons, NABL certification modal).
    - `src/portal/views/QAView.tsx`: Added dedicated sub-tab "Gauges & Calibration Master" with real-time valid counter right alongside Gates 0-5 in the QA Hub.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds successfully in 8.08s).

- 2026-11-11: Streamlined Navigation by Removing Standalone Paint Mixing Lab Tab (Consolidated into FPA/QC Flow)
  - Files touched:
    - `src/portal/components/PortalSidebar.tsx`: Removed `paintmixing` from `PortalTab`, `TAB_LABELS`, and sidebar menu items.
    - `src/portal/PortalApp.tsx`: Removed `paintmixing` role permissions and view route.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds successfully in 8.38s).

- 2026-11-11: Decommissioned Redundant Standalone Production Offering Tab & Preserved PK-PRD-OFF-01 Auto-Generated PDF
  - Files touched:
    - `src/portal/components/PortalSidebar.tsx`: Removed `production_offering` from tab enum, `TAB_LABELS`, and main navigation list.
    - `src/portal/PortalApp.tsx`: Removed `production_offering` permissions and routing to prevent dead tabs.
    - `src/portal/utils/pdfStandardHeader.ts`: Implemented `downloadStandardProductionOfferingPdf` for official PK-PRD-OFF-01 / Appendix A.11 standard PDF with 4-tier authorization chain, 3-stage clearance audit, and quantity roll-up.
    - `src/portal/views/QAView.tsx`: Integrated one-click Offering Slip download in Pending OQC table/cards, Completed OQC register, and detailed OQC report modal.
    - `src/portal/views/JobCardsView.tsx` & `src/portal/components/JobCardModal.tsx`: Added one-click Offering Slip export when good finished pieces are logged.
    - `src/portal/components/OQCModal.tsx`: Added Offering Slip download button on OQC release.
  - Status: Verified with `npm.cmd run lint` (0 errors) and `npm.cmd run build` (builds successfully in 7.93s).

- 2026-11-10: Increased Face Detection Confidence to 0.50 & Required 3 Continuous Consecutive Frames for Punch
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts`: Increased SSD MobileNet face detection confidence threshold from 0.22 to 0.50 (`SsdMobilenetv1Options({ minConfidence: 0.50 })`) preventing background shadows/motion blur from triggering false face slots.
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx`: Set `requiredConsecutiveFrames = 3` (with localStorage auto-upgrade to >= 3), ensuring a genuine employee must match continuously across ~1.2s before attendance is punched.
  - Status: Verified with `npm.cmd run lint` (0 errors).

- 2026-11-10: Fixed Duplicate Employee ID Generation (PK-EMP-xxxx Collision) & Added Auto-Deduplication
  - Files touched:
    - `src/portal/views/HRSuiteView.tsx`: Changed ID generator from naive `employees.length + 101` to regex-based max number tracking `Math.max(...nums) + 1` preventing ID collisions when employees are added/removed. Added auto-healing sanitizer in `useState<Employee[]>` initializer to rename existing duplicate IDs in localStorage (`PK-EMP-0104`, etc.) so multiple employees never share the same ID.
  - Status: Verified with `npm.cmd run lint` (0 errors).

- 2026-11-10: Calibrated Expression Tolerance (Threshold <= 0.44) & Relaxed Margin Blocking Across Multi-Enrollments
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts`: Calibrated `maxAllowedDistance` up to 0.44 (master centroid gate +0.05). Relaxed multi-employee margin check (`bestDistance <= 0.40 || margin >= 0.02`), preventing the 2nd enrolled employee from being blocked as 'Unknown' when standing in camera.
    - `src/portal/modules/hr/HRAttendanceTerminal.tsx`: Calibrated default confidence threshold to 0.44 (presets Strict: 0.38, Normal: 0.44, Fast: 0.48), updated saved localStorage config to auto-upgrade to 0.44.
  - Status: Verified with `npm.cmd run lint` (0 errors).
