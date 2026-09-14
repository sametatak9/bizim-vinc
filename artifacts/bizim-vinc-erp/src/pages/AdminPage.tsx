import React, { useState } from 'react';
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
} from 'lucide-react';
import { useERP } from '../lib/store';
import { AppRole } from '../types';
import { MEMBERSHIP_APPROVER_ROLES, roleLabel } from '../lib/permissions';

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
  } = useERP();

  const [activeTab, setActiveTab] = useState<'memberships' | 'users' | 'audit' | 'database'>('memberships');
  const [membershipFilter, setMembershipFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [draftRole, setDraftRole] = useState<Record<string, AppRole>>({});
  const [draftPersonnel, setDraftPersonnel] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const canApproveMemberships = MEMBERSHIP_APPROVER_ROLES.includes(currentUser.role);
  const pendingMemberships = memberships.filter((item) => item.status === 'pending');
  const visibleMemberships = memberships.filter((item) => membershipFilter === 'all' || item.status === membershipFilter);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveMembership(id, { role: draftRole[id], personnelId: draftPersonnel[id] || undefined });
    } catch (error) {
      showToast(`Üyelik onaylanamadı: ${error instanceof Error ? error.message : 'Supabase hatası'}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Reddetme gerekçesi (personele iletilecek):');
    if (!reason || !reason.trim()) return;
    setBusyId(id);
    try {
      await rejectMembership(id, reason.trim());
    } catch (error) {
      showToast(`Üyelik reddedilemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`);
    } finally {
      setBusyId(null);
    }
  };
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('all');
  const [newPersonnelType, setNewPersonnelType] = useState('');

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
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bizim-vinc-audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('✓ Denetim günlüğü JSON olarak dışa aktarıldı.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-950">Yönetim & Denetim Paneli</h1>
              <p className="text-xs text-slate-600">
                Kullanıcı rolleri, güvenlik ilkeleri, sistem denetim kayıtları ve veritabanı ayarları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshFromDb}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-neutral-700 text-emerald-950 border border-neutral-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Senkronize ediliyor...' : 'Yenile'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-emerald-100 mt-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('memberships')}
            className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-2 ${
              activeTab === 'memberships'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-emerald-950'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Üyelik Onayları ({pendingMemberships.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-emerald-950'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kullanıcı & Rol Yönetimi ({userProfiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-emerald-950'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Denetim Günlüğü / Audit Log ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-2 ${
              activeTab === 'database'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-emerald-950'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Veritabanı & Sistem Durumu</span>
          </button>
        </div>
      </div>

      {/* TAB 0: MEMBERSHIP APPROVALS */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          {!canApproveMemberships ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-bold text-amber-800">
              Üyelik onaylama yetkisi yalnızca kurucu, admin ve yönetici rollerine açıktır.
            </div>
          ) : (
            <>
              <div className="rounded-[26px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 p-6 text-white shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">Personel Üyelik Kurumu</div>
                <h2 className="mt-1 text-2xl font-black">Üyelik Başvuruları</h2>
                <p className="mt-1 max-w-2xl text-xs text-emerald-100">
                  Sahadaki personel kendi hesabını açar; siz burada rolünü belirleyip personel kaydıyla eşleştirerek onaylarsınız.
                  Onaylanmayan hesaplar hiçbir ERP ekranına erişemez.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-[10px] font-black uppercase text-emerald-200">Bekleyen</div>
                    <div className="text-xl font-black">{memberships.filter((m) => m.status === 'pending').length}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-[10px] font-black uppercase text-emerald-200">Onaylı</div>
                    <div className="text-xl font-black">{memberships.filter((m) => m.status === 'approved').length}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="text-[10px] font-black uppercase text-emerald-200">Reddedilen</div>
                    <div className="text-xl font-black">{memberships.filter((m) => m.status === 'rejected').length}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {([['pending', 'Bekleyen'], ['approved', 'Onaylı'], ['rejected', 'Reddedilen'], ['all', 'Tümü']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setMembershipFilter(key)}
                    className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
                      membershipFilter === key ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border border-emerald-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {visibleMemberships.length === 0 ? (
                <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                  Bu filtrede üyelik başvurusu bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleMemberships.map((item) => {
                    const matched = personnel.find((p) => p.id === (draftPersonnel[item.id] || item.personnelId));
                    return (
                      <div key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
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
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Clock className="h-3 w-3" />
                              {new Date(item.createdAt).toLocaleString('tr-TR')}
                              {item.matchedPersonnelName && <span>· TC eşleşmesi: <b className="text-emerald-800">{item.matchedPersonnelName}</b></span>}
                            </div>
                            {item.rejectionReason && (
                              <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
                                Red gerekçesi: {item.rejectionReason}
                              </div>
                            )}
                          </div>

                          {item.status === 'pending' && (
                            <div className="flex flex-wrap items-end gap-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Atanacak rol</label>
                                <select
                                  value={draftRole[item.id] || (item.requestedRole as AppRole) || 'personel'}
                                  onChange={(e) => setDraftRole((prev) => ({ ...prev, [item.id]: e.target.value as AppRole }))}
                                  className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold"
                                >
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
                                <select
                                  value={draftPersonnel[item.id] || item.personnelId || ''}
                                  onChange={(e) => setDraftPersonnel((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                  className="max-w-[220px] rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold"
                                >
                                  <option value="">Eşleştirme yok</option>
                                  {personnel.map((p) => (
                                    <option key={p.id} value={p.id}>{p.fullName}{p.employeeNo ? ` (${p.employeeNo})` : ''}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                onClick={() => handleApprove(item.id)}
                                disabled={busyId === item.id}
                                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
                              >
                                <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />Onayla
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                disabled={busyId === item.id}
                                className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 disabled:opacity-50"
                              >
                                <XCircle className="mr-1.5 inline h-3.5 w-3.5" />Reddet
                              </button>
                            </div>
                          )}
                        </div>
                        {item.status === 'pending' && (
                          <p className="mt-3 rounded-xl bg-emerald-50/70 px-3 py-2 text-[11px] text-slate-600">
                            Onayladığınızda kullanıcı {roleLabel(draftRole[item.id] || (item.requestedRole as AppRole))} yetkileriyle giriş yapar
                            {matched ? ` ve ${matched.fullName} personel kaydına bağlanır` : ''}. Yalnızca bu role tanımlı ekranları görebilir.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {memberships.some((m) => m.status === 'pending') && (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] font-bold text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Bekleyen üyelikler ERP verilerine erişemez. Personelin sisteme girebilmesi için TC eşleşmesini kontrol edip rolünü atayın.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 1: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-emerald-100 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><div className="text-xs font-bold text-emerald-950">Dinamik Personel Türleri</div><div className="text-[11px] text-slate-500">Yeni türleri yalnız founder/admin ekleyebilir.</div></div>
            <div className="flex gap-2"><input value={newPersonnelType} onChange={(e) => setNewPersonnelType(e.target.value)} placeholder="Örn. İSG Uzmanı" className="px-3 py-2 border border-emerald-200 rounded-lg text-xs" /><button onClick={async () => { if (!newPersonnelType.trim()) return; await addPersonnelType(newPersonnelType); setNewPersonnelType(''); }} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Tür Ekle</button></div>
          </div>
          <div className="px-4 py-2 flex flex-wrap gap-2">{personnelTypes.map((type) => <span key={type.id} className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">{type.name}</span>)}</div>
          <div className="p-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/40">
            <div className="text-xs text-slate-600">
              Sistemde tanımlı yetkili kullanıcılar ve erişim seviyeleri
            </div>
            <span className="text-xs text-slate-600">
              Aktif Oturum: <strong className="text-emerald-600 font-mono uppercase">{activeRole}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-emerald-900">
              <thead className="bg-emerald-50 text-slate-600 font-semibold border-b border-emerald-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Kullanıcı</th>
                  <th className="py-3 px-4">E-Posta & Telefon</th>
                  <th className="py-3 px-4">Departman / Unvan</th>
                  <th className="py-3 px-4">Sistem Rolü</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {userProfiles.map((user) => (
                  <tr key={user.id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold flex items-center justify-center text-xs">
                          {user.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-emerald-950">{user.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-emerald-900">
                      <div>{user.email}</div>
                      <div className="text-[11px] text-slate-500">{user.phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{user.title || '-'}</div>
                      <div className="text-[11px] text-slate-500">{user.department || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserProfile(user.id, { role: e.target.value as AppRole })}
                        className="bg-emerald-50 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-emerald-600 font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="admin">ADMIN (Tam Yetki)</option>
                        <option value="yonetici">YÖNETİCİ</option>
                        <option value="muhasebe">MUHASEBE</option>
                        <option value="puantor">PUANTÖR</option>
                        <option value="operasyon">OPERASYON</option>
                        <option value="operator">OPERATÖR</option>
                        <option value="personel">PERSONEL</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          user.status === 'aktif'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-emerald-50 text-slate-600'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          updateUserProfile(user.id, {
                            status: user.status === 'aktif' ? 'pasif' : 'aktif',
                          })
                        }
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-neutral-700 text-emerald-900 transition"
                      >
                        {user.status === 'aktif' ? 'Pasife Al' : 'Aktif Yap'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm space-y-4">
          <div className="p-4 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/40">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="İşlem, kullanıcı veya açıklama ara..."
                className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 text-xs text-emerald-950 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 text-xs text-emerald-900 focus:outline-none"
              >
                <option value="all">Tüm Modüller</option>
                <option value="Auth">Auth / Giriş</option>
                <option value="Puantaj">Puantaj & Devam</option>
                <option value="Onay">Onay Merkezi</option>
                <option value="Personel">Personel</option>
                <option value="Filo">Filo</option>
                <option value="Finans">Finans</option>
                <option value="Sistem">Sistem</option>
              </select>

              <button
                onClick={exportAuditJSON}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-neutral-700 text-emerald-950 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON İndir</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-emerald-900">
              <thead className="bg-emerald-50 text-slate-600 font-semibold border-b border-emerald-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tarih / Saat</th>
                  <th className="py-3 px-4">Kullanıcı</th>
                  <th className="py-3 px-4">Modül</th>
                  <th className="py-3 px-4">Eylem</th>
                  <th className="py-3 px-4">Açıklama & Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-emerald-950">{log.userName}</div>
                      <div className="text-[10px] text-emerald-600/80 font-mono uppercase">{log.userRole || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-neutral-700 text-[11px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-950 font-mono text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE STATUS */}
      {activeTab === 'database' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  dbConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">Supabase PostgreSQL Durumu</h3>
                <p className="text-xs text-slate-600">
                  {dbConnected
                    ? 'PostgreSQL veritabanı aktif ve tam bağlı durumdadır.'
                    : 'Yerel depolama (Local Persistence) devrede. Supabase Anon Key bekleniyor.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  dbConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-600'
                }`}
              >
                {dbConnected ? 'CANLI / CONNECTED' : 'YEREL ÇEKİRDEK'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs text-slate-600 mb-1">Veritabanı Şeması</div>
              <div className="text-sm font-bold text-emerald-950">14 Çekirdek Tablo</div>
              <div className="text-[11px] text-emerald-400 mt-1">RLS Güvenlik İlkeleri Aktif</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs text-slate-600 mb-1">Kimlik Doğrulama</div>
              <div className="text-sm font-bold text-emerald-950">Supabase Auth & RBAC</div>
              <div className="text-[11px] text-emerald-600 mt-1">Roller: Admin, Yönetici, Muhasebe, Puantör, vb.</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs text-slate-600 mb-1">Denetim Günlüğü</div>
              <div className="text-sm font-bold text-emerald-950">{auditLogs.length} Kayıt Tutuluyor</div>
              <div className="text-[11px] text-slate-600 mt-1">Otomatik Audit Trigger</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
