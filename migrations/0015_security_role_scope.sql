-- Phase 8: least-privilege RLS for personnel and payroll data.
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS personnel_staff_access ON public.personnel;
DROP POLICY IF EXISTS personnel_role_scoped ON public.personnel;
CREATE POLICY personnel_role_scoped ON public.personnel FOR SELECT TO authenticated USING (
  public.is_founder_or_admin()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
  OR id = (SELECT personnel_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY personnel_role_scoped_write ON public.personnel FOR ALL TO authenticated USING (
  public.is_founder_or_admin()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
) WITH CHECK (
  public.is_founder_or_admin()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payroll_runs_staff_access ON public.payroll_runs;
CREATE POLICY payroll_runs_finance_scope ON public.payroll_runs FOR SELECT TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
);
CREATE POLICY payroll_runs_finance_write ON public.payroll_runs FOR ALL TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
) WITH CHECK (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
);

ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payroll_items_staff_access ON public.payroll_items;
CREATE POLICY payroll_items_finance_scope ON public.payroll_items FOR SELECT TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
  OR personnel_id = (SELECT personnel_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY payroll_items_finance_write ON public.payroll_items FOR ALL TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
) WITH CHECK (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))
);
NOTIFY pgrst, 'reload schema';
