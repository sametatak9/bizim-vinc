import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { CraneModal } from '../components/CraneModal';
import { Crane } from '../types';
import {
  Plus,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Fuel,
  Receipt as ReceiptIcon,
  FileText,
  Building2,
  Calendar,
  CheckSquare,
  Users,
  TrendingUp,
  Tv,
  MonitorPlay,
  ShieldCheck,
  XCircle,
  UserRound,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate?: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { stats, receipts, expenses, cranes, jobReceipts, approvals, customers, invoices, payments } = useERP();
  const [selectedCrane, setSelectedCrane] = useState<Crane | null>(null);
  const [isCraneModalOpen, setIsCraneModalOpen] = useState(false);

  const cutReceipts = receipts.filter((r) => r.status === 'kesildi').slice(0, 4);
  const pendingReceipts = receipts.filter((r) => r.status === 'birikti').slice(0, 4);
  const fuelExpenses = expenses.filter((e) => e.category === 'yakit').slice(0, 3);
  const otherExpenses = expenses.filter((e) => e.category === 'masraf').slice(0, 3);
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  const approvedToday = approvals.filter((a) => a.status === 'approved' && (a.approvedAt || a.createdAt).slice(0, 10) === todayKey);
  const approvedThisMonth = approvals.filter((a) => a.status === 'approved' && (a.approvedAt || a.createdAt).slice(0, 7) === monthKey);
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').slice(0, 6);
  const approvalArchive = approvals.filter((a) => a.status !== 'pending').slice(0, 8);

  const unInvoicedReceipts = jobReceipts.filter((r) => r.status === 'approved' || (r.status as string) === 'onaylandi');
  const debtReminders = customers.filter((customer) => customer.balance > 0 || invoices.some((invoice) => invoice.customerId === customer.id && !['paid', 'odendi', 'cancelled'].includes(invoice.status))).slice(0, 5);
  const activePaymentPlans = payments.filter((payment) => payment.status === 'bekliyor');
  const paymentReminderDate = new Date(); paymentReminderDate.setDate(paymentReminderDate.getDate() + 2);
  const paymentReminders = activePaymentPlans.filter((payment) => new Date(`${payment.dueDate}T12:00:00`) <= paymentReminderDate).slice(0, 6);

  const handleOpenCrane = (c: Crane) => {
    setSelectedCrane(c);
    setIsCraneModalOpen(true);
  };

  const handleAddNewCrane = () => {
    setSelectedCrane(null);
    setIsCraneModalOpen(true);
  };

  return (
    <main className="space-y-6 animate-in fade-in duration-150" id="dashboard-page">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-7">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5"><img src="/branding/bizim-vinc-logo-horizontal.png" alt="BİZİM VİNÇ ERP" className="h-10 w-auto rounded-lg bg-white/95 px-2 object-contain" /><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-lime-100">Komuta merkezi</span></div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-200">Bugünün operasyon özeti</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Sahadaki gücü, tek ekrandan yönetin.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80">Filo, personel, puantaj ve yönetici kararlarını sade bir akışta takip edin. Önce onay bekleyen işleri görün, sonra operasyonu yönlendirin.</p>
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => onNavigate?.('/tv')} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-emerald-900 shadow-sm hover:bg-lime-50"><MonitorPlay size={16} /> Canlı TV</button><button type="button" onClick={handleAddNewCrane} className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-xs font-black text-emerald-950 shadow-sm hover:bg-lime-200"><Plus size={16} /> Vinç ekle</button></div>
        </div>
        <div className="relative mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2"><div className="rounded-2xl bg-white/10 border border-white/15 p-3"><span className="text-[10px] text-emerald-100">Bekleyen onay</span><b className="mt-1 block text-2xl">{stats.pendingApprovalsCount}</b></div><div className="rounded-2xl bg-white/10 border border-white/15 p-3"><span className="text-[10px] text-emerald-100">Bugün onaylanan</span><b className="mt-1 block text-2xl">{approvedToday.length}</b></div><div className="rounded-2xl bg-white/10 border border-white/15 p-3"><span className="text-[10px] text-emerald-100">Aktif vinç</span><b className="mt-1 block text-2xl">{stats.activeCranesCount}</b></div><div className="rounded-2xl bg-white/10 border border-white/15 p-3"><span className="text-[10px] text-emerald-100">Bu ay karar</span><b className="mt-1 block text-2xl">{approvedThisMonth.length}</b></div></div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Hızlı erişim</p><p className="mt-1 text-xs text-slate-500">Operasyonun en sık kullanılan ekranları</p></div><div className="flex flex-wrap gap-2">{onNavigate && <><button onClick={() => onNavigate('/faturalar')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><FileText size={14} /> Makbuz & Fatura</button><button onClick={() => onNavigate('/personel')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"><Users size={14} /> Personel</button><button onClick={() => onNavigate('/puantaj')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"><Calendar size={14} /> Aylık Puantaj</button><button onClick={() => onNavigate('/cariler')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"><Building2 size={14} /> Cari</button></>}</div></div>

      {/* 6 Top KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" aria-label="Operasyonel Özet">
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs" id="kpi-revenue">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Bugünkü Ciro</span>
          <strong className="text-xl font-mono font-black text-emerald-950 mt-1 block">
            {stats.todayRevenue.toLocaleString('tr-TR')} ₺
          </strong>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs bg-emerald-50/40" id="kpi-pending-receipts">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Biriken Makbuz</span>
          <strong className="text-xl font-mono font-black text-emerald-700 mt-1 block">
            {stats.pendingReceiptsCount} adet
          </strong>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs" id="kpi-fuel">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Bugün Yakıt</span>
          <strong className="text-xl font-mono font-black text-slate-900 mt-1 block">
            {stats.todayFuel.toLocaleString('tr-TR')} ₺
          </strong>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs" id="kpi-expense">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Bugün Masraf</span>
          <strong className="text-xl font-mono font-black text-slate-900 mt-1 block">
            {stats.todayExpenses.toLocaleString('tr-TR')} ₺
          </strong>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs" id="kpi-active-cranes">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Aktif Vinç</span>
          <strong className="text-xl font-mono font-black text-emerald-800 mt-1 block">
            {stats.activeCranesCount} / {stats.totalCranesCount}
          </strong>
        </div>
      </section>

      <section className="bg-white text-emerald-950 rounded-2xl p-5 shadow-sm border-2 border-emerald-200">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><ShieldCheck size={23} /></div><div><div className="text-[10px] uppercase tracking-[0.25em] text-emerald-600 font-bold">Yönetici karar akışı</div><h2 className="text-xl font-black mt-1">Onay Merkezi ve Günlük Akış</h2><p className="text-xs text-slate-500 mt-1">Talepler onaylanmadan yoklama, mesai, izin, avans ve iş makbuzu kesinleşmez.</p></div></div>
          <div className="grid grid-cols-3 gap-2 text-xs"><div className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-center"><b className="block text-lg">{stats.pendingApprovalsCount}</b>Bekleyen</div><div className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-center"><b className="block text-lg">{approvedToday.length}</b>Bugün</div><div className="px-3 py-2 rounded-xl bg-lime-50 text-lime-800 text-center"><b className="block text-lg">{approvedThisMonth.length}</b>Bu ay</div></div>
        </div>
        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3"><div className="flex items-center justify-between mb-2"><h3 className="text-xs font-black text-amber-900">Onay bekleyen talepler</h3><span className="text-[10px] font-bold text-amber-700">Yönetici işlemi gerekli</span></div><div className="space-y-2">{pendingApprovals.length ? pendingApprovals.map((a) => <div key={a.id} className="bg-white rounded-xl border border-amber-100 p-3 text-xs"><div className="flex items-start justify-between gap-2"><b className="text-emerald-950">{a.title}</b><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">{a.kind}</span></div><div className="mt-2 flex items-center gap-1.5 text-slate-600"><UserRound size={13} className="text-emerald-600" /> Gönderen: <strong>{a.personName}</strong></div><div className="text-[10px] text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString('tr-TR')}</div></div>) : <div className="text-xs text-amber-800 py-4 text-center">Bekleyen talep bulunmuyor.</div>}</div></div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3"><div className="flex items-center justify-between mb-2"><h3 className="text-xs font-black text-emerald-900">Onay arşivi</h3><span className="text-[10px] font-bold text-emerald-700">Gönderen • Onaylayan</span></div><div className="space-y-2">{approvalArchive.length ? approvalArchive.map((a) => <div key={a.id} className="bg-white rounded-xl border border-emerald-100 p-3 text-xs"><div className="flex items-center gap-2"><span className={`w-6 h-6 rounded-full flex items-center justify-center ${a.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{a.status === 'approved' ? <ShieldCheck size={13} /> : <XCircle size={13} />}</span><b className="text-emerald-950 truncate">{a.title}</b></div><div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-500"><span>Gönderen: <strong className="text-slate-700">{a.personName}</strong></span><span>Karar: <strong className={a.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}>{a.approvedBy || a.rejectedBy || '—'}</strong></span></div></div>) : <div className="text-xs text-slate-500 py-4 text-center">Henüz arşivlenmiş karar yok.</div>}</div></div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4"><div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4"><div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-black text-rose-950">Tahsilat hatırlatmaları</h2><p className="text-xs text-rose-800 mt-1">Borçlu cariler ve iletişim bilgileri</p></div><button onClick={() => onNavigate?.('/finans-planlama')} className="rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-bold text-white">Planlamaya git</button></div><div className="space-y-2">{debtReminders.length ? debtReminders.map((customer) => <div key={customer.id} className="rounded-xl bg-white border border-rose-100 px-3 py-2 flex items-center justify-between gap-2"><div><b className="text-xs text-emerald-950">{customer.title}</b><div className="text-[10px] text-slate-500">{customer.authorizedPerson || 'Yetkili yok'} · {customer.phone || 'Telefon yok'}</div></div><strong className="text-xs text-rose-700">{customer.balance.toLocaleString('tr-TR')} ₺</strong></div>) : <div className="text-xs text-rose-800 text-center py-3">Borçlu cari bulunmuyor.</div>}</div></div><div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-black text-amber-950">Fatura unutma uyarısı</h2><p className="text-xs text-amber-800 mt-1">Onaylanmış, fatura edilmemiş işler</p></div><button onClick={() => onNavigate?.('/finans-planlama')} className="rounded-xl bg-amber-500 px-3 py-2 text-[11px] font-bold text-white">İşlemleri gör</button></div><div className="space-y-2">{unInvoicedReceipts.slice(0, 5).map((receipt) => <div key={receipt.id} className="rounded-xl bg-white border border-amber-100 px-3 py-2 flex items-center justify-between"><div><b className="text-xs text-emerald-950">{receipt.customerName}</b><div className="text-[10px] text-slate-500">{receipt.receiptNo} · {receipt.date} · {receipt.craneCode}</div></div><strong className="text-xs text-amber-700">Fatura bekliyor</strong></div>)}</div></div></section>
      <section className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-sm"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="text-[10px] uppercase tracking-[0.2em] text-emerald-600 font-black">Aylık ödeme planı</div><h2 className="text-lg font-black text-emerald-950">Aktif kredi, leasing, DBS ve fatura ödemeleri</h2><p className="text-xs text-slate-500 mt-1">Toplam {activePaymentPlans.length} bekleyen ödeme · Vadesine iki gün kalanlar aşağıda görünür.</p></div><button onClick={() => onNavigate?.('/finans-planlama')} className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white">Ödeme planını aç</button></div><div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{paymentReminders.length ? paymentReminders.map((payment) => <div key={payment.id} className="rounded-xl border border-rose-200 bg-rose-50/60 p-3"><div className="flex justify-between gap-2"><b className="text-xs text-emerald-950">{payment.recipientName}</b><span className="text-[10px] font-black text-rose-700">{payment.category}</span></div><div className="text-[10px] text-slate-600 mt-1">{payment.dueDate} · {payment.recurring ? 'Aylık tekrar' : `Taksit ${payment.installmentNo || 1}/${payment.installmentCount || 1}`}</div><strong className="block text-sm text-rose-700 mt-1">{payment.amount.toLocaleString('tr-TR')} ₺</strong></div>) : <div className="sm:col-span-2 lg:col-span-3 text-xs text-slate-500 py-3">Önümüzdeki iki gün için ödeme hatırlatması yok.</div>}</div></section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 flex flex-col">
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1">
            <header className="p-4 border-b border-emerald-100 flex items-center justify-between gap-3 bg-emerald-50/40">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Canlı Filo Operasyonu</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    Canlı GPS
                  </span>
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Marmara & Ege Şantiye Noktaları, Araç Durumları ve Operatör Konumları
                </div>
              </div>
              <button onClick={() => onNavigate('/tv')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-lime-100 rounded-xl text-xs font-bold transition shadow-xs">Operasyon TV’ye git</button>
            </header>
            <div className="flex-1 min-h-[500px] flex items-center justify-center bg-emerald-950 text-white rounded-b-2xl p-8">
              <div className="text-center max-w-md"><div className="text-amber-400 text-xs uppercase tracking-[0.25em] font-bold">Tek canlı harita ekranı</div><div className="text-2xl font-black mt-2">Harita Operasyon TV’ye taşındı</div><p className="text-slate-400 text-sm mt-2">Saha konumları, aktif vinçler ve onay akışı için tek canlı ekranı kullanın.</p><button onClick={() => onNavigate('/tv')} className="mt-5 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-sm font-black">TV ekranını aç</button></div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden">
            <header className="p-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ReceiptIcon size={16} className="text-emerald-700" />
                <h3>Kesilen Makbuzlar</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {cutReceipts.length} kayıt
              </span>
            </header>
            <ul className="divide-y divide-emerald-50 text-xs">
              {cutReceipts.map((r) => (
                <li key={r.id} className="p-3 hover:bg-emerald-50/30 transition">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{r.company}</strong>
                    <span className="font-mono font-bold text-emerald-950">
                      {r.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{r.craneCode} · {r.site}</span>
                    <span className="font-mono text-[10px]">{r.receiptNo}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl shadow-xs overflow-hidden">
            <header className="p-3.5 border-b border-emerald-200 flex items-center justify-between bg-emerald-50/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <AlertTriangle size={16} className="text-emerald-600" />
                <h3>Biriken Makbuzlar (Geciken)</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {pendingReceipts.length} bekleyen
              </span>
            </header>
            <ul className="divide-y divide-emerald-100/60 text-xs">
              {pendingReceipts.map((r) => (
                <li key={r.id} className="p-3 hover:bg-emerald-50/30 transition">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{r.company}</strong>
                    <span className="font-mono font-bold text-emerald-700">
                      {r.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{r.craneCode} · {r.site}</span>
                    <span className="text-emerald-700 font-medium">{r.daysPending} gündür kesilmedi</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden">
            <header className="p-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Fuel size={16} className="text-emerald-700" />
                <h3>Yakıt Fişleri</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Güncel</span>
            </header>
            <ul className="divide-y divide-emerald-50 text-xs">
              {fuelExpenses.map((e) => (
                <li key={e.id} className="p-3 hover:bg-emerald-50/30 transition">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{e.stationOrSupplier}</strong>
                    <span className="font-mono font-bold text-slate-900">{e.amount.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{e.craneCode} · {e.personName}</span>
                    <span>{e.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden">
            <header className="p-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock size={16} className="text-emerald-700" />
                <h3>Vinç & Operatör Hareketleri</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Canlı Akış</span>
            </header>
            <ul className="divide-y divide-emerald-50 text-xs">
              {cranes
                .filter((c) => c.status === 'sahada' && c.operator)
                .slice(0, 3)
                .map((c) => (
                  <li key={c.id} className="p-3 hover:bg-emerald-50/30 transition">
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-950 font-bold">{c.code} — {c.operator}</strong>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">GÖREVDE</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{c.site} ({c.type})</div>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>

      <CraneModal
        crane={selectedCrane}
        isOpen={isCraneModalOpen}
        onClose={() => setIsCraneModalOpen(false)}
      />
    </main>
  );
};
