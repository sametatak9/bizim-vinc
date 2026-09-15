-- 0044_filo_kartvizit.sql
-- Filo / arac kartviziti (personel kartviziti ile paralel model):
-- her vinc AYRI kimlik (plaka bazli) + kendi belgeleri (filo-docs/{crane_id}/...)
-- + genel bakim/muayene/sigorta sayaclari + public /filo-kart/:token yuzu.
--
-- ONEMLI: bitis tarihi (expires_at) alanlari BILEREK NULL birakiliyor - pilot
-- evrak paketindeki dosya adlarinda sadece belgenin YUKLENME/DUZENLENME tarihi
-- var, gercek police/muayene BITIS tarihi degil. Sahte/tahmini bitis tarihi
-- yazmak yerine bos birakildi; ileride biri gercek bitis tarihini elle girene
-- kadar sayac "bilinmiyor" gosterecek.

-- 1) cranes: kimlik + sayac alanlari
ALTER TABLE public.cranes
  ADD COLUMN IF NOT EXISTS plate text,
  ADD COLUMN IF NOT EXISTS team text,
  ADD COLUMN IF NOT EXISTS tonnage numeric,
  ADD COLUMN IF NOT EXISTS metre numeric,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS card_slug text,
  ADD COLUMN IF NOT EXISTS ruhsat_no text,
  ADD COLUMN IF NOT EXISTS trafik_sigorta_bitis date,
  ADD COLUMN IF NOT EXISTS kasko_bitis date,
  ADD COLUMN IF NOT EXISTS muayene_bitis date,
  ADD COLUMN IF NOT EXISTS periyodik_kontrol_bitis date,
  ADD COLUMN IF NOT EXISTS bakim_sonraki date;

CREATE UNIQUE INDEX IF NOT EXISTS cranes_card_slug_key ON public.cranes (card_slug) WHERE card_slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cranes_plate_key ON public.cranes (plate) WHERE plate IS NOT NULL;

-- 2) crane_documents (personnel_documents ile ayni desen)
CREATE TABLE IF NOT EXISTS public.crane_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crane_id uuid NOT NULL REFERENCES public.cranes(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('ruhsat', 'trafik_sigorta', 'kasko', 'muayene', 'tum_evraklar', 'diger')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'filo-docs',
  document_date date,
  expires_at date,
  is_sensitive boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crane_documents_crane_id_idx ON public.crane_documents (crane_id);

ALTER TABLE public.crane_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crane_documents_office_all ON public.crane_documents;
CREATE POLICY crane_documents_office_all ON public.crane_documents FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());

-- 3) Storage bucket + RLS (personnel-documents ile ayni desen, sadece ofis personeli yazabilir/okuyabilir;
--    public erisim yalnizca asagidaki SECURITY DEFINER RPC + edge function uzerinden, imzali URL ile)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('filo-docs', 'filo-docs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS filo_docs_storage_read ON storage.objects;
CREATE POLICY filo_docs_storage_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'filo-docs' AND public.is_office_staff());

DROP POLICY IF EXISTS filo_docs_storage_write ON storage.objects;
CREATE POLICY filo_docs_storage_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'filo-docs' AND public.is_office_staff());

-- 4) Public kartvizit RPC'leri (get_public_personnel_card* ile ayni desen)
CREATE OR REPLACE FUNCTION public.get_public_crane_card(p_token text)
 RETURNS TABLE(
   code text, plate text, team text, tonnage numeric, metre numeric, brand text,
   status text, card_slug text,
   trafik_sigorta_bitis date, kasko_bitis date, muayene_bitis date,
   periyodik_kontrol_bitis date, bakim_sonraki date
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    c.code::text, c.plate::text, c.team::text, c.tonnage, c.metre, c.brand::text,
    c.status::text, c.card_slug::text,
    c.trafik_sigorta_bitis, c.kasko_bitis, c.muayene_bitis,
    c.periyodik_kontrol_bitis, c.bakim_sonraki
  FROM public.cranes c
  WHERE c.card_slug = p_token
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_crane_card_documents(p_token text)
 RETURNS TABLE(id uuid, document_type text, file_name text, document_date date, expires_at date, created_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT d.id, d.document_type::text, d.file_name::text, d.document_date, d.expires_at, d.created_at
  FROM public.crane_documents d
  JOIN public.cranes c ON c.id = d.crane_id
  WHERE c.card_slug = p_token
    AND d.is_sensitive = false
  ORDER BY CASE d.document_type
    WHEN 'ruhsat' THEN 1 WHEN 'trafik_sigorta' THEN 2 WHEN 'kasko' THEN 3
    WHEN 'muayene' THEN 4 WHEN 'tum_evraklar' THEN 5 ELSE 9 END, d.created_at DESC;
$function$;

NOTIFY pgrst, 'reload schema';
