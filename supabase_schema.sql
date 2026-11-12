-- PaintKing Operations OS (PK-OS) Supabase PostgreSQL Schema

-- 1. Key-Value Document Store (For offline-first state sync & fast recovery)
CREATE TABLE IF NOT EXISTS public.pk_portal_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Enable RLS
ALTER TABLE public.pk_portal_state ENABLE ROW LEVEL SECURITY;

-- Permissive policy for authenticated and anon factory terminals
DROP POLICY IF EXISTS "Allow all access to pk_portal_state" ON public.pk_portal_state;
CREATE POLICY "Allow all access to pk_portal_state" ON public.pk_portal_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Job Cards Table (Relational index for production tracking)
CREATE TABLE IF NOT EXISTS public.pk_job_cards (
  id TEXT PRIMARY KEY,
  work_order_no TEXT NOT NULL,
  customer TEXT NOT NULL,
  part_code TEXT NOT NULL,
  part_name TEXT,
  target_qty INTEGER NOT NULL DEFAULT 0,
  stage_1_pass INTEGER DEFAULT 0,
  stage_1_rework INTEGER DEFAULT 0,
  stage_1_scrap INTEGER DEFAULT 0,
  stage_2_pass INTEGER DEFAULT 0,
  stage_2_rework INTEGER DEFAULT 0,
  stage_2_scrap INTEGER DEFAULT 0,
  stage_3_pass INTEGER DEFAULT 0,
  stage_3_rework INTEGER DEFAULT 0,
  stage_3_scrap INTEGER DEFAULT 0,
  final_good_qty INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'In Production',
  oqc_status TEXT DEFAULT 'Pending OQC',
  plant TEXT NOT NULL DEFAULT 'Vapi Unit #1',
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pk_job_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to pk_job_cards" ON public.pk_job_cards;
CREATE POLICY "Allow all access to pk_job_cards" ON public.pk_job_cards FOR ALL USING (true) WITH CHECK (true);

-- 3. Quality Inspections (IQC, PIR, FPA, IPQC, OQC, PDI)
CREATE TABLE IF NOT EXISTS public.pk_quality_records (
  id TEXT PRIMARY KEY,
  gate_type TEXT NOT NULL,
  ref_number TEXT,
  lot_number TEXT,
  part_code TEXT,
  customer TEXT,
  result TEXT NOT NULL DEFAULT 'Pass',
  inspected_by TEXT,
  delta_e NUMERIC(5,2),
  plant TEXT NOT NULL DEFAULT 'Vapi Unit #1',
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pk_quality_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to pk_quality_records" ON public.pk_quality_records;
CREATE POLICY "Allow all access to pk_quality_records" ON public.pk_quality_records FOR ALL USING (true) WITH CHECK (true);

-- 4. Stores Inventory & GRN
CREATE TABLE IF NOT EXISTS public.pk_stores_records (
  id TEXT PRIMARY KEY,
  grn_no TEXT,
  supplier TEXT,
  item_code TEXT,
  item_name TEXT,
  quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'Nos',
  batch_no TEXT,
  status TEXT DEFAULT 'Verified',
  plant TEXT NOT NULL DEFAULT 'Vapi Unit #1',
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pk_stores_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to pk_stores_records" ON public.pk_stores_records;
CREATE POLICY "Allow all access to pk_stores_records" ON public.pk_stores_records FOR ALL USING (true) WITH CHECK (true);

-- 5. HR Employees & Biometric Face Descriptors
CREATE TABLE IF NOT EXISTS public.pk_employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  plant TEXT NOT NULL DEFAULT 'Vapi Unit #1',
  face_descriptors JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pk_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to pk_employees" ON public.pk_employees;
CREATE POLICY "Allow all access to pk_employees" ON public.pk_employees FOR ALL USING (true) WITH CHECK (true);

-- 6. HR Attendance Log
CREATE TABLE IF NOT EXISTS public.pk_attendance_logs (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  punch_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  punch_date DATE DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'IN',
  confidence NUMERIC(5,2),
  plant TEXT NOT NULL DEFAULT 'Vapi Unit #1',
  snapshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pk_attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to pk_attendance_logs" ON public.pk_attendance_logs;
CREATE POLICY "Allow all access to pk_attendance_logs" ON public.pk_attendance_logs FOR ALL USING (true) WITH CHECK (true);
