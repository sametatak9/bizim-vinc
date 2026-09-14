import React, { useState, useMemo } from 'react';
import { useERP } from '../lib/store';
import {
  Fuel,
  Wrench,
  ClipboardCheck,
  Droplets,
  Search,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  AlertTriangle,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  Printer,
} from 'lucide-react';
import { downloadExcelReport, downloadHtmlReport, printReport } from '../lib/reporting';

export const FinancePage: React.FC = () => {
  const { receipts, expenses, stats, addReceipt, addExpense, cranes, personnel, invoices, customers } = useERP();
  const [financeView, setFinanceView] = useState<'raporlar' | 'giderler'>('raporlar');
  const [activeTab, setActiveTab] = useState<'yakit' | 'masraf' | 'servis' | 'muayene' | 'yag_bakimi'>('masraf');

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // New expense form state
  const [expenseCategory, setExpenseCategory] = useState<'yakit' | 'masraf' | 'servis' | 'muayene' | 'yag_bakimi'>('masraf');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDetail, setExpenseDetail] = useState('');
  const [station, setStation] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [serviceDueDate, setServiceDueDate] = useState('');
  const [craneCode, setCraneCode] = useState(cranes[0]?.code || '');
  const [search, setSearch] = useState('');

  // 1. Tahsilat Yaşlandırma (Aging) Hesaplamaları
  const agingAnalysis = useMemo(() => {
    const today = new Date();
    const unpaid = invoices.filter((i) => i.status !== 'paid' && (i.status as string) !== 'tahsil_edildi');
    
    let current0_30 = 0; // 0-30 gün
    let overdue31_60 = 0; // 31-60 gün
    let overdue60Plus = 0; // 60+ gün
    const agingList: {
      invoiceNo: string;
      customerName: string;
      totalAmount: number;
      dueDate: string;
      daysDiff: number;
      category: '0_30' | '31_60' | '60_plus';
    }[] = [];

    unpaid.forEach((inv) => {
      const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.issueDate || inv.createdAt || today);
      const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(inv.totalAmount) || 0;

      let cat: '0_30' | '31_60' | '60_plus' = '0_30';
      if (diffDays > 60) {
        overdue60Plus += amount;
        cat = '60_plus';
      } else if (diffDays > 30) {
        overdue31_60 += amount;
        cat = '31_60';
      } else {
        current0_30 += amount;
        cat = '0_30';
      }

      agingList.push({
        invoiceNo: inv.invoiceNo,
        customerName: inv.customerName,
        totalAmount: amount,
        dueDate: inv.dueDate || '-',
        daysDiff: diffDays,
        category: cat,
      });
    });

    agingList.sort((a, b) => b.daysDiff - a.daysDiff);

    return { current0_30, overdue31_60, overdue60Plus, agingList };
  }, [invoices]);

  // 2. KDV & Vergi Özeti
  const vatSummary = useMemo(() => {
    const totalRevenue = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const calculatedMatrah = Math.round(totalRevenue / 1.2);
    const calculatedKdv = Math.round(totalRevenue - calculatedMatrah);
    const totalWithholding = invoices.reduce((s, i) => s + (Number(i.withholdingAmount) || 0), 0);
    const netPayableKdv = calculatedKdv - totalWithholding;

    return { totalRevenue, calculatedMatrah, calculatedKdv, totalWithholding, netPayableKdv };
  }, [invoices]);

  // 3. Vinç Bazlı Gelir-Gider & P&L
  const cranePnL = useMemo(() => {
    return cranes.map((crane) => {
      // Vinç cirosu: faturada craneId eşleşenler veya makbuzda craneCode eşleşenlerin cirosu
      const craneRevenue = invoices.reduce((sum, inv) => {
        if (inv.lines && inv.lines.length > 0) {
          const matched = inv.lines.filter((l) => l.craneId === crane.id);
          return sum + matched.reduce((s, m) => s + (m.totalAmount || (m.quantity * m.unitPrice * 1.2)), 0);
        }
        return sum;
      }, 0);

      // Yakıt gideri
      const fuelExpenses = expenses
        .filter((e) => e.craneCode === crane.code && e.category === 'yakit')
        .reduce((s, e) => s + e.amount, 0);

      // Bakım ve diğer masraflar
      const maintenanceExpenses = expenses
        .filter((e) => e.craneCode === crane.code && e.category !== 'yakit')
        .reduce((s, e) => s + e.amount, 0);

      const totalCost = fuelExpenses + maintenanceExpenses;
      const netProfit = craneRevenue - totalCost;
      const margin = craneRevenue > 0 ? Math.round((netProfit / craneRevenue) * 100) : 0;

      return {
        code: crane.code,
        name: crane.type,
        capacity: crane.capacity,
        revenue: craneRevenue,
        fuel: fuelExpenses,
        maintenance: maintenanceExpenses,
        cost: totalCost,
        netProfit,
        margin,
      };
    });
  }, [cranes, invoices, expenses]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    addExpense({
      category: expenseCategory,
      title: expenseTitle,
      detail: expenseDetail || 'Saha harcaması',
      amount: parseFloat(expenseAmount),
      craneCode,
      personName: personnel[0]?.fullName || 'Atanmamış personel',
      stationOrSupplier: station,
      meterReading: meterReading ? Number(meterReading) : undefined,
      serviceDueDate: serviceDueDate || undefined,
    });

    setIsExpenseModalOpen(false);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseDetail('');
    setMeterReading('');
    setServiceDueDate('');
  };

  const exportAgingReport = (format: 'excel' | 'html' | 'print') => {
    const columns = [
      { key: 'invoiceNo', label: 'Fatura No' },
      { key: 'customerName', label: 'Müşteri (Cari)' },
      { key: 'dueDate', label: 'Vade Tarihi' },
      { key: 'daysDiff', label: 'Gecikme (Gün)' },
      { key: 'totalAmount', label: 'Tutar' },
      { key: 'categoryLabel', label: 'Yaşlandırma Kategorisi' },
    ];
    const rows = agingAnalysis.agingList.map((item) => ({
      invoiceNo: item.invoiceNo,
      customerName: item.customerName,
      dueDate: item.dueDate,
      daysDiff: item.daysDiff > 0 ? `${item.daysDiff} gün` : 'Vadesi gelmedi',
      totalAmount: `${item.totalAmount.toLocaleString('tr-TR')} ₺`,
      categoryLabel:
        item.category === '60_plus'
          ? '60+ Gün (Yüksek Risk)'
          : item.category === '31_60'
          ? '31-60 Gün (Kritik)'
          : '0-30 Gün (Güncel)',
    }));
    const title = 'Bizim Vinç Tahsilat Yaşlandırma Raporu (Aging)';
    if (format === 'excel') downloadExcelReport('tahsilat-yaslandirma-raporu', title, columns, rows);
    else if (format === 'html') downloadHtmlReport('tahsilat-yaslandirma-raporu', title, columns, rows);
    else printReport(title, columns, rows);
  };

  const exportCranePnLReport = (format: 'excel' | 'html') => {
    const columns = [
      { key: 'code', label: 'Vinç Kodu' },
      { key: 'revenue', label: 'Ciro' },
      { key: 'fuel', label: 'Yakıt Gideri' },
      { key: 'maintenance', label: 'Bakım Gideri' },
      { key: 'cost', label: 'Toplam Gider' },
      { key: 'netProfit', label: 'Net Kâr' },
      { key: 'margin', label: 'Kâr Marjı' },
    ];
    const rows = cranePnL.map((c) => ({
      code: c.code,
      revenue: `${c.revenue.toLocaleString('tr-TR')} ₺`,
      fuel: `${c.fuel.toLocaleString('tr-TR')} ₺`,
      maintenance: `${c.maintenance.toLocaleString('tr-TR')} ₺`,
      cost: `${c.cost.toLocaleString('tr-TR')} ₺`,
      netProfit: `${c.netProfit.toLocaleString('tr-TR')} ₺`,
      margin: `%${c.margin}`,
    }));
    const title = 'Bizim Vinç — Vinç Bazlı Kârlılık & P&L Raporu';
    if (format === 'excel') downloadExcelReport('vinc-pnl-raporu', title, columns, rows);
    else downloadHtmlReport('vinc-pnl-raporu', title, columns, rows);
  };

  return (
    <main className="cmd-page space-y-4 animate-in fade-in duration-150" id="finance-page">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Finans & Muhasebe Yönetimi · Paraşüt / p@ket Standartları
          </div>
          <h1 className="text-xl font-black text-slate-800">Finansal Raporlama & Saha Masrafları</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tahsilat yaşlandırma, KDV özeti, filo P&L analizi ve periyodik saha harcamaları.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-xl p-1 border border-emerald-200 text-xs font-bold shadow-xs">
            <button
              type="button"
              onClick={() => setFinanceView('raporlar')}
              className={`px-3 py-1.5 rounded-lg transition ${
                financeView === 'raporlar'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              Ön Muhasebe & Raporlar
            </button>
            <button
              type="button"
              onClick={() => setFinanceView('giderler')}
              className={`px-3 py-1.5 rounded-lg transition ${
                financeView === 'giderler'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              Saha Giderleri & Bakım
            </button>
          </div>
        </div>
      </header>

      {/* Top summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block mb-1">Dönem Toplam Cirosu</span>
          <span className="font-mono text-2xl font-bold text-emerald-950">
            {vatSummary.totalRevenue.toLocaleString('tr-TR')} ₺
          </span>
          <span className="text-[10px] text-emerald-700 block mt-0.5">Kesilen tüm faturalar</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block mb-1">Vadesi Geçen Alacak (Aging)</span>
          <span className="font-mono text-2xl font-bold text-red-600">
            {(agingAnalysis.overdue31_60 + agingAnalysis.overdue60Plus).toLocaleString('tr-TR')} ₺
          </span>
          <span className="text-[10px] text-red-500 block mt-0.5">30+ gün gecikmiş tahsilatlar</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block mb-1">Hesaplanan KDV (%20)</span>
          <span className="font-mono text-2xl font-bold text-blue-900">
            {vatSummary.calculatedKdv.toLocaleString('tr-TR')} ₺
          </span>
          <span className="text-[10px] text-blue-700 block mt-0.5">
            Matrah: {vatSummary.calculatedMatrah.toLocaleString('tr-TR')} ₺
          </span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block mb-1">Toplam Saha Harcamaları</span>
          <span className="font-mono text-2xl font-bold text-gray-800">
            {stats.todayExpenses.toLocaleString('tr-TR')} ₺
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">Yakıt + Servis + Bakım</span>
        </div>
      </section>

      {/* VIEW: ÖN MUHASEBE & RAPORLAR */}
      {financeView === 'raporlar' && (
        <div className="space-y-4">
          {/* 1. TAHSİLAT YAŞLANDIRMA (AGING) */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-emerald-700" />
                  Tahsilat Yaşlandırma Analizi (Aging Raporu)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Açık faturaların vade aşım süreleri ve nakit akışı risk sınıflandırması.
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => exportAgingReport('excel')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportAgingReport('html')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                >
                  HTML
                </button>
                <button
                  type="button"
                  onClick={() => exportAgingReport('print')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950 text-white text-[11px] font-bold"
                >
                  <Printer size={12} className="inline mr-1" /> Yazdır
                </button>
              </div>
            </div>

            {/* Yaşlandırma Rozetleri */}
            <div className="grid grid-cols-3 gap-3 my-3">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  0 - 30 Gün (Güncel)
                </span>
                <span className="text-lg font-black font-mono text-emerald-950">
                  {agingAnalysis.current0_30.toLocaleString('tr-TR')} ₺
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  31 - 60 Gün (Kritik)
                </span>
                <span className="text-lg font-black font-mono text-amber-950">
                  {agingAnalysis.overdue31_60.toLocaleString('tr-TR')} ₺
                </span>
              </div>
              <div className="p-3 rounded-xl bg-red-50/70 border border-red-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block">
                  60+ Gün (Yüksek Risk)
                </span>
                <span className="text-lg font-black font-mono text-red-950">
                  {agingAnalysis.overdue60Plus.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>

            {/* Yaşlandırma Tablosu */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-50/50 text-[10px] font-bold uppercase text-emerald-950">
                    <th className="p-2.5">Fatura No</th>
                    <th className="p-2.5">Cari / Müşteri</th>
                    <th className="p-2.5">Vade Tarihi</th>
                    <th className="p-2.5">Gecikme</th>
                    <th className="p-2.5 text-right">Tutar</th>
                    <th className="p-2.5 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {agingAnalysis.agingList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">
                        Vadesi geçen veya bekleyen fatura bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    agingAnalysis.agingList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold">{item.invoiceNo}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{item.customerName}</td>
                        <td className="p-2.5 font-mono text-slate-600">{item.dueDate}</td>
                        <td className="p-2.5 font-mono">
                          {item.daysDiff > 0 ? (
                            <span className="text-red-600 font-bold">{item.daysDiff} gün gecikmiş</span>
                          ) : (
                            <span className="text-emerald-700">Vadesine {Math.abs(item.daysDiff)} gün var</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {item.totalAmount.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-2.5 text-center">
                          {item.category === '60_plus' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                              60+ Gün Riskli
                            </span>
                          ) : item.category === '31_60' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                              31-60 Gün
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Güncel
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. VİNÇ BAZLI GELİR-GİDER & P&L */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 size={16} className="text-emerald-700" />
                  Vinç Bazlı Gelir-Gider & P&L (Kârlılık)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Her vincin operasyonel cirosu, yakıt ve bakım maliyeti ile net katkı payı.
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => exportCranePnLReport('excel')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportCranePnLReport('html')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                >
                  HTML
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-50/50 text-[10px] font-bold uppercase text-emerald-950">
                    <th className="p-2.5">Vinç</th>
                    <th className="p-2.5 text-right">Ciro (Faturalanan)</th>
                    <th className="p-2.5 text-right">Yakıt Gideri</th>
                    <th className="p-2.5 text-right">Bakım & Diğer</th>
                    <th className="p-2.5 text-right">Toplam Gider</th>
                    <th className="p-2.5 text-right">Net Kâr / Katkı</th>
                    <th className="p-2.5 text-center">Kâr Marjı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {cranePnL.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        {c.code}
                        <span className="text-[10px] text-slate-400 block font-normal">{c.name}</span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-900">
                        {c.revenue.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        {c.fuel.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        {c.maintenance.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-800 font-semibold">
                        {c.cost.toLocaleString('tr-TR')} ₺
                      </td>
                      <td
                        className={`p-2.5 text-right font-mono font-bold ${
                          c.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {c.netProfit.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            c.margin >= 40
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.margin >= 15
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          %{c.margin}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SAHA GİDERLERİ & BAKIM */}
      {financeView === 'giderler' && (
        <div className="panel bg-white border border-emerald-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-emerald-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-wrap bg-emerald-50 p-1 rounded-lg text-xs font-semibold gap-1">
              {(
                [
                  ['masraf', 'Genel Masraf'],
                  ['yakit', 'Yakıt'],
                  ['servis', 'Servis'],
                  ['muayene', 'Muayene'],
                  ['yag_bakimi', 'Yağ Bakımı'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    activeTab === key
                      ? 'bg-white text-emerald-950 shadow-xs font-bold'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3.5 py-2 border border-emerald-200 text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Wrench size={14} /> Yeni Masraf / Bakım Fişi
              </button>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-emerald-100 flex flex-col sm:flex-row gap-2 justify-between">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Geçmiş masraf, servis veya tedarikçi ara"
                className="w-full rounded-xl border border-emerald-100 py-2 pl-9 pr-3 text-xs"
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() =>
                  downloadExcelReport(
                    `bakim-arsiv-${activeTab}`,
                    `Bizim Vinç ${activeTab} Arşivi`,
                    [
                      { key: 'title', label: 'Başlık' },
                      { key: 'supplier', label: 'Tedarikçi' },
                      { key: 'amount', label: 'Tutar' },
                      { key: 'meter', label: 'Sayaç' },
                      { key: 'date', label: 'Tarih' },
                    ],
                    expenses
                      .filter((e) => e.category === activeTab)
                      .map((e) => ({
                        title: e.title,
                        supplier: e.stationOrSupplier || '-',
                        amount: `${e.amount} ₺`,
                        meter: e.meterReading || '-',
                        date: new Date(e.createdAt).toLocaleDateString('tr-TR'),
                      }))
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold"
              >
                <FileSpreadsheet size={12} className="inline mr-1" />
                Excel
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadHtmlReport(
                    `bakim-arsiv-${activeTab}`,
                    `Bizim Vinç ${activeTab} Arşivi`,
                    [
                      { key: 'title', label: 'Başlık' },
                      { key: 'supplier', label: 'Tedarikçi' },
                      { key: 'amount', label: 'Tutar' },
                      { key: 'meter', label: 'Sayaç' },
                      { key: 'date', label: 'Tarih' },
                    ],
                    expenses
                      .filter((e) => e.category === activeTab)
                      .map((e) => ({
                        title: e.title,
                        supplier: e.stationOrSupplier || '-',
                        amount: `${e.amount} ₺`,
                        meter: e.meterReading || '-',
                        date: new Date(e.createdAt).toLocaleDateString('tr-TR'),
                      }))
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
              >
                <FileText size={12} className="inline mr-1" />
                HTML
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 text-[11px] font-bold text-emerald-950 uppercase tracking-wider border-b border-emerald-100">
                  <th className="py-3 px-4">Masraf Kalemi</th>
                  <th className="py-3 px-4">Tedarikçi / İstasyon</th>
                  <th className="py-3 px-4">Vinç / Personel</th>
                  <th className="py-3 px-4">Tutar</th>
                  <th className="py-3 px-4">Detay</th>
                  <th className="py-3 px-4">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {expenses
                  .filter(
                    (e) =>
                      e.category === activeTab &&
                      (!search ||
                        `${e.title} ${e.stationOrSupplier || ''} ${e.detail || ''}`
                          .toLocaleLowerCase('tr-TR')
                          .includes(search.toLocaleLowerCase('tr-TR')))
                  )
                  .map((e) => (
                    <tr key={e.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{e.title}</td>
                      <td className="py-3 px-4 text-emerald-900 font-medium">{e.stationOrSupplier}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {e.craneCode || '-'} · {e.personName || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm text-gray-900">
                        {e.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-3 px-4 text-gray-500">{e.detail || '-'}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                        {new Date(e.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-emerald-950 mb-4">Masraf · Servis · Muayene Kaydı</h3>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="masraf">Genel Masraf</option>
                    <option value="yakit">Yakıt</option>
                    <option value="servis">Servis Bakımı</option>
                    <option value="muayene">Muayene</option>
                    <option value="yag_bakimi">Yağ Bakımı</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tutar (TL)</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="2450"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Başlık / Açıklama</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Periyodik bakım / muayene açıklaması"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">İstasyon / Tedarikçi</label>
                  <input
                    type="text"
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                    placeholder="Servis / tedarikçi / istasyon"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vinç</label>
                  <select
                    value={craneCode}
                    onChange={(e) => setCraneCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {cranes.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Sayaç / KM / Saat</label>
                  <input
                    type="number"
                    value={meterReading}
                    onChange={(e) => setMeterReading(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Sonraki takip tarihi</label>
                  <input
                    type="date"
                    value={serviceDueDate}
                    onChange={(e) => setServiceDueDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
