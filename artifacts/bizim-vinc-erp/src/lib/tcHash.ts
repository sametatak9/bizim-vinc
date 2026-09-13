/**
 * KVKK: TC kimlik numarası istemcide düz metin saklanmaz / gönderilmez.
 * Önce Supabase Edge Function (HMAC) dener; yoksa SHA-256 fallback.
 */
import { getActiveSupabaseUrl, getActiveSupabaseKey } from './supabase';

export async function hashTcIdentity(raw: string): Promise<string> {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (/^[a-f0-9]{64}$/i.test(String(raw).trim())) {
    return String(raw).trim().toLowerCase();
  }

  try {
    const base = getActiveSupabaseUrl().replace(/\/$/, '');
    const key = getActiveSupabaseKey();
    if (base && key) {
      const res = await fetch(`${base}/functions/v1/hash-tc-identity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
        body: JSON.stringify({ tc: digits }),
      });
      if (res.ok) {
        const json = (await res.json()) as { hash?: string };
        if (json.hash && /^[a-f0-9]{64}$/i.test(json.hash)) {
          return json.hash.toLowerCase();
        }
      }
    }
  } catch (e) {
    console.warn('[tcHash] Edge Function unavailable, using client SHA-256 fallback', e);
  }

  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`bizim-vinc:tc:${digits}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function maskTc(raw?: string | null): string {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length < 5) return '***********';
  return `${d.slice(0, 3)}*****${d.slice(-2)}`;
}
