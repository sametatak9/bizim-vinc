import React, { useState, useEffect } from 'react';
import { useERP } from '../lib/store';
import { CraneMap } from '../components/CraneMap';
import { CraneModal } from '../components/CraneModal';
import { Crane } from '../types';
import {
  Plus,
  Clock,
  AlertTriangle,
  Fuel,
  Receipt as ReceiptIcon,
  FileText,
  Building2,
  Calendar,
  TrendingUp,
  MonitorPlay,
  Truck,
  MapPin,
  Activity,
  CheckCircle,
  Maximize2,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate?: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { stats, receipts, expenses, cranes, jobReceipts, approvals } = useERP();
  const [selectedCrane, setSelectedCrane] = useState<Crane | null>(null);
  const [isCraneModalOpen, setIsCraneModalOpen] = useState(false);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const cutReceipts = receipts.filter((r) => r.status === 'kesildi').slice(0, 4);
  const pendingReceipts = receipts.filter((r) => r.status === 'birikti').slice(0, 4);
  const fuelExpenses = expenses.filter((e) => e.category === 'yakit').slice(0, 3);
  const unInvoicedReceipts = jobReceipts.filter((r) => r.status === 'approved' || (r.status as string) === 'onaylandi');
  const activeCranes = cranes.filter((c) => c.status === 'sahada');
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

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
      {/* CANLI TV — sabit gömülü panel */}
      <section
        className="rounded-2xl border-2 border-emerald-700 overflow-hidden shadow-lg bg-emerald-950 text-white"
        aria-label="Canlı TV Saha Paneli"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-emerald-900/80 border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow">
              <MonitorPlay size={22} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                BİZİM VİNÇ · OPERASYON TV
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-emerald-50">
                  <Activity size={12} className="animate-pulse" /> CANLI
                </span>
              </h2>
              <p className="text-[11px] text-emerald-300">Saha kiosk özeti — filo, onaylar, ciro</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-mono font-bold tabular-nums">
                {clock.toLocaleTimeString('tr-TR')}
              </div>
              <div className="text-[10px] text-emerald-300">
                {clock.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('/tv')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-emerald-600 rounded-xl text-[11px] font-bold transition"
              title="Tam ekran TV"
            >
              <Maximize2 size={14} />
              Tam ekran
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-emerald-800">
          {[
            { label: 'Bugünkü Ciro', value: `${stats.todayRevenue.toLocaleString('tr-TR')} ₺` },
            { label: 'Sahada Aktif', value: `${stats.activeCranesCount} / ${stats.totalCranesCount}` },
            { label: 'Kesilen Makbuz', value: `${stats.cutReceiptsCount} adet` },
            { label: 'Bekleyen Onay', value: `${stats.pendingApprovalsCount} talep` },
          ].map((m) => (
            <div key={m.label} className="bg-emerald-950 p-3 sm:p-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">{m.label}</span>
              <strong className="text-lg sm:text-2xl font-mono font-black text-white mt-1 block">{m.value}</strong>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-t border-emerald-800">
          <div className="lg:col-span-2 p-3 sm:p-4 border-b lg:border-b-0 lg:border-r border-emerald-800">
            <h3 className="text-xs font-bold text-emerald-300 mb-3 flex items-center gap-1.5">
              <Truck size={14} /> Sahadaki vinçler ({activeCranes.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {activeCranes.length === 0 && (
                <p className="text-xs text-emerald-500 col-span-2 py-6 text-center">Şu an sahada vinç yok</p>
              )}
              {activeCranes.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl bg-emerald-900/60 border border-emerald-700 p-3 cursor-pointer hover:border-emerald-500 transition"
                  onClick={() => handleOpenCrane(c)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-black text-white">{c.code}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">SAHADA</span>
                  </div>
                  <div className="text-[11px] text-emerald-200 mt-1">{c.type} · {c.capacity}</div>
                  <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{c.site}</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-2 pt-2 border-t border-emerald-800">
                    Op: <strong className="text-emerald-100">{c.operator || 'Atanmadı'}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <h3 className="text-xs font-bold text-emerald-300 mb-3 flex items-center gap-1.5">
              <Clock size={14} /> Onay bekleyenler ({pendingApprovals.length})
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {pendingApprovals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-500">
                  <CheckCircle size={28} className="text-emerald-600 mb-2" />
                  <span className="text-xs font-bold text-emerald-300">Bekleyen yok</span>
                </div>
              )}
              {pendingApprovals.slice(0, 8).map((a) => (
                <div key={a.id} className="rounded-xl bg-emerald-900/60 border border-emerald-700 p-2.5">
                  <div className="text-xs font-bold text-white truncate">{a.title}</div>
                  <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">{a.personName}</div>
                  <div className="text-[9px] text-emerald-500 font-mono mt-1">
                    {new Date(a.createdAt).toLocaleTimeString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-800">Bizim Vinç ERP Komuta Merkezi</h1>
            <p className="text-xs text-slate-500">Filo operasyonu, şantiyeler, makbuz/fatura ve personel puantaj özeti</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('/faturalar')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Makbuz & Fatura</span>
                {unInvoicedReceipts.length > 0 && (
                  <span className="bg-white text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full">{unInvoicedReceipts.length}</span>
                )}
              </button>
              <button
                onClick={() => onNavigate('/cariler')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Building2 size={14} />
                <span>Cari & Şantiyeler</span>
              </button>
              <button
                onClick={() => onNavigate('/puantaj')}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Calendar size={14} />
                <span>Günlük Puantaj</span>
              </button>
            </>
          )}
          <button
            onClick={handleAddNewCrane}
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Yeni Vinç Ekle</span>
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" aria-label="Operasyonel Özet">
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Bugünkü Ciro</span>
          <strong className="text-xl font-mono font-black text-emerald-950 mt-1 block">{stats.todayRevenue.toLocaleString('tr-TR')} ₺</strong>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Kesilen Makbuz</span>
          <strong className="text-xl font-mono font-black text-slate-900 mt-1 block">{stats.cutReceiptsCount} adet</strong>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs bg-emerald-50/40">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Biriken Makbuz</span>
          <strong className="text-xl font-mono font-black text-emerald-700 mt-1 block">{stats.pendingReceiptsCount} adet</strong>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Bugün Yakıt</span>
          <strong className="text-xl font-mono font-black text-slate-900 mt-1 block">{stats.todayFuel.toLocaleString('tr-TR')} ₺</strong>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Bugün Masraf</span>
          <strong className="text-xl font-mono font-black text-slate-900 mt-1 block">{stats.todayExpenses.toLocaleString('tr-TR')} ₺</strong>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Aktif Vinç</span>
          <strong className="text-xl font-mono font-black text-emerald-800 mt-1 block">{stats.activeCranesCount} / {stats.totalCranesCount}</strong>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 flex flex-col">
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1">
            <header className="p-4 border-b border-emerald-100 flex items-center justify-between gap-3 bg-emerald-50/40">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Canlı Filo & Operasyon Haritası</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" /> Canlı GPS
                  </span>
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">Marmara & Ege Şantiye Noktaları, Araç Durumları ve Operatör Konumları</div>
              </div>
              <button onClick={handleAddNewCrane} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs">
                <Plus size={14} /> Yeni Vinç
              </button>
            </header>
            <div className="flex-1 min-h-[500px]">
              <CraneMap cranes={cranes} onSelectCrane={handleOpenCrane} />
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{cutReceipts.length} kayıt</span>
            </header>
            <ul className="divide-y divide-emerald-50 text-xs">
              {cutReceipts.map((r) => (
                <li key={r.id} className="p-3 hover:bg-emerald-50/30 transition">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{r.company}</strong>
                    <span className="font-mono font-bold text-emerald-950">{r.amount.toLocaleString('tr-TR')} ₺</span>
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{pendingReceipts.length} bekleyen</span>
            </header>
            <ul className="divide-y divide-emerald-100/60 text-xs">
              {pendingReceipts.map((r) => (
                <li key={r.id} className="p-3 hover:bg-emerald-50/30 transition">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{r.company}</strong>
                    <span className="font-mono font-bold text-emerald-700">{r.amount.toLocaleString('tr-TR')} ₺</span>
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
        </aside>
      </div>

      <CraneModal crane={selectedCrane} isOpen={isCraneModalOpen} onClose={() => setIsCraneModalOpen(false)} />
    </main>
  );
};
