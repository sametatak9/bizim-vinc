-- Phase 12: profile avatar storage and profile field support.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', FALSE) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS profile_avatars_read ON storage.objects;
CREATE POLICY profile_avatars_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'profile-avatars' AND (owner_id = auth.uid()::text OR public.is_founder_or_admin()));
DROP POLICY IF EXISTS profile_avatars_write ON storage.objects;
CREATE POLICY profile_avatars_write ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-avatars' AND owner_id = auth.uid()::text);
DROP POLICY IF EXISTS profile_avatars_update ON storage.objects;
CREATE POLICY profile_avatars_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-avatars' AND owner_id = auth.uid()::text) WITH CHECK (bucket_id = 'profile-avatars' AND owner_id = auth.uid()::text);
