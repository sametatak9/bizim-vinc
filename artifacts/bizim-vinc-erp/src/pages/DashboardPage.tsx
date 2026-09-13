import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { CraneMap } from '../components/CraneMap';
import { CraneModal } from '../components/CraneModal';
import { Crane } from '../types';
import { Plus, ArrowUpRight, Clock, AlertTriangle, Fuel, Receipt as ReceiptIcon } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { stats, receipts, expenses, cranes } = useERP();
  const [selectedCrane, setSelectedCrane] = useState<Crane | null>(null);
  const [isCraneModalOpen, setIsCraneModalOpen] = useState(false);

  const cutReceipts = receipts.filter((r) => r.status === 'kesildi').slice(0, 4);
  const pendingReceipts = receipts.filter((r) => r.status === 'birikti').slice(0, 4);
  const fuelExpenses = expenses.filter((e) => e.category === 'yakit').slice(0, 3);
  const otherExpenses = expenses.filter((e) => e.category === 'masraf').slice(0, 3);

  const handleOpenCrane = (c: Crane) => {
    setSelectedCrane(c);
    setIsCraneModalOpen(true);
  };

  const handleAddNewCrane = () => {
    setSelectedCrane(null);
    setIsCraneModalOpen(true);
  };

  return (
    <main className="cmd-page" id="dashboard-page">
      {/* 6 Top KPIs */}
      <section className="cmd-kpis" aria-label="Operasyonel Özet">
        <div className="cmd-kpi" id="kpi-revenue">
          <span className="cmd-kpi-label">Bugünkü Ciro</span>
          <strong>{stats.todayRevenue.toLocaleString('tr-TR')} ₺</strong>
        </div>

        <div className="cmd-kpi" id="kpi-cut-receipts">
          <span className="cmd-kpi-label">Kesilen Makbuz</span>
          <strong>{stats.cutReceiptsCount} adet</strong>
        </div>

        <div className="cmd-kpi" id="kpi-pending-receipts">
          <span className="cmd-kpi-label">Biriken Makbuz</span>
          <strong className="warn">{stats.pendingReceiptsCount} adet</strong>
        </div>

        <div className="cmd-kpi" id="kpi-fuel">
          <span className="cmd-kpi-label">Bugün Yakıt</span>
          <strong>{stats.todayFuel.toLocaleString('tr-TR')} ₺</strong>
        </div>

        <div className="cmd-kpi" id="kpi-expense">
          <span className="cmd-kpi-label">Bugün Masraf</span>
          <strong>{stats.todayExpenses.toLocaleString('tr-TR')} ₺</strong>
        </div>

        <div className="cmd-kpi" id="kpi-active-cranes">
          <span className="cmd-kpi-label">Aktif Vinç</span>
          <strong>
            {stats.activeCranesCount} / {stats.totalCranesCount}
          </strong>
        </div>
      </section>

      {/* Main Split Layout: Left Map, Right Cards */}
      <div className="cmd-split">
        {/* Left Column: Interactive Crane Map */}
        <section className="cmd-map-col">
          <div className="panel flex flex-col flex-1">
            <header className="panel-head">
              <div>
                <h2 className="panel-title flex items-center gap-2">
                  <span>Canlı Filo & Operasyon Haritası</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    Canlı GPS
                  </span>
                </h2>
                <div className="panel-subtitle">
                  Marmara & Ege Şantiye Noktaları, Araç Durumları ve Operatör Konumları
                </div>
              </div>

              <button
                onClick={handleAddNewCrane}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                <Plus size={14} /> Yeni Vinç
              </button>
            </header>

            {/* Map component */}
            <div className="flex-1 min-h-[480px]">
              <CraneMap cranes={cranes} onSelectCrane={handleOpenCrane} />
            </div>
          </div>
        </section>

        {/* Right Column: Financial & Operational Side Stream */}
        <aside className="cmd-side">
          {/* Kesilen Makbuzlar */}
          <div className="cmd-card">
            <header>
              <div className="flex items-center gap-1.5">
                <ReceiptIcon size={16} className="text-emerald-700" />
                <h3>Kesilen Makbuzlar</h3>
              </div>
              <span className="cmd-badge ok">{cutReceipts.length} kayıt</span>
            </header>
            <ul className="cmd-list">
              {cutReceipts.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center justify-between">
                    <strong>{r.company}</strong>
                    <span className="font-mono font-bold text-emerald-900 text-xs">
                      {r.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {r.craneCode} · {r.site}
                    </span>
                    <span>{r.receiptNo}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Biriken Makbuzlar (Uyarı) */}
          <div className="cmd-card">
            <header>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-orange-600" />
                <h3>Biriken Makbuzlar (Geciken)</h3>
              </div>
              <span className="cmd-badge warn">{pendingReceipts.length} bekleyen</span>
            </header>
            <ul className="cmd-list">
              {pendingReceipts.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center justify-between">
                    <strong>{r.company}</strong>
                    <span className="font-mono font-bold text-orange-700 text-xs">
                      {r.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {r.craneCode} · {r.site}
                    </span>
                    <span className="text-orange-600 font-medium">
                      {r.daysPending} gündür kesilmedi
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Yakıt Fişleri */}
          <div className="cmd-card">
            <header>
              <div className="flex items-center gap-1.5">
                <Fuel size={16} className="text-emerald-700" />
                <h3>Yakıt Fişleri</h3>
              </div>
              <span className="cmd-badge ok">Güncel</span>
            </header>
            <ul className="cmd-list">
              {fuelExpenses.map((e) => (
                <li key={e.id}>
                  <div className="flex items-center justify-between">
                    <strong>{e.stationOrSupplier}</strong>
                    <span className="font-mono font-bold text-gray-900 text-xs">
                      {e.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {e.craneCode} · {e.personName}
                    </span>
                    <span>{e.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Masraf Fişleri */}
          <div className="cmd-card">
            <header>
              <div className="flex items-center gap-1.5">
                <ArrowUpRight size={16} className="text-gray-700" />
                <h3>Masraf & Bakım Fişleri</h3>
              </div>
              <span className="cmd-badge ok">Onaylı</span>
            </header>
            <ul className="cmd-list">
              {otherExpenses.map((e) => (
                <li key={e.id}>
                  <div className="flex items-center justify-between">
                    <strong>{e.title}</strong>
                    <span className="font-mono font-bold text-gray-900 text-xs">
                      {e.amount.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {e.craneCode || 'Genel'} · {e.stationOrSupplier}
                    </span>
                    <span>{e.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Vinç ve Operatör Hareket Geçmişi */}
          <div className="cmd-card">
            <header>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-emerald-700" />
                <h3>Vinç & Operatör Hareketleri</h3>
              </div>
              <span className="cmd-badge ok">Canlı Akış</span>
            </header>
            <ul className="cmd-list">
              {cranes
                .filter((c) => c.status === 'sahada' && c.operator)
                .slice(0, 3)
                .map((c) => (
                  <li key={c.id}>
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-950">
                        {c.code} — {c.operator}
                      </strong>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-semibold">
                        GÖREVDE
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-600">
                      {c.site} ({c.type})
                    </span>
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
