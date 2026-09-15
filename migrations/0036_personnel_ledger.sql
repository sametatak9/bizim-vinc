-- 0036_personnel_ledger.sql
-- FAZ 1: Personel Detay — cari hesap gibi işleyen personel bakiye defteri.
-- Yevmiye/mesai hak edişleri (pozitif tutar) ile ödeme/avans düşümleri (negatif
-- tutar) tek bir kronolojik akışta tutulur; bakiye, /personel/:id ekranında
-- bu satırların kümülatif toplamı olarak hesaplanır (ayrı bir "balance" kolonu
-- tutulmaz — tek doğruluk kaynağı bu tablo).
-- Idempotent — birden fazla kez çalıştırılabilir.

CREATE TABLE IF NOT EXISTS public.personnel_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('yevmiye', 'mesai', 'odeme', 'avans', 'izin', 'diger')),
  entry_date date NOT NULL,
  -- Pozitif: personel alacağını artırır (yevmiye/mesai hak edişi).
  -- Negatif: personele yapılan ödeme veya avans düşümü.
  amount numeric NOT NULL CHECK (amount <> 0),
  description text,
  -- Bu satırın kaynaklandığı tabloya opsiyonel referans (overtimes, advances,
  -- payroll_items, attendance_records...) — denetim izi için.
  reference_table text,
  reference_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personnel_ledger_entries_personnel_date_idx
  ON public.personnel_ledger_entries (personnel_id, entry_date);
CREATE INDEX IF NOT EXISTS personnel_ledger_entries_type_idx
  ON public.personnel_ledger_entries (entry_type);

ALTER TABLE public.personnel_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personnel_ledger_entries_office_all ON public.personnel_ledger_entries;
CREATE POLICY personnel_ledger_entries_office_all ON public.personnel_ledger_entries FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());

-- Personel kendi defterini salt-okunur görebilir (cari ekstresi gibi).
DROP POLICY IF EXISTS personnel_ledger_entries_self_scope ON public.personnel_ledger_entries;
CREATE POLICY personnel_ledger_entries_self_scope ON public.personnel_ledger_entries FOR SELECT TO authenticated
  USING (personnel_id = public.my_personnel_id());

NOTIFY pgrst, 'reload schema';
