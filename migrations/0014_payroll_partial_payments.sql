-- Phase 4: partial payroll payments and auditable balance tracking.
CREATE TABLE IF NOT EXISTS public.payroll_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_item_id UUID NOT NULL REFERENCES public.payroll_items(id) ON DELETE RESTRICT,
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE RESTRICT,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'banka' CHECK (payment_method IN ('banka', 'nakit')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payroll_payments_item_idx ON public.payroll_payments(payroll_item_id);
CREATE INDEX IF NOT EXISTS payroll_payments_person_idx ON public.payroll_payments(personnel_id);
ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payroll_payments_staff_read ON public.payroll_payments;
CREATE POLICY payroll_payments_staff_read ON public.payroll_payments FOR SELECT TO authenticated USING (public.is_active_staff());
DROP POLICY IF EXISTS payroll_payments_finance_write ON public.payroll_payments;
CREATE POLICY payroll_payments_finance_write ON public.payroll_payments FOR INSERT TO authenticated WITH CHECK (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('muhasebe', 'yonetici')));

ALTER TABLE public.personnel_documents ADD COLUMN IF NOT EXISTS retention_until DATE;

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'vakif_katilim_paket',
  external_id TEXT,
  transaction_date DATE,
  direction TEXT CHECK (direction IN ('inflow', 'outflow')),
  amount NUMERIC,
  currency TEXT NOT NULL DEFAULT 'TRY',
  description TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_id)
);
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bank_transactions_finance_read ON public.bank_transactions;
CREATE POLICY bank_transactions_finance_read ON public.bank_transactions FOR SELECT TO authenticated USING (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('muhasebe', 'yonetici')));
