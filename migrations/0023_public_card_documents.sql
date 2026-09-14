-- Public digital card documents: metadata only. File bytes remain private.
-- The actual file URL is created by the public-card-document Edge Function
-- after validating both the card token and document id.

CREATE OR REPLACE FUNCTION public.get_public_personnel_card_documents(p_token text)
RETURNS TABLE (
  id uuid,
  document_type text,
  file_name text,
  expires_at date,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT
    d.id,
    d.document_type::text,
    d.file_name::text,
    d.expires_at,
    d.created_at
  FROM public.personnel_documents d
  JOIN public.personnel p ON p.id = d.personnel_id
  WHERE (p.card_slug = p_token
     OR lower(COALESCE(p.employee_no, '')) = lower(p_token)
     OR p.id::text = p_token)
    AND p.status <> 'pasif'
    AND d.document_type IN ('isg', 'myk', 'ehliyet', 'src', 'saglik', 'adli_sicil')
  ORDER BY
    CASE d.document_type
      WHEN 'myk' THEN 1
      WHEN 'isg' THEN 2
      WHEN 'ehliyet' THEN 3
      WHEN 'src' THEN 4
      WHEN 'saglik' THEN 5
      WHEN 'adli_sicil' THEN 6
      ELSE 9
    END,
    d.created_at DESC;
$fn$;

REVOKE ALL ON FUNCTION public.get_public_personnel_card_documents(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_personnel_card_documents(text) TO anon, authenticated;
COMMENT ON FUNCTION public.get_public_personnel_card_documents(text) IS
  'Public card returns safe professional document metadata only; no storage path or sensitive fields.';
