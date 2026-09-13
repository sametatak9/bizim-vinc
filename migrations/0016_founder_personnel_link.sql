-- Phase 10: founder must be visible in personnel and self-service flows.
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS personnel_user_id_unique ON public.personnel(user_id) WHERE user_id IS NOT NULL;

INSERT INTO public.personnel (
  id, employee_no, full_name, phone, email, kind, status, pool_status,
  department, salary, start_date, title, initials, card_slug, documents_ok, notes, user_id
)
SELECT
  gen_random_uuid(), 'FND-001', p.full_name, COALESCE(p.phone, ''), p.email, 'idari', 'aktif', 'musait',
  'Yönetim', 0, CURRENT_DATE, 'Kurucu / Genel Yönetim', 'SA', 'samet-ata', TRUE,
  'Founder hesabı için sistem personel kaydı.', p.id
FROM public.profiles p
WHERE p.email = 'sametatak9@gmail.com'
  AND lower(p.role::text) = 'founder'
  AND NOT EXISTS (SELECT 1 FROM public.personnel x WHERE x.user_id = p.id OR x.employee_no = 'FND-001');

UPDATE public.profiles p
SET personnel_id = x.id, updated_at = NOW()
FROM public.personnel x
WHERE p.email = 'sametatak9@gmail.com'
  AND lower(p.role::text) = 'founder'
  AND x.user_id = p.id
  AND p.personnel_id IS DISTINCT FROM x.id;
