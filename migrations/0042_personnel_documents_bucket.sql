-- 0042_personnel_documents_bucket.sql
-- Ozluk (HR) belgeleri icin storage bucket. Dosyalar 10MB altinda PDF,
-- erisim yalniz ofis personeli (is_office_staff()) + public kartvizit RPC
-- uzerinden imzali URL ile.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('personnel-documents', 'personnel-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;
