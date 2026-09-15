-- 0034_tahsilat_odeme_modulu.sql
-- Tahsilat (senet/çek alacakları) ve Ödemeler (şirketin 2026 ödeme planı) canlı takip modülü.
-- Kaynak: manus-tahsilatlar-odemeler-prompt.md + bizim-vinc-spec-v2.md ("Tahsilat & Ödeme Takip Modülü").
--
-- Tasarım kararı: yeni ayrı bir `tahsilatlar` tablosu yerine MEVCUT `collections` tablosu
-- genişletildi (customer_id zaten nullable'dı, hiçbir mevcut satır bozulmuyor — tablo canlıda
-- fiilen boş). Çek/senet'e özgü alanlar ayrı `receivable_details` tablosunda (1:1, cascade).
-- Şirketin KENDİ ödeme yükümlülükleri (maaş/leasing/kredi/vergi/SGK) mevcut `payments` /
-- `payment_obligations` akışıyla KARIŞTIRMADI — ayrı `odemeler_plani` tablosu.
--
-- Idempotent — birden fazla kez çalıştırılabilir.

-- ─────────────────────────────────────────────────────────────
-- 1) collections: yeni alanlar
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_type text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS status_note text,
  ADD COLUMN IF NOT EXISTS is_migrated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- remaining_amount: her zaman amount - paid_amount, elle yazılmaz.
ALTER TABLE public.collections DROP COLUMN IF EXISTS remaining_amount;
ALTER TABLE public.collections
  ADD COLUMN remaining_amount numeric GENERATED ALWAYS AS (GREATEST(amount - COALESCE(paid_amount, 0), 0)) STORED;

-- payment_type: yeni spec enum'u (SENET dahil). Mevcut payment_method (havale/nakit/cek/kredi_karti)
-- korunuyor (eski kod hâlâ ona yazıyor); payment_type boşsa payment_method'dan tek seferlik backfill.
UPDATE public.collections SET payment_type = UPPER(
  CASE payment_method
    WHEN 'havale' THEN 'HAVALE_EFT'
    WHEN 'nakit'  THEN 'NAKIT'
    WHEN 'kredi_karti' THEN 'KREDI_KARTI'
    WHEN 'cek'    THEN 'CEK'
    ELSE 'HAVALE_EFT'
  END
) WHERE payment_type IS NULL;
ALTER TABLE public.collections ALTER COLUMN payment_type SET DEFAULT 'HAVALE_EFT';
ALTER TABLE public.collections ALTER COLUMN payment_type SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE public.collections ADD CONSTRAINT collections_payment_type_check
    CHECK (payment_type IN ('NAKIT', 'HAVALE_EFT', 'KREDI_KARTI', 'CEK', 'SENET'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- status: eski 3 durum (bekliyor/tahsil_edildi/iptal) + yeni çek/senet 6 durumu bir arada
-- (payment_type'a göre hangi seti kullanacağı uygulama tarafında belirlenir).
ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_status_check;
ALTER TABLE public.collections ADD CONSTRAINT collections_status_check CHECK (status IN (
  'bekliyor', 'tahsil_edildi', 'iptal',
  'PORTFOYDE', 'TAKASTA', 'TAHSIL_EDILDI', 'KISMI_ODENDI', 'KARSILIKSIZ', 'CIRO_EDILDI'
));

-- customer_id: cari şart değil (çoğu borçlu şahıs) — kaza sonucu toplu
-- import'ta ON DELETE CASCADE olarak bağlıydı; senet/çek için nullable olmalı.
ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_customer_id_fkey;
ALTER TABLE public.collections
  ADD CONSTRAINT collections_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- 2) receivable_details: çek/senet'e özgü alanlar (1:1, cascade)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.receivable_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL UNIQUE REFERENCES public.collections(id) ON DELETE CASCADE,
  paper_type text NOT NULL CHECK (paper_type IN ('cek', 'senet')),
  document_no text NOT NULL,
  serial_no text,
  due_date date NOT NULL,
  debtor text NOT NULL,
  debtor_tax_id text,
  bank_name text,
  bank_branch text,
  account_no text,
  city text,
  endorser text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receivable_details_collection_id_idx ON public.receivable_details (collection_id);
CREATE INDEX IF NOT EXISTS receivable_details_due_date_idx ON public.receivable_details (due_date);

-- ─────────────────────────────────────────────────────────────
-- 3) RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.receivable_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS receivable_details_office_all ON public.receivable_details;
CREATE POLICY receivable_details_office_all ON public.receivable_details FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());

-- collections tablosu zaten RLS enabled; policy varsa yenile.
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS collections_office_all ON public.collections;
CREATE POLICY collections_office_all ON public.collections FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());

-- ─────────────────────────────────────────────────────────────
-- 4) İndeksler
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS collections_status_idx ON public.collections (status);
CREATE INDEX IF NOT EXISTS collections_due_date_idx ON public.collections (date);
CREATE INDEX IF NOT EXISTS collections_deleted_at_idx ON public.collections (deleted_at) WHERE deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';
