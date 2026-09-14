-- Personnel exit documents are retained as a separate auditable document type.
ALTER TABLE public.personnel_documents DROP CONSTRAINT IF EXISTS personnel_documents_document_type_check;
ALTER TABLE public.personnel_documents ADD CONSTRAINT personnel_documents_document_type_check
  CHECK (document_type IN ('isg','myk','ehliyet','src','saglik','adli_sicil','isten_cikis','diger'));
