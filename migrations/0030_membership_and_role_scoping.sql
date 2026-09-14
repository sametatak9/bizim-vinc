-- ============================================================
-- 0030 — Üyelik akışı + rol bazlı erişim sıkılaştırması
--  KRİTİK: Bu migration öncesinde `is_active_staff()` fonksiyonu
--  'personel' ve 'operator' rollerini de kapsıyordu; bu yüzden dışarıdaki
--  bir personel hesabı cari, fatura, tahsilat, ödeme ve tüm iş makbuzlarını
--  okuyup değiştirebiliyordu. Ayrıca profiles UPDATE politikası kullanıcının
--  kendi `role`/`status` alanını değiştirmesine izin veriyordu (yetki yükseltme).
-- ============================================================

-- ------------------------------------------------------------
-- 1) Yardımcı fonksiyonlar
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_personnel_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT personnel_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Ofis/yönetim tarafı: ERP ekranlarını kullanan roller
CREATE OR REPLACE FUNCTION public.is_office_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(COALESCE(p.status::text,'')) IN ('aktif','active')
      AND lower(p.role::text) IN ('founder','admin','yonetici','muhasebe','puantor','operasyon')
  );
$$;

-- Saha tarafı: yalnızca kendi taleplerini yönetebilen roller
CREATE OR REPLACE FUNCTION public.is_self_service_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(COALESCE(p.status::text,'')) IN ('aktif','active')
      AND lower(p.role::text) IN ('personel','operator')
  );
$$;

-- Makbuz kesme yetkisi: rolü operator olan ya da personel kartı operatör olanlar
CREATE OR REPLACE FUNCTION public.can_create_job_receipt()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN public.personnel n ON n.id = p.personnel_id
    WHERE p.id = auth.uid()
      AND lower(COALESCE(p.status::text,'')) IN ('aktif','active')
      AND (lower(p.role::text) = 'operator' OR n.kind = 'operator')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.my_personnel_id(), public.is_office_staff(),
  public.is_self_service_user(), public.can_create_job_receipt() FROM anon;

-- ------------------------------------------------------------
-- 2) Yetki yükseltmeyi engelle
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- auth.uid() NULL ise çağrı service_role / SQL konsolu üzerindendir (migration, bakım işleri)
  IF auth.uid() IS NULL OR public.is_founder_or_admin() THEN RETURN NEW; END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.personnel_id IS DISTINCT FROM OLD.personnel_id
     OR NEW.allowed_tabs IS DISTINCT FROM OLD.allowed_tabs THEN
    RAISE EXCEPTION 'Rol, hesap durumu ve personel bağı yalnızca kurucu veya admin tarafından değiştirilebilir.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_guard_privileges ON public.profiles;
CREATE TRIGGER profiles_guard_privileges BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileges() FROM anon;

-- ------------------------------------------------------------
-- 3) Talep tablolarına kişi bağı (RLS için şart)
-- ------------------------------------------------------------
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE public.approvals a SET person_id = n.id
  FROM public.personnel n WHERE a.person_id IS NULL AND lower(n.full_name) = lower(a.person_name);
CREATE INDEX IF NOT EXISTS approvals_person_idx ON public.approvals(person_id, status);

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE public.expenses e SET person_id = n.id
  FROM public.personnel n WHERE e.person_id IS NULL AND lower(n.full_name) = lower(e.person_name);

-- ------------------------------------------------------------
-- 4) Politikaları rol bazına çek
-- ------------------------------------------------------------
-- 4a) Sadece ofis/finans: ticari ve finansal tablolar
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['payments','collections','invoices','quotes','contracts','receipts',
                           'number_sequences','bank_transactions','approval_requests','payment_obligations']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_staff_access', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_office_all', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
                      USING (public.is_office_staff()) WITH CHECK (public.is_office_staff())$f$,
                   t || '_office_all', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS bank_transactions_finance_read ON public.bank_transactions;

-- 4b) Ortak veri: ofis yazar, saha yalnızca okur (makbuz formu için gerekli)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','sites','cranes']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_staff_access', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'finance_staff_access', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_office_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_self_read', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
                      USING (public.is_office_staff()) WITH CHECK (public.is_office_staff())$f$,
                   t || '_office_all', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
                      USING (public.is_self_service_user())$f$, t || '_self_read', t);
  END LOOP;
END $$;

-- 4c) İş makbuzları: operatör yalnızca kendi makbuzunu görür ve oluşturur
DROP POLICY IF EXISTS job_receipts_staff_access ON public.job_receipts;
DROP POLICY IF EXISTS job_receipts_office_all ON public.job_receipts;
DROP POLICY IF EXISTS job_receipts_self_read ON public.job_receipts;
DROP POLICY IF EXISTS job_receipts_self_insert ON public.job_receipts;
CREATE POLICY job_receipts_office_all ON public.job_receipts FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());
CREATE POLICY job_receipts_self_read ON public.job_receipts FOR SELECT TO authenticated
  USING (operator_id IS NOT NULL AND operator_id = public.my_personnel_id());
CREATE POLICY job_receipts_self_insert ON public.job_receipts FOR INSERT TO authenticated
  WITH CHECK (public.can_create_job_receipt()
              AND operator_id = public.my_personnel_id()
              AND status IN ('pending_approval','beklemede','onay_bekliyor'));

-- 4d) Onay talepleri: saha kendi talebini açar/görür, karar ofiste
DROP POLICY IF EXISTS approvals_staff_access ON public.approvals;
DROP POLICY IF EXISTS approvals_office_all ON public.approvals;
DROP POLICY IF EXISTS approvals_self_read ON public.approvals;
DROP POLICY IF EXISTS approvals_self_insert ON public.approvals;
CREATE POLICY approvals_office_all ON public.approvals FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());
CREATE POLICY approvals_self_read ON public.approvals FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR (person_id IS NOT NULL AND person_id = public.my_personnel_id()));
CREATE POLICY approvals_self_insert ON public.approvals FOR INSERT TO authenticated
  WITH CHECK (public.is_self_service_user()
              AND created_by = auth.uid()
              AND person_id = public.my_personnel_id()
              AND status IN ('pending','bekliyor'));

-- 4e) Puantaj / mesai / masraf: kendi kaydı
DROP POLICY IF EXISTS attendance_records_staff_access ON public.attendance_records;
DROP POLICY IF EXISTS staff_attendance_access ON public.attendance_records;
DROP POLICY IF EXISTS attendance_office_all ON public.attendance_records;
DROP POLICY IF EXISTS attendance_self_scope ON public.attendance_records;
CREATE POLICY attendance_office_all ON public.attendance_records FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());
CREATE POLICY attendance_self_scope ON public.attendance_records FOR SELECT TO authenticated
  USING (person_id = public.my_personnel_id());
CREATE POLICY attendance_self_insert ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (person_id = public.my_personnel_id());

DROP POLICY IF EXISTS overtimes_staff_access ON public.overtimes;
DROP POLICY IF EXISTS staff_overtime_access ON public.overtimes;
DROP POLICY IF EXISTS overtimes_office_all ON public.overtimes;
DROP POLICY IF EXISTS overtimes_self_scope ON public.overtimes;
CREATE POLICY overtimes_office_all ON public.overtimes FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());
CREATE POLICY overtimes_self_scope ON public.overtimes FOR SELECT TO authenticated
  USING (person_id = public.my_personnel_id());
CREATE POLICY overtimes_self_insert ON public.overtimes FOR INSERT TO authenticated
  WITH CHECK (person_id = public.my_personnel_id());

DROP POLICY IF EXISTS expenses_staff_access ON public.expenses;
DROP POLICY IF EXISTS expenses_office_all ON public.expenses;
DROP POLICY IF EXISTS expenses_self_scope ON public.expenses;
CREATE POLICY expenses_office_all ON public.expenses FOR ALL TO authenticated
  USING (public.is_office_staff()) WITH CHECK (public.is_office_staff());
CREATE POLICY expenses_self_scope ON public.expenses FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR person_id = public.my_personnel_id());
CREATE POLICY expenses_self_insert ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.is_self_service_user() AND created_by = auth.uid());

-- 4f) Bordro: çalışan yalnızca kendi maaş kaydını görür
DROP POLICY IF EXISTS payroll_payments_staff_read ON public.payroll_payments;
DROP POLICY IF EXISTS payroll_payments_scope_read ON public.payroll_payments;
CREATE POLICY payroll_payments_scope_read ON public.payroll_payments FOR SELECT TO authenticated
  USING (public.is_finance_staff() OR personnel_id = public.my_personnel_id());
DROP POLICY IF EXISTS payroll_items_self_read ON public.payroll_items;
CREATE POLICY payroll_items_self_read ON public.payroll_items FOR SELECT TO authenticated
  USING (personnel_id = public.my_personnel_id());

-- ------------------------------------------------------------
-- 5) Üyelik başvurusu: TC ile otomatik personel eşleştirme
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.default_allowed_tabs(p_role TEXT)
RETURNS TEXT[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(p_role)
    WHEN 'founder' THEN ARRAY['*']
    WHEN 'admin' THEN ARRAY['*']
    WHEN 'yonetici' THEN ARRAY['/','/faturalar','/cariler','/personel','/puantaj','/onay','/filo','/finans','/finans-planlama','/teklifler','/operator']
    WHEN 'muhasebe' THEN ARRAY['/','/faturalar','/cariler','/finans','/finans-planlama','/onay','/personel']
    WHEN 'puantor' THEN ARRAY['/','/puantaj','/personel','/onay','/operator']
    WHEN 'operasyon' THEN ARRAY['/','/filo','/puantaj','/faturalar','/operator','/onay']
    WHEN 'isyeri_hekimi' THEN ARRAY['/','/personel']
    ELSE ARRAY['/operator','/kart']
  END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  display_name TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1));
  phone_value  TEXT := NULLIF(NEW.raw_user_meta_data->>'phone','');
  tc_raw       TEXT := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'tc_no',''), '\D', '', 'g');
  wanted_role  TEXT := lower(COALESCE(NEW.raw_user_meta_data->>'requested_role','personel'));
  tc_hashed    TEXT;
  matched      RECORD;
BEGIN
  IF wanted_role NOT IN ('personel','operator') THEN wanted_role := 'personel'; END IF;

  IF length(tc_raw) = 11 THEN
    tc_hashed := encode(digest('bizim-vinc:tc:' || tc_raw, 'sha256'), 'hex');
    SELECT id, full_name, kind INTO matched FROM public.personnel WHERE tc_hash = tc_hashed LIMIT 1;
  END IF;

  IF matched.kind = 'operator' THEN wanted_role := 'operator'; END IF;

  INSERT INTO public.profiles (id,email,full_name,phone,role,status,allowed_tabs)
  VALUES (NEW.id, NEW.email, display_name, phone_value, 'personel', 'pending', ARRAY['/operator','/kart'])
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

  INSERT INTO public.memberships (user_id,user_email,user_full_name,phone,requested_role,status,personnel_id,tc_hash_or_no)
  VALUES (NEW.id, NEW.email, display_name, phone_value, wanted_role, 'pending', matched.id, tc_hashed)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$;

-- Üyelik onayı: rol + personel bağı + sekme yetkileri tek işlemde
CREATE OR REPLACE FUNCTION public.approve_membership(p_membership_id UUID, p_role TEXT DEFAULT NULL, p_personnel_id UUID DEFAULT NULL)
RETURNS public.memberships LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.memberships; final_role TEXT; final_person UUID;
BEGIN
  IF NOT public.is_founder_or_admin() THEN
    RAISE EXCEPTION 'Üyelik onayı yalnızca kurucu veya admin tarafından yapılabilir.';
  END IF;
  SELECT * INTO m FROM public.memberships WHERE id = p_membership_id;
  IF m.id IS NULL THEN RAISE EXCEPTION 'Üyelik başvurusu bulunamadı.'; END IF;

  final_role   := lower(COALESCE(p_role, m.requested_role, 'personel'));
  final_person := COALESCE(p_personnel_id, m.personnel_id);

  IF final_person IS NULL AND final_role IN ('personel','operator') THEN
    RAISE EXCEPTION 'Bu üyelik bir personel kartına bağlanmadan onaylanamaz (TC eşleşmesi veya manuel seçim gerekli).';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE personnel_id = final_person AND id <> m.user_id) THEN
    RAISE EXCEPTION 'Bu personel kartı başka bir kullanıcı hesabına bağlı.';
  END IF;

  UPDATE public.profiles
     SET role = final_role, status = 'aktif', personnel_id = final_person,
         allowed_tabs = public.default_allowed_tabs(final_role), updated_at = now()
   WHERE id = m.user_id;

  UPDATE public.memberships
     SET status = 'approved', requested_role = final_role, personnel_id = final_person,
         approved_by = auth.uid(), approved_at = now(), updated_at = now()
   WHERE id = p_membership_id
  RETURNING * INTO m;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (m.user_id, 'Üyeliğiniz onaylandı',
          format('Hesabınız %s yetkisiyle aktifleştirildi. Giriş yapabilirsiniz.', final_role), 'success');

  INSERT INTO public.audit_logs (action, module, record_id, description, user_id, user_role)
  VALUES ('UYELIK_ONAYLANDI','Auth', m.id::text,
          format('%s (%s) üyeliği %s rolüyle onaylandı.', m.user_full_name, m.user_email, final_role),
          auth.uid(), 'founder');
  RETURN m;
END; $$;

CREATE OR REPLACE FUNCTION public.reject_membership(p_membership_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS public.memberships LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.memberships;
BEGIN
  IF NOT public.is_founder_or_admin() THEN
    RAISE EXCEPTION 'Üyelik reddi yalnızca kurucu veya admin tarafından yapılabilir.';
  END IF;
  UPDATE public.memberships
     SET status = 'rejected', rejection_reason = p_reason, updated_at = now()
   WHERE id = p_membership_id RETURNING * INTO m;
  IF m.id IS NULL THEN RAISE EXCEPTION 'Üyelik başvurusu bulunamadı.'; END IF;
  UPDATE public.profiles SET status = 'pasif', updated_at = now() WHERE id = m.user_id;
  RETURN m;
END; $$;

REVOKE EXECUTE ON FUNCTION public.approve_membership(UUID, TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_membership(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.default_allowed_tabs(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM anon;

-- Mevcut hesapların sekme yetkilerini rolüne göre tazele
UPDATE public.profiles SET allowed_tabs = public.default_allowed_tabs(role) WHERE status = 'aktif';
