import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { JobReceipt, Invoice } from '../types';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Printer,
  Eye,
  Check,
  X,
  Building2,
  Calendar,
  DollarSign,
  Send,
  UserCheck,
} from 'lucide-react';

export const InvoiceReceiptPage: React.FC = () => {
  const {
    jobReceipts,
    invoices,
    customers,
    sites,
    cranes,
    currentUser,
    addJobReceipt,
    approveJobReceipt,
    rejectJobReceipt,
    createInvoiceFromReceipts,
    updateInvoiceStatus,
    stats,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'receipts' | 'invoices'>('receipts');
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'pending' | 'approved' | 'invoiced'>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'taslak' | 'gonderildi' | 'odendi'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected receipts for batch invoicing
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);

  // Modals
  const [isNewReceiptModalOpen, setIsNewReceiptModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Receipt Form State
  const [newReceiptForm, setNewReceiptForm] = useState({
    customerId: '',
    siteId: '',
    craneId: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8,
    hourlyRate: 2500,
    unitPrice: 20000,
    signedByCustomer: true,
    customerSignatureName: '',
    notes: '',
  });

  // Invoice Generation Form State
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 20,
    notes: '',
  });

  // Filtered Receipts
  const filteredReceipts = jobReceipts.filter((r) => {
    if (receiptFilter === 'pending' && r.status !== 'pending') return false;
    if (receiptFilter === 'approved' && (r.status !== 'approved' || r.invoiced)) return false;
    if (receiptFilter === 'invoiced' && !r.invoiced) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCustomer = r.customerName?.toLowerCase().includes(term);
      const matchSite = r.siteName?.toLowerCase().includes(term);
      const matchNo = r.receiptNo?.toLowerCase().includes(term);
      const matchOperator = r.operatorName?.toLowerCase().includes(term);
      if (!matchCustomer && !matchSite && !matchNo && !matchOperator) return false;
    }
    return true;
  });

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter !== 'all' && inv.status !== invoiceFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCustomer = inv.customerName?.toLowerCase().includes(term);
      const matchNo = inv.invoiceNo?.toLowerCase().includes(term);
      if (!matchCustomer && !matchNo) return false;
    }
    return true;
  });

  const handleToggleSelectReceipt = (id: string) => {
    setSelectedReceiptIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllApproved = () => {
    const approvIds = filteredReceipts
      .filter((r) => r.status === 'approved' && !r.invoiced)
      .map((r) => r.id);
    setSelectedReceiptIds(approvIds);
  };

  const handleClearSelected = () => {
    setSelectedReceiptIds([]);
  };

  // Submit New Receipt
  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === newReceiptForm.customerId);
    const site = sites.find((s) => s.id === newReceiptForm.siteId);
    const crane = cranes.find((c) => c.id === newReceiptForm.craneId);

    const amount = Number(newReceiptForm.unitPrice) || (Number(newReceiptForm.hoursWorked) * Number(newReceiptForm.hourlyRate));

    await addJobReceipt({
      customerId: newReceiptForm.customerId,
      customerName: customer?.title || customer?.name || 'Müşteri',
      siteId: newReceiptForm.siteId || undefined,
      siteName: site?.name || undefined,
      craneId: newReceiptForm.craneId || undefined,
      craneCode: crane?.code || 'V-GENEL',
      operatorId: currentUser.id,
      operatorName: currentUser.fullName,
      date: newReceiptForm.date,
      hoursWorked: Number(newReceiptForm.hoursWorked),
      hourlyRate: Number(newReceiptForm.hourlyRate),
      amount,
      status: 'pending',
      invoiced: false,
      signedByCustomer: newReceiptForm.signedByCustomer,
      customerSignatureName: newReceiptForm.customerSignatureName || undefined,
      note: newReceiptForm.notes || undefined,
    });

    setIsNewReceiptModalOpen(false);
    setNewReceiptForm({
      customerId: '',
      siteId: '',
      craneId: '',
      date: new Date().toISOString().split('T')[0],
      hoursWorked: 8,
      hourlyRate: 2500,
      unitPrice: 20000,
      signedByCustomer: true,
      customerSignatureName: '',
      notes: '',
    });
  };

  // Generate Invoice from Selected Receipts
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReceiptIds.length === 0) return;

    await createInvoiceFromReceipts(
      selectedReceiptIds,
      invoiceForm.dueDate,
      invoiceForm.notes
    );

    setIsInvoiceModalOpen(false);
    setSelectedReceiptIds([]);
    setActiveTab('invoices');
  };

  const isManagerOrAdmin = currentUser.role === 'yonetici' || currentUser.role === 'muhasebe';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <FileText size={16} />
              <span>Finansal Operasyon Hattı</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 mt-1">Makbuz → Fatura Merkezi</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Sahada imzalanan iş makbuzlarını denetleyin, onaylayın ve doğrudan resmi faturaya ve cari bakiyeye aktarın.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewReceiptModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Yeni İş Makbuzu</span>
            </button>
            {selectedReceiptIds.length > 0 && (
              <button
                onClick={() => {
                  const first = jobReceipts.find((r) => r.id === selectedReceiptIds[0]);
                  if (first) {
                    setInvoiceForm((prev) => ({ ...prev, customerId: first.customerId }));
                  }
                  setIsInvoiceModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 animate-pulse"
              >
                <ArrowRight size={16} />
                <span>Seçilenleri Faturalandır ({selectedReceiptIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-50">
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              Faturalaşmayı Bekleyen
            </span>
            <div className="text-xl font-black text-emerald-950 mt-1">
              {stats.unInvoicedReceiptsCount} Adet
            </div>
            <div className="text-xs font-mono font-bold text-emerald-700">
              {stats.unInvoicedReceiptsTotal.toLocaleString('tr-TR')} ₺
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Toplam Fatura Tutarı
            </span>
            <div className="text-xl font-black text-slate-800 mt-1">
              {invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-slate-500">{invoices.length} fatura kesildi</div>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              Bekleyen Tahsilat
            </span>
            <div className="text-xl font-black text-amber-950 mt-1">
              {stats.pendingCollectionsTotal.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-amber-700">Cari vadeli alacak</div>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
              Kayıtlı Müşteri / Cari
            </span>
            <div className="text-xl font-black text-blue-950 mt-1">
              {customers.length} Firma
            </div>
            <div className="text-xs text-blue-700">{sites.length} aktif şantiye</div>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-emerald-100 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'receipts'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <span>Saha İş Makbuzları</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
              {jobReceipts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <span>Kesilen Faturalar</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
              {invoices.length}
            </span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'receipts' ? 'Makbuz no, müşteri, vinç...' : 'Fatura no, müşteri...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-emerald-100 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* TAB 1: SAHA İŞ MAKBUZLARI */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {/* Subfilter Pills & Batch Selection Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setReceiptFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  receiptFilter === 'all'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Hepsi ({jobReceipts.length})
              </button>
              <button
                onClick={() => setReceiptFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  receiptFilter === 'pending'
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Onay Bekleyen ({jobReceipts.filter((r) => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setReceiptFilter('approved')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  receiptFilter === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Faturalandırılabilir Onaylı ({stats.unInvoicedReceiptsCount})
              </button>
              <button
                onClick={() => setReceiptFilter('invoiced')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  receiptFilter === 'invoiced'
                    ? 'bg-slate-200 text-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Faturalaşanlar ({jobReceipts.filter((r) => r.invoiced).length})
              </button>
            </div>

            {/* Batch actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllApproved}
                className="text-xs text-emerald-700 hover:underline font-semibold"
              >
                Tüm Onaylıları Seç
              </button>
              {selectedReceiptIds.length > 0 && (
                <button
                  onClick={handleClearSelected}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Seçimi Temizle ({selectedReceiptIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Receipts Table */}
          <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-100 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <span className="sr-only">Seç</span>
                    </th>
                    <th className="p-3.5">Makbuz No</th>
                    <th className="p-3.5">Tarih</th>
                    <th className="p-3.5">Müşteri & Şantiye</th>
                    <th className="p-3.5">Vinç & Operatör</th>
                    <th className="p-3.5">Süre / Birim</th>
                    <th className="p-3.5 text-right">Tutar</th>
                    <th className="p-3.5 text-center">İmza Durumu</th>
                    <th className="p-3.5 text-center">Onay Durumu</th>
                    <th className="p-3.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        Bu filtreye uygun iş makbuzu bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((receipt) => {
                      const isSelected = selectedReceiptIds.includes(receipt.id);
                      const canInvoice = receipt.status === 'approved' && !receipt.invoiced;

                      return (
                        <tr
                          key={receipt.id}
                          className={`hover:bg-emerald-50/40 transition ${
                            isSelected ? 'bg-emerald-50/70' : ''
                          }`}
                        >
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              disabled={!canInvoice}
                              checked={isSelected}
                              onChange={() => handleToggleSelectReceipt(receipt.id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30"
                            />
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-900">
                            {receipt.receiptNo}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-slate-600">
                            {receipt.date}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{receipt.customerName}</div>
                            <div className="text-[11px] text-slate-500">{receipt.siteName || 'Şantiye Belirtilmedi'}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-emerald-800">{receipt.craneCode || '—'}</div>
                            <div className="text-[11px] text-slate-500">{receipt.operatorName}</div>
                          </td>
                          <td className="p-3.5">
                            <div>{receipt.hoursWorked} saat</div>
                            <div className="text-[10px] text-slate-400">
                              {receipt.hourlyRate ? `${receipt.hourlyRate.toLocaleString('tr-TR')} ₺/saat` : 'Götürü'}
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                            {receipt.amount.toLocaleString('tr-TR')} ₺
                          </td>
                          <td className="p-3.5 text-center">
                            {receipt.signedByCustomer ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check size={12} /> İmzalı ({receipt.customerSignatureName || 'Yetkili'})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                İmzasız
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {receipt.invoiced ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                Fatura Kesildi ({receipt.invoiceNo})
                              </span>
                            ) : receipt.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Onaylandı
                              </span>
                            ) : receipt.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                Reddedildi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Onay Bekliyor
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {receipt.status === 'pending' && isManagerOrAdmin && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => approveJobReceipt(receipt.id)}
                                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                                  title="Makbuzu Onayla"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => rejectJobReceipt(receipt.id, 'Yönetici tarafından reddedildi')}
                                  className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 transition"
                                  title="Makbuzu Reddet"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                            {canInvoice && (
                              <button
                                onClick={() => {
                                  setSelectedReceiptIds([receipt.id]);
                                  setInvoiceForm((prev) => ({ ...prev, customerId: receipt.customerId }));
                                  setIsInvoiceModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                              >
                                <span>Faturalandır</span>
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FATURALAR */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Subfilter */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setInvoiceFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  invoiceFilter === 'all'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tümü ({invoices.length})
              </button>
              <button
                onClick={() => setInvoiceFilter('gonderildi')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  invoiceFilter === 'gonderildi'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Gönderildi / Bekleyen ({invoices.filter((i) => i.status === 'gonderildi').length})
              </button>
              <button
                onClick={() => setInvoiceFilter('odendi')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  invoiceFilter === 'odendi'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tahsil Edildi ({invoices.filter((i) => i.status === 'odendi').length})
              </button>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-100 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Fatura No</th>
                    <th className="p-3.5">Müşteri</th>
                    <th className="p-3.5">Tarih</th>
                    <th className="p-3.5">Vade Tarihi</th>
                    <th className="p-3.5">Makbuz Sayısı</th>
                    <th className="p-3.5 text-right">Ara Toplam</th>
                    <th className="p-3.5 text-right">KDV</th>
                    <th className="p-3.5 text-right">Genel Toplam</th>
                    <th className="p-3.5 text-center">Durum</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        Henüz oluşturulmuş fatura bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-emerald-50/30 transition">
                        <td className="p-3.5 font-mono font-bold text-emerald-900">
                          {inv.invoiceNo}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {inv.customerName}
                        </td>
                        <td className="p-3.5 text-slate-600 whitespace-nowrap">
                          {inv.issueDate}
                        </td>
                        <td className="p-3.5 text-slate-600 whitespace-nowrap">
                          {inv.dueDate}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {inv.receiptIds.length} Makbuz
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-600">
                          {inv.subtotal.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500">
                          %{inv.taxRate} ({inv.taxAmount.toLocaleString('tr-TR')} ₺)
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-950 text-sm">
                          {inv.totalAmount.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-3.5 text-center">
                          {inv.status === 'odendi' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={12} /> Tahsil Edildi
                            </span>
                          ) : inv.status === 'gonderildi' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              Gönderildi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              Taslak
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition"
                              title="Fatura Detayı & Yazdır"
                            >
                              <Eye size={14} />
                            </button>
                            {inv.status !== 'odendi' && (
                              <button
                                onClick={() => updateInvoiceStatus(inv.id, 'odendi')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1"
                              >
                                <Check size={12} /> Tahsil Et
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YENİ SAHA İŞ MAKBUZU */}
      {isNewReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">Yeni Saha İş Makbuzu Kes</h3>
              </div>
              <button
                onClick={() => setIsNewReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Müşteri / Cari Seçimi *</label>
                <select
                  required
                  value={newReceiptForm.customerId}
                  onChange={(e) => setNewReceiptForm({ ...newReceiptForm, customerId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium"
                >
                  <option value="">-- Müşteri Seçin --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.name} (Bakiye: {c.balance?.toLocaleString('tr-TR')} ₺)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Şantiye</label>
                  <select
                    value={newReceiptForm.siteId}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, siteId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="">-- Şantiye Seçin --</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vinç</label>
                  <select
                    value={newReceiptForm.craneId}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, craneId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="">-- Vinç Seçin --</option>
                    {cranes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={newReceiptForm.date}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Çalışma Saati</label>
                  <input
                    type="number"
                    min="1"
                    value={newReceiptForm.hoursWorked}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, hoursWorked: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Toplam Tutar (₺)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newReceiptForm.unitPrice}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, unitPrice: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newReceiptForm.signedByCustomer}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, signedByCustomer: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-bold text-emerald-950">Müşteri / Şantiye Şefi Tarafından İmzalandı</span>
                </label>
                {newReceiptForm.signedByCustomer && (
                  <input
                    type="text"
                    placeholder="İmzalayan Şantiye Yetkilisi Adı / Unvanı"
                    value={newReceiptForm.customerSignatureName}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, customerSignatureName: e.target.value })}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Yapılan İş / Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Kalıp montajı, çelik konstrüksiyon kaldırma..."
                  value={newReceiptForm.notes}
                  onChange={(e) => setNewReceiptForm({ ...newReceiptForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setIsNewReceiptModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Makbuzu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOPLU FATURALANDIRMA */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">Resmi Fatura Oluştur</h3>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
              <div className="text-emerald-800 font-bold">Seçilen Makbuzlar ({selectedReceiptIds.length} Adet)</div>
              <div className="text-emerald-950 font-mono font-bold text-base mt-0.5">
                Toplam:{' '}
                {jobReceipts
                  .filter((r) => selectedReceiptIds.includes(r.id))
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toLocaleString('tr-TR')}{' '}
                ₺ + KDV
              </div>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Müşteri / Cari Kart</label>
                <select
                  required
                  value={invoiceForm.customerId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-semibold"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vade Tarihi</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">KDV Oranı (%)</label>
                  <select
                    value={invoiceForm.taxRate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="20">%20 (Standart Vinç Hizmeti)</option>
                    <option value="10">%10</option>
                    <option value="0">%0 (İstisna / Tevkifat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fatura Notu / İrsaliye Bilgisi</label>
                <textarea
                  rows={2}
                  placeholder="Makbuzlara istinaden vinç kiralama hizmet bedeli..."
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Faturayı Kes ve Cariyi Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FATURA GÖRÜNTÜLE & YAZDIR */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Print Header */}
            <div className="flex items-start justify-between border-b border-emerald-100 pb-4 mb-6">
              <div>
                <div className="text-xl font-black text-emerald-950 flex items-center gap-2">
                  <span>BİZİM VİNÇ İŞLETMECİLİĞİ</span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono">
                    RESMİ FATURA
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Vergi Dairesi: Marmara VD · VN: 9876543210
                </div>
                <div className="text-xs text-slate-500">
                  Adres: Atatürk Sanayi Sitesi No: 42 Gebze / Kocaeli
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-mono font-bold text-slate-800">
                  {selectedInvoice.invoiceNo}
                </div>
                <div className="text-xs text-slate-500">
                  Tarih: {selectedInvoice.issueDate}
                </div>
                <div className="text-xs text-emerald-800 font-semibold">
                  Vade: {selectedInvoice.dueDate}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-6 text-xs">
              <div className="font-bold text-slate-800 text-sm">{selectedInvoice.customerName}</div>
              <div className="text-slate-600 mt-1">Hizmet Alan Cari Hesap</div>
              {selectedInvoice.notes && (
                <div className="mt-2 text-slate-500 italic">Not: {selectedInvoice.notes}</div>
              )}
            </div>

            {/* Invoiced Receipts breakdown */}
            <div className="border border-emerald-100 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/80 text-emerald-950 font-bold border-b border-emerald-100">
                  <tr>
                    <th className="p-3">Hizmet Açıklaması</th>
                    <th className="p-3">Makbuz No</th>
                    <th className="p-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {selectedInvoice.receiptIds.map((rid, idx) => {
                    const r = jobReceipts.find((item) => item.id === rid);
                    return (
                      <tr key={rid}>
                        <td className="p-3">
                          Vinç Kiralama Hizmeti · {r?.craneCode || 'Vinç'} ({r?.hoursWorked || 8} saat)
                        </td>
                        <td className="p-3 font-mono text-emerald-800">{r?.receiptNo || `MAK-${idx + 1}`}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          {r?.amount.toLocaleString('tr-TR') || '0'} ₺
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6 text-xs">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Ara Toplam:</span>
                  <span className="font-mono">{selectedInvoice.subtotal.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>KDV (%{selectedInvoice.taxRate}):</span>
                  <span className="font-mono">{selectedInvoice.taxAmount.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex justify-between font-bold text-base text-emerald-950 border-t border-emerald-200 pt-2">
                  <span>Genel Toplam:</span>
                  <span className="font-mono">{selectedInvoice.totalAmount.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-emerald-100 pt-4">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50"
              >
                Kapat
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Yazdır / PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
