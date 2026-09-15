-- 0051_filo_destek_partner_araclar.sql
-- 03_FILO_LISTELER/FILO_ENVANTER.csv + 10_SIGORTA_KASKO paketindeki gercek
-- sigorta/ruhsat belgeleriyle dogrulanan destek/partner araclari filoya
-- ekler. Bunlar "vinc" degil (sondaj araci, kompresor, cekici, dorse,
-- kamyonet) veya Zafer firmasina ait partner vinc (kind=partner_vinc,
-- FILO_ENVANTER'da ayrica isaretli) - yine de "her arac ayri kimlik"
-- ilkesi geregi kendi kartlari var. team/tonnage/brand FILO_ENVANTER.csv
-- ile birebir; card_slug plakadan turetildi.
INSERT INTO public.cranes (code, plate, team, tonnage, metre, brand, type, crane_type, capacity, status, card_slug)
SELECT v.code, v.plate, v.team, v.tonnage, v.metre, v.brand, v.type, v.crane_type, v.capacity, v.status, v.card_slug
FROM (VALUES
  ('34 ND 4136', '34 ND 4136', 'sondaj', NULL::numeric, NULL::numeric, 'IVECO', 'Sondaj Destek Aracı', 'Sondaj Destek Aracı', 'Daily', 'musait', '34-nd-4136'),
  ('59 00 17 0108', '59 00 17 0108', 'sondaj', NULL, NULL, 'SCANİA', 'Sondaj Aracı', 'Sondaj Aracı', 'Sondaj', 'musait', '59-00-17-0108'),
  ('59 00 16 0037', '59 00 16 0037', 'sondaj', NULL, NULL, 'DODGE', 'Sondaj Aracı', 'Sondaj Aracı', 'Sondaj', 'musait', '59-00-16-0037'),
  ('39 00 12 00 24', '39 00 12 00 24', 'sondaj', 10, NULL, 'FORD', 'Sondaj Destek Aracı', 'Sondaj Destek Aracı', '10 ton', 'musait', '39-00-12-00-24'),
  ('34 YTF 54', '34 YTF 54', 'sondaj', NULL, NULL, 'MERCEDES - ATLAS COPCO', 'Kompresör', 'Kompresör', 'Kompresör', 'musait', '34-ytf-54'),
  ('34 NJD 682', '34 NJD 682', 'mobil', NULL, NULL, 'FORD', 'Destek Aracı', 'Destek Aracı', 'Kayar Kasa', 'musait', '34-njd-682'),
  ('34 PFG 511', '34 PFG 511', 'mobil', NULL, NULL, 'CANGÜL', 'Destek Aracı', 'Destek Aracı', 'Sal Dorse', 'musait', '34-pfg-511'),
  ('34 EK 0370', '34 EK 0370', 'zafer', NULL, NULL, NULL, 'Partner Çekici', 'Partner Çekici', 'Çekici', 'musait', '34-ek-0370'),
  ('81 DP 491', '81 DP 491', 'zafer', 25, NULL, NULL, 'Partner Vinç', 'Partner Vinç', '25 ton', 'musait', '81-dp-491'),
  ('34 VF 2057', '34 VF 2057', 'zafer', 30, NULL, NULL, 'Partner Vinç', 'Partner Vinç', '30 ton', 'musait', '34-vf-2057'),
  ('34 DSS 841', '34 DSS 841', 'zafer', 70, NULL, NULL, 'Partner Vinç', 'Partner Vinç', '70 ton', 'musait', '34-dss-841'),
  ('34 AR 7194', '34 AR 7194', 'zafer', NULL, 26, NULL, 'Partner Vinç', 'Partner Vinç', '26 metre', 'musait', '34-ar-7194'),
  ('34 RAR 842', '34 RAR 842', 'ticari', NULL, NULL, 'FORD', 'Ticari Kamyonet', 'Ticari Kamyonet', 'Kamyonet', 'musait', '34-rar-842')
) AS v(code, plate, team, tonnage, metre, brand, type, crane_type, capacity, status, card_slug)
WHERE NOT EXISTS (SELECT 1 FROM public.cranes c WHERE c.plate = v.plate);
