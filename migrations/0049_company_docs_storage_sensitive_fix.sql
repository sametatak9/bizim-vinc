-- 0049_company_docs_storage_sensitive_fix.sql
-- storage.objects okuma politikasi is_sensitive alanini hesaba katmiyordu -
-- bir ofis calisani (founder/admin olmasa bile) company_documents satirini
-- goremese de, storage_path'i biliyorsa dogrudan imzali URL alabilirdi.
-- company_documents ile join ederek is_sensitive=true olanlari founder/admin
-- disinda herkese kapatiyoruz.
DROP POLICY IF EXISTS company_docs_storage_read ON storage.objects;
CREATE POLICY company_docs_storage_read ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'company-docs'
    AND public.is_office_staff()
    AND (
      public.is_founder_or_admin()
      OR NOT EXISTS (
        SELECT 1 FROM public.company_documents cd
        WHERE cd.storage_path = storage.objects.name AND cd.is_sensitive = true
      )
    )
  );
