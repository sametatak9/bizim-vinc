CREATE TABLE IF NOT EXISTS public.crane_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crane_id UUID NOT NULL REFERENCES public.cranes(id) ON DELETE CASCADE,
  external_vehicle_id TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed_kmh NUMERIC,
  heading NUMERIC,
  provider TEXT NOT NULL DEFAULT 'manual',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS crane_telemetry_crane_time_idx ON public.crane_telemetry(crane_id, recorded_at DESC);
ALTER TABLE public.crane_telemetry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crane_telemetry_staff_access ON public.crane_telemetry;
CREATE POLICY crane_telemetry_staff_access ON public.crane_telemetry FOR SELECT TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('yonetici','muhasebe','operasyon','operator'))
);
DROP POLICY IF EXISTS crane_telemetry_manage_admin ON public.crane_telemetry;
CREATE POLICY crane_telemetry_manage_admin ON public.crane_telemetry FOR ALL TO authenticated USING (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('founder','admin','yonetici','operasyon'))
) WITH CHECK (
  public.is_founder_or_admin() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'aktif' AND p.role IN ('founder','admin','yonetici','operasyon'))
);
