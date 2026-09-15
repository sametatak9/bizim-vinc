-- 0054_pkg10_muhasebe_personel_sirket_belgeleri.sql
-- Paket 10'un arac disi icerigi:
--  * MUHASEBE_EK (27): dekont/ekstre/vergi odemesi/hesap hareketi -> muhasebe
--  * Sirket sablonlari (3): egitim katilim formu, katilimci listesi, ekip atama
--  * Personel (3): Elvan Ceyhan + Emrah Unsal + Onur Likoglu (isim dosya adinda
--    acikca geciyor, AKTIF personel kaydina baglandi; pasif MIG-xxx kopyalarina
--    degil). Hepsi is_sensitive=true.
-- NOT: 9 personelin SGK tescil belgesi kaynak zip'in duzlestirme adimindaki
-- isim cakismasi yuzunden tek dosyaya inmis ve hangi kisiye ait oldugu
-- belirlenemedigi icin BILINCLI olarak iceri alinmadi (tahminle baglanmadi).

INSERT INTO public.company_documents (category, file_name, storage_path, document_date, is_sensitive, uploaded_by) VALUES
  ('muhasebe', 'DEKONT - 2908 eur iş veren-bizim vinç mkbz.pdf', 'muhasebe/DEKONT-2908-eur-is-veren-bizim-vinc-mkbz.pdf', '2024-12-03', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'DEKONT - bizim vinç 3. şahıs +kancaaltı  sorumluluk  11 500 eur.pdf', 'muhasebe/DEKONT-bizim-vinc-3.-sahis-kancaalti-sorumluluk-11-500-eur.pdf', '2024-12-03', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'DEKONT - bizim vinç mk pol peşinat mkbz.pdf', 'muhasebe/DEKONT-bizim-vinc-mk-pol-pesinat-mkbz.pdf', '2024-12-03', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'DEKONT - Dekont (1).pdf', 'muhasebe/DEKONT-Dekont-1-.pdf', '2024-11-15', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'DEKONT - Dekont (2).pdf', 'muhasebe/DEKONT-Dekont-2-.pdf', '2024-11-25', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'DEKONT - Dekont (3).pdf', 'muhasebe/DEKONT-Dekont-3-.pdf', '2024-11-25', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'DEKONT - Dekont..pdf', 'muhasebe/DEKONT-Dekont..pdf', '2024-12-03', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'DEKONT - ZRT202411290909340000000000859797087.pdf', 'muhasebe/DEKONT-ZRT202411290909340000000000859797087.pdf', '2024-11-29', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'EKSTRELER - 03-04-TRİNOX META-Ekstre.pdf', 'muhasebe/EKSTRELER-03-04-TRINOX-META-Ekstre.pdf', '2025-04-03', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'EKSTRELER - 05-05-NUNTEKNİK-Ekstre.pdf', 'muhasebe/EKSTRELER-05-05-NUNTEKNIK-Ekstre.pdf', '2025-05-05', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'EKSTRELER - 11-04-Sezgin Sinc-Ekstre.pdf', 'muhasebe/EKSTRELER-11-04-Sezgin-Sinc-Ekstre.pdf', '2025-04-11', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'EKSTRELER - 15-04-NUNTEKNİK-Ekstre.pdf', 'muhasebe/EKSTRELER-15-04-NUNTEKNIK-Ekstre.pdf', '2025-04-15', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'EKSTRELER - 22-04-FAES İNŞAAT-Ekstre (1).pdf', 'muhasebe/EKSTRELER-22-04-FAES-INSAAT-Ekstre-1-.pdf', '2025-04-22', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'EKSTRELER - 22-04-FAES İNŞAAT-Ekstre.pdf', 'muhasebe/EKSTRELER-22-04-FAES-INSAAT-Ekstre.pdf', '2025-04-22', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'EKSTRELER - 24-04-Lider Binic-Ekstre.pdf', 'muhasebe/EKSTRELER-24-04-Lider-Binic-Ekstre.pdf', '2025-04-24', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'EKSTRELER - 25-04-ARMİN ELEKT-Ekstre.pdf', 'muhasebe/EKSTRELER-25-04-ARMIN-ELEKT-Ekstre.pdf', '2025-04-25', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'GENEL ÖDEMELER - 02.01.2025 KOÇ FİNANS DEKONT.pdf', 'muhasebe/GENEL-ODEMELER-02.01.2025-KOC-FINANS-DEKONT.pdf', '2025-01-02', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'HESAP HAREKETLERİ - 14342552 nolu hesabınızın hareketleri.pdf', 'muhasebe/HESAP-HAREKETLERI-14342552-nolu-hesabinizin-hareketleri.pdf', '2024-11-19', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'HESAP HAREKETLERİ - 86832785 nolu hesabınızın hareketleri.pdf', 'muhasebe/HESAP-HAREKETLERI-86832785-nolu-hesabinizin-hareketleri.pdf', '2024-11-19', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'VERGİ ÖDEMELERİ - 05-09-MELDER İNŞA-Ekstre.pdf', 'muhasebe/VERGI-ODEMELERI-05-09-MELDER-INSA-Ekstre.pdf', '2025-09-05', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'VERGİ ÖDEMELERİ - 05-09-OĞUZ GÜNDÖR-Ekstre.pdf', 'muhasebe/VERGI-ODEMELERI-05-09-OGUZ-GUNDOR-Ekstre.pdf', '2025-09-05', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'VERGİ ÖDEMELERİ - 11.11.2025 KARAR VE İLAM HARCI ÖDEMESİIVD-Alindi-bNIAF4GGUAC.pdf', 'muhasebe/VERGI-ODEMELERI-11.11.2025-KARAR-VE-ILAM-HARCI-ODEMESIIVD-Alindi-bNIAF4GGUAC.pdf', '2025-11-11', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'VERGİ ÖDEMELERİ - 53m 34 evp 484 mtv ödemesi IVD-Alindi-b3W44MT6BP07.pdf', 'muhasebe/VERGI-ODEMELERI-53m-34-evp-484-mtv-odemesi-IVD-Alindi-b3W44MT6BP07.pdf', '2025-12-24', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'VERGİ ÖDEMELERİ - 95 TON YOL GEÇİŞ ÜCRETİ GİB IVD-Alindi-b21J5FK0E4B9.pdf', 'muhasebe/VERGI-ODEMELERI-95-TON-YOL-GECIS-UCRETI-GIB-IVD-Alindi-b21J5FK0E4B9.pdf', '2025-12-10', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'VERGİ ÖDEMELERİ - fiorino mahkeme gideri 2. defa eksper adliyede IVD-Alindi-b3OTK9C4WPJQ.pdf', 'muhasebe/VERGI-ODEMELERI-fiorino-mahkeme-gideri-2.-defa-eksper-adliyede-IVD-Alindi-b3OTK9C4WPJQ.pdf', '2025-12-24', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'VERGİ ÖDEMELERİ - KGM 34 FJY 160 -- 30 -08.25 ÖDEMESİ.pdf', 'muhasebe/VERGI-ODEMELERI-KGM-34-FJY-160-30-08.25-ODEMESI.pdf', '2025-08-30', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('muhasebe', 'VERGİ ÖDEMELERİ - MEVA BİLGİSAYAR İNŞAAT - KOFÇAZ-DEREKOY-DEMİRKÖY FİYAT TEKLİFİ.pdf', 'muhasebe/VERGI-ODEMELERI-MEVA-BILGISAYAR-INSAAT-KOFCAZ-DEREKOY-DEMIRKOY-FIYAT-TEKLIFI.pdf', '2025-09-05', false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f')
ON CONFLICT DO NOTHING;

INSERT INTO public.company_documents (category, file_name, storage_path, document_date, is_sensitive, uploaded_by) VALUES
  ('sirket_kimlik', 'EĞİTİM KATILIM YENİ FORMAT - (İŞE BAŞLAYAN İÇİN KOPYALAYIP ÇIKTI AL).docx', 'sirket_kimlik/pkg10-EGITIM-KATILIM-YENI-FORMAT-ISE-BASLAYAN-ICIN-KOPYALAYIP-CIKTI-AL-.docx', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'Eğitim Katılımcı Listesi  2025 - Kopya.xls', 'sirket_kimlik/pkg10-Egitim-Katilimci-Listesi-2025-Kopya.xls', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('sirket_kimlik', 'ekip atama eğitim katılım listesi.pdf', 'sirket_kimlik/pkg10-ekip-atama-egitim-katilim-listesi.pdf', NULL, false, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f')
ON CONFLICT DO NOTHING;

INSERT INTO public.personnel_documents (personnel_id, document_type, file_name, storage_path, is_sensitive, uploaded_by) VALUES
  ('b209663d-a624-467e-85ba-9be5c91da744', 'diger', 'Risk Değerlendirme Eğitim Katılım.pdf', 'b209663d-a624-467e-85ba-9be5c91da744/diger/pkg10-Elvan-Ceyhan-Risk-Degerlendirme-Egitim-Katilim.pdf', true, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('0cea0356-fdea-417b-9c11-bb410c949551', 'diger', 'Trafik idari Para Cezasi Karar Tutanagi.pdf_04-08-2026 11_07.pdf', '0cea0356-fdea-417b-9c11-bb410c949551/diger/pkg10-Emrah-Unsal-Trafik-idari-Para-Cezasi-Karar-Tutanagi.pdf-04-08-2026-11-07.pdf', true, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f'),
  ('f708be3a-9f82-415e-ad1b-f8c76c6bcf3a', 'diger', '3. Onur Likoğlu - Eğitim Katılım Tutanağı.pdf', 'f708be3a-9f82-415e-ad1b-f8c76c6bcf3a/diger/pkg10-Vestas-3.-Onur-Likoglu-Egitim-Katilim-Tutanagi.pdf', true, '70a96b62-9ba6-4464-81a8-06bb4faf2b7f')
ON CONFLICT DO NOTHING;
