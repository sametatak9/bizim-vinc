import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Copy, Check, ArrowLeft, QrCode, Loader2, FileCheck2, Download, ExternalLink, AlertTriangle, Clock3 } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

interface DigitalCardPageProps { token: string; onNavigateHome: () => void; }
type PublicDocument = { id: string; document_type: string; file_name: string; expires_at: string | null; created_at: string; };
type PublicCard = { full_name: string; title: string; employee_no: string; initials: string; documents_ok: boolean; cert_expiring: boolean; card_slug: string | null; };

const labels: Record<string, string> = { isg: 'İSG Belgesi', myk: 'MYK / Operatör Belgesi', ehliyet: 'Sürücü Belgesi', src: 'SRC Belgesi', saglik: 'Sağlık Raporu', adli_sicil: 'Adli Sicil Kaydı' };
const isDriver = (title: string) => /şoför|şofor|sürücü|surucu|driver/i.test(title);
const isOperator = (title: string) => /operatör|operator|vinç|vinc/i.test(title);
const documentState = (date: string | null) => {
  if (!date) return { label: 'Tarih belirtilmemiş', className: 'bg-slate-100 text-slate-600', urgent: false };
  const days = Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Süresi geçmiş', className: 'bg-rose-100 text-rose-700', urgent: true };
  if (days <= 30) return { label: `${days} gün içinde yenilenmeli`, className: 'bg-amber-100 text-amber-800', urgent: true };
  return { label: 'Geçerli', className: 'bg-emerald-100 text-emerald-700', urgent: false };
};

/** Public card uses minimal RPC fields. Document bytes are never public; download uses a 5-minute signed URL. */
export const DigitalCardPage: React.FC<DigitalCardPageProps> = ({ token, onNavigateHome }) => {
  const [card, setCard] = useState<PublicCard | null>(null);
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null); setCard(null); setDocuments([]);
      try {
        if (!isSupabaseConfigured()) throw new Error('Supabase yapılandırılmamış');
        const sb = getSupabase(); if (!sb) throw new Error('Supabase istemcisi yok');
        const [{ data: cardData, error: cardError }, { data: documentData, error: documentError }] = await Promise.all([
          sb.rpc('get_public_personnel_card', { p_token: token }),
          sb.rpc('get_public_personnel_card_documents', { p_token: token }),
        ]);
        if (cardError) throw cardError;
        if (documentError) throw documentError;
        const row = Array.isArray(cardData) ? cardData[0] : cardData;
        if (!cancelled) { setCard(row?.full_name ? row as PublicCard : null); setDocuments((Array.isArray(documentData) ? documentData : []) as PublicDocument[]); }
      } catch (e: unknown) { if (!cancelled) { setError(e instanceof Error ? e.message : String(e)); setCard(null); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const cardUrl = typeof window !== 'undefined' ? window.location.href : '';
  const orderedDocuments = useMemo(() => {
    const priority = (type: string) => (isOperator(card?.title || '') ? { myk: 1, isg: 2 }[type] || 10 : isDriver(card?.title || '') ? { ehliyet: 1, src: 2 }[type] || 10 : { isg: 1, myk: 2, ehliyet: 3, src: 4 }[type] || 10);
    return [...documents].sort((a, b) => priority(a.document_type) - priority(b.document_type));
  }, [documents, card?.title]);

  const getSignedUrl = async (document: PublicDocument) => {
    setOpening(document.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-card-document`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY }, body: JSON.stringify({ token, documentId: document.id }) });
      const payload = await response.json();
      if (!response.ok || !payload.signedUrl) throw new Error(payload.error || 'Belge bağlantısı oluşturulamadı.');
      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e) { setError(e instanceof Error ? e.message : 'Belge açılamadı.'); }
    finally { setOpening(null); }
  };
  const handleCopyLink = () => { if (!cardUrl) return; navigator.clipboard.writeText(cardUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); };

  if (loading) return <div className="card-public-shell"><div className="card-public" style={{ padding: 40, textAlign: 'center' }}><Loader2 className="mx-auto animate-spin text-emerald-600" size={28} /><p className="mt-3 text-sm text-emerald-800">Kart ve belge durumu yükleniyor…</p></div></div>;
  if (!card) return <div className="card-public-shell"><div className="card-public" style={{ padding: 32, textAlign: 'center' }}><h1 style={{ color: '#14532D', fontSize: 18 }}>Kart bulunamadı</h1><p style={{ color: '#166534', marginTop: 8 }}>Bu bağlantı geçersiz veya personel kaydı yayında değil.{error ? ` (${error})` : ''}</p><button type="button" onClick={onNavigateHome} className="mt-4 inline-flex items-center gap-1 text-emerald-800 font-semibold"><ArrowLeft size={14} /> Ana sayfa</button></div></div>;

  return <div className="card-public-shell"><div className="card-public">
    <div className="card-public-head"><div className="brand-mark-logo"><svg aria-hidden="true" viewBox="0 0 64 64" width="40" height="40" fill="none"><path d="M32 56c8 0 14-2 14-2s-2-6-6-10c-2-2-4-3-8-3s-6 1-8 3c-4 4-6 10-6 10s6 2 14 2z" fill="#22C55E" /><path d="M30 48V18M30 18h18M48 18v4M30 28h12" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" /></svg></div><div><div className="text-xs font-semibold tracking-wide text-emerald-700">BİZİM VİNÇ</div><div className="text-[11px] text-emerald-800/80">En derinden, en yükseklere</div></div></div>
    <div className="card-public-body"><div className="card-public-avatar" aria-hidden>{(card.initials || card.full_name.slice(0, 2)).toUpperCase()}</div><h1 className="card-public-name">{card.full_name}</h1><p className="card-public-title">{card.title || 'Saha personeli'}</p><p className="text-sm text-emerald-900/70 mt-1">Sicil: {card.employee_no}</p>
      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-left"><div className="flex items-center justify-between gap-2 mb-3"><h2 className="font-black text-emerald-950 flex items-center gap-2"><FileCheck2 size={17} className="text-emerald-600" /> Mesleki belgeler</h2><span className="text-[10px] text-emerald-700 font-bold">{documents.length} belge</span></div>{orderedDocuments.length === 0 ? <p className="text-xs text-slate-500">Yayınlanabilir mesleki belge bulunmuyor.</p> : <div className="space-y-2">{orderedDocuments.map((document) => { const state = documentState(document.expires_at); return <div key={document.id} className="rounded-xl bg-white border border-emerald-100 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="font-bold text-xs text-emerald-950">{labels[document.document_type] || 'Mesleki belge'}</div><div className="truncate text-[11px] text-slate-500 mt-0.5">{document.file_name}</div>{document.expires_at && <div className="text-[10px] text-slate-500 mt-1">Geçerlilik: {new Date(document.expires_at).toLocaleDateString('tr-TR')}</div>}</div><button type="button" onClick={() => getSignedUrl(document)} disabled={opening === document.id} className="shrink-0 rounded-lg bg-emerald-700 px-2.5 py-2 text-[10px] font-black text-white hover:bg-emerald-800 disabled:opacity-50">{opening === document.id ? <Loader2 size={13} className="animate-spin" /> : <><Download size={12} className="inline mr-1" /> Görüntüle</>}</button></div><span className={`inline-flex items-center gap-1 mt-2 rounded-full px-2 py-1 text-[10px] font-bold ${state.className}`}>{state.urgent ? <AlertTriangle size={11} /> : <Clock3 size={11} />}{state.label}</span></div>; })}</div>}</div>
      <ul className="card-public-docs mt-4"><li><ShieldCheck size={16} className="text-emerald-600" /><span>Belge profili</span><span className={documents.length ? 'ok' : 'warn'}>{documents.length ? 'AKTİF' : 'EKSİK'}</span></li><li><ShieldCheck size={16} className="text-emerald-600" /><span>Sertifika durumu</span><span className={card.cert_expiring ? 'warn' : 'ok'}>{card.cert_expiring ? 'YENİLEME YAKIN' : 'ONAYLI'}</span></li></ul><p className="card-public-note">Bu kart yalnızca temel kimlik ve mesleki belge doğrulaması içindir. Telefon, TC, maaş, IBAN ve diğer hassas bilgiler gösterilmez. Belge bağlantıları 5 dakika sonra geçersiz olur.</p>{error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
    </div><div className="card-public-foot"><button type="button" onClick={onNavigateHome} className="flex items-center gap-1 text-gray-600 hover:text-emerald-900 font-semibold cursor-pointer min-h-11"><ArrowLeft size={14} /> Ana sayfa</button><button type="button" onClick={handleCopyLink} className="flex items-center gap-1 text-emerald-800 font-semibold cursor-pointer min-h-11">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}</button><QrCode size={18} className="text-emerald-700 opacity-60" aria-hidden /></div>
  </div></div>;
};
