import React, { useState, useMemo } from 'react';
import {
  Shield,
  Users,
  FileText,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  UserCheck,
  XCircle,
  Clock,
  Check,
  X,
  Truck,
  Receipt,
  CalendarCheck,
  FilePlus,
  BarChart3,
  Settings,
  Eye,
} from 'lucide-react';
import { useERP } from '../lib/store';
import { AppRole } from '../types';
import { MEMBERSHIP_APPROVER_ROLES, APPROVER_ROLES, roleLabel } from '../lib/permissions';
import { downloadExcelReport, downloadHtmlReport, printReport } from '../lib/reporting';

type AdminTab = 'approvals' | 'attendance' | 'receipts' | 'fleet' | 'memberships' | 'system';

const kindLabel: Record<string, string> = {
  yoklama: 'Yoklama',
  mesai: 'Mesai',
  avans: 'Avans',
  izin: 'İzin',
  makbuz: 'Makbuz',
  makbuz_onay: 'Makbuz Onayı',
  yakit: 'Yakıt',
  genel: 'Genel',
  uyelik_onay: 'Üyelik',
  vinc_hareket: 'Vinç Hareket',
  diger: 'Diğer',
};

const craneStatusLabel: Record<string, string> = {
  sahada: 'Sahada',
  musait: 'Müsait',
  bakimda: 'Bakımda',
  arizali: 'Arızalı',
  pasif: 'Pasif',
};

export const AdminPage: React.FC = () => {
  const {
    userProfiles,
    updateUserProfile,
    auditLogs,
    dbConnected,
    isSyncing,
    refreshFromDb,
    showToast,
    activeRole,
    personnelTypes,
    addPersonnelType,
    memberships,
    personnel,
    approveMembership,
    rejectMembership,
    currentUser,
    approvals,
    approveRequest,
    rejectRequest,
    jobReceipts,
    approveJobReceipt,
    rejectJobReceipt,
    updateJobReceipt,
    createInvoiceFromReceipts,
    customers,
    cranes,
  } = useERP();

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const saved = sessionStorage.getItem('bv_admin_initial_tab');
    if (saved) sessionStorage.removeItem('bv_admin_initial_tab');
    return (saved as AdminTab) || 'approvals';
  });
  const canApproveMemberships = MEMBERSHIP_APPROVER_ROLES.includes(currentUser.role);
  const canApprove = APPROVER_ROLES.includes(currentUser.role) || currentUser.role === 'founder';
  // Kullanıcı rolü değiştirme / pasife alma — yalnızca founder/admin. Yönetici dahi
  // kendini veya başkasını admin'e yükseltemesin diye kasten APPROVER_ROLES'tan dar tutuldu.
  const canManageUsers = currentUser.role === 'founder' || currentUser.role === 'admin';

  // ─── ONAY MERKEZİ ───────────────────────────────────────────
  const [approvalKindFilter, setApprovalKindFilter] = useState<string>('all');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [approvalSearch, setApprovalSearch] = useState('');
  const [rejectComment, setRejectComment] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});

  const filteredApprovals = useMemo(() => {
    return approvals.filter((a) => {
      const matchKind = approvalKindFilter === 'all' || a.kind === approvalKindFilter;
      const matchStatus = approvalStatusFilter === 'all' || a.status === approvalStatusFilter;
      const matchSearch = !approvalSearch || `${a.title} ${a.personName}`.toLowerCase().includes(approvalSearch.toLowerCase());
      return matchKind && matchStatus && matchSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [approvals, approvalKindFilter, approvalStatusFilter, approvalSearch]);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const approvedToday = approvals.filter((a) => a.status === 'approved' && a.approvedAt?.startsWith(new Date().toISOString().slice(0, 10)));
  const rejectedToday = approvals.filter((a) => a.status === 'rejected' && a.rejectedAt?.startsWith(new Date().toISOString().slice(0, 10)));

  const handleApproveRequest = (id: string) => {
    approveRequest(id, `${currentUser.fullName} tarafından onaylandı`);
  };

  const handleRejectRequest = (id: string) => {
    const reason = rejectComment[id]?.trim();
    if (!reason) {
      showToast('Lütfen red gerekçesi giriniz.');
      return;
    }
    rejectRequest(id, reason);
    setShowRejectInput((prev) => ({ ...prev, [id]: false }));
    setRejectComment((prev) => ({ ...prev, [id]: '' }));
  };

  const exportApprovals = (format: 'excel' | 'html' | 'print') => {
    const columns = [
      { key: 'tarih', label: 'Tarih' },
      { key: 'tur', label: 'Tür' },
      { key: 'personel', label: 'Personel' },
      { key: 'baslik', label: 'Başlık' },
      { key: 'durum', label: 'Durum' },
      { key: 'karar', label: 'Karar Veren' },
      { key: 'kararTarihi', label: 'Karar Tarihi' },
      { key: 'gerekcesi', label: 'Gerekçe' },
    ];
    const rows = filteredApprovals.map((a) => ({
      tarih: new Date(a.createdAt).toLocaleString('tr-TR'),
      tur: kindLabel[a.kind] || a.kind,
      personel: a.personName,
      baslik: a.title,
      durum: a.status === 'pending' ? 'Bekliyor' : a.status === 'approved' ? 'Onaylandı' : 'Reddedildi',
      karar: a.approvedBy || a.rejectedBy || '-',
      kararTarihi: a.approvedAt || a.rejectedAt || '-',
      gerekcesi: a.rejectionReason || '-',
    }));
    const title = `BİZİM VİNÇ Onay Raporu — ${new Date().toLocaleDateString('tr-TR')}`;
    if (format === 'excel') downloadExcelReport('onay-raporu', title, columns, rows);
    else if (format === 'html') downloadHtmlReport('onay-raporu', title, columns, rows);
    else printReport(title, columns, rows);
  };

  // ─── YOKLAMA KONTROL ─────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todayYoklama = approvals.filter((a) => a.kind === 'yoklama' && a.requestedDate === today);
  const activePersonnel = personnel.filter((p) => p.status === 'aktif');

  const getPersonAttendanceToday = (personId: string) => {
    return todayYoklama.find((a) => a.personId === personId);
  };

  const handleBulkApproveAttendance = async () => {
    const pending = todayYoklama.filter((a) => a.status === 'pending');
    for (const a of pending) {
      await approveRequest(a.id, 'Toplu yoklama onayı');
    }
    showToast(`✓ ${pending.length} yoklama onaylandı.`);
  };

  const exportAttendance = (format: 'excel' | 'html' | 'print') => {
    const columns = [
      { key: 'personel', label: 'Personel' },
      { key: 'durum', label: 'Yoklama Durumu' },
      { key: 'onay', label: 'Onay Durumu' },
      { key: 'saat', label: 'Giriş Saati' },
    ];
    const rows = activePersonnel.map((p) => {
      const att = getPersonAttendanceToday(p.id);
      return {
        personel: p.fullName,
        durum: att ? att.title.replace('Günlük Yoklama: ', '') : 'GÖNDERİLMEDİ',
        onay: att ? (att.status === 'approved' ? 'Onaylandı' : att.status === 'rejected' ? 'Reddedildi' : 'Bekliyor') : '-',
        saat: att?.note?.replace('Giriş: ', '') || '-',
      };
    });
    const title = `BİZİM VİNÇ Yoklama — ${new Date().toLocaleDateString('tr-TR')}`;
    if (format === 'excel') downloadExcelReport('yoklama', title, columns, rows);
    else if (format === 'html') downloadHtmlReport('yoklama', title, columns, rows);
    else printReport(title, columns, rows);
  };

  // ─── MAKBUZ & FATURA ─────────────────────────────────────────
  // Bilinçli olarak dar tutuldu: detay/arama/filtre /faturalar sayfasında kalıyor,
  // burada sadece bugünün özeti + hızlı onay/faturalama aksiyonu var (Filo Takip
  // sekmesindeki "özet + tam ekrana link" deseniyle aynı mantık).
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [receiptRejectComment, setReceiptRejectComment] = useState<Record<string, string>>({});
  const [showReceiptReject, setShowReceiptReject] = useState<Record<string, boolean>>({});

  const pendingReceipts = useMemo(
    () => jobReceipts.filter((r) => r.status === 'pending_approval'),
    [jobReceipts]
  );
  const awaitingInvoice = useMemo(
    () => jobReceipts.filter((r) => (r.status === 'approved' || r.status === 'onaylandi') && !r.invoiced),
    [jobReceipts]
  );

  const handleApproveReceipt = async (id: string) => {
    await approveJobReceipt(id);
    showToast('✓ Makbuz onaylandı.');
  };

  const handleRejectReceipt = async (id: string) => {
    const reason = receiptRejectComment[id]?.trim();
    if (!reason) { showToast('Red gerekçesi giriniz.'); return; }
    await rejectJobReceipt(id, reason);
    setShowReceiptReject((prev) => ({ ...prev, [id]: false }));
    setReceiptRejectComment((prev) => ({ ...prev, [id]: '' }));
    showToast('✓ Makbuz reddedildi.');
  };

  const handleConvertToInvoice = async (receiptId: string) => {
    setConvertingId(receiptId);
    try {
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      await createInvoiceFromReceipts([receiptId], dueDate);
      showToast('✓ Makbuz faturaya dönüştürüldü.');
    } catch (e) {
      showToast(`Fatura dönüştürme hatası: ${e instanceof Error ? e.message : 'bilinmeyen'}`);
    } finally {
      setConvertingId(null);
    }
  };

  // ─── FİLO TAKİP ──────────────────────────────────────────────
  const [craneSearch, setCraneSearch] = useState('');
  const filteredCranes = cranes.filter((c) =>
    !craneSearch || `${c.code} ${c.type || ''} ${c.operator || ''} ${c.site || ''}`.toLowerCase().includes(craneSearch.toLowerCase())
  );
  const craneStatusCounts = {
    sahada: cranes.filter((c) => c.status === 'sahada').length,
    musait: cranes.filter((c) => c.status === 'musait').length,
    bakimda: cranes.filter((c) => c.status === 'bakimda').length,
    arizali: cranes.filter((c) => c.status === 'arizali').length,
  };

  // ─── ÜYELİK & KULLANICI ──────────────────────────────────────
  const [membershipSubTab, setMembershipSubTab] = useState<'memberships' | 'users'>('memberships');
  const [membershipFilter, setMembershipFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [draftRole, setDraftRole] = useState<Record<string, AppRole>>({});
  const [draftPersonnel, setDraftPersonnel] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newPersonnelType, setNewPersonnelType] = useState('');

  const pendingMemberships = memberships.filter((m) => m.status === 'pending');
  const visibleMemberships = memberships.filter((m) => membershipFilter === 'all' || m.status === membershipFilter);

  const handleApproveMembership = async (id: string) => {
    setBusyId(id);
    try {
      await approveMembership(id, { role: draftRole[id], personnelId: draftPersonnel[id] || undefined });
    } catch (error) {
      showToast(`Üyelik onaylanamadı: ${error instanceof Error ? error.message : 'Supabase hatası'}`);
    } finally { setBusyId(null); }
  };

  const handleRejectMembership = async (id: string) => {
    const reason = window.prompt('Reddetme gerekçesi (personele iletilecek):');
    if (!reason || !reason.trim()) return;
    setBusyId(id);
    try {
      await rejectMembership(id, reason.trim());
    } catch (error) {
      showToast(`Üyelik reddedilemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`);
    } finally { setBusyId(null); }
  };

  // ─── SİSTEM & DENETİM ────────────────────────────────────────
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesModule = auditModuleFilter === 'all' || log.module === auditModuleFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(auditSearch.toLowerCase()));
    return matchesModule && matchesSearch;
  });

  const exportAuditJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `bizim-vinc-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('✓ Denetim günlüğü JSON olarak dışa aktarıldı.');
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'approvals', label: 'Onay Merkezi', icon: <CheckCircle2 className="w-4 h-4" />, badge: pendingApprovals.length },
    { id: 'attendance', label: 'Yoklama', icon: <CalendarCheck className="w-4 h-4" />, badge: todayYoklama.filter((a) => a.status === 'pending').length },
    { id: 'receipts', label: 'Makbuz & Fatura', icon: <Receipt className="w-4 h-4" />, badge: jobReceipts.filter((r) => r.status === 'pending_approval').length },
    { id: 'fleet', label: 'Filo Takip', icon: <Truck className="w-4 h-4" /> },
    { id: 'memberships', label: 'Üyelik & Kullanıcılar', icon: <UserCheck className="w-4 h-4" />, badge: pendingMemberships.length },
    { id: 'system', label: 'Sistem & Denetim', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-950">Yönetim Paneli</h1>
              <p className="text-xs text-slate-500">Tam kontrol — onaylar, personel, filo, makbuz, denetim</p>
            </div>
          </div>
          <button
            onClick={refreshFromDb}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Yenileniyor...' : 'Yenile'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mt-5 border-b border-emerald-100 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-emerald-950'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: ONAY MERKEZİ */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-amber-700">{pendingApprovals.length}</div>
              <div className="text-[11px] font-bold text-amber-600 mt-1">Bekleyen</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-700">{approvedToday.length}</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1">Bugün Onaylanan</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-rose-700">{rejectedToday.length}</div>
              <div className="text-[11px] font-bold text-rose-600 mt-1">Bugün Reddedilen</div>
            </div>
          </div>

          {/* Filters + Export */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  value={approvalSearch}
                  onChange={(e) => setApprovalSearch(e.target.value)}
                  placeholder="Personel veya başlık ara..."
                  className="bg-transparent text-xs outline-none w-full"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
                  <button key={s} onClick={() => setApprovalStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${approvalStatusFilter === s ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                    {s === 'pending' ? 'Bekleyen' : s === 'approved' ? 'Onaylı' : s === 'rejected' ? 'Reddedilen' : 'Tümü'}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => exportApprovals('excel')} className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white border border-emerald-200 text-emerald-700">XLS</button>
                <button onClick={() => exportApprovals('html')} className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white border border-emerald-200 text-emerald-700">HTML</button>
                <button onClick={() => exportApprovals('print')} className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-800 text-white">PDF</button>
              </div>
            </div>
            {/* Kind filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'yoklama', 'mesai', 'avans', 'izin', 'makbuz', 'yakit', 'genel'] as const).map((k) => (
                <button key={k} onClick={() => setApprovalKindFilter(k)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${approvalKindFilter === k ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-slate-600 hover:bg-emerald-100'}`}>
                  {k === 'all' ? 'Tümü' : kindLabel[k] || k}
                </button>
              ))}
            </div>
          </div>

          {/* Approval List */}
          <div className="space-y-2">
            {filteredApprovals.length === 0 ? (
              <div className="bg-white border border-emerald-100 rounded-2xl p-10 text-center text-sm text-slate-400">Filtreye uyan talep yok.</div>
            ) : filteredApprovals.map((item) => (
              <div key={item.id} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs shrink-0">
                      {item.personInitials || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-emerald-950 truncate">{item.title}</span>
                        <span className="bg-emerald-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{kindLabel[item.kind] || item.kind}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'pending' ? 'bg-amber-50 text-amber-700'
                          : item.status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.status === 'pending' ? 'BEKLİYOR' : item.status === 'approved' ? 'ONAYLANDI' : 'REDDEDİLDİ'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.personName} · {new Date(item.createdAt).toLocaleString('tr-TR')}
                        {item.amount ? ` · ₺${item.amount.toLocaleString('tr-TR')}` : ''}
                        {item.hours ? ` · ${item.hours} saat` : ''}
                      </p>
                      {item.note && <p className="text-[11px] text-slate-400 italic mt-0.5">"{item.note}"</p>}
                      {item.rejectionReason && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">Red: {item.rejectionReason}</p>
                      )}
                      {item.status !== 'pending' && item.approvedBy && (
                        <p className="text-[11px] text-emerald-600 mt-0.5">Onaylayan: {item.approvedBy}</p>
                      )}
                    </div>
                  </div>

                  {item.status === 'pending' && canApprove && (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowRejectInput((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />Reddet
                        </button>
                        <button
                          onClick={() => handleApproveRequest(item.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />Onayla
                        </button>
                      </div>
                      {showRejectInput[item.id] && (
                        <div className="flex gap-2 w-full">
                          <input
                            value={rejectComment[item.id] || ''}
                            onChange={(e) => setRejectComment((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Red gerekçesi..."
                            className="flex-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs outline-none"
                          />
                          <button
                            onClick={() => handleRejectRequest(item.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white"
                          >
                            Gönder
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: YOKLAMA KONTROL */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-700">{todayYoklama.filter((a) => a.status === 'approved').length}</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1">Onaylı</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-amber-700">{todayYoklama.filter((a) => a.status === 'pending').length}</div>
              <div className="text-[11px] font-bold text-amber-600 mt-1">Onay Bekleyen</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-slate-700">{activePersonnel.length - todayYoklama.length}</div>
              <div className="text-[11px] font-bold text-slate-500 mt-1">Göndermeyen</div>
            </div>
            <div className="bg-white border border-emerald-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-950">{activePersonnel.length}</div>
              <div className="text-[11px] font-bold text-slate-500 mt-1">Toplam Aktif</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-950">{today} Yoklama Durumu</h2>
            <div className="flex gap-2">
              <button
                onClick={handleBulkApproveAttendance}
                disabled={todayYoklama.filter((a) => a.status === 'pending').length === 0}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white disabled:opacity-50"
              >
                <CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />
                Tümünü Onayla
              </button>
              <button onClick={() => exportAttendance('excel')} className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-emerald-200 text-emerald-700">XLS</button>
              <button onClick={() => exportAttendance('print')} className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white">PDF</button>
              <a href="/puantaj" className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-emerald-200 text-emerald-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />Aylık Matrisi Gör
              </a>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-emerald-50 border-b border-emerald-100">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Personel</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Durum</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Giriş</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Onay</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {activePersonnel.map((p) => {
                  const att = getPersonAttendanceToday(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-emerald-50/30">
                      <td className="py-2.5 px-4 font-semibold text-emerald-950">{p.fullName}
                        <span className="text-[10px] text-slate-400 ml-1">{p.title}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        {att ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            att.title.includes('GELDI') || att.title.includes('GELDİ') ? 'bg-emerald-100 text-emerald-800'
                            : att.title.includes('IZINLI') || att.title.includes('İZİNLİ') ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                            {att.title.replace('Günlük Yoklama: ', '')}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Gönderilmedi</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{att?.note?.replace('Giriş: ', '') || '—'}</td>
                      <td className="py-2.5 px-4">
                        {att ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            att.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                            : att.status === 'rejected' ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}>
                            {att.status === 'approved' ? 'Onaylandı' : att.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {att && att.status === 'pending' && canApprove && (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => approveRequest(att.id, 'Yönetici onayı')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />Onayla
                            </button>
                            <button onClick={() => rejectRequest(att.id, 'Yönetici reddi')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                              Reddet
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: MAKBUZ & FATURA */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Onay Bekleyen', count: jobReceipts.filter((r) => r.status === 'pending_approval').length, color: 'amber' },
              { label: 'Onaylanan', count: jobReceipts.filter((r) => r.status === 'approved' || r.status === 'onaylandi').length, color: 'emerald' },
              { label: 'Reddedilen', count: jobReceipts.filter((r) => r.status === 'rejected').length, color: 'rose' },
              { label: 'Faturalanan', count: jobReceipts.filter((r) => r.invoiced).length, color: 'sky' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4 text-center`}>
                <div className={`text-2xl font-black text-${color}-700`}>{count}</div>
                <div className={`text-[11px] font-bold text-${color}-600 mt-1`}>{label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-emerald-950">Hızlı Aksiyon</h2>
            <a href="/faturalar" className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />Tüm Makbuz &amp; Faturaları Gör
            </a>
          </div>

          {/* Onay bekleyen — hızlı onayla/reddet */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-3">Onay Bekleyen ({pendingReceipts.length})</h3>
            {pendingReceipts.length === 0 ? (
              <p className="text-xs text-slate-400">Onay bekleyen makbuz yok.</p>
            ) : (
              <div className="space-y-2">
                {pendingReceipts.slice(0, 5).map((r) => (
                  <div key={r.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-950 truncate">{r.customerName} · {r.siteName}</p>
                        <p className="text-[11px] text-slate-500">{r.date} · {r.operatorName} · {r.craneCode}</p>
                      </div>
                      {canApprove && (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => setShowReceiptReject((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-rose-200 bg-rose-50 text-rose-700 flex items-center gap-1">
                            <X className="w-3 h-3" />Reddet
                          </button>
                          <button onClick={() => handleApproveReceipt(r.id)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                            <Check className="w-3 h-3" />Onayla
                          </button>
                        </div>
                      )}
                    </div>
                    {showReceiptReject[r.id] && (
                      <div className="flex gap-2 mt-2">
                        <input
                          value={receiptRejectComment[r.id] || ''}
                          onChange={(e) => setReceiptRejectComment((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Red gerekçesi..."
                          className="flex-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs outline-none"
                        />
                        <button onClick={() => handleRejectReceipt(r.id)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600 text-white">Gönder</button>
                      </div>
                    )}
                  </div>
                ))}
                {pendingReceipts.length > 5 && (
                  <a href="/faturalar" className="block text-center text-[11px] font-bold text-emerald-700 pt-1">+{pendingReceipts.length - 5} tane daha → /faturalar</a>
                )}
              </div>
            )}
          </div>

          {/* Onaylı ama faturalanmamış — hızlı faturala */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-3">Faturalanmayı Bekleyen ({awaitingInvoice.length})</h3>
            {awaitingInvoice.length === 0 ? (
              <p className="text-xs text-slate-400">Faturalanmayı bekleyen onaylı makbuz yok.</p>
            ) : (
              <div className="space-y-2">
                {awaitingInvoice.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-100 bg-sky-50/40 p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-950 truncate">{r.customerName} · {r.siteName}</p>
                      <p className="text-[11px] text-slate-500">{r.date} · {r.workingHours || r.hoursWorked || 0} saat{r.amount ? ` · ₺${r.amount.toLocaleString('tr-TR')}` : ''}</p>
                    </div>
                    {canApprove && (
                      <button
                        onClick={() => handleConvertToInvoice(r.id)}
                        disabled={convertingId === r.id}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-sky-600 text-white flex items-center gap-1 disabled:opacity-50 shrink-0"
                      >
                        <FilePlus className="w-3 h-3" />Faturala
                      </button>
                    )}
                  </div>
                ))}
                {awaitingInvoice.length > 5 && (
                  <a href="/faturalar" className="block text-center text-[11px] font-bold text-sky-700 pt-1">+{awaitingInvoice.length - 5} tane daha → /faturalar</a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: FİLO TAKİP */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sahada', count: craneStatusCounts.sahada, color: 'emerald' },
              { label: 'Müsait', count: craneStatusCounts.musait, color: 'sky' },
              { label: 'Bakımda', count: craneStatusCounts.bakimda, color: 'amber' },
              { label: 'Arızalı', count: craneStatusCounts.arizali, color: 'rose' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4 text-center`}>
                <div className={`text-2xl font-black text-${color}-700`}>{count}</div>
                <div className={`text-[11px] font-bold text-${color}-600 mt-1`}>{label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                value={craneSearch}
                onChange={(e) => setCraneSearch(e.target.value)}
                placeholder="Vinç kodu, operatör veya şantiye..."
                className="bg-transparent text-xs outline-none w-full"
              />
            </div>
            <a href="/filo" className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />Tam Filo Ekranı
            </a>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-emerald-50 border-b border-emerald-100">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Kod / Tür</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Operatör</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Şantiye</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Durum</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Son Bakım</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredCranes.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-50/40">
                    <td className="py-2.5 px-4">
                      <span className="font-black text-emerald-950">{c.code}</span>
                      <span className="text-slate-400 text-[10px] ml-1">{c.type}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{c.operator || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-600">{c.site || '—'}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        c.status === 'sahada' ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'musait' ? 'bg-sky-100 text-sky-800'
                        : c.status === 'bakimda' ? 'bg-amber-100 text-amber-800'
                        : c.status === 'arizali' ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                        {craneStatusLabel[c.status] || c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{c.lastService ? new Date(c.lastService).toLocaleDateString('tr-TR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCranes.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">Araç bulunamadı.</div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: ÜYELİK & KULLANICILAR */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMembershipSubTab('memberships')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${membershipSubTab === 'memberships' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-700'}`}>
              Üyelik Onayları ({pendingMemberships.length} bekleyen)
            </button>
            <button onClick={() => setMembershipSubTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${membershipSubTab === 'users' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-700'}`}>
              Kullanıcı & Rol Yönetimi ({userProfiles.length})
            </button>
          </div>

          {membershipSubTab === 'memberships' && (
            <>
              {!canApproveMemberships ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-bold text-amber-800">
                  Üyelik onaylama yetkisi kurucu, admin ve yönetici rollerine açıktır.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { s: 'pending' as const, label: 'Bekleyen', color: 'amber' },
                      { s: 'approved' as const, label: 'Onaylı', color: 'emerald' },
                      { s: 'rejected' as const, label: 'Reddedilen', color: 'rose' },
                    ].map(({ s, label, color }) => (
                      <button key={s} onClick={() => setMembershipFilter(s)}
                        className={`p-4 rounded-2xl border text-center transition ${membershipFilter === s ? `bg-${color}-500 border-${color}-500 text-white` : `bg-${color}-50 border-${color}-100 text-${color}-700`}`}>
                        <div className="text-2xl font-black">{memberships.filter((m) => m.status === s).length}</div>
                        <div className="text-[11px] font-bold mt-1">{label}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map((key) => (
                      <button key={key} onClick={() => setMembershipFilter(key)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${membershipFilter === key ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border border-emerald-200'}`}>
                        {key === 'pending' ? 'Bekleyen' : key === 'approved' ? 'Onaylı' : key === 'rejected' ? 'Reddedilen' : 'Tümü'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {visibleMemberships.length === 0 ? (
                      <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-400">Bu filtrede başvuru yok.</div>
                    ) : visibleMemberships.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-black text-emerald-950">{item.userFullName || item.userEmail}</h3>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                item.status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                                  : item.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'
                              }`}>
                                {item.status === 'approved' ? 'onaylı' : item.status === 'rejected' ? 'reddedildi' : 'onay bekliyor'}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              {item.userEmail} · Talep edilen rol: <b className="text-emerald-800">{roleLabel(item.requestedRole as AppRole)}</b>
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {new Date(item.createdAt).toLocaleString('tr-TR')}
                              {item.matchedPersonnelName && ` · TC eşleşmesi: `}
                              {item.matchedPersonnelName && <b className="text-emerald-800">{item.matchedPersonnelName}</b>}
                            </div>
                            {item.rejectionReason && (
                              <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">Red: {item.rejectionReason}</div>
                            )}
                          </div>

                          {item.status === 'pending' && (
                            <div className="flex flex-wrap items-end gap-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Atanacak rol</label>
                                <select value={draftRole[item.id] || (item.requestedRole as AppRole) || 'personel'}
                                  onChange={(e) => setDraftRole((prev) => ({ ...prev, [item.id]: e.target.value as AppRole }))}
                                  className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold">
                                  <option value="personel">Personel</option>
                                  <option value="operator">Operatör</option>
                                  <option value="puantor">Puantör</option>
                                  <option value="operasyon">Operasyon</option>
                                  <option value="muhasebe">Muhasebe</option>
                                  <option value="yonetici">Yönetici</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Personel kaydı</label>
                                <select value={draftPersonnel[item.id] || item.personnelId || ''}
                                  onChange={(e) => setDraftPersonnel((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                  className="max-w-[200px] rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold">
                                  <option value="">Eşleştirme yok</option>
                                  {personnel.map((p) => (
                                    <option key={p.id} value={p.id}>{p.fullName}{p.employeeNo ? ` (${p.employeeNo})` : ''}</option>
                                  ))}
                                </select>
                              </div>
                              <button onClick={() => handleApproveMembership(item.id)} disabled={busyId === item.id}
                                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
                                <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />Onayla
                              </button>
                              <button onClick={() => handleRejectMembership(item.id)} disabled={busyId === item.id}
                                className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 disabled:opacity-50">
                                <XCircle className="mr-1.5 inline h-3.5 w-3.5" />Reddet
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {membershipSubTab === 'users' && (
            <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-emerald-100 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-950">Dinamik Personel Türleri</div>
                  <div className="text-[11px] text-slate-500">Yeni türleri yalnız founder/admin ekleyebilir.</div>
                </div>
                <div className="flex gap-2">
                  <input value={newPersonnelType} onChange={(e) => setNewPersonnelType(e.target.value)} placeholder="Örn. İSG Uzmanı" className="px-3 py-2 border border-emerald-200 rounded-lg text-xs" />
                  <button onClick={async () => { if (!newPersonnelType.trim()) return; await addPersonnelType(newPersonnelType); setNewPersonnelType(''); }} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Tür Ekle</button>
                </div>
              </div>
              <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-emerald-50">
                {personnelTypes.map((type) => <span key={type.id} className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">{type.name}</span>)}
              </div>
              <div className="p-3 border-b border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
                <div className="text-xs text-slate-600">Aktif Oturum: <strong className="text-emerald-600 font-mono uppercase">{activeRole}</strong></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-emerald-900">
                  <thead className="bg-emerald-50 text-slate-600 font-semibold border-b border-emerald-100 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Kullanıcı</th>
                      <th className="py-3 px-4">E-Posta</th>
                      <th className="py-3 px-4">Sistem Rolü</th>
                      <th className="py-3 px-4 text-center">Durum</th>
                      <th className="py-3 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {userProfiles.map((user) => (
                      <tr key={user.id} className="hover:bg-emerald-50/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-xs">
                              {user.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-emerald-950">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{user.email}</td>
                        <td className="py-3 px-4">
                          {canManageUsers ? (
                            <select value={user.role} onChange={(e) => updateUserProfile(user.id, { role: e.target.value as AppRole })}
                              className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs text-emerald-600 font-bold focus:outline-none">
                              <option value="admin">ADMIN</option>
                              <option value="yonetici">YÖNETİCİ</option>
                              <option value="muhasebe">MUHASEBE</option>
                              <option value="puantor">PUANTÖR</option>
                              <option value="operasyon">OPERASYON</option>
                              <option value="operator">OPERATÖR</option>
                              <option value="personel">PERSONEL</option>
                            </select>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 uppercase">{user.role}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canManageUsers && (
                            <button onClick={() => updateUserProfile(user.id, { status: user.status === 'aktif' ? 'pasif' : 'aktif' })}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 transition">
                              {user.status === 'aktif' ? 'Pasife Al' : 'Aktif Yap'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: SİSTEM & DENETİM */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* DB Status */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">Supabase PostgreSQL</h3>
                  <p className="text-xs text-slate-500">{dbConnected ? 'Canlı bağlı · RLS aktif' : 'Yerel depolama aktif'}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${dbConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {dbConnected ? 'CANLI' : 'YERELİ'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-emerald-50 rounded-xl p-3"><div className="font-bold text-emerald-950">14+ Tablo</div><div className="text-slate-400">Şema</div></div>
              <div className="bg-emerald-50 rounded-xl p-3"><div className="font-bold text-emerald-950">RLS + RBAC</div><div className="text-slate-400">Güvenlik</div></div>
              <div className="bg-emerald-50 rounded-xl p-3"><div className="font-bold text-emerald-950">{auditLogs.length} kayıt</div><div className="text-slate-400">Denetim günlüğü</div></div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-emerald-100 flex flex-col sm:flex-row gap-3 bg-emerald-50/40">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} placeholder="İşlem, kullanıcı veya açıklama ara..."
                  className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-emerald-400" />
              </div>
              <div className="flex gap-2">
                <select value={auditModuleFilter} onChange={(e) => setAuditModuleFilter(e.target.value)}
                  className="bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 text-xs outline-none">
                  <option value="all">Tüm Modüller</option>
                  <option value="Auth">Auth</option>
                  <option value="Puantaj">Puantaj</option>
                  <option value="Onay">Onay</option>
                  <option value="Personel">Personel</option>
                  <option value="Filo">Filo</option>
                  <option value="Finans">Finans</option>
                  <option value="Sistem">Sistem</option>
                </select>
                <button onClick={exportAuditJSON}
                  className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />JSON
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50 border-b border-emerald-100 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Kullanıcı</th>
                    <th className="py-3 px-4">Modül</th>
                    <th className="py-3 px-4">Eylem</th>
                    <th className="py-3 px-4">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredLogs.slice(0, 100).map((log) => (
                    <tr key={log.id} className="hover:bg-emerald-50/30">
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">{new Date(log.createdAt).toLocaleString('tr-TR')}</td>
                      <td className="py-2.5 px-4 font-semibold text-emerald-950">{log.userName}<div className="text-[10px] text-slate-400 font-mono uppercase">{log.userRole}</div></td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px]">{log.module}</span></td>
                      <td className="py-2.5 px-4 font-semibold font-mono text-[11px]">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-500">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
