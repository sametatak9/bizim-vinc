/**
 * KVKK: TC kimlik numarası istemcide düz metin saklanmaz / gönderilmez.
 * Sunucu tarafı HMAC (Edge Function + secret) idealdir; tarayıcıda en azından
 * SHA-256 ile tek yönlü özet üretilir. Canlıda Edge Function secret ile HMAC'e geçin.
 */
export async function hashTcIdentity(raw: string): Promise<string> {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (/^[a-f0-9]{64}$/i.test(String(raw).trim())) {
    return String(raw).trim().toLowerCase();
  }
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`bizim-vinc:tc:${digits}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** UI'da sadece maskeli gösterim */
export function maskTc(raw?: string | null): string {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length < 5) return '***********';
  return `${d.slice(0, 3)}*****${d.slice(-2)}`;
}
