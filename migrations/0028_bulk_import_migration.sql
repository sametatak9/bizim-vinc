-- 0028_bulk_import_migration.sql
-- Toplu Veri Yükleme / Migrasyon Modülü şeması
-- Eski şirket verilerinin (cariler + açılış bakiyeleri, personel + KVKK izole sağlık, kasa referansı)
-- denetlenebilir ve geri alınabilir şekilde içeri alınması için gereken tablolar.
-- HİÇBİR mevcut kolon/kayıt silinmez. approval_requests'a dokunulmaz.

-- ============================================================
-- 0) Rol: işyeri hekimi (sadece izole sağlık verisine erişir)
-- ============================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('founder','admin','yonetici','muhasebe','puantor','personel','operasyon','operator','isyeri_hekimi'));

CREATE OR REPLACE FUNCTION public.is_occupational_physician()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'isyeri_hekimi');
$$;

CREATE OR REPLACE FUNCTION public.is_finance_staff()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_founder_or_admin()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici','muhasebe'));
$$;

-- ============================================================
-- 1) import_batches — her migrasyon partisinin denetim kaydı
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_type TEXT NOT NULL,
  source_file TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  inserted_rows INTEGER NOT NULL DEFAULT 0,
  updated_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('dry_run','running','completed','failed','rolled_back')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS import_batches_read_finance ON public.import_batches;
CREATE POLICY import_batches_read_finance ON public.import_batches
  FOR SELECT TO authenticated USING (public.is_finance_staff());
DROP POLICY IF EXISTS import_batches_manage_admin ON public.import_batches;
CREATE POLICY import_batches_manage_admin ON public.import_batches
  FOR ALL TO authenticated USING (public.is_founder_or_admin()) WITH CHECK (public.is_founder_or_admin());
REVOKE ALL ON public.import_batches FROM anon;

-- ============================================================
-- 2) customers — migrasyon alanları
-- ============================================================
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS vkn_turu TEXT CHECK (vkn_turu IS NULL OR vkn_turu IN ('VKN','TCKN')),
  ADD COLUMN IF NOT EXISTS hesap_tipi TEXT,
  ADD COLUMN IF NOT EXISTS hesap_kodu_kaynak TEXT,
  ADD COLUMN IF NOT EXISTS vkn_dogrulanmadi BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_vkn_tckn_unique_idx
  ON public.customers (vkn_tckn) WHERE vkn_tckn IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_import_batch_idx ON public.customers (import_batch_id);

-- ============================================================
-- 3) opening_balances — açılış bakiyeleri (job_receipts/invoices'tan tamamen ayrı)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.opening_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tutar NUMERIC NOT NULL DEFAULT 0,
  yon TEXT NOT NULL CHECK (yon IN ('Borclu','Alacakli','Bakiye Yok')),
  para_birimi TEXT NOT NULL DEFAULT 'TL',
  as_of_date DATE NOT NULL,
  kaynak_hesap_kodu TEXT,
  kaynak_sistem TEXT,
  v3_fark_var BOOLEAN NOT NULL DEFAULT FALSE,
  v3_bakiye NUMERIC,
  notlar TEXT,
  is_migrated BOOLEAN NOT NULL DEFAULT TRUE,
  import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT opening_balances_customer_asof_unique UNIQUE (customer_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS opening_balances_customer_idx ON public.opening_balances (customer_id);
ALTER TABLE public.opening_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS opening_balances_read_finance ON public.opening_balances;
CREATE POLICY opening_balances_read_finance ON public.opening_balances
  FOR SELECT TO authenticated USING (public.is_finance_staff());
DROP POLICY IF EXISTS opening_balances_manage_admin ON public.opening_balances;
CREATE POLICY opening_balances_manage_admin ON public.opening_balances
  FOR ALL TO authenticated USING (public.is_founder_or_admin()) WITH CHECK (public.is_founder_or_admin());
REVOKE ALL ON public.opening_balances FROM anon;

-- ============================================================
-- 4) personnel — migrasyon + HR alanları
-- ============================================================
ALTER TABLE public.personnel
  ADD COLUMN IF NOT EXISTS tc_hash TEXT,
  ADD COLUMN IF NOT EXISTS sicil_no TEXT,
  ADD COLUMN IF NOT EXISTS dogum_tarihi DATE,
  ADD COLUMN IF NOT EXISTS uyruk TEXT,
  ADD COLUMN IF NOT EXISTS cinsiyet TEXT,
  ADD COLUMN IF NOT EXISTS medeni_hali TEXT,
  ADD COLUMN IF NOT EXISTS bolum TEXT,
  ADD COLUMN IF NOT EXISTS birim TEXT,
  ADD COLUMN IF NOT EXISTS takim TEXT,
  ADD COLUMN IF NOT EXISTS calisma_sekli TEXT,
  ADD COLUMN IF NOT EXISTS isgucu_sinifi TEXT,
  ADD COLUMN IF NOT EXISTS yillik_izin_hakki INTEGER,
  ADD COLUMN IF NOT EXISTS banka_adi TEXT,
  ADD COLUMN IF NOT EXISTS banka_hesap_sahibi TEXT,
  ADD COLUMN IF NOT EXISTS acil_durum_kisisi TEXT,
  ADD COLUMN IF NOT EXISTS acil_durum_telefon TEXT,
  ADD COLUMN IF NOT EXISTS sehir TEXT,
  ADD COLUMN IF NOT EXISTS ulke TEXT,
  ADD COLUMN IF NOT EXISTS resmi_sirket_unvani TEXT,
  ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS personnel_tc_hash_unique_idx
  ON public.personnel (tc_hash) WHERE tc_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS personnel_email_unique_idx
  ON public.personnel (lower(email)) WHERE email IS NOT NULL;

-- ============================================================
-- 5) personnel_health_data — KVKK izole sağlık verisi
--    Sadece founder/admin + isyeri_hekimi erişir. personnel/documents'a yazılmaz.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personnel_health_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personnel_id UUID NOT NULL UNIQUE REFERENCES public.personnel(id) ON DELETE CASCADE,
  kan_grubu TEXT,
  engelli_mi BOOLEAN,
  saglik_durumu_notu TEXT,
  is_migrated BOOLEAN NOT NULL DEFAULT FALSE,
  import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.personnel_health_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS personnel_health_data_read_restricted ON public.personnel_health_data;
CREATE POLICY personnel_health_data_read_restricted ON public.personnel_health_data
  FOR SELECT TO authenticated
  USING (public.is_founder_or_admin() OR public.is_occupational_physician());
DROP POLICY IF EXISTS personnel_health_data_write_restricted ON public.personnel_health_data;
CREATE POLICY personnel_health_data_write_restricted ON public.personnel_health_data
  FOR ALL TO authenticated
  USING (public.is_founder_or_admin() OR public.is_occupational_physician())
  WITH CHECK (public.is_founder_or_admin() OR public.is_occupational_physician());
REVOKE ALL ON public.personnel_health_data FROM anon;

-- ============================================================
-- 6) personnel_consents — KVKK açık rıza durumu (sahte onay üretilmez)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personnel_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL DEFAULT 'kvkk_acik_riza',
  durum TEXT NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor','alindi','reddedildi','iptal')),
  aciklama TEXT,
  alindi_at TIMESTAMPTZ,
  is_migrated BOOLEAN NOT NULL DEFAULT FALSE,
  import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT personnel_consents_unique UNIQUE (personnel_id, consent_type)
);

ALTER TABLE public.personnel_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS personnel_consents_read_admin ON public.personnel_consents;
CREATE POLICY personnel_consents_read_admin ON public.personnel_consents
  FOR SELECT TO authenticated
  USING (public.is_founder_or_admin()
     OR personnel_id = (SELECT personnel_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS personnel_consents_manage_admin ON public.personnel_consents;
CREATE POLICY personnel_consents_manage_admin ON public.personnel_consents
  FOR ALL TO authenticated USING (public.is_founder_or_admin()) WITH CHECK (public.is_founder_or_admin());
REVOKE ALL ON public.personnel_consents FROM anon;

-- ============================================================
-- 7) kasa_hareket_log — SALT OKUNUR referans, canlı bakiyeye DAHİL EDİLMEZ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kasa_hareket_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sira_no INTEGER,
  tarih DATE,
  islem_turu TEXT,
  fis_no TEXT,
  cari_unvan TEXT,
  aciklama TEXT,
  borc_tl NUMERIC,
  alacak_tl NUMERIC,
  kur NUMERIC,
  borc_doviz NUMERIC,
  alacak_doviz NUMERIC,
  para_birimi TEXT,
  durum TEXT,
  is_migrated BOOLEAN NOT NULL DEFAULT TRUE,
  hesap_dogrulanmadi BOOLEAN NOT NULL DEFAULT TRUE,
  para_birimi_dogrulanmadi BOOLEAN NOT NULL DEFAULT TRUE,
  import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.kasa_hareket_log IS
  'SALT REFERANS. Kaynak rapor 6 kasa/banka hesabini tek toplamda birlestirdigi icin hesap ayrimi yapilamiyor. Hicbir canli bakiye/raporlama hesabina dahil edilmez.';

CREATE INDEX IF NOT EXISTS kasa_hareket_log_tarih_idx ON public.kasa_hareket_log (tarih);
ALTER TABLE public.kasa_hareket_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kasa_hareket_log_read_finance ON public.kasa_hareket_log;
CREATE POLICY kasa_hareket_log_read_finance ON public.kasa_hareket_log
  FOR SELECT TO authenticated USING (public.is_finance_staff());
-- Bilincli olarak INSERT/UPDATE/DELETE politikasi YOK: tablo uygulama tarafindan salt okunur.
REVOKE ALL ON public.kasa_hareket_log FROM anon;

-- ============================================================
-- 8) Yardimci fonksiyonlar anon tarafindan RPC ile cagrilamasin
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.is_occupational_physician() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_finance_staff() FROM anon;
