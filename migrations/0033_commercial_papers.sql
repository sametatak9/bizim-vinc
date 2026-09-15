-- 0033_commercial_papers.sql
-- Çek / senet portföyü (alınan-verilen çek ve senetler).
-- PaymentPlanningPage "checks" sekmesi bu tabloya bağlıdır; tablo hiç
-- oluşturulmamıştı (bkz. src/lib/store.tsx içindeki bozuk useState hatası,
-- aynı geçişte düzeltildi). Idempotent — birden fazla kez çalıştırılabilir.

CREATE TABLE IF NOT EXISTS public.commercial_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('alinan_cek', 'verilen_cek', 'alinan_senet', 'verilen_senet')),
  document_no text NOT NULL,
  serial_no text,
  amount numeric NOT NULL CHECK (amount > 0),
  issue_date date NOT NULL,
  due_date date NOT NULL,
  debtor text NOT NULL,
  debtor_tax_id text,
  beneficiary text NOT NULL,
  endorser text,
  bank_name text,
  bank_branch text,
  account_no text,
  city text,
  status text NOT NULL DEFAULT 'portfoyde' CHECK (status IN (
    'portfoyde', 'ciro_edildi', 'tahsile_verildi', 'odendi_tahsil', 'karsiliksiz_protesto', 'iade_edildi'
  )),
  status_date timestamptz,
  notes text,
  document_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commercial_papers_due_date_idx ON public.commercial_papers (due_date);
CREATE INDEX IF NOT EXISTS commercial_papers_status_idx ON public.commercial_papers (status);

ALTER TABLE public.commercial_papers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commercial_papers_office_all ON public.commercial_papers;
CREATE POLICY commercial_papers_office_all ON public.commercial_papers FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());

NOTIFY pgrst, 'reload schema';
