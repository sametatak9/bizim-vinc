-- Attendance, overtime and payroll foundation.
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL, date DATE NOT NULL, check_in_time TEXT, check_out_time TEXT,
  status TEXT NOT NULL DEFAULT 'geldi', note TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, date)
);
CREATE TABLE IF NOT EXISTS public.overtimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL, date DATE NOT NULL, start_time TEXT, end_time TEXT, total_hours NUMERIC NOT NULL DEFAULT 0,
  overtime_type TEXT NOT NULL DEFAULT 'hafta_ici', description TEXT, status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), month TEXT NOT NULL UNIQUE, total_persons INTEGER NOT NULL DEFAULT 0,
  total_gross NUMERIC NOT NULL DEFAULT 0, total_net NUMERIC NOT NULL DEFAULT 0, total_overtime_pay NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE RESTRICT, month TEXT NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0, overtime_pay NUMERIC NOT NULL DEFAULT 0, advance_deduction NUMERIC NOT NULL DEFAULT 0,
  net_pay NUMERIC NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT NOW()
);
