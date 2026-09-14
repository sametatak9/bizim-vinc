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
  FileText,
  ArrowRight,
  CreditCard,
  History,
  Printer,
  Building2,
  Check,
  X,
  Download,
} from 'lucide-react';
import { downloadExcelReport, downloadHtmlReport, printReport } from '../lib/reporting';
import { FINANCE_ROLES, roleLabel } from '../lib/permissions';

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
    payrollPayments,
    addPayrollPayment,
  } = useERP();

  // Rol duyarli yetkiler
  const canSeeSalary = FINANCE_ROLES.includes(currentUser.role);
  const canManagePersonnel = ['founder', 'admin', 'yonetici'].includes(currentUser.role);
  const canRecordAttendance = ['founder', 'admin', 'yonetici', 'puantor', 'operasyon'].includes(currentUser.role);

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
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});

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
  const inDutyCount = personnel.filter((p) => p.status === 'aktif').length;
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
      if (!canRecordAttendance) break;
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

  const cardFinance = selectedCardPerson ? {
    approvedAdvance: advances.filter((a) => a.personId === selectedCardPerson.id && a.status === 'approved').reduce((sum, a) => sum + a.amount, 0),
    pendingAdvance: advances.filter((a) => a.personId === selectedCardPerson.id && a.status === 'pending').reduce((sum, a) => sum + a.amount, 0),
    approvedOvertime: overtimes.filter((o) => o.personId === selectedCardPerson.id && o.status === 'approved').reduce((sum, o) => sum + o.totalHours, 0),
    pendingOvertime: overtimes.filter((o) => o.personId === selectedCardPerson.id && o.status === 'pending').reduce((sum, o) => sum + o.totalHours, 0),
    approvedApprovals: approvals.filter((a) => a.personId === selectedCardPerson.id && a.status === 'approved').length,
    rejectedApprovals: approvals.filter((a) => a.personId === selectedCardPerson.id && a.status === 'rejected').length,
  } : null;

  const exportCard = (format: 'excel' | 'html') => {
    if (!selectedCardPerson) return;
    const rows = cardHistory.map((entry) => ({ tarih: entry.date, hareket: entry.type, detay: entry.text, aciklama: entry.detail }));
    const columns = [{ key: 'tarih', label: 'Tarih' }, { key: 'hareket', label: 'Hareket' }, { key: 'detay', label: 'Detay' }, { key: 'aciklama', label: 'Açıklama' }];
    const title = `${selectedCardPerson.fullName} Personel Kart Arşivi`;
    if (format === 'excel') downloadExcelReport(`personel-kart-${selectedCardPerson.employeeNo}`, title, columns, rows);
    else downloadHtmlReport(`personel-kart-${selectedCardPerson.employeeNo}`, title, columns, rows);
  };

  const printPersonnelCard = () => window.print();
  const exportPersonnelExcel = () => {
    const rows = filtered.map((p) => [p.employeeNo, p.fullName, p.title, p.phone, p.status, p.salary ?? 0, p.startDate || '', p.endDate || '']);
    const content = ['Sicil\tAd Soyad\tGörev\tTelefon\tDurum\tMaaş\tİşe Giriş\tÇıkış', ...rows.map((r) => r.join('\t'))].join('\n');
    const blob = new Blob([`\ufeff${content}`], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bizim-vinc-personel-${new Date().toISOString().slice(0,10)}.xls`; a.click(); URL.revokeObjectURL(url);
  };
  const exportPersonnelReport = (format: 'excel' | 'html' | 'print') => {
    const columns = [{ key: 'sicil', label: 'Sicil' }, { key: 'ad', label: 'Ad Soyad' }, { key: 'gorev', label: 'Görev' }, { key: 'telefon', label: 'Telefon' }, { key: 'durum', label: 'Durum' }, { key: 'maas', label: 'Maaş' }];
    const rows = filtered.map((p) => ({ sicil: p.employeeNo, ad: p.fullName, gorev: p.title, telefon: p.phone, durum: p.status, maas: canSeeSalary ? `${(p.salary || 0).toLocaleString('tr-TR')} ₺` : 'gizli' }));
    const title = 'BİZİM VİNÇ Personel Arşivi';
    if (format === 'excel') downloadExcelReport('personel-arsivi', title, columns, rows);
    else if (format === 'html') downloadHtmlReport('personel-arsivi', title, columns, rows);
    else printReport(title, columns, rows);
  };
  const printPersonnelReport = () => { setActiveTab('list'); setTimeout(() => window.print(), 0); };

  return (
    <main className="space-y-6 animate-in fade-in duration-150" id="personnel-page">
      <section className="relative overflow-hidden rounded-[26px] bg-white border border-emerald-200 p-5 sm:p-6 shadow-sm">
        <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">İnsan ve saha kaynağı</p><h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-emerald-950">Personel Yönetimi</h1><p className="mt-2 text-sm text-slate-500">Ekibinizi görsel bir dizinde yönetin; görev, durum, evrak ve puantaj akışını tek kayıttan takip edin.</p></div>{canManagePersonnel && <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-emerald-700"><Plus size={16} /> Yeni Personel Kaydı</button>}</div>
        <div className="relative mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Oturum rolü: {roleLabel(currentUser.role)}</span>
          <span className={`rounded-full px-3 py-1 ${canSeeSalary ? 'bg-lime-50 text-lime-700' : 'bg-slate-100 text-slate-500'}`}>{canSeeSalary ? 'Maaş ve bordro görünür' : 'Maaş bilgileri gizli'}</span>
          <span className={`rounded-full px-3 py-1 ${canManagePersonnel ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{canManagePersonnel ? 'Kayıt ekleme/silme açık' : 'Salt okunur kayıt erişimi'}</span>
          <span className={`rounded-full px-3 py-1 ${canRecordAttendance ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>{canRecordAttendance ? 'Yoklama girişi açık' : 'Yoklama girişi kapalı'}</span>
        </div>
      </section>
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
          <span className="text-xs font-semibold text-slate-500 block mb-1">Aktif Çalışan</span>
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
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
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
            <span>Yoklama & Mesai</span>
          </button>

          {canSeeSalary && <button
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
          </button>}

          {canSeeSalary && <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <CreditCard size={14} />
            <span>Maaş Ödemeleri</span>
          </button>}
        </div>

        {activeTab === 'list' && canManagePersonnel && (
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

            <div className="flex flex-wrap items-center gap-2 max-w-full">
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
              <button type="button" onClick={() => exportPersonnelReport('excel')} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap hover:bg-emerald-100"><FileSpreadsheet size={13} /> Excel</button>
              <button type="button" onClick={() => exportPersonnelReport('html')} className="px-3 py-2 rounded-xl bg-white text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap hover:bg-emerald-50"><FileText size={13} /> HTML</button>
              <button type="button" onClick={() => exportPersonnelReport('print')} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap hover:bg-emerald-700"><Printer size={13} /> PDF / Yazdır</button>
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
                  {canSeeSalary && <th className="py-3 px-4">Tanımlı Maaş</th>}
                  <th className="py-3 px-4">Durum</th>
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

                    {canSeeSalary && (
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {(person.salary || 0).toLocaleString('tr-TR')} ₺
                      </td>
                    )}

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
                        {canManagePersonnel && (
                          <button
                            onClick={() => handleEdit(person)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Düzenle"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {canManagePersonnel && (
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
                        )}
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
            <div className="flex flex-wrap gap-2 print:hidden"><button onClick={() => exportCard('excel')} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"><FileSpreadsheet size={14} /> Excel</button><button onClick={() => exportCard('html')} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"><FileText size={14} /> HTML</button><button onClick={printPersonnelCard} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950 text-white text-xs font-bold"><Printer size={14} /> Yazdır / PDF</button></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={cardPersonId || selectedCardPerson?.id || ''} onChange={(e) => setCardPersonId(e.target.value)} className="flex-1 px-3 py-2 border border-emerald-200 rounded-xl text-sm">
              {personnel.map((person) => <option key={person.id} value={person.id}>{person.fullName} — {person.status === 'aktif' ? 'Aktif' : 'Pasif'}</option>)}
            </select>
            <div className="flex items-center gap-2 text-xs text-slate-500"><span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">Aktif: {personnel.filter((p) => p.status === 'aktif').length}</span><span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">Pasif: {personnel.filter((p) => p.status === 'pasif').length}</span></div>
          </div>
          {selectedCardPerson && cardFinance && <><div className="rounded-2xl bg-gradient-to-r from-emerald-950 to-emerald-700 text-white p-4"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><div className="font-black text-lg">{selectedCardPerson.fullName}</div><div className="text-xs text-emerald-100">{selectedCardPerson.title} · {selectedCardPerson.employeeNo} · Temel maaş: ₺{(selectedCardPerson.salary || 0).toLocaleString('tr-TR')}</div></div><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold">{selectedCardPerson.status === 'aktif' ? 'Aktif' : 'Pasif'}</span></div></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"><div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3"><span className="text-[10px] text-slate-500">Onaylı avans</span><b className="block mt-1 text-sm text-emerald-900">₺{cardFinance.approvedAdvance.toLocaleString('tr-TR')}</b></div><div className="rounded-xl bg-amber-50 border border-amber-100 p-3"><span className="text-[10px] text-slate-500">Bekleyen avans</span><b className="block mt-1 text-sm text-amber-800">₺{cardFinance.pendingAdvance.toLocaleString('tr-TR')}</b></div><div className="rounded-xl bg-lime-50 border border-lime-100 p-3"><span className="text-[10px] text-slate-500">Onaylı mesai</span><b className="block mt-1 text-sm text-lime-800">{cardFinance.approvedOvertime} sa</b></div><div className="rounded-xl bg-amber-50 border border-amber-100 p-3"><span className="text-[10px] text-slate-500">Bekleyen mesai</span><b className="block mt-1 text-sm text-amber-800">{cardFinance.pendingOvertime} sa</b></div><div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3"><span className="text-[10px] text-slate-500">Onaylanan</span><b className="block mt-1 text-sm text-emerald-900">{cardFinance.approvedApprovals}</b></div><div className="rounded-xl bg-rose-50 border border-rose-100 p-3"><span className="text-[10px] text-slate-500">Reddedilen</span><b className="block mt-1 text-sm text-rose-800">{cardFinance.rejectedApprovals}</b></div></div></>}
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
              <h2 className="text-base font-bold text-slate-900">Yoklama ve Mesai Yönetimi</h2>
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
                    <th className="p-3 text-right">Parçalı Ödeme / Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {currentRunItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
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
                        <td className="p-3 text-right">
                          {(() => { const paid = payrollPayments.filter((payment) => payment.payrollItemId === item.id).reduce((sum, payment) => sum + payment.amount, 0); const remaining = Math.max(0, item.netSalary - paid); return <div className="space-y-1"><div className="text-[10px] text-slate-500">Ödenen ₺{paid.toLocaleString('tr-TR')} · Kalan <strong>₺{remaining.toLocaleString('tr-TR')}</strong></div>{remaining > 0 && <div className="flex gap-1"><input type="number" min="0.01" max={remaining} step="0.01" value={paymentAmounts[item.id] || ''} onChange={(e) => setPaymentAmounts((prev) => ({ ...prev, [item.id]: e.target.value }))} placeholder="Tutar" className="w-20 px-1.5 py-1 border border-emerald-200 rounded text-[10px]" /><button onClick={async () => { await addPayrollPayment(item.id, Number(paymentAmounts[item.id])); setPaymentAmounts((prev) => ({ ...prev, [item.id]: '' })); }} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">Öde</button></div>}</div>; })()}
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
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
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
