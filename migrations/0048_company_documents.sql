-- 0048_company_documents.sql
-- Sirket kimligi belge kutuphanesi (08_KIRALAMA_MUHASEBE_KIMLIK paketi):
-- vergi levhasi, faaliyet belgesi, imza sirkuleri, kiralama sozlesmeleri,
-- satin alma evraklari, yakit tedarik sozlesmeleri. Tamamen ic/idari amacli
-- (public kartvizit yok) - is_office_staff() ile okunur, sadece founder/admin
-- yukler/siler. is_sensitive=true olanlar (orn. sifre formu) sadece
-- founder/admin tarafindan gorunur.

CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('sirket_kimlik', 'kiralama', 'satin_alma', 'yakit')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'company-docs',
  document_date date,
  is_sensitive boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_documents_category_idx ON public.company_documents (category);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_documents_office_read ON public.company_documents;
CREATE POLICY company_documents_office_read ON public.company_documents FOR SELECT TO authenticated
  USING (public.is_office_staff() AND (NOT is_sensitive OR public.is_founder_or_admin()));

DROP POLICY IF EXISTS company_documents_admin_write ON public.company_documents;
CREATE POLICY company_documents_admin_write ON public.company_documents FOR ALL TO authenticated
  USING (public.is_founder_or_admin()) WITH CHECK (public.is_founder_or_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-docs', 'company-docs', false, 10485760, ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS company_docs_storage_read ON storage.objects;
CREATE POLICY company_docs_storage_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company-docs' AND public.is_office_staff());

DROP POLICY IF EXISTS company_docs_storage_write ON storage.objects;
CREATE POLICY company_docs_storage_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-docs' AND public.is_founder_or_admin());

NOTIFY pgrst, 'reload schema';
