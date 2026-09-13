import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { ShieldCheck, Copy, Check, ArrowLeft, Phone, QrCode } from 'lucide-react';

interface DigitalCardPageProps {
  token: string;
  onNavigateHome: () => void;
}

export const DigitalCardPage: React.FC<DigitalCardPageProps> = ({ token, onNavigateHome }) => {
  const { personnel, showToast } = useERP();
  const [copied, setCopied] = useState(false);

  // Find person by slug or employeeNo or fallback
  const person =
    personnel.find(
      (p) =>
        p.cardSlug === token ||
        p.employeeNo.toLowerCase() === token.toLowerCase() ||
        p.id === token
    ) || personnel[0];

  const cardUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    showToast('Dijital kart bağlantısı panoya kopyalandı.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="card-public-shell">
      <div className="card-public">
        {/* Card Header */}
        <div className="card-public-head">
          <div className="brand-mark-logo">
            <svg aria-hidden="true" viewBox="0 0 64 64" width="40" height="40" fill="none">
              <path d="M32 56c8 0 14-2 14-2s-2-6-6-10c-2-2-4-3-8-3s-6 1-8 3c-4 4-6 10-6 10s6 2 14 2z" fill="#22C55E" />
              <path d="M30 48V18M30 18h18M48 18v4M30 28h12" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M26 48h8M28 18l-4 6h12" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="48" cy="24" r="2.4" fill="#16A34A" />
            </svg>
          </div>
          <div>
            <div className="card-public-brand">BİZİM VİNÇ</div>
            <div className="card-public-tag">Kurumsal Dijital Operatör Kimliği</div>
          </div>
        </div>

        {/* Body */}
        <div className="card-public-body">
          <div className="card-public-avatar">
            {person.initials}
          </div>

          <h1>{person.fullName}</h1>
          <div className="card-public-title">{person.title}</div>
          <div className="card-public-meta">
            Sicil No: <span className="font-mono font-bold text-gray-900">{person.employeeNo}</span>
          </div>

          <div className="card-public-phone">
            <a href={`tel:${person.phone}`} className="flex items-center justify-center gap-1.5">
              <Phone size={14} className="text-emerald-700" />
              {person.phone}
            </a>
          </div>

          {/* Stylized QR Code display */}
          <div className="my-5 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl inline-block shadow-xs">
            <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex flex-col items-center justify-center border border-emerald-200">
              <QrCode size={112} className="text-emerald-950" />
              <span className="text-[10px] font-mono text-gray-500 mt-1">
                {person.employeeNo}
              </span>
            </div>
            <span className="text-[11px] text-emerald-900 font-semibold block mt-2">
              Şantiye Girişi Doğrulama Kodu
            </span>
          </div>
        </div>

        {/* Documents & ISG Check */}
        <div className="card-public-docs">
          <h2>İSG ve Mesleki Yetkinlik Belgeleri</h2>
          <ul>
            <li>
              <span>G Sınıfı Vinç Operatörlük Belgesi</span>
              <span className="ok">ONAYLI</span>
            </li>
            <li>
              <span>MYK Seviye 5 Belgesi</span>
              <span className="ok">GEÇERLİ</span>
            </li>
            <li>
              <span>Ağır & Tehlikeli İşler Sağlık Raporu</span>
              <span className="ok">GÜNCEL</span>
            </li>
            <li>
              <span>Yüksekte Çalışma Sertifikası</span>
              <span className={person.certExpiring ? 'warn' : 'ok'}>
                {person.certExpiring ? 'YENİLEME YAKIN' : 'ONAYLI'}
              </span>
            </li>
          </ul>

          <p className="card-public-note">
            Bu dijital kart, Bizim Vinç ERP merkezi veri tabanı ile anlık senkronizedir ve iş güvenliği denetimlerinde geçerlidir.
          </p>
        </div>

        {/* Card Footer */}
        <div className="card-public-foot">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1 text-gray-600 hover:text-emerald-900 font-semibold cursor-pointer"
          >
            <ArrowLeft size={14} /> ERP Paneline Dön
          </button>

          <button onClick={handleCopyLink} className="card-copy-btn flex items-center gap-1">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Kopyalandı' : 'Kart Linki Kopyala'}
          </button>
        </div>
      </div>
    </div>
  );
};
