import React, { useState } from 'react';
import { Approval } from '../types';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { useERP } from '../lib/store';

interface ApprovalModalProps {
  approval: Approval | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ approval, isOpen, onClose }) => {
  const { handleApprovalDecision } = useERP();
  const [note, setNote] = useState('');

  if (!isOpen || !approval) return null;

  const onApprove = () => {
    handleApprovalDecision(approval.id, 'approved', note.trim() || 'Onaylandı.');
    onClose();
  };

  const onReject = () => {
    handleApprovalDecision(approval.id, 'rejected', note.trim() || 'Reddedildi.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {approval.personInitials || 'OP'}
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">Talep İncele & Onayla</h2>
              <p className="text-xs text-gray-500">{approval.personName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Talep Başlığı
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  approval.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : approval.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {approval.status === 'pending'
                  ? 'Onay Bekliyor'
                  : approval.status === 'approved'
                  ? 'Onaylandı'
                  : 'Reddedildi'}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">{approval.title}</div>
            {approval.relatedLabel && (
              <div className="text-xs text-emerald-700 font-medium">
                {approval.relatedLabel}
              </div>
            )}
            {approval.note && (
              <div className="text-xs text-gray-600 pt-1 border-t border-gray-200">
                "{approval.note}"
              </div>
            )}
            <div className="text-[11px] text-gray-400">
              Talep Zamanı: {new Date(approval.createdAt).toLocaleString('tr-TR')}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Yönetici Karar Notu (İsteğe Bağlı)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: Uygundur, saha şefine bilgi verildi."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onReject}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <XCircle size={16} /> Reddet
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle size={16} /> Onayla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
