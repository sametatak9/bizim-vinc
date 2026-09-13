import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { Plus, DollarSign, Fuel, Receipt as ReceiptIcon, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const { receipts, expenses, stats, addReceipt, addExpense, cranes, personnel } = useERP();
  const [activeTab, setActiveTab] = useState<'kesilen' | 'biriken' | 'yakit' | 'masraf'>('kesilen');

  // Modal states
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // New receipt form state
  const [company, setCompany] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptStatus, setReceiptStatus] = useState<'kesildi' | 'birikti'>('kesildi');
  const [craneCode, setCraneCode] = useState(cranes[0]?.code || 'V-204');
  const [site, setSite] = useState('Ataşehir Metro Şantiyesi');

  // New expense form state
  const [expenseCategory, setExpenseCategory] = useState<'yakit' | 'masraf'>('yakit');
  const [expenseTitle, setExpenseTitle] = useState('Dizel Yakıt Dolumu');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDetail, setExpenseDetail] = useState('');
  const [station, setStation] = useState('Shell Ataşehir');

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !amount) return;

    addReceipt({
      receiptNo: `MK-2026-0${Math.floor(150 + Math.random() * 800)}`,
      company,
      amount: parseFloat(amount),
      status: receiptStatus,
      craneCode,
      site,
      daysPending: receiptStatus === 'birikti' ? 1 : 0,
    });

    setIsReceiptModalOpen(false);
    setCompany('');
    setAmount('');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    addExpense({
      category: expenseCategory,
      title: expenseTitle,
      detail: expenseDetail || 'Saha harcaması',
      amount: parseFloat(expenseAmount),
      craneCode,
      personName: personnel[0]?.fullName || 'Mehmet Kaya',
      stationOrSupplier: station,
    });

    setIsExpenseModalOpen(false);
    setExpenseTitle('Dizel Yakıt Dolumu');
    setExpenseAmount('');
    setExpenseDetail('');
  };

  return (
    <main className="cmd-page" id="finance-page">
      {/* Top summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Toplam Kesilen Ciro</span>
          <span className="font-mono text-2xl font-bold text-emerald-900">
            {stats.todayRevenue.toLocaleString('tr-TR')} ₺
          </span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Bekleyen (Biriken) Alacak</span>
          <span className="font-mono text-2xl font-bold text-orange-700">
            {receipts
              .filter((r) => r.status === 'birikti')
              .reduce((sum, r) => sum + r.amount, 0)
              .toLocaleString('tr-TR')}{' '}
            ₺
          </span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Toplam Yakıt Gideri</span>
          <span className="font-mono text-2xl font-bold text-gray-800">
            {stats.todayFuel.toLocaleString('tr-TR')} ₺
          </span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Bakım & Diğer Masraflar</span>
          <span className="font-mono text-2xl font-bold text-gray-800">
            {stats.todayExpenses.toLocaleString('tr-TR')} ₺
          </span>
        </div>
      </section>

      {/* Main Panel */}
      <div className="panel bg-white border border-emerald-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-emerald-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('kesilen')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'kesilen'
                  ? 'bg-white text-emerald-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-emerald-900'
              }`}
            >
              Kesilen Makbuzlar ({receipts.filter((r) => r.status === 'kesildi').length})
            </button>
            <button
              onClick={() => setActiveTab('biriken')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'biriken'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Biriken / Geciken ({receipts.filter((r) => r.status === 'birikti').length})
            </button>
            <button
              onClick={() => setActiveTab('yakit')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'yakit'
                  ? 'bg-white text-emerald-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-emerald-900'
              }`}
            >
              Yakıt Fişleri ({expenses.filter((e) => e.category === 'yakit').length})
            </button>
            <button
              onClick={() => setActiveTab('masraf')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'masraf'
                  ? 'bg-white text-emerald-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-emerald-900'
              }`}
            >
              Masraflar ({expenses.filter((e) => e.category === 'masraf').length})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3.5 py-2 border border-emerald-200 text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Fuel size={14} /> Yeni Masraf / Yakıt
            </button>
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} /> Yeni Makbuz Kes
            </button>
          </div>
        </div>

        {/* Tables */}
        {activeTab === 'kesilen' || activeTab === 'biriken' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 text-[11px] font-bold text-emerald-950 uppercase tracking-wider border-b border-emerald-100">
                  <th className="py-3 px-4">Makbuz No</th>
                  <th className="py-3 px-4">Müşteri / Firma</th>
                  <th className="py-3 px-4">İlgili Vinç & Şantiye</th>
                  <th className="py-3 px-4">Tutar</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {receipts
                  .filter((r) => r.status === activeTab)
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {r.receiptNo}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-950">
                        {r.company}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {r.craneCode} · {r.site}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm text-gray-900">
                        {r.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            r.status === 'kesildi'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status === 'kesildi' ? (
                            <>
                              <CheckCircle2 size={12} /> Kesildi
                            </>
                          ) : (
                            <>
                              <Clock size={12} /> {r.daysPending} gündür bekliyor
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
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
                  .filter((e) => e.category === activeTab)
                  .map((e) => (
                    <tr key={e.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {e.title}
                      </td>
                      <td className="py-3 px-4 text-emerald-900 font-medium">
                        {e.stationOrSupplier}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {e.craneCode || '-'} · {e.personName || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm text-gray-900">
                        {e.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {e.detail || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                        {new Date(e.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-emerald-950 mb-4">Yeni Makbuz Kes</h3>
            <form onSubmit={handleSaveReceipt} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Müşteri / Şirket</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Yapı Kredi Genel Müd."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tutar (TL)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Durum</label>
                  <select
                    value={receiptStatus}
                    onChange={(e) => setReceiptStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="kesildi">Kesildi (Tahsil Edildi)</option>
                    <option value="birikti">Birikti (Geciken / Bekleyen)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vinç</label>
                  <select
                    value={craneCode}
                    onChange={(e) => setCraneCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {cranes.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Şantiye</label>
                  <input
                    type="text"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="Ataşehir"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
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

      {/* New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-emerald-950 mb-4">Yeni Masraf / Yakıt Ekle</h3>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="yakit">Yakıt Dolumu</option>
                    <option value="masraf">Bakım / Servis / HGS</option>
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
                  placeholder="Dizel Yakıt Dolumu"
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
                    placeholder="Shell Ataşehir"
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
