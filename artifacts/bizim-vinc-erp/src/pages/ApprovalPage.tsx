import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { Approval, ApprovalKind, ApprovalStatus } from '../types';
import { ApprovalModal } from '../components/ApprovalModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  ShieldAlert,
  DollarSign,
  Calendar,
  Filter,
  Plus,
} from 'lucide-react';

export const ApprovalPage: React.FC = () => {
  const { approvals, approveRequest, rejectRequest, showToast, addApproval, personnel } = useERP();
  const [statusFilter, setStatusFilter] = useState<'hepsi' | ApprovalStatus>('pending');
  const [kindFilter, setKindFilter] = useState<'all' | ApprovalKind>('all');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Yeni Manuel Talep State
  const [newKind, setNewKind] = useState<ApprovalKind>('avans');
  const [newPersonId, setNewPersonId] = useState(personnel[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newHours, setNewHours] = useState<number>(0);
  const [newNote, setNewNote] = useState('');

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;

  const filtered = approvals.filter((a) => {
    const matchStatus = statusFilter === 'hepsi' || a.status === statusFilter;
    const matchKind = kindFilter === 'all' || a.kind === kindFilter;
    return matchStatus && matchKind;
  });

  const handleOpenReview = (approval: Approval) => {
    setSelectedApproval(approval);
    setIsModalOpen(true);
  };

  const handleQuickApprove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    approveRequest(id, 'Hızlı yönetici onayı verildi.');
  };

  const handleQuickReject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = window.prompt('Lütfen red gerekçesini yazınız:');
    if (reason && reason.trim()) {
      rejectRequest(id, reason.trim());
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const person = personnel.find((p) => p.id === newPersonId) || personnel[0];
    await addApproval({
      kind: newKind,
      status: 'pending',
      title: newTitle || `${newKind.toUpperCase()} Bildirimi`,
      personId: person?.id,
      personName: person ? person.fullName : 'Personel',
      personInitials: person ? person.initials : 'PR',
      amount: newAmount,
      hours: newHours,
      note: newNote,
    });
    setIsNewModalOpen(false);
    setNewTitle('');
    setNewAmount(0);
    setNewHours(0);
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-emerald-950">Onay & Karar Merkezi</h1>
                <p className="text-xs text-slate-600">
                  Avans, mesai, izin, yakıt ve saha teslimat taleplerinin tek ekrandan yönetimi
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Talep Aç</span>
            </button>
          </div>
        </div>

        {/* Filter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-4 rounded-xl border text-left transition ${
              statusFilter === 'pending'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950'
                : 'bg-emerald-50 border-emerald-100 text-slate-600 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">Onay Bekleyenler</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{pendingCount}</div>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`p-4 rounded-xl border text-left transition ${
              statusFilter === 'approved'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950'
                : 'bg-emerald-50 border-emerald-100 text-slate-600 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">Onaylanan Talepler</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{approvedCount}</div>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`p-4 rounded-xl border text-left transition ${
              statusFilter === 'rejected'
                ? 'bg-rose-500/10 border-rose-500 text-emerald-950'
                : 'bg-emerald-50 border-emerald-100 text-slate-600 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">Reddedilen Talepler</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-400 font-mono">{rejectedCount}</div>
          </button>
        </div>

        {/* Kind Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-emerald-100 text-xs">
          <span className="text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Kategori:
          </span>
          {(['all', 'avans', 'izin', 'mesai', 'yoklama', 'makbuz', 'yakit', 'genel'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={`px-3 py-1 rounded-lg font-medium transition capitalize ${
                kindFilter === k
                  ? 'bg-neutral-100 text-neutral-900 font-bold'
                  : 'bg-emerald-50 text-slate-600 hover:text-emerald-950'
              }`}
            >
              {k === 'all' ? 'Tümü' : k}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-emerald-100 rounded-2xl p-12 text-center text-xs text-slate-600">
            Filtreleme kriterlerinize uygun onay talebi bulunamadı.
          </div>
        ) : (
          filtered.map((item) => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                onClick={() => handleOpenReview(item)}
                className="bg-white border border-emerald-100 hover:border-neutral-700 rounded-2xl p-4 transition cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold flex items-center justify-center text-xs shrink-0">
                    {item.personInitials || 'OP'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-emerald-950">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-mono font-bold bg-emerald-50 text-slate-600">
                        {item.kind}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Talep Eden: <strong className="text-emerald-900">{item.personName}</strong>
                      {item.amount ? ` • ₺${item.amount.toLocaleString('tr-TR')}` : ''}
                      {item.hours ? ` • ${item.hours} Saat` : ''}
                      {item.startDate ? ` • ${item.startDate} - ${item.endDate}` : ''}
                    </div>

                    {item.note && <div className="text-xs text-slate-500">"{item.note}"</div>}

                    {item.rejectionReason && (
                      <div className="text-xs text-rose-400 font-medium">
                        Red Sebebi: {item.rejectionReason}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500">
                      {new Date(item.createdAt).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleQuickReject(item.id, e)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        title="Hızlı Reddet"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleQuickApprove(item.id, e)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Hızlı Onayla</span>
                      </button>
                    </div>
                  ) : isApproved ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Onaylandı
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Reddedildi
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <ApprovalModal
          approval={selectedApproval}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApproval(null);
          }}
        />
      )}

      {/* New Approval Request Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-emerald-100 text-emerald-950 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">Yeni Onay Talebi Oluştur</h3>
            <form onSubmit={handleCreateNew} className="space-y-3.5">
              <div>
                <label className="block text-xs text-emerald-900 mb-1">Talep Türü *</label>
                <select
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value as ApprovalKind)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 focus:outline-none"
                >
                  <option value="avans">Avans</option>
                  <option value="izin">İzin</option>
                  <option value="mesai">Mesai</option>
                  <option value="yakit">Yakıt / Fiş</option>
                  <option value="makbuz">Makbuz Teslim</option>
                  <option value="genel">Genel Bildirim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-emerald-900 mb-1">İlgili Personel *</label>
                <select
                  value={newPersonId}
                  onChange={(e) => setNewPersonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 focus:outline-none"
                >
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-emerald-900 mb-1">Başlık *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: Şantiye Avans Talebi"
                  className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 focus:outline-none"
                />
              </div>

              {newKind === 'avans' && (
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Tutar (₺)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              {newKind === 'mesai' && (
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Mesai Saati</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newHours}
                    onChange={(e) => setNewHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-emerald-900 mb-1">Açıklama / Not</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-emerald-950 bg-emerald-50 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition"
                >
                  Talebi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
