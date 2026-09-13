import React, { useState } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useERP } from '../lib/store';
import { AttendanceStatus } from '../types';

export const PuantajPage: React.FC = () => {
  const {
    personnel,
    attendance,
    recordAttendance,
    puantajRecords,
    periodLocks,
    generateMonthlyPuantaj,
    togglePeriodLock,
    updatePuantajRecord,
    activeRole,
    showToast,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'puantaj' | 'yoklama'>('puantaj');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [lockNote, setLockNote] = useState('');
  const [showLockModal, setShowLockModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editWorkDays, setEditWorkDays] = useState(22);
  const [editOtHours, setEditOtHours] = useState(0);

  const isLocked = Boolean(periodLocks[selectedMonth]?.isLocked);
  const lockInfo = periodLocks[selectedMonth];

  // Aktif aya ait puantaj kayıtları
  const currentMonthRecords = puantajRecords.filter((r) => r.month === selectedMonth);

  // Bugünkü tarih
  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleLock = () => {
    if (activeRole !== 'admin' && activeRole !== 'muhasebe') {
      showToast('✕ Bu işlem için Yönetici veya Muhasebe rolü gereklidir!');
      return;
    }
    togglePeriodLock(selectedMonth, !isLocked, lockNote);
    setShowLockModal(false);
    setLockNote('');
  };

  const handleAutoGenerate = async () => {
    await generateMonthlyPuantaj(selectedMonth);
  };

  const handleMarkAllPresent = async () => {
    for (const p of personnel) {
      if (p.status === 'aktif') {
        await recordAttendance(p.id, 'geldi', '08:00', '17:00');
      }
    }
    showToast('✓ Tüm aktif personel için bugünkü yoklama GELDİ olarak kaydedildi.');
  };

  const exportCSV = () => {
    const headers = 'Sicil,Personel,Unvan,Çalışma Günü,Normal Saat,Fazla Mesai Saati,İzin Günü,Rapor Günü,Eksik Gün\n';
    const rows = (currentMonthRecords.length > 0 ? currentMonthRecords : personnel).map((p: any) => {
      const rec = currentMonthRecords.find((r) => r.personId === (p.personId || p.id));
      return `${p.employeeNo || '-'},"${p.personName || p.fullName}","${p.title}",${rec?.workDays || 22},${rec?.normalHours || 176},${rec?.overtimeHours || 0},${rec?.leaveDays || 0},${rec?.sickDays || 0},${rec?.missingDays || 0}`;
    });
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `puantaj-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Puantaj tablosu CSV olarak indirildi.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-100">Puantaj & Devam Takip Merkezi</h1>
                <p className="text-xs text-neutral-400">
                  Yoklama, mesai ve izinlerin otomatik hakedişe dönüştürülmesi ve dönem kilitleme
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1">
              <span className="text-xs text-neutral-400 mr-2 pl-1">Dönem:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Lock Status Badge & Button */}
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border ${
                  isLocked
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {isLocked ? 'KİLİTLİ' : 'AÇIK'}
              </span>

              {(activeRole === 'admin' || activeRole === 'muhasebe') && (
                <button
                  onClick={() => setShowLockModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition border border-neutral-700 flex items-center gap-1"
                >
                  {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {isLocked ? 'Kilidi Aç' : 'Dönemi Kilitle'}
                </button>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={handleAutoGenerate}
              disabled={isLocked}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition flex items-center gap-1.5 shadow-md shadow-amber-500/10 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Otomatik Puantajı Derle</span>
            </button>

            <button
              onClick={exportCSV}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
              title="CSV İndir"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lock Banner if locked */}
        {isLocked && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>
                <strong>{selectedMonth}</strong> puantaj dönemi <strong>{lockInfo?.lockedBy}</strong> tarafından kilitlendi ({new Date(lockInfo?.lockedAt || '').toLocaleDateString('tr-TR')}). {lockInfo?.notes && `Not: "${lockInfo.notes}"`}
              </span>
            </div>
            <span className="text-[11px] text-rose-400/80">Değişiklik yapılamaz</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 mt-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('puantaj')}
            className={`pb-2.5 px-4 transition border-b-2 ${
              activeTab === 'puantaj'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Aylık Puantaj Çetelesi ({currentMonthRecords.length || personnel.length})
          </button>
          <button
            onClick={() => setActiveTab('yoklama')}
            className={`pb-2.5 px-4 transition border-b-2 ${
              activeTab === 'yoklama'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Günlük Yoklama & Giriş-Çıkış
          </button>
        </div>
      </div>

      {/* TAB 1: AYLIK PUANTAJ ÇETELESİ */}
      {activeTab === 'puantaj' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <div className="text-xs text-neutral-400">
              Personel Hakediş ve Mesai Tablosu — <strong className="text-neutral-200">{selectedMonth}</strong>
            </div>
            <div className="text-xs text-neutral-400 flex items-center gap-4">
              <span>Toplam Aktif Personel: <strong className="text-neutral-200">{personnel.filter((p) => p.status === 'aktif').length}</strong></span>
              <span>Toplam Mesai Saati: <strong className="text-amber-400">
                {currentMonthRecords.reduce((sum, r) => sum + r.overtimeHours, 0)} sa
              </strong></span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Sicil & Personel</th>
                  <th className="py-3 px-4">Görev / Unvan</th>
                  <th className="py-3 px-3 text-center">Çalışma Günü</th>
                  <th className="py-3 px-3 text-center">Normal Saat</th>
                  <th className="py-3 px-3 text-center">Fazla Mesai</th>
                  <th className="py-3 px-3 text-center">İzin (Gün)</th>
                  <th className="py-3 px-3 text-center">Rapor (Gün)</th>
                  <th className="py-3 px-3 text-center">Eksik Gün</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {personnel
                  .filter((p) => p.status === 'aktif')
                  .map((p) => {
                    const rec = currentMonthRecords.find((r) => r.personId === p.id);
                    const workDays = rec ? rec.workDays : 22;
                    const normalHours = rec ? rec.normalHours : 176;
                    const otHours = rec ? rec.overtimeHours : 0;
                    const leaveDays = rec ? rec.leaveDays : 0;
                    const sickDays = rec ? rec.sickDays : 0;
                    const missingDays = rec ? rec.missingDays : 0;

                    const isEditing = editingRecordId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-neutral-800/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 font-bold flex items-center justify-center text-[10px]">
                              {p.initials}
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-100">{p.fullName}</div>
                              <div className="text-[11px] text-neutral-500 font-mono">{p.employeeNo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-400">{p.title}</td>
                        <td className="py-3 px-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editWorkDays}
                              onChange={(e) => setEditWorkDays(Number(e.target.value))}
                              className="w-14 px-1.5 py-0.5 bg-neutral-950 border border-neutral-700 rounded text-center text-xs text-neutral-100"
                            />
                          ) : (
                            <span className="font-medium text-neutral-200">{workDays} gün</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-neutral-300">{normalHours} sa</td>
                        <td className="py-3 px-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editOtHours}
                              onChange={(e) => setEditOtHours(Number(e.target.value))}
                              className="w-14 px-1.5 py-0.5 bg-neutral-950 border border-neutral-700 rounded text-center text-xs text-amber-400"
                            />
                          ) : otHours > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                              +{otHours} sa
                            </span>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-neutral-400">
                          {leaveDays > 0 ? <span className="text-sky-400 font-semibold">{leaveDays} gün</span> : '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-neutral-400">
                          {sickDays > 0 ? <span className="text-rose-400 font-semibold">{sickDays} gün</span> : '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-neutral-400">
                          {missingDays > 0 ? <span className="text-amber-400 font-semibold">{missingDays} gün</span> : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  updatePuantajRecord(rec ? rec.id : `${selectedMonth}-${p.id}`, {
                                    workDays: editWorkDays,
                                    normalHours: editWorkDays * 8,
                                    overtimeHours: editOtHours,
                                  });
                                  setEditingRecordId(null);
                                }}
                                className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px]"
                              >
                                Kaydet
                              </button>
                              <button
                                onClick={() => setEditingRecordId(null)}
                                className="px-2 py-1 rounded bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-[11px]"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled={isLocked}
                              onClick={() => {
                                setEditingRecordId(p.id);
                                setEditWorkDays(workDays);
                                setEditOtHours(otHours);
                              }}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition disabled:opacity-30"
                            >
                              Düzenle
                            </button>
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

      {/* TAB 2: GÜNLÜK YOKLAMA VE GİRİŞ-ÇIKIŞ */}
      {activeTab === 'yoklama' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-neutral-300">
                Bugünün Tarihi: <strong className="text-neutral-100">{todayStr}</strong>
              </span>
            </div>

            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-600/10"
            >
              <UserCheck className="w-4 h-4" />
              <span>Tüm Aktif Personeli "GELDİ" İşaretle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {personnel
              .filter((p) => p.status === 'aktif')
              .map((p) => {
                const todayRecord = attendance.find((a) => a.personId === p.id && a.date === todayStr);
                const currentStatus: AttendanceStatus = todayRecord?.status || 'geldi';

                return (
                  <div
                    key={p.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">
                          {p.initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-neutral-100">{p.fullName}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">{p.employeeNo} • {p.title}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-neutral-400">Durum Seçimi:</div>
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        <button
                          onClick={() => recordAttendance(p.id, 'geldi', '08:00', '17:00')}
                          className={`py-1.5 px-2 rounded-lg font-medium transition ${
                            currentStatus === 'geldi'
                              ? 'bg-emerald-500 text-neutral-950 font-bold'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          Geldi
                        </button>
                        <button
                          onClick={() => recordAttendance(p.id, 'izinli')}
                          className={`py-1.5 px-2 rounded-lg font-medium transition ${
                            currentStatus === 'izinli'
                              ? 'bg-sky-500 text-neutral-950 font-bold'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          İzinli
                        </button>
                        <button
                          onClick={() => recordAttendance(p.id, 'raporlu')}
                          className={`py-1.5 px-2 rounded-lg font-medium transition ${
                            currentStatus === 'raporlu'
                              ? 'bg-rose-500 text-neutral-950 font-bold'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          Raporlu
                        </button>
                      </div>
                      {todayRecord && (
                        <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-800">
                          <span>Giriş: {todayRecord.checkInTime || '-'}</span>
                          <span>Çıkış: {todayRecord.checkOutTime || '-'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Lock Period Confirmation Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                {isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-100">
                  {isLocked ? 'Puantaj Kilidini Kaldır' : 'Puantaj Dönemini Kilitle'}
                </h3>
                <p className="text-xs text-neutral-400">Dönem: {selectedMonth}</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300">
              {isLocked
                ? 'Bu dönemin kilidini açtığınızda puantaj tablosu yeniden düzenlenebilir ve hesaplanabilir hale gelecektir. İşlem denetim günlüğüne (audit log) kaydedilecektir.'
                : 'Bu dönemi kilitlediğinizde muhasebe dışındaki personeller puantaj veya mesai değişikliği yapamaz. Bordro aktarımı öncesinde kilit önerilir.'}
            </p>

            <div>
              <label className="block text-xs text-neutral-300 mb-1">İşlem Gerekçesi / Not</label>
              <textarea
                value={lockNote}
                onChange={(e) => setLockNote(e.target.value)}
                placeholder="Örn: 2026 Eylül bordrosu hazırlandı, kilitleme yapıldı."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleToggleLock}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isLocked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                }`}
              >
                {isLocked ? 'Kilidi Kaldır ve Aç' : 'Dönemi Kesin Kilitle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
