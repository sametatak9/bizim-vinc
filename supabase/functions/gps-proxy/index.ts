import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' };
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Oturum gerekli.' }), { status: 401, headers: corsHeaders });
    const providerUrl = Deno.env.get('GPS_PROVIDER_URL');
    const providerKey = Deno.env.get('GPS_API_KEY');
    if (!providerUrl || !providerKey) return new Response(JSON.stringify({ error: 'GPS sağlayıcı ayarları eksik.' }), { status: 503, headers: corsHeaders });
    const incoming = new URL(request.url);
    const path = incoming.pathname.replace(/^\/gps-proxy\/?/, '').replace(/^\/?/, '');
    const target = `${providerUrl.replace(/\/$/, '')}/${path}${incoming.search}`;
    const upstream = await fetch(target, { method: 'GET', headers: { Accept: 'application/json', Authorization: `Bearer ${providerKey}` } });
    return new Response(await upstream.text(), { status: upstream.status, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'GPS proxy hatası' }), { status: 500, headers: corsHeaders });
  }
});
