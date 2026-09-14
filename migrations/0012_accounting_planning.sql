-- Accounting planning foundation: bank/cash accounts, imported bank movements and explicit plan records.
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  iban TEXT,
  account_type TEXT NOT NULL DEFAULT 'bank' CHECK (account_type IN ('bank','cash')),
  currency TEXT NOT NULL DEFAULT 'TRY',
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  provider TEXT,
  external_account_id TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  external_transaction_id TEXT,
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT NOT NULL DEFAULT '',
  counterparty TEXT,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC,
  currency TEXT NOT NULL DEFAULT 'TRY',
  source TEXT NOT NULL DEFAULT 'manual',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  matched_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  matched_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bank_account_id, external_transaction_id)
);

CREATE TABLE IF NOT EXISTS public.payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('collection','payment')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  counterparty_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bank_transactions_account_date_idx ON public.bank_transactions(bank_account_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS payment_plans_due_idx ON public.payment_plans(plan_type, due_date, status);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bank_accounts_staff_access ON public.bank_accounts;
DROP POLICY IF EXISTS bank_transactions_staff_access ON public.bank_transactions;
DROP POLICY IF EXISTS payment_plans_staff_access ON public.payment_plans;
CREATE POLICY bank_accounts_staff_access ON public.bank_accounts FOR ALL TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe'))
) WITH CHECK (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe'))
);
CREATE POLICY bank_transactions_staff_access ON public.bank_transactions FOR ALL TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe'))
) WITH CHECK (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe'))
);
CREATE POLICY payment_plans_staff_access ON public.payment_plans FOR ALL TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe'))
) WITH CHECK (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe'))
);
