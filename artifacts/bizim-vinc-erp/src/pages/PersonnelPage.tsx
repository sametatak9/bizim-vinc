import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { Person, PersonKind, AttendanceStatus, PayrollRun, PayrollItem } from '../types';
import { PersonModal } from '../components/PersonModal';
import {
  Plus,
  Search,
  Phone,
  QrCode,
  Edit3,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Users,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Send,
  Calculator,
  FileSpreadsheet,
  ArrowRight,
  CreditCard,
  History,
  Printer,
  Building2,
  Check,
  X,
} from 'lucide-react';

export const PersonnelPage: React.FC = () => {
  const {
    personnel,
    deletePerson,
    attendance,
    recordAttendance,
    overtimes,
    createOvertimeRequest,
    payrollRuns,
    payrollItems,
    calculatePayroll,
    approvePayrollRun,
    payPayrollRun,
    currentUser,
    advances,
    leaves,
    approvals,
    jobReceipts,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'list' | 'card' | 'attendance' | 'payroll' | 'payments'>('list');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'hepsi' | PersonKind>('hepsi');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Attendance Form State
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceInputs, setAttendanceInputs] = useState<Record<string, { status: AttendanceStatus; hours: number }>>({});

  // Payroll Calculation Month
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [cardPersonId, setCardPersonId] = useState('');

  const filtered = personnel.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
      (p.title && p.title.toLowerCase().includes(search.toLowerCase()));

    const matchesKind = kindFilter === 'hepsi' || p.kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  const totalPersonnel = personnel.length;
  const activeCount = personnel.filter((p) => p.status === 'aktif').length;
  const inDutyCount = personnel.filter((p) => p.poolStatus === 'gorevli').length;
  const certAlertCount = personnel.filter((p) => p.certExpiring).length;

  const handleEdit = (p: Person) => {
    setSelectedPerson(p);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedPerson(null);
    setIsModalOpen(true);
  };

  // Batch Save Daily Attendance
  const handleSaveAllAttendance = async () => {
    for (const p of personnel) {
      const input = attendanceInputs[p.id] || { status: 'geldi' as AttendanceStatus, hours: 0 };
      await recordAttendance(p.id, input.status);

      if (input.hours > 0) {
        await createOvertimeRequest(
          p.id,
          attendanceDate,
          '18:00',
          '22:00',
          input.hours,
          'hafta_ici',
          `${attendanceDate} günlük mesai girişi`
        );
      }
    }
  };

  // Run Payroll Calculation
  const handleRunPayroll = async () => {
    setIsCalculating(true);
    try {
      await calculatePayroll(selectedPayrollMonth);
    } finally {
      setIsCalculating(false);
    }
  };

  const currentRun = payrollRuns.find((r) => r.month === selectedPayrollMonth) || payrollRuns[0];
  const currentRunItems = currentRun
    ? payrollItems.filter((item) => item.runId === currentRun.id || item.payrollRunId === currentRun.id)
    : [];
  const selectedCardPerson = personnel.find((p) => p.id === cardPersonId) || personnel[0];
  const cardHistory = selectedCardPerson ? [
    ...attendance.filter((item) => item.personId === selectedCardPerson.id).map((item) => ({ date: item.date, type: 'Yoklama', text: item.status, detail: item.note || '' })),
    ...leaves.filter((item) => item.personId === selectedCardPerson.id).map((item) => ({ date: item.startDate, type: 'İzin', text: `${item.leaveType} (${item.status})`, detail: item.description || '' })),
    ...advances.filter((item) => item.personId === selectedCardPerson.id).map((item) => ({ date: item.requestDate, type: 'Avans', text: `₺${item.amount.toLocaleString('tr-TR')} (${item.status})`, detail: item.description || '' })),
    ...overtimes.filter((item) => item.personId === selectedCardPerson.id).map((item) => ({ date: item.date, type: 'Mesai', text: `${item.totalHours} saat (${item.status})`, detail: item.description || '' })),
    ...approvals.filter((item) => item.personId === selectedCardPerson.id).map((item) => ({ date: item.createdAt.slice(0, 10), type: 'Onay', text: `${item.title} (${item.status})`, detail: item.note || '' })),
    ...jobReceipts.filter((item) => item.operatorId === selectedCardPerson.id).map((item) => ({ date: item.date, type: 'Makbuz', text: `${item.workingHours} saat · ${item.status}`, detail: item.description || '' })),
    ...payrollItems.filter((item) => (item.personId || item.personnelId) === selectedCardPerson.id).map((item) => ({ date: item.month || '', type: 'Bordro', text: `₺${item.netSalary.toLocaleString('tr-TR')}`, detail: 'Aylık hakediş' })),
  ].sort((a, b) => b.date.localeCompare(a.date)) : [];

  const printPersonnelCard = () => window.print();

  return (
    <main className="space-y-6 animate-in fade-in duration-150" id="personnel-page">
      {/* Top summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Toplam Personel</span>
          <span className="font-mono text-2xl font-bold text-emerald-950">{totalPersonnel}</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Aktif Çalışan</span>
          <span className="font-mono text-2xl font-bold text-emerald-700">{activeCount}</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Şu Anda Görevde</span>
          <span className="font-mono text-2xl font-bold text-blue-700">{inDutyCount}</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Sertifika Uyarısı</span>
          <span className={`font-mono text-2xl font-bold ${certAlertCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {certAlertCount}
          </span>
        </div>
      </section>

      {/* Main Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <Users size={14} />
            <span>Personel Listesi</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
              {personnel.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('card')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'card'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <History size={14} />
            <span>Personel Kart</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <Calendar size={14} />
            <span>Günlük Yoklama & Mesai</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'payroll'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <Calculator size={14} />
            <span>Maaş Hesaplama (Bordro)</span>
            {currentRun && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                {currentRun.month}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <CreditCard size={14} />
            <span>Maaş Ödemeleri</span>
          </button>
        </div>

        {activeTab === 'list' && (
          <button
            onClick={handleCreate}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus size={14} /> Yeni Personel
          </button>
        )}
      </div>

      {/* TAB 1: PERSONEL LİSTESİ */}
      {activeTab === 'list' && (
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden">
          {/* Search & Filters */}
          <div className="p-4 border-b border-emerald-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-md relative">
              <Search size={16} className="text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İsim, sicil no veya unvan ile ara..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-emerald-100 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                {(['hepsi', 'operator', 'yardimci', 'idari'] as const).map((kind) => (
                  <button
                    key={kind}
                    onClick={() => setKindFilter(kind)}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      kindFilter === kind
                        ? 'bg-white text-emerald-950 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-emerald-900'
                    }`}
                  >
                    {kind === 'hepsi'
                      ? 'Tümü'
                      : kind === 'operator'
                      ? 'Operatör'
                      : kind === 'yardimci'
                      ? 'Yardımcı'
                      : 'İdari'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="bg-emerald-50/60 text-[11px] font-bold text-emerald-950 uppercase tracking-wider border-b border-emerald-100">
                  <th className="py-3 px-4">Personel</th>
                  <th className="py-3 px-4">Sicil / Görev</th>
                  <th className="py-3 px-4">İletişim</th>
                  <th className="py-3 px-4">Tanımlı Maaş</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4">Havuz</th>
                  <th className="py-3 px-4">Evrak & İSG</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filtered.map((person) => (
                  <tr key={person.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-xs shrink-0">
                          {person.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {person.fullName}
                          </div>
                          <span className="text-[11px] text-slate-500 capitalize">
                            {person.kind === 'operator'
                              ? 'Vinç Operatörü'
                              : person.kind === 'yardimci'
                              ? 'Saha Yardımcısı'
                              : 'Yönetim / İdari'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-emerald-900">{person.employeeNo}</div>
                      <div className="text-[11px] text-slate-500">{person.title}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <a
                        href={`tel:${person.phone}`}
                        className="text-slate-700 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Phone size={12} className="text-slate-400" />
                        {person.phone}
                      </a>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {(person.salary || 45000).toLocaleString('tr-TR')} ₺
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          person.status === 'aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : person.status === 'izinli'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {person.status === 'aktif'
                          ? 'Aktif'
                          : person.status === 'izinli'
                          ? 'İzinli'
                          : 'Pasif'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          person.poolStatus === 'gorevli'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : person.poolStatus === 'musait'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {person.poolStatus === 'gorevli'
                          ? 'Görevli'
                          : person.poolStatus === 'musait'
                          ? 'Müsait'
                          : 'Havuzda'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {person.documentsOk ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <ShieldCheck size={14} /> Tam
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-red-600 font-semibold">
                            <AlertTriangle size={14} /> Eksik
                          </span>
                        )}

                        {person.certExpiring && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                            Yenileme!
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/kart/${person.cardSlug || person.employeeNo.toLowerCase()}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Dijital Kimlik Kartını Aç"
                        >
                          <QrCode size={16} />
                        </a>
                        <button
                          onClick={() => handleEdit(person)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          title="Düzenle"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`${person.fullName} silinsin mi?`)) {
                              deletePerson(person.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PERSONEL KART ARŞİVİ */}
      {activeTab === 'card' && (
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs p-5 space-y-5 print:shadow-none print:border-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personel Kartı — Kronolojik Arşiv</h2>
              <p className="text-xs text-slate-500 mt-1">İzin, yoklama, mesai, avans, onay, makbuz ve bordro hareketleri.</p>
            </div>
            <button onClick={printPersonnelCard} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold print:hidden"><Printer size={14} /> PDF / HTML yazdır</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={cardPersonId || selectedCardPerson?.id || ''} onChange={(e) => setCardPersonId(e.target.value)} className="flex-1 px-3 py-2 border border-emerald-200 rounded-xl text-sm">
              {personnel.map((person) => <option key={person.id} value={person.id}>{person.fullName} — {person.status === 'aktif' ? 'Aktif' : 'Pasif'}</option>)}
            </select>
            <div className="flex items-center gap-2 text-xs text-slate-500"><span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">Aktif: {personnel.filter((p) => p.status === 'aktif').length}</span><span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">Pasif: {personnel.filter((p) => p.status === 'pasif').length}</span></div>
          </div>
          {selectedCardPerson && <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4"><div className="font-bold text-emerald-950">{selectedCardPerson.fullName}</div><div className="text-xs text-slate-600 mt-1">{selectedCardPerson.title} · {selectedCardPerson.employeeNo} · Maaş: ₺{(selectedCardPerson.salary || 0).toLocaleString('tr-TR')}</div></div>}
          <div className="space-y-2">
            {cardHistory.length === 0 ? <div className="p-8 text-center text-xs text-slate-500">Bu personel için henüz kayıtlı geçmiş yok.</div> : cardHistory.map((entry, index) => <div key={`${entry.type}-${entry.date}-${index}`} className="flex gap-3 border-l-2 border-emerald-200 pl-4 py-2"><div className="w-20 shrink-0 text-[11px] font-mono text-slate-500">{entry.date}</div><div><div className="text-xs font-bold text-emerald-800">{entry.type}</div><div className="text-sm text-slate-800">{entry.text}</div>{entry.detail && <div className="text-xs text-slate-500">{entry.detail}</div>}</div></div>)}
          </div>
        </div>
      )}

      {/* TAB 2: GÜNLÜK YOKLAMA & MESAİ */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Günlük Saha Yoklaması ve Fazla Mesai</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Operatör ve yardımcıların günlük devam durumunu ve mesai saatlerini girin.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="p-2 bg-slate-50 border border-emerald-100 rounded-xl text-xs font-semibold text-slate-800"
              />
              <button
                onClick={handleSaveAllAttendance}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
              >
                <Check size={14} />
                <span>Yoklamayı & Mesaileri Kaydet</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Personel</th>
                  <th className="p-3">Görev</th>
                  <th className="p-3">Devam Durumu</th>
                  <th className="p-3">Fazla Mesai (Saat)</th>
                  <th className="p-3">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {personnel.map((p) => {
                  const currentInput = attendanceInputs[p.id] || { status: 'geldi', hours: 0 };
                  return (
                    <tr key={p.id} className="hover:bg-emerald-50/30">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.fullName}</div>
                        <div className="text-[10px] font-mono text-emerald-800">{p.employeeNo}</div>
                      </td>
                      <td className="p-3 text-slate-500 capitalize">{p.kind}</td>
                      <td className="p-3">
                        <select
                          value={currentInput.status}
                          onChange={(e) =>
                            setAttendanceInputs({
                              ...attendanceInputs,
                              [p.id]: { ...currentInput, status: e.target.value as AttendanceStatus },
                            })
                          }
                          className="p-1.5 bg-slate-50 border border-emerald-100 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          <option value="geldi">Geldi (Normal Çalışma)</option>
                          <option value="gelmedi">Gelmedi (Devamsız)</option>
                          <option value="izinli">İzinli</option>
                          <option value="raporlu">Raporlu</option>
                          <option value="tatil">Haftalık Tatil</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max="16"
                          value={currentInput.hours}
                          onChange={(e) =>
                            setAttendanceInputs({
                              ...attendanceInputs,
                              [p.id]: { ...currentInput, hours: Number(e.target.value) },
                            })
                          }
                          className="w-20 p-1.5 bg-slate-50 border border-emerald-100 rounded-lg text-xs font-mono font-bold"
                        />
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {currentInput.hours > 0 ? `${currentInput.hours * 350} ₺ tahmini mesai hak edişi` : 'Standart mesai'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MAAŞ HESAPLAMA (BORDRO) */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase">
                  <Calculator size={16} />
                  <span>Aylık Bordro Tahakkuku</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">Maaş & Mesai Hesaplama Motoru</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ay içindeki puantaj kayıtları, onaylanan mesai saatleri ve çekilen avansları birleştirerek net maaş bordrosu oluşturur.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="month"
                  value={selectedPayrollMonth}
                  onChange={(e) => setSelectedPayrollMonth(e.target.value)}
                  className="p-2 bg-slate-50 border border-emerald-100 rounded-xl text-xs font-bold text-slate-800 font-mono"
                />
                <button
                  onClick={handleRunPayroll}
                  disabled={isCalculating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Calculator size={14} />
                  <span>{isCalculating ? 'Hesaplanıyor...' : 'Maaşları Otomatik Hesapla'}</span>
                </button>

                {currentRun && currentRun.status === 'draft' && (
                  <button
                    onClick={() => approvePayrollRun(currentRun.id)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Bordroyu Onayla</span>
                  </button>
                )}
              </div>
            </div>

            {/* Run summary */}
            {currentRun && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-50 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block">Dönem</span>
                  <span className="text-base font-bold font-mono text-emerald-950">{currentRun.month}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Kapsanan Personel</span>
                  <span className="text-base font-bold text-slate-800">{currentRun.totalPersons || currentRun.personCount || currentRunItems.length} Kişi</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block">Toplam Fazla Mesai Tutarı</span>
                  <span className="text-base font-bold font-mono text-emerald-800">
                    {(currentRun.totalOvertimePay || 0).toLocaleString('tr-TR')} ₺
                  </span>
                </div>
                <div className="p-3 bg-emerald-100/70 rounded-xl border border-emerald-200">
                  <span className="text-emerald-900 font-bold block">Toplam Net Ödenecek</span>
                  <span className="text-lg font-black font-mono text-emerald-950">
                    {(currentRun.totalNet || currentRun.totalNetSalary || 0).toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Bordro Detay Listesi ({currentRunItems.length} Personel)
              </h3>
              {currentRun && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    currentRun.status === 'paid'
                      ? 'bg-purple-100 text-purple-800'
                      : currentRun.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Durum: {currentRun.status === 'paid' ? 'Ödendi' : currentRun.status === 'approved' ? 'Yönetici Onaylı' : 'Taslak Hesaplama'}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-100 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Personel</th>
                    <th className="p-3">Görev / Sicil</th>
                    <th className="p-3 text-right">Baz Maaş</th>
                    <th className="p-3 text-right">Mesai (Saat)</th>
                    <th className="p-3 text-right">Mesai Ücreti</th>
                    <th className="p-3 text-right">Avans Kesintisi</th>
                    <th className="p-3 text-right">Net Ödenecek</th>
                    <th className="p-3 text-center">Banka / IBAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {currentRunItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Bu ay için henüz maaş hesaplaması yapılmadı. Yukarıdaki butondan &quot;Maaşları Otomatik Hesapla&quot; butonuna tıklayınız.
                      </td>
                    </tr>
                  ) : (
                    currentRunItems.map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                        <td className="p-3 font-bold text-slate-900">{item.personnelName || item.personName}</td>
                        <td className="p-3 text-slate-500">{item.title}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-700">
                          {item.baseSalary.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-3 text-right font-mono">{item.overtimeHours} sa</td>
                        <td className="p-3 text-right font-mono text-emerald-800 font-bold">
                          +{item.overtimePay.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                          -{item.advancesDeduction.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-3 text-right font-mono font-black text-sm text-emerald-950">
                          {item.netSalary.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-3 text-center font-mono text-[10px] text-slate-500">
                          {item.iban || 'Nakit Ödeme'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MAAŞ ÖDEMELERİ */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bordro Onayı & Maaş Dağıtımı</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Onaylanan maaş bordrolarını banka havalesi veya elden nakit olarak kapatın ve kasa defterine işleyin.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {payrollRuns.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">Henüz tahakkuk etmiş bordro bulunmuyor.</div>
            ) : (
              payrollRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-emerald-950">{run.month} Dönemi Maaş Bordrosu</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          run.status === 'paid'
                            ? 'bg-purple-100 text-purple-800'
                            : run.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {run.status === 'paid' ? 'Ödendi' : run.status === 'approved' ? 'Onaylandı (Ödeme Bekliyor)' : 'Taslak'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Kapsam: {run.totalPersons || run.personCount || 0} personel · Toplam Net:{' '}
                      <strong className="font-mono text-emerald-900">
                        {(run.totalNet || run.totalNetSalary || 0).toLocaleString('tr-TR')} ₺
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {run.status === 'approved' && (
                      <>
                        <button
                          onClick={() => payPayrollRun(run.id, 'banka')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <CreditCard size={14} />
                          <span>Banka Havalesiyle Öde</span>
                        </button>
                        <button
                          onClick={() => payPayrollRun(run.id, 'nakit')}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <DollarSign size={14} />
                          <span>Elden Nakit Öde</span>
                        </button>
                      </>
                    )}

                    {run.status === 'paid' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100">
                        <CheckCircle2 size={14} /> Ödeme Tamamlandı ({run.paidAt?.split('T')[0]})
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Person Edit/Create Modal */}
      <PersonModal
        person={selectedPerson}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};
