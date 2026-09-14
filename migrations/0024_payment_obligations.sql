-- Recurring payment obligations and monthly installment planning.
CREATE TABLE IF NOT EXISTS public.payment_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('leasing','kredi','kredi_karti','petrol_dbs','kdv_vergi','elektrik_su','yakit','bakim','kira','diger')),
  recipient_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  installment_count INTEGER NOT NULL DEFAULT 1 CHECK (installment_count >= 1),
  payment_day INTEGER NOT NULL CHECK (payment_day BETWEEN 1 AND 31),
  start_month DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','tamamlandi','iptal')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS obligation_id UUID REFERENCES public.payment_obligations(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS installment_no INTEGER;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS installment_count INTEGER;
CREATE INDEX IF NOT EXISTS payments_obligation_idx ON public.payments(obligation_id);
ALTER TABLE public.payment_obligations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_obligations_manager_all ON public.payment_obligations;
CREATE POLICY payment_obligations_manager_all ON public.payment_obligations FOR ALL TO authenticated USING (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'))) WITH CHECK (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe')));
