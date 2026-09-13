-- =====================================================================
-- BİZİM VİNÇ ERP - SUPABASE VERİTABANI ŞEMASI & GÖÇ BETİĞİ (MIGRATION)
-- Versiyon: 1.0.0
-- Açıklama: Filo, Personel, Onay Merkezi, Makbuzlar, Masraflar ve Telemetri
-- =====================================================================

-- 1. EKLENTİLER
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PERSONEL TABLOSU
CREATE TABLE IF NOT EXISTS public.personnel (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    employee_no TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('operator', 'yardimci', 'idari')),
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'izinli', 'pasif')),
    pool_status TEXT NOT NULL DEFAULT 'musait' CHECK (pool_status IN ('gorevli', 'musait', 'havuzda')),
    title TEXT,
    initials TEXT,
    card_slug TEXT,
    documents_ok BOOLEAN DEFAULT TRUE,
    cert_expiring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FİLO (VİNÇLER) TABLOSU
CREATE TABLE IF NOT EXISTS public.cranes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'musait' CHECK (status IN ('sahada', 'musait', 'bakimda', 'arizali')),
    capacity TEXT NOT NULL,
    operator TEXT,
    site TEXT,
    last_service TEXT,
    lat DOUBLE PRECISION DEFAULT 41.0100,
    lng DOUBLE PRECISION DEFAULT 29.0000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ONAY MERKEZİ (OPERASYON TALEPLERİ) TABLOSU
CREATE TABLE IF NOT EXISTS public.approvals (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('yoklama', 'mesai', 'avans', 'makbuz', 'izin', 'genel', 'vinc_hareket', 'mesai_kaldi')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    title TEXT NOT NULL,
    person_name TEXT NOT NULL,
    person_initials TEXT,
    related_label TEXT,
    note TEXT,
    decision_note TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MAKBUZLAR TABLOSU (CİRO VE FATURALANDIRMA)
CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    receipt_no TEXT NOT NULL,
    company TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'kesildi' CHECK (status IN ('kesildi', 'birikti', 'bekliyor')),
    crane_code TEXT,
    site TEXT,
    days_pending INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MASRAFLAR VE YAKIT TABLOSU
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    category TEXT NOT NULL CHECK (category IN ('yakit', 'masraf')),
    title TEXT NOT NULL,
    detail TEXT,
    amount NUMERIC NOT NULL,
    crane_code TEXT,
    person_name TEXT,
    station_or_supplier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EKSİK SÜTUNLARI TAMAMLAMA (Tablolar önceden oluşturulmuşsa garanti altına alma)
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS employee_no TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'operator';
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aktif';
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS pool_status TEXT DEFAULT 'musait';
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS card_slug TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS documents_ok BOOLEAN DEFAULT TRUE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS cert_expiring BOOLEAN DEFAULT FALSE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Mobil Vinç';
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'musait';
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS capacity TEXT DEFAULT '50 ton';
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS operator TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS last_service TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION DEFAULT 41.0100;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION DEFAULT 29.0000;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 8. İNDEKSLER
CREATE INDEX IF NOT EXISTS idx_personnel_employee_no ON public.personnel(employee_no);
CREATE INDEX IF NOT EXISTS idx_personnel_status ON public.personnel(status);
CREATE INDEX IF NOT EXISTS idx_cranes_code ON public.cranes(code);
CREATE INDEX IF NOT EXISTS idx_cranes_status ON public.cranes(status);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_created ON public.approvals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- 9. POSTGREST VE ANONİM ERİŞİM YETKİLERİ (GRANT)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 10. ROW LEVEL SECURITY (RLS) - ERP Verilerine Doğrudan Erişim
ALTER TABLE public.personnel DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cranes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- PostgREST şema önbelleğini anında yenile
NOTIFY pgrst, 'reload schema';

-- 9. BAŞLANGIÇ GERÇEKÇİ VERİLERİ (SEED DATA)
INSERT INTO public.personnel (id, employee_no, full_name, phone, kind, status, pool_status, title, initials, card_slug, documents_ok, cert_expiring)
VALUES
('p-001', 'OP-204', 'Mehmet Kaya', '+90 532 111 22 33', 'operator', 'aktif', 'gorevli', 'Mobil Vinç Operatörü', 'MK', 'mehmet-kaya', true, false),
('p-002', 'OP-118', 'Ali Demir', '+90 533 222 33 44', 'operator', 'aktif', 'gorevli', 'Teleskopik Vinç Operatörü', 'AD', 'ali-demir', true, false),
('p-003', 'OP-302', 'Elif Yılmaz', '+90 534 333 44 55', 'operator', 'aktif', 'musait', 'Sepetli Platform Operatörü', 'EY', 'elif-yilmaz', true, false),
('p-004', 'OP-087', 'Can Özkan', '+90 535 444 55 66', 'operator', 'aktif', 'gorevli', 'Paletli Vinç Operatörü', 'CÖ', 'can-ozkan', false, true),
('p-005', 'YD-101', 'Ahmet Şahin', '+90 536 555 66 77', 'yardimci', 'aktif', 'gorevli', 'Vinç Yağcısı & Montör', 'AŞ', 'ahmet-sahin', true, false),
('p-006', 'ID-001', 'Esra Yıldırım', '+90 537 666 77 88', 'idari', 'aktif', 'musait', 'Operasyon Yöneticisi', 'EY', 'esra-yildirim', true, false)
ON CONFLICT (employee_no) DO NOTHING;

INSERT INTO public.cranes (id, code, type, status, capacity, operator, site, last_service, lat, lng)
VALUES
('c-001', 'V-204', 'Mobil Vinç', 'sahada', '50 ton', 'Mehmet Kaya', 'Ataşehir Metro Şantiyesi', '2026-08-12', 40.9923, 29.1244),
('c-002', 'V-118', 'Teleskopik', 'sahada', '80 ton', 'Ali Demir', 'Bandırma Liman Projesi', '2026-07-28', 40.3522, 27.9767),
('c-003', 'V-302', 'Sepetli', 'musait', '35 metre', 'Elif Yılmaz', 'Tuzla Ana Depo', '2026-08-30', 40.8650, 29.3010),
('c-004', 'V-087', 'Paletli Vinç', 'sahada', '120 ton', 'Can Özkan', 'Aliağa Petrokimya', '2026-08-05', 38.7985, 26.9680),
('c-005', 'V-155', 'Mobil Vinç', 'bakimda', '60 ton', NULL, 'Merkez Servis İstasyonu', '2026-09-10', 41.0150, 28.9800),
('c-006', 'V-210', 'Hiyap Vinç', 'arizali', '25 ton', NULL, 'Gebze Sanayi Sitesi', '2026-09-08', 40.8020, 29.4350),
('c-007', 'V-133', 'Mobil Vinç', 'sahada', '70 ton', 'Serkan Aydın', 'Kadıköy Rıhtım İskelesi', '2026-08-18', 40.9900, 29.0250),
('c-008', 'V-198', 'Teleskopik', 'sahada', '100 ton', 'Burak Yıldız', 'Maltepe Konut Şantiyesi', '2026-08-22', 40.9300, 29.1400)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.approvals (id, kind, status, title, person_name, person_initials, related_label, note, created_at)
VALUES
('a-001', 'mesai_kaldi', 'pending', 'Fazla mesai talebi (3 saat)', 'Mehmet Kaya', 'MK', '3 saat · V-204 · Ataşehir', 'Saha beton dökümü gecikmesi nedeniyle ekstra süre gerekti.', NOW() - INTERVAL '1 hour'),
('a-002', 'vinc_hareket', 'pending', 'Filo bakım onay talebi', 'Bakım Şefi Rıza', 'RŞ', 'V-155 Hidrolik Değişimi', 'Planlı 250 saatlik hidrolik hortum ve keçe revizyonu onayı.', NOW() - INTERVAL '3 hours'),
('a-003', 'yoklama', 'approved', 'İşe geldim (Saha Yoklaması)', 'Ali Demir', 'AD', 'V-118 · Bandırma Limanı', 'Zamanında şantiyeye varıldı, makine kontrolleri tamamlandı.', NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.receipts (id, receipt_no, company, amount, status, crane_code, site, days_pending)
VALUES
('r-001', 'MK-2026-0148', 'Yapı Kredi Genel Müd.', 42000, 'kesildi', 'V-204', 'Ataşehir', 0),
('r-002', 'MK-2026-0147', 'Kuzey Yapı İnşaat A.Ş.', 18500, 'kesildi', 'V-118', 'Bandırma', 0),
('r-003', 'MK-2026-0146', 'Ege Liman İşletmeleri', 27200, 'kesildi', 'V-087', 'Aliağa', 0),
('r-004', 'MK-2026-0145', 'Marmara Rüzgar Enerji', 31000, 'kesildi', 'V-133', 'Kadıköy', 0),
('r-005', 'BK-2026-0041', 'Doğu Çelik Konstrüksiyon', 28000, 'birikti', 'V-204', 'Ataşehir', 3),
('r-006', 'BK-2026-0042', 'Bandırma Gübre Sanayi', 16500, 'birikti', 'V-118', 'Bandırma', 1),
('r-007', 'BK-2026-0043', 'Tüpraş Rafineri Bakım', 39000, 'birikti', 'V-087', 'Aliağa', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expenses (id, category, title, detail, amount, crane_code, person_name, station_or_supplier)
VALUES
('e-001', 'yakit', 'Dizel Yakıt Dolumu', '140 Litre Eurodiesel', 2450, 'V-204', 'Mehmet Kaya', 'Shell Ataşehir İstasyonu'),
('e-002', 'yakit', 'Dizel Yakıt Dolumu', '180 Litre Eurodiesel', 3120, 'V-087', 'Can Özkan', 'Opet Aliağa İstasyonu'),
('e-003', 'masraf', 'Hidrolik Hortum Değişimi', 'Basınç valfi ve yedek parça', 1250, 'V-155', 'Bakım Ekibi', 'Teknik Hidrolik Ltd.'),
('e-004', 'masraf', 'Otoyol HGS Geçişi', 'Kuzey Marmara Otoyolu geçiş', 245, 'V-204', 'Mehmet Kaya', 'KGM HGS')
ON CONFLICT (id) DO NOTHING;
