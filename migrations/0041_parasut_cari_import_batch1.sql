-- 0041_parasut_cari_import_batch1.sql
-- Faz A (bakiyeli yeni cari, 70 satir) + Faz B (KARA LISTE/BATAK risk etiketi, 15 sifir-bakiyeli
-- yeni satir - bunlardan 3'u zaten Faz A'da bakiyeli olarak da yer aliyordu, tek satirda birlestirildi).
-- Toplam 85 benzersiz yeni cari. musteri-ve-tedarikci-listesi.xlsx'ten, isim normalize+kismi-icerme
-- ile mevcut 220 cariyle eslesmeyenler (isim karsilastirmasi bu dosyanin disinda, dry-run script'inde
-- yapildi - detay: 2026-09-15 oturum notlari).
-- party_type: bakiye pozitifse 'musteri', negatifse 'tedarikci'; bakiye sifirsa 'musteri' varsayilan
-- (notes alaninda belirtiliyor). risk_status: KARA LISTE NAKIT CALIS grubu -> 'kara_liste', BATAK -> 'batak'.
-- customers.party_type kolonu ve CHECK constraint'i bu migration'da eklendi.
-- Idempotent: baslik (case-insensitive) zaten varsa INSERT atlanir (WHERE NOT EXISTS).
-- customers.balance yon kurali: pozitif = musteri bize borclu (alacagimiz), negatif = biz tedarikciye
-- borcluyuz - mevcut DB'deki 320.xxx (Saticilar) hesap kodlu kayitlarla dogrulandi.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS party_type text NOT NULL DEFAULT 'musteri';
DO $$ BEGIN
  ALTER TABLE public.customers ADD CONSTRAINT customers_party_type_check CHECK (party_type IN ('musteri','tedarikci','her_ikisi'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $outer$
DECLARE
  v_batch_id uuid;
BEGIN
  INSERT INTO public.import_batches (import_type, source_file, total_rows, status, notes)
  VALUES ('cari_parasut_v2', 'musteri-ve-tedarikci-listesi.xlsx', 85, 'completed', 'Faz A+B: bakiyeli yeni cari + kara liste/batak risk etiketleri. Fatura/dekont bu batch disinda.')
  RETURNING id INTO v_batch_id;

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'İSTAÇ 2024-2025 İHALE', 1380272.29, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İHALELER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('İSTAÇ 2024-2025 İHALE')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'TÜRKİYE PETROLLERİ ANONİM ORTAKLIĞI', 818218.5, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İHALELER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('TÜRKİYE PETROLLERİ ANONİM ORTAKLIĞI')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'AKGÜN VİNÇ / ÜMİT', 702560.88, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('AKGÜN VİNÇ / ÜMİT')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'TRİNOX METAL', 692999.99, 'musteri', 'normal', NULL, NULL, 'KARAMEHMET MAH. AVRUPA SERBEST BÖLGESİ OSMAN ŞAHİN BLV. TRINOX METAL NO: 7', 'ÇORLU', '8730357257', 'Parasut import (grup: FABRİKALAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('TRİNOX METAL')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'ÇATALCA BELEDİYESİ', 474485.5, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: be). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('ÇATALCA BELEDİYESİ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'May Grup İhsaniye', 401000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: OCAKLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('May Grup İhsaniye')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'DEMİRMAKSAN MÜTEAHHİTLİK MONTAJ SAN. TİC. LTD. ŞTİ.', 258199.97, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ÇELİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('DEMİRMAKSAN MÜTEAHHİTLİK MONTAJ SAN. TİC. LTD. ŞTİ.')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'BALTACI MIMARLIK', 168750, 'musteri', 'normal', NULL, '05326643564', NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('BALTACI MIMARLIK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'LİMAK TRAKYA ÇİMENTO', 165029.94, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: FABRİKALAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('LİMAK TRAKYA ÇİMENTO')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Akdağlar Madencilik', 152099.97, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: OCAKLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Akdağlar Madencilik')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'BOĞAZİÇİ BETON - KARANFİL', 151699.86, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: OCAKLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('BOĞAZİÇİ BETON - KARANFİL')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'İSTAÇ 2024-2025 İHALE 20 TON', 145959.92, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İHALELER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('İSTAÇ 2024-2025 İHALE 20 TON')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'SARDEM MİMARLIK', 140000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('SARDEM MİMARLIK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Fatih Efek - Çekiçsan', 132431.78, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Fatih Efek - Çekiçsan')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'KARUN MAKİNA', 119999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ESNAFLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('KARUN MAKİNA')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'LALE TEKSTİL', 116399.98, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: FABRİKALAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('LALE TEKSTİL')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'MEHMET DAĞITIR', 112119.94, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞ-ÇELK-PRJ KRŞK). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('MEHMET DAĞITIR')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'ASYA GRUP', 107999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('ASYA GRUP')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'KABADAYI İNŞAAT TAAHHÜT-AYS YILDIZ YAPI İŞ ORTAKLIĞI', 107999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞ-ÇELK-PRJ KRŞK). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('KABADAYI İNŞAAT TAAHHÜT-AYS YILDIZ YAPI İŞ ORTAKLIĞI')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'İZOL ENERJİ ELEKTRİK İNŞAAT SANAYİ TİCARET LİMİTED ŞİRKETİ', 101999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ELEKTRİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('İZOL ENERJİ ELEKTRİK İNŞAAT SANAYİ TİCARET LİMİTED ŞİRKETİ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'İSTAÇ DENİZ HİZMETLERİ MOBİL VİNÇ İHALESİ', 100799.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İHALELER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('İSTAÇ DENİZ HİZMETLERİ MOBİL VİNÇ İHALESİ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'RESAŞ MADEN', 97800, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: OCAKLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('RESAŞ MADEN')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'EYNAK', 96750, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: OCAKLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('EYNAK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Gvs Vana Serbest Bölge', 96000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Gvs Vana Serbest Bölge')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Beyhan Vinç', 91199.98, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Beyhan Vinç')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'AYDINTAŞ VİNÇ', 84000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('AYDINTAŞ VİNÇ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'FALCON ÇELİK', 83999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ÇELİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('FALCON ÇELİK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'SM NAKLİYAT', 83999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ESNAFLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('SM NAKLİYAT')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'KOLCUOĞLU KALFASI', 79500, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('KOLCUOĞLU KALFASI')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'EKİZLER İNŞAAT', 74000, 'musteri', 'normal', NULL, '0543 561 00 30', NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('EKİZLER İNŞAAT')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'EKAY PROJE', 73999.99, 'musteri', 'normal', NULL, '0542 658 52 52', NULL, NULL, NULL, 'Parasut import (grup: LOJİSTİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('EKAY PROJE')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'GÜNDELİK İŞLER', 61000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞ-ÇELK-PRJ KRŞK). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('GÜNDELİK İŞLER')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'ORHAN PREKAST', 60000, 'musteri', 'normal', NULL, '0535 587 36 92', NULL, NULL, NULL, 'Parasut import (grup: Prefabrik betoncular). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('ORHAN PREKAST')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'AYVAZOĞLU TAAH. YAPI SAN. VE TİC. LTD. ŞTİ.', 59999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: yok). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('AYVAZOĞLU TAAH. YAPI SAN. VE TİC. LTD. ŞTİ.')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Tay Havacılık', 59999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: 3.havalimani). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Tay Havacılık')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'ÇELEBİ HAVACILIK', 58799.66, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: 3.havalimani). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('ÇELEBİ HAVACILIK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'RIZA DEMİRCİ', 55000, 'musteri', 'normal', NULL, '05462572436', NULL, NULL, NULL, 'Parasut import (grup: ÇELİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('RIZA DEMİRCİ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'OKÇU ELEKTRİK', 48000, 'musteri', 'kara_liste', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: KARA LİSTE NAKİT ÇALIŞ). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('OKÇU ELEKTRİK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'ÖZÇELİK VİNÇ', 42200, 'musteri', 'normal', NULL, '0532 789 42 92', NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('ÖZÇELİK VİNÇ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'BİRAY TELEKOM İNŞAAT SAN.TİC.LTD.ŞTİ.', 41999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ELEKTRİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('BİRAY TELEKOM İNŞAAT SAN.TİC.LTD.ŞTİ.')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'çatıcı ferit', 41000, 'musteri', 'kara_liste', NULL, '05425517595', NULL, NULL, NULL, 'Parasut import (grup: KARA LİSTE NAKİT ÇALIŞ). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('çatıcı ferit')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'ÇELİKÇİ ENVER', 40000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ÇELİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('ÇELİKÇİ ENVER')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'MUHAMMET KARAKAYA', 40000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('MUHAMMET KARAKAYA')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'RAPSODİ SUBAŞI', 32400, 'musteri', 'normal', NULL, '0541 455 10 95', NULL, NULL, NULL, 'Parasut import (grup: FABRİKALAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('RAPSODİ SUBAŞI')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'HGS SOSYAL HİZMET', 31799.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İHALELER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('HGS SOSYAL HİZMET')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'DURMUŞ BAYSAL - BAYSAL ELEKTRİK', 29999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ELEKTRİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('DURMUŞ BAYSAL - BAYSAL ELEKTRİK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'ŞAMALAR İNŞAAT', 29000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞ-ÇELK-PRJ KRŞK). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('ŞAMALAR İNŞAAT')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'erdönmez emlak', 27000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ESNAFLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('erdönmez emlak')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'FH MAKİNE', 24999.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('FH MAKİNE')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Bekiroğlu Mühendislik', 21000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Bekiroğlu Mühendislik')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Vinççim.com', 17999.99, 'musteri', 'normal', NULL, '0554 393 16 56', NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Vinççim.com')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Öztaş Ambalaj', 16500, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞ-ÇELK-PRJ KRŞK). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Öztaş Ambalaj')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Serkan Kaya - ŞEMSETTİN YILMAZ İNŞAAT', 16199.99, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: SONDAJCILAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Serkan Kaya - ŞEMSETTİN YILMAZ İNŞAAT')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'EFE TABELA FATİH', 16000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ESNAFLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('EFE TABELA FATİH')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'mahsum elektrikçi', 14000, 'musteri', 'normal', NULL, '05417111445', NULL, NULL, NULL, 'Parasut import (grup: ELEKTRİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('mahsum elektrikçi')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'KOÇ VİNÇ', 12000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('KOÇ VİNÇ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'OSDEM ELEKTRİK - OSMAN', 12000, 'musteri', 'kara_liste', NULL, '0533 047 69 80', NULL, NULL, NULL, 'Parasut import (grup: KARA LİSTE NAKİT ÇALIŞ). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('OSDEM ELEKTRİK - OSMAN')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Ytong Çatalca', 11400, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: FABRİKALAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Ytong Çatalca')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Hauteg Teknik Yalıköy', -11104.5, 'tedarikci', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ÇELİKÇİLER). party_type bakiye isaretinden cikarildi (negatif = biz borcluyuz)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Hauteg Teknik Yalıköy')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Danış Asfalt', 10200, 'musteri', 'normal', NULL, '05342844784', NULL, NULL, NULL, 'Parasut import (grup: PROJELER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Danış Asfalt')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'OLCAY BEY', 7400, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ESNAFLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('OLCAY BEY')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'KADİR KOÇYİĞİT NAKLİYAT', 7200, 'musteri', 'normal', NULL, '05325518540', NULL, NULL, NULL, 'Parasut import (grup: LOJİSTİKÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('KADİR KOÇYİĞİT NAKLİYAT')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'SELİM İNŞAAT - RECEP SELİM', -5310.01, 'tedarikci', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (negatif = biz borcluyuz)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('SELİM İNŞAAT - RECEP SELİM')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Özhicret 0532 266 17 36', 5000, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ESNAFLAR). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Özhicret 0532 266 17 36')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'VB YAPI MÜŞAVİRLİK', -800.05, 'tedarikci', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: 3.havalimani). party_type bakiye isaretinden cikarildi (negatif = biz borcluyuz)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('VB YAPI MÜŞAVİRLİK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'YİĞİT GAYRİMENKUL İNŞAAT SANAYİ TİCARET LİMİTED ŞİRKETİ', 799.98, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('YİĞİT GAYRİMENKUL İNŞAAT SANAYİ TİCARET LİMİTED ŞİRKETİ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'ADAHAN İNŞAAT', 749.96, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: İNŞAAT). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('ADAHAN İNŞAAT')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'İlhanlar Vinç', 600, 'musteri', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: VİNÇÇİLER). party_type bakiye isaretinden cikarildi (pozitif = bize borclu)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('İlhanlar Vinç')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Ramazan Mermerci', -400, 'tedarikci', 'normal', NULL, '0542 335 03 18', NULL, NULL, NULL, 'Parasut import (grup: ESNAFLAR). party_type bakiye isaretinden cikarildi (negatif = biz borcluyuz)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Ramazan Mermerci')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'IVECO TEPECİK', -51.95, 'tedarikci', 'normal', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: ESNAFLAR). party_type bakiye isaretinden cikarildi (negatif = biz borcluyuz)', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('IVECO TEPECİK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'AĞIR ENERJİ', 0, 'musteri', 'kara_liste', NULL, '0539 781 27 49', NULL, NULL, NULL, 'Parasut import (grup: KARA LİSTE NAKİT ÇALIŞ). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('AĞIR ENERJİ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'AKON GRUP ULUSLARASI A.Ş.', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('AKON GRUP ULUSLARASI A.Ş.')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'AVRUPA TIR PARKI', 0, 'musteri', 'kara_liste', NULL, '0535 689 78 42', NULL, NULL, NULL, 'Parasut import (grup: KARA LİSTE NAKİT ÇALIŞ). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('AVRUPA TIR PARKI')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'BECA YAPI ANONİM ŞİRKETİ', 0, 'musteri', 'kara_liste', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: KARA LİSTE NAKİT ÇALIŞ). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('BECA YAPI ANONİM ŞİRKETİ')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'CAN POLAT ÇELİK', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('CAN POLAT ÇELİK')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'COŞKUN KARDEŞLER UZAY ÇATI', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('COŞKUN KARDEŞLER UZAY ÇATI')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Harfiyatçı Lokman', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Harfiyatçı Lokman')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'HGK İNŞAAT', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('HGK İNŞAAT')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'LİKİT KİMYA - AYLIK TAKİP', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('LİKİT KİMYA - AYLIK TAKİP')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'MATAŞ MADENCİLİK (YENİ OCAK)', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('MATAŞ MADENCİLİK (YENİ OCAK)')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'May Beton Vize', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('May Beton Vize')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'MEKA VİNÇ MEHMET (BABASI)', 0, 'musteri', 'batak', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('MEKA VİNÇ MEHMET (BABASI)')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'Ozbek Insaat', 0, 'musteri', 'batak', NULL, '05327354909', NULL, NULL, NULL, 'Parasut import (grup: BATAK). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('Ozbek Insaat')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'VASCHBETON PREFABRİKE', 0, 'musteri', 'kara_liste', NULL, NULL, NULL, NULL, NULL, 'Parasut import (grup: KARA LİSTE NAKİT ÇALIŞ). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('VASCHBETON PREFABRİKE')));

  INSERT INTO public.customers (title, balance, party_type, risk_status, email, phone, address, tax_office, vkn_tckn, notes, is_migrated, import_batch_id)
  SELECT 'YEĞENLER AĞAÇ SAN. VE PAZ. TİC. LTD. ŞTİ.', 0, 'musteri', 'kara_liste', NULL, '0532 662 11 20', 'EKŞİOĞLU MH. KURAN KURSU CD. DERNEK SİTESİ B BLOK NO:4 İÇ KAPI NO:4', 'SARIGAZİ', '9460028320', 'Parasut import (grup: KARA LİSTE NAKİT ÇALIŞ). bakiye sifir, isaret belirsiz - musteri varsayildi', true, v_batch_id
  WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE upper(trim(title)) = upper(trim('YEĞENLER AĞAÇ SAN. VE PAZ. TİC. LTD. ŞTİ.')));

  UPDATE public.import_batches SET inserted_rows = (SELECT count(*) FROM public.customers WHERE import_batch_id = v_batch_id) WHERE id = v_batch_id;
END $outer$;

NOTIFY pgrst, 'reload schema';
