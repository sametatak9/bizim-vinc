import React, { useMemo, useState } from 'react';
import { useERP } from '../../lib/store';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Landmark,
  FileSignature,
  ListChecks,
  CheckCircle2,
} from 'lucide-react';

interface PaymentCommandCenterProps {
  onNavigate?: (path: string) => void;
}

const MONTH_NAMES_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const money = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`;

export const PaymentCommandCenter: React.FC<PaymentCommandCenterProps> = ({ onNavigate }) => {
  const {
    payments,
    paymentLists,
    collections,
    commercialPapers,
    markCollectionReceived,
    markPaymentPaid,
    updateCommercialPaperStatus,
    showToast,
  } = useERP();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
  const [tab, setTab] = useState<'odeme' | 'tahsilat' | 'cek' | 'senet'>('odeme');

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const todayKey = today.toISOString().slice(0, 10);

  // Ana havuz: source_list_id NULL olan satırlar tek doğruluk kaynağıdır — yıllık/aylık
  // KPI toplamı yalnızca bunlardan hesaplanır, ikinci workbook'un adlı listeleri (aşağıda
  // ayrıca gösterilir) çift sayıma yol açmasın diye toplamlara dahil edilmez.
  const mainPoolPayments = useMemo(() => payments.filter((p) => !p.sourceListId && p.status !== 'iptal'), [payments]);
  const yearPayments = useMemo(
    () => mainPoolPayments.filter((p) => (p.periodMonth || p.dueDate).slice(0, 4) === String(year)),
    [mainPoolPayments, year]
  );
  const monthMainPayments = useMemo(
    () => yearPayments.filter((p) => (p.periodMonth || p.dueDate).slice(0, 7) === monthKey),
    [yearPayments, monthKey]
  );
  const monthListPayments = useMemo(
    () => payments.filter((p) => p.sourceListId && p.status !== 'iptal' && (p.periodMonth || p.dueDate).slice(0, 7) === monthKey),
    [payments, monthKey]
  );
  const monthCollections = useMemo(() => collections.filter((c) => (c.dueDate || c.date || '').slice(0, 7) === monthKey), [collections, monthKey]);
  const monthCeks = useMemo(() => commercialPapers.filter((p) => p.type.includes('cek') && p.dueDate.slice(0, 7) === monthKey), [commercialPapers, monthKey]);
  const monthSenets = useMemo(() => commercialPapers.filter((p) => p.type.includes('senet') && p.dueDate.slice(0, 7) === monthKey), [commercialPapers, monthKey]);

  const monthPlanned = monthMainPayments.reduce((s, p) => s + p.amount, 0);
  const monthPaid = monthMainPayments.filter((p) => p.status === 'odendi').reduce((s, p) => s + (p.paidAmount ?? p.amount), 0);
  const monthRemaining = Math.max(0, monthPlanned - monthPaid);
  const monthOverdue = monthMainPayments.filter((p) => p.status !== 'odendi' && p.dueDate < todayKey).length;
  const monthTahsilatTotal = monthCollections.reduce((s, c) => s + c.amount, 0);
  const monthCekTotal = monthCeks.reduce((s, c) => s + c.amount, 0);
  const monthSenetTotal = monthSenets.reduce((s, c) => s + c.amount, 0);

  const yearTotal = yearPayments.reduce((s, p) => s + p.amount, 0);
  const yearPaid = yearPayments.filter((p) => p.status === 'odendi').reduce((s, p) => s + (p.paidAmount ?? p.amount), 0);

  const monthlyBreakdown = useMemo(() => {
    const map = new Map<number, number>();
    for (let m = 1; m <= 12; m++) map.set(m, 0);
    yearPayments.forEach((p) => {
      const m = Number((p.periodMonth || p.dueDate).slice(5, 7));
      if (m >= 1 && m <= 12) map.set(m, (map.get(m) || 0) + p.amount);
    });
    return map;
  }, [yearPayments]);
  const maxMonthAmount = Math.max(1, ...(Array.from(monthlyBreakdown.values()) as number[]));

  const listsThisMonth = useMemo(() => {
    const ids = new Set(monthListPayments.map((p) => p.sourceListId));
    return paymentLists.filter((l) => ids.has(l.id));
  }, [monthListPayments, paymentLists]);

  const goMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaymentPaid(id);
    } catch (err) {
      showToast(err instanceof Error ? `Hata: ${err.message}` : 'Ödeme işaretlenemedi.');
    }
  };

  const handleMarkCollected = async (id: string) => {
    try {
      await markCollectionReceived(id);
    } catch (err) {
      showToast(err instanceof Error ? `Hata: ${err.message}` : 'Tahsilat işaretlenemedi.');
    }
  };

  const handlePaperStatus = async (id: string, status: 'odendi_tahsil' | 'tahsile_verildi') => {
    try {
      await updateCommercialPaperStatus(id, status);
    } catch (err) {
      showToast(err instanceof Error ? `Hata: ${err.message}` : 'Durum güncellenemedi.');
    }
  };

  const TABS: { key: typeof tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'odeme', label: 'Ödeme', icon: <Wallet size={14} />, count: monthMainPayments.length + monthListPayments.length },
    { key: 'tahsilat', label: 'Tahsilat', icon: <TrendingUp size={14} />, count: monthCollections.length },
    { key: 'cek', label: 'Çek', icon: <Landmark size={14} />, count: monthCeks.length },
    { key: 'senet', label: 'Senet', icon: <FileSignature size={14} />, count: monthSenets.length },
  ];

  return (
    <section className="rounded-2xl border-2 border-emerald-200 bg-white p-4 sm:p-5 shadow-sm" id="yonetici-komuta-merkezi">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Yönetici Komuta Merkezi</div>
          <h2 className="text-lg font-black text-emerald-950">Aylık / Yıllık Ödeme, Tahsilat, Çek & Senet</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-1">
          <button
            onClick={() => setView('monthly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'monthly' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-100'}`}
          >
            Aylık görünüm
          </button>
          <button
            onClick={() => setView('yearly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'yearly' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-100'}`}
          >
            Yıllık özet
          </button>
        </div>
      </div>

      {/* Ay/Yıl seçici */}
      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => goMonth(-1)} className="rounded-lg border border-emerald-100 p-1.5 text-emerald-700 hover:bg-emerald-50"><ChevronLeft size={16} /></button>
        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-1.5">
          <Calendar size={14} className="text-emerald-600" />
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent text-sm font-bold text-emerald-950 outline-none">
            {MONTH_NAMES_TR.map((name, idx) => <option key={name} value={idx + 1}>{name}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent text-sm font-bold text-emerald-950 outline-none">
            {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => goMonth(1)} className="rounded-lg border border-emerald-100 p-1.5 text-emerald-700 hover:bg-emerald-50"><ChevronRight size={16} /></button>
        {onNavigate && (
          <button onClick={() => onNavigate('/finans-planlama')} className="ml-auto rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-700">
            Ödeme & Tahsilat Planlamasını Aç
          </button>
        )}
      </div>

      {view === 'yearly' ? (
        <>
          {/* Yıllık KPI şeridi */}
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <span className="text-[10px] font-black uppercase text-slate-500">{year} Yıllık Yük</span>
              <b className="mt-1 block text-lg text-emerald-900">{money(yearTotal)}</b>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Ödenen</span>
              <b className="mt-1 block text-lg text-emerald-700">{money(yearPaid)}</b>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Kalan</span>
              <b className="mt-1 block text-lg text-amber-700">{money(Math.max(0, yearTotal - yearPaid))}</b>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Kayıt sayısı</span>
              <b className="mt-1 block text-lg text-slate-900">{yearPayments.length}</b>
            </div>
          </div>

          {/* 12 ay mini bar */}
          <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-12">
            {MONTH_NAMES_TR.map((name, idx) => {
              const m = idx + 1;
              const amount = monthlyBreakdown.get(m) || 0;
              const heightPct = Math.max(6, Math.round((amount / maxMonthAmount) * 100));
              const isSelected = m === month;
              return (
                <button
                  key={name}
                  onClick={() => { setMonth(m); setView('monthly'); }}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 hover:bg-emerald-50/50'}`}
                  title={`${name}: ${money(amount)}`}
                >
                  <div className="flex h-16 w-full items-end justify-center">
                    <div className="w-3 rounded-t-sm bg-emerald-500" style={{ height: `${heightPct}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">{name.slice(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Aylık KPI şeridi */}
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Ayın Planı</span>
              <b className="mt-1 block text-lg text-emerald-900">{money(monthPlanned)}</b>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Ödenen</span>
              <b className="mt-1 block text-lg text-emerald-700">{money(monthPaid)}</b>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Kalan</span>
              <b className="mt-1 block text-lg text-amber-700">{money(monthRemaining)}</b>
            </div>
            <div className={`rounded-xl border p-3 ${monthOverdue ? 'border-rose-200 bg-rose-50' : 'border-emerald-100 bg-white'}`}>
              <span className="text-[10px] font-black uppercase text-slate-500">Vadesi Geçen</span>
              <b className={`mt-1 block text-lg ${monthOverdue ? 'text-rose-700' : 'text-emerald-700'}`}>{monthOverdue}</b>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500">
            <span>Tahsilat: <span className="text-emerald-700">{money(monthTahsilatTotal)}</span></span>
            <span>Çek: <span className="text-emerald-700">{money(monthCekTotal)}</span></span>
            <span>Senet: <span className="text-emerald-700">{money(monthSenetTotal)}</span></span>
          </div>

          {/* Sekmeler */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-b border-emerald-100 pb-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${tab === t.key ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
              >
                {t.icon} {t.label} <span className="opacity-70">({t.count})</span>
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-[420px] overflow-y-auto">
            {tab === 'odeme' && (
              <div className="space-y-3">
                {monthMainPayments.length === 0 && monthListPayments.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">Bu ay için ödeme kalemi yok.</div>
                )}
                {monthMainPayments.map((p) => (
                  <div key={p.id} className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-xs ${p.status !== 'odendi' && p.dueDate < todayKey ? 'border-rose-200 bg-rose-50/50' : 'border-emerald-100 bg-white'}`}>
                    <div className="min-w-0">
                      <b className="block truncate text-emerald-950">{p.title || p.recipientName}</b>
                      <span className="text-[10px] text-slate-500">{p.dueDate} · {p.recipientName}{p.notes ? ` · ${p.notes}` : ''}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <b className="font-mono text-emerald-900">{money(p.amount)}</b>
                      {p.status === 'odendi' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"><CheckCircle2 size={12} /> Ödendi</span>
                      ) : (
                        <button onClick={() => handleMarkPaid(p.id)} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700">Ödendi işaretle</button>
                      )}
                    </div>
                  </div>
                ))}
                {listsThisMonth.map((list) => (
                  <div key={list.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black text-amber-900">
                      <ListChecks size={14} /> {list.name} <span className="font-normal text-amber-700">(Excel listesi — ana havuzla örtüşme olabilir, muhasebeci teyidi bekliyor)</span>
                    </div>
                    <div className="space-y-1.5">
                      {monthListPayments.filter((p) => p.sourceListId === list.id).map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[11px]">
                          <span className="truncate text-slate-700">{p.recipientName}{p.notes ? ` · ${p.notes}` : ''} <span className="text-slate-400">({p.dueDate})</span></span>
                          <b className="shrink-0 font-mono text-slate-900">{money(p.amount)}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'tahsilat' && (
              <div className="space-y-2">
                {monthCollections.length === 0 && <div className="py-8 text-center text-xs text-slate-400">Bu ay için tahsilat kalemi yok.</div>}
                {monthCollections.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-white p-3 text-xs">
                    <div className="min-w-0">
                      <b className="block truncate text-emerald-950">{c.customerName}</b>
                      <span className="text-[10px] text-slate-500">{c.dueDate || c.date} · {c.paymentMethod}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <b className="font-mono text-emerald-900">{money(c.amount)}</b>
                      {c.status === 'tahsil_edildi' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"><CheckCircle2 size={12} /> Tahsil edildi</span>
                      ) : (
                        <button onClick={() => handleMarkCollected(c.id)} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700">Tahsil edildi</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(tab === 'cek' || tab === 'senet') && (
              <div className="space-y-2">
                {(tab === 'cek' ? monthCeks : monthSenets).length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">Bu ay için {tab === 'cek' ? 'çek' : 'senet'} kalemi yok.</div>
                )}
                {(tab === 'cek' ? monthCeks : monthSenets).map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-white p-3 text-xs">
                    <div className="min-w-0">
                      <b className="block truncate text-emerald-950">{paper.type.startsWith('alinan') ? paper.debtor : paper.beneficiary}</b>
                      <span className="text-[10px] text-slate-500">{paper.dueDate} · {paper.documentNo} · {paper.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <b className="font-mono text-emerald-900">{money(paper.amount)}</b>
                      {paper.status === 'odendi_tahsil' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"><CheckCircle2 size={12} /> Kapandı</span>
                      ) : paper.type.startsWith('alinan') ? (
                        <button onClick={() => handlePaperStatus(paper.id, 'tahsile_verildi')} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700">Tahsile ver</button>
                      ) : (
                        <button onClick={() => handlePaperStatus(paper.id, 'odendi_tahsil')} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700">Ödendi işaretle</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {monthOverdue > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-800">
              <AlertTriangle size={14} /> {monthOverdue} ödeme kalemi vadesini geçti — Ödeme & Tahsilat Planlaması'ndan hatırlatma gönderin.
            </div>
          )}
        </>
      )}
    </section>
  );
};
