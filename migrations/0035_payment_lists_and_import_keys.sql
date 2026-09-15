-- 0035_payment_lists_and_import_keys.sql
-- V10: Liste fabrikası (payment_lists) + mükerrer kalkanı (import_key / dedupe_family)
-- + founder-only wipe RPC (cari/personel/kasa DOKUNULMAZ)
-- Idempotent.

-- 1) payments: import / dedupe alanları
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS external_import_key text,
  ADD COLUMN IF NOT EXISTS dedupe_family text,
  ADD COLUMN IF NOT EXISTS source_list_id uuid,
  ADD COLUMN IF NOT EXISTS revision_priority int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_migrated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS period_month text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS payments_external_import_key_uidx
  ON public.payments (external_import_key)
  WHERE external_import_key IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS payments_dedupe_family_idx
  ON public.payments (dedupe_family)
  WHERE dedupe_family IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS payments_period_month_idx ON public.payments (period_month);
CREATE INDEX IF NOT EXISTS payments_deleted_at_idx ON public.payments (deleted_at) WHERE deleted_at IS NULL;

-- 2) commercial_papers: import keys
ALTER TABLE public.commercial_papers
  ADD COLUMN IF NOT EXISTS external_import_key text,
  ADD COLUMN IF NOT EXISTS dedupe_family text,
  ADD COLUMN IF NOT EXISTS is_migrated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS commercial_papers_external_import_key_uidx
  ON public.commercial_papers (external_import_key)
  WHERE external_import_key IS NOT NULL AND deleted_at IS NULL;

-- 3) payment_obligations: import keys
ALTER TABLE public.payment_obligations
  ADD COLUMN IF NOT EXISTS external_import_key text,
  ADD COLUMN IF NOT EXISTS is_migrated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS payment_obligations_external_import_key_uidx
  ON public.payment_obligations (external_import_key)
  WHERE external_import_key IS NOT NULL AND deleted_at IS NULL;

-- 4) payment_lists + payment_list_items (N:N köprü)
CREATE TABLE IF NOT EXISTS public.payment_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'mixed'
    CHECK (kind IN ('odeme', 'tahsilat', 'cek_senet', 'mixed')),
  year int,
  source text,
  revision_priority int NOT NULL DEFAULT 0,
  notes text,
  deleted_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_lists_deleted_at_idx
  ON public.payment_lists (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS payment_lists_year_idx ON public.payment_lists (year);

CREATE TABLE IF NOT EXISTS public.payment_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.payment_lists(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  commercial_paper_id uuid REFERENCES public.commercial_papers(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_list_items_one_ref CHECK (
    (payment_id IS NOT NULL AND commercial_paper_id IS NULL)
    OR (payment_id IS NULL AND commercial_paper_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_list_items_list_payment_uidx
  ON public.payment_list_items (list_id, payment_id) WHERE payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_list_items_list_paper_uidx
  ON public.payment_list_items (list_id, commercial_paper_id) WHERE commercial_paper_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payment_list_items_list_id_idx ON public.payment_list_items (list_id);

DO $$ BEGIN
  ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_source_list_id_fkey;
  ALTER TABLE public.payments
    ADD CONSTRAINT payments_source_list_id_fkey
    FOREIGN KEY (source_list_id) REFERENCES public.payment_lists(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 5) RLS
ALTER TABLE public.payment_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_lists_office_all ON public.payment_lists;
CREATE POLICY payment_lists_office_all ON public.payment_lists FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());

DROP POLICY IF EXISTS payment_list_items_office_all ON public.payment_list_items;
CREATE POLICY payment_list_items_office_all ON public.payment_list_items FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());

-- 6) Founder-only wipe: ödeme planı / çek-senet / listeler
-- KORUNAN: customers, personnel, opening_balances, kasa_hareket_log, invoices, job_receipts, auth
CREATE OR REPLACE FUNCTION public.wipe_payment_plan_data(p_import_type text DEFAULT 'payment_plan_wipe')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_counts jsonb;
  v_payments int;
  v_obligations int;
  v_papers int;
  v_list_items int;
  v_lists int;
  v_collections int;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'founder' AND NOT public.is_founder_or_admin() THEN
    RAISE EXCEPTION 'wipe_payment_plan_data: sadece founder/admin';
  END IF;

  SELECT count(*) INTO v_payments FROM public.payments;
  SELECT count(*) INTO v_obligations FROM public.payment_obligations;
  SELECT count(*) INTO v_papers FROM public.commercial_papers;
  SELECT count(*) INTO v_list_items FROM public.payment_list_items;
  SELECT count(*) INTO v_lists FROM public.payment_lists;
  SELECT count(*) INTO v_collections FROM public.collections WHERE COALESCE(is_migrated, false) = true;

  DELETE FROM public.payment_list_items;
  DELETE FROM public.payment_lists;
  DELETE FROM public.payment_receipts WHERE payment_id IN (SELECT id FROM public.payments);
  DELETE FROM public.payments;
  DELETE FROM public.payment_obligations;
  DELETE FROM public.commercial_papers;

  DELETE FROM public.receivable_details
    WHERE collection_id IN (SELECT id FROM public.collections WHERE COALESCE(is_migrated, false) = true);
  DELETE FROM public.collections WHERE COALESCE(is_migrated, false) = true;

  IF to_regclass('public.odemeler_plani') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.odemeler_plani';
  END IF;

  IF to_regclass('public.import_batches') IS NOT NULL THEN
    INSERT INTO public.import_batches (id, import_type, status, meta, created_at)
    VALUES (
      gen_random_uuid(),
      p_import_type,
      'completed',
      jsonb_build_object(
        'wiped_payments', v_payments,
        'wiped_obligations', v_obligations,
        'wiped_papers', v_papers,
        'wiped_lists', v_lists,
        'wiped_list_items', v_list_items,
        'wiped_migrated_collections', v_collections,
        'at', now()
      ),
      now()
    );
  END IF;

  v_counts := jsonb_build_object(
    'payments', v_payments,
    'obligations', v_obligations,
    'commercial_papers', v_papers,
    'payment_lists', v_lists,
    'payment_list_items', v_list_items,
    'migrated_collections', v_collections
  );
  RETURN v_counts;
END;
$$;

REVOKE ALL ON FUNCTION public.wipe_payment_plan_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wipe_payment_plan_data(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
