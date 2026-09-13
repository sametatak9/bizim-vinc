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
} from 'lucide-react';
import { useERP } from '../lib/store';
import { AppRole, UserProfile } from '../types';

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
  } = useERP();

  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'database'>('users');
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-100">Yönetim & Denetim Paneli</h1>
              <p className="text-xs text-neutral-400">
                Kullanıcı rolleri, güvenlik ilkeleri, sistem denetim kayıtları ve veritabanı ayarları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshFromDb}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Senkronize ediliyor...' : 'Yenile'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 mt-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kullanıcı & Rol Yönetimi ({userProfiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Denetim Günlüğü / Audit Log ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-2.5 px-4 transition border-b-2 flex items-center gap-2 ${
              activeTab === 'database'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Veritabanı & Sistem Durumu</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <div className="text-xs text-neutral-400">
              Sistemde tanımlı yetkili kullanıcılar ve erişim seviyeleri
            </div>
            <span className="text-xs text-neutral-400">
              Aktif Oturum: <strong className="text-amber-400 font-mono uppercase">{activeRole}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider text-[11px]">
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
                  <tr key={user.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">
                          {user.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-100">{user.fullName}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      <div>{user.email}</div>
                      <div className="text-[11px] text-neutral-500">{user.phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div>{user.title || '-'}</div>
                      <div className="text-[11px] text-neutral-500">{user.department || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserProfile(user.id, { role: e.target.value as AppRole })}
                        className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
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
                            : 'bg-neutral-800 text-neutral-400'
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
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm space-y-4">
          <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/40">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="İşlem, kullanıcı veya açıklama ara..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
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
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON İndir</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider text-[11px]">
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
                  <tr key={log.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 px-4 font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-200">{log.userName}</div>
                      <div className="text-[10px] text-amber-500/80 font-mono uppercase">{log.userRole || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-200 font-mono text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-neutral-400 text-xs">
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  dbConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-100">Supabase PostgreSQL Durumu</h3>
                <p className="text-xs text-neutral-400">
                  {dbConnected
                    ? 'PostgreSQL veritabanı aktif ve tam bağlı durumdadır.'
                    : 'Yerel depolama (Local Persistence) devrede. Supabase Anon Key bekleniyor.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  dbConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {dbConnected ? 'CANLI / CONNECTED' : 'YEREL ÇEKİRDEK'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="text-xs text-neutral-400 mb-1">Veritabanı Şeması</div>
              <div className="text-sm font-bold text-neutral-100">14 Çekirdek Tablo</div>
              <div className="text-[11px] text-emerald-400 mt-1">RLS Güvenlik İlkeleri Aktif</div>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="text-xs text-neutral-400 mb-1">Kimlik Doğrulama</div>
              <div className="text-sm font-bold text-neutral-100">Supabase Auth & RBAC</div>
              <div className="text-[11px] text-amber-400 mt-1">Roller: Admin, Yönetici, Muhasebe, Puantör, vb.</div>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="text-xs text-neutral-400 mb-1">Denetim Günlüğü</div>
              <div className="text-sm font-bold text-neutral-100">{auditLogs.length} Kayıt Tutuluyor</div>
              <div className="text-[11px] text-neutral-400 mt-1">Otomatik Audit Trigger</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
