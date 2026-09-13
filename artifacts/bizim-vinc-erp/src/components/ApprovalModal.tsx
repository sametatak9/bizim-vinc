import React, { useState } from 'react';
import { Approval } from '../types';
import { X, CheckCircle2, XCircle, AlertCircle, Clock, DollarSign, Calendar } from 'lucide-react';
import { useERP } from '../lib/store';

interface ApprovalModalProps {
  approval: Approval | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ approval, isOpen, onClose }) => {
  const { approveRequest, rejectRequest, showToast } = useERP();
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen || !approval) return null;

  const onApprove = async () => {
    await approveRequest(approval.id, note.trim() || 'Onaylandı.');
    onClose();
  };

  const onReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Lütfen red gerekçesini belirtiniz.');
      return;
    }
    await rejectRequest(approval.id, rejectionReason.trim());
    setIsRejecting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-sm">
              {approval.personInitials || 'OP'}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">Talep İnceleme & Onay</h2>
              <p className="text-xs text-neutral-400">{approval.personName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                {approval.kind.toUpperCase()} TALEBİ
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  approval.status === 'pending'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : approval.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {approval.status === 'pending'
                  ? 'Onay Bekliyor'
                  : approval.status === 'approved'
                  ? 'Onaylandı'
                  : 'Reddedildi'}
              </span>
            </div>

            <div className="text-sm font-bold text-neutral-100">{approval.title}</div>

            {approval.amount && approval.amount > 0 && (
              <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>₺{approval.amount.toLocaleString('tr-TR')}</span>
              </div>
            )}

            {approval.hours && approval.hours > 0 && (
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{approval.hours} Saat Fazla Mesai</span>
              </div>
            )}

            {(approval.startDate || approval.endDate) && (
              <div className="text-xs text-neutral-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{approval.startDate} ile {approval.endDate} arası</span>
              </div>
            )}

            {approval.note && (
              <div className="text-xs text-neutral-300 pt-1.5 border-t border-neutral-800">
                "{approval.note}"
              </div>
            )}

            <div className="text-[11px] text-neutral-500 pt-1">
              Oluşturulma: {new Date(approval.createdAt).toLocaleString('tr-TR')}
            </div>
          </div>

          {!isRejecting ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  Yönetici Karar Notu (Opsiyonel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Örn: Uygundur, puantaja işlendi."
                  rows={2}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="flex-1 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <XCircle size={16} /> Reddet
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                >
                  <CheckCircle2 size={16} /> Onayla
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-rose-400 mb-1">
                  Zorunlu Red Gerekçesi *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Örn: Vardiya planında bu saatler bulunmuyor veya bütçe aşıldı."
                  rows={3}
                  className="w-full px-3 py-2 bg-neutral-950 border border-rose-500/40 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-4 py-2.5 bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-xl text-xs transition"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <XCircle size={16} /> Reddi Kesinleştir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
