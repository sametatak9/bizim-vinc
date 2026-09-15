-- 0040_public_card_documents_security_fix.sql
-- get_public_personnel_card_documents 'saglik' (KVKK ozel kategori) ve
-- 'adli_sicil' dokumanlarini is_sensitive'a bakmadan public karta
-- listeliyordu. Master'in acik talimati "isg public kart; saglik KVKK hayir".
CREATE OR REPLACE FUNCTION public.get_public_personnel_card_documents(p_token text)
 RETURNS TABLE(id uuid, document_type text, file_name text, expires_at date, created_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT d.id, d.document_type::text, d.file_name::text, d.expires_at, d.created_at
  FROM public.personnel_documents d
  JOIN public.personnel p ON p.id = d.personnel_id
  WHERE (p.card_slug = p_token OR lower(COALESCE(p.employee_no, '')) = lower(p_token) OR p.id::text = p_token)
    AND p.status <> 'pasif'
    AND d.is_sensitive = false
    AND d.document_type IN ('isg', 'myk', 'ehliyet', 'src')
  ORDER BY CASE d.document_type WHEN 'myk' THEN 1 WHEN 'isg' THEN 2 WHEN 'ehliyet' THEN 3 WHEN 'src' THEN 4 ELSE 9 END, d.created_at DESC;
$function$;

NOTIFY pgrst, 'reload schema';
