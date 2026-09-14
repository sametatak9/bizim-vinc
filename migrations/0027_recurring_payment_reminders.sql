ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.payment_obligations ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 2 CHECK (reminder_days_before BETWEEN 0 AND 30);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 2 CHECK (reminder_days_before BETWEEN 0 AND 30);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS recurring BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS payments_due_reminder_idx ON public.payments(status, due_date, reminder_days_before);
