-- 0053_company_documents_muhasebe_category.sql
-- Paket 10'un MUHASEBE_EK klasoru (dekont, ekstre, vergi odemeleri, hesap
-- hareketleri) icin yeni 'muhasebe' kategorisi.
ALTER TABLE public.company_documents DROP CONSTRAINT company_documents_category_check;
ALTER TABLE public.company_documents ADD CONSTRAINT company_documents_category_check
  CHECK (category IN ('sirket_kimlik', 'kiralama', 'satin_alma', 'yakit', 'muhasebe'));
