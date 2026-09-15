-- 0045_filo_pilot_12_vinc.sql
-- Filo pilot fazi: 12 gercek vinc, kendi plaka/ekip/tonaj/marka/card_slug
-- kimligiyle. Kaynak: G:\Drive'im\BIZIM_VINC_CLAUDE_PAKET\PAKETLER\03_FILO_PILOT_PAKET.zip
-- Idempotent: ayni plaka zaten varsa tekrar eklenmez.

INSERT INTO public.cranes (code, plate, team, tonnage, metre, brand, type, crane_type, capacity, status, card_slug)
SELECT v.code, v.plate, v.team, v.tonnage, v.metre, v.brand, v.type, v.crane_type, v.capacity, v.status, v.card_slug
FROM (VALUES
  ('34 BZM 042','34 BZM 042','mobil',450,NULL,'GMK 6450-1','Mobil Vinç','Mobil Vinç','450 ton','musait','34-bzm-042'),
  ('34 CGC 686','34 CGC 686','hiup',27,NULL,'MERCEDES','Hi-up Vinç','Hi-up Vinç','27 ton','musait','34-cgc-686'),
  ('34 CJP 057','34 CJP 057','sepetli',NULL,27,'İVECO','Sepetli Vinç','Sepetli Vinç','27 metre','musait','34-cjp-057'),
  ('34 DUP 461','34 DUP 461','hiup',20,NULL,'MERCEDES','Hi-up Vinç','Hi-up Vinç','20 ton','musait','34-dup-461'),
  ('34 ECV 521','34 ECV 521','hiup',45,NULL,'VOLVO','Hi-up Vinç','Hi-up Vinç','45 ton','musait','34-ecv-521'),
  ('34 EFK 042','34 EFK 042','mobil',250,NULL,'GROVE','Mobil Vinç','Mobil Vinç','250 ton','musait','34-efk-042'),
  ('34 EFK 142','34 EFK 142','hiup',105,NULL,'SCANIA','Hi-up Vinç','Hi-up Vinç','105 ton','musait','34-efk-142'),
  ('34 EFK 542','34 EFK 542','mobil',150,NULL,'GROVE','Mobil Vinç','Mobil Vinç','150 ton','musait','34-efk-542'),
  ('34 EVP 484','34 EVP 484','sepetli',NULL,53,'VESA (Mercedes şasi)','Sepetli Vinç','Sepetli Vinç','53 metre','musait','34-evp-484'),
  ('34 FJY 160','34 FJY 160','hiup',95,NULL,'SCANIA','Hi-up Vinç','Hi-up Vinç','95 ton','musait','34-fjy-160'),
  ('34 KMS 052','34 KMS 052','hiup',65,NULL,'SCANIA','Hi-up Vinç','Hi-up Vinç','65 ton','musait','34-kms-052'),
  ('34 PVV 371','34 PVV 371','hiup',75,NULL,'BMACH (İveco şasi)','Hi-up Vinç','Hi-up Vinç','75 ton','musait','34-pvv-371')
) AS v(code, plate, team, tonnage, metre, brand, type, crane_type, capacity, status, card_slug)
WHERE NOT EXISTS (SELECT 1 FROM public.cranes c WHERE c.plate = v.plate);
