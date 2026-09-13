-- Bizim Vinç ERP — Production security & operational RLS (idempotent)
-- Canonical sequence: migrations/0002 … 0010, then THIS file.
-- Goals:
--  1) REVOKE broad anon grants
--  2) RLS ON every business table with staff/founder policies (not policy-less DENY)
--  3) profiles/memberships scoped; audit_logs append-only
--  4) Keep authenticated staff able to run ERP modules (CRUD)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.is_founder_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(COALESCE(p.status::text, '')) IN ('aktif', 'active')
      AND lower(p.role::text) IN ('founder', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(COALESCE(p.status::text, '')) IN ('aktif', 'active')
      AND lower(p.role::text) IN (
        'founder', 'admin', 'yonetici', 'muhasebe', 'operasyon', 'operator', 'personel'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_founder_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', r.tbl);
  END LOOP;
  REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'anon revoke partial: %', SQLERRM;
END $$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', r.tbl);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'authenticated grant partial: %', SQLERRM;
END $$;

DO $$
DECLARE
  tbl text;
  pol record;
  tables text[] := ARRAY[
    'profiles', 'personnel', 'memberships', 'cranes', 'customers', 'sites',
    'job_receipts', 'invoices', 'collections', 'payments', 'approval_requests',
    'approvals', 'attendance_records', 'attendance', 'payroll_runs', 'payroll_items',
    'expenses', 'receipts', 'audit_logs', 'notifications', 'quotes', 'contracts',
    'leaves', 'overtimes', 'advances', 'puantaj', 'puantaj_locks', 'overtime_records',
    'number_sequences'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = tbl
          AND (
            policyname ILIKE '%authenticated%full%'
            OR policyname ILIKE '%authenticated_all%'
            OR policyname ILIKE '%allow authenticated%'
            OR policyname ILIKE '%_all'
            OR policyname = 'Allow authenticated full'
          )
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS profiles_self_or_admin_select ON public.profiles;
DROP POLICY IF EXISTS profiles_self_or_admin_update ON public.profiles;
DROP POLICY IF EXISTS profiles_self_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;

CREATE POLICY profiles_self_or_admin_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_founder_or_admin());

CREATE POLICY profiles_self_or_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_founder_or_admin())
  WITH CHECK (id = auth.uid() OR public.is_founder_or_admin());

CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_founder_or_admin());

DROP POLICY IF EXISTS memberships_self_or_admin ON public.memberships;
CREATE POLICY memberships_self_or_admin ON public.memberships
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_founder_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_founder_or_admin());

DO $$
DECLARE
  tbl text;
  ops text[] := ARRAY[
    'personnel', 'cranes', 'customers', 'sites',
    'job_receipts', 'invoices', 'collections', 'payments',
    'approval_requests', 'approvals', 'attendance_records', 'attendance',
    'payroll_runs', 'payroll_items', 'expenses', 'receipts',
    'quotes', 'contracts', 'leaves', 'overtimes', 'advances',
    'puantaj', 'puantaj_locks', 'overtime_records', 'notifications', 'number_sequences'
  ];
BEGIN
  FOREACH tbl IN ARRAY ops
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_staff_access', tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff())',
        tbl || '_staff_access', tbl
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
    DROP POLICY IF EXISTS audit_logs_staff_access ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
    CREATE POLICY audit_logs_select ON public.audit_logs
      FOR SELECT TO authenticated USING (public.is_active_staff());
    CREATE POLICY audit_logs_insert ON public.audit_logs
      FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION public.is_active_staff() IS 'Aktif personel/staff rolü — ERP modül CRUD için';
