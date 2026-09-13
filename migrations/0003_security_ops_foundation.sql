-- Bizim Vinç ERP - security and operations foundation
-- Idempotent migration. Never stores passwords or service-role keys.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allowed_tabs TEXT[] NOT NULL DEFAULT ARRAY['/'];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('founder','admin','yonetici','muhasebe','puantor','personel','operasyon','operator'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('pending','aktif','pasif'));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON public.profiles (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  phone TEXT,
  personnel_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_role TEXT NOT NULL DEFAULT 'personel',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS memberships_status_idx ON public.memberships(status);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON public.memberships(user_id);

CREATE TABLE IF NOT EXISTS public.number_sequences (
  key TEXT PRIMARY KEY,
  prefix TEXT NOT NULL,
  next_value BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.number_sequences(key, prefix, next_value) VALUES
  ('quote', 'TK', 1), ('contract', 'SZ', 1), ('receipt', 'MB', 1), ('invoice', 'FT', 1)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_no TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  site_name TEXT,
  crane_code TEXT,
  operator_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 20,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  valid_until DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_no TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  site_name TEXT,
  start_date DATE,
  end_date DATE,
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','cancelled','completed')),
  signed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quotes_customer_idx ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS contracts_customer_idx ON public.contracts(customer_id);

CREATE OR REPLACE FUNCTION public.is_founder_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'aktif' AND role IN ('founder','admin')
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_or_admin_select ON public.profiles;
DROP POLICY IF EXISTS profiles_self_or_admin_update ON public.profiles;
DROP POLICY IF EXISTS memberships_self_or_admin ON public.memberships;
DROP POLICY IF EXISTS quotes_staff_access ON public.quotes;
DROP POLICY IF EXISTS contracts_staff_access ON public.contracts;

CREATE POLICY profiles_self_or_admin_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_founder_or_admin());
CREATE POLICY profiles_self_or_admin_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_founder_or_admin())
  WITH CHECK (id = auth.uid() OR public.is_founder_or_admin());
CREATE POLICY memberships_self_or_admin ON public.memberships FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_founder_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_founder_or_admin());
CREATE POLICY quotes_staff_access ON public.quotes FOR ALL TO authenticated
  USING (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe','operasyon','operator')))
  WITH CHECK (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe','operasyon','operator')));
CREATE POLICY contracts_staff_access ON public.contracts FOR ALL TO authenticated
  USING (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe','operasyon','operator')))
  WITH CHECK (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe','operasyon','operator')));

GRANT EXECUTE ON FUNCTION public.is_founder_or_admin() TO authenticated;
