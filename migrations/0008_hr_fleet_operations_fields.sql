-- HR certificate and fleet maintenance/telemetry foundation.
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS certificate_expires_at DATE;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS meter_hours NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS next_service_hours NUMERIC;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS next_service_date DATE;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS telemetry_provider TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS telemetry_last_seen TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS cranes_next_service_date_idx ON public.cranes(next_service_date);
