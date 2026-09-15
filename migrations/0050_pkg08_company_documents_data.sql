-- 0050_pkg08_company_documents_data.sql
-- Paket 08 (KIRALAMA_MUHASEBE_KIMLIK) gercek sirket evraklari: 3 kiralama
-- sozlesme/teslim formu (Ada Proses), 14 satin alma evragi, 18 sirket
-- kimligi evragi (vergi levhasi, faaliyet belgesi, imza sirkuleri vb.),
-- 4 yakit tedarik evragi. Kaynak: G:\Drive'im\BIZIM_VINC_CLAUDE_PAKET\
-- PAKETLER\08_KIRALAMA_MUHASEBE_KIMLIK.zip. Ornek/format-referans
-- dosyalari (CEK_ORNEK, PUANTAJ_ORNEK) ve klasor envanter CSV'leri
-- bilinçli olarak disarida birakildi (gercek islem verisi degil).

INSERT INTO public.company_documents (category, file_name, storage_path, document_date, is_sensitive, uploaded_by) VALUES
  ('kiralama', '01.01.2026 Ada Proses Kiralama Sözleşmesi.pdf', 'kiralama/01.01.2026-Ada-Proses-Kiralama-Sozlesmesi.pdf', '2026-01-01', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('kiralama', '06.01.2026 - 1204 TESLİM FORMU (EK-3)_signed_06012026_115048.pdf', 'kiralama/06.01.2026-1204-TESLIM-FORMU-EK-3-signed-06012026-115048.pdf', '2026-01-06', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('kiralama', '1005 TESLİM FORMU (EK-3)_signed_06012026_132022.pdf', 'kiralama/1005-TESLIM-FORMU-EK-3-signed-06012026-132022.pdf', '2026-01-06', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', '15122023091449.pdf', 'satin_alma/15122023091449.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', '3_302_507_TR_20171005_515enHORTUM TAMBURU.pdf', 'satin_alma/3-302-507-TR-20171005-515enHORTUM-TAMBURU.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'QPG-23-513-0-BIZIM VINC-24122023.pdf', 'satin_alma/QPG-23-513-0-BIZIM-VINC-24122023.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'GMK5250XL-1 # 9647 - YAĞ BAKIM TABLOSU.pdf', 'satin_alma/GMK5250XL-1-9647-YAG-BAKIM-TABLOSU.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'arac-listesi (77).pdf', 'satin_alma/arac-listesi-77-.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'COC.pdf', 'satin_alma/COC.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'GROVE AT5 SFBD124A5AXX 60250X116AXZA GMK 5250XL-1 N3G e1-2007-46-1690-06.pdf', 'satin_alma/GROVE-AT5-SFBD124A5AXX-60250X116AXZA-GMK-5250XL-1-N3G-e1-2007-46-1690-06.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'KDV İSTİSNA YAZISI.pdf', 'satin_alma/KDV-ISTISNA-YAZISI.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'man tse belgesi.pdf', 'satin_alma/man-tse-belgesi.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'TRAFİK ŞAHADETANMESİ.PDF', 'satin_alma/TRAFIK-SAHADETANMESI.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'YILLIK HEDEF CİRO HEDEFLERİ 2023-2024.xlsx', 'satin_alma/YILLIK-HEDEF-CIRO-HEDEFLERI-2023-2024.xlsx', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('satin_alma', 'İthal Araçların Gümrük İncelemesi Hizmeti Başvuru Formu.pdf', 'satin_alma/Ithal-Araclarin-Gumruk-Incelemesi-Hizmeti-Basvuru-Formu.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', '634976_0_Faaliyet_Belgesi_8847042.pdf', 'sirket_kimlik/634976-0-Faaliyet-Belgesi-8847042.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', '634976_0_Faaliyet_Belgesi_8847045.pdf', 'sirket_kimlik/634976-0-Faaliyet-Belgesi-8847045.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'ARAÇ BİLGİLERİ.docx', 'sirket_kimlik/ARAC-BILGILERI.docx', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'ARAÇ KAYIT FORMU.docx', 'sirket_kimlik/ARAC-KAYIT-FORMU.docx', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'BZV2026000000446 BIZIM VINC VE SONDAJ ANO VIP ULUSLARARASI TASIMAC 2026 07 29.PDF.pdf', 'sirket_kimlik/BZV2026000000446-BIZIM-VINC-VE-SONDAJ-ANO-VIP-ULUSLARARASI-TASIMAC-2026-07-29.PDF.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'BİZİM VİNÇ GÜNCEL VERGİ LEVHASI.pdf', 'sirket_kimlik/BIZIM-VINC-GUNCEL-VERGI-LEVHASI.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'Dekont (4).pdf', 'sirket_kimlik/Dekont-4-.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'dekont 2.pdf', 'sirket_kimlik/dekont-2.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'HGS ARAÇ BİLGİ KAYIT FORMU.docx', 'sirket_kimlik/HGS-ARAC-BILGI-KAYIT-FORMU.docx', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'protokol.jpeg', 'sirket_kimlik/protokol.jpeg', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'Shell Kurumsal HGS Bayi - Müşteri Sözleşmesi 260107 - Kopya.docx', 'sirket_kimlik/Shell-Kurumsal-HGS-Bayi-Musteri-Sozlesmesi-260107-Kopya.docx', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'SÖZLEŞME KAPAK FORMU.docx', 'sirket_kimlik/SOZLESME-KAPAK-FORMU.docx', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'TASITTANIMA AKARYAKIT SANAYI VE TICARET ANONIM SIRKETI 2025 VERGİ LEVHASI (1).pdf', 'sirket_kimlik/TASITTANIMA-AKARYAKIT-SANAYI-VE-TICARET-ANONIM-SIRKETI-2025-VERGI-LEVHASI-1-.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'TTS SÖZLEŞME 2026.pdf', 'sirket_kimlik/TTS-SOZLESME-2026.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'yibf_sozlesme_a2019.pdf', 'sirket_kimlik/yibf-sozlesme-a2019.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'Yuklenici_Is_Bitirme_Belgesi_KIK026_1_H_isd_v2.pdf', 'sirket_kimlik/Yuklenici-Is-Bitirme-Belgesi-KIK026-1-H-isd-v2.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'İmza Sirküleri - Mehmetali Efek - Güncel.pdf', 'sirket_kimlik/Imza-Sirkuleri-Mehmetali-Efek-Guncel.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'İNTERNET ŞİFRE FORMU.pdf', 'sirket_kimlik/INTERNET-SIFRE-FORMU.pdf', NULL, true, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'Şahıs Vekaletname - Mehmetali Efek.pdf', 'sirket_kimlik/Sahis-Vekaletname-Mehmetali-Efek.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('yakit', 'EMRE GÜLER.pdf', 'yakit/EMRE-GULER.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('yakit', 'SİPARİŞ FORMU EMRE PETROL.pdf', 'yakit/SIPARIS-FORMU-EMRE-PETROL.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('yakit', 'Talep.pdf', 'yakit/Talep.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('yakit', 'İkmal Sözleşmesi.pdf', 'yakit/Ikmal-Sozlesmesi.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f')
ON CONFLICT DO NOTHING;
