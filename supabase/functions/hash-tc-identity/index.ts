// Deploy: supabase functions deploy hash-tc-identity
// Secret: TC_HMAC_SECRET
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  try {
    const secret = Deno.env.get('TC_HMAC_SECRET') || '';
    if (!secret) {
      return new Response(JSON.stringify({ error: 'TC_HMAC_SECRET not set' }), { status: 500 });
    }
    const body = await req.json();
    const digits = String(body.tc || '').replace(/\D/g, '');
    if (!digits || digits.length < 5) {
      return new Response(JSON.stringify({ error: 'invalid tc' }), { status: 400 });
    }
    const hash = await hmacSha256(secret, `bizim-vinc:tc:${digits}`);
    return new Response(JSON.stringify({ hash }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'hash failed' }), { status: 500 });
  }
});
