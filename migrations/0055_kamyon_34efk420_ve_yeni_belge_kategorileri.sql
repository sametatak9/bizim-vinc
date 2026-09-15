-- 0055_kamyon_34efk420_ve_yeni_belge_kategorileri.sql
-- 34 EFK 420 (MAN kamyon, mobil vinc ekibi destek araci) - FILO_ENVANTER.csv'de
-- kayitli, 16_HESAP_PUANTAJ_MUSTERI paketinde "TUM EVRAKLAR" belgesi geldi.
INSERT INTO public.cranes (code, plate, team, tonnage, metre, brand, type, crane_type, capacity, status, card_slug)
SELECT '34 EFK 420', '34 EFK 420', 'mobil', NULL, NULL, 'MAN', 'Destek Aracı', 'Destek Aracı', 'Kamyon', 'musait', '34-efk-420'
WHERE NOT EXISTS (SELECT 1 FROM public.cranes WHERE plate = '34 EFK 420');

-- Paket 11/12/13/16 icin yeni belge kategorileri
ALTER TABLE public.company_documents DROP CONSTRAINT company_documents_category_check;
ALTER TABLE public.company_documents ADD CONSTRAINT company_documents_category_check
  CHECK (category IN ('sirket_kimlik', 'kiralama', 'satin_alma', 'yakit', 'muhasebe',
                      'ihale', 'ortaklik', 'tedarikci', 'ceza', 'sgk_vergi', 'musteri'));
