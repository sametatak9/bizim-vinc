CREATE TABLE IF NOT EXISTS public.delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_no TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  site_name TEXT,
  crane_code TEXT,
  operator_name TEXT,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  from_location TEXT,
  to_location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS delivery_notes_manager_all ON public.delivery_notes;
CREATE POLICY delivery_notes_manager_all ON public.delivery_notes FOR ALL TO authenticated USING (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))) WITH CHECK (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe')));
CREATE INDEX IF NOT EXISTS delivery_notes_date_idx ON public.delivery_notes(delivery_date DESC);
