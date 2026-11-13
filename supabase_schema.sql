-- PaintKing Operations OS (PK-OS) Supabase PostgreSQL Schema & Strict Auth RLS

-- =====================================================================
-- 0. PORTAL USERS & ROLE / MODULE / PLANT ACCESS CONTROL
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.pk_portal_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'OPERATOR',
  role_title TEXT NOT NULL DEFAULT 'Plant Staff',
  plant TEXT NOT NULL DEFAULT 'Haridwar', -- 'Haridwar' | 'Vasai' | 'Vapi' | 'Mumbai' | 'ALL'
  allowed_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pk_portal_users ENABLE ROW LEVEL SECURITY;

-- Explicit PostgreSQL Grants (Ensures API roles have access under RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Security helper functions (SECURITY DEFINER avoids recursive RLS evaluation)
CREATE OR REPLACE FUNCTION public.is_active_portal_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pk_portal_users
    WHERE id = auth.uid()
      AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pk_portal_users
    WHERE id = auth.uid()
      AND role = 'SUPER_ADMIN'
      AND is_active = TRUE
  );
$$;

-- RLS Policies for pk_portal_users
DROP POLICY IF EXISTS "Users can read own profile or super admin reads all" ON public.pk_portal_users;
CREATE POLICY "Users can read own profile or super admin reads all" ON public.pk_portal_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_super_admin());

DROP POLICY IF EXISTS "Only super admin can insert portal users" ON public.pk_portal_users;
CREATE POLICY "Only super admin can insert portal users" ON public.pk_portal_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Only super admin can update portal users" ON public.pk_portal_users;
CREATE POLICY "Only super admin can update portal users" ON public.pk_portal_users
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Only super admin can delete portal users" ON public.pk_portal_users;
CREATE POLICY "Only super admin can delete portal users" ON public.pk_portal_users
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- =====================================================================
-- 1. Key-Value Document Store (For offline-first state sync & fast recovery)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.pk_portal_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

ALTER TABLE public.pk_portal_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to pk_portal_state" ON public.pk_portal_state;
DROP POLICY IF EXISTS "Authenticated active users access pk_portal_state" ON public.pk_portal_state;
CREATE POLICY "Authenticated active users access pk_portal_state" ON public.pk_portal_state
  FOR ALL
  TO authenticated
  USING (public.is_active_portal_user())
  WITH CHECK (public.is_active_portal_user());

-- =====================================================================
-- 2. Job Cards Table (Relational index for production tracking)
-- =====================================================================
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
DROP POLICY IF EXISTS "Authenticated active users access pk_job_cards" ON public.pk_job_cards;
CREATE POLICY "Authenticated active users access pk_job_cards" ON public.pk_job_cards
  FOR ALL
  TO authenticated
  USING (public.is_active_portal_user())
  WITH CHECK (public.is_active_portal_user());

-- =====================================================================
-- 3. Quality Inspections (IQC, PIR, FPA, IPQC, OQC, PDI)
-- =====================================================================
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
DROP POLICY IF EXISTS "Authenticated active users access pk_quality_records" ON public.pk_quality_records;
CREATE POLICY "Authenticated active users access pk_quality_records" ON public.pk_quality_records
  FOR ALL
  TO authenticated
  USING (public.is_active_portal_user())
  WITH CHECK (public.is_active_portal_user());

-- =====================================================================
-- 4. Stores Inventory & GRN
-- =====================================================================
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
DROP POLICY IF EXISTS "Authenticated active users access pk_stores_records" ON public.pk_stores_records;
CREATE POLICY "Authenticated active users access pk_stores_records" ON public.pk_stores_records
  FOR ALL
  TO authenticated
  USING (public.is_active_portal_user())
  WITH CHECK (public.is_active_portal_user());

-- =====================================================================
-- 5. HR Employees & Biometric Face Descriptors
-- =====================================================================
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
DROP POLICY IF EXISTS "Authenticated active users access pk_employees" ON public.pk_employees;
CREATE POLICY "Authenticated active users access pk_employees" ON public.pk_employees
  FOR ALL
  TO authenticated
  USING (public.is_active_portal_user())
  WITH CHECK (public.is_active_portal_user());

-- =====================================================================
-- 6. HR Attendance Log
-- =====================================================================
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
DROP POLICY IF EXISTS "Authenticated active users access pk_attendance_logs" ON public.pk_attendance_logs;
CREATE POLICY "Authenticated active users access pk_attendance_logs" ON public.pk_attendance_logs
  FOR ALL
  TO authenticated
  USING (public.is_active_portal_user())
  WITH CHECK (public.is_active_portal_user());

-- =====================================================================
-- FINAL GRANTS & DEFAULT PERMISSIONS
-- =====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- =====================================================================
-- BOOTSTRAP FIRST SUPER ADMIN (Run AFTER creating admin@paintking.in in Supabase Auth)
-- =====================================================================
-- INSERT INTO public.pk_portal_users (id, email, full_name, role, role_title, plant, allowed_modules, is_active, created_by)
-- SELECT
--   id,
--   email,
--   'Super Admin',
--   'SUPER_ADMIN',
--   'System Super Admin & Root Controller',
--   'ALL',
--   '["dashboard","gatepass","stores","jobcards","painter_desk","handovers","qa","calibration","packing","billing","hr_leave","user_management"]'::jsonb,
--   TRUE,
--   'system-bootstrap'
-- FROM auth.users
-- WHERE email = 'admin@paintking.in'
-- ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN', plant = 'ALL', is_active = TRUE;
