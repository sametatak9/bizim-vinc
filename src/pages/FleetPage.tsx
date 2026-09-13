import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { Crane, CraneStatus } from '../types';
import { CraneModal } from '../components/CraneModal';
import { Plus, Search, Truck, MapPin, User, Wrench, AlertTriangle, History, Printer } from 'lucide-react';

export const FleetPage: React.FC = () => {
  const { cranes, updateCraneStatus, jobReceipts, expenses, approvals } = useERP();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'hepsi' | CraneStatus>('hepsi');
  const [selectedCrane, setSelectedCrane] = useState<Crane | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyCraneId, setHistoryCraneId] = useState<string | null>(null);

  const filtered = cranes.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase()) ||
      (c.operator && c.operator.toLowerCase().includes(search.toLowerCase())) ||
      (c.site && c.site.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'hepsi' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCranes = cranes.length;
  const onSiteCount = cranes.filter((c) => c.status === 'sahada').length;
  const availableCount = cranes.filter((c) => c.status === 'musait').length;
  const maintenanceCount = cranes.filter((c) => c.status === 'bakimda' || c.status === 'arizali').length;

  const handleEdit = (c: Crane) => {
    setSelectedCrane(c);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCrane(null);
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = (id: string, newStatus: CraneStatus) => {
    updateCraneStatus(id, newStatus);
  };

  const selectedHistoryCrane = cranes.find((crane) => crane.id === historyCraneId);
  const craneHistory = selectedHistoryCrane ? [
    ...jobReceipts.filter((item) => item.craneId === selectedHistoryCrane.id || item.craneCode === selectedHistoryCrane.code).map((item) => ({ date: item.date, type: 'İş Makbuzu', text: `${item.workingHours} saat · ${item.status}`, detail: item.description || item.customerName })),
    ...expenses.filter((item) => item.craneCode === selectedHistoryCrane.code).map((item) => ({ date: item.createdAt.slice(0, 10), type: item.category === 'yakit' ? 'Yakıt' : 'Masraf', text: `₺${item.amount.toLocaleString('tr-TR')}`, detail: item.detail || item.title })),
    ...approvals.filter((item) => item.relatedLabel?.includes(selectedHistoryCrane.code)).map((item) => ({ date: item.createdAt.slice(0, 10), type: 'Onay', text: `${item.title} (${item.status})`, detail: item.note || '' })),
    { date: selectedHistoryCrane.lastService, type: 'Bakım', text: 'Son periyodik bakım', detail: selectedHistoryCrane.status },
  ].sort((a, b) => b.date.localeCompare(a.date)) : [];

  return (
    <main className="cmd-page" id="fleet-page">
      {/* Top summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Toplam Filo</span>
          <span className="font-mono text-2xl font-bold text-emerald-950">{totalCranes} araç</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Sahada Çalışan</span>
          <span className="font-mono text-2xl font-bold text-emerald-700">{onSiteCount} araç</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Garajda Müsait</span>
          <span className="font-mono text-2xl font-bold text-blue-700">{availableCount} araç</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Bakım & Servis</span>
          <span className={`font-mono text-2xl font-bold ${maintenanceCount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
            {maintenanceCount} araç
          </span>
        </div>
      </section>

      {/* Main Panel */}
      <div className="panel bg-white border border-emerald-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-emerald-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-md relative">
            <Search size={16} className="text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Vinç kodu, türü, operatör veya şantiye ile ara..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              {(['hepsi', 'sahada', 'musait', 'bakimda', 'arizali'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md transition ${
                    statusFilter === st
                      ? 'bg-white text-emerald-950 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-emerald-900'
                  }`}
                >
                  {st === 'hepsi'
                    ? 'Tümü'
                    : st === 'sahada'
                    ? 'Sahada'
                    : st === 'musait'
                    ? 'Müsait'
                    : st === 'bakimda'
                    ? 'Bakımda'
                    : 'Arızalı'}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreate}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus size={14} /> Yeni Vinç
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 text-[11px] font-bold text-emerald-950 uppercase tracking-wider border-b border-emerald-100">
                <th className="py-3 px-4">Vinç Kodu</th>
                <th className="py-3 px-4">Tür & Kapasite</th>
                <th className="py-3 px-4">Atanan Operatör</th>
                <th className="py-3 px-4">Şantiye / Görev Yeri</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4">Son Bakım</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filtered.map((crane) => (
                <tr key={crane.id} className="hover:bg-emerald-50/30 transition-colors">
                  {/* Code */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center font-mono text-xs">
                        <Truck size={16} />
                      </div>
                      <span className="font-mono font-bold text-gray-900 text-sm">{crane.code}</span>
                    </div>
                  </td>

                  {/* Type & Capacity */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">{crane.type}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{crane.capacity}</div>
                  </td>

                  {/* Operator */}
                  <td className="py-3 px-4">
                    {crane.operator ? (
                      <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                        <User size={13} className="text-emerald-700" />
                        {crane.operator}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Operatör yok</span>
                    )}
                  </td>

                  {/* Site */}
                  <td className="py-3 px-4">
                    {crane.site ? (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <MapPin size={13} className="text-emerald-600" />
                        {crane.site}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Garajda</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <select
                      value={crane.status}
                      onChange={(e) => handleQuickStatusChange(crane.id, e.target.value as CraneStatus)}
                      className={`text-xs font-bold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${
                        crane.status === 'sahada'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : crane.status === 'musait'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : crane.status === 'bakimda'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-red-100 text-red-900 border-red-300'
                      }`}
                    >
                      <option value="sahada">Sahada</option>
                      <option value="musait">Müsait</option>
                      <option value="bakimda">Bakımda</option>
                      <option value="arizali">Arızalı</option>
                    </select>
                  </td>

                  {/* Last Service */}
                  <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                    {crane.lastService || '-'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleEdit(crane)}
                      className="px-3 py-1.5 border border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-bold transition"
                        >
                          Düzenle
                        </button>
                        <button onClick={() => setHistoryCraneId(crane.id)} className="ml-1 px-3 py-1.5 border border-sky-200 text-sky-800 hover:bg-sky-50 rounded-lg text-xs font-bold transition">Geçmiş</button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Arama kriterine uygun vinç bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedHistoryCrane && (
        <section className="bg-white border border-sky-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><History size={17} className="text-sky-700" /> {selectedHistoryCrane.code} Operasyon Geçmişi</h2><p className="text-xs text-slate-500 mt-1">İş, yakıt, masraf, bakım ve onay kayıtları.</p></div>
            <div className="flex gap-2"><button onClick={() => window.print()} className="p-2 rounded-lg bg-sky-50 text-sky-800 print:hidden" title="Yazdır / PDF"><Printer size={14} /></button><button onClick={() => setHistoryCraneId(null)} className="px-2 py-1 rounded-lg text-xs text-slate-500 print:hidden">Kapat</button></div>
          </div>
          {craneHistory.length === 0 ? <div className="p-8 text-center text-xs text-slate-500">Bu vinç için henüz operasyon geçmişi yok.</div> : <div className="space-y-2">{craneHistory.map((entry, index) => <div key={`${entry.type}-${entry.date}-${index}`} className="flex gap-3 border-l-2 border-sky-200 pl-4 py-2"><div className="w-20 shrink-0 text-[11px] font-mono text-slate-500">{entry.date}</div><div><div className="text-xs font-bold text-sky-800">{entry.type}</div><div className="text-sm text-slate-800">{entry.text}</div>{entry.detail && <div className="text-xs text-slate-500">{entry.detail}</div>}</div></div>)}</div>}
        </section>
      )}

      <CraneModal
        crane={selectedCrane}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};
