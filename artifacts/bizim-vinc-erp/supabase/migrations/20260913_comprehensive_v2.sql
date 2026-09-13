-- ==============================================================================
-- BİZİM VİNÇ ERP - CANONICAL DATABASE MIGRATION (v2)
-- Tüm Modüller: Cari, Fatura, Makbuz, Tahsilat, Ödeme, Maaş/Bordro, Puantaj, Üyelik
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. KULLANICI PROFİLLERİ (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- auth.users.id
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'personel' CHECK (role IN ('admin', 'yonetici', 'muhasebe', 'puantor', 'personel', 'operasyon', 'operator')),
    phone TEXT,
    department TEXT,
    title TEXT,
    personnel_id UUID,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'pasif')),
    last_sign_in TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERSONEL (personnel)
CREATE TABLE IF NOT EXISTS public.personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_no TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    tc_no TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('operator', 'yardimci', 'idari')),
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'izinli', 'pasif')),
    pool_status TEXT NOT NULL DEFAULT 'musait' CHECK (pool_status IN ('gorevli', 'musait', 'havuzda')),
    department TEXT,
    salary NUMERIC DEFAULT 0,
    hourly_rate NUMERIC DEFAULT 0,
    iban TEXT,
    start_date DATE,
    end_date DATE,
    title TEXT NOT NULL,
    initials TEXT NOT NULL,
    card_slug TEXT,
    documents_ok BOOLEAN DEFAULT TRUE,
    cert_expiring BOOLEAN DEFAULT FALSE,
    notes TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÜYELİK VE PERSONEL EŞLEŞTİRME (memberships)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    user_full_name TEXT NOT NULL,
    requested_role TEXT NOT NULL DEFAULT 'personel',
    personnel_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
    matched_personnel_name TEXT,
    tc_hash_or_no TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approval_request_id UUID,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VİNÇLER (cranes)
CREATE TABLE IF NOT EXISTS public.cranes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'musait' CHECK (status IN ('sahada', 'musait', 'bakimda', 'arizali', 'pasif')),
    capacity TEXT NOT NULL,
    operator TEXT,
    site TEXT,
    last_service DATE NOT NULL DEFAULT CURRENT_DATE,
    lat NUMERIC NOT NULL DEFAULT 41.0082,
    lng NUMERIC NOT NULL DEFAULT 28.9784,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CARİ KARTLAR (customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL, -- Ünvan
    vkn_tckn TEXT,
    authorized_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    tax_office TEXT,
    balance NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ŞANTİYELER (sites)
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    location TEXT,
    contact_person TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'tamamlandi', 'askida')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. İŞ MAKBUZLARI (job_receipts)
CREATE TABLE IF NOT EXISTS public.job_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_no TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    site_name TEXT,
    crane_code TEXT NOT NULL,
    operator_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
    operator_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TEXT,
    end_time TEXT,
    working_hours NUMERIC DEFAULT 0,
    description TEXT,
    lines JSONB DEFAULT '[]'::jsonb,
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'invoiced')),
    invoiced BOOLEAN NOT NULL DEFAULT FALSE,
    invoice_id UUID,
    invoice_no TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FATURALAR (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    receipt_ids UUID[] DEFAULT ARRAY[]::UUID[],
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_rate NUMERIC NOT NULL DEFAULT 20,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'partial', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TAHSİLATLAR (collections)
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    invoice_no TEXT,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'havale' CHECK (payment_method IN ('havale', 'nakit', 'cek', 'kredi_karti')),
    status TEXT NOT NULL DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'tahsil_edildi', 'iptal')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ÖDEMELER (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_type TEXT NOT NULL DEFAULT 'tedarikci' CHECK (recipient_type IN ('personel', 'tedarikci', 'diger')),
    recipient_id UUID,
    recipient_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('maas', 'avans', 'yakit', 'bakim', 'kira', 'masraf', 'diger')),
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method TEXT DEFAULT 'havale' CHECK (payment_method IN ('havale', 'nakit', 'kredi_karti')),
    status TEXT NOT NULL DEFAULT 'bekliyor' CHECK (status IN ('bekliyor', 'odendi', 'iptal')),
    payroll_item_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ONAY TALEPLERİ (approval_requests)
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kind TEXT NOT NULL CHECK (kind IN ('uyelik_onay', 'makbuz', 'yoklama', 'mesai', 'avans', 'izin', 'yakit', 'masraf', 'genel')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    title TEXT NOT NULL,
    person_id UUID,
    person_name TEXT NOT NULL,
    person_initials TEXT,
    related_label TEXT,
    amount NUMERIC DEFAULT 0,
    requested_date DATE DEFAULT CURRENT_DATE,
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

-- 12. GÜNLÜK YOKLAMA (attendance_records)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
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

-- 13. MAAŞ DÖNEMLERİ (payroll_runs)
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month TEXT NOT NULL UNIQUE, -- YYYY-MM
    total_persons INTEGER NOT NULL DEFAULT 0,
    total_gross NUMERIC NOT NULL DEFAULT 0,
    total_net NUMERIC NOT NULL DEFAULT 0,
    total_overtime_pay NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    paid_at TIMESTAMPTZ,
    paid_by TEXT
);

-- 14. BORDRO KALEMLERİ (payroll_items)
CREATE TABLE IF NOT EXISTS public.payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE RESTRICT,
    personnel_name TEXT NOT NULL,
    title TEXT,
    iban TEXT,
    base_salary NUMERIC NOT NULL DEFAULT 0,
    work_days INTEGER NOT NULL DEFAULT 0,
    normal_hours NUMERIC NOT NULL DEFAULT 0,
    overtime_hours NUMERIC NOT NULL DEFAULT 0,
    overtime_pay NUMERIC NOT NULL DEFAULT 0,
    bonus NUMERIC NOT NULL DEFAULT 0,
    advances_deduction NUMERIC NOT NULL DEFAULT 0,
    other_deductions NUMERIC NOT NULL DEFAULT 0,
    net_salary NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    payment_method TEXT DEFAULT 'banka',
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. GİDER VE YAKIT FİŞLERİ (expenses)
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

-- 16. DENETİM GÜNLÜĞÜ (audit_logs)
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

-- 17. BİLDİRİMLER (notifications)
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

-- İNDEKSLER
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_title ON public.customers(title);
CREATE INDEX IF NOT EXISTS idx_job_receipts_customer ON public.job_receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_receipts_invoiced ON public.job_receipts(invoiced);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_payroll_items_month ON public.payroll_items(month);
CREATE INDEX IF NOT EXISTS idx_payroll_items_person ON public.payroll_items(personnel_id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'profiles', 'personnel', 'memberships', 'cranes', 'customers', 'sites',
        'job_receipts', 'invoices', 'collections', 'payments', 'approval_requests',
        'attendance_records', 'payroll_runs', 'payroll_items', 'expenses',
        'audit_logs', 'notifications'
    ]) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Allow authenticated full" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;
