-- Phase 1: personnel required fields, dynamic personnel types, and secure documents.

ALTER TABLE public.personnel
  ADD COLUMN IF NOT EXISTS personnel_type_id UUID;

CREATE TABLE IF NOT EXISTS public.personnel_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.personnel_types (name)
VALUES ('Operatör'), ('Yardımcı / Yağcı'), ('İdari / Şef')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.personnel
  ADD CONSTRAINT personnel_salary_nonnegative CHECK (salary IS NULL OR salary >= 0);

CREATE OR REPLACE FUNCTION public.validate_personnel_required_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.salary IS NULL THEN
    RAISE EXCEPTION 'Personel maaşı zorunludur.' USING ERRCODE = '23514';
  END IF;
  IF NEW.start_date IS NULL THEN
    RAISE EXCEPTION 'Personel işe giriş tarihi zorunludur.' USING ERRCODE = '23514';
  END IF;
  IF NEW.status = 'pasif' AND NEW.end_date IS NULL THEN
    RAISE EXCEPTION 'Pasif personel için çıkış tarihi zorunludur.' USING ERRCODE = '23514';
  END IF;
  IF NEW.status <> 'pasif' AND NEW.end_date IS NOT NULL THEN
    RAISE EXCEPTION 'Aktif personelin çıkış tarihi boş olmalıdır.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS personnel_required_fields_trigger ON public.personnel;
CREATE TRIGGER personnel_required_fields_trigger
  BEFORE INSERT OR UPDATE ON public.personnel
  FOR EACH ROW EXECUTE FUNCTION public.validate_personnel_required_fields();

CREATE TABLE IF NOT EXISTS public.personnel_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('isg', 'myk', 'ehliyet', 'src', 'saglik', 'adli_sicil', 'diger')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  storage_bucket TEXT NOT NULL DEFAULT 'personnel-documents',
  expires_at DATE,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personnel_documents_personnel_idx ON public.personnel_documents(personnel_id);

ALTER TABLE public.personnel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personnel_types_read_authenticated ON public.personnel_types;
CREATE POLICY personnel_types_read_authenticated ON public.personnel_types
  FOR SELECT TO authenticated USING (is_active = TRUE OR public.is_founder_or_admin());

DROP POLICY IF EXISTS personnel_types_manage_admin ON public.personnel_types;
CREATE POLICY personnel_types_manage_admin ON public.personnel_types
  FOR ALL TO authenticated
  USING (public.is_founder_or_admin())
  WITH CHECK (public.is_founder_or_admin());

DROP POLICY IF EXISTS personnel_documents_read_scoped ON public.personnel_documents;
CREATE POLICY personnel_documents_read_scoped ON public.personnel_documents
  FOR SELECT TO authenticated
  USING (
    (NOT is_sensitive AND (
      personnel_id = (SELECT personnel_id FROM public.profiles WHERE id = auth.uid())
      OR public.is_founder_or_admin()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici', 'muhasebe'))
    ))
    OR (is_sensitive AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('founder', 'admin', 'yonetici')
    ))
  );

DROP POLICY IF EXISTS personnel_documents_manage_admin ON public.personnel_documents;
CREATE POLICY personnel_documents_manage_admin ON public.personnel_documents
  FOR ALL TO authenticated
  USING (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici', 'muhasebe')))
  WITH CHECK (public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici', 'muhasebe')));

INSERT INTO storage.buckets (id, name, public)
VALUES ('personnel-documents', 'personnel-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS personnel_documents_storage_read ON storage.objects;
CREATE POLICY personnel_documents_storage_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'personnel-documents' AND (
    public.is_founder_or_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici', 'muhasebe'))
    OR (storage.foldername(name))[1] = (SELECT personnel_id::text FROM public.profiles WHERE id = auth.uid())
  ));

DROP POLICY IF EXISTS personnel_documents_storage_write ON storage.objects;
CREATE POLICY personnel_documents_storage_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'personnel-documents' AND (
    public.is_founder_or_admin()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('yonetici', 'muhasebe'))
  ));
