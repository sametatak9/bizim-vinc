-- 0032_parasut_paket_accounting.sql
-- Paraşüt & p@ket muhasebe, fatura kalemleri, yazdırma şablonları ve cari risk alanları

-- 1. invoices tablosunu genişlet
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS printed_at timestamptz,
  ADD COLUMN IF NOT EXISTS template_id text DEFAULT 'standard_green',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'vinc_kiralama',
  ADD COLUMN IF NOT EXISTS e_status text DEFAULT 'taslak',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS withholding_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withholding_amount numeric DEFAULT 0;

-- 2. invoice_lines tablosu (fatura kalemleri)
CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'saatlik_kiralama',
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'saat',
  unit_price numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 20,
  tax_amount numeric GENERATED ALWAYS AS (ROUND(quantity * unit_price * tax_rate / 100.0, 2)) STORED,
  total_amount numeric GENERATED ALWAYS AS (ROUND(quantity * unit_price * (1 + tax_rate / 100.0), 2)) STORED,
  crane_id uuid REFERENCES public.cranes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. print_templates
CREATE TABLE IF NOT EXISTS public.print_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  header_color text DEFAULT '#16a34a',
  logo_url text,
  footer_note text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.print_templates (id, name, description, is_default, header_color, footer_note)
VALUES
  ('standard_green', 'Bizim Vinç Kurumsal Yeşil', 'Bizim Vinç resmi yeşil antetli A4 fatura şablonu', true, '#16a34a', 'İşbu fatura Bizim Vinç ERP sistemi üzerinden düzenlenmiştir. En derinden, en yükseklere.'),
  ('minimal_clean', 'Sade & Kompakt', 'Mali müşavir ve siyah-beyaz baskıya uygun sade şablon', false, '#1f2937', 'Resmi muhasebe dökümüdür.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 4. customers risk ve e-fatura alanları
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_status text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_efatura_mukellefi boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_term_days integer DEFAULT 30;

-- 5. incoming_documents stub
CREATE TABLE IF NOT EXISTS public.incoming_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_title text NOT NULL,
  sender_vkn text,
  doc_number text NOT NULL,
  doc_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'islem_bekliyor',
  expense_category text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_documents ENABLE ROW LEVEL SECURITY;

DO 748 BEGIN
  CREATE POLICY "Staff can view and manage invoice lines" ON public.invoice_lines FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END 748;

DO 748 BEGIN
  CREATE POLICY "Staff can view print templates" ON public.print_templates FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END 748;

DO 748 BEGIN
  CREATE POLICY "Staff can manage incoming documents" ON public.incoming_documents FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END 748;
