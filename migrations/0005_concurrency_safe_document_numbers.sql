-- Concurrency-safe document numbering. The row update locks the sequence transactionally.
CREATE OR REPLACE FUNCTION public.next_document_number(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_value BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'aktif'
      AND role IN ('founder','admin','yonetici','muhasebe','operasyon','operator')
  ) THEN
    RAISE EXCEPTION 'active staff role required';
  END IF;

  UPDATE public.number_sequences
  SET next_value = next_value + 1, updated_at = NOW()
  WHERE key = p_key
  RETURNING prefix, next_value - 1 INTO v_prefix, v_value;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown number sequence: %', p_key;
  END IF;

  RETURN v_prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_value::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_document_number(TEXT) TO authenticated;
