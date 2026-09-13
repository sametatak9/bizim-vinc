import React, { useEffect, useMemo, useState } from 'react';
import { useERP } from '../lib/store';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Calendar,
  AlertCircle,
  FileText,
  Receipt,
  Fuel,
  Link2Off,
} from 'lucide-react';
import { LeaveType, OvertimeType } from '../types';

function formatErr(e: unknown): string {
  if (!e) return 'Bilinmeyen hata';
  if (typeof e === 'string') return e;
  const any = e as { message?: string; code?: string; details?: string };
  if (any.message?.toLowerCase().includes('row-level security') || any.code === '42501') {
    return 'Yetki (RLS) engeli — profiliniz aktif ve personel bağlı mı?';
  }
  if (any.message?.toLowerCase().includes('failed to fetch') || any.message?.toLowerCase().includes('network')) {
    return 'Ağ hatası — bağlantıyı kontrol edin.';
  }
  return any.message || any.details || 'İşlem başarısız';
}

type OfflineAction = { id: string; kind: 'attendance' | 'advance' | 'leave' | 'overtime' | 'receipt' | 'expense'; payload: any; createdAt: string };

export const OperatorPage: React.FC = () => {
  const {
    currentUser,
    personnel,
    approvals,
    recordAttendance,
    createAdvanceRequest,
    createLeaveRequest,
    createOvertimeRequest,
    addJobReceipt,
    addExpense,
    customers,
    cranes,
    showToast,
  } = useERP();

  // P0-A: sadece gerçek bağ — asla personnel[0]
  const myPerson = useMemo(() => {
    if (currentUser.personnelId) {
      const byProfile = personnel.find((p) => p.id === currentUser.personnelId);
      if (byProfile) return byProfile;
    }
    return personnel.find((p) => p.userId === currentUser.id) || null;
  }, [personnel, currentUser.id, currentUser.personnelId]);

  const [activeModal, setActiveModal] = useState<'none' | 'avans' | 'izin' | 'mesai' | 'makbuz' | 'masraf'>('none');
  const [busy, setBusy] = useState(false);
  const [jobSite, setJobSite] = useState('');
  const [jobStart, setJobStart] = useState('08:00');
  const [jobEnd, setJobEnd] = useState('17:00');
  const [jobDescription, setJobDescription] = useState('');
  const [jobCustomerId, setJobCustomerId] = useState('');
  const [jobCraneId, setJobCraneId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseDetail, setExpenseDetail] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState<number>(3000);
  const [advanceNote, setAdvanceNote] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('yillik');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveDays, setLeaveDays] = useState<number>(1);
  const [leaveDesc, setLeaveDesc] = useState('');
  const [overtimeDate, setOvertimeDate] = useState(new Date().toISOString().split('T')[0]);
  const [overtimeStart, setOvertimeStart] = useState('18:00');
  const [overtimeEnd, setOvertimeEnd] = useState('21:30');
  const [overtimeHours, setOvertimeHours] = useState<number>(3.5);
  const [overtimeType, setOvertimeType] = useState<OvertimeType>('hafta_ici');
  const [overtimeDesc, setOvertimeDesc] = useState('');

  const enqueueOffline = (action: Omit<OfflineAction, 'id' | 'createdAt'>) => {
    const queue: OfflineAction[] = JSON.parse(localStorage.getItem('bv_offline_queue') || '[]');
    queue.push({ ...action, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    localStorage.setItem('bv_offline_queue', JSON.stringify(queue));
    showToast('Bağlantı yok; talep cihazda kuyruğa alındı, bağlantı gelince tekrar denenecek.');
  };

  useEffect(() => {
    if (!myPerson) return;
    const queue: OfflineAction[] = JSON.parse(localStorage.getItem('bv_offline_queue') || '[]');
    if (!queue.length) return;
    let cancelled = false;
    const replay = async () => {
      const remaining: OfflineAction[] = [];
      for (const action of queue) {
        try {
          if (action.kind === 'attendance') await (recordAttendance as any)(...action.payload);
          if (action.kind === 'advance') await (createAdvanceRequest as any)(...action.payload);
          if (action.kind === 'leave') await (createLeaveRequest as any)(...action.payload);
          if (action.kind === 'overtime') await (createOvertimeRequest as any)(...action.payload);
          if (action.kind === 'receipt') await addJobReceipt(action.payload);
          if (action.kind === 'expense') await addExpense(action.payload);
        } catch { remaining.push(action); }
      }
      if (!cancelled) localStorage.setItem('bv_offline_queue', JSON.stringify(remaining));
    };
    void replay();
    return () => { cancelled = true; };
  }, [myPerson, recordAttendance, createAdvanceRequest, createLeaveRequest, createOvertimeRequest, addJobReceipt, addExpense]);

  const myApprovals = useMemo(() => {
    if (!myPerson) return [];
    return approvals.filter((a) => a.personId === myPerson.id || a.personName === myPerson.fullName);
  }, [approvals, myPerson]);

  const runSafe = async (fn: () => Promise<void>, okMsg?: string, offlineAction?: Omit<OfflineAction, 'id' | 'createdAt'>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      if (okMsg) showToast(okMsg);
    } catch (e) {
      console.error(e);
      if (offlineAction && (e as any)?.message?.toLowerCase().match(/network|fetch|bağlantı|supabase/)) enqueueOffline(offlineAction);
      showToast(`✕ ${formatErr(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleAttendance = async (status: 'geldi' | 'izinli') => {
    if (!myPerson) return;
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    await runSafe(
      () => recordAttendance(myPerson.id, status, time),
      status === 'geldi' ? '✓ Yoklama: Geldi kaydedildi' : '✓ Yoklama: İzinli kaydedildi',
      { kind: 'attendance', payload: [myPerson.id, status, time] }
    );
  };

  const handleSendAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPerson) return;
    if (!advanceAmount || advanceAmount <= 0) {
      showToast('Lütfen geçerli bir avans tutarı giriniz.');
      return;
    }
    await runSafe(async () => {
      await createAdvanceRequest(myPerson.id, advanceAmount, new Date().toISOString().split('T')[0], advanceNote);
      setActiveModal('none');
      setAdvanceNote('');
    }, undefined, { kind: 'advance', payload: [myPerson.id, advanceAmount, new Date().toISOString().split('T')[0], advanceNote] });
  };

  const handleSendLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPerson) return;
    if (!leaveStart || !leaveEnd) {
      showToast('Lütfen başlangıç ve bitiş tarihlerini seçiniz.');
      return;
    }
    await runSafe(async () => {
      await createLeaveRequest(myPerson.id, leaveType, leaveStart, leaveEnd, leaveDays, leaveDesc);
      setActiveModal('none');
      setLeaveDesc('');
    }, undefined, { kind: 'leave', payload: [myPerson.id, leaveType, leaveStart, leaveEnd, leaveDays, leaveDesc] });
  };

  const handleSendOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPerson) return;
    await runSafe(async () => {
      await createOvertimeRequest(
        myPerson.id,
        overtimeDate,
        overtimeStart,
        overtimeEnd,
        overtimeHours,
        overtimeType,
        overtimeDesc
      );
      setActiveModal('none');
      setOvertimeDesc('');
    }, undefined, { kind: 'overtime', payload: [myPerson.id, overtimeDate, overtimeStart, overtimeEnd, overtimeHours, overtimeType, overtimeDesc] });
  };

  const handleSendJobReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPerson) return;
    const customer = customers.find((c) => c.id === jobCustomerId);
    const crane = cranes.find((c) => c.id === jobCraneId);
    if (!customer || !crane || !jobSite.trim() || !jobStart || !jobEnd) {
      showToast('Makbuz için cari, şantiye, vinç ve saat aralığı gerekir.');
      return;
    }
    const [sh, sm] = jobStart.split(':').map(Number);
    const [eh, em] = jobEnd.split(':').map(Number);
    const calculatedHours = Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
    if (calculatedHours <= 0) return showToast('Bitiş saati başlangıçtan sonra olmalıdır.');
    await runSafe(async () => {
      await addJobReceipt({
        customerId: customer.id,
        customerName: customer.title,
        siteName: jobSite.trim(),
        craneCode: crane.code,
        craneId: crane.id,
        operatorId: myPerson.id,
        operatorName: myPerson.fullName,
        date: new Date().toISOString().slice(0, 10),
        startTime: jobStart,
        endTime: jobEnd,
        workingHours: calculatedHours,
        hoursWorked: calculatedHours,
        amount: 0,
        status: 'pending_approval',
        invoiced: false,
        description: jobDescription || 'Saha işi',
      });
      setJobSite('');
      setJobStart('08:00');
      setJobEnd('17:00');
      setJobDescription('');
      setActiveModal('none');
    }, '✓ İş makbuzu onaya gönderildi', { kind: 'receipt', payload: { customerId: customer.id, customerName: customer.title, siteName: jobSite.trim(), craneCode: crane.code, craneId: crane.id, operatorId: myPerson.id, operatorName: myPerson.fullName, date: new Date().toISOString().slice(0, 10), startTime: jobStart, endTime: jobEnd, workingHours: calculatedHours, hoursWorked: calculatedHours, amount: 0, status: 'pending_approval', invoiced: false, description: jobDescription || 'Saha işi' } });
  };

  const handleSendExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPerson) return;
    if (expenseAmount <= 0) {
      showToast('Geçerli bir masraf tutarı giriniz.');
      return;
    }
    await runSafe(async () => {
      await addExpense({
        category: 'masraf',
        title: 'Operatör saha masrafı',
        detail: expenseDetail || 'Saha masrafı',
        amount: expenseAmount,
        craneCode: cranes[0]?.code,
        personName: myPerson.fullName,
        stationOrSupplier: myPerson.fullName,
      });
      setExpenseAmount(0);
      setExpenseDetail('');
      setActiveModal('none');
    }, '✓ Masraf kaydı gönderildi', { kind: 'expense', payload: { category: 'masraf', title: 'Operatör saha masrafı', detail: expenseDetail || 'Saha masrafı', amount: expenseAmount, craneCode: cranes[0]?.code, personName: myPerson.fullName, stationOrSupplier: myPerson.fullName } });
  };

  if (!myPerson) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Link2Off size={28} />
          </div>
          <h1 className="text-lg font-bold text-emerald-950">Personel kartın bağlı değil</h1>
          <p className="text-sm text-emerald-800/80 leading-relaxed">
            Personel talepleri için hesabınızın bir personel kaydına bağlanması gerekir. Yönetici veya kurucu,
            Admin → üyelik / personel eşleştirmesinden sizi bağlamalı.
          </p>
          <p className="text-xs text-slate-500">
            Oturum: {currentUser.fullName} · {currentUser.email} · rol: {currentUser.role}
          </p>
        </div>
      </div>
    );
  }

  const actionBtn =
    'min-h-11 flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-emerald-100 bg-white hover:bg-emerald-50 active:scale-[0.98] transition text-center disabled:opacity-50';

  return (
    <div className="max-w-4xl mx-auto w-full space-y-5 overflow-x-hidden">
      <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-emerald-500 text-neutral-950 font-bold flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">
              {myPerson.initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-emerald-950 truncate">{myPerson.fullName}</h1>
              <p className="text-xs text-emerald-800/80 truncate">
                {myPerson.title} · Sicil {myPerson.employeeNo}
              </p>
            </div>
          </div>
          <a
            href={`/kart/${myPerson.cardSlug || myPerson.employeeNo.toLowerCase()}`}
            className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold border border-emerald-100"
          >
            Dijital kart
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <button type="button" disabled={busy} onClick={() => handleAttendance('geldi')} className={actionBtn}>
          <CheckCircle className="text-emerald-600" size={22} />
          <span className="text-xs font-bold text-emerald-950">Geldi</span>
        </button>
        <button type="button" disabled={busy} onClick={() => handleAttendance('izinli')} className={actionBtn}>
          <Calendar className="text-amber-600" size={22} />
          <span className="text-xs font-bold text-emerald-950">İzinli</span>
        </button>
        <button type="button" disabled={busy} onClick={() => setActiveModal('mesai')} className={actionBtn}>
          <Clock className="text-sky-600" size={22} />
          <span className="text-xs font-bold text-emerald-950">Mesai</span>
        </button>
        <button type="button" disabled={busy} onClick={() => setActiveModal('avans')} className={actionBtn}>
          <CreditCard className="text-violet-600" size={22} />
          <span className="text-xs font-bold text-emerald-950">Avans</span>
        </button>
        <button type="button" disabled={busy} onClick={() => setActiveModal('izin')} className={actionBtn}>
          <FileText className="text-orange-600" size={22} />
          <span className="text-xs font-bold text-emerald-950">İzin talebi</span>
        </button>
        <button type="button" disabled={busy} onClick={() => setActiveModal('makbuz')} className={actionBtn}>
          <Receipt className="text-emerald-700" size={22} />
          <span className="text-xs font-bold text-emerald-950">Makbuz</span>
        </button>
        <button type="button" disabled={busy} onClick={() => setActiveModal('masraf')} className={`${actionBtn} col-span-2 sm:col-span-1`}>
          <Fuel className="text-rose-600" size={22} />
          <span className="text-xs font-bold text-emerald-950">Masraf</span>
        </button>
      </div>

      <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-sm font-bold text-emerald-950 mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-emerald-600" />
          Bekleyen taleplerim
        </h2>
        {myApprovals.length === 0 ? (
          <p className="text-xs text-slate-500">Henüz talep yok. Avans, izin veya mesai gönderdiğinizde burada görünür.</p>
        ) : (
          <ul className="space-y-2">
            {myApprovals.slice(0, 12).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-950 truncate">{a.title}</p>
                  <p className="text-[11px] text-emerald-800/70">{a.kind} · {a.requestedDate || a.createdAt?.slice(0, 10)}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${
                    a.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : a.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {a.status === 'pending' ? 'BEKLİYOR' : a.status === 'approved' ? 'ONAY' : 'RED'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-emerald-100 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-emerald-950">
                {activeModal === 'avans' && 'Avans talebi'}
                {activeModal === 'izin' && 'İzin talebi'}
                {activeModal === 'mesai' && 'Mesai talebi'}
                {activeModal === 'makbuz' && 'İş makbuzu'}
                {activeModal === 'masraf' && 'Saha masrafı'}
              </h3>
              <button type="button" onClick={() => setActiveModal('none')} className="text-xs text-slate-500 min-h-11 px-2">
                Kapat
              </button>
            </div>

            {activeModal === 'avans' && (
              <form onSubmit={handleSendAdvance} className="space-y-3">
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Tutar (₺)</label>
                  <input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(Number(e.target.value))} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-bold text-emerald-950" />
                </div>
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Not</label>
                  <textarea value={advanceNote} onChange={(e) => setAdvanceNote(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                </div>
                <button type="submit" disabled={busy} className="w-full min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
                  Onaya gönder
                </button>
              </form>
            )}

            {activeModal === 'izin' && (
              <form onSubmit={handleSendLeave} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-emerald-900 mb-1">Tür</label>
                    <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
                      <option value="yillik">Yıllık</option>
                      <option value="mazeret">Mazeret</option>
                      <option value="rapor">Rapor</option>
                      <option value="ucretsiz">Ücretsiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-emerald-900 mb-1">Gün</label>
                    <input type="number" value={leaveDays} onChange={(e) => setLeaveDays(Number(e.target.value))} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-emerald-900 mb-1">Başlangıç</label>
                    <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-emerald-900 mb-1">Bitiş</label>
                    <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                  </div>
                </div>
                <textarea value={leaveDesc} onChange={(e) => setLeaveDesc(e.target.value)} placeholder="Açıklama" rows={2} className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                <button type="submit" disabled={busy} className="w-full min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
                  Onaya gönder
                </button>
              </form>
            )}

            {activeModal === 'mesai' && (
              <form onSubmit={handleSendOvertime} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-emerald-900 mb-1">Tarih</label>
                    <input type="date" value={overtimeDate} onChange={(e) => setOvertimeDate(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-emerald-900 mb-1">Saat</label>
                    <input type="number" step="0.5" value={overtimeHours} onChange={(e) => setOvertimeHours(Number(e.target.value))} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs text-emerald-900 mb-1">Başlangıç</label>
                    <input type="time" value={overtimeStart} onChange={(e) => setOvertimeStart(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-emerald-900 mb-1">Bitiş</label>
                    <input type="time" value={overtimeEnd} onChange={(e) => setOvertimeEnd(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                  </div>
                </div>
                <select value={overtimeType} onChange={(e) => setOvertimeType(e.target.value as OvertimeType)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
                  <option value="hafta_ici">Hafta içi (%50)</option>
                  <option value="hafta_sonu">Hafta sonu (%100)</option>
                  <option value="resmi_tatil">Resmi tatil (%100)</option>
                </select>
                <textarea value={overtimeDesc} onChange={(e) => setOvertimeDesc(e.target.value)} placeholder="İş / şantiye notu" rows={2} className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                <button type="submit" disabled={busy} className="w-full min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
                  Onaya gönder
                </button>
              </form>
            )}

            {activeModal === 'makbuz' && (
              <form onSubmit={handleSendJobReceipt} className="space-y-3">
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Çalışma alanı / şantiye *</label>
                  <input required value={jobSite} onChange={(e) => setJobSite(e.target.value)} placeholder="Şantiye" className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Cari</label>
                  <select value={jobCustomerId} onChange={(e) => setJobCustomerId(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
                    <option value="">Cari seçin *</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Vinç</label>
                  <select value={jobCraneId} onChange={(e) => setJobCraneId(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
                    <option value="">Vinç seçin *</option>
                    {cranes.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} {c.type || ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Başlangıç / bitiş saati *</label>
                  <div className="grid grid-cols-2 gap-2"><input type="time" required value={jobStart} onChange={(e) => setJobStart(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" /><input type="time" required value={jobEnd} onChange={(e) => setJobEnd(e.target.value)} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" /></div>
                </div>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="İş açıklaması" rows={2} className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                <button type="submit" disabled={busy} className="w-full min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
                  Makbuz gönder
                </button>
              </form>
            )}

            {activeModal === 'masraf' && (
              <form onSubmit={handleSendExpense} className="space-y-3">
                <div>
                  <label className="block text-xs text-emerald-900 mb-1">Tutar (₺)</label>
                  <input type="number" value={expenseAmount || ''} onChange={(e) => setExpenseAmount(Number(e.target.value))} className="w-full min-h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-bold" />
                </div>
                <textarea value={expenseDetail} onChange={(e) => setExpenseDetail(e.target.value)} placeholder="Masraf detayı (yakıt, yemek…)" rows={2} className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-sm" />
                <button type="submit" disabled={busy} className="w-full min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
                  Kaydet
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
