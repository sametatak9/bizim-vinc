-- Phase 14: complete canonical notification and audit infrastructure.
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID, user_name TEXT NOT NULL,
  user_role TEXT, action TEXT NOT NULL, module TEXT NOT NULL, record_id TEXT,
  details TEXT, old_data JSONB, new_data JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID, title TEXT NOT NULL,
  message TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  is_read BOOLEAN DEFAULT FALSE, related_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_founder_or_admin());
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_founder_or_admin());
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid() OR public.is_founder_or_admin());
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid() OR public.is_founder_or_admin());
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_founder_or_admin()) WITH CHECK (user_id = auth.uid() OR public.is_founder_or_admin());
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
