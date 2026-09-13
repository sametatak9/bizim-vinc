import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { ShieldCheck, Copy, Check, ArrowLeft, QrCode } from 'lucide-react';

interface DigitalCardPageProps {
  token: string;
  onNavigateHome: () => void;
}

/** Public card — minimal fields only (KVKK). No phone, TC, salary, IBAN. */
export const DigitalCardPage: React.FC<DigitalCardPageProps> = ({ token, onNavigateHome }) => {
  const { personnel, showToast } = useERP();
  const [copied, setCopied] = useState(false);

  const person = personnel.find(
    (p) =>
      p.cardSlug === token ||
      p.employeeNo.toLowerCase() === token.toLowerCase() ||
      p.id === token
  );

  const cardUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (!cardUrl) return;
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    showToast('Dijital kart bağlantısı panoya kopyalandı.');
    setTimeout(() => setCopied(false), 2500);
  };

  if (!person) {
    return (
      <div className="card-public-shell">
        <div className="card-public" style={{ padding: 32, textAlign: 'center' }}>
          <h1 style={{ color: '#14532D', fontSize: 18 }}>Kart bulunamadı</h1>
          <p style={{ color: '#166534', marginTop: 8 }}>
            Bu bağlantı geçersiz veya personel kaydı yayında değil.
          </p>
          <button onClick={onNavigateHome} className="mt-4 inline-flex items-center gap-1 text-emerald-800 font-semibold">
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
            {(person.initials || person.fullName.slice(0, 2)).toUpperCase()}
          </div>
          <h1 className="card-public-name">{person.fullName}</h1>
          <p className="card-public-title">{person.title || 'Saha personeli'}</p>
          <p className="text-sm text-emerald-900/70 mt-1">Sicil: {person.employeeNo}</p>
          <ul className="card-public-docs mt-4">
            <li>
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Belgeler</span>
              <span className={person.documentsOk ? 'ok' : 'warn'}>{person.documentsOk ? 'TAMAM' : 'EKSİK'}</span>
            </li>
            <li>
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Sertifika</span>
              <span className={person.certExpiring ? 'warn' : 'ok'}>{person.certExpiring ? 'YENİLEME YAKIN' : 'ONAYLI'}</span>
            </li>
          </ul>
          <p className="card-public-note">
            Bu kart yalnızca kimlik doğrulama ve belge durumu içindir. Kişisel iletişim veya mali bilgi içermez.
          </p>
        </div>
        <div className="card-public-foot">
          <button onClick={onNavigateHome} className="flex items-center gap-1 text-gray-600 hover:text-emerald-900 font-semibold cursor-pointer">
            <ArrowLeft size={14} /> ERP Paneline Dön
          </button>
          <button onClick={handleCopyLink} className="flex items-center gap-1 text-emerald-800 font-semibold cursor-pointer">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
          </button>
          <QrCode size={18} className="text-emerald-700 opacity-60" aria-hidden />
        </div>
      </div>
    </div>
  );
};
