import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { ApprovalKind } from '../types';
import { 
  CheckCircle, 
  Clock, 
  CreditCard, 
  FileText, 
  Calendar, 
  HelpCircle,
  QrCode
} from 'lucide-react';

export const OperatorPage: React.FC = () => {
  const { currentOperator, approvals, createApprovalRequest, showToast } = useERP();
  const [note, setNote] = useState('');

  const operatorApprovals = approvals.filter(
    (a) => a.personName === currentOperator.fullName
  );

  const handleAction = (kind: ApprovalKind, defaultTitle: string) => {
    let title = defaultTitle;
    let detail = note.trim();

    if (kind === 'yoklama') {
      title = 'İşe geldim (Saha Yoklaması)';
      detail = detail || 'Zamanında şantiyeye varıldı.';
    } else if (kind === 'mesai') {
      title = 'Fazla mesai talebi';
      detail = detail || 'İlave çalışma süresi bildirildi.';
    } else if (kind === 'avans') {
      title = 'Saha avans talebi';
      detail = detail || 'Yol/yemek harcaması için avans';
    } else if (kind === 'makbuz') {
      title = 'Şantiye makbuz teslimi';
      detail = detail || 'Müşteri teslim fişi kesildi.';
    } else if (kind === 'izin') {
      title = 'Günlük izin talebi';
      detail = detail || 'Mazeret izni';
    } else {
      title = 'Operatör genel bildirimi';
      detail = detail || 'Saha bilgilendirmesi';
    }

    createApprovalRequest(
      kind,
      title,
      detail,
      currentOperator.fullName,
      currentOperator.initials
    );

    setNote('');
  };

  return (
    <main className="op-shell" id="operator-page">
      {/* Operator Header Card */}
      <div className="op-head">
        <div className="op-avatar">
          {currentOperator.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="op-name">{currentOperator.fullName}</div>
          <div className="op-meta">
            {currentOperator.title} · {currentOperator.employeeNo}
          </div>
        </div>
        <a
          href={`/kart/${currentOperator.cardSlug || currentOperator.employeeNo.toLowerCase()}`}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-emerald-800 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition flex items-center justify-center shrink-0"
          title="Dijital Kimlik Kartım"
        >
          <QrCode size={18} />
        </a>
      </div>

      {/* Operator Quick Request Buttons */}
      <div className="op-actions">
        <button
          onClick={() => handleAction('yoklama', 'Yoklama')}
          className="op-btn primary"
        >
          <CheckCircle size={22} />
          <span>Yoklama</span>
        </button>

        <button
          onClick={() => handleAction('mesai', 'Mesai')}
          className="op-btn"
        >
          <Clock size={22} className="text-emerald-700" />
          <span>Mesai</span>
        </button>

        <button
          onClick={() => handleAction('avans', 'Avans')}
          className="op-btn"
        >
          <CreditCard size={22} className="text-emerald-700" />
          <span>Avans</span>
        </button>

        <button
          onClick={() => handleAction('makbuz', 'Makbuz')}
          className="op-btn"
        >
          <FileText size={22} className="text-emerald-700" />
          <span>Makbuz</span>
        </button>

        <button
          onClick={() => handleAction('izin', 'İzin')}
          className="op-btn"
        >
          <Calendar size={22} className="text-emerald-700" />
          <span>İzin</span>
        </button>

        <button
          onClick={() => handleAction('genel', 'Diğer')}
          className="op-btn"
        >
          <HelpCircle size={22} className="text-emerald-700" />
          <span>Diğer</span>
        </button>
      </div>

      {/* Note input */}
      <div className="mb-4">
        <label className="op-note">
          İsteğe Bağlı Not / Açıklama:
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Örn: 2 saat fazla mesai yapıldı, şantiye şefi teyitli."
          className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {/* My past requests list */}
      <div className="op-list-wrap">
        <h2>Taleplerim ve Onay Durumu</h2>
        <ul className="op-list">
          {operatorApprovals.map((req) => (
            <li key={req.id}>
              <div className="min-w-0 pr-2">
                <strong className="truncate">{req.title}</strong>
                <span>{req.note || req.relatedLabel || 'Açıklama belirtilmedi'}</span>
                {req.decisionNote && (
                  <span className="text-emerald-800 font-medium">
                    Yönetici: {req.decisionNote}
                  </span>
                )}
              </div>

              <div className="op-right">
                <span className={`op-status ${req.status}`}>
                  {req.status === 'pending'
                    ? 'Onay Bekliyor'
                    : req.status === 'approved'
                    ? 'Onaylandı'
                    : 'Reddedildi'}
                </span>
                <span className="op-time">
                  {new Date(req.createdAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </li>
          ))}

          {operatorApprovals.length === 0 && (
            <li className="text-center py-6 text-gray-400 text-xs justify-center">
              Henüz verilmiş bir talebiniz bulunmuyor.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
};
