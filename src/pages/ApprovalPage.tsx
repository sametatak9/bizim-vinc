import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { Approval, ApprovalStatus } from '../types';
import { ApprovalModal } from '../components/ApprovalModal';
import { CheckCircle2, XCircle, Clock, Check, X, ShieldAlert } from 'lucide-react';

export const ApprovalPage: React.FC = () => {
  const { approvals, handleApprovalDecision } = useERP();
  const [statusFilter, setStatusFilter] = useState<'hepsi' | ApprovalStatus>('pending');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;

  const filtered = approvals.filter((a) => {
    if (statusFilter === 'hepsi') return true;
    return a.status === statusFilter;
  });

  const handleOpenReview = (approval: Approval) => {
    setSelectedApproval(approval);
    setIsModalOpen(true);
  };

  const handleQuickApprove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleApprovalDecision(id, 'approved', 'Hızlı onay verildi.');
  };

  const handleQuickReject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleApprovalDecision(id, 'rejected', 'Hızlı red.');
  };

  return (
    <main className="cmd-page" id="approval-page">
      {/* Top summary cards */}
      <section className="grid grid-cols-3 gap-3 mb-5">
        <div
          onClick={() => setStatusFilter('pending')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-xs transition ${
            statusFilter === 'pending'
              ? 'border-amber-400 ring-2 ring-amber-300'
              : 'border-emerald-100 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500">Onay Bekleyenler</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <span className="font-mono text-2xl font-bold text-amber-700">{pendingCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('approved')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-xs transition ${
            statusFilter === 'approved'
              ? 'border-emerald-500 ring-2 ring-emerald-300'
              : 'border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500">Onaylanan Talepler</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <span className="font-mono text-2xl font-bold text-emerald-800">{approvedCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('rejected')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-xs transition ${
            statusFilter === 'rejected'
              ? 'border-red-400 ring-2 ring-red-300'
              : 'border-emerald-100 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500">Reddedilen Talepler</span>
            <XCircle size={16} className="text-red-500" />
          </div>
          <span className="font-mono text-2xl font-bold text-red-700">{rejectedCount}</span>
        </div>
      </section>

      {/* Main List Panel */}
      <div className="panel bg-white border border-emerald-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-emerald-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-emerald-700" />
            <h2 className="text-sm font-bold text-emerald-950">Operasyonel Onay Havuzu</h2>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('hepsi')}
              className={`px-3 py-1 rounded-md transition ${
                statusFilter === 'hepsi'
                  ? 'bg-white text-emerald-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-emerald-900'
              }`}
            >
              Tümü ({approvals.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-md transition ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Bekleyen ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-md transition ${
                statusFilter === 'approved'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-emerald-900'
              }`}
            >
              Onaylanan ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded-md transition ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-emerald-900'
              }`}
            >
              Reddedilen ({rejectedCount})
            </button>
          </div>
        </div>

        {/* List of Approvals */}
        <div className="divide-y divide-gray-100">
          {filtered.map((approval) => (
            <div
              key={approval.id}
              onClick={() => handleOpenReview(approval)}
              className="p-4 hover:bg-emerald-50/40 transition flex items-center justify-between cursor-pointer gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-xs shrink-0">
                  {approval.personInitials || 'OP'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-gray-900">{approval.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                  <div className="text-xs text-gray-500 mt-0.5">
                    <strong>{approval.personName}</strong>
                    {approval.relatedLabel && <span> · {approval.relatedLabel}</span>}
                  </div>

                  {approval.note && (
                    <p className="text-xs text-gray-600 mt-1 italic truncate max-w-xl">
                      "{approval.note}"
                    </p>
                  )}

                  {approval.decisionNote && approval.status !== 'pending' && (
                    <div className="text-[11px] text-emerald-800 font-medium mt-1">
                      Karar: {approval.decisionNote}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right text-[11px] text-gray-400 hidden sm:block">
                  {new Date(approval.createdAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  <div className="text-[10px]">
                    {new Date(approval.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                {approval.status === 'pending' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleQuickReject(approval.id, e)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                      title="Reddet"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={(e) => handleQuickApprove(approval.id, e)}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      title="Onayla"
                    >
                      <Check size={16} /> Onayla
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenReview(approval)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-semibold"
                  >
                    Detay
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              Bu kategoride gösterilecek talep bulunmuyor.
            </div>
          )}
        </div>
      </div>

      <ApprovalModal
        approval={selectedApproval}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};
