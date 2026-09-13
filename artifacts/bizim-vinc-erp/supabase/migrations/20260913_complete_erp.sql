-- =====================================================================
-- BİZİM VİNÇ ERP - TAM VERİTABANI ŞEMASI & GÖÇ BETİĞİ (MIGRATION)
-- Versiyon: 2.0.0 (Gerçek ERP, Auth, Roller, Puantaj, Onay & Audit)
-- =====================================================================

-- 1. EKLENTİLER
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. KULLANICI PROFİLLERİ (auth.users ile entegre)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- auth.users.id
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'yonetici', 'muhasebe', 'puantor', 'personel', 'operasyon')),
    phone TEXT,
    department TEXT,
    title TEXT,
    personnel_id UUID,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'pasif')),
    last_sign_in TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERSONEL TABLOSU
CREATE TABLE IF NOT EXISTS public.personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_no TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    tc_no TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    kind TEXT NOT NULL DEFAULT 'operator' CHECK (kind IN ('operator', 'yardimci', 'idari')),
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'izinli', 'pasif')),
    pool_status TEXT NOT NULL DEFAULT 'musait' CHECK (pool_status IN ('gorevli', 'musait', 'havuzda')),
    department TEXT,
    salary NUMERIC DEFAULT 0,
    iban TEXT,
    start_date DATE,
    end_date DATE,
    title TEXT NOT NULL,
    initials TEXT,
    card_slug TEXT,
    documents_ok BOOLEAN DEFAULT TRUE,
    cert_expiring BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FİLO (VİNÇLER) TABLOSU
CREATE TABLE IF NOT EXISTS public.cranes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'musait' CHECK (status IN ('sahada', 'musait', 'bakimda', 'arizali', 'pasif')),
    capacity TEXT NOT NULL,
    operator TEXT,
    site TEXT,
    last_service DATE DEFAULT CURRENT_DATE,
    lat DOUBLE PRECISION DEFAULT 41.0100,
    lng DOUBLE PRECISION DEFAULT 29.0000,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ONAY MERKEZİ (approvals)
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kind TEXT NOT NULL CHECK (kind IN ('yoklama', 'mesai', 'avans', 'makbuz', 'izin', 'yakit', 'genel', 'vinc_hareket', 'mesai_kaldi', 'diger')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    title TEXT NOT NULL,
    person_id UUID,
    person_name TEXT NOT NULL,
    person_initials TEXT,
    related_label TEXT,
    amount NUMERIC DEFAULT 0,
    requested_date DATE,
    start_date DATE,
    end_date DATE,
    hours NUMERIC DEFAULT 0,
    note TEXT,
    decision_note TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GÜNLÜK YOKLAMA (attendance)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL,
    person_name TEXT NOT NULL,
    date DATE NOT NULL,
    check_in_time TEXT,
    check_out_time TEXT,
    status TEXT NOT NULL DEFAULT 'geldi' CHECK (status IN ('geldi', 'gelmedi', 'izinli', 'raporlu', 'tatil', 'eksik')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (person_id, date)
);

-- 7. İZİN TALEPLERİ (leaves)
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL,
    person_name TEXT NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('yillik', 'mazeret', 'rapor', 'ucretsiz')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MESAİ TALEPLERİ (overtimes)
CREATE TABLE IF NOT EXISTS public.overtimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL,
    person_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    total_hours NUMERIC NOT NULL DEFAULT 0,
    overtime_type TEXT NOT NULL DEFAULT 'hafta_ici' CHECK (overtime_type IN ('hafta_ici', 'hafta_sonu', 'resmi_tatil')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AVANS TALEPLERİ (advances)
CREATE TABLE IF NOT EXISTS public.advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL,
    person_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AYLIK PUANTAJ TABLOSU (puantaj)
CREATE TABLE IF NOT EXISTS public.puantaj (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month TEXT NOT NULL, -- YYYY-MM
    person_id UUID NOT NULL,
    person_name TEXT NOT NULL,
    title TEXT,
    work_days INTEGER DEFAULT 0,
    normal_hours NUMERIC DEFAULT 0,
    overtime_hours NUMERIC DEFAULT 0,
    leave_days INTEGER DEFAULT 0,
    sick_days INTEGER DEFAULT 0,
    missing_days INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by TEXT,
    locked_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (month, person_id)
);

-- 11. PUANTAJ KİLİT TABLOSU (puantaj_locks)
CREATE TABLE IF NOT EXISTS public.puantaj_locks (
    period TEXT PRIMARY KEY, -- YYYY-MM
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by TEXT,
    locked_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MAKBUZLAR TABLOSU (receipts)
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_no TEXT NOT NULL,
    company TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'bekliyor' CHECK (status IN ('kesildi', 'birikti', 'bekliyor', 'iptal')),
    crane_code TEXT,
    site TEXT,
    days_pending INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. GİDER VE YAKIT FİŞLERİ (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('yakit', 'masraf')),
    title TEXT NOT NULL,
    detail TEXT,
    amount NUMERIC NOT NULL,
    crane_code TEXT,
    person_name TEXT,
    station_or_supplier TEXT,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'iptal')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. DENETİM GÜNLÜĞÜ (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name TEXT NOT NULL,
    user_role TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT,
    details TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. BİLDİRİMLER (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    related_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. İNDEKSLER (Performans için)
CREATE INDEX IF NOT EXISTS idx_personnel_status ON public.personnel(status);
CREATE INDEX IF NOT EXISTS idx_personnel_pool ON public.personnel(pool_status);
CREATE INDEX IF NOT EXISTS idx_cranes_status ON public.cranes(status);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_kind ON public.approvals(kind);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_puantaj_month ON public.puantaj(month);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- 17. ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puantaj ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puantaj_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Güvenli ve şeffaf genel politikalar (Kimliği doğrulanmış kullanıcılar için tam erişim, anon okuma/yazma izni)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'profiles', 'personnel', 'cranes', 'approvals', 'attendance',
        'leaves', 'overtimes', 'advances', 'puantaj', 'puantaj_locks',
        'receipts', 'expenses', 'audit_logs', 'notifications'
    ]) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow authenticated full" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;
