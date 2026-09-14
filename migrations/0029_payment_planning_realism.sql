-- ============================================================
-- 0029 — Ödeme planlama modülünü gerçek muhasebe akışına taşır
--  * Yükümlülüklere kategori bazlı kurum/sözleşme/fatura alanları
--  * Taksitlere dönem (ay), ödeme kanalı, dekont zorunluluğu
--  * payment_receipts: dekont / fatura görseli arşivi
--  * "Ödendi" işaretlemesi dekont olmadan REDDEDİLİR (trigger)
--  * Raporlama görünümleri
-- ============================================================

-- 1) Yükümlülük (obligation) — bankamsı sözleşme bilgileri
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS institution_name TEXT;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS contract_no TEXT;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS subscriber_no TEXT;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'TRY';
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS interest_rate NUMERIC;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS invoice_no TEXT;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS plate TEXT;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS crane_id UUID REFERENCES public.cranes(id) ON DELETE SET NULL;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS document_path TEXT;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manuel';
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS source_invoice_id UUID;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.payment_obligations DROP CONSTRAINT IF EXISTS payment_obligations_source_check;
  ALTER TABLE public.payment_obligations ADD CONSTRAINT payment_obligations_source_check
    CHECK (source IN ('manuel','fatura','sozlesme','ice_aktarim'));
END $$;

-- 2) Taksit satırları (payments) — ödeme gerçekleşme detayı
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS institution_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_no TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_amount NUMERIC;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_channel TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reference_no TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS document_path TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'TRY';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_channel_check;
  ALTER TABLE public.payments ADD CONSTRAINT payments_payment_channel_check
    CHECK (payment_channel IS NULL OR payment_channel IN
      ('havale_eft','otomatik_odeme','dbs','nakit','cek','senet','kredi_karti','pos','mahsup','virman','diger'));
END $$;

-- Dönem kolonu: taksit hangi aya ait (ay bazlı ekran ve raporlar için)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS period_month DATE;
UPDATE public.payments SET period_month = date_trunc('month', due_date)::date WHERE period_month IS NULL;

CREATE OR REPLACE FUNCTION public.set_payment_period_month()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.period_month := date_trunc('month', NEW.due_date)::date;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS payments_period_month ON public.payments;
CREATE TRIGGER payments_period_month BEFORE INSERT OR UPDATE OF due_date ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_period_month();

CREATE INDEX IF NOT EXISTS payments_period_status_idx ON public.payments(period_month, status);
CREATE INDEX IF NOT EXISTS payments_category_period_idx ON public.payments(category, period_month);

-- 3) Dekont / belge arşivi
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  obligation_id UUID REFERENCES public.payment_obligations(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL DEFAULT 'dekont' CHECK (doc_type IN ('dekont','fatura','ekstre','makbuz','sozlesme','diger')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  amount NUMERIC,
  bank_name TEXT,
  reference_no TEXT,
  paid_at DATE,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_receipts_payment_idx ON public.payment_receipts(payment_id);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_receipts_finance_all ON public.payment_receipts;
CREATE POLICY payment_receipts_finance_all ON public.payment_receipts FOR ALL TO authenticated
  USING (public.is_finance_staff()) WITH CHECK (public.is_finance_staff());

-- 4) "Ödendi" demek için kanıt zorunlu
CREATE OR REPLACE FUNCTION public.enforce_payment_settlement_proof()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE proof_count INTEGER;
BEGIN
  IF NEW.status = 'odendi' AND COALESCE(OLD.status, '') <> 'odendi' THEN
    IF NEW.payment_channel IS NULL THEN
      RAISE EXCEPTION 'Ödeme kapatılamaz: ödemenin hangi yöntemle yapıldığı (ödeme kanalı) seçilmelidir.';
    END IF;
    IF COALESCE(NEW.payment_date, NEW.paid_date) IS NULL THEN
      RAISE EXCEPTION 'Ödeme kapatılamaz: gerçek ödeme tarihi girilmelidir.';
    END IF;
    IF COALESCE(NEW.paid_amount, 0) <= 0 THEN
      RAISE EXCEPTION 'Ödeme kapatılamaz: ödenen tutar girilmelidir.';
    END IF;
    SELECT count(*) INTO proof_count FROM public.payment_receipts WHERE payment_id = NEW.id;
    IF proof_count = 0 AND NEW.document_path IS NULL THEN
      RAISE EXCEPTION 'Ödeme kapatılamaz: dekont / ödeme belgesi yüklenmeden ödeme yapıldı olarak işaretlenemez.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS payments_settlement_proof ON public.payments;
CREATE TRIGGER payments_settlement_proof BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_settlement_proof();

-- 5) Belge deposu (özel bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-documents', 'payment-documents', false, 20971520,
        ARRAY['image/png','image/jpeg','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 20971520;

DROP POLICY IF EXISTS payment_documents_finance_read ON storage.objects;
CREATE POLICY payment_documents_finance_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-documents' AND public.is_finance_staff());
DROP POLICY IF EXISTS payment_documents_finance_write ON storage.objects;
CREATE POLICY payment_documents_finance_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-documents' AND public.is_finance_staff());
DROP POLICY IF EXISTS payment_documents_finance_update ON storage.objects;
CREATE POLICY payment_documents_finance_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-documents' AND public.is_finance_staff())
  WITH CHECK (bucket_id = 'payment-documents' AND public.is_finance_staff());

-- 6) Raporlama görünümleri
CREATE OR REPLACE VIEW public.v_payment_month_summary AS
SELECT
  p.period_month,
  p.category,
  count(*)                                                            AS taksit_sayisi,
  sum(p.amount)                                                       AS planlanan_tutar,
  sum(CASE WHEN p.status = 'odendi' THEN COALESCE(p.paid_amount, p.amount) ELSE 0 END) AS odenen_tutar,
  sum(CASE WHEN p.status = 'bekliyor' THEN p.amount ELSE 0 END)       AS bekleyen_tutar,
  sum(CASE WHEN p.status = 'bekliyor' AND p.due_date < CURRENT_DATE THEN p.amount ELSE 0 END) AS geciken_tutar,
  count(*) FILTER (WHERE p.status = 'bekliyor' AND p.due_date < CURRENT_DATE) AS geciken_sayisi
FROM public.payments p
GROUP BY p.period_month, p.category;

CREATE OR REPLACE VIEW public.v_payment_obligation_progress AS
SELECT
  o.id, o.title, o.category, o.institution_name, o.recipient_name, o.contract_no,
  o.total_amount, o.installment_count, o.start_date, o.end_date, o.currency, o.status,
  count(p.id)                                                    AS uretilen_taksit,
  count(p.id) FILTER (WHERE p.status = 'odendi')                 AS odenen_taksit,
  sum(CASE WHEN p.status = 'odendi' THEN COALESCE(p.paid_amount, p.amount) ELSE 0 END) AS odenen_tutar,
  sum(CASE WHEN p.status = 'bekliyor' THEN p.amount ELSE 0 END)  AS kalan_tutar,
  min(p.due_date) FILTER (WHERE p.status = 'bekliyor')           AS sonraki_vade
FROM public.payment_obligations o
LEFT JOIN public.payments p ON p.obligation_id = o.id
GROUP BY o.id;

CREATE OR REPLACE VIEW public.v_payment_settlement_report AS
SELECT
  p.id, p.period_month, p.due_date, p.payment_date, p.category, p.recipient_name,
  p.institution_name, p.invoice_no, p.amount, p.paid_amount, p.currency, p.status,
  p.payment_channel, p.bank_account, p.reference_no,
  p.installment_no, p.installment_count, o.title AS obligation_title, o.contract_no,
  (SELECT count(*) FROM public.payment_receipts r WHERE r.payment_id = p.id) AS belge_sayisi
FROM public.payments p
LEFT JOIN public.payment_obligations o ON o.id = p.obligation_id;

REVOKE ALL ON public.v_payment_month_summary, public.v_payment_obligation_progress, public.v_payment_settlement_report FROM anon;
GRANT SELECT ON public.v_payment_month_summary, public.v_payment_obligation_progress, public.v_payment_settlement_report TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_payment_period_month() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_payment_settlement_proof() FROM anon;
