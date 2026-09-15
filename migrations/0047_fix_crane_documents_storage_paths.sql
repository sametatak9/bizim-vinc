-- 0047_fix_crane_documents_storage_paths.sql
-- 0046'nin dogurdugu iki hatayi duzeltir:
--  1) Orijinal yukleme script'i Turkce karakterleri (İ, Ç, vb.) bazi dosya
--     adlarinda bozmustu (ornegin "TRAFİK" bucket'ta "TRAF0K" olarak
--     kaydolmustu) - storage_path bu yuzden gercek nesne anahtariyla
--     eslesmiyordu. Etkilenen 22 dosya, temiz ASCII anahtarlara tasindi
--     (storage.objects.move, bu migration DISINDA elle calistirildi) ve
--     buradaki UPDATE'ler storage_path'i o yeni anahtarlarla hizalar.
--  2) 7 adet "34 CJP 057" evragi, orijinal script'teki $craneId/$plate
--     degiskeninin bozulmasi yuzunden yanlislikla "34 EVP 484"nin
--     crane_id'sine baglanmisti (her arac AYRI kimlik ilkesine aykiri).
--     Bu 7 satirin hem crane_id'si hem storage_path'i, ayni islemle
--     dogru vinca (34 CJP 057) tasinmis dosyalara guncellendi.
--
-- NOT: Bu migration sadece metadata (storage_path/crane_id) gunceller.
-- Gercek storage nesnelerinin tasinmasi (storage.objects.move), Supabase
-- Storage API'si uzerinden bu migration'in disinda, ayni oturumda
-- uygulanmis ve dogrulanmistir (bkz. get_public_crane_card_documents
-- testi: 34 CJP 057 -> 7 belge, 34 EVP 484 -> 5 belge).

UPDATE public.crane_documents SET storage_path = '01346ece-6373-4eac-aab4-851ed3f33a63/diger/filo-2026-08-04-34-EFK-142---SIGORTA2025.pdf' WHERE id = '8c15f1d6-208a-4536-9cea-9aca79a7f760';
UPDATE public.crane_documents SET storage_path = '01346ece-6373-4eac-aab4-851ed3f33a63/muayene/filo-2026-08-04-34-EFK-142---EGZOZ-MUAYENESI.pdf' WHERE id = '9aca6033-fe7c-40e5-ac45-e8bf80d8277f';
UPDATE public.crane_documents SET storage_path = '14dfd19b-24dd-4c0c-b7be-26347b13000c/trafik_sigorta/filo-2026-07-27-34-EFK-542-TRAFIK-MAKBUZU.pdf' WHERE id = 'ca354e97-7d11-4156-ba90-584a75427e20';
UPDATE public.crane_documents SET storage_path = '14dfd19b-24dd-4c0c-b7be-26347b13000c/trafik_sigorta/filo-2026-07-27-34-EFK-542-TRAFIK-POLICESI.pdf' WHERE id = 'f66d7352-5278-4baf-8428-77d498847b25';
UPDATE public.crane_documents SET storage_path = '16565316-d35c-47a8-bd72-d5d29e10660b/diger/filo-2025-07-28-BIZIM-VIN--34FJY160-MAKBUZ.pdf' WHERE id = 'f1349bd1-838f-430e-8752-687af3112f12';
UPDATE public.crane_documents SET storage_path = '165eee83-3062-4fe3-b26d-c08f46a57b9f/trafik_sigorta/filo-2026-02-11-34-BZM-042---TRAFIK-SIGORTASI.pdf' WHERE id = '8846b8c2-d5df-491e-8d84-23ed0e47b4b9';
UPDATE public.crane_documents SET storage_path = '1d325961-69ab-4fc7-ab70-edc0bf54f299/trafik_sigorta/filo-2026-07-01-34-ECV-521-TRAFIK-MAKBUZU.pdf' WHERE id = '4d0acabc-d85c-4ab2-be19-c7fb85114f53';
UPDATE public.crane_documents SET storage_path = '1d325961-69ab-4fc7-ab70-edc0bf54f299/trafik_sigorta/filo-2026-07-01-34-ECV-521-TRAFIK-POLICESI.pdf' WHERE id = 'a69582d1-441b-4e55-a86e-3cf0c02604ab';
UPDATE public.crane_documents SET storage_path = '2a8966dd-f345-40c5-a984-dda4f2ea0c37/trafik_sigorta/filo-2026-07-27-34-CGC-686-TRAFIK-MAKBUZU.pdf' WHERE id = 'bf7048ec-16d1-42bd-ab8c-65275e2bee93';
UPDATE public.crane_documents SET storage_path = '2a8966dd-f345-40c5-a984-dda4f2ea0c37/trafik_sigorta/filo-2026-07-27-34-CGC-686-TRAFIK-POLICESI.pdf' WHERE id = '8d414b79-f6e5-4c6f-91c3-922dd5a587af';
UPDATE public.crane_documents SET storage_path = '48b8fca2-25d3-4257-8b94-2dd752d40309/trafik_sigorta/filo-2024-06-13-34-KMS-052-TRAFIK-SIGORTA-PLAKA-DEGISIKLIK-EKI.PDF' WHERE id = '35319372-261e-49c1-b9c0-c78613f34770';
UPDATE public.crane_documents SET storage_path = '48b8fca2-25d3-4257-8b94-2dd752d40309/trafik_sigorta/filo-2025-05-15-34-KMS-052-TRAFIK-SIGORTASI.pdf' WHERE id = 'a1cb4255-c67a-443d-a7d2-afdccbbae0a1';
UPDATE public.crane_documents SET crane_id = 'ed44c981-d214-4cd5-812c-89333fb1c202', storage_path = 'ed44c981-d214-4cd5-812c-89333fb1c202/diger/filo-2025-07-28-BIZIM-VIN--34CJP057-POLICE.pdf' WHERE id = '23d2e52e-72fc-432f-bd8c-71ebf85df8a8';
UPDATE public.crane_documents SET storage_path = '9979c76b-3a36-425c-a10a-3ac681069ef3/diger/filo-2025-11-25-BIZIM-VIN--MK-YENILEME-SIGORTASI-GROVE-VE-MPG-15.11.2025.pdf' WHERE id = '4a6626ab-46ed-469f-90bf-8826c22de9d5';
UPDATE public.crane_documents SET crane_id = 'ed44c981-d214-4cd5-812c-89333fb1c202', storage_path = 'ed44c981-d214-4cd5-812c-89333fb1c202/diger/filo-2026-01-03-YS-26.0004--PLAKA--34-CJP-057-NOVA-YSIP.pdf' WHERE id = 'b6dc94e0-c903-4dcb-925d-978218e65936';
UPDATE public.crane_documents SET crane_id = 'ed44c981-d214-4cd5-812c-89333fb1c202', storage_path = 'ed44c981-d214-4cd5-812c-89333fb1c202/muayene/filo-2025-06-27-Egzoz-Muayenesi.pdf' WHERE id = '7ce534bc-b841-4810-a808-c9f75f1c0597';
UPDATE public.crane_documents SET crane_id = 'ed44c981-d214-4cd5-812c-89333fb1c202', storage_path = 'ed44c981-d214-4cd5-812c-89333fb1c202/muayene/filo-2025-06-27-T-vt-rk-Muayene.pdf' WHERE id = '84a5e3a3-058d-442b-9a36-495ff8e91ab6';
UPDATE public.crane_documents SET crane_id = 'ed44c981-d214-4cd5-812c-89333fb1c202', storage_path = 'ed44c981-d214-4cd5-812c-89333fb1c202/ruhsat/filo-2025-03-24-34-CJP-057---RUHSAT.pdf' WHERE id = 'd30418cc-629c-4c51-b893-6bbe5b210d0f';
UPDATE public.crane_documents SET storage_path = '9979c76b-3a36-425c-a10a-3ac681069ef3/trafik_sigorta/filo-2026-07-01-34-EVP-484-TRAFIK-MAKBUZ.pdf' WHERE id = '1e6e4b2c-2a87-4d80-b6c7-d81f0b0ffd71';
UPDATE public.crane_documents SET storage_path = '9979c76b-3a36-425c-a10a-3ac681069ef3/trafik_sigorta/filo-2026-07-01-34-EVP-484-TRAFIK-SIGORTASI.pdf' WHERE id = '9c66a3ee-077a-45eb-a20b-51722e5ff395';
UPDATE public.crane_documents SET crane_id = 'ed44c981-d214-4cd5-812c-89333fb1c202', storage_path = 'ed44c981-d214-4cd5-812c-89333fb1c202/trafik_sigorta/filo-2026-08-03-34-CJP-057-TRAFIK.pdf' WHERE id = '127870f7-a6c6-4bf5-8e91-42d34bf6ee86';
UPDATE public.crane_documents SET crane_id = 'ed44c981-d214-4cd5-812c-89333fb1c202', storage_path = 'ed44c981-d214-4cd5-812c-89333fb1c202/tum_evraklar/filo-2026-08-24-34-CJP-057---T-M-EVRAKLAR.pdf' WHERE id = 'b308d71b-552a-45d9-ba21-bfdd3931607a';
UPDATE public.crane_documents SET storage_path = 'c8082adb-b697-432d-a506-c5fe546e30d9/diger/filo-2026-08-17-BIZIM-VIN--BEZ-SAPAN---5-15.05.2026.pdf' WHERE id = '511fafb1-475b-4ecf-b904-b8f8f58a1b92';
UPDATE public.crane_documents SET storage_path = 'c8082adb-b697-432d-a506-c5fe546e30d9/diger/filo-2026-08-17-BIZIM-VIN--BEZ-SAPAN---6-15.05.2026.pdf' WHERE id = '586de635-7f77-44d7-8989-dbd2bc010bb8';
UPDATE public.crane_documents SET storage_path = 'c8082adb-b697-432d-a506-c5fe546e30d9/diger/filo-2026-08-17-BIZIM-VIN--BEZ-SAPAN---7-15.05.2026.pdf' WHERE id = 'ba78473a-2bf6-45a9-ba87-a048acc3d664';
UPDATE public.crane_documents SET storage_path = 'c8082adb-b697-432d-a506-c5fe546e30d9/diger/filo-2026-08-17-BIZIM-VIN--BEZ-SAPAN---8-15.05.2026.pdf' WHERE id = 'ccf0bcf7-69f3-4d71-a972-cc65dd2987eb';
UPDATE public.crane_documents SET storage_path = 'cc31faaa-53a1-4ecd-8f08-98d97b4b6f2b/trafik_sigorta/filo-2026-06-02-34-PVV-371-TRAFIK-PLAKA-ZEYILI.pdf' WHERE id = '244cffdb-b088-44cc-8801-87cab0d260d4';
UPDATE public.crane_documents SET storage_path = 'fd04bc7f-60a6-4c6d-badb-bd92dc8ea44c/trafik_sigorta/filo-2026-07-28-34-DUP-461-TRAFIK-kKPrimTahsilatMakbuzu.pdf' WHERE id = '5eed1dbd-8366-4aa7-a18d-1aefdab912f0';
UPDATE public.crane_documents SET storage_path = 'fd04bc7f-60a6-4c6d-badb-bd92dc8ea44c/trafik_sigorta/filo-2026-07-28-34-DUP-461-TRAFIK-SIGORTASI.pdf' WHERE id = '4192dcb3-5cd9-4740-aff3-1b31a572872b';
