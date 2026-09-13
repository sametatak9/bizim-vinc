import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { CraneMap } from '../components/CraneMap';
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
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate?: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { stats, receipts, expenses, cranes, jobReceipts } = useERP();
  const [selectedCrane, setSelectedCrane] = useState<Crane | null>(null);
  const [isCraneModalOpen, setIsCraneModalOpen] = useState(false);

  const cutReceipts = receipts.filter((r) => r.status === 'kesildi').slice(0, 4);
  const pendingReceipts = receipts.filter((r) => r.status === 'birikti').slice(0, 4);
  const fuelExpenses = expenses.filter((e) => e.category === 'yakit').slice(0, 3);
  const otherExpenses = expenses.filter((e) => e.category === 'masraf').slice(0, 3);

  const unInvoicedReceipts = jobReceipts.filter((r) => r.status === 'approved' || (r.status as string) === 'onaylandi');

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
      {/* Action Shortcut Bar */}
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
                  <span className="bg-white text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full">
                    {unInvoicedReceipts.length}
                  </span>
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

      {/* 6 Top KPIs in crisp light cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" aria-label="Operasyonel Özet">
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs" id="kpi-revenue">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Bugünkü Ciro</span>
          <strong className="text-xl font-mono font-black text-emerald-950 mt-1 block">
            {stats.todayRevenue.toLocaleString('tr-TR')} ₺
          </strong>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs" id="kpi-cut-receipts">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Kesilen Makbuz</span>
          <strong className="text-xl font-mono font-black text-slate-900 mt-1 block">
            {stats.cutReceiptsCount} adet
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

      {/* Main Split Layout: Left Map, Right Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Crane Map */}
        <section className="lg:col-span-8 flex flex-col">
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1">
            <header className="p-4 border-b border-emerald-100 flex items-center justify-between gap-3 bg-emerald-50/40">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Canlı Filo & Operasyon Haritası</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    Canlı GPS
                  </span>
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Marmara & Ege Şantiye Noktaları, Araç Durumları ve Operatör Konumları
                </div>
              </div>

              <button
                onClick={handleAddNewCrane}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Plus size={14} /> Yeni Vinç
              </button>
            </header>

            {/* Map component */}
            <div className="flex-1 min-h-[500px]">
              <CraneMap cranes={cranes} onSelectCrane={handleOpenCrane} />
            </div>
          </div>
        </section>

        {/* Right Column: Financial & Operational Side Stream */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Kesilen Makbuzlar */}
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
                    <span>
                      {r.craneCode} · {r.site}
                    </span>
                    <span className="font-mono text-[10px]">{r.receiptNo}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Biriken Makbuzlar (Uyarı) */}
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
                    <span>
                      {r.craneCode} · {r.site}
                    </span>
                    <span className="text-emerald-700 font-medium">
                      {r.daysPending} gündür kesilmedi
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Yakıt Fişleri */}
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden">
            <header className="p-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Fuel size={16} className="text-emerald-700" />
                <h3>Yakıt Fişleri</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Güncel
              </span>
            </header>
            <ul className="divide-y divide-emerald-50 text-xs">
              {fuelExpenses.map((e) => (
                <li key={e.id} className="p-3 hover:bg-emerald-50/30 transition">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{e.stationOrSupplier}</strong>
                    <span className="font-mono font-bold text-slate-900">
                      {e.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      {e.craneCode} · {e.personName}
                    </span>
                    <span>{e.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Vinç ve Operatör Hareket Geçmişi */}
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xs overflow-hidden">
            <header className="p-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock size={16} className="text-emerald-700" />
                <h3>Vinç & Operatör Hareketleri</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Canlı Akış
              </span>
            </header>
            <ul className="divide-y divide-emerald-50 text-xs">
              {cranes
                .filter((c) => c.status === 'sahada' && c.operator)
                .slice(0, 3)
                .map((c) => (
                  <li key={c.id} className="p-3 hover:bg-emerald-50/30 transition">
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-950 font-bold">
                        {c.code} — {c.operator}
                      </strong>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">
                        GÖREVDE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {c.site} ({c.type})
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Crane Edit/View Modal */}
      <CraneModal
        crane={selectedCrane}
        isOpen={isCraneModalOpen}
        onClose={() => setIsCraneModalOpen(false)}
      />
    </main>
  );
};
