-- Bizim Vinç ERP — RLS + kalıcılık garantisi (idempotent)
-- P0: Policy'siz RLS ON tablolarını kapat; authenticated full access (sonra sıkılaştırılabilir)

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
      AND lower(p.role::text) IN ('founder', 'admin')
      AND lower(COALESCE(p.status::text, 'aktif')) IN ('aktif', 'active')
  );
$$;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'profiles', 'personnel', 'memberships', 'cranes', 'customers', 'sites',
    'job_receipts', 'invoices', 'collections', 'payments', 'approval_requests',
    'approvals', 'attendance_records', 'attendance', 'payroll_runs', 'payroll_items',
    'expenses', 'receipts', 'audit_logs', 'notifications', 'quotes', 'contracts',
    'leaves', 'overtimes', 'advances', 'puantaj', 'puantaj_locks', 'overtime_records'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "authenticated_all" ON public.%I', tbl);
      EXECUTE format(
        'CREATE POLICY "authenticated_all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- Anon okuma yok; sadece authenticated
COMMENT ON FUNCTION public.is_founder_or_admin() IS 'Kurucu/admin + aktif profil kontrolü';
