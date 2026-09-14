-- 0031 — Kodun yazdığı ama tabloda olmayan alanları ekler (sessiz insert hatalarını giderir)
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS requested_date DATE;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS hours NUMERIC;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aktif';
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
