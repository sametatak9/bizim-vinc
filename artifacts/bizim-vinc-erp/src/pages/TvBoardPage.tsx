import React, { useState, useEffect } from 'react';
import { useERP } from '../lib/store';
import { Truck, CheckCircle, Clock, MapPin, Activity } from 'lucide-react';
import { CraneMap } from '../components/CraneMap';

export const TvBoardPage: React.FC = () => {
  const { cranes, approvals, stats, jobReceipts } = useERP();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCranes = cranes.filter((c) => c.status === 'sahada');
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const activeWorkFor = (code: string) => jobReceipts.filter((receipt) => receipt.craneCode === code && !receipt.invoiced && (receipt.status === 'approved' || (receipt.status as string) === 'onaylandi')).sort((a, b) => `${b.date} ${b.startTime || ''}`.localeCompare(`${a.date} ${a.startTime || ''}`))[0];
  const workedHours = (receipt: ReturnType<typeof activeWorkFor>) => { if (!receipt) return 0; if (receipt.workingHours || receipt.hoursWorked) return receipt.workingHours || receipt.hoursWorked || 0; if (receipt.date !== new Date().toISOString().slice(0, 10) || !receipt.startTime) return 0; const [hour, minute] = receipt.startTime.split(':').map(Number); return Math.max(0, (time.getHours() * 60 + time.getMinutes() - (hour * 60 + minute)) / 60); };

  return (
    <main className="p-3 sm:p-6 max-w-[1800px] mx-auto min-h-screen flex flex-col gap-4 sm:gap-6 overflow-x-hidden" id="tv-board-page">
      {/* TV Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-emerald-950 text-white p-4 sm:p-6 rounded-3xl shadow-xl border border-emerald-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
            <svg aria-hidden="true" viewBox="0 0 64 64" width="48" height="48" fill="none">
              <path d="M32 56c8 0 14-2 14-2s-2-6-6-10c-2-2-4-3-8-3s-6 1-8 3c-4 4-6 10-6 10s6 2 14 2z" fill="#22C55E" />
              <path d="M30 48V18M30 18h18M48 18v4M30 28h12" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M26 48h8M28 18l-4 6h12" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="48" cy="24" r="2.4" fill="#16A34A" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">BİZİM VİNÇ · OPERASYON TV</h1>
            <p className="text-emerald-300 text-sm font-medium">Merkezi Saha Yönetim ve Filo İzleme Ekranı</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
          <div className="text-right">
              <div className="text-2xl sm:text-4xl font-mono font-bold text-white tracking-tight">
              {time.toLocaleTimeString('tr-TR')}
            </div>
            <div className="text-emerald-300 text-sm font-medium">
              {time.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900 rounded-2xl border border-emerald-700">
            <Activity className="text-emerald-400 animate-pulse" size={24} />
            <span className="text-emerald-200 text-sm font-bold">CANLI YAYIN</span>
          </div>
        </div>
      </header>

      {/* 4 TV Big Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Bugünkü Ciro</span>
          <div className="text-2xl sm:text-4xl font-mono font-black text-emerald-900">
            {stats.todayRevenue.toLocaleString('tr-TR')} ₺
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Sahada Aktif Vinç</span>
          <div className="text-2xl sm:text-4xl font-mono font-black text-emerald-700">
            {stats.activeCranesCount} / {stats.totalCranesCount}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Kesilen Makbuz</span>
          <div className="text-2xl sm:text-4xl font-mono font-black text-emerald-900">
            {stats.cutReceiptsCount} adet
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Bekleyen Onay</span>
          <div className="text-2xl sm:text-4xl font-mono font-black text-emerald-600">
            {stats.pendingApprovalsCount} talep
          </div>
        </div>
      </section>

      {/* Main TV Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1">
        <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-6 border border-emerald-100 shadow-md min-h-[360px]">
          <h2 className="text-xl font-bold text-emerald-950 mb-4 flex items-center gap-2"><MapPin className="text-emerald-700" size={24} /> Canlı Vinç Haritası</h2>
          <div className="h-[300px] sm:h-[420px]"><CraneMap cranes={cranes} /></div>
        </div>
        {/* Left 2 Cols: Active Cranes on Site */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-4 sm:p-6 border border-emerald-100 shadow-md flex flex-col">
          <h2 className="text-xl font-bold text-emerald-950 mb-4 flex items-center gap-2">
            <Truck className="text-emerald-700" size={24} />
            Sahadaki Vinçler ve Görev Noktaları
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {activeCranes.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xl font-black text-emerald-950">{c.code}</span>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold">
                      SAHADA
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-800">{c.type} · {c.capacity}</div>
                  <div className="text-sm text-emerald-900 font-semibold mt-2 flex items-center gap-1.5">
                    <MapPin size={16} className="text-emerald-700 shrink-0" />
                    {c.site}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-4 pt-3 border-t border-emerald-200/60 font-medium space-y-1"><div>Operatör: <strong className="text-gray-900">{c.operator || 'Atanmadı'}</strong></div>{activeWorkFor(c.code) ? <><div>Firma: <strong className="text-gray-900">{activeWorkFor(c.code)?.customerName}</strong></div><div>İş: <strong className="text-emerald-800">{workedHours(activeWorkFor(c.code)).toFixed(1)} sa · {activeWorkFor(c.code)?.siteName || c.site || 'Saha'}</strong></div></> : <div className="text-slate-400">Aktif iş makbuzu bağlantısı bekleniyor</div>}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Approvals & Feed */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md flex flex-col">
          <h2 className="text-xl font-bold text-emerald-950 mb-4 flex items-center gap-2">
            <Clock className="text-orange-600" size={24} />
            Onay Bekleyenler ({pendingApprovals.length})
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {pendingApprovals.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200"
              >
                <div className="font-bold text-gray-900 text-sm mb-1">{a.title}</div>
                <div className="text-xs text-emerald-900 font-semibold">{a.personName}</div>
                {a.note && <p className="text-xs text-gray-600 mt-1 italic">"{a.note}"</p>}
                <div className="text-[10px] text-gray-400 mt-2 font-mono">
                  {new Date(a.createdAt).toLocaleTimeString('tr-TR')}
                </div>
              </div>
            ))}

            {pendingApprovals.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <CheckCircle size={48} className="text-emerald-600 mb-2" />
                <span className="text-sm font-bold text-gray-700">Tüm talepler onaylandı</span>
                <span className="text-xs text-gray-400">Bekleyen işlem yok</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
