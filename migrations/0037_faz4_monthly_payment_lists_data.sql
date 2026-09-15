-- 0037_faz4_monthly_payment_lists_data.sql
-- FAZ4 veri yuklemesi (schema degil): ikinci workbook'un adli aylik odeme plani sayfalari.
-- Kaynak: BIZIM_VINC_ODEME_PAKET_2026/bizim_vinc_odeme_listeleri_DEDUPED_IMPORT.csv (68 satir -> 67 kalem, 1 TOPLAM satiri atlandi).
-- Idempotent (ON CONFLICT ile import_key/list id tekrar calistirmada duplicate uretmez).
--
-- SONUC (calistirildiginda): bu 67 satirin tamami + 5 liste (NISAN/09.05/13.05/18.05/10.07)
-- ayni gun daha erken (bu oturumdan once, saat 10:10) baska bir surecle ZATEN yuklenmisti.
-- ON CONFLICT sayesinde 0 yeni payments satiri eklendi (hepsi mevcut external_import_key ile
-- eslesti). Bu migration'in tek gercek etkisi payment_lists tablosuna 5 GEREKSIZ yinelenen
-- satir eklemek oldu -- bu, migrations/0038_faz4_payment_lists_dedupe_cleanup.sql ile
-- ayni oturumda geri alindi. Dosya, production migration gecmisiyle (apply_migration ile
-- gercekten calistirildigi icin) birebir kalmasi icin degistirilmeden burada duruyor.

-- FAZ4: ikinci workbook (ay/tarih adli odeme plani sayfalari) -- payment_lists + payments + payment_list_items
-- Bu satirlar ana 2026 havuzundan AYRI tutulur (source_list_id dolu); yillik KPI toplami sadece
-- source_list_id IS NULL satirlarini toplar, cift sayim olmaz. Muhasebeci bu listelerin ana havuzla
-- ortusen kalemler olup olmadigini teyit etmeli.

INSERT INTO public.payment_lists (id, name, kind, year, source, revision_priority, notes, created_at)
VALUES ('457f41db-68f0-4cf8-8b05-e4f57183cbc8', 'NİSAN 2026 ÖDEME PLANI', 'mixed', 2026, 'NİSAN 2026 ÖDEME PLANI', 10, 'FAZ4 import: ikinci workbook adli odeme plani sayfasi', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_lists (id, name, kind, year, source, revision_priority, notes, created_at)
VALUES ('92f342e2-dc8a-45c1-b75c-15f4e4cefd80', '09.05.2026 ÖDEME PLANI', 'mixed', 2026, '09.05.2026 ÖDEME PLANI', 30, 'FAZ4 import: ikinci workbook adli odeme plani sayfasi', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_lists (id, name, kind, year, source, revision_priority, notes, created_at)
VALUES ('4c834cc2-838b-462c-bc13-ba374d1d0d23', '13.05.2026 ÖDEME PLANI', 'mixed', 2026, '13.05.2026 ÖDEME PLANI', 40, 'FAZ4 import: ikinci workbook adli odeme plani sayfasi', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_lists (id, name, kind, year, source, revision_priority, notes, created_at)
VALUES ('652e3b27-4401-4e21-aa59-05089774ca73', '18.05.2026 ÖDEME PLANI', 'mixed', 2026, '18.05.2026 ÖDEME PLANI', 50, 'FAZ4 import: ikinci workbook adli odeme plani sayfasi', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_lists (id, name, kind, year, source, revision_priority, notes, created_at)
VALUES ('ecaa744d-ea19-4102-99c7-a95dd0976cdd', '10.07.2026 ÖDEME LİSTESİ', 'mixed', 2026, '10.07.2026 ÖDEME LİSTESİ', 10, 'FAZ4 import: ikinci workbook adli odeme plani sayfasi', now())
ON CONFLICT (id) DO NOTHING;

-- 67 odeme kalemi
INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('402843c5-1864-457a-80ac-9a596b7c16ef', 'tedarikci', 'SGK', 'masraf', 580000, '2026-04-07', 'bekliyor', 'odeme', '2026-04-01', 'MART AYI SGK PRİM ÖDEMESİ', 'MART AYI SGK PRİM ÖDEMESİ', '4a417e95cb8556c1_odeme_2026_04_07_sgk_580000_0_mart_ayi_sgk_pri_m_demesi_', '0cdaca6a358032f2_2026_04_07_sgk_mart_ayi_sgk_pri_m_demesi_', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 0
FROM public.payments WHERE external_import_key = '4a417e95cb8556c1_odeme_2026_04_07_sgk_580000_0_mart_ayi_sgk_pri_m_demesi_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('c8c889f7-608b-43e7-9c83-4dc1e30922c4', 'tedarikci', 'KUVEYTTÜRK KREDİ KARTI', 'masraf', 747850, '2026-04-09', 'bekliyor', 'odeme', '2026-04-01', 'TİCARİ KART', 'TİCARİ KART', '509785b27e26fe03_odeme_2026_04_09_kuveytt_rk_kredi_karti_747850_0_ti_cari_kart', '9c0a4f4a30f82133_2026_04_09_kuveytt_rk_kredi_karti_ti_cari_kart', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 1
FROM public.payments WHERE external_import_key = '509785b27e26fe03_odeme_2026_04_09_kuveytt_rk_kredi_karti_747850_0_ti_cari_kart'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('f27939db-92a5-408b-9415-dac44bebf412', 'tedarikci', 'VAKIF KATILIM BANKASI', 'masraf', 565000, '2026-04-09', 'bekliyor', 'odeme', '2026-04-01', 'TÜRKİYEKATILIM 450T SİGORTA ÖDEMESİ 3. TAKSİT 2 AYDA 1', 'TÜRKİYEKATILIM 450T SİGORTA ÖDEMESİ 3. TAKSİT 2 AYDA 1', '31b6dbf886d94ea1_odeme_2026_04_09_vakif_katilim_bankasi_565000_0_t_rki_yekatilim_450t_si_gorta_de', 'c706023482319a1b_2026_04_09_vakif_katilim_bankasi_t_rki_yekatilim_450t_si_gorta_demesi_3_t', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 2
FROM public.payments WHERE external_import_key = '31b6dbf886d94ea1_odeme_2026_04_09_vakif_katilim_bankasi_565000_0_t_rki_yekatilim_450t_si_gorta_de'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('b2cd1743-c23b-41c7-913b-8c89cd3752d2', 'tedarikci', 'SAFFET GÜNGÖR', 'masraf', 30000, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'SAFFET GÜNGÖR', NULL, '1439fe13c6a447d1_odeme_2026_04_10_saffet_g_ng_r_30000_0_', '2cd0efd57029cbcc_2026_04_10_saffet_g_ng_r_', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 3
FROM public.payments WHERE external_import_key = '1439fe13c6a447d1_odeme_2026_04_10_saffet_g_ng_r_30000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('ecbca107-762a-470a-9938-edbfafd95e0a', 'tedarikci', 'YAZICIOĞLU', 'masraf', 60000, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'YAZICIOĞLU', NULL, '064f0f80a172f8b8_odeme_2026_04_10_yazicio_lu_60000_0_', '75f1c59fa1baff02_2026_04_10_yazicio_lu_', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 4
FROM public.payments WHERE external_import_key = '064f0f80a172f8b8_odeme_2026_04_10_yazicio_lu_60000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('a22eec36-d458-48cd-9679-9eb0853adac2', 'tedarikci', 'HASAN GİRGİN', 'masraf', 80500, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'İŞ ORTAKLIĞI 44.900TL + PARTNER 35.600TL MUHASEBE ÜCRETİ', 'İŞ ORTAKLIĞI 44.900TL + PARTNER 35.600TL MUHASEBE ÜCRETİ', '8b20487002156dc4_odeme_2026_04_10_hasan_gi_rgi_n_80500_0_i_ortakli_i_44_900tl_partner_35_600tl', '9777c709f715ded6_2026_04_10_hasan_gi_rgi_n_i_ortakli_i_44_900tl_partner_35_600tl', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 5
FROM public.payments WHERE external_import_key = '8b20487002156dc4_odeme_2026_04_10_hasan_gi_rgi_n_80500_0_i_ortakli_i_44_900tl_partner_35_600tl'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('51d4e76c-fae0-4f70-934b-917fdbca8425', 'tedarikci', 'FATİH EFEK', 'masraf', 1000000, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'FATİH EFEK', NULL, 'c86363c7d901790b_odeme_2026_04_10_fati_h_efek_1000000_0_', '43721897cd65126b_2026_04_10_fati_h_efek_', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 6
FROM public.payments WHERE external_import_key = 'c86363c7d901790b_odeme_2026_04_10_fati_h_efek_1000000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('503b97e1-9a94-4990-978d-8e0b3e883ec0', 'tedarikci', 'KONYA LASTİKÇİ', 'masraf', 134000, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'KONYA LASTİKÇİ', NULL, '94d5fd55dbc5ac33_odeme_2026_04_10_konya_lasti_k_i_134000_0_', '379c0a10d7e95164_2026_04_10_konya_lasti_k_i_', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 7
FROM public.payments WHERE external_import_key = '94d5fd55dbc5ac33_odeme_2026_04_10_konya_lasti_k_i_134000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('2a5202db-707c-43fc-8a1f-b65daf2742e4', 'tedarikci', 'YAPIKREDİ KREDİ KARTI', 'masraf', 233000, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'TİCARİ KART', 'TİCARİ KART', '1b077a18b6245559_odeme_2026_04_10_yapikredi_kredi_karti_233000_0_ti_cari_kart', '4a65929bc996da3a_2026_04_10_yapikredi_kredi_karti_ti_cari_kart', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 8
FROM public.payments WHERE external_import_key = '1b077a18b6245559_odeme_2026_04_10_yapikredi_kredi_karti_233000_0_ti_cari_kart'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('f7f0325d-92bc-40da-8112-2fbb7b7d400b', 'tedarikci', 'MAAŞ ÖDEMESİ', 'masraf', 1900000, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'MART AYI', 'MART AYI', '20ad07d63fe8a08d_odeme_2026_04_10_maa_demesi_1900000_0_mart_ayi', 'bd49a86ea90a9c68_2026_04_10_maa_demesi_mart_ayi', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 9
FROM public.payments WHERE external_import_key = '20ad07d63fe8a08d_odeme_2026_04_10_maa_demesi_1900000_0_mart_ayi'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('41bffb2c-9040-4707-b154-952abd44da2a', 'tedarikci', 'ZİRAAT BANKASI KREDİ KARTI', 'masraf', 45000, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'MAHMUT EFEK ŞAHSİ KART', 'MAHMUT EFEK ŞAHSİ KART', 'f49e4bdb9ec1897d_odeme_2026_04_10_zi_raat_bankasi_kredi_karti_45000_0_mahmut_efek_ahsi_kart', '6a691ea4996882fb_2026_04_10_zi_raat_bankasi_kredi_karti_mahmut_efek_ahsi_kart', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 10
FROM public.payments WHERE external_import_key = 'f49e4bdb9ec1897d_odeme_2026_04_10_zi_raat_bankasi_kredi_karti_45000_0_mahmut_efek_ahsi_kart'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('2714fdd0-a73a-4db0-a5a4-c3163b612970', 'tedarikci', 'DEĞİŞİM DİNAMİKLERİ', 'masraf', 300000, '2026-04-10', 'bekliyor', 'odeme', '2026-04-01', 'KALAN BORCUMUZ', 'KALAN BORCUMUZ', 'b98a6dc346dbdad4_odeme_2026_04_10_de_i_i_m_di_nami_kleri_300000_0_kalan_borcumuz', 'd01c76e924223550_2026_04_10_de_i_i_m_di_nami_kleri_kalan_borcumuz', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 11
FROM public.payments WHERE external_import_key = 'b98a6dc346dbdad4_odeme_2026_04_10_de_i_i_m_di_nami_kleri_300000_0_kalan_borcumuz'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('12fe2a81-3f3e-4bb5-9505-01d0b502f69e', 'tedarikci', 'TİCARİ KREDİ', 'masraf', 288250, '2026-04-13', 'bekliyor', 'odeme', '2026-04-01', 'KUVEYTTÜRK İVECO T-WAY  3 .TAKSİT  / 24', 'KUVEYTTÜRK İVECO T-WAY  3 .TAKSİT  / 24', '0e5de2e44406ca2c_odeme_2026_04_13_ti_cari_kredi_288250_0_kuveytt_rk_i_veco_t_way_3_taksi_t_24', 'f8f076b573ad2122_2026_04_13_ti_cari_kredi_kuveytt_rk_i_veco_t_way_3_taksi_t_24', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 12
FROM public.payments WHERE external_import_key = '0e5de2e44406ca2c_odeme_2026_04_13_ti_cari_kredi_288250_0_kuveytt_rk_i_veco_t_way_3_taksi_t_24'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('86770a77-1fa3-44b6-aa1b-205cbffee59b', 'tedarikci', 'LEASİNG ÖDEMESİ', 'masraf', 544000, '2026-04-14', 'bekliyor', 'odeme', '2026-04-01', 'VAKIF KATILIM VESA PLATFORM 141.503EURO 9. TAKSİT / 12', 'VAKIF KATILIM VESA PLATFORM 141.503EURO 9. TAKSİT / 12', 'a376269ef9f764b0_odeme_2026_04_14_leasi_ng_demesi_544000_0_vakif_katilim_vesa_platform_141_503eur', 'f5c89671a1d61122_2026_04_14_leasi_ng_demesi_vakif_katilim_vesa_platform_141_503euro', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 13
FROM public.payments WHERE external_import_key = 'a376269ef9f764b0_odeme_2026_04_14_leasi_ng_demesi_544000_0_vakif_katilim_vesa_platform_141_503eur'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('2198756c-2a3e-4261-b57e-5c7c28507205', 'tedarikci', 'LEASİNG ÖDEMESİ', 'masraf', 1530000, '2026-04-16', 'bekliyor', 'odeme', '2026-04-01', 'VAKIF KATILIM 450T MOBİL 3. TAKSİT / 49', 'VAKIF KATILIM 450T MOBİL 3. TAKSİT / 49', 'd7c937fd09671a59_odeme_2026_04_16_leasi_ng_demesi_1530000_0_vakif_katilim_450t_mobi_l_3_taksi_t_4', 'b4fb6ce354f038b7_2026_04_16_leasi_ng_demesi_vakif_katilim_450t_mobi_l_3_taksi_t_49', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 14
FROM public.payments WHERE external_import_key = 'd7c937fd09671a59_odeme_2026_04_16_leasi_ng_demesi_1530000_0_vakif_katilim_450t_mobi_l_3_taksi_t_4'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('197246cd-4835-4f3e-838f-c443c00e767b', 'tedarikci', 'VAKIF KATILIM KREDİ KARTI', 'masraf', 35000, '2026-04-17', 'bekliyor', 'odeme', '2026-04-01', 'TİCARİ KART', 'TİCARİ KART', '46c9705a1ebf5d91_odeme_2026_04_17_vakif_katilim_kredi_karti_35000_0_ti_cari_kart', '1b50d34f1375f51b_2026_04_17_vakif_katilim_kredi_karti_ti_cari_kart', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 15
FROM public.payments WHERE external_import_key = '46c9705a1ebf5d91_odeme_2026_04_17_vakif_katilim_kredi_karti_35000_0_ti_cari_kart'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('1cc5934c-4850-4b0b-95a0-ebad9faffbda', 'tedarikci', 'VAKIF BANKASI KREDİ KARTI', 'masraf', 762000, '2026-04-20', 'bekliyor', 'odeme', '2026-04-01', 'TİCARİ KART', 'TİCARİ KART', '36ecbf5eaae8c1ca_odeme_2026_04_20_vakif_bankasi_kredi_karti_762000_0_ti_cari_kart', 'bb9455714972c9aa_2026_04_20_vakif_bankasi_kredi_karti_ti_cari_kart', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 16
FROM public.payments WHERE external_import_key = '36ecbf5eaae8c1ca_odeme_2026_04_20_vakif_bankasi_kredi_karti_762000_0_ti_cari_kart'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('11560dde-3492-4936-81a7-a6993bff9a0d', 'tedarikci', 'MÜSİAD ÇEK', 'masraf', 240000, '2026-04-30', 'bekliyor', 'odeme', '2026-04-01', 'KENDİ ÇEKİMİZ', 'KENDİ ÇEKİMİZ', '00172928d7568e46_cek_2026_04_30_m_si_ad_ek_240000_0_kendi_eki_mi_z', '12d699982f511522_2026_04_30_m_si_ad_ek_kendi_eki_mi_z', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 17
FROM public.payments WHERE external_import_key = '00172928d7568e46_cek_2026_04_30_m_si_ad_ek_240000_0_kendi_eki_mi_z'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('3ce74e49-4d88-4c85-88f6-5f1a32d1343d', 'tedarikci', 'SGK', 'masraf', 580000, '2026-04-30', 'bekliyor', 'odeme', '2026-04-01', 'NİSAN AYI SGK PRİM ÖDEMESİ', 'NİSAN AYI SGK PRİM ÖDEMESİ', '3b29a1061ebdbc21_odeme_2026_04_30_sgk_580000_0_ni_san_ayi_sgk_pri_m_demesi_', 'c642f92471673f9e_2026_04_30_sgk_ni_san_ayi_sgk_pri_m_demesi_', '457f41db-68f0-4cf8-8b05-e4f57183cbc8', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '457f41db-68f0-4cf8-8b05-e4f57183cbc8', id, 18
FROM public.payments WHERE external_import_key = '3b29a1061ebdbc21_odeme_2026_04_30_sgk_580000_0_ni_san_ayi_sgk_pri_m_demesi_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('7b037e42-ae39-41f0-b8b4-8e7e509a251c', 'tedarikci', 'ÖZDEN AKARYAKIT', 'masraf', 1123366, '2026-04-29', 'odendi', 'odeme', '2026-04-01', 'TİCARİ ÇEK', 'TİCARİ ÇEK', '60c18e3a30e2ed5b_cek_2026_04_29_zden_akaryakit_1123366_0_ti_cari_ek', 'e99bc04b88550528_2026_04_29_zden_akaryakit_ti_cari_ek', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 1123366)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 19
FROM public.payments WHERE external_import_key = '60c18e3a30e2ed5b_cek_2026_04_29_zden_akaryakit_1123366_0_ti_cari_ek'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('4ca49028-da24-4b44-9587-b35cc362a1e4', 'tedarikci', 'MÜSİAD', 'masraf', 240000, '2026-04-30', 'odendi', 'odeme', '2026-04-01', 'TİCARİ ÇEK', 'TİCARİ ÇEK', 'f7862414d2e14c78_cek_2026_04_30_m_si_ad_240000_0_ti_cari_ek', 'c7cd61f4385ea419_2026_04_30_m_si_ad_ti_cari_ek', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 240000)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 20
FROM public.payments WHERE external_import_key = 'f7862414d2e14c78_cek_2026_04_30_m_si_ad_240000_0_ti_cari_ek'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('3f4eb95b-fd2b-4766-ac04-b0ba0b5ea06e', 'tedarikci', 'YAPIKREDİ TİCARİ KREDİ KARTI', 'masraf', 292800, '2026-04-30', 'kismi', 'odeme', '2026-04-01', 'YAPIKREDİ TİCARİ KREDİ KARTI', NULL, 'f003a63a0552203b_odeme_2026_04_30_yapikredi_ti_cari_kredi_karti_292800_0_', 'c1806ee4d2c43b10_2026_04_30_yapikredi_ti_cari_kredi_karti_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 60000)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 21
FROM public.payments WHERE external_import_key = 'f003a63a0552203b_odeme_2026_04_30_yapikredi_ti_cari_kredi_karti_292800_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('8ed1233a-40fe-4a70-bd89-f6c575f96abf', 'tedarikci', 'VAKIF BANKASI TİCARİ KİREDİ KARTI', 'masraf', 761950, '2026-04-30', 'kismi', 'odeme', '2026-04-01', 'VAKIF BANKASI TİCARİ KİREDİ KARTI', NULL, '8ad4b0884b4784be_odeme_2026_04_30_vakif_bankasi_ti_cari_ki_redi_karti_761950_0_', 'fc8d65736ef48d20_2026_04_30_vakif_bankasi_ti_cari_ki_redi_karti_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 337800)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 22
FROM public.payments WHERE external_import_key = '8ad4b0884b4784be_odeme_2026_04_30_vakif_bankasi_ti_cari_ki_redi_karti_761950_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('726304ce-be53-474e-869d-d12336bf6043', 'tedarikci', 'SGK MART AYI PRİM', 'masraf', 570000, '2026-04-30', 'odendi', 'odeme', '2026-04-01', 'SGK MART AYI PRİM', NULL, 'bb86cf163d2ed72e_odeme_2026_04_30_sgk_mart_ayi_pri_m_570000_0_', 'ef1084654d569161_2026_04_30_sgk_mart_ayi_pri_m_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 570000)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 23
FROM public.payments WHERE external_import_key = 'bb86cf163d2ed72e_odeme_2026_04_30_sgk_mart_ayi_pri_m_570000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('1bf7550a-2ecb-4081-ad87-848796a1f9df', 'tedarikci', 'MEHMETALİ EFEK KUVEYTTÜRK KREDİ KARTI', 'masraf', 27660, '2026-05-04', 'odendi', 'odeme', '2026-05-01', 'MEHMETALİ EFEK KUVEYTTÜRK KREDİ KARTI', NULL, '8374a189c3c7c603_odeme_2026_05_04_mehmetali_efek_kuveytt_rk_kredi_karti_27660_0_', 'ae191f9d4af07976_2026_05_04_mehmetali_efek_kuveytt_rk_kredi_karti_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 27660)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 24
FROM public.payments WHERE external_import_key = '8374a189c3c7c603_odeme_2026_05_04_mehmetali_efek_kuveytt_rk_kredi_karti_27660_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('5e57d6d8-5ab1-487a-b4b4-7d567e4bed61', 'tedarikci', 'KUVEYTTÜRK LEASİNG FORKLİFT LİUGONG 2. TAKSİT / 25', 'masraf', 43500, '2026-05-04', 'odendi', 'odeme', '2026-05-01', '978,86 $', '978,86 $', '9abf4deabb604e9b_odeme_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_li_ugong_2_taksi_t_25_43500_0_978', '4d0610fc05014e63_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_li_ugong_2_taksi_t_25_978_86_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 43500)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 25
FROM public.payments WHERE external_import_key = '9abf4deabb604e9b_odeme_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_li_ugong_2_taksi_t_25_43500_0_978'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('002e4a7d-702b-4c71-802c-ce8883d6867b', 'tedarikci', 'KUVEYTTÜRK LEASİNG FORKLİFT LİUGONG 2. TAKSİT / 24', 'masraf', 2400, '2026-05-04', 'odendi', 'odeme', '2026-05-01', '54 $', '54 $', '1e8d887ab0a6993e_odeme_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_li_ugong_2_taksi_t_24_2400_0_54_', '4cc6a01da831cd41_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_li_ugong_2_taksi_t_24_54_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 2400)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 26
FROM public.payments WHERE external_import_key = '1e8d887ab0a6993e_odeme_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_li_ugong_2_taksi_t_24_2400_0_54_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('42047704-8c2d-4c79-b080-7687d5252dbe', 'tedarikci', 'KUVEYTTÜRK LEASİNG 150T MOBİL 8. TAKSİT / 50', 'masraf', 850000, '2026-05-04', 'odendi', 'odeme', '2026-05-01', '16446.84', '16446.84', 'e1e433239c1d8ffc_odeme_2026_05_04_kuveytt_rk_leasi_ng_150t_mobi_l_8_taksi_t_50_850000_0_16446_84', '82f32093e5b2989e_2026_05_04_kuveytt_rk_leasi_ng_150t_mobi_l_8_taksi_t_50_16446_84', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 850000)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 27
FROM public.payments WHERE external_import_key = 'e1e433239c1d8ffc_odeme_2026_05_04_kuveytt_rk_leasi_ng_150t_mobi_l_8_taksi_t_50_850000_0_16446_84'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('5619737f-dda2-42e9-814b-5a704997d675', 'tedarikci', 'KUVEYTTÜRK LEASİNG 150T SİGORTA  8. TAKSİT / 48', 'masraf', 70600, '2026-05-04', 'odendi', 'odeme', '2026-05-01', '1332.04', '1332.04', '2abb42ea1900f6d4_odeme_2026_05_04_kuveytt_rk_leasi_ng_150t_si_gorta_8_taksi_t_48_70600_0_1332_04', '6ff41a051becd2d5_2026_05_04_kuveytt_rk_leasi_ng_150t_si_gorta_8_taksi_t_48_1332_04', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 70600)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 28
FROM public.payments WHERE external_import_key = '2abb42ea1900f6d4_odeme_2026_05_04_kuveytt_rk_leasi_ng_150t_si_gorta_8_taksi_t_48_70600_0_1332_04'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('8df7f375-8aba-49e2-bcd5-5cbbcb69b7cf', 'tedarikci', 'KUVEYTTÜRK LEASİNG 150T ÖTV  8. TAKSİT / 48', 'masraf', 44000, '2026-05-04', 'odendi', 'odeme', '2026-05-01', '830.74', '830.74', '6e426100d28c6aa2_odeme_2026_05_04_kuveytt_rk_leasi_ng_150t_tv_8_taksi_t_48_44000_0_830_74', '9b7cf39ae658c157_2026_05_04_kuveytt_rk_leasi_ng_150t_tv_8_taksi_t_48_830_74', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 44000)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 29
FROM public.payments WHERE external_import_key = '6e426100d28c6aa2_odeme_2026_05_04_kuveytt_rk_leasi_ng_150t_tv_8_taksi_t_48_44000_0_830_74'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('e7cc5eba-bfc0-46d9-a525-d02fef7a3602', 'tedarikci', 'KUVEYTTÜRK LEASİNG VESA PLATFORM   14. TAKSİT / 24', 'masraf', 680000, '2026-05-04', 'odendi', 'odeme', '2026-05-01', '12815.32', '12815.32', 'e9f47a0fe11f0964_odeme_2026_05_04_kuveytt_rk_leasi_ng_vesa_platform_14_taksi_t_24_680000_0_12815_', '82355005f8da87e8_2026_05_04_kuveytt_rk_leasi_ng_vesa_platform_14_taksi_t_24_12815_32', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 680000)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 30
FROM public.payments WHERE external_import_key = 'e9f47a0fe11f0964_odeme_2026_05_04_kuveytt_rk_leasi_ng_vesa_platform_14_taksi_t_24_680000_0_12815_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('3041240e-277a-421c-8120-2623dc1691e9', 'tedarikci', 'KUVEYTTÜRK LEASİNG FORKLİFT LOOKİNG 3./ 12', 'masraf', 84400, '2026-05-04', 'odendi', 'odeme', '2026-05-01', '1.879,18 $', '1.879,18 $', '75375a372cef13f0_odeme_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_looki_ng_3_12_84400_0_1_879_18_', '8deb99d409fbe0b7_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_looki_ng_3_12_1_879_18_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 84400)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 31
FROM public.payments WHERE external_import_key = '75375a372cef13f0_odeme_2026_05_04_kuveytt_rk_leasi_ng_forkli_ft_looki_ng_3_12_84400_0_1_879_18_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('0426e817-3059-44e3-be17-13b092caf10f', 'tedarikci', 'YAPIKREDİ TİCARİ KREDİ KARTI', 'masraf', 294035, '2026-05-05', 'kismi', 'odeme', '2026-05-01', 'YAPIKREDİ TİCARİ KREDİ KARTI', NULL, '35b5788cd91f3a5f_odeme_2026_05_05_yapikredi_ti_cari_kredi_karti_294035_0_', '4ef2a68800f1133b_2026_05_05_yapikredi_ti_cari_kredi_karti_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 61365)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 32
FROM public.payments WHERE external_import_key = '35b5788cd91f3a5f_odeme_2026_05_05_yapikredi_ti_cari_kredi_karti_294035_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('7e833130-92c5-4f1b-ab94-53ca2327bc1c', 'tedarikci', 'ZİRAAT BANKASI TİCARİ KREDİ KARTI', 'masraf', 1093000, '2026-05-05', 'kismi', 'odeme', '2026-05-01', 'ZİRAAT BANKASI TİCARİ KREDİ KARTI', NULL, '89ba18c0fffd5b0f_odeme_2026_05_05_zi_raat_bankasi_ti_cari_kredi_karti_1093000_0_', '8f657983dc7d6eb8_2026_05_05_zi_raat_bankasi_ti_cari_kredi_karti_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', 110000)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 33
FROM public.payments WHERE external_import_key = '89ba18c0fffd5b0f_odeme_2026_05_05_zi_raat_bankasi_ti_cari_kredi_karti_1093000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('e4a5256a-bf58-473d-b0a2-5144fbdb07af', 'tedarikci', 'MAAŞ ÖDEMESİ', 'masraf', 1900000, '2026-05-08', 'bekliyor', 'odeme', '2026-05-01', 'MAAŞ ÖDEMESİ', NULL, '93893b5552e8df7b_odeme_2026_05_08_maa_demesi_1900000_0_', '59799c5cc5b6699f_2026_05_08_maa_demesi_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 34
FROM public.payments WHERE external_import_key = '93893b5552e8df7b_odeme_2026_05_08_maa_demesi_1900000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('56efb489-ae52-4979-827d-85ad8fee74ab', 'tedarikci', 'KUVEYTTÜRK TİCARİ KREDİ KARTI', 'masraf', 272450, '2026-05-11', 'bekliyor', 'odeme', '2026-05-01', 'KUVEYTTÜRK TİCARİ KREDİ KARTI', NULL, '08e7aca4199515bf_odeme_2026_05_11_kuveytt_rk_ti_cari_kredi_karti_272450_0_', '6b142eb796fdc765_2026_05_11_kuveytt_rk_ti_cari_kredi_karti_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 35
FROM public.payments WHERE external_import_key = '08e7aca4199515bf_odeme_2026_05_11_kuveytt_rk_ti_cari_kredi_karti_272450_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('8435ed42-96ba-4932-8da1-e2aea1e11a1d', 'tedarikci', 'KUVEYTTÜRK FİNANSMAN İVECO T-WAY  4 .TAKSİT  / 24', 'masraf', 288236, '2026-05-13', 'bekliyor', 'odeme', '2026-05-01', 'KUVEYTTÜRK FİNANSMAN İVECO T-WAY  4 .TAKSİT  / 24', NULL, '0c6f0d89e8a75c2b_odeme_2026_05_13_kuveytt_rk_fi_nansman_i_veco_t_way_4_taksi_t_24_288236_0_', '43a11f335dddf47b_2026_05_13_kuveytt_rk_fi_nansman_i_veco_t_way_4_taksi_t_24_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 36
FROM public.payments WHERE external_import_key = '0c6f0d89e8a75c2b_odeme_2026_05_13_kuveytt_rk_fi_nansman_i_veco_t_way_4_taksi_t_24_288236_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('278ec5af-f162-49e3-b5b1-9a9769a18b1e', 'tedarikci', 'VAKIF KATILIM LEASİNG VESA PLATFORM 141.503EURO 11. TAKSİT / 12', 'kira', 566850, '2026-05-14', 'bekliyor', 'odeme', '2026-05-01', 'LEASİNG TAKSİTLERİ', '10673.03', '474b725066109cc7_odeme_2026_05_14_vakif_katilim_leasi_ng_vesa_platform_141_503euro_11_taksi_t_12_', 'd0930b3ca5c94844_2026_05_14_vakif_katilim_leasi_ng_vesa_platform_141_503euro_11_taksi_t_12_10673_', '4c834cc2-838b-462c-bc13-ba374d1d0d23', 40, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '4c834cc2-838b-462c-bc13-ba374d1d0d23', id, 37
FROM public.payments WHERE external_import_key = '474b725066109cc7_odeme_2026_05_14_vakif_katilim_leasi_ng_vesa_platform_141_503euro_11_taksi_t_12_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('51183435-fb48-49df-8773-b8ed6c79b21c', 'tedarikci', 'VAKIF KATILIM BANKASI TİCARİ KREDİ KARTI', 'masraf', 442000, '2026-05-18', 'bekliyor', 'odeme', '2026-05-01', 'VAKIF KATILIM BANKASI TİCARİ KREDİ KARTI', NULL, '39d97f9d115ab86b_odeme_2026_05_18_vakif_katilim_bankasi_ti_cari_kredi_karti_442000_0_', 'd0c19ed4849856e7_2026_05_18_vakif_katilim_bankasi_ti_cari_kredi_karti_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 38
FROM public.payments WHERE external_import_key = '39d97f9d115ab86b_odeme_2026_05_18_vakif_katilim_bankasi_ti_cari_kredi_karti_442000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('4b23e225-f847-42d3-a003-72d0ad470db2', 'tedarikci', 'VAKIF KATILIM LEASİNG 450T MOBİL 4. TAKSİT / 49', 'masraf', 1859000, '2026-05-18', 'bekliyor', 'odeme', '2026-05-01', '35000', '35000', '2c74f75a987a3049_odeme_2026_05_18_vakif_katilim_leasi_ng_450t_mobi_l_4_taksi_t_49_1859000_0_35000', '10db66501b234aee_2026_05_18_vakif_katilim_leasi_ng_450t_mobi_l_4_taksi_t_49_35000', '4c834cc2-838b-462c-bc13-ba374d1d0d23', 40, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '4c834cc2-838b-462c-bc13-ba374d1d0d23', id, 39
FROM public.payments WHERE external_import_key = '2c74f75a987a3049_odeme_2026_05_18_vakif_katilim_leasi_ng_450t_mobi_l_4_taksi_t_49_1859000_0_35000'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('afe1a4a4-3eae-4e13-88ab-65353fc295a6', 'tedarikci', 'VAKIF BANKASI TİCARİ KREDİ KARTI', 'masraf', 1025850, '2026-05-20', 'bekliyor', 'odeme', '2026-05-01', 'VAKIF BANKASI TİCARİ KREDİ KARTI', NULL, '61ed4156ebbcc31a_odeme_2026_05_20_vakif_bankasi_ti_cari_kredi_karti_1025850_0_', 'fbfda42d4929c494_2026_05_20_vakif_bankasi_ti_cari_kredi_karti_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 40
FROM public.payments WHERE external_import_key = '61ed4156ebbcc31a_odeme_2026_05_20_vakif_bankasi_ti_cari_kredi_karti_1025850_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('af833167-689c-44ac-b501-ba2e9e247a7c', 'tedarikci', 'REVAK OSGB', 'masraf', 84820, '2026-05-08', 'bekliyor', 'odeme', '2026-05-01', 'REVAK OSGB', NULL, 'c7dadcc8c6cd1c3f_odeme_2026_05_08_revak_osgb_84820_0_', 'f3306315bc9a68e2_2026_05_08_revak_osgb_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 41
FROM public.payments WHERE external_import_key = 'c7dadcc8c6cd1c3f_odeme_2026_05_08_revak_osgb_84820_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('a85bcc79-2d91-4af0-8283-bc7b88115840', 'tedarikci', 'ERSA RULMAN', 'masraf', 2290.8, '2026-05-08', 'bekliyor', 'odeme', '2026-05-01', 'ERSA RULMAN', NULL, '8de535d8b6f9bf06_odeme_2026_05_08_ersa_rulman_2290_8_', '6ccff1b3b8ebc360_2026_05_08_ersa_rulman_', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 42
FROM public.payments WHERE external_import_key = '8de535d8b6f9bf06_odeme_2026_05_08_ersa_rulman_2290_8_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('4b8477c3-fe2e-409a-b942-1f6274c67b44', 'tedarikci', 'MUSTAFA YEŞİL', 'masraf', 50000, '2026-05-25', 'bekliyor', 'odeme', '2026-05-01', 'TİCARİ ÇEK', 'TİCARİ ÇEK', '2dd583dead527439_cek_2026_05_25_mustafa_ye_i_l_50000_0_ti_cari_ek', '5fbba826db02d02d_2026_05_25_mustafa_ye_i_l_ti_cari_ek', '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', 30, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '92f342e2-dc8a-45c1-b75c-15f4e4cefd80', id, 43
FROM public.payments WHERE external_import_key = '2dd583dead527439_cek_2026_05_25_mustafa_ye_i_l_50000_0_ti_cari_ek'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('8ba4dfc2-e172-4e5a-a643-baec7a86fe14', 'tedarikci', 'VAKIF KATILIM BANKASI TİCARİ KART', 'masraf', 494000, '2026-05-18', 'bekliyor', 'odeme', '2026-05-01', 'KREDİ KARTLARI', NULL, 'b3060701757c8613_odeme_2026_05_18_vakif_katilim_bankasi_ti_cari_kart_494000_0_', '2499e15ff5ba14cd_2026_05_18_vakif_katilim_bankasi_ti_cari_kart_', '4c834cc2-838b-462c-bc13-ba374d1d0d23', 40, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '4c834cc2-838b-462c-bc13-ba374d1d0d23', id, 44
FROM public.payments WHERE external_import_key = 'b3060701757c8613_odeme_2026_05_18_vakif_katilim_bankasi_ti_cari_kart_494000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('23f8eb89-81d1-4b19-acc3-e884ac905b19', 'tedarikci', 'VAKIF BANKASI TİCARİ KART', 'masraf', 1423200, '2026-05-20', 'bekliyor', 'odeme', '2026-05-01', 'KREDİ KARTI', NULL, '1f7cbd7e46f234f2_odeme_2026_05_20_vakif_bankasi_ti_cari_kart_1423200_0_', 'ee57e4732de2f8d1_2026_05_20_vakif_bankasi_ti_cari_kart_', '652e3b27-4401-4e21-aa59-05089774ca73', 50, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '652e3b27-4401-4e21-aa59-05089774ca73', id, 45
FROM public.payments WHERE external_import_key = '1f7cbd7e46f234f2_odeme_2026_05_20_vakif_bankasi_ti_cari_kart_1423200_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('6c9cfb90-e8ec-4c48-bd7d-822ca148fff4', 'tedarikci', 'YAPIKRERİ MEHMETALİ EFEK ŞAHSİ KART', 'masraf', 25200, '2026-05-25', 'bekliyor', 'odeme', '2026-05-01', 'KREDİ KARTI', 'MOBİLYA TAKSİTİ', 'ad2e05ca90e7808b_odeme_2026_05_25_yapikreri_mehmetali_efek_ahsi_kart_25200_0_mobi_lya_taksi_ti_', '13d829d1706e6ad7_2026_05_25_yapikreri_mehmetali_efek_ahsi_kart_mobi_lya_taksi_ti_', '652e3b27-4401-4e21-aa59-05089774ca73', 50, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '652e3b27-4401-4e21-aa59-05089774ca73', id, 46
FROM public.payments WHERE external_import_key = 'ad2e05ca90e7808b_odeme_2026_05_25_yapikreri_mehmetali_efek_ahsi_kart_25200_0_mobi_lya_taksi_ti_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('5a4aa829-2ae3-44d0-8015-5cd7ed28d576', 'tedarikci', 'ZİRAAT BANKASI TİCARİ KART', 'masraf', 985000, '2026-06-05', 'bekliyor', 'odeme', '2026-06-01', 'ZİRAAT BANKASI TİCARİ KART', NULL, '51bfd759886fdad6_odeme_2026_06_05_zi_raat_bankasi_ti_cari_kart_985000_0_', '42d2b27a0c82a989_2026_06_05_zi_raat_bankasi_ti_cari_kart_', '4c834cc2-838b-462c-bc13-ba374d1d0d23', 40, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '4c834cc2-838b-462c-bc13-ba374d1d0d23', id, 47
FROM public.payments WHERE external_import_key = '51bfd759886fdad6_odeme_2026_06_05_zi_raat_bankasi_ti_cari_kart_985000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('48f3e05e-fe0a-4107-864c-24a31826c5e8', 'tedarikci', 'YAPIKREDİ TİCARİ KART', 'masraf', 443400, '2026-06-05', 'bekliyor', 'odeme', '2026-06-01', 'YAPIKREDİ TİCARİ KART', NULL, 'dd9b5e82070ff738_odeme_2026_06_05_yapikredi_ti_cari_kart_443400_0_', '22d3bfe390d300ad_2026_06_05_yapikredi_ti_cari_kart_', '4c834cc2-838b-462c-bc13-ba374d1d0d23', 40, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '4c834cc2-838b-462c-bc13-ba374d1d0d23', id, 48
FROM public.payments WHERE external_import_key = 'dd9b5e82070ff738_odeme_2026_06_05_yapikredi_ti_cari_kart_443400_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('639b1169-5518-4185-a0b5-2ad6712f9a18', 'tedarikci', 'KUVEYTTÜRK TİCARİ KART', 'masraf', 235450, '2026-06-09', 'bekliyor', 'odeme', '2026-06-01', 'KUVEYTTÜRK TİCARİ KART', NULL, 'e7207752299e3713_odeme_2026_06_09_kuveytt_rk_ti_cari_kart_235450_0_', '7a91bfa56e23f561_2026_06_09_kuveytt_rk_ti_cari_kart_', '4c834cc2-838b-462c-bc13-ba374d1d0d23', 40, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '4c834cc2-838b-462c-bc13-ba374d1d0d23', id, 49
FROM public.payments WHERE external_import_key = 'e7207752299e3713_odeme_2026_06_09_kuveytt_rk_ti_cari_kart_235450_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('e32ec9d6-59fa-4954-aab9-5af3073a7e2a', 'tedarikci', 'NİSAN AYI MESAİLERİ', 'masraf', 400000, '2026-05-18', 'bekliyor', 'odeme', '2026-05-01', 'MESAİ', NULL, '02358e011925b266_odeme_2026_05_18_ni_san_ayi_mesai_leri_400000_0_', '2e42bebacfef2d8b_2026_05_18_ni_san_ayi_mesai_leri_', '4c834cc2-838b-462c-bc13-ba374d1d0d23', 40, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '4c834cc2-838b-462c-bc13-ba374d1d0d23', id, 50
FROM public.payments WHERE external_import_key = '02358e011925b266_odeme_2026_05_18_ni_san_ayi_mesai_leri_400000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('6da0427f-a62c-4908-a0b5-ffb3e91328e5', 'tedarikci', 'İŞ ORTAKLIĞI 1. DÖNEM GEÇİCİ VERGİ ÖDESİ', 'masraf', 578000, '2026-05-18', 'bekliyor', 'odeme', '2026-05-01', 'VERGİ', NULL, '2c5c5ac9eae30bb3_odeme_2026_05_18_i_ortakli_i_1_d_nem_ge_i_ci_vergi_desi_578000_0_', '9e864714a3c61bfc_2026_05_18_i_ortakli_i_1_d_nem_ge_i_ci_vergi_desi_', '4c834cc2-838b-462c-bc13-ba374d1d0d23', 40, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '4c834cc2-838b-462c-bc13-ba374d1d0d23', id, 51
FROM public.payments WHERE external_import_key = '2c5c5ac9eae30bb3_odeme_2026_05_18_i_ortakli_i_1_d_nem_ge_i_ci_vergi_desi_578000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('4bb60e92-7d8d-46ac-8981-e3938216f04f', 'tedarikci', 'MUSTAFA YEŞİL  - KIDEM TAZMİNATI', 'masraf', 50000, '2026-05-25', 'bekliyor', 'odeme', '2026-05-01', 'ÇEKLER', 'TİCARİ ÇEK', 'd47fb97fa370ab41_cek_2026_05_25_mustafa_ye_i_l_kidem_tazmi_nati_50000_0_ti_cari_ek', '063e62145170c497_2026_05_25_mustafa_ye_i_l_kidem_tazmi_nati_ti_cari_ek', '652e3b27-4401-4e21-aa59-05089774ca73', 50, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '652e3b27-4401-4e21-aa59-05089774ca73', id, 52
FROM public.payments WHERE external_import_key = 'd47fb97fa370ab41_cek_2026_05_25_mustafa_ye_i_l_kidem_tazmi_nati_50000_0_ti_cari_ek'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('e1e04098-1743-4c6b-8bef-fe4e802c65b1', 'tedarikci', 'NİSAN AYI PRİM', 'masraf', 570000, '2026-05-31', 'bekliyor', 'odeme', '2026-05-01', 'SGK', 'KAYNAK TARIH HATALI (31-06-2026), muhasebeci teyidi gerekiyor', 'a2a290318df5a9c6_odeme_31_06_2026_ni_san_ayi_pri_m_570000_0_', '65aca1dec1afa6b0_31_06_2026_ni_san_ayi_pri_m_', '652e3b27-4401-4e21-aa59-05089774ca73', 50, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '652e3b27-4401-4e21-aa59-05089774ca73', id, 53
FROM public.payments WHERE external_import_key = 'a2a290318df5a9c6_odeme_31_06_2026_ni_san_ayi_pri_m_570000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('c671ebdc-ae2e-48dc-be26-dc1c79b9d6a8', 'tedarikci', 'NİSAN AYI MESAİLERİ', 'masraf', 290000, '2026-05-19', 'bekliyor', 'odeme', '2026-05-01', 'MESAİ', NULL, '696852c9a2b891bf_odeme_2026_05_19_ni_san_ayi_mesai_leri_290000_0_', '4a8f79929bdc2adf_2026_05_19_ni_san_ayi_mesai_leri_', '652e3b27-4401-4e21-aa59-05089774ca73', 50, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '652e3b27-4401-4e21-aa59-05089774ca73', id, 54
FROM public.payments WHERE external_import_key = '696852c9a2b891bf_odeme_2026_05_19_ni_san_ayi_mesai_leri_290000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('0eb5710b-c3d4-4b9a-881b-23c956c5a345', 'tedarikci', 'İŞ ORTAKLIĞI 1. DÖNEM GEÇİCİ VERGİ ÖDESİ', 'masraf', 578000, '2026-05-19', 'bekliyor', 'odeme', '2026-05-01', 'VERGİ', NULL, '49c70d0882550d3a_odeme_2026_05_19_i_ortakli_i_1_d_nem_ge_i_ci_vergi_desi_578000_0_', 'abc043859abd63c3_2026_05_19_i_ortakli_i_1_d_nem_ge_i_ci_vergi_desi_', '652e3b27-4401-4e21-aa59-05089774ca73', 50, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '652e3b27-4401-4e21-aa59-05089774ca73', id, 55
FROM public.payments WHERE external_import_key = '49c70d0882550d3a_odeme_2026_05_19_i_ortakli_i_1_d_nem_ge_i_ci_vergi_desi_578000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('4d24d8c7-5482-44f1-be0d-1d6245bf46c3', 'tedarikci', 'BAŞAK PETROL - DBS VAKIF BANKASI', 'masraf', 185978, '2026-05-20', 'bekliyor', 'odeme', '2026-05-01', 'DBS', NULL, '4256e919c9b3a33c_odeme_2026_05_20_ba_ak_petrol_dbs_vakif_bankasi_185978_0_', '19cc4967e2ca8729_2026_05_20_ba_ak_petrol_dbs_vakif_bankasi_', '652e3b27-4401-4e21-aa59-05089774ca73', 50, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '652e3b27-4401-4e21-aa59-05089774ca73', id, 56
FROM public.payments WHERE external_import_key = '4256e919c9b3a33c_odeme_2026_05_20_ba_ak_petrol_dbs_vakif_bankasi_185978_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('de80265c-0cb4-4024-a16c-4e77d73e450b', 'tedarikci', 'HAKAN OTOMOTİV - HAKAN KARABULUT', 'masraf', 44600, '2026-05-22', 'bekliyor', 'odeme', '2026-05-01', 'FATURASI', NULL, 'fe45b4394a35466d_odeme_2026_05_22_hakan_otomoti_v_hakan_karabulut_44600_0_', '70416f354e0d3d21_2026_05_22_hakan_otomoti_v_hakan_karabulut_', '652e3b27-4401-4e21-aa59-05089774ca73', 50, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT '652e3b27-4401-4e21-aa59-05089774ca73', id, 57
FROM public.payments WHERE external_import_key = 'fe45b4394a35466d_odeme_2026_05_22_hakan_otomoti_v_hakan_karabulut_44600_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('f54c31ba-bd27-4157-b980-3c562a83db7c', 'tedarikci', 'ÇETSAN ÇELİK HALAT', 'masraf', 51463.93, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'ÇETSAN ÇELİK HALAT', NULL, 'bf8b8d31fc8605fe_odeme_2026_07_10_etsan_eli_k_halat_51463_93_', 'b02f80164922f6b5_2026_07_10_etsan_eli_k_halat_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 58
FROM public.payments WHERE external_import_key = 'bf8b8d31fc8605fe_odeme_2026_07_10_etsan_eli_k_halat_51463_93_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('00b81274-00e2-4b1e-9f78-3e20ce10ca57', 'tedarikci', 'MAPAR OTOMOTİV', 'masraf', 97860, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'MAPAR OTOMOTİV', NULL, '75484b151e46eb6b_odeme_2026_07_10_mapar_otomoti_v_97860_0_', 'b312c036363c9a4c_2026_07_10_mapar_otomoti_v_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 59
FROM public.payments WHERE external_import_key = '75484b151e46eb6b_odeme_2026_07_10_mapar_otomoti_v_97860_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('be6db6da-6983-422e-b991-50765505b20c', 'tedarikci', 'TEZELLER OTOMOTİV', 'masraf', 63420, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'TEZELLER OTOMOTİV', NULL, '3ac0b50eb93c474a_odeme_2026_07_10_tezeller_otomoti_v_63420_0_', '264fb0bc20694963_2026_07_10_tezeller_otomoti_v_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 60
FROM public.payments WHERE external_import_key = '3ac0b50eb93c474a_odeme_2026_07_10_tezeller_otomoti_v_63420_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('b438b758-f971-4eee-84f8-420ecc15b4de', 'tedarikci', 'BERBEROĞLU', 'masraf', 28800, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'BERBEROĞLU', NULL, '9edc29ea3e1a4354_odeme_2026_07_10_berbero_lu_28800_0_', '3d7a3aaef56071c1_2026_07_10_berbero_lu_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 61
FROM public.payments WHERE external_import_key = '9edc29ea3e1a4354_odeme_2026_07_10_berbero_lu_28800_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('feb13b97-eda1-4a2c-8300-90cd059112cb', 'tedarikci', 'ONUR ALANLAR', 'masraf', 17000, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'ONUR ALANLAR', NULL, '088a93d4998693ca_odeme_2026_07_10_onur_alanlar_17000_0_', 'f8b70b58b079a178_2026_07_10_onur_alanlar_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 62
FROM public.payments WHERE external_import_key = '088a93d4998693ca_odeme_2026_07_10_onur_alanlar_17000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('bd332cd3-55f7-40c3-81c8-845738981d45', 'tedarikci', 'ALPARTS OTO', 'masraf', 60780, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'ALPARTS OTO', NULL, '0d34bf035d6b8cb6_odeme_2026_07_10_alparts_oto_60780_0_', '623a49e234ba2fc4_2026_07_10_alparts_oto_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 63
FROM public.payments WHERE external_import_key = '0d34bf035d6b8cb6_odeme_2026_07_10_alparts_oto_60780_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('deffc881-9ea9-41f7-bf26-925140f769a0', 'tedarikci', 'BİZİM PREFABRİK', 'masraf', 225000, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'BİZİM PREFABRİK', NULL, '44157eb7bc1c2c99_odeme_2026_07_10_bi_zi_m_prefabri_k_225000_0_', '0a5d191523276fda_2026_07_10_bi_zi_m_prefabri_k_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 64
FROM public.payments WHERE external_import_key = '44157eb7bc1c2c99_odeme_2026_07_10_bi_zi_m_prefabri_k_225000_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('dd2e7be5-86d0-4e36-8c0e-558f52eb88f1', 'tedarikci', 'REVAK OSGB', 'masraf', 89590, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'REVAK OSGB', NULL, '7a73c969381555e6_odeme_2026_07_10_revak_osgb_89590_0_', '6799a814bb70ff7e_2026_07_10_revak_osgb_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 65
FROM public.payments WHERE external_import_key = '7a73c969381555e6_odeme_2026_07_10_revak_osgb_89590_0_'
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (id, recipient_type, recipient_name, category, amount, due_date, status, kind, period_month, title, notes, external_import_key, dedupe_family, source_list_id, revision_priority, is_migrated, currency, paid_amount)
VALUES ('f1199333-340d-4bc2-a451-0620a0730c77', 'tedarikci', 'GİRGİN MUHASEBE', 'masraf', 59200, '2026-07-10', 'bekliyor', 'odeme', '2026-07-01', 'GİRGİN MUHASEBE', NULL, '8966737017ad6a0a_odeme_2026_07_10_gi_rgi_n_muhasebe_59200_0_', '3254c5fa4e4b9826_2026_07_10_gi_rgi_n_muhasebe_', 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', 10, true, 'TRY', NULL)
ON CONFLICT (external_import_key) WHERE external_import_key IS NOT NULL AND deleted_at IS NULL DO NOTHING;
INSERT INTO public.payment_list_items (list_id, payment_id, sort_order)
SELECT 'ecaa744d-ea19-4102-99c7-a95dd0976cdd', id, 66
FROM public.payments WHERE external_import_key = '8966737017ad6a0a_odeme_2026_07_10_gi_rgi_n_muhasebe_59200_0_'
ON CONFLICT DO NOTHING;


INSERT INTO public.import_batches (id, import_type, source_file, total_rows, inserted_rows, status, notes, created_at)
VALUES ('0a38011b-ebdd-4f18-ba73-e688fbb4dc77', 'faz4_monthly_payment_lists', 'bizim_vinc_odeme_listeleri_DEDUPED_IMPORT.csv', 68, 67, 'completed', 'Ikinci workbook adli odeme plani sayfalari (5 liste). 1 TOPLAM TUTAR satiri atlandi, 1 tarih hatasi duzeltildi (bkz. migration yorumu).', now());

NOTIFY pgrst, 'reload schema';
