-- Maintenance and expense tracking categories.
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check CHECK (category IN ('yakit','masraf','servis','muayene','yag_bakimi'));
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS meter_reading NUMERIC;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS service_due_date DATE;
CREATE INDEX IF NOT EXISTS expenses_category_date_idx ON public.expenses(category, created_at DESC);
