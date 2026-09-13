-- Public digital card RPC (anon-safe, minimal fields only)
CREATE OR REPLACE FUNCTION public.get_public_personnel_card(p_token text)
RETURNS TABLE (
  full_name text,
  title text,
  employee_no text,
  initials text,
  documents_ok boolean,
  cert_expiring boolean,
  card_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT
    p.full_name::text,
    COALESCE(p.title, 'Saha personeli')::text,
    COALESCE(p.employee_no, '')::text,
    COALESCE(
      NULLIF(p.initials, ''),
      upper(left(regexp_replace(p.full_name, '[^A-Za-zÇĞİÖŞÜçğıöşü ]', '', 'g'), 2))
    )::text,
    COALESCE(p.documents_ok, true),
    COALESCE(p.cert_expiring, false),
    p.card_slug::text
  FROM public.personnel p
  WHERE p.card_slug = p_token
     OR lower(COALESCE(p.employee_no, '')) = lower(p_token)
     OR p.id::text = p_token
  LIMIT 1;
$fn$;

REVOKE ALL ON FUNCTION public.get_public_personnel_card(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_personnel_card(text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_personnel_card(text) IS 'Public /kart/:token — only name, title, employee no, doc flags';
