-- Align live legacy personnel/cranes schemas with the canonical app CRUD payloads.
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS tc_no TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS salary NUMERIC DEFAULT 0;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'operator';
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS card_slug TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS operator TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS notes TEXT;
