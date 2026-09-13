-- Every Supabase Auth signup must create both a pending profile and a visible
-- membership request so the founder/admin onboarding queue is complete.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  phone_value TEXT := NULLIF(NEW.raw_user_meta_data->>'phone', '');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, status, allowed_tabs)
  VALUES (NEW.id, NEW.email, display_name, phone_value, 'personel', 'pending', ARRAY['/operator','/kart'])
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

  INSERT INTO public.memberships (user_id, user_email, user_full_name, phone, requested_role, status)
  VALUES (NEW.id, NEW.email, display_name, phone_value, 'personel', 'pending')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
