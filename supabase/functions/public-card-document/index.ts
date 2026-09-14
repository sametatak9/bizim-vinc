import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { token, documentId } = await req.json();
    if (typeof token !== 'string' || typeof documentId !== 'string') return json({ error: 'Invalid request' }, 400);

    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return json({ error: 'Function is not configured' }, 500);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: document, error } = await admin
      .from('personnel_documents')
      .select('id,file_name,storage_path,storage_bucket,document_type,expires_at,personnel:personnel_id!inner(card_slug,employee_no,status)')
      .eq('id', documentId)
      .in('document_type', ['isg', 'myk', 'ehliyet', 'src', 'saglik', 'adli_sicil'])
      .maybeSingle();
    if (error || !document || document.personnel?.status === 'pasif') return json({ error: 'Document not found' }, 404);

    const person = document.personnel;
    const tokenMatches = person.card_slug === token || String(person.employee_no || '').toLowerCase() === token.toLowerCase();
    if (!tokenMatches) return json({ error: 'Document not found' }, 404);

    const bucket = document.storage_bucket || 'personnel-documents';
    const { data: signed, error: signedError } = await admin.storage.from(bucket).createSignedUrl(document.storage_path, 300, { download: document.file_name });
    if (signedError || !signed?.signedUrl) return json({ error: 'Signed URL could not be created' }, 500);
    return json({ signedUrl: signed.signedUrl, expiresIn: 300 });
  } catch (_error) {
    return json({ error: 'Invalid request' }, 400);
  }
});
