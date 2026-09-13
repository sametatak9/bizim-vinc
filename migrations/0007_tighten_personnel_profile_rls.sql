-- Remove broad true policies; staff can access only their own personnel row,
-- while founder/admin retains management access.
DROP POLICY IF EXISTS personnel_all ON public.personnel;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY personnel_staff_access ON public.personnel
FOR ALL TO authenticated
USING (public.is_founder_or_admin() OR id = (SELECT personnel_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (public.is_founder_or_admin() OR id = (SELECT personnel_id FROM public.profiles WHERE id = auth.uid()));
