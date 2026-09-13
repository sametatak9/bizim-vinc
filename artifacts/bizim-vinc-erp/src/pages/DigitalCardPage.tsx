import React, { useEffect, useState } from 'react';
import { ShieldCheck, Copy, Check, ArrowLeft, QrCode, Loader2 } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

interface DigitalCardPageProps {
  token: string;
  onNavigateHome: () => void;
}

type PublicCard = {
  full_name: string;
  title: string;
  employee_no: string;
  initials: string;
  documents_ok: boolean;
  cert_expiring: boolean;
  card_slug: string | null;
};

/** Public card — fetches via SECURITY DEFINER RPC; never uses full personnel context. */
export const DigitalCardPage: React.FC<DigitalCardPageProps> = ({ token, onNavigateHome }) => {
  const [card, setCard] = useState<PublicCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setCard(null);
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase yapılandırılmamış');
        }
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase istemcisi yok');
        const { data, error: rpcError } = await sb.rpc('get_public_personnel_card', {
          p_token: token,
        });
        if (rpcError) throw rpcError;
        const row = Array.isArray(data) ? data[0] : data;
        if (!cancelled) {
          if (row && row.full_name) setCard(row as PublicCard);
          else setCard(null);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) {
          setError(msg);
          setCard(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const cardUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (!cardUrl) return;
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="card-public-shell">
        <div className="card-public" style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 className="mx-auto animate-spin text-emerald-600" size={28} />
          <p className="mt-3 text-sm text-emerald-800">Kart yükleniyor…</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="card-public-shell">
        <div className="card-public" style={{ padding: 32, textAlign: 'center' }}>
          <h1 style={{ color: '#14532D', fontSize: 18 }}>Kart bulunamadı</h1>
          <p style={{ color: '#166534', marginTop: 8 }}>
            Bu bağlantı geçersiz veya personel kaydı yayında değil.
            {error ? ` (${error})` : ''}
          </p>
          <button type="button" onClick={onNavigateHome} className="mt-4 inline-flex items-center gap-1 text-emerald-800 font-semibold">
            <ArrowLeft size={14} /> Ana sayfa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-public-shell">
      <div className="card-public">
        <div className="card-public-head">
          <div className="brand-mark-logo">
            <svg aria-hidden="true" viewBox="0 0 64 64" width="40" height="40" fill="none">
              <path d="M32 56c8 0 14-2 14-2s-2-6-6-10c-2-2-4-3-8-3s-6 1-8 3c-4 4-6 10-6 10s6 2 14 2z" fill="#22C55E" />
              <path d="M30 48V18M30 18h18M48 18v4M30 28h12" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wide text-emerald-700">BİZİM VİNÇ</div>
            <div className="text-[11px] text-emerald-800/80">En derinden, en yükseklere</div>
          </div>
        </div>
        <div className="card-public-body">
          <div className="card-public-avatar" aria-hidden>
            {(card.initials || card.full_name.slice(0, 2)).toUpperCase()}
          </div>
          <h1 className="card-public-name">{card.full_name}</h1>
          <p className="card-public-title">{card.title || 'Saha personeli'}</p>
          <p className="text-sm text-emerald-900/70 mt-1">Sicil: {card.employee_no}</p>
          <ul className="card-public-docs mt-4">
            <li>
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Belgeler</span>
              <span className={card.documents_ok ? 'ok' : 'warn'}>{card.documents_ok ? 'TAMAM' : 'EKSİK'}</span>
            </li>
            <li>
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Sertifika</span>
              <span className={card.cert_expiring ? 'warn' : 'ok'}>{card.cert_expiring ? 'YENİLEME YAKIN' : 'ONAYLI'}</span>
            </li>
          </ul>
          <p className="card-public-note">
            Bu kart yalnızca kimlik doğrulama ve belge durumu içindir. Telefon, TC veya mali bilgi içermez.
          </p>
        </div>
        <div className="card-public-foot">
          <button type="button" onClick={onNavigateHome} className="flex items-center gap-1 text-gray-600 hover:text-emerald-900 font-semibold cursor-pointer min-h-11">
            <ArrowLeft size={14} /> Ana sayfa
          </button>
          <button type="button" onClick={handleCopyLink} className="flex items-center gap-1 text-emerald-800 font-semibold cursor-pointer min-h-11">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
          </button>
          <QrCode size={18} className="text-emerald-700 opacity-60" aria-hidden />
        </div>
      </div>
    </div>
  );
};
